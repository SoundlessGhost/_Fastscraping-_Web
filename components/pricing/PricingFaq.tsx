"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "How often can prices be refreshed?",
    a: "As often as your decisions need: every few minutes for fast-moving marketplaces, daily for most retail, weekly or monthly for slower categories. You can mix cadences by source.",
  },
  {
    q: "How do you match my products to competitors?",
    a: "We match on EAN, UPC, MPN or model number first, then on title and attributes for products without codes. Every match carries a confidence score, and low-confidence matches are reviewed by a person.",
  },
  {
    q: "Can you collect prices for a specific location?",
    a: "Yes. For retailers that price by ZIP code, region or store, we collect from the locations you choose and tag every record with it.",
  },
  {
    q: "Do you build dashboards or repricing rules?",
    a: "No. We deliver clean, matched data into the tools you already use. That keeps your pricing logic yours, and means no extra software to learn.",
  },
  {
    q: "What does it cost?",
    a: "It depends on the number of SKUs, sources and how often you need them. After the free sample you get a fixed monthly quote, with no seat licences and no setup fee.",
  },
];

export default function PricingFaq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="pi-acc">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div className="pi-qitem" key={f.q}>
            <button
              type="button"
              className="pi-q"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span>{f.q}</span>
              <span className="sign" aria-hidden>
                {isOpen ? "−" : "+"}
              </span>
            </button>
            <div className={`pi-a-wrap${isOpen ? " open" : ""}`}>
              <div className="pi-a-inner">
                <p className="pi-a">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
