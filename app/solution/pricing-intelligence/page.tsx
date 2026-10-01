import Link from "next/link";
import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";
import AnimatedNumber from "@/components/AnimatedNumber";
import AboutReveal from "@/components/AboutReveal";
import LivePriceIndex from "@/components/pricing/LivePriceIndex";
import PricingFaq from "@/components/pricing/PricingFaq";
import "../../styles/pricing.css";

export const metadata: Metadata = withShareCard({
  title: "Pricing intelligence",
  description:
    "SKU-level competitor price, promotion and stock data from the retailers, marketplaces and brand sites you compete with — matched to your catalog, checked, and delivered on your schedule.",
  alternates: { canonical: "/solution/pricing-intelligence" },
  openGraph: {
    title: "Pricing intelligence · Fastscraping",
    description:
      "See every competitor price before your customers do. Matched, checked and delivered on your schedule.",
    url: "/solution/pricing-intelligence",
    type: "website",
  },
});

const STATS = [
  { n: 60, u: "M+", t: "prices collected every day" },
  { n: 100, u: "+", t: "retailers and marketplaces covered" },
  { n: 365, u: "+", t: "days of history per SKU" },
  { n: 72, u: "h", t: "to your first free sample" },
];

const TEAMS = [
  { who: "Pricing teams", watch: "Matched competitor prices, promotions and price changes", risk: "An undercut runs for days before the next manual check catches it" },
  { who: "Category managers", watch: "Price position, stock and assortment by category", risk: "Range and markdown decisions made on half the market" },
  { who: "E-commerce managers", watch: "Hero SKUs before campaigns and promotions", risk: "A campaign launches against a price that has already changed" },
  { who: "Brand & MAP teams", watch: "Reseller prices against your minimum advertised price", risk: "Violations spread across channels before anyone flags them" },
  { who: "Data & BI teams", watch: "Dated price and availability snapshots", risk: "Gaps in price history and reports built on stale data" },
];

const FIELDS = [
  { k: "price", d: "Current selling price, as the shopper sees it" },
  { k: "list_price", d: "Was-price or RRP, so discounts are measurable" },
  { k: "promotion", d: "Deal labels, coupons, bundle and multi-buy offers" },
  { k: "in_stock", d: "Availability, plus stock counts where shown" },
  { k: "shipping · tax", d: "Landed cost, not just the sticker price" },
  { k: "seller · buy_box", d: "Who is selling, and who holds the buy box" },
  { k: "variant", d: "Size, colour and pack-size resolved per SKU" },
  { k: "match", d: "Your SKU matched by EAN, MPN or title, with a confidence score" },
];

const JSON_SAMPLE = `{
  "sku": "WH1000XM5",
  "match": { "method": "mpn+title", "confidence": 0.98 },
  "seller": "bestbuy.com",
  "price": 329.00,
  "list_price": 399.00,
  "currency": "USD",
  "promotion": "Fall Deal · ends Oct 6",
  "in_stock": true,
  "shipping": 0.00,
  "location": "ZIP 10001",
  "collected_at": "2026-10-01T06:00:11Z"
}`;

const STEPS = [
  { n: "01", when: "Day 1", t: "Share your list", d: "Send the competitors, SKUs and fields you care about. A 30-minute call, no slides." },
  { n: "02", when: "Day 2–3", t: "Free sample", d: "We collect a real sample from your sources so you can check coverage and match quality." },
  { n: "03", when: "Week 1", t: "Match & QA", d: "Products are matched to your catalog and every file passes 50+ automated checks." },
  { n: "04", when: "Week 2", t: "Live delivery", d: "Data lands on your schedule, with alerts on the price moves that matter." },
];

