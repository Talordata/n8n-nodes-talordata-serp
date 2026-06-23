import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription
} from 'n8n-workflow'

import {
  buildSerpRequestOptions,
  buildGeneratedActionParams,
  normalizeParamsJsonInput
} from './request'
import {
  SERP_ACTION_OPTIONS,
  SERP_ACTION_PROPERTIES,
  SERP_ACTIONS_BY_TOOL_NAME
} from './generated/serp-actions'
import { normalizeSerpResponse } from './response'

export class TalordataSerp implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Talordata SERP',
    name: 'talordataSerp',
    icon: 'file:icon.png',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Search with Talordata SERP API',
    defaults: {
      name: 'Talordata SERP'
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'talordataSerpApi',
        required: true
      }
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          ...SERP_ACTION_OPTIONS,
          { name: 'Raw SERP Request', value: 'rawRequest' }
        ],
        default: 'google_search'
      },
      ...SERP_ACTION_PROPERTIES,
      {
        displayName: 'Raw Action',
        name: 'rawAction',
        type: 'options',
        options: SERP_ACTION_OPTIONS,
        default: 'google_search',
        displayOptions: {
          show: {
            operation: ['rawRequest']
          }
        },
        description: 'Select the generated SERP action whose engine and query field should be used.'
      },
      {
        displayName: 'Raw Query',
        name: 'rawQuery',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['rawRequest']
          }
        }
      },
      {
        displayName: 'Extra Parameters JSON',
        name: 'paramsJson',
        type: 'json',
        default: '{}',
        displayOptions: {
          show: {
            operation: [
              ...SERP_ACTION_OPTIONS.map((option) => option.value),
              'rawRequest'
            ]
          }
        },
        description: 'Additional SERP parameters as a JSON object. engine is controlled by the node.'
      }
    ]
  }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData()
    const returnData: INodeExecutionData[] = []

    for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
      const operation = this.getNodeParameter('operation', itemIndex) as string
      const credentials = await this.getCredentials('talordataSerpApi', itemIndex)
      const endpoint = String(credentials.endpoint || '').trim()

      const params = buildParamsForOperation.call(this, operation, itemIndex)
      const options = buildSerpRequestOptions({ endpoint, params })

      const payload = await this.helpers.httpRequestWithAuthentication.call(
        this,
        'talordataSerpApi',
        options
      )

      returnData.push({
        json: normalizeSerpResponse({ params, payload }) as IDataObject,
        pairedItem: {
          item: itemIndex
        }
      })
    }

    return [returnData]
  }
}

function buildParamsForOperation(this: IExecuteFunctions, operation: string, itemIndex: number) {
  if (operation === 'rawRequest') {
    const rawActionName = this.getNodeParameter('rawAction', itemIndex) as string
    const action = SERP_ACTIONS_BY_TOOL_NAME[rawActionName]
    if (!action) {
      throw new Error(`Unsupported raw action: ${rawActionName}`)
    }

    const queryParameter = action.parameters.find((parameter) => parameter.key === action.queryField)
    if (!queryParameter) {
      throw new Error(`${action.queryField} is not configured for ${action.toolName}`)
    }

    return buildGeneratedActionParams({
      action,
      values: {
        [queryParameter.propertyName]: this.getNodeParameter('rawQuery', itemIndex) as string
      },
      paramsJson: normalizeParamsJsonInput(
        this.getNodeParameter('paramsJson', itemIndex, {}) as string | Record<string, unknown> | undefined
      )
    })
  }

  const action = SERP_ACTIONS_BY_TOOL_NAME[operation]
  if (!action) {
    throw new Error(`Unsupported operation: ${operation}`)
  }

  const values: Record<string, unknown> = {}
  for (const parameter of action.parameters) {
    values[parameter.propertyName] = this.getNodeParameter(parameter.propertyName, itemIndex, '')
  }

  return buildGeneratedActionParams({
    action,
    values,
    paramsJson: normalizeParamsJsonInput(
      this.getNodeParameter('paramsJson', itemIndex, {}) as string | Record<string, unknown> | undefined
    )
  })
}
