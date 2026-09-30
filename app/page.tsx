import Link from "next/link";
import LiveConsole from "@/components/LiveConsole";
import ReliabilityVisual from "@/components/ReliabilityVisual";
import AnimatedNumber from "@/components/AnimatedNumber";
import KMAvatar from "@/components/KMAvatar";
import "./styles/home-responsive.css";

/// The brands under "Active pipelines for". Mirrored by MARQUEE in
/// prisma/seed.ts, which puts each one in the dashboard catalogue.
const MARQUEE = [
  { name: "StubHub", tick: "ticketing" },
  { name: "SeatGeek", tick: "ticketing" },
  { name: "Indeed", tick: "jobs" },
  { name: "Glassdoor", tick: "jobs" },
  { name: "LinkedIn", tick: "b2b" },
  { name: "Starbucks", tick: "restaurant" },
  { name: "McDonald's", tick: "restaurant" },
  { name: "DoorDash", tick: "delivery" },
  { name: "Amazon", tick: "e-com" },
  { name: "Walmart", tick: "e-com" },
  { name: "Homegate", tick: "real estate" },
  { name: "ImmoScout24", tick: "real estate" },
  { name: "Urbanhome", tick: "real estate" },
  { name: "Newhome", tick: "real estate" },
  { name: "Flatfox", tick: "real estate" },
  { name: "Tutti", tick: "real estate" },
];

