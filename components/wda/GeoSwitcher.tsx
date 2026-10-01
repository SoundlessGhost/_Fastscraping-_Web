"use client";

import { useState } from "react";

const REGIONS = [
  { code: "US", n: "United States", cur: "USD", price: "348.00" },
  { code: "DE", n: "Germany", cur: "EUR", price: "329.99" },
  { code: "CH", n: "Switzerland", cur: "CHF", price: "359.00" },
  { code: "GB", n: "United Kingdom", cur: "GBP", price: "299.00" },
  { code: "SG", n: "Singapore", cur: "SGD", price: "499.00" },
  { code: "JP", n: "Japan", cur: "JPY", price: "49,500" },
];

export default function GeoSwitcher() {
  const [sel, setSel] = useState(0);
  const r = REGIONS[sel];
  const code = `GET /v1/products/B0C33XKZP4?country=${r.code.toLowerCase()}\n\n{\n  "title": "Sony WH-1000XM5",\n  "country": "${r.code}",\n  "price": "${r.price}",\n  "currency": "${r.cur}"\n}`;
  return (
    <div className="wda-geo" data-reveal data-delay="100">
      <div className="wda-facet-n">Region</div>
      <div className="wda-geo-chips">
        {REGIONS.map((g, i) => (
          <button key={g.code} type="button" className={`wda-geo-chip${i === sel ? " on" : ""}`} onClick={() => setSel(i)}>
            <span className="code">{g.code}</span>
            {g.n}
          </button>
        ))}
      </div>
      <div className="wda-geo-code">{code}</div>
    </div>
  );
}
