import {
  SERP_ACTIONS,
  SERP_ACTIONS_BY_TOOL_NAME,
  SERP_ACTION_OPTIONS,
  SERP_ACTION_PROPERTIES
} from '../nodes/TalordataSerp/generated/serp-actions'
import { TalordataSerp } from '../nodes/TalordataSerp/TalordataSerp.node'

describe('generated SERP actions', () => {
  it('contains every Dify explicit SERP action', () => {
    expect(SERP_ACTIONS).toHaveLength(34)
    expect(SERP_ACTION_OPTIONS).toHaveLength(34)
    expect(SERP_ACTIONS.map((action) => action.toolName)).toEqual([
      'google_search',
      'google_ai_mode_search',
      'google_finance_search',
      'google_finance_markets_search',
      'google_flights_search',
      'google_hotels_search',
      'google_image_search',
      'google_jobs_search',
      'google_lens_search',
      'google_local_search',
      'google_maps_search',
      'google_news_search',
      'google_patents_search',
      'google_patents_details_search',
      'google_play_search',
      'google_play_books_search',
      'google_play_games_search',
      'google_play_movies_search',
      'google_play_product_search',
      'google_scholar_search',
      'google_scholar_author_search',
      'google_scholar_cite_search',
      'google_shopping_search',
      'google_trends_search',
      'google_videos_search',
      'google_web_search',
      'bing_search',
      'bing_image_search',
      'bing_maps_search',
      'bing_news_search',
      'bing_shopping_search',
      'bing_videos_search',
      'yandex_search',
      'duckduckgo_search'
    ])
  })

  it('preserves non-q query fields from the Dify registry', () => {
    expect(SERP_ACTIONS_BY_TOOL_NAME.google_lens_search.queryField).toBe('url')
    expect(SERP_ACTIONS_BY_TOOL_NAME.yandex_search.queryField).toBe('text')
    expect(SERP_ACTIONS_BY_TOOL_NAME.google_finance_markets_search.queryField).toBe('trend')
    expect(SERP_ACTIONS_BY_TOOL_NAME.google_patents_details_search.queryField).toBe('patent_id')
    expect(SERP_ACTIONS_BY_TOOL_NAME.google_play_product_search.queryField).toBe('product_id')
    expect(SERP_ACTIONS_BY_TOOL_NAME.google_scholar_author_search.queryField).toBe('author_id')
  })

  it('generates unique n8n UI property names while preserving SERP keys', () => {
    const propertyNames = SERP_ACTIONS.flatMap((action) =>
      action.parameters.map((parameter) => parameter.propertyName)
    )
    expect(new Set(propertyNames).size).toBe(propertyNames.length)

    const googleQuery = SERP_ACTIONS_BY_TOOL_NAME.google_search.parameters.find(
      (parameter) => parameter.key === 'q'
    )
    expect(googleQuery).toMatchObject({
      key: 'q',
      propertyName: 'google_search__q',
      type: 'string',
      required: true
    })
  })

  it('creates n8n display properties for generated operations', () => {
    expect(SERP_ACTION_PROPERTIES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'google_search__q',
          displayName: 'Search Query',
          required: true,
          displayOptions: {
            show: {
              operation: ['google_search']
            }
          }
        }),
        expect.objectContaining({
          name: 'google_lens_search__url',
          displayOptions: {
            show: {
              operation: ['google_lens_search']
            }
          }
        })
      ])
    )
  })

  it('keeps apostrophes in generated option labels without breaking TypeScript', () => {
    expect(SERP_ACTION_PROPERTIES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          options: expect.arrayContaining([
            expect.objectContaining({
              name: "Cote D'ivoire"
            })
          ])
        })
      ])
    )
  })

  it('does not assign an empty-string default to number fields without schema defaults', () => {
    const numberProperties = SERP_ACTION_PROPERTIES.filter((property) => property.type === 'number')
    expect(numberProperties.length).toBeGreaterThan(0)

    for (const property of numberProperties) {
      expect(property.default).not.toBe('')
    }
  })

  it('exposes generated actions through the n8n operation dropdown', () => {
    const node = new TalordataSerp()
    const operation = node.description.properties.find((property) => property.name === 'operation')

    expect(operation).toMatchObject({
      displayName: 'Operation',
      name: 'operation',
      type: 'options'
    })
    expect(operation && 'options' in operation ? operation.options : []).toEqual(
      expect.arrayContaining([
        { name: 'Google Search', value: 'google_search' },
        { name: 'Google Lens Search', value: 'google_lens_search' },
        { name: 'Yandex Search', value: 'yandex_search' },
        { name: 'Raw SERP Request', value: 'rawRequest' }
      ])
    )

    expect(node.description.properties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'google_search__q' }),
        expect.objectContaining({ name: 'google_lens_search__url' }),
        expect.objectContaining({ name: 'rawAction' }),
        expect.objectContaining({ name: 'rawQuery' }),
        expect.objectContaining({ name: 'paramsJson' })
      ])
    )
  })
})
