"use client";

import { useState } from "react";

const CODE: Record<string, string> = {
  cURL: `curl -X GET \\
  "https://api.fastscraping.com/v1/products/search?query=wireless+headphones" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  Python: `import requests

r = requests.get(
    "https://api.fastscraping.com/v1/products/search",
    params={"query": "wireless headphones"},
    headers={"Authorization": "Bearer YOUR_API_KEY"},
)
print(r.json()["data"]["results"][0]["title"])`,
  "Node.js": `const res = await fetch(
  "https://api.fastscraping.com/v1/products/search?query=wireless+headphones",
  { headers: { Authorization: "Bearer YOUR_API_KEY" } }
);
const { data } = await res.json();
console.log(data.results[0].title);`,
  PHP: `<?php
$ch = curl_init("https://api.fastscraping.com/v1/products/search?query=wireless+headphones");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer YOUR_API_KEY"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$data = json_decode(curl_exec($ch), true);
echo $data["data"]["results"][0]["title"];`,
};

const DEV_RESPONSE = JSON.stringify(
  { success: true, data: { query: "wireless headphones", results: [{ title: "Sony WH-1000XM5", price_usd: 348.0, rating: 4.7, reviews: 12847 }] } },
  null,
  2,
);

export default function DevCode() {
  const [lang, setLang] = useState("cURL");
  return (
    <div className="wda-dev-box" data-reveal data-delay="100">
      <div className="wda-dev-code">
        <div className="wda-dev-langs">
          {Object.keys(CODE).map((l) => (
            <button key={l} type="button" className={`wda-dev-lang${l === lang ? " on" : ""}`} onClick={() => setLang(l)}>
              {l}
            </button>
          ))}
        </div>
        <pre className="wda-dev-pre">{CODE[lang]}</pre>
      </div>
      <div className="wda-dev-res">
        <div className="wda-dev-res-head">
          <span>Response</span>
          <span className="ok">200 OK</span>
        </div>
        <pre className="wda-dev-pre">{DEV_RESPONSE}</pre>
      </div>
    </div>
  );
}
