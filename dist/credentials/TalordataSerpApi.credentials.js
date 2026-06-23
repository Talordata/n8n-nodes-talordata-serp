"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TalordataSerpApi = void 0;
class TalordataSerpApi {
    constructor() {
        this.name = 'talordataSerpApi';
        this.displayName = 'Talordata SERP API';
        this.documentationUrl = 'https://serpapi.talordata.net';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: {
                    password: true
                },
                default: '',
                required: true,
                description: 'Talordata SERP API Key beginning with sk_. Do not use a dashboard JWT.'
            },
            {
                displayName: 'Endpoint',
                name: 'endpoint',
                type: 'string',
                default: 'https://serpapi.talordata.net/serp/v1/request',
                required: true,
                description: 'SERP execution endpoint. Change only for internal development environments.'
            }
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials.apiKey}}'
                }
            }
        };
        this.test = {
            request: {
                method: 'POST',
                url: '={{$credentials.endpoint}}',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json'
                },
                body: 'engine=google&q=coffee&json=2'
            }
        };
    }
}
exports.TalordataSerpApi = TalordataSerpApi;
