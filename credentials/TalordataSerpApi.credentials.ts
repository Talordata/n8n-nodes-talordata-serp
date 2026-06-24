import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties
} from 'n8n-workflow'

export class TalordataSerpApi implements ICredentialType {
  name = 'talordataSerpApi'

  displayName = 'Talordata SERP API'

  documentationUrl = 'https://serpapi.talordata.net'

  properties: INodeProperties[] = [
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
  ]

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}'
      }
    }
  }

  test: ICredentialTestRequest = {
    request: {
      method: 'POST',
      url: '={{$credentials.endpoint}}',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        Origin: 'n8n'
      },
      body: 'engine=google&q=coffee&json=2'
    }
  }
}
