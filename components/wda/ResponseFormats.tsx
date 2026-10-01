"use client";

import { useState } from "react";

const FMTS = [
  { n: "JSON", d: "Default for every endpoint", hint: "default", file: "response.json", mime: "application/json", code: '{\n  "sku": "B0C33XKZP4",\n  "title": "Sony WH-1000XM5",\n  "price": 348.00,\n  "currency": "USD",\n  "availability": "in_stock",\n  "fetched_at": "2026-05-23T14:08:42Z"\n}' },
  { n: "XML", d: "For systems that expect it", hint: "where supported", file: "response.xml", mime: "application/xml", code: '<product>\n  <sku>B0C33XKZP4</sku>\n  <title>Sony WH-1000XM5</title>\n  <price currency="USD">348.00</price>\n  <availability>in_stock</availability>\n  <fetched_at>2026-05-23T14:08:42Z</fetched_at>\n</product>' },
  { n: "Webhook", d: "We push when data changes", hint: "push", file: "POST /your-endpoint", mime: "event", code: '{\n  "event": "product.updated",\n  "id": "evt_123",\n  "data": {\n    "sku": "B0C33XKZP4",\n    "price": { "from": 348.00, "to": 329.00 }\n  }\n}' },
];
const DELIVER: [string, string][] = [["REST API", "pull"], ["Webhook", "push"], ["Amazon S3", "drop"], ["SFTP", "drop"]];

export default function ResponseFormats() {
  const [sel, setSel] = useState(0);
  const cur = FMTS[sel];
  return (
    <div className="wda-fmt-grid">
      <div data-reveal>
        <h2 className="wda-h2">
          Structured data, <em>exactly where your application needs it.</em>
        </h2>
        <p className="wda-lead" style={{ marginTop: 14, maxWidth: "42ch" }}>
          One record, the shape your stack expects. Switch the format to see the same product.
        </p>
        <div className="wda-fmt-list">
          {FMTS.map((fmt, i) => (
            <button key={fmt.n} type="button" className={`wda-fmt-opt${i === sel ? " on" : ""}`} onClick={() => setSel(i)}>
              <span className="wda-fmt-ring" />
              <span>
                <span className="wda-fmt-n">{fmt.n}</span>
                <span className="wda-fmt-d">{fmt.d}</span>
              </span>
              <span className="wda-fmt-hint">{fmt.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="wda-fmt-view" data-reveal data-delay="100">
        <div className="wda-fmt-view-head">
          <span className="f">{cur.file}</span>
          <span className="wda-fmt-mime">{cur.mime}</span>
        </div>
        <pre className="wda-fmt-pre">{cur.code}</pre>
        <div className="wda-fmt-foot">
          <div className="wda-facet-n">Delivered via</div>
          <div className="wda-fmt-deliver">
            {DELIVER.map(([n, m]) => (
              <span key={n}>{n}<i>{m}</i></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
