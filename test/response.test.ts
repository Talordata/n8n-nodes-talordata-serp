import { normalizeSerpResponse } from '../nodes/TalordataSerp/response'

describe('response helpers', () => {
  it('wraps raw SERP payload with request metadata', () => {
    const result = normalizeSerpResponse({
      params: {
        engine: 'google',
        q: 'coffee',
        json: 2
      },
      payload: {
        search_metadata: {
          status: 'Success'
        },
        organic_results: [
          {
            title: 'Coffee'
          }
        ]
      }
    })

    expect(result).toEqual({
      engine: 'google',
      query: 'coffee',
      raw: {
        search_metadata: {
          status: 'Success'
        },
        organic_results: [
          {
            title: 'Coffee'
          }
        ]
      }
    })
  })

  it('unwraps successful Talordata envelope payload', () => {
    const result = normalizeSerpResponse({
      params: {
        engine: 'google',
        q: 'coffee',
        json: 2
      },
      payload: {
        code: 200,
        data: {
          task_id: 'task_123',
          result: {
            organic_results: [
              {
                title: 'Coffee'
              }
            ]
          }
        }
      }
    })

    expect(result).toEqual({
      engine: 'google',
      query: 'coffee',
      raw: {
        organic_results: [
          {
            title: 'Coffee'
          }
        ]
      },
      taskId: 'task_123'
    })
  })

  it('throws on Talordata business error shape', () => {
    expect(() => normalizeSerpResponse({
      params: {
        engine: 'google',
        q: 'coffee',
        json: 2
      },
      payload: {
        code: 401,
        data: 'API key authentication failed'
      }
    })).toThrow('API key authentication failed')
  })

  it('uses url as query metadata for Google Lens responses', () => {
    const result = normalizeSerpResponse({
      params: {
        engine: 'google_lens',
        url: 'https://example.com/image.png',
        json: 2
      },
      payload: {
        visual_matches: []
      }
    })

    expect(result).toMatchObject({
      engine: 'google_lens',
      query: 'https://example.com/image.png'
    })
  })

  it('uses product_id as query metadata for Google Play product responses', () => {
    const result = normalizeSerpResponse({
      params: {
        engine: 'google_play_product',
        product_id: 'com.example.app',
        json: 2
      },
      payload: {
        title: 'Example App'
      }
    })

    expect(result).toMatchObject({
      engine: 'google_play_product',
      query: 'com.example.app'
    })
  })
})
