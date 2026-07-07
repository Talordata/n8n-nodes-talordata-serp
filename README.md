# n8n integration for TalorData SERP API

You can integrate [**TalorData**](https://www.talordata.com/serp-api/n8n?campaignid=YAnR3igdXFZH5Bj7&utm_source=n8n&utm_term=n8n) into n8n using the `n8n-nodes-talordata-serp` community node. Once configured, you can send search requests directly from your n8n workflows and retrieve structured results from Google, Bing, DuckDuckGo, and Yandex.

### Overview

n8n is a workflow automation platform that allows you to visually connect applications, APIs, and AI agents. TalorData provides SERP API capabilities suitable for real-time search result retrieval, localized search analysis, SEO monitoring, market research, and agent-driven web data workflows.

**With the TalorData n8n integration, you can:**

Execute SERP searches on Google, Bing, DuckDuckGo, Yandex, and more directly within n8n.

Utilize localized search parameters such as country/region, language, device, and market.

Integrate search results into workflows involving AI agents, reporting pipelines, alerts, data enrichment, and more.

Pass advanced SERP parameters via raw request mode for scenarios requiring greater control.

To learn more about TalorData SERP API features, pricing, or how to get an API key for your n8n credentials, visit TalorData.

### Preparations

Before you begin, please ensure you have:

*   A working n8n instance.
    
*   Permissions for installing n8n community nodes.
    

### A [**TalorData SERP API key**](https://www.talordata.com/serp-api/n8n?campaignid=YAnR3igdXFZH5Bj7&utm_source=n8n&utm_term=n8n) starting with `sk_`.

### Specific steps

#### Installation

Install the TalorData node from the n8n Community Nodes panel:

*   Open your n8n instance.
    
*   Go to `Settings` > `Community Nodes`。
    
*   Click `Install`。
    
*   Enter package name:
    

```plaintext
n8n-nodes-talordata-serp
```

*   Confirm installation.
    
*   If your deployment environment requires a restart, please restart n8n.
    

**After installation, n8n will add:**

*   A credential type named Talordata SERP API.
    
*   A workflow node named Talordata SERP.
    

#### Configure Credentials

Before adding nodes to the production workflow, it is recommended to create TalorData credentials:

*   Open Credentials in n8n.
    
*   Create new credentials and select Talordata SERP API.
    
*   Paste your TalorData SERP API Key.
    
*   Unless you are testing an internal development environment, keep the default endpoint.
    
*   Save or test the credential.
    

#### Create Your First Workflow

Run a TalorData search in n8n:

*   Create a new workflow or open an existing one.
    
*   Add the Talordata SERP node.
    
*   Select your Talordata SERP API credentials.
    
*   Select an operation, such as Google Search.
    
*   Fill in the fields displayed for the operation.
    
*   Execute the node.
    

The node returns the TalorData SERP JSON response along with request metadata for the selected operation. You can pass the output to downstream n8n nodes, such as AI Agents, Code nodes, databases, spreadsheets, notification services, or reporting tools.

### Example: Google Search

You can use this action when you need to retrieve standard web search results from Google.

```plaintext
Operation: Google Search
Search Query: coffee
Country/Region: United States
Language: English
Number of results: 10
```

Typical use cases include market research, SEO monitoring, competitor analysis, and retrieval-augmented AI workflows.

### Example: Bing Image Search

This action can be used when the workflow needs to retrieve image search results from Bing.

```plaintext
Operation: Bing Image Search
Search Query: coffee
Country/Region: United States
Market: en-US
Result count: 10
```

### Example: Google Lens Search

Google Lens Search can be used when the workflow takes an image URL as input.

```plaintext
Operation: Google Lens Search
Image URL: https://example.com/image.png
```

### Example: Yandex Search

Yandex Search can be used when a workflow requires Yandex SERP results.

```plaintext
Operation: Yandex Search
Search Query: coffee
```

### Advanced Usage: Raw SERP Request

You can use a Raw SERP Request when you want to select a pre-generated SERP action while manually passing advanced parameters.

```plaintext
Operation: Raw SERP Request
Raw Action: Google Lens Search
Raw Query: https://example.com/image.png
Extra Parameters JSON: {"hl":"en"}
```

The node automatically uses the correct query field based on the selected action—such as `q`、`text`、`url`、`product_id`、`patent_id`、`author_id` or `trend`。

The Extra Parameters JSONmust be a valid JSON object. This field is merged into the request after the visible form fields. The node controls the `engine` and the default `json=2` value, so extra parameters cannot override the selected search engine.

### Supported operations

Talordata SERP nodes expose SERP actions generated from TalorData metadata. The list of actions includes:

Each explicit action displays only the parameters it supports. To pass advanced parameters not shown in the form, use the Extra Parameters JSON field.

### Troubleshooting

#### 401 or 403 error

Please check:

*   Does the API key start with sk\_?
    
*   Is the credential type Talordata SERP API?
    
*   Has the API key expired or been disabled?
    

> If necessary, please generate a new SERP API Key in TalorData and update the n8n credentials.

#### 400 error

Please check:

*   Whether the required query or URL fields have been filled in for the selected operation.
    
*   Whether the Extra Parameters JSON is valid JSON.
    
*   Whether the parameters match the selected SERP operation.
    

#### 429 error

If the workflow triggers rate limiting, you can try:

*   Reduce n8n workflow concurrency.
    
*   Add batching or delay nodes between requests.
    
*   Check your TalorData quotas and rate limits.
    

#### Network error

If n8n cannot access TalorData, please check:

*   Check if the n8n runtime environment can access https://serpapi.talordata.net.
    
*   If your environment requires an outbound proxy, configure the proxy at the n8n runtime environment level.
    
*   Check for firewall, DNS, or regional network restrictions in the deployment environment.
    

## Resources

*   npm: [n8n-talordata](https://www.npmjs.com/package/n8n-nodes-talordata-serp)
    
*   TalorData: [talordata.com](https://www.talordata.com/serp-api/n8n?campaignid=YAnR3igdXFZH5Bj7&utm_source=n8n&utm_term=n8n)
    

## Support

For issues with the n8n integration package, report an issue in the [GitHub repository](https://github.com/talordata).

For TalorData SERP API account, quota, or API key issues, contact TalorData support through the support channel listed in your TalorData account or dashboard.

For detailed integration tutorials and API documentation, visit the TalorData Documentation.

---

## Learn More

Ready to build AI agents with real-time search in n8n?

**Explore the** [**TalorData n8n Integration Guide**](https://www.talordata.com/serp-api/n8n?campaignid=YAnR3igdXFZH5Bj7&utm_source=n8n&utm_term=n8n)

**Read the** [**Integration Documentation**](https://docs.talordata.com/serp-api/integration/sdk-integration/how-to-integrate-talordata-with-n8n)

---
> **TalorData brings real‑time search to n8n, enabling developers to build AI agents and workflows with fresh, structured, and reliable search data.**