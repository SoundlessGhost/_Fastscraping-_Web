import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { withShareCard } from "@/lib/seo";
import { BOOK_CALL_URL, TRIAL_URL } from "@/lib/site-links";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = withShareCard({
  title: { absolute: "Fastscraping — Web data at scale for e-commerce market intelligence" },
  description:
    "Scraping APIs and anti-bot infrastructure powering e-commerce market intelligence. One request returns a full product page: price per variant, live stock, vouchers, sold count and seller data.",
  alternates: { canonical: "/" },
});

const PROOF = [
  { k: "99.7%", v: "anti-bot bypass across Cloudflare, DataDome, PerimeterX, Akamai" },
  { k: "8 markets", v: "Shopee TH, ID, MY, PH, VN, SG, Taiwan and Brazil" },
  { k: "100k+", v: "product pages delivered every day" },
  { k: "15+ months", v: "average client relationship on managed pipelines" },
];

const WAYS = [
  {
    title: "Web Data APIs",
    body: "Ready-made async APIs for Shopee, GrabFood and more. Submit a job, get clean JSON back. Billed per successful request.",
    href: "/apis",
    cta: "Browse the APIs →",
    icon: <path d="M4 7h16M4 12h16M4 17h10" />,
  },
  {
    title: "Managed pipelines",
    body: "Scheduled delivery to SFTP, S3 or webhook in JSON, Parquet, CSV or TSV. Coverage checks and schema discipline on every run.",
    href: "/solutions",
    cta: "See how pipelines work →",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    title: "Custom data projects",
    body: "A new platform or a protected site your team can't crack. Clean sample within 48–72 hours, then a production pipeline you never touch.",
    href: "/contact",
    cta: "Describe your target →",
    icon: (
      <>
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
        <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
      </>
    ),
  },
];

const PLATFORMS = [
  { name: "GrabFood Indonesia", note: "Restaurants by area, full menus, item prices, promos, delivery fees.", live: true },
  { name: "Temu", note: "Product and goods-list data for Brazil and Mexico.", live: true },
  { name: "Lazada", note: "On request · SEA markets" },
  { name: "TikTok Shop", note: "On request · SEA markets" },
  { name: "Ticketing marketplaces", note: "215k+ events, 24M+ listings a day with checkout prices." },
  { name: "Restaurant & delivery menus", note: "QSR chains and delivery apps, 16,000+ stores a week." },
  { name: "Job boards", note: "Indeed across 5 countries, 1.39M postings a week." },
  { name: "Real estate", note: "Swiss portals: ImmoScout24, Homegate, Newhome, Urbanhome, ge.ch." },
  { name: "Amazon · Walmart", note: "On request · product and search pages" },
  { name: "Professional profiles", note: "Company and profile data at enterprise scale, on request." },
];

const STEPS = [
  { tag: "01 · POST /jobs", t: "Submit the product", d: "Send a shop id, item id and region. Batch as many as you like; each job gets an id back immediately." },
  { tag: "02 · we collect", t: "Real devices, in-country", d: "Our device fleet and country-specific mobile proxies fetch the page the way a shopper would. Median 10–50 s per region; 1–3 min in Taiwan." },
  { tag: "03 · GET /jobs/{id}", t: "Clean JSON, billed on success", d: "Full product page in one schema for all markets. A failed job is never on your invoice." },
];

const BUILT_FOR = [
  { t: "E-commerce market intelligence", d: "SKU-level share, pricing and assortment across SEA, Taiwan and Brazil." },
  { t: "Price monitoring and repricing", d: "Per-variant prices, vouchers and stock, fresh enough to reprice on." },
  { t: "Brand protection", d: "Listing, seller and price data to spot counterfeits and grey sellers." },
  { t: "Data companies and resellers", d: "A white-label backend for the platforms your own crawlers can't keep up with." },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className="fsx-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4B3FA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </span>
  );
}