const HARD = [
  { n: "01", t: "Product matching", d: "The same product has a different title on every site. We match by EAN, MPN and model, then by title and attributes, and score every match." },
  { n: "02", t: "Location-specific prices", d: "Many retailers price by ZIP code or store. We collect from the locations you sell in, not a single default." },
  { n: "03", t: "Variants and pack sizes", d: "Price per colour, size and pack, resolved to the exact variant you compare against." },
  { n: "04", t: "JavaScript-rendered pages", d: "Prices that load after the page, behind clicks, tabs or infinite scroll, rendered in real browsers." },
  { n: "05", t: "Anti-bot protection", d: "Cloudflare, DataDome, PerimeterX and Akamai are included, at every layer, at no extra cost." },
  { n: "06", t: "Sites that change", d: "When a retailer redesigns, we notice and fix it. Your feed keeps running." },
];

const USES = [
  { t: "Undercut alerts", d: "A webhook the moment a competitor drops below your price on a SKU you care about." },
  { t: "MAP monitoring", d: "Flag resellers advertising below your minimum price, with a screenshot-ready record." },
  { t: "Promotion tracking", d: "See who is discounting, how deep, and for how long, across every channel." },
  { t: "Dynamic pricing input", d: "A clean, matched feed your repricing engine can trust, refreshed as often as it runs." },
  { t: "Assortment gaps", d: "Products your competitors stock that you don't, and the prices they sell them at." },
  { t: "Price history & trends", d: "A year or more of history per SKU to model seasonality and elasticity." },
];

const DESTS = ["REST API", "Webhook", "Amazon S3", "SFTP", "Snowflake", "BigQuery", "Postgres", "CSV · XLSX · JSON"];

const TERMS = [
  { k: "Cadence", v: "Real-time to monthly" },
  { k: "Coverage", v: "Any retailer, marketplace or brand site" },
  { k: "Quality", v: "50+ QA checks per file" },
  { k: "Anti-bot sources", v: "Included, no surcharge" },
  { k: "First sample", v: "Within 48–72 hours" },
];

