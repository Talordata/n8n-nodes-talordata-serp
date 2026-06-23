import {
  buildGeneratedActionParams,
  buildImageSearchParams,
  buildNewsSearchParams,
  buildRawRequestParams,
  buildWebSearchParams,
  buildSerpRequestOptions,
  normalizeParamsJsonInput,
  toFormUrlEncoded
} from '../nodes/TalordataSerp/request'
import { SERP_ACTIONS_BY_TOOL_NAME } from '../nodes/TalordataSerp/generated/serp-actions'

describe('request helpers', () => {
  it('builds Google web search params', () => {
    expect(buildWebSearchParams({
      query: 'coffee',
      engine: 'google',
      country: 'us',
      language: 'en',
      limit: 10,
      noCache: false
    })).toEqual({
      engine: 'google',
      q: 'coffee',
      gl: 'us',
      hl: 'en',
      num: 10,
      no_cache: false,
      json: 2
    })
  })

  it('builds Bing image params with Bing-specific locale fields', () => {
    expect(buildImageSearchParams({
      query: 'coffee',
      engine: 'bing_images',
      country: 'us',
      language: 'en',
      market: 'en-us',
      limit: 10,
      noCache: true
    })).toEqual({
      engine: 'bing_images',
      q: 'coffee',
      cc: 'us',
      setlang: 'en',
      mkt: 'en-us',
      count: 10,
      no_cache: true,
      json: 2
    })
  })

  it('builds news params', () => {
    expect(buildNewsSearchParams({
      query: 'AI search trends',
      engine: 'google_news',
      country: 'us',
      language: 'en',
      limit: 5,
      noCache: false
    })).toMatchObject({
      engine: 'google_news',
      q: 'AI search trends',
      gl: 'us',
      hl: 'en',
      num: 5,
      json: 2
    })
  })

  it('merges raw JSON params without letting JSON override engine or q', () => {
    expect(buildRawRequestParams({
      engine: 'google',
      query: 'coffee',
      paramsJson: '{"engine":"bing","q":"tea","gl":"us","num":3}'
    })).toEqual({
      engine: 'google',
      q: 'coffee',
      gl: 'us',
      num: 3,
      json: 2
    })
  })

  it('normalizes raw JSON from either n8n string or object input', () => {
    expect(normalizeParamsJsonInput('{"gl":"us","num":5}')).toBe('{"gl":"us","num":5}')
    expect(normalizeParamsJsonInput({ gl: 'us', num: 5 })).toBe('{"gl":"us","num":5}')
    expect(normalizeParamsJsonInput(undefined)).toBe('{}')
  })

  it('serializes form-urlencoded params and drops empty values', () => {
    expect(toFormUrlEncoded({
      engine: 'google',
      q: 'coffee beans',
      empty: '',
      no_cache: false,
      json: 2
    })).toBe('engine=google&q=coffee+beans&no_cache=false&json=2')
  })

  it('builds SERP HTTP request options with n8n platform Origin header', () => {
    expect(buildSerpRequestOptions({
      endpoint: 'https://serpapi.talordata.net/serp/v1/request',
      params: {
        engine: 'google',
        q: 'coffee',
        json: 2
      }
    })).toMatchObject({
      method: 'POST',
      url: 'https://serpapi.talordata.net/serp/v1/request',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'n8n'
      },
      body: 'engine=google&q=coffee&json=2',
      json: true,
      timeout: 60000
    })
  })

  it('builds generated action params with a non-q query field', () => {
    expect(buildGeneratedActionParams({
      action: SERP_ACTIONS_BY_TOOL_NAME.google_lens_search,
      values: {
        google_lens_search__url: 'https://example.com/image.png'
      },
      paramsJson: '{}'
    })).toEqual({
      engine: 'google_lens',
      url: 'https://example.com/image.png',
      json: 2
    })
  })

  it('builds generated yandex params with text query field', () => {
    expect(buildGeneratedActionParams({
      action: SERP_ACTIONS_BY_TOOL_NAME.yandex_search,
      values: {
        yandex_search__text: 'coffee',
        yandex_search__lang: 'en'
      },
      paramsJson: '{}'
    })).toMatchObject({
      engine: 'yandex',
      text: 'coffee',
      lang: 'en',
      json: 2
    })
  })

  it('merges generated action paramsJson without allowing engine override', () => {
    expect(buildGeneratedActionParams({
      action: SERP_ACTIONS_BY_TOOL_NAME.google_search,
      values: {
        google_search__q: 'coffee',
        google_search__num: 10
      },
      paramsJson: '{"engine":"bing","num":3,"gl":"us"}'
    })).toMatchObject({
      engine: 'google',
      q: 'coffee',
      num: 3,
      gl: 'us',
      json: 2
    })
  })

  it('adds Google UULE from location when uule is empty', () => {
    const params = buildGeneratedActionParams({
      action: SERP_ACTIONS_BY_TOOL_NAME.google_search,
      values: {
        google_search__q: 'coffee',
        google_search__location: 'United States'
      },
      paramsJson: '{}'
    })

    expect(params.engine).toBe('google')
    expect(params.location).toBe('United States')
    expect(String(params.uule)).toMatch(/^w\+CAIQICI/)
  })

  it('throws when a generated action query field is empty', () => {
    expect(() => buildGeneratedActionParams({
      action: SERP_ACTIONS_BY_TOOL_NAME.google_play_product_search,
      values: {
        google_play_product_search__product_id: ''
      },
      paramsJson: '{}'
    })).toThrow('product_id is required')
  })
})
