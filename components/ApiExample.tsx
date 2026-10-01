"use client";

import { useState } from "react";

// A small "call it with your key" demo for the homepage: language tabs over a
// request snippet, with a sample JSON response beside it. The endpoint shown is
// illustrative — the self-serve API is wired to the backend later.
const SNIPPETS: Record<string, string> = {
  curl: `curl https://api.fastscraping.com/v1/shopee/product \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"region":"br","shop_id":123456,"item_id":789012}'`,
  python: `import requests

r = requests.post(
    "https://api.fastscraping.com/v1/shopee/product",
    headers={"X-API-Key": "YOUR_API_KEY"},
    json={"region": "br", "shop_id": 123456, "item_id": 789012},
)
print(r.json())`,
  node: `const res = await fetch("https://api.fastscraping.com/v1/shopee/product", {
  method: "POST",
  headers: {
    "X-API-Key": "YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ region: "br", shop_id: 123456, item_id: 789012 }),
});
console.log(await res.json());`,
};

const RESPONSE = `{
  "region": "br",
  "product": {
    "name": "Wireless Earbuds Pro",
    "price": 129.90,
    "currency": "BRL",
    "stock": 428,
    "rating": 4.6,
    "sold": 15230
  }
}`;

const TABS = [
  { id: "curl", label: "cURL" },
  { id: "python", label: "Python" },
  { id: "node", label: "Node.js" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ApiExample() {
  const [tab, setTab] = useState<TabId>("curl");
  return (
    <div className="api-card">
      <div className="api-tabs">
        <span className="api-dots" aria-hidden>
          <i /><i /><i />
        </span>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`api-tab${tab === t.id ? " on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="api-body">
        <div className="api-pane">
          <div className="api-pane-h">Request</div>
          <pre className="api-code">
            <code>{SNIPPETS[tab]}</code>
          </pre>
        </div>
        <div className="api-pane">
          <div className="api-pane-h">Response</div>
          <pre className="api-code api-code--res">
            <code>{RESPONSE}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
