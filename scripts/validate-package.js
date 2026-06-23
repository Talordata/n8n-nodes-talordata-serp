const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

const pkg = readJson('package.json')

assert(pkg.name === 'n8n-nodes-talordata-serp', 'package name must be n8n-nodes-talordata-serp')
assert(pkg.main === 'dist/index.js', 'package main must point to dist/index.js')
assert(exists(pkg.main), `missing package main: ${pkg.main}`)
assert(Array.isArray(pkg.keywords) && pkg.keywords.includes('n8n-community-node-package'), 'missing n8n community node keyword')
assert(pkg.n8n && pkg.n8n.n8nNodesApiVersion === 1, 'missing n8n metadata')
assert(Array.isArray(pkg.files) && pkg.files.includes('dist'), 'package files must include dist')
assert(!pkg.files.includes('nodes'), 'package files should not publish TypeScript source nodes')

for (const credentialPath of pkg.n8n.credentials || []) {
  assert(exists(credentialPath), `missing compiled credential: ${credentialPath}`)
}

for (const nodePath of pkg.n8n.nodes || []) {
  assert(exists(nodePath), `missing compiled node: ${nodePath}`)
}

const requiredSources = [
  'credentials/TalordataSerpApi.credentials.ts',
  'nodes/TalordataSerp/TalordataSerp.node.ts',
  'nodes/TalordataSerp/generated/serp-actions.ts',
  'nodes/TalordataSerp/request.ts',
  'nodes/TalordataSerp/response.ts',
  'nodes/TalordataSerp/icon.png',
  'scripts/generate-from-dify-serp.js',
  'README.md'
]

for (const sourcePath of requiredSources) {
  assert(exists(sourcePath), `missing source file: ${sourcePath}`)
}

const credentialSource = fs.readFileSync(path.join(root, 'credentials/TalordataSerpApi.credentials.ts'), 'utf8')
assert(credentialSource.includes('https://serpapi.talordata.net/serp/v1/request'), 'credential must default to public SERP endpoint')
assert(credentialSource.includes('Authorization: \'=Bearer {{$credentials.apiKey}}\''), 'credential must authenticate with Bearer API key')

const nodeSource = fs.readFileSync(path.join(root, 'nodes/TalordataSerp/TalordataSerp.node.ts'), 'utf8')
assert(nodeSource.includes("icon: 'file:icon.png'"), 'node must use the PNG icon')
assert(nodeSource.includes("Origin: 'n8n'") || fs.readFileSync(path.join(root, 'nodes/TalordataSerp/request.ts'), 'utf8').includes("Origin: 'n8n'"), 'SERP requests must include Origin: n8n')
assert(exists('dist/nodes/TalordataSerp/icon.png'), 'missing compiled node icon: dist/nodes/TalordataSerp/icon.png')
assert(exists('dist/nodes/TalordataSerp/generated/serp-actions.js'), 'missing compiled generated actions')

const generatedSource = fs.readFileSync(path.join(root, 'nodes/TalordataSerp/generated/serp-actions.ts'), 'utf8')
assert(generatedSource.includes('google_lens_search'), 'generated actions must include google_lens_search')
assert(generatedSource.includes('yandex_search'), 'generated actions must include yandex_search')
assert(generatedSource.includes('SERP_ACTIONS_BY_TOOL_NAME'), 'generated actions must export lookup map')

const generatedModule = require(path.join(root, 'dist/nodes/TalordataSerp/generated/serp-actions.js'))
assert(Array.isArray(generatedModule.SERP_ACTIONS), 'compiled generated actions must export SERP_ACTIONS')
assert(generatedModule.SERP_ACTIONS.length === 34, 'compiled generated actions must include 34 actions')

const generatedPropertyNames = generatedModule.SERP_ACTIONS.flatMap((action) =>
  action.parameters.map((parameter) => parameter.propertyName)
)
assert(
  new Set(generatedPropertyNames).size === generatedPropertyNames.length,
  'generated n8n property names must be unique'
)

const allText = requiredSources
  .filter((filePath) => filePath.endsWith('.ts') || filePath.endsWith('.md'))
  .map((filePath) => fs.readFileSync(path.join(root, filePath), 'utf8'))
  .join('\n')

assert(!/dashboard login JWT/i.test(allText) || /Do not use a Talordata dashboard login JWT/.test(allText), 'JWT mention must only be a warning')
assert(!/talor-pay-package-view.*serp\/v1\/request/i.test(allText), 'node must not route execution through talor-pay-package-view')

console.log('n8n package structure validation passed')
