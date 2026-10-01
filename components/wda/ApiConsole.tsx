"use client";

import { useEffect, useRef, useState } from "react";

// Hero API console — demo data. Four endpoint tabs; the JSON response types in,
// then auto-cycles to the next endpoint every 3.4s.
const EPS = [
  {
    label: "Product search",
    url: "https://api.fastscraping.com/v1/products/search",
    params: [["query", "wireless+headphones"], ["source", "amazon.com"], ["page", "1"]],
    records: "240 records",
    cache: "HIT",
    body: { query: "wireless headphones", source: "amazon.com", fetched_at: "2026-05-23T14:08:42Z", page: 1, results: [{ sku: "B0C33XKZP4", title: "Sony WH-1000XM5", price_usd: 348.0, stock: "in_stock", rating: 4.7, reviews: 12847, rank_organic: 1 }], records: 240 },
  },
  {
    label: "Search results",
    url: "https://api.fastscraping.com/v1/serp",
    params: [["q", "best+crm+for+startups"], ["engine", "google"], ["country", "us"]],
    records: "10 results",
    cache: "MISS",
    body: { q: "best crm for startups", engine: "google", country: "us", fetched_at: "2026-05-23T14:09:10Z", organic: [{ position: 1, title: "The 9 best CRMs for startups", domain: "example.com", snippet: "We compared pricing, setup time and…" }], ads: 2, local_pack: false },
  },
  {
    label: "Job listings",
    url: "https://api.fastscraping.com/v1/jobs",
    params: [["title", "data+engineer"], ["source", "indeed.com"], ["posted_within", "24h"]],
    records: "3,406 records",
    cache: "HIT",
    body: { title: "data engineer", source: "indeed.com", fetched_at: "2026-05-23T14:10:02Z", results: [{ employer: "Northwind Labs", role: "Senior Data Engineer", location: "Austin, TX", salary: { min: 145000, max: 175000, currency: "USD" }, posted: "6h ago" }], records: 3406 },
  },
  {
    label: "Property listings",
    url: "https://api.fastscraping.com/v1/listings",
    params: [["city", "zurich"], ["source", "homegate.ch"], ["type", "rent"]],
    records: "812 records",
    cache: "HIT",
    body: { city: "Zürich", source: "homegate.ch", fetched_at: "2026-05-23T14:11:37Z", results: [{ id: "hg-4471920", rooms: 3.5, area_m2: 92, rent_chf: 3480, district: "Kreis 6", available_from: "2026-07-01" }], records: 812 },
  },
];

export default function ApiConsole() {
  const [tab, setTab] = useState(0);
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<"sending" | "ok">("sending");
  const full = useRef("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function run(i: number) {
      clearTimers();
      const text = JSON.stringify(EPS[i].body, null, 2);
      full.current = text;
      setTab(i);
      setTyped(reduce ? text.length : 0);
      setPhase(reduce ? "ok" : "sending");
      if (reduce) return; // static for reduced motion
      timers.current.push(
        setTimeout(() => {
          setPhase("ok");
          const step = Math.max(3, Math.ceil(text.length / 80));
          const id = setInterval(() => {
            setTyped((t) => {
              const nt = Math.min(text.length, t + step);
              if (nt >= text.length) {
                clearInterval(id);
                timers.current.push(setTimeout(() => run((i + 1) % EPS.length), 3400));
              }
              return nt;
            });
          }, 26);
          timers.current.push(id as unknown as ReturnType<typeof setTimeout>);
        }, 600),
      );
    }

    run(0);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ep = EPS[tab];
  const sending = phase === "sending";
  const shown = sending ? "" : full.current.slice(0, typed);

  const pick = (i: number) => {
    if (i === tab) return;
    clearTimers();
    const text = JSON.stringify(EPS[i].body, null, 2);
    full.current = text;
    setTab(i);
    setTyped(0);
    setPhase("sending");
    timers.current.push(
      setTimeout(() => {
        setPhase("ok");
        const step = Math.max(3, Math.ceil(text.length / 80));
        const id = setInterval(() => {
          setTyped((t) => {
            const nt = Math.min(text.length, t + step);
            if (nt >= text.length) clearInterval(id);
            return nt;
          });
        }, 26);
        timers.current.push(id as unknown as ReturnType<typeof setTimeout>);
      }, 600),
    );
  };

  return (
    <div className="wda-console">
      <div className="wda-con-head">
        <div className="wda-con-tabs">
          {EPS.map((e, i) => (
            <button key={e.label} type="button" className={`wda-con-tab${i === tab ? " on" : ""}`} onClick={() => pick(i)}>
              {e.label}
            </button>
          ))}
        </div>
        <div className="wda-con-status">
          <span className="lbl">API Request</span>
          <span
            className="wda-con-badge"
            style={{
              background: sending ? "var(--bg)" : "#e5efe8",
              color: sending ? "var(--w-meta)" : "var(--w-green)",
            }}
          >
            {sending ? "Sending…" : "200 OK"}
          </span>
        </div>
      </div>
      <div className="wda-con-grid">
        <div className="wda-con-req">
          <div>
            <div className="wda-con-k">Request</div>
            <div className="wda-con-url">
              <span className="m">GET</span>
              <span>{ep.url}</span>
            </div>
          </div>
          <div>
            <div className="wda-con-k">Query parameters</div>
            <div className="wda-con-params">
              {ep.params.map(([k, v]) => (
                <div className="wda-con-param" key={k}>
                  <span className="pk">{k}</span>
                  <span className="pv">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: "auto" }}>
            <div className="wda-con-k">Headers</div>
            <div className="wda-con-hdr">Authorization: Bearer YOUR_API_KEY</div>
          </div>
        </div>
        <div className="wda-con-res">
          <div className="wda-con-res-head">
            <span>response.json</span>
            <span>{ep.records}</span>
          </div>
          <pre className="wda-con-pre">
            {shown}
            <span className="wda-caret" />
          </pre>
          <div className="wda-con-res-foot">
            <span>JSON response</span>
            <span>Cache: <span className="g">{sending ? "—" : ep.cache}</span></span>
            <span>Region: <span className="g">us-east-1</span></span>
            <span>Source status: <span className="ok">{sending ? "—" : "OK"}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
