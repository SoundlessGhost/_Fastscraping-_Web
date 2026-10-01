"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Api = {
  name: string; cat: string; desc: string; tags: string[];
  fmt: string[]; access: string; type: string; st: "operational" | "beta" | "custom";
};

const APIS: Api[] = [
  { name: "Amazon Product API", cat: "E-commerce", desc: "Product, pricing, ratings, reviews and seller data through a developer-ready API.", tags: ["Product", "Pricing", "Reviews", "Seller"], fmt: ["JSON"], access: "Real-time", type: "Production", st: "operational" },
  { name: "Walmart Product API", cat: "E-commerce", desc: "Structured product, pricing, inventory and search data from Walmart.", tags: ["Products", "Pricing", "Inventory", "Search"], fmt: ["JSON"], access: "Real-time", type: "Production", st: "operational" },
  { name: "Google Search API", cat: "Search", desc: "Structured search results for applications, monitoring, research and data workflows.", tags: ["Organic", "Ads", "Local", "SERP"], fmt: ["JSON", "XML"], access: "Real-time", type: "Production", st: "operational" },
  { name: "Indeed Jobs API", cat: "Jobs", desc: "Job listings, salaries, employers, locations and posting metadata in structured form.", tags: ["Listings", "Salary", "Employer", "Location"], fmt: ["JSON"], access: "Async", type: "Production", st: "operational" },
  { name: "Homegate Listings API", cat: "Real Estate", desc: "Structured property listings and real-estate feed data for your application.", tags: ["Listings", "Price", "Location", "Property"], fmt: ["JSON", "XML"], access: "Async", type: "Production", st: "beta" },
  { name: "All Nippon Airways Data API", cat: "Travel", desc: "Structured flight fares, schedules and supported availability data.", tags: ["Fares", "Schedules", "Flights"], fmt: ["JSON"], access: "Async", type: "Custom", st: "custom" },
  { name: "Uber Eats Menu API", cat: "Food & Delivery", desc: "Restaurant menus, item prices, fees and delivery availability by location.", tags: ["Menus", "Prices", "Fees"], fmt: ["JSON"], access: "Async", type: "Custom", st: "beta" },
  { name: "Ticketmaster Events API", cat: "Ticketing", desc: "Events, venues, price ranges and on-sale status in one structured feed.", tags: ["Events", "Venues", "Prices"], fmt: ["JSON"], access: "Real-time", type: "Custom", st: "custom" },
  { name: "LinkedIn Company API", cat: "Social", desc: "Public company profiles, headcount signals and job openings for enrichment.", tags: ["Company", "Headcount", "Jobs"], fmt: ["JSON"], access: "Async", type: "Production", st: "operational" },
];
const CATS = ["All", "E-commerce", "Search", "Real Estate", "Jobs", "Travel", "Social", "Food & Delivery", "Ticketing", "Other"];
const FACETS = [
  { id: "fmt" as const, n: "Response", opts: ["JSON", "XML"] },
  { id: "access" as const, n: "Access", opts: ["Real-time", "Async"] },
  { id: "type" as const, n: "Type", opts: ["Production", "Custom"] },
];
const ST: Record<string, [string, string]> = {
  operational: ["Operational", "var(--w-green)"],
  beta: ["Beta", "#9a6a12"],
  custom: ["Custom", "#6b716d"],
};

type Facets = { fmt: string[]; access: string[]; type: string[] };

export default function ApiCatalog() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [f, setF] = useState<Facets>({ fmt: [], access: [], type: [] });

  const match = (a: Api, ignoreCat: boolean) => {
    const query = q.trim().toLowerCase();
    if (query && ![a.name, a.cat, a.desc, ...a.tags].join(" ").toLowerCase().includes(query)) return false;
    if (!ignoreCat && cat !== "All" && a.cat !== cat) return false;
    if (f.fmt.length && !f.fmt.some((x) => a.fmt.includes(x))) return false;
    if (f.access.length && !f.access.includes(a.access)) return false;
    if (f.type.length && !f.type.includes(a.type)) return false;
    return true;
  };

  const list = useMemo(() => APIS.filter((a) => match(a, false)), [q, cat, f]);
  const pool = useMemo(() => APIS.filter((a) => match(a, true)), [q, f]);
  const anyFilter = Boolean(q || cat !== "All" || f.fmt.length || f.access.length || f.type.length);

  const toggle = (id: keyof Facets, o: string) =>
    setF((st) => ({ ...st, [id]: st[id].includes(o) ? st[id].filter((x) => x !== o) : [...st[id], o] }));

  return (
    <>
      <div className="wda-head" data-reveal>
        <div>
          <h2 className="wda-h2">Explore Web Data APIs</h2>
          <p className="wda-lead" style={{ marginTop: 12 }}>
            Browse available APIs, or tell us exactly which source and fields you need.
          </p>
        </div>
        <span className="wda-mono" style={{ fontSize: 12.5, color: "var(--w-meta)" }}>
          {list.length} {list.length === 1 ? "API shown" : "APIs shown"}
        </span>
      </div>

      <div className="wda-cat-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by API, website, category, or data type" aria-label="Search APIs" />
      </div>

      <div className="wda-chips">
        {CATS.map((c) => {
          const count = c === "All" ? pool.length : pool.filter((a) => a.cat === c).length;
          return (
            <button key={c} type="button" className={`wda-chip${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>
              {c}
              {count ? <span className="c">{count}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="wda-cat-body">
        <aside className="wda-facets">
          {FACETS.map((facet) => (
            <div key={facet.id}>
              <div className="wda-facet-n">{facet.n}</div>
              <div className="wda-facet-opts">
                {facet.opts.map((o) => {
                  const on = f[facet.id].includes(o);
                  return (
                    <button key={o} type="button" role="checkbox" aria-checked={on} className={`wda-facet-opt${on ? " on" : ""}`} onClick={() => toggle(facet.id, o)}>
                      <span className="wda-facet-box">{on ? "✓" : ""}</span>
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {anyFilter ? (
            <button type="button" className="wda-clear" onClick={() => { setQ(""); setCat("All"); setF({ fmt: [], access: [], type: [] }); }}>
              Clear filters
            </button>
          ) : null}
        </aside>

        <div className="wda-cat-main">
          {list.length ? (
            <div className="wda-api-grid">
              {list.map((a) => {
                const mono = a.name.split(" ").slice(0, 2).map((w) => w[0]).join("");
                const [stLabel, stColor] = ST[a.st];
                return (
                  <Link href="/contact" className="wda-api" key={a.name}>
                    <div className="wda-api-top">
                      <span className="wda-api-mono">{mono}</span>
                      <span className="wda-api-st" style={{ color: stColor }}>
                        <span className="dot" style={{ background: stColor }} />
                        {stLabel}
                      </span>
                    </div>
                    <div className="wda-api-name">{a.name}</div>
                    <div className="wda-api-cat">{a.cat}</div>
                    <p className="wda-api-desc">{a.desc}</p>
                    <div className="wda-api-tags">
                      {a.tags.map((t) => <span key={t}>{t}</span>)}
                    </div>
                    <div className="wda-api-foot">
                      <span className="wda-api-badges">{["REST", ...a.fmt, a.access].join("  ·  ")}</span>
                      <span className="wda-api-view">View API →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="wda-empty">
              <div className="wda-empty-t">Don&apos;t see the source you need?</div>
              <p>Tell us the website, data fields, request volume and response format you need.</p>
              <div className="wda-empty-cta">
                <Link href="/contact" className="btn btn-primary">Request a Custom API →</Link>
                <Link href="/contact" className="btn btn-ghost">Talk to Our Team →</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
