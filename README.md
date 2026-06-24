# n8n-nodes-talordata-serp

Talordata SERP community node for n8n.

This package adds a `Talordata SERP API` credential and a `Talordata SERP` node that calls the Talordata SERP API from n8n workflows.

```text
POST https://serpapi.talordata.net/serp/v1/request
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer <SERP_API_KEY>
Origin: n8n
```

Use a Talordata SERP API Key beginning with `sk_`. Do not use a Talordata dashboard login JWT.

## Installation

Install the package from the n8n Community Nodes panel:

1. Open n8n.
2. Go to `Settings` > `Community Nodes`.
3. Select `Install`.
4. Enter `n8n-nodes-talordata-serp`.
5. Confirm the installation and restart n8n if your deployment requires it.

This package is a community node. It appears in n8n's regular Community Nodes installation flow after publishing to npm. It should only be described as an n8n verified node after n8n has approved it.

## Credentials

1. Create a `Talordata SERP API` credential.
2. Paste a Talordata SERP API Key beginning with `sk_`.
3. Keep the default endpoint unless you are testing an internal development environment.
4. Save or test the credential.

The credential test request and workflow execution requests both send `Origin: n8n` for Talordata platform statistics.

## Using the Node

1. Create or open a workflow.
2. Add the `Talordata SERP` node.
3. Select the `Talordata SERP API` credential.
4. Choose an `Operation`.
5. Fill in the fields shown for that operation.
6. Execute the node.

The node returns the Talordata SERP JSON response plus request metadata for the selected operation.

## Examples

Google Search:

```text
Operation: Google Search
Search Query: coffee
Country/Region: United States
Language: English
Number of results: 10
```

Bing Image Search:

```text
Operation: Bing Image Search
Search Query: coffee
Country/Region: United States
Market: en-US
Result count: 10
```

Google Lens Search:

```text
Operation: Google Lens Search
Image URL: https://example.com/image.png
```

Yandex Search:

```text
Operation: Yandex Search
Search Query: coffee
```

Raw SERP Request:

```text
Operation: Raw SERP Request
Raw Action: Google Lens Search
Raw Query: https://example.com/image.png
Extra Parameters JSON: {"hl":"en"}
```

Use `Raw SERP Request` when you want to choose a generated action but provide advanced parameters manually. The node uses the correct query field for the selected action, for example `q`, `text`, `url`, `product_id`, `patent_id`, `author_id`, or `trend`.

## Supported Operations

The node exposes Talordata SERP actions generated from the same metadata used by the Talordata Dify plugin. The operation dropdown includes Google, Bing, DuckDuckGo, Yandex, Google Images, Bing Images, Google News, Bing News, Google Lens, Google Shopping, Google Scholar, Google Play, Google Patents, Google Finance, Google Hotels, Google Flights, Google Maps, Google Trends, and other generated SERP actions.

Each explicit operation shows only the parameters defined for that action. The `Extra Parameters JSON` field is available for advanced parameters and is merged into the request after visible form fields. The node controls `engine` and default `json=2`; extra parameters cannot override the selected engine.

## Troubleshooting

401 or 403:

- Confirm the API Key begins with `sk_`.
- Confirm the credential uses the `Talordata SERP API` credential type.
- Generate a fresh API Key in Talordata if the key is expired or disabled.

400:

- Confirm the selected operation has a non-empty query.
- For `Raw SERP Request`, confirm `Extra Parameters JSON` is a JSON object.

429:

- Reduce n8n concurrency.
- Add batching between workflow items.
- Check Talordata quota and rate limits.

Network or regional access errors:

- Confirm the n8n runtime can reach `https://serpapi.talordata.net`.
- If your deployment requires an outbound proxy, configure the proxy at the n8n runtime level.

## Support

For issues with this n8n community node, use GitHub Issues:

https://github.com/Talordata/n8n-nodes-talordata-serp/issues

For Talordata SERP API access, quota, or billing questions, use your Talordata support channel.

## Development

```powershell
npm install
npm run build
npm run lint
npm test
```

Build a local package for private/self-hosted testing:

```powershell
npm pack
```

Before publishing a public npm release, run:

```powershell
npm run build
npm run lint
npm test
npm pack --dry-run
```

Publish public releases from GitHub Actions with npm provenance enabled. The repository includes `.github/workflows/publish.yml` for npm Trusted Publisher based releases.
