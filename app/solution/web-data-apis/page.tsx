import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";
import AboutReveal from "@/components/AboutReveal";
import ApiConsole from "@/components/wda/ApiConsole";
import ApiCatalog from "@/components/wda/ApiCatalog";
import ShipExplorer from "@/components/wda/ShipExplorer";
import DevCode from "@/components/wda/DevCode";
import ResponseFormats from "@/components/wda/ResponseFormats";
import GeoSwitcher from "@/components/wda/GeoSwitcher";
import WdaFaq from "@/components/wda/WdaFaq";
import "../../styles/web-data-apis.css";

export const metadata: Metadata = withShareCard({
  title: "Web data APIs",
  description:
    "Custom REST APIs for web data, built around your domain — fresh structured data from public sources through developer-ready endpoints. We run the collection behind the API.",
  alternates: { canonical: "/solution/web-data-apis" },
  openGraph: {
    title: "Web data APIs · Fastscraping",
    description:
      "The API the source site never gave you. Developer-ready REST endpoints for web data; we run the collection behind them.",
    url: "/solution/web-data-apis",
    type: "website",
  },
});

const PROOF = ["REST", "JSON / XML", "OpenAPI 3.1", "Sandbox keys", "Status monitoring"];
const INTRO = [
  { n: "01", t: "Your domain model", d: "We design the response around the entities and fields your application uses." },
  { n: "02", t: "Managed collection", d: "We handle the extraction infrastructure behind the endpoint." },
  { n: "03", t: "Developer-ready delivery", d: "Documented endpoints with authentication, rate limiting, monitoring and predictable responses." },
];
const CUSTOM = [
  { t: "Any source", d: "Bring the website or data source you need." },
  { t: "Your schema", d: "Return the fields and structure your application expects." },
  { t: "Your workflow", d: "Synchronous requests, async jobs, or push-based delivery." },
  { t: "Your documentation", d: "API docs and integration resources ship with the endpoint." },
];
const STEPS = [
  { n: "01", t: "Define the data", d: "Tell us the source, fields, geography, frequency and expected volume." },
  { n: "02", t: "We build the endpoint", d: "We design the endpoint and data model around your application." },
  { n: "03", t: "We operate the collection layer", d: "The extraction infrastructure runs behind the API." },
  { n: "04", t: "You consume the data", d: "Your application receives structured responses through a documented endpoint." },
];
const FLOW = [
  { step: "Start", n: "Your application", out: "API request", kind: "dark" },
  { step: "Fastscraping", n: "Fastscraping API", out: "Collection + extraction", kind: "" },
  { step: "Source", n: "Source website", out: "Raw page", kind: "src" },
  { step: "Fastscraping", n: "Fastscraping API", out: "Structured data", kind: "" },
  { step: "Done", n: "Your application", out: "JSON / XML", kind: "dark" },
];
const RELIAB = ["Authentication", "Rate limiting", "Monitoring", "Retries", "Source health checks", "Schema consistency", "Usage analytics"];
const USES = [
  { t: "E-commerce", d: "Use structured product and pricing data inside your analytics or product systems." },
  { t: "Market research", d: "Collect current web data for research, monitoring and internal intelligence." },
  { t: "Real estate", d: "Power property search, listing analysis and market datasets." },
  { t: "Recruitment", d: "Aggregate job and employer data for talent and labor-market workflows." },
  { t: "Travel", d: "Use supported travel sources for pricing and availability applications." },
  { t: "AI & data pipelines", d: "Bring current web information into models, analytics and data products." },
];
const WHY = [
  { n: "01", t: "Built around your product", d: "The endpoint follows your business logic and data model, not the source website's raw structure." },
  { n: "02", t: "Managed end to end", d: "We operate the collection and extraction layer underneath the API." },
  { n: "03", t: "One technical partner", d: "No separate vendors for scraper maintenance, data delivery and API operations." },
];
const INTEGR = ["OpenAPI 3.1", "Postman", "TypeScript", "REST", "JSON", "XML", "Webhooks"];
const PRICE = [
  { k: "Source", v: "Complexity and protection of the site" },
  { k: "Geography", v: "Number of markets" },
  { k: "Fields", v: "Depth of the schema" },
  { k: "Request volume", v: "Calls per month" },
  { k: "Refresh frequency", v: "How fresh data must be" },
];

