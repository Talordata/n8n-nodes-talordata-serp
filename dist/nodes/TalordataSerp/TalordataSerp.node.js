"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TalordataSerp = void 0;
const request_1 = require("./request");
const serp_actions_1 = require("./generated/serp-actions");
const response_1 = require("./response");
class TalordataSerp {
    constructor() {
        this.description = {
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
                        ...serp_actions_1.SERP_ACTION_OPTIONS,
                        { name: 'Raw SERP Request', value: 'rawRequest' }
                    ],
                    default: 'google_search'
                },
                ...serp_actions_1.SERP_ACTION_PROPERTIES,
                {
                    displayName: 'Raw Action',
                    name: 'rawAction',
                    type: 'options',
                    options: serp_actions_1.SERP_ACTION_OPTIONS,
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
                                ...serp_actions_1.SERP_ACTION_OPTIONS.map((option) => option.value),
                                'rawRequest'
                            ]
                        }
                    },
                    description: 'Additional SERP parameters as a JSON object. engine is controlled by the node.'
                }
            ]
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
            const operation = this.getNodeParameter('operation', itemIndex);
            const credentials = await this.getCredentials('talordataSerpApi', itemIndex);
            const endpoint = String(credentials.endpoint || '').trim();
            const params = buildParamsForOperation.call(this, operation, itemIndex);
            const options = (0, request_1.buildSerpRequestOptions)({ endpoint, params });
            const payload = await this.helpers.httpRequestWithAuthentication.call(this, 'talordataSerpApi', options);
            returnData.push({
                json: (0, response_1.normalizeSerpResponse)({ params, payload }),
                pairedItem: {
                    item: itemIndex
                }
            });
        }
        return [returnData];
    }
}
exports.TalordataSerp = TalordataSerp;
function buildParamsForOperation(operation, itemIndex) {
    if (operation === 'rawRequest') {
        const rawActionName = this.getNodeParameter('rawAction', itemIndex);
        const action = serp_actions_1.SERP_ACTIONS_BY_TOOL_NAME[rawActionName];
        if (!action) {
            throw new Error(`Unsupported raw action: ${rawActionName}`);
        }
        const queryParameter = action.parameters.find((parameter) => parameter.key === action.queryField);
        if (!queryParameter) {
            throw new Error(`${action.queryField} is not configured for ${action.toolName}`);
        }
        return (0, request_1.buildGeneratedActionParams)({
            action,
            values: {
                [queryParameter.propertyName]: this.getNodeParameter('rawQuery', itemIndex)
            },
            paramsJson: (0, request_1.normalizeParamsJsonInput)(this.getNodeParameter('paramsJson', itemIndex, {}))
        });
    }
    const action = serp_actions_1.SERP_ACTIONS_BY_TOOL_NAME[operation];
    if (!action) {
        throw new Error(`Unsupported operation: ${operation}`);
    }
    const values = {};
    for (const parameter of action.parameters) {
        values[parameter.propertyName] = this.getNodeParameter(parameter.propertyName, itemIndex, '');
    }
    return (0, request_1.buildGeneratedActionParams)({
        action,
        values,
        paramsJson: (0, request_1.normalizeParamsJsonInput)(this.getNodeParameter('paramsJson', itemIndex, {}))
    });
}
