import { TalordataSerpApi } from '../credentials/TalordataSerpApi.credentials'

describe('TalordataSerpApi credential', () => {
  it('stores API key and default SERP endpoint', () => {
    const credential = new TalordataSerpApi()

    expect(credential.name).toBe('talordataSerpApi')
    expect(credential.displayName).toBe('Talordata SERP API')
    expect(credential.properties.find((item) => item.name === 'apiKey')).toBeTruthy()
    expect(credential.properties.find((item) => item.name === 'endpoint')?.default)
      .toBe('https://serpapi.talordata.net/serp/v1/request')
    expect(credential.authenticate.properties.headers).toEqual({
      Authorization: '=Bearer {{$credentials.apiKey}}'
    })
  })
})