export default function WebDataApisPage() {
  return (
    <div className="wda">
      <AboutReveal />

      {/* ===================== HERO ===================== */}
      <section className="wda-hero">
        <div className="container">
          <span className="wda-eyebrow"><span className="dot" />Web data APIs</span>
          <div className="wda-hero-top">
            <div className="wda-hero-l">
              <h1 className="wda-h1">
                The API the source site <em>never gave you.</em>
              </h1>
              <p className="wda-hero-tag">
                Custom REST APIs for web data, built around your domain, not the source website.
              </p>
            </div>
            <div className="wda-hero-r">
              <p className="wda-lead">
                Get fresh, structured data from public web sources through
                developer-ready REST endpoints. We handle collection, extraction,
                normalization and the infrastructure behind the API.
              </p>
              <div className="wda-hero-cta">
                <Link href="/contact" className="btn btn-primary">
                  Discuss your API <span className="arrow">→</span>
                </Link>
                <Link href="#developers" className="btn btn-ghost">
                  View documentation
                </Link>
              </div>
            </div>
          </div>
          <div className="wda-proof">
            {PROOF.map((p) => (
              <span key={p}><i />{p}</span>
            ))}
          </div>
          <ApiConsole />
        </div>
      </section>

      <div className="container">
        {/* 02 Intro */}
        <section className="wda-sec">
          <div className="wda-two" style={{ alignItems: "end" }}>
            <h2 className="wda-h2" data-reveal>
              From any source <em>to one clean API.</em>
            </h2>
            <div data-reveal data-delay="100">
              <p className="wda-lead" style={{ color: "var(--w-ink)" }}>
                Source websites were built for people, not your application.
              </p>
              <p className="wda-lead" style={{ marginTop: 10 }}>
                You shouldn&apos;t have to build a scraper, manage browser
                sessions, maintain parsers, or rework your integration every time
                a site changes. We turn the source into an API designed around the
                data your product actually needs.
              </p>
            </div>
          </div>
          <div className="wda-cards" style={{ marginTop: 44 }}>
            {INTRO.map((x, i) => (
              <div className="wda-card" key={x.n} data-reveal data-delay={i * 90}>
                <span className="n">{x.n}</span>
                <div className="t">{x.t}</div>
                <p>{x.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 03 Catalog */}
        <section className="wda-sec" id="catalog" style={{ scrollMarginTop: 90 }}>
          <ApiCatalog />
        </section>

        {/* 04 Custom band */}
        <section className="wda-sec">
          <div className="wda-band" data-reveal>
            <div className="wda-band-top">
              <div style={{ maxWidth: 560 }}>
                <div className="wda-eyebrow" style={{ color: "var(--w-green)" }}>Custom APIs</div>
                <h2 className="wda-h2" style={{ marginTop: 14 }}>Need a source that isn&apos;t in the catalog?</h2>
                <p className="wda-lead" style={{ marginTop: 14 }}>
                  We build the endpoint around your exact requirements: source,
                  fields, schema, request model, response format and delivery method.
                </p>
              </div>
              <Link href="/contact" className="btn btn-primary">
                Discuss a custom API <span className="arrow">→</span>
              </Link>
            </div>
            <div className="wda-band-feats">
              {CUSTOM.map((c) => (
                <div className="wda-band-feat" key={c.t}>
                  <div className="t">{c.t}</div>
                  <p>{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 05 Everything you need to ship */}
        <section className="wda-sec">
          <div className="wda-head" data-reveal>
            <h2 className="wda-h2">Everything you need <em>to ship.</em></h2>
            <p className="wda-head-note">Every endpoint arrives as a package. Pick an item to see what&apos;s inside.</p>
          </div>
          <ShipExplorer />
        </section>

        {/* 06 How it works */}
        <section className="wda-sec">
          <h2 className="wda-h2" data-reveal>One endpoint. <em>All the hard parts handled.</em></h2>
          <div className="wda-timeline" data-journey>
            <div className="wda-timeline-base" />
            <div className="wda-timeline-line" data-journey-line />
            <div className="wda-steps">
              {STEPS.map((s, i) => (
                <div className="wda-step" key={s.n} data-reveal data-delay={i * 90}>
                  <span className="dot" />
                  <div className="n">{s.n}</div>
                  <div className="t">{s.t}</div>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="wda-flow" data-reveal>
            <div className="wda-flow-grid">
              {FLOW.map((f, i) => (
                <div className={`wda-flow-node${f.kind ? " " + f.kind : ""}`} key={i}>
                  <span className="s">{f.step}</span>
                  <span className="nm">{f.n}</span>
                  <span className="out">→ {f.out}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 07 Developers (dark) */}
      <section className="wda-dev" id="developers">
        <div className="container" style={{ paddingTop: "clamp(64px,8vw,100px)", paddingBottom: "clamp(64px,8vw,100px)" }}>
          <div className="wda-dev-head" data-reveal>
            <div>
              <div className="wda-dev-eyebrow">For developers</div>
              <h2>A familiar API interface. Nothing unusual to learn.</h2>
            </div>
            <div className="wda-dev-cta">
              <a href="#developers" className="btn" style={{ background: "var(--paper)", color: "var(--w-ink)" }}>
                Read the API docs →
              </a>
              <Link href="/contact" className="btn btn-ghost">Get sandbox access →</Link>
            </div>
          </div>
          <DevCode />
        </div>
      </section>

      <div className="container">
        {/* 08 Response formats */}
        <section className="wda-sec">
          <ResponseFormats />
        </section>

        {/* 09 Production ready */}
        <section className="wda-sec">
          <div className="wda-two">
            <div data-reveal>
              <div className="wda-eyebrow" style={{ color: "var(--w-green)" }}>Production ready</div>
              <h2 className="wda-h2" style={{ marginTop: 14 }}>An API that stays useful <em>after launch.</em></h2>
              <p className="wda-lead" style={{ marginTop: 14, maxWidth: "44ch" }}>
                An API is only valuable if the data collection under it stays
                reliable. We manage the extraction layer behind the endpoint, so
                your team keeps building on a stable interface.
              </p>
            </div>
            <div className="wda-rows" data-reveal data-delay="100">
              {RELIAB.map((t, i) => (
                <div className="wda-row-rel" key={t}>
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="t">{t}</span>
                  <span className="d" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10 Geography */}
        <section className="wda-sec">
          <div className="wda-two center">
            <div data-reveal>
              <h2 className="wda-h2">Get data from the market <em>you care about.</em></h2>
              <p className="wda-lead" style={{ marginTop: 14, maxWidth: "44ch" }}>
                For supported sources, request data from the geography relevant to
                your application. Prices, rankings and availability come back as
                seen from that market.
              </p>
              <p style={{ marginTop: 12, fontSize: 13.5, color: "var(--w-meta)" }}>Supported regions vary by API.</p>
            </div>
            <GeoSwitcher />
          </div>
        </section>

        {/* 11 Use cases */}
        <section className="wda-sec">
          <h2 className="wda-h2" data-reveal>Built for data products <em>and workflows.</em></h2>
          <div className="wda-uses">
            {USES.map((u, i) => (
              <div className="wda-use" key={u.t} data-reveal data-delay={i * 90}>
                <div className="t">{u.t}</div>
                <p>{u.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 12 Why */}
        <section className="wda-sec">
          <h2 className="wda-h2" data-reveal style={{ maxWidth: "20em" }}>
            The API is yours to use. <em>We run the machinery behind it.</em>
          </h2>
          <div className="wda-why">
            {WHY.map((w, i) => (
              <div className="wda-why-item" key={w.n} data-reveal data-delay={i * 90}>
                <div className="n">{w.n}</div>
                <div className="t">{w.t}</div>
                <p>{w.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 13 Integrations */}
        <section className="wda-sec">
          <div className="wda-head" data-reveal>
            <h2 className="wda-h2" style={{ fontSize: "clamp(22px,2.3vw,28px)", maxWidth: "22em" }}>
              Plug it into the tools your team already uses.
            </h2>
            <Link href="#developers" style={{ fontSize: 15, fontWeight: 700 }}>Explore developer tools →</Link>
          </div>
          <div className="wda-integr">
            {INTEGR.map((n) => <span key={n}>{n}</span>)}
          </div>
        </section>

        {/* 14 Pricing */}
        <section className="wda-sec">
          <div className="wda-two">
            <div data-reveal>
              <h2 className="wda-h2">Tell us what you need. <em>We&apos;ll price the endpoint around the workload.</em></h2>
              <p className="wda-lead" style={{ marginTop: 14, maxWidth: "44ch" }}>
                Requirements vary by source, geography, fields, request volume and
                refresh frequency. Send yours and we&apos;ll recommend the right setup.
              </p>
              <div className="wda-hero-cta" style={{ marginTop: 22 }}>
                <Link href="/contact" className="btn btn-primary">Get a custom quote <span className="arrow">→</span></Link>
                <a href="mailto:khalid@fastscraping.com" className="btn btn-ghost">Talk to Khalid →</a>
              </div>
            </div>
            <div className="wda-rows" data-reveal data-delay="100">
              <div className="wda-rows-h">What shapes the price</div>
              {PRICE.map((p) => (
                <div className="wda-row-k" key={p.k}>
                  <span className="k">{p.k}</span>
                  <span className="v">{p.v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 15 FAQ */}
        <section className="wda-sec" style={{ borderBottom: "none" }}>
          <div className="wda-faq">
            <div className="wda-faq-intro" data-reveal>
              <h2 className="wda-h2">Questions, <em>answered plainly.</em></h2>
              <p>The things teams ask before their first request.</p>
              <div className="wda-faq-ask">
                <div className="wda-faq-ask-av">
                  <Image src="/team/shawon.jpg" alt="Md Khalid Mahmud Shawon" fill sizes="44px" style={{ objectFit: "cover", objectPosition: "center 25%" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, color: "var(--w-ink)" }}>Still have a question?</div>
                  <a href="mailto:khalid@fastscraping.com" style={{ fontSize: 14.5, fontWeight: 700 }}>Ask Khalid directly →</a>
                </div>
              </div>
            </div>
            <WdaFaq />
          </div>
        </section>

        {/* 16 Final CTA */}
        <section style={{ padding: "0 0 clamp(40px,5vw,56px)" }}>
          <div className="wda-final" data-reveal>
            <div>
              <div className="wda-final-eyebrow">Let&apos;s build it</div>
              <h2>Need web data behind an API?</h2>
              <p>
                Tell us the source, the fields you need and how your application
                will use the data. We&apos;ll map the endpoint and the
                infrastructure behind it.
              </p>
            </div>
            <div>
              <div className="wda-final-cta">
                <Link href="/contact" className="btn" style={{ background: "var(--paper)", color: "var(--w-ink)" }}>
                  Discuss your API <span className="arrow">→</span>
                </Link>
                <Link href="/contact" className="btn btn-ghost">Request a sample →</Link>
              </div>
              <div className="wda-final-ticks">
                <span>✓ Free consultation</span>
                <span>✓ Clear scope</span>
                <span>✓ Production-ready integration</span>
              </div>
            </div>
          </div>
        </section>

        {/* 17 Developer strip */}
        <section style={{ padding: "0 0 clamp(48px,6vw,72px)" }}>
          <div className="wda-strip">
            <span className="lbl">Build with Fastscraping APIs</span>
            <div className="wda-strip-links">
              <Link href="#developers">Read documentation →</Link>
              <Link href="/contact">Talk to our team →</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