export default function Home() {
  return (
    <main className="fsx-page">
      {/* HERO */}
      <section className="fsx-violet">
        <div className="fsx-wrap fsx-row" style={{ padding: "96px 24px 88px", gap: 48, alignItems: "center" }}>
          <div className="fsx-stack" style={{ flex: "1 1 520px", minWidth: 0, gap: 28 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
              <div style={{ width: 8, background: "#D6CEFF", borderRadius: 2, flex: "none" }} />
              <h1 className="fsx-h1">Web data at scale.</h1>
            </div>
            <p style={{ margin: 0, fontSize: 22, lineHeight: 1.45, color: "#E4DFFF", maxWidth: 640 }}>
              Scraping APIs and anti-bot infrastructure powering{" "}
              <strong style={{ color: "#fff", fontWeight: 700 }}>e-commerce market intelligence</strong>. One request
              returns a full product page: price per variant, live stock, vouchers, sold count and seller data.
            </p>
            <div className="fsx-row" style={{ gap: 14 }}>
              <Link className="fsx-btn fsx-btn-lg fsx-btn-white" href="/contact">
                Get a free trial key
              </Link>
              <Link className="fsx-btn fsx-btn-lg fsx-btn-ghost" href="/apis">
                See the Shopee API
              </Link>
            </div>
            <div className="fsx-row" style={{ gap: 24, fontSize: 14, color: "#D6CEFF", fontWeight: 600 }}>
              <span>Pay only for successful requests</span>
              <span>No card for the trial</span>
              <span>Sample data in 48–72 h</span>
            </div>
          </div>
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>
            <div className="fsx-code">
              <div className="fsx-dots">
                <i style={{ background: "#B0A6FF" }} />
                <i style={{ background: "#8A7CF5" }} />
                <i style={{ background: "#5F52C7" }} />
              </div>
              <pre>
                <span className="k">GET</span> /jobs/8f2c91  <span className="c">→ 200 OK</span>
                {`
{
  "status": "done",
  "region": "tw",
  "item": {
    "name": "Wireless Earbuds Pro 2",
    "models": [
      { "name": "Black", "price": 1290, "stock": 48 },
      { "name": "White", "price": 1290, "stock": 0 }
    ],
    "sold_count": 3421,
    "rating": 4.8,
    "vouchers": ["NT$100 off NT$999"],
    "shop": { "name": "SoundLab TW", "rating": 4.9 }
  },
  "billed": true
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section aria-label="Proof points" style={{ background: "#fff", borderBottom: "1px solid #E3E0F2" }}>
        <div className="fsx-wrap fsx-grid-4" style={{ padding: "36px 24px", gap: 24 }}>
          {PROOF.map((p) => (
            <div key={p.k} className="fsx-stat">
              <b>{p.k}</b>
              <span>{p.v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* THREE WAYS */}
      <section className="fsx-wrap fsx-stack" style={{ paddingTop: 96, paddingBottom: 32, gap: 40 }}>
        <div className="fsx-stack" style={{ gap: 12, maxWidth: 720 }}>
          <span className="fsx-eyebrow">Three ways to work with us</span>
          <h2 className="fsx-h2">Pick the shape that fits your product.</h2>
          <p className="fsx-lede">
            Same infrastructure underneath: real devices, in-country mobile proxies and human-paced scheduling. You
            choose how the data reaches you.
          </p>
        </div>
        <div className="fsx-grid-3">
          {WAYS.map((w) => (
            <article key={w.title} className="fsx-card" style={{ padding: 32, gap: 16 }}>
              <Icon>{w.icon}</Icon>
              <h3 className="fsx-h3">{w.title}</h3>
              <p className="fsx-p">{w.body}</p>
              <Link className="fsx-arrow" href={w.href}>
                {w.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* API GRID */}
      <section className="fsx-wrap fsx-stack" style={{ paddingTop: 64, paddingBottom: 64, gap: 32 }}>
        <div className="fsx-row" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <div className="fsx-stack" style={{ gap: 10, maxWidth: 640 }}>
            <span className="fsx-eyebrow">Ready-made APIs and pipelines</span>
            <h2 className="fsx-h2">Platforms we already run in production.</h2>
          </div>
          <Link className="fsx-arrow" href="/apis" style={{ marginTop: 0 }}>
            All APIs and field lists →
          </Link>
        </div>
        <div className="fsx-grid-4">
          <div className="fsx-card-uv" style={{ gridColumn: "span 2", padding: 24, gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22, fontWeight: 800 }}>Shopee Product Data API</span>
              <span className="fsx-pill fsx-pill-strong">LIVE</span>
            </div>
            <span style={{ fontSize: 15, color: "#E4DFFF", lineHeight: 1.5 }}>
              Full product page per request across TH · ID · MY · PH · VN · SG · TW · BR. Price and stock per variant,
              vouchers, sold count, ratings, shop data.
            </span>
          </div>
          {PLATFORMS.map((p) => (
            <div key={p.name} className="fsx-card-sm" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{p.name}</span>
                {p.live ? <span className="fsx-pill">LIVE</span> : null}
              </div>
              <span style={{ fontSize: 14, color: "#5B5676", lineHeight: 1.5 }}>{p.note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="fsx-white">
        <div className="fsx-wrap fsx-stack fsx-section" style={{ gap: 40 }}>
          <div className="fsx-stack" style={{ gap: 10, maxWidth: 640 }}>
            <span className="fsx-eyebrow">How it works</span>
            <h2 className="fsx-h2">Three calls. No scraper to maintain.</h2>
          </div>
          <div className="fsx-grid-3">
            {STEPS.map((s) => (
              <div key={s.tag} className="fsx-stack" style={{ gap: 12 }}>
                <span className="fsx-mono">{s.tag}</span>
                <h3 className="fsx-h3" style={{ fontSize: 20 }}>
                  {s.t}
                </h3>
                <p className="fsx-p" style={{ fontSize: 15 }}>
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUILT FOR */}
      <section className="fsx-wrap fsx-row fsx-section" style={{ gap: 48, alignItems: "flex-start" }}>
        <div className="fsx-stack" style={{ flex: "1 1 420px", minWidth: 0, gap: 14 }}>
          <span className="fsx-eyebrow">Built for</span>
          <h2 className="fsx-h2">Teams whose product is the data.</h2>
          <p className="fsx-p" style={{ fontSize: 17 }}>
            We act as a silent backend partner. Your brand, your customers, our infrastructure.
          </p>
        </div>
        <ul className="fsx-grid-2" style={{ flex: "1 1 520px", minWidth: 0, listStyle: "none", margin: 0, padding: 0, gap: 16 }}>
          {BUILT_FOR.map((b) => (
            <li key={b.t} className="fsx-card-sm">
              <strong style={{ fontSize: 17 }}>{b.t}</strong>
              <span style={{ fontSize: 14, color: "#5B5676", lineHeight: 1.5 }}>{b.d}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* FOUNDER CTA */}
      <section className="fsx-violet">
        <div className="fsx-wrap fsx-row" style={{ padding: "80px 24px", gap: 40, alignItems: "center" }}>
          <Image
            src="/team/shawon.jpg"
            alt="Md Khalid Mahmud Shawon, founder of Fastscraping"
            width={128}
            height={128}
            style={{ borderRadius: 16, objectFit: "cover", border: "3px solid #D6CEFF" }}
          />
          <div className="fsx-stack" style={{ flex: "1 1 480px", minWidth: 0, gap: 12 }}>
            <h2 className="fsx-h2" style={{ fontSize: 36 }}>
              Talk to the person who runs the pipelines.
            </h2>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "#E4DFFF" }}>
              Md Khalid Mahmud Shawon, founder. Replies within 24 hours at {COMPANY.email}. Free trial key, or a clean
              sample on a new platform within 48–72 hours.
            </p>
          </div>
          <div className="fsx-stack" style={{ gap: 12 }}>
            <Link className="fsx-btn fsx-btn-lg fsx-btn-white" href="/contact">
              Get a trial key
            </Link>
            <a className="fsx-btn fsx-btn-lg fsx-btn-ghost" href={BOOK_CALL_URL} target="_blank" rel="noopener">
              Book a 30-min call with Khalid
            </a>
            <Link href={TRIAL_URL} style={{ color: "#D6CEFF", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
              Already a client? Log in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
