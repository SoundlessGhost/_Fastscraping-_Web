"use client";

import { useState } from "react";

const SHIP = [
  { g: "Docs", t: "OpenAPI 3.1", file: "openapi.yaml", d: "Machine-readable spec for your integration and tooling. Generate clients, mocks and tests from it.", code: "openapi: 3.1.0\ninfo:\n  title: Product Search API\n  version: 1.0.0\npaths:\n  /v1/products/search:\n    get:\n      parameters:\n        - name: query\n          in: query\n          required: true" },
  { g: "Docs", t: "Interactive documentation", file: "docs/", d: "Test requests and inspect response examples straight from the docs, with your own sandbox key.", code: "GET /v1/products/search\n\n  query   wireless headphones\n  page    1\n\n  [ Try it ]   → 200 OK" },
  { g: "Docs", t: "Postman collection", file: "postman.json", d: "Import the endpoint into Postman and start testing immediately.", code: '{\n  "info": { "name": "Fastscraping · Products" },\n  "item": [\n    { "name": "Search products",\n      "request": { "method": "GET",\n        "url": "{{base}}/v1/products/search" } }\n  ]\n}' },
  { g: "Docs", t: "TypeScript SDK", file: "sdk/", d: "A typed client where the API has an official SDK. Autocomplete for every field.", code: 'import { Fastscraping } from "@fastscraping/sdk";\n\nconst fs = new Fastscraping({ apiKey });\nconst { results } = await fs.products.search({\n  query: "wireless headphones",\n});' },
  { g: "Access", t: "Authentication", file: "auth", d: "API key or bearer authentication, depending on the endpoint. Keys can be scoped and rotated.", code: "Authorization: Bearer YOUR_API_KEY\n\n# rotate without downtime\nfs_live_old  → active until 2026-06-01\nfs_live_new  → active" },
  { g: "Access", t: "Rate limiting", file: "limits", d: "Controlled request rates for predictable production usage, set per key.", code: "HTTP/1.1 200 OK\nX-RateLimit-Limit: 600\nX-RateLimit-Remaining: 598\nX-RateLimit-Reset: 1716473322" },
  { g: "Operations", t: "Usage analytics", file: "usage", d: "Monitor API usage and request activity per key and per endpoint.", code: "key        endpoint            calls   errors\nprod-web   /products/search   18,204       12\nprod-etl   /products/{sku}     4,950        3" },
  { g: "Operations", t: "Status monitoring", file: "status", d: "See endpoint health and the health of the source behind it.", code: "● Operational\n\nEndpoint health   Healthy\nSource health     Healthy\nLast checked      2 minutes ago" },
  { g: "Operations", t: "Webhooks", file: "webhooks", d: "Push-based delivery where the API supports asynchronous workflows.", code: 'POST https://your-app.com/hooks/fastscraping\n\n{\n  "event": "job.completed",\n  "id": "evt_123",\n  "records": 240\n}' },
];
const GROUPS = ["Docs", "Access", "Operations"];

export default function ShipExplorer() {
  const [sel, setSel] = useState(0);
  const cur = SHIP[sel];

  return (
    <div className="wda-ship" data-reveal data-delay="100">
      <div className="wda-ship-tree">
        <div className="wda-ship-root">
          <i />
          your-api/
          <span className="ct">{SHIP.length} items</span>
        </div>
        {GROUPS.map((g) => (
          <div className="wda-ship-group" key={g}>
            <div className="wda-ship-group-n">{g}</div>
            {SHIP.map((it, i) => ({ ...it, i })).filter((it) => it.g === g).map((it) => (
              <button key={it.i} type="button" className={`wda-ship-item${it.i === sel ? " on" : ""}`} onClick={() => setSel(it.i)}>
                <span className="br">└</span>
                <span className="nm">{it.t}</span>
                <span className="fl">{it.file}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="wda-ship-detail">
        <div className="wda-ship-detail-head">
          <span>{cur.file}</span>
          <span className="g">{cur.g}</span>
        </div>
        <div className="wda-ship-detail-body">
          <div className="wda-ship-detail-t">{cur.t}</div>
          <p>{cur.d}</p>
        </div>
        <pre className="wda-ship-code">{cur.code}</pre>
      </div>
    </div>
  );
}