export default function HomePage() {
  return (
    <>
      {/* ===================== HERO ===================== */}
      <section className="hero" data-screen-label="01 Hero">
        <div className="container hero-grid">
          <div className="hero-left">
            <h1 className="display">
              We handle your{" "}
              <span className="br">
                <em>web scraping</em> pipeline.
              </span>
            </h1>
            <p className="hero-sub">
              Turn any public website into accessible,{" "}
              <strong>structured data</strong> with our powerful web scraping
              API, built to handle proxies, browser automation, and CAPTCHA
              challenges automatically.
            </p>
            <div className="hero-bullets">
              <span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Bypass Cloudflare &amp; Captchas
              </span>
              <span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Large-scale on demand
              </span>
              <span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                No proxy hassles
              </span>
            </div>
            <div className="hero-cta">
              <Link href="#contact" className="btn btn-primary">
                Free strategy call
                <span className="arrow">→</span>
              </Link>
              <Link href="#solutions" className="btn btn-ghost">
                View solutions
              </Link>
            </div>
            <div className="hero-meta">
              <KMAvatar variant="small" />
              <div>
                <div style={{ color: "var(--ink)", fontWeight: 500 }}>
                  Khalid Mahmud Shawon
                </div>
                <div>Founder · Replies in &lt; 24h</div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <LiveConsole />
            <div className="pipeline">
              <span className="node">
                <span className="badge">SRC</span> Target site
              </span>
              <span className="arrow"></span>
              <span className="node">
                <span className="badge">FS</span> Fastscraping
              </span>
              <span className="arrow"></span>
              <span className="node">
                <span className="badge">OUT</span> Your warehouse
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== MARQUEE ===================== */}
      <section className="marquee">
        <div className="container">
          <div className="marquee-label">Active pipelines for</div>
        </div>
        {/* Listed once and rendered twice — the track needs a second copy to
            loop seamlessly, and two hand-written copies drift apart the moment
            someone adds a brand to one of them.

            Keep in step with MARQUEE in prisma/seed.ts: every brand here is a
            service in the dashboard catalogue, so what we advertise and what a
            client can see stay the same list. */}
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((c, i) => (
            <span key={i} className="platform-chip">
              {c.name} <span className="tick">{c.tick}</span>
            </span>
          ))}
        </div>
      </section>

      {/* ===================== SOLUTIONS ===================== */}
      <section className="block" id="solutions" data-screen-label="02 Solutions">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">What we do</span>
              <h2 className="display" style={{ marginTop: 18 }}>
                Data collection, <em>built for scale.</em>
              </h2>
            </div>
            <p>
              Our managed scrapers and delivery pipelines unlock any public
              website — whatever the scale or the defenses in front of it — and
              hand you clean, structured data you can actually build on.
            </p>
          </div>

          <div className="services">
            <article className="svc wide">
              <div className="svc-num">01 · Managed</div>
              <div className="svc-title">Managed scrapers</div>
              <div className="svc-desc">
                We build, deploy, monitor and maintain the scrapers end to end.
                You get clean data on a schedule and never write a line of code.
              </div>
              <div className="svc-foot">
                <Link href="/services">
                  Learn more <span className="arr">→</span>
                </Link>
                <div className="svc-tags">
                  <span>fully owned</span>
                  <span>zero code</span>
                </div>
              </div>
            </article>

            <article className="svc wide">
              <div className="svc-num">02 · Structured</div>
              <div className="svc-title">Structured data</div>
              <div className="svc-desc">
                We turn messy pages into predictable JSON or CSV — only the
                fields you care about, not hundreds of raw HTML tags and scripts.
              </div>
              <div className="svc-foot">
                <Link href="/services">
                  Learn more <span className="arr">→</span>
                </Link>
                <div className="svc-tags">
                  <span>JSON / CSV</span>
                  <span>clean fields</span>
                </div>
              </div>
            </article>

            <article className="svc wide">
              <div className="svc-num">03 · Bulk</div>
              <div className="svc-title">Bulk &amp; async</div>
              <div className="svc-desc">
                Send millions of requests without babysitting them. We own the
                queue, retries, pacing and back-off, so throughput stays high.
              </div>
              <div className="svc-foot">
                <Link href="/services">
                  Learn more <span className="arr">→</span>
                </Link>
                <div className="svc-tags">
                  <span>millions / day</span>
                  <span>auto-retry</span>
                </div>
              </div>
            </article>

            <article className="svc wide">
              <div className="svc-num">04 · Delivery</div>
              <div className="svc-title">Delivery &amp; monitoring</div>
              <div className="svc-desc">
                Scheduled pipelines with quality checks and health alerts,
                delivered straight to your API, an SFTP drop or an S3 bucket.
              </div>
              <div className="svc-foot">
                <Link href="/services">
                  Learn more <span className="arr">→</span>
                </Link>
                <div className="svc-tags">
                  <span>API · SFTP · S3</span>
                  <span>monitored</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ===================== TARGETS ===================== */}
      <section
        className="block"
        style={{ paddingTop: 0 }}
        data-screen-label="03 Targets"
      >
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Supported targets</span>
              <h2 className="display" style={{ marginTop: 18 }}>
                Structured data, <em>source by source.</em>
              </h2>
            </div>
            <p>
              We already run these in production — each source turned into
              clean, predictable records with only the fields you need. New
              targets go live every week.
            </p>
          </div>

          <div className="targets">
            <article className="target-card">
              <div className="target-mark">S</div>
              <div>
                <div className="target-name">
                  Shopee <span className="target-cat">e-commerce</span>
                </div>
                <p className="target-desc">
                  Product, pricing and seller data across all eight
                  Southeast-Asian markets.
                </p>
              </div>
            </article>

            <article className="target-card">
              <div className="target-mark">T</div>
              <div>
                <div className="target-name">
                  Temu <span className="target-cat">e-commerce</span>
                </div>
                <p className="target-desc">
                  Full product detail and pricing by good_id, across every Temu
                  region.
                </p>
              </div>
            </article>

            <article className="target-card">
              <div className="target-mark">A</div>
              <div>
                <div className="target-name">
                  Amazon <span className="target-cat">e-commerce</span>
                </div>
                <p className="target-desc">
                  Search rankings, product detail, offers and Buy Box by ASIN.
                </p>
              </div>
            </article>

            <article className="target-card">
              <div className="target-mark">W</div>
              <div>
                <div className="target-name">
                  Walmart <span className="target-cat">e-commerce</span>
                </div>
                <p className="target-desc">
                  Product and search results at scale, by item ID or keyword.
                </p>
              </div>
            </article>

            <article className="target-card">
              <div className="target-mark">H</div>
              <div>
                <div className="target-name">
                  Homegate <span className="target-cat">real estate</span>
                </div>
                <p className="target-desc">
                  Swiss property listings and complete real-estate feeds.
                </p>
              </div>
            </article>

            <article className="target-card">
              <div className="target-mark">NH</div>
              <div>
                <div className="target-name">
                  All Nippon Airways <span className="target-cat">travel</span>
                </div>
                <p className="target-desc">
                  Domestic flight fares, schedules and seat availability.
                </p>
              </div>
            </article>

            <article className="target-card">
              <div className="target-mark">in</div>
              <div>
                <div className="target-name">
                  LinkedIn <span className="target-cat">b2b</span>
                </div>
                <p className="target-desc">
                  Company and professional profiles for B2B enrichment.
                </p>
              </div>
            </article>

            <article className="target-card">
              <div className="target-mark">I</div>
              <div>
                <div className="target-name">
                  Indeed <span className="target-cat">jobs</span>
                </div>
                <p className="target-desc">
                  Job listings, salaries and employer data for hiring signals.
                </p>
              </div>
            </article>

            <article className="target-card">
              <div className="target-mark">SH</div>
              <div>
                <div className="target-name">
                  StubHub <span className="target-cat">ticketing</span>
                </div>
                <p className="target-desc">
                  Live event inventory and real-time ticket pricing.
                </p>
              </div>
            </article>

            <article className="target-card">
              <div className="target-mark">DD</div>
              <div>
                <div className="target-name">
                  DoorDash <span className="target-cat">delivery</span>
                </div>
                <p className="target-desc">
                  Store menus, item pricing and delivery availability.
                </p>
              </div>
            </article>

            <article className="target-card">
              <div className="target-mark">St</div>
              <div>
                <div className="target-name">
                  Starbucks <span className="target-cat">restaurant</span>
                </div>
                <p className="target-desc">
                  Store locations, live menu items and regional pricing.
                </p>
              </div>
            </article>

            <article className="target-card">
              <div className="target-mark">IS</div>
              <div>
                <div className="target-name">
                  ImmoScout24 <span className="target-cat">real estate</span>
                </div>
                <p className="target-desc">
                  Property listings across the German-speaking DACH region.
                </p>
              </div>
            </article>
          </div>

          <div style={{ marginTop: 32 }}>
            <Link href="/services" className="btn btn-ghost">
              Browse the full catalogue
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== USE CASES ===================== */}
      <section
        className="block"
        style={{ paddingTop: 0 }}
        id="use-cases"
        data-screen-label="04 Use cases"
      >
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Use cases</span>
              <h2 className="display" style={{ marginTop: 18 }}>
                Put the data <em>to work.</em>
              </h2>
            </div>
            <p>
              The feed is only the beginning. Here&apos;s what teams build on top
              of the data we deliver — across pricing, research, hiring and more.
            </p>
          </div>

          <div className="diff-grid">
            <article className="diff-card">
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8Z" />
                  <circle cx="7" cy="7" r="1.4" />
                </svg>
              </div>
              <h3>E-commerce &amp; pricing.</h3>
              <p>
                Track prices, stock and rankings across marketplaces and react
                before your competitors do — by ASIN, item ID or keyword.
              </p>
              <div className="tags">
                <span>price tracking</span>
                <span>buy box</span>
                <span>stock</span>
              </div>
            </article>

            <article className="diff-card">
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 3v18h18" />
                  <path d="M7 16v-3M12 16V8M17 16v-6" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Market research.</h3>
              <p>
                Feed dashboards and models with fresh catalog, review and demand
                data — the raw material for pricing and product decisions.
              </p>
              <div className="tags">
                <span>catalog</span>
                <span>reviews</span>
                <span>demand</span>
              </div>
            </article>

            <article className="diff-card">
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="3" width="16" height="18" rx="1.5" />
                  <path d="M9 21v-4h6v4" />
                  <path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Real-estate intelligence.</h3>
              <p>
                Automate listing, price and availability collection across
                property portals, and watch a whole market move in one feed.
              </p>
              <div className="tags">
                <span>listings</span>
                <span>price</span>
                <span>availability</span>
              </div>
            </article>

            <article className="diff-card">
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </svg>
              </div>
              <h3>Recruitment signals.</h3>
              <p>
                Monitor job postings, salaries and employer data to read hiring
                trends and surface talent and sales intelligence early.
              </p>
              <div className="tags">
                <span>postings</span>
                <span>salaries</span>
                <span>employers</span>
              </div>
            </article>

            <article className="diff-card">
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                  <path d="M13 5v14" strokeDasharray="2 2" />
                </svg>
              </div>
              <h3>Ticketing &amp; events.</h3>
              <p>
                Watch event inventory and ticket prices in real time to power
                resale, price-setting and demand forecasting.
              </p>
              <div className="tags">
                <span>inventory</span>
                <span>resale</span>
                <span>live pricing</span>
              </div>
            </article>

            <article className="diff-card">
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>B2B &amp; lead data.</h3>
              <p>
                Enrich your CRM with company and professional profiles at scale,
                so sales and ops always work from current data.
              </p>
              <div className="tags">
                <span>profiles</span>
                <span>enrichment</span>
                <span>CRM</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ===================== GEOTARGETING ===================== */}
      <section
        className="block"
        style={{ paddingTop: 0 }}
        id="coverage"
        data-screen-label="05 Geotargeting"
      >
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Geotargeting</span>
              <h2 className="display" style={{ marginTop: 18 }}>
                Data as a local <em>would see it.</em>
              </h2>
            </div>
            <p>
              We collect from inside the market you care about — real in-region
              devices and residential IPs — so prices, rankings and availability
              come back exactly as a local user sees them. No VPN artifacts, no
              wrong-currency noise.
            </p>
          </div>

          <div className="geo-panel">
            <div className="geo-stats">
              <div className="geo-stat">
                <div className="v">15+</div>
                <div className="l">markets in production today</div>
              </div>
              <div className="geo-stat">
                <div className="v">3</div>
                <div className="l">continents — Asia, Europe &amp; the Americas</div>
              </div>
              <div className="geo-stat">
                <div className="v">100%</div>
                <div className="l">in-region collection, real devices</div>
              </div>
            </div>
            <div className="geo-regions">
              <span className="geo-chip">Brazil</span>
              <span className="geo-chip">Mexico</span>
              <span className="geo-chip">Argentina</span>
              <span className="geo-chip">United States</span>
              <span className="geo-chip">Japan</span>
              <span className="geo-chip">Singapore</span>
              <span className="geo-chip">Thailand</span>
              <span className="geo-chip">Vietnam</span>
              <span className="geo-chip">Indonesia</span>
              <span className="geo-chip">Malaysia</span>
              <span className="geo-chip">Philippines</span>
              <span className="geo-chip">Taiwan</span>
              <span className="geo-chip">Switzerland</span>
              <span className="geo-chip">Germany</span>
              <span className="geo-chip">Austria</span>
              <span className="geo-chip">United Kingdom</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== DIFFERENTIATORS ===================== */}
      <section
        className="block"
        style={{ paddingTop: 0 }}
        id="why-us"
        data-screen-label="06 Why us"
      >
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Why Fastscraping</span>
              <h2 className="display" style={{ marginTop: 18 }}>
                We&apos;re not a proxy provider. <em>We&apos;re your team.</em>
              </h2>
            </div>
            <p>
              We&apos;re not a tool you have to operate. We&apos;re not a
              scraping marketplace. We&apos;re a full data extraction team —
              with the depth to solve what others can&apos;t, the operational
              maturity to keep things running, and the discretion to do it under
              your brand.
            </p>
          </div>

          <div className="diff-grid">
            <article className="diff-card">
              <div className="icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M12 2 4 6v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-4Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3>Reliable on the hard sources.</h3>
              <p>
                Public pages behind Cloudflare, DataDome, PerimeterX or Akamai
                are where most vendors give up and where collection quietly
                breaks. Keeping those feeds stable is our engineering specialty.
              </p>
              <div className="tags">
                <span>Cloudflare</span>
                <span>DataDome</span>
                <span>PerimeterX</span>
                <span>Akamai</span>
              </div>
            </article>

            <article className="diff-card">
              <div className="icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3>Recurring data pipelines.</h3>
              <p>
                Not one-off scripts. We build infrastructure for daily, weekly
                or monthly data delivery with quality checks and auto-adaptation
                when sites change.
              </p>
              <div className="tags">
                <span>scheduled</span>
                <span>auto-adapt</span>
                <span>quality</span>
              </div>
            </article>

            <article className="diff-card">
              <div className="icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3>Real browser sessions.</h3>
              <p>
                We render pages in genuine browser environments — correct TLS,
                real JavaScript execution, consistent session state — so a
                public page returns what a visitor would see. Not just rotating
                IPs.
              </p>
              <div className="tags">
                <span>canvas &amp; webgl</span>
                <span>tls match</span>
                <span>aged cookies</span>
              </div>
            </article>

            <article className="diff-card hot">
              <div className="icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <h3>Silent backend vendor.</h3>
              <p>
                We operate invisibly behind your brand. Your clients never know
                we exist. White-label partnership model. Zero attribution. Total
                discretion.
              </p>
              <div className="tags">
                <span>white label</span>
                <span>b2b partner</span>
                <span>zero attribution</span>
              </div>
            </article>

            <article className="diff-card">
              <div className="icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3>Enterprise security.</h3>
              <p>
                GDPR-compliant operations. Secure delivery via API, SFTP or S3.
                Encrypted pipelines end-to-end. Audit-ready logs. Right to be
                forgotten honored at source.
              </p>
              <div className="tags">
                <span>GDPR</span>
                <span>encrypted</span>
                <span>audit-ready</span>
              </div>
            </article>

            <article className="diff-card">
              <div className="icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2h2" />
                  <path d="M9 8h6" />
                </svg>
              </div>
              <h3>One throat to choke.</h3>
              <p>
                One contract, one invoice, one Slack channel. No juggling a
                proxy vendor + a parser vendor + a monitoring vendor + an engineer.
                We own the whole stack.
              </p>
              <div className="tags">
                <span>1 contract</span>
                <span>1 invoice</span>
                <span>1 team</span>
              </div>
            </article>
          </div>

          <div className="compare">
            <div className="cmp-head">
              <h3>How we compare</h3>
              <div className="key">
                <span>vs the alternatives</span>
                <span style={{ color: "var(--hot)", letterSpacing: "0.04em" }}>
                  — their gap
                </span>
              </div>
            </div>

            <div className="row-c">
              <div className="vs">
                vs Grepsr <em>scraping platform</em>
              </div>
              <div className="note">
                Limited flexibility for complex scraping workflows.
              </div>
              <div className="mark">Rigid</div>
            </div>
            <div className="row-c">
              <div className="vs">
                vs Zyte <em>scraping API</em>
              </div>
              <div className="note">
                API-focused tools still require engineering setup on your side.
              </div>
              <div className="mark">DIY</div>
            </div>
            <div className="row-c">
              <div className="vs">
                vs Apify <em>actor marketplace</em>
              </div>
              <div className="note">
                Cookie-based actors get banned at scale. Not for production.
              </div>
              <div className="mark">Ban risk</div>
            </div>
            <div className="row-c">
              <div className="vs">
                vs Bright Data <em>proxy network</em>
              </div>
              <div className="note">
                Proxy-only — you still need a scraper, a parser, a team.
              </div>
              <div className="mark">Proxy only</div>
            </div>
            <div className="row-c">
              <div className="vs">
                vs In-house <em>your engineers</em>
              </div>
              <div className="note">
                Too expensive, breaks constantly, ties up your roadmap.
              </div>
              <div className="mark">Costly</div>
            </div>
            <div className="row-c">
              <div className="vs">
                vs Freelancers <em>upwork &amp; co.</em>
              </div>
              <div className="note">
                No scale, no reliability, no incident response at 3 a.m.
              </div>
              <div className="mark">No SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== ENTERPRISE ===================== */}
      <section
        className="block"
        style={{ paddingTop: 0 }}
        data-screen-label="07 Enterprise"
      >
        <div className="container">
          <div className="enterprise">
            <div className="enterprise-inner">
              <div>
                <span className="eyebrow">Enterprise</span>
                <h2 className="ent-head">
                  Enterprise-grade delivery, <em>without the overhead.</em>
                </h2>
                <p className="ent-lead">
                  When data feeds the business, &ldquo;mostly working&rdquo;
                  isn&apos;t enough. You get a dedicated team, real SLAs and
                  secure delivery — the reliability of an in-house data org
                  without the headcount or the enterprise invoice.
                </p>
                <Link href="#contact" className="btn btn-primary">
                  Talk to Khalid <span className="arrow">→</span>
                </Link>
              </div>

              <ul className="ent-list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Dedicated team and a private Slack channel
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  SLAs on delivery, uptime and turnaround
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  White-label — we run silently behind your brand
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Secure delivery via API, SFTP or S3, encrypted end to end
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  GDPR-compliant, audit-ready pipelines
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Millions of requests a day, handled asynchronously
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== NUMBERS ===================== */}
      <section
        className="block"
        style={{ paddingTop: 0 }}
        data-screen-label="08 Numbers"
      >
        <div className="container">
          <div className="numbers-block">
            <div className="numbers-head">
              <h2>
                Numbers that{" "}
                <em style={{ color: "var(--accent)" }}>
                  speak
                </em>
                .
              </h2>
              <div className="meta">
                Live snapshot from active client engagements
                <br />
                updated continuously · last sync: 14:08 UTC
              </div>
            </div>
            <div className="numbers-grid">
              <div className="num">
                <div className="v">
                  <AnimatedNumber to={24} />
                  <em>.3M</em>
                </div>
                <div className="l">Records delivered daily</div>
                <div className="s">Ticketing &amp; pricing combined</div>
              </div>
              <div className="num">
                <div className="v">
                  <AnimatedNumber to={99} />
                  <em>.7%</em>
                </div>
                <div className="l">Delivery success rate</div>
                <div className="s">Including sources behind Cloudflare, DataDome, PerimeterX</div>
              </div>
              <div className="num">
                <div className="v">
                  <AnimatedNumber to={50} suffix="+" />
                </div>
                <div className="l">Platforms in production</div>
                <div className="s">Adding new sources weekly</div>
              </div>
              <div className="num">
                <div className="v">
                  <AnimatedNumber to={24} suffix="+" />
                </div>
                <div className="l">Months avg. client tenure</div>
                <div className="s">We don&apos;t run one-off scripts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIALS ===================== */}
      <section
        className="block"
        style={{ paddingTop: 0 }}
        id="clients"
        data-screen-label="09 Clients"
      >
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Trusted by</span>
              <h2 className="display" style={{ marginTop: 18 }}>
                Real partnerships. <em>Real outcomes.</em>
              </h2>
            </div>
            <p>
              Quotes from active production engagements — clients we ship data
              to every week. Average tenure is over two years; some have been
              with us since 2022.
            </p>
          </div>

          <div className="testimonials">
            <article className="testimonial big">
              <div className="quote-mark">&quot;</div>
              <p className="quote">
                Most likely no one is able to do it except you. We will see :-)
              </p>
              <div className="who">
                <div className="av">AM</div>
                <div>
                  <div className="name">Adrian Mayer</div>
                  <div className="role">Founder, TheDataHive</div>
                </div>
              </div>
              <div className="project">
                Project · Switzerland real-estate APIs
              </div>
            </article>

            <article className="testimonial small">
              <div className="quote-mark">&quot;</div>
              <p className="quote">
                I&apos;m satisfied with the results for today, so you can add a
                $400 setup fee to the next invoice. Thank you for your hard
                work.
              </p>
              <div className="who">
                <div className="av">SV</div>
                <div>
                  <div className="name">Scott Vahey</div>
                  <div className="role">Owner, Ficstar</div>
                </div>
              </div>
              <div className="project">Project · StubHub pipeline</div>
            </article>

            <article className="testimonial small">
              <div className="quote-mark">&quot;</div>
              <p className="quote">
                You&apos;re doing a great job with the Indeed US numbers over
                the last couple months. Thank you for your efforts — much
                appreciated!
              </p>
              <div className="who">
                <div className="av">SV</div>
                <div>
                  <div className="name">Scott Vahey</div>
                  <div className="role">Owner, Ficstar</div>
                </div>
              </div>
              <div className="project">Project · Indeed US pipeline</div>
            </article>
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section
        className="block"
        style={{ paddingTop: 0 }}
        id="contact"
        data-screen-label="10 CTA"
      >
        <div className="container">
          <div className="cta">
            <div>
              <span className="eyebrow">Get started</span>
              <h2 style={{ marginTop: 18 }}>
                Ready to scale your <em>data pipeline?</em>
              </h2>
              <p>
                Tell us your target platforms and volume. We&apos;ll send you a
                free sample within 48–72 hours, and we&apos;ll match or beat
                your current vendor&apos;s pricing — with better quality and
                coverage.
              </p>
              <div className="hero-bullets" style={{ marginTop: 28 }}>
                <span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  48–72h sample
                </span>
                <span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Free consultation
                </span>
                <span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  No commitment
                </span>
              </div>
            </div>

            <div className="cta-card">
              <div className="label">Direct line</div>
              <div className="person">
                <KMAvatar variant="large" />
                <div>
                  <div className="n">Md Khalid Mahmud Shawon</div>
                  <div className="r">Founder · Web data engineering</div>
                </div>
              </div>
              <div className="meta-row">
                <span className="k">Email</span>
                <span
                  className="v"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}
                >
                  khalid@fastscraping.com
                </span>
              </div>
              <div className="meta-row">
                <span className="k">Response time</span>
                <span className="v">&lt; 24 hours</span>
              </div>
              <div className="meta-row">
                <span className="k">First call</span>
                <span className="v">30 min · no slides</span>
              </div>
              <div className="meta-row">
                <span className="k">Sample data</span>
                <span className="v">Within 48–72 hours</span>
              </div>
              <div className="actions">
                <a href="/contact" className="btn btn-accent">
                  Book a call
                </a>
                <a href="/contact#letter" className="btn btn-ghost">
                  Send brief
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
