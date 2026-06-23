const fs = require('fs')
const path = require('path')
const YAML = require('yaml')

const root = path.resolve(__dirname, '..')
const difyRoot = path.resolve(root, '..', '..', 'dify-plugins', 'talordata-serp')
const providerPath = path.join(difyRoot, 'provider', 'talordata_serp.yaml')
const registryPath = path.join(difyRoot, 'utils', 'serp_action_registry.py')
const generatedDir = path.join(root, 'nodes', 'TalordataSerp', 'generated')
const generatedPath = path.join(generatedDir, 'serp-actions.ts')

const TYPE_MAP = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  select: 'options'
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8')) || {}
}

function parseRegistry() {
  const source = fs.readFileSync(registryPath, 'utf8')
  const actions = []
  const stringValue = String.raw`"([^"\\]*(?:\\.[^"\\]*)*)"`
  const actionPattern = new RegExp(
    String.raw`SerpAction\(\s*` +
      stringValue + String.raw`\s*,\s*` +
      stringValue + String.raw`\s*,\s*` +
      stringValue + String.raw`\s*,\s*` +
      stringValue + String.raw`\s*,\s*` +
      stringValue + String.raw`\s*,\s*` +
      stringValue + String.raw`\s*,?\s*\)`,
    'g'
  )
  let match

  while ((match = actionPattern.exec(source))) {
    const [, toolName, engine, label, queryField, resultType, actionSource] = match
    actions.push({
      toolName,
      engine,
      label,
      queryField,
      resultType,
      source: actionSource
    })
  }

  assert(actions.length === 34, `expected 34 Dify actions, found ${actions.length}`)
  return actions
}

function textFromLabel(label, fallback) {
  if (!label || typeof label !== 'object') return fallback
  return String(label.en_US || label.zh_Hans || fallback)
}

function descriptionFromParameter(parameter) {
  const human = parameter.human_description
  if (human && typeof human === 'object') {
    return String(human.en_US || human.zh_Hans || '')
  }
  return ''
}

function optionName(option) {
  const label = option && option.label
  if (label && typeof label === 'object') {
    return String(label.en_US || label.zh_Hans || option.value || '')
  }
  return String(option && option.value ? option.value : '')
}

function generatedParameter(action, parameter) {
  const key = String(parameter.name || '')
  assert(key, `${action.toolName} has a parameter without name`)

  const n8nType = TYPE_MAP[String(parameter.type || 'string')] || 'string'
  const hasDefault = Object.prototype.hasOwnProperty.call(parameter, 'default')
  const property = {
    displayName: textFromLabel(parameter.label, key.replace(/_/g, ' ')),
    name: `${action.toolName}__${key}`,
    type: n8nType,
    required: Boolean(parameter.required),
    displayOptions: {
      show: {
        operation: [action.toolName]
      }
    }
  }

  if (hasDefault) {
    property.default = parameter.default
  } else if (n8nType === 'boolean') {
    property.default = false
  } else if (n8nType === 'number') {
    property.default = null
  } else if (n8nType !== 'number') {
    property.default = ''
  }

  const description = descriptionFromParameter(parameter)
  if (description) {
    property.description = description
  }

  if (n8nType === 'options') {
    property.options = Array.isArray(parameter.options)
      ? parameter.options.map((option) => ({
        name: optionName(option),
        value: option.value === null || typeof option.value === 'undefined' ? '' : String(option.value)
      }))
      : []
    if (!property.options.length) {
      property.type = 'string'
      if (!Object.prototype.hasOwnProperty.call(property, 'default')) {
        property.default = ''
      }
    }
  }

  if (n8nType === 'number') {
    property.typeOptions = {}
    if (typeof parameter.min === 'number') property.typeOptions.minValue = parameter.min
    if (typeof parameter.max === 'number') property.typeOptions.maxValue = parameter.max
    if (!Object.keys(property.typeOptions).length) delete property.typeOptions
  }

  return {
    property,
    metadata: {
      key,
      propertyName: property.name,
      type: property.type === 'options' ? 'options' : property.type,
      required: Boolean(parameter.required)
    }
  }
}

function loadToolConfig(action) {
  const toolPath = path.join(difyRoot, 'tools', `${action.toolName}.yaml`)
  assert(fs.existsSync(toolPath), `missing Dify tool YAML: ${toolPath}`)
  return readYaml(toolPath)
}

function buildGeneratedModel() {
  const provider = readYaml(providerPath)
  const providerTools = (provider.tools || [])
    .filter((toolPath) => toolPath !== 'tools/raw_serp_request.yaml')
    .map((toolPath) => path.basename(toolPath, '.yaml'))

  const actions = parseRegistry()
  assert(
    JSON.stringify(actions.map((action) => action.toolName)) === JSON.stringify(providerTools),
    'Dify provider tool order does not match serp_action_registry.py'
  )

  const allProperties = []
  const actionModels = actions.map((action) => {
    const toolConfig = loadToolConfig(action)
    const parameters = []

    for (const parameter of toolConfig.parameters || []) {
      const generated = generatedParameter(action, parameter)
      allProperties.push(generated.property)
      parameters.push(generated.metadata)
    }

    return {
      ...action,
      parameters
    }
  })

  const propertyNames = allProperties.map((property) => property.name)
  assert(new Set(propertyNames).size === propertyNames.length, 'generated n8n property names must be unique')

  return {
    actions: actionModels,
    properties: allProperties
  }
}

function stableTs(value) {
  return JSON.stringify(value, null, 2)
}

function writeGeneratedFile() {
  const model = buildGeneratedModel()
  const options = model.actions.map((action) => ({
    name: action.label,
    value: action.toolName
  }))
  const byToolName = Object.fromEntries(model.actions.map((action) => [action.toolName, action]))

  const content = `import type { INodeProperties } from 'n8n-workflow'

export interface GeneratedSerpParameter {
  key: string
  propertyName: string
  type: 'string' | 'number' | 'boolean' | 'options' | 'json'
  required: boolean
}

export interface GeneratedSerpAction {
  toolName: string
  engine: string
  label: string
  queryField: string
  resultType: 'web' | 'image' | 'raw'
  source: string
  parameters: GeneratedSerpParameter[]
}

export const SERP_ACTIONS: GeneratedSerpAction[] = ${stableTs(model.actions)}

export const SERP_ACTION_OPTIONS: Array<{ name: string; value: string }> = ${stableTs(options)}

export const SERP_ACTION_PROPERTIES: INodeProperties[] = ${stableTs(model.properties)}

export const SERP_ACTIONS_BY_TOOL_NAME: Record<string, GeneratedSerpAction> = ${stableTs(byToolName)}
`

  fs.mkdirSync(generatedDir, { recursive: true })
  fs.writeFileSync(generatedPath, content, 'utf8')
  console.log(`generated ${path.relative(root, generatedPath)} from Dify SERP metadata`)
}

writeGeneratedFile()
