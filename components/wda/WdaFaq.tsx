"use client";

import { useState } from "react";

const FAQS = [
  { q: "What are Web Data APIs?", a: "Developer-ready endpoints that return structured data collected from supported public web sources." },
  { q: "Do I need to build a scraper?", a: "No. We provide the API layer and manage the collection infrastructure underneath it." },
  { q: "Can you build an API for a website that isn't listed?", a: "Yes. Use the custom API request flow and tell us the source, the fields and how you'll use the data." },
  { q: "What response formats are available?", a: "JSON by default. Some APIs also support XML or other delivery methods, depending on the project." },
  { q: "Can I test the API before production?", a: "Where available, a sandbox environment lets you test requests before production use." },
  { q: "Do you provide API documentation?", a: "Yes. Supported endpoints come with API documentation and integration resources." },
  { q: "Can the endpoint be customized?", a: "Yes. Endpoint design, schema, fields, parameters and delivery workflow can all be shaped to the project." },
  { q: "Can I use the API in production?", a: "Yes. Production access and limits depend on the endpoint and your commercial plan." },
  { q: "How do I request an API for a new source?", a: "Click Request a Custom API and share the target source, required fields, expected volume, geography and preferred response format." },
];
const GROUP_NAMES = ["The basics", "Integration", "Custom & production"];

export default function WdaFaq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="wda-faq-groups">
      {GROUP_NAMES.map((name, g) => {
        const items = FAQS.slice(g * 3, g * 3 + 3);
        return (
          <div key={name}>
            <div className="wda-faq-group-h">
              <span className="n">{name}</span>
              <span className="c">{items.length} questions</span>
            </div>
            {items.map((it, j) => {
              const idx = g * 3 + j;
              const isOpen = open === idx;
              const num = String(idx + 1).padStart(2, "0");
              return (
                <div className={`wda-qitem${isOpen ? " open" : ""}`} key={it.q}>
                  <button type="button" className="wda-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : idx)}>
                    <span className="qn">{num}</span>
                    <span className="qt">{it.q}</span>
                    <span className="sign" aria-hidden>{isOpen ? "−" : "+"}</span>
                  </button>
                  <div className={`wda-a-wrap${isOpen ? " open" : ""}`}>
                    <div className="wda-a-inner">
                      <p className="wda-a">{it.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