export default function PricingIntelligencePage() {
  return (
    <div className="pi">
      <AboutReveal />

      {/* ===================== HERO ===================== */}
      <section className="pi-hero">
        <div className="container">
          <div className="pi-crumb">
            <span className="dot" />
            <Link href="/solutions">Solutions</Link>
            <span className="sep">/</span>
            <span>Pricing intelligence</span>
          </div>

          <div className="pi-hero-top">
            <h1 className="pi-h1">
              See every competitor price <em>before your customers do.</em>
            </h1>
            <div className="pi-hero-right">
              <p className="pi-lead">
                SKU-level price, promotion and stock data from the retailers,
                marketplaces and brand sites you compete with. Matched to your
                catalog, checked, and delivered on your schedule.
              </p>
              <div className="pi-hero-cta">
                <Link href="/contact" className="btn btn-primary">
                  Get a free sample <span className="arrow">→</span>
                </Link>
                <Link href="#fields" className="btn btn-ghost">
                  See the data
                </Link>
              </div>
            </div>
          </div>

          <LivePriceIndex />

          <div className="pi-stats" data-reveal>
            {STATS.map((s) => (
              <div className="pi-stat" key={s.t}>
                <div className="pi-stat-v">
                  <AnimatedNumber to={s.n} />
                  <span className="u">{s.u}</span>
                </div>
                <div className="pi-stat-l">{s.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        {/* ===================== WHO IT'S FOR ===================== */}
        <section className="pi-sec">
          <div className="pi-head" data-reveal>
            <h2 className="pi-h2">
              Built for the teams who <em>pay for stale prices.</em>
            </h2>
            <p className="pi-head-note">
              A price you see a day late is a margin you have already lost.
            </p>
          </div>
          <div className="pi-table">
            <div className="pi-table-cols">
              <span>Team</span>
              <span>What they watch</span>
              <span>What stale data costs</span>
            </div>
            {TEAMS.map((t, i) => (
              <div className="pi-table-row" key={t.who} data-reveal data-delay={i * 100}>
                <div className="pi-who">{t.who}</div>
                <div className="pi-cell">{t.watch}</div>
                <div className="pi-cell">{t.risk}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== WHAT YOU GET ===================== */}
        <section className="pi-sec" id="fields" style={{ scrollMarginTop: 90 }}>
          <h2 className="pi-h2" data-reveal style={{ maxWidth: "18em" }}>
            One clean record per product, <em>per source, per run.</em>
          </h2>
          <div className="pi-get">
            <div data-reveal>
              {FIELDS.map((f) => (
                <div className="pi-field" key={f.k}>
                  <span className="k">{f.k}</span>
                  <span className="d">{f.d}</span>
                </div>
              ))}
              <p className="pi-fields-note">
                Plus 365+ days of history per SKU per source, and daily delta
                files that contain only what moved.
              </p>
            </div>
            <div className="pi-json" data-reveal data-delay="120">
              <div className="pi-json-head">
                <span>
                  <span className="m">GET</span> /v1/prices?sku=WH1000XM5
                </span>
                <span>200 OK · 142ms</span>
              </div>
              <pre>{JSON_SAMPLE}</pre>
            </div>
          </div>
        </section>

        {/* ===================== HOW IT WORKS ===================== */}
        <section className="pi-sec">
          <div className="pi-head" data-reveal>
            <h2 className="pi-h2">
              From a list of competitors <em>to a live feed in two weeks.</em>
            </h2>
          </div>
          <div className="pi-timeline" data-journey>
            <div className="pi-timeline-base" />
            <div className="pi-timeline-line" data-journey-line />
            <div className="pi-steps">
              {STEPS.map((s, i) => (
                <div className="pi-step" key={s.n} data-reveal data-delay={i * 100}>
                  <span className="dot" />
                  <div className="pi-step-meta">
                    <span className="n">{s.n}</span>
                    <span className="when">{s.when}</span>
                  </div>
                  <div className="pi-step-t">{s.t}</div>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== THE HARD PART ===================== */}
        <section className="pi-sec">
          <div className="pi-hard">
            <div className="pi-hard-title" data-reveal>
              <h2 className="pi-h2">
                The hard part of price data <em>isn&apos;t the price.</em>
              </h2>
              <p>
                It&apos;s getting the right price, for the right product, from a
                site that doesn&apos;t want to give it to you. That&apos;s the
                work we take off your plate.
              </p>
            </div>
            <div>
              {HARD.map((h, i) => (
                <div className="pi-hard-item" key={h.n} data-reveal data-delay={i * 100}>
                  <span className="n">{h.n}</span>
                  <div>
                    <div className="t">{h.t}</div>
                    <p>{h.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== USE CASES ===================== */}
        <section className="pi-sec">
          <h2 className="pi-h2" data-reveal>
            What clients do with it.
          </h2>
          <div className="pi-uses">
            {USES.map((u, i) => (
              <div className="pi-use" key={u.t} data-reveal data-delay={i * 100}>
                <div className="t">{u.t}</div>
                <p>{u.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== ENGAGEMENT ===================== */}
        <section className="pi-sec">
          <div className="pi-eng">
            <div data-reveal>
              <h2 className="pi-h2">
                Your schedule, <em>your format.</em>
              </h2>
              <p className="pi-eng-lead">
                Every engagement is scoped to your SKUs and sources. No seat
                licences, no dashboard you have to log into.
              </p>
              <div className="pi-dests">
                {DESTS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>
            <div className="pi-terms" data-reveal data-delay="120">
              {TERMS.map((t) => (
                <div className="pi-term" key={t.k}>
                  <span className="k">{t.k}</span>
                  <span className="v">{t.v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== FAQ ===================== */}
        <section className="pi-sec" style={{ borderBottom: "none" }}>
          <div className="pi-faq">
            <h2 className="pi-h2" data-reveal>
              Questions pricing teams ask.
            </h2>
            <PricingFaq />
          </div>
        </section>
      </div>
    </div>
  );
}
