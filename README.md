# n8n-nodes-talordata-serp

Talordata SERP community node for n8n.

## What It Does

This package adds:

- `Talordata SERP API` credential type.
- `Talordata SERP` node.
- Generated SERP actions derived from the Talordata Dify plugin metadata.
- Raw SERP Request for advanced generated-action requests.

The node calls:

```text
POST https://serpapi.talordata.net/serp/v1/request
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer <SERP_API_KEY>
Origin: n8n
```

Use a Talordata SERP API Key beginning with `sk_`. Do not use a Talordata dashboard login JWT.

## Local Development

```powershell
npm install
npm run build
npm run lint
npm test
```

## Private Installation

Build the package:

```powershell
npm pack
```

Install it into a self-hosted n8n instance using n8n's private/community node installation flow.

## Credential Setup

1. Create a `Talordata SERP API` credential.
2. Paste the `sk_...` API Key.
3. Keep the default endpoint unless you are testing an internal development environment.

## Supported Operations

The node exposes the Talordata SERP actions generated from the same metadata used by the Dify plugin. The operation dropdown includes Google, Bing, DuckDuckGo, Yandex, Google Images, Bing Images, Google News, Bing News, Google Lens, Google Shopping, Google Scholar, Google Play, Google Patents, Google Finance, Google Hotels, Google Flights, Google Maps, Google Trends, and the other generated SERP actions.

Each explicit operation shows only the parameters defined for that action. The `Extra Parameters JSON` field is available for advanced parameters and is merged into the request after visible form fields. The node always sends `Origin: n8n` for platform statistics.

### Raw SERP Request

`Raw SERP Request` uses a generated action selector rather than a free-text engine field. This lets the node use the correct query field for each engine, such as `q`, `text`, `url`, `product_id`, `patent_id`, `author_id`, or `trend`. Put additional API parameters in `Extra Parameters JSON`.

Example extra parameters:

```json
{
  "gl": "us",
  "hl": "en",
  "num": 5
}
```

The node controls `engine` and default `json=2`. Extra parameters cannot override the selected engine.

## Troubleshooting

401 or 403:

- Confirm the API Key begins with `sk_`.
- Confirm the credential uses the Talordata SERP API credential type.
- Generate a fresh API Key in Talordata if the key is expired or disabled.

400:

- Confirm the selected operation has a non-empty query.
- For Raw SERP Request, confirm Extra Parameters JSON is an object.

429:

- Reduce n8n concurrency.
- Add batching between workflow items.
- Check Talordata quota and rate limits.

## Acceptance Status

The custom node is accepted when:

- `npm run build` passes.
- `npm run lint` passes.
- `npm test` passes.
- Local n8n can load the node.
- Google Search, Bing Image Search, Google Lens Search, Yandex Search, and Raw SERP Request work with a valid Talordata SERP API Key.
- The node never asks for or stores a Talordata dashboard login JWT.
