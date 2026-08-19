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
      },
      results: [],
      parseFormat: 'structured',
      parseStatus: 'empty',
      parseError: ''
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
      taskId: 'task_123',
      results: [],
      parseFormat: 'structured',
      parseStatus: 'empty',
      parseError: ''
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

  it.each([
    {
      json: 1,
      expectedFormat: 'structured',
      payload: {
        code: 0,
        data: {
          organic: [{ position: 1, title: 'Mode 1', link: 'https://one.example/page', description: 'One' }]
        }
      }
    },
    {
      json: 2,
      expectedFormat: 'json',
      payload: {
        code: 0,
        data: {
          json: JSON.stringify({
            organic: [{ position: 2, title: 'Mode 2', link: 'https://two.example/page', description: 'Two' }]
          })
        }
      }
    },
    {
      json: 3,
      expectedFormat: 'html',
      payload: {
        code: 0,
        data: '<!doctype html><html><body><div class="g"><a href="https://three.example/page"><h3>Mode 3</h3></a><div class="VwiC3b">Three</div></div></body></html>'
      }
    },
    {
      json: 6,
      expectedFormat: 'markdown',
      payload: {
        code: 0,
        data: '# Google Search\n\n### Organic Results\n\n#### Result 1\n\n- position: 1\n- title: Mode 6\n- link: https://six.example/page\n- snippet: Six'
      }
    },
    {
      json: 7,
      expectedFormat: 'markdown+html',
      payload: {
        code: 0,
        data: {
          markdown: '### Organic Results\n\n- position: 1\n- title: Mode 7\n- link: https://seven.example/page',
          html: '<html><body><div class="g"><a href="https://seven.example/page"><h3>Mode 7</h3></a><div class="VwiC3b">Seven</div></div></body></html>'
        }
      }
    }
  ])('normalizes Google json=$json into canonical results', ({ json, expectedFormat, payload }) => {
    const result = normalizeSerpResponse({
      params: { engine: 'google', q: 'format test', json },
      payload
    })

    expect(result).toMatchObject({
      parseFormat: expectedFormat,
      parseStatus: 'parsed',
      parseError: '',
      results: [{
        position: expect.any(Number),
        title: `Mode ${json}`,
        link: `https://${json === 1 ? 'one' : json === 2 ? 'two' : json === 3 ? 'three' : json === 6 ? 'six' : 'seven'}.example/page`,
        snippet: json === 7 ? 'Seven' : expect.any(String)
      }]
    })
  })

  it.each([
    'error, Collection failed',
    'md data retrieval failed',
    'JSON fetch failed: cos object not found'
  ])('preserves explicit format failure: %s', (message) => {
    const result = normalizeSerpResponse({
      params: { engine: 'google', q: 'format test', json: 7 },
      payload: { code: 0, data: message }
    })

    expect(result).toMatchObject({
      results: [],
      parseFormat: 'unknown',
      parseStatus: 'failed',
      parseError: message
    })
  })

  it('uses the visible source origin when Google returns opaque goto links', () => {
    const markdown = [
      '# Google Search: talordata serp api',
      '',
      '### Organic',
      '',
      '### 1.TalorData SERP API(/goto?url=opaque-token)',
      '- source: Peerlist',
      '- /goto?url=opaque-token',
      '- TalorData provides structured search result data.',
      '- redirect_link: https://www.google.com/url?url=opaque-token',
      '- https://peerlist.io› priest10739 › project › talordata-ser...'
    ].join('\n')
    const html = [
      '<html><body><div class="g">',
      '<a href="/goto?url=opaque-token"><h3>TalorData SERP API</h3></a>',
      '<div class="VwiC3b">TalorData provides structured search result data.</div>',
      '<cite>https://peerlist.io</cite>',
      '</div></body></html>'
    ].join('')

    const result = normalizeSerpResponse({
      params: { engine: 'google', q: 'talordata serp api', json: 7 },
      payload: { code: 0, data: { markdown, html } }
    })

    expect(result).toMatchObject({
      parseFormat: 'markdown+html',
      parseStatus: 'parsed',
      parseError: '',
      results: [{
        position: 1,
        title: 'TalorData SERP API',
        link: 'https://peerlist.io',
        snippet: 'TalorData provides structured search result data.',
        source: 'Peerlist'
      }]
    })
  })
})
