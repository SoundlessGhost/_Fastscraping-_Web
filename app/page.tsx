import Link from "next/link";
import LiveConsole from "@/components/LiveConsole";
import ApiExample from "@/components/ApiExample";
import KMAvatar from "@/components/KMAvatar";
import "./styles/home-responsive.css";

// Ready-to-use APIs (call with your key) and targets we build on request.
const READY = [
  {
    mark: "S",
    name: "Shopee",
    cat: "e-commerce",
    desc: "Product, price and seller data across all 8 Southeast-Asian markets.",
  },
  {
    mark: "T",
    name: "Temu",
    cat: "e-commerce",
    desc: "Full product detail and pricing by goods_id, across every Temu region.",
  },
];

const ONREQUEST = [
  { mark: "L", name: "Lazada", cat: "e-commerce" },
  { mark: "TT", name: "TikTok Shop", cat: "e-commerce" },
  { mark: "A", name: "Amazon", cat: "e-commerce" },
  { mark: "W", name: "Walmart", cat: "e-commerce" },
  { mark: "H", name: "Homegate", cat: "real estate" },
  { mark: "in", name: "LinkedIn", cat: "b2b" },
  { mark: "I", name: "Indeed", cat: "jobs" },
  { mark: "+", name: "Your target", cat: "we build it" },
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Bypass Cloudflare &amp; Captchas
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Large-scale on demand
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                No proxy hassles
              </span>
            </div>
            <div className="hero-cta">
              <Link href="/dashboard/login" className="btn btn-primary">
                Start free
                <span className="arrow">→</span>
              </Link>
              <Link href="#apis" className="btn btn-ghost">
                Browse APIs
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

      {/* ===================== SOLUTIONS (3) ===================== */}
      <section className="block" id="solutions" data-screen-label="02 Solutions">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">What we do</span>
              <h2 className="display" style={{ marginTop: 18 }}>
                Three ways to get <em>the data.</em>
              </h2>
            </div>
            <p>
              Call a ready-made API with your key, ask us to build a scraper for
              a site we don&apos;t list yet, or let us run the whole pipeline and
              deliver clean data on a schedule.
            </p>
          </div>

          <div className="home-sol">
            <article className="sol">
              <div className="n">01 · Self-serve</div>
              <h3>Web data APIs</h3>
              <p>
                Ready endpoints you call with your own key — Shopee, Temu and
                more. Clean JSON, every region, built to scale.
              </p>
            </article>
            <article className="sol">
              <div className="n">02 · Custom</div>
              <h3>Custom scraping</h3>
              <p>
                Need a site we don&apos;t list yet? Tell us the target and the
                fields — we build and run the scraper for your project.
              </p>
            </article>
            <article className="sol">
              <div className="n">03 · Managed</div>
              <h3>Managed pipelines</h3>
              <p>
                We own the queue, retries and monitoring and deliver on a
                schedule — straight to your API, an SFTP drop or S3.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ===================== READY APIs ===================== */}
      <section className="block" style={{ paddingTop: 0 }} id="apis" data-screen-label="03 APIs">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Web data APIs</span>
              <h2 className="display" style={{ marginTop: 18 }}>
                Ready-made APIs, <em>site by site.</em>
              </h2>
            </div>
            <p>
              Connect your key and start pulling structured data in minutes. Not
              on the list? We build new targets on request.
            </p>
          </div>

          <div className="api-group-h">Ready now — call with your key</div>
          <div className="targets">
            {READY.map((t) => (
              <article className="target-card" key={t.name}>
                <div className="target-mark">{t.mark}</div>
                <div>
                  <div className="target-name">
                    {t.name} <span className="target-cat">{t.cat}</span>
                  </div>
                  <p className="target-desc">{t.desc}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="api-group-h" style={{ marginTop: 40 }}>
            On request — we build it for you
          </div>
          <div className="targets">
            {ONREQUEST.map((t) => (
              <article className="target-card target-card--soon" key={t.name}>
                <div className="target-mark">{t.mark}</div>
                <div>
                  <div className="target-name">
                    {t.name} <span className="target-cat">{t.cat}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== USE IT (code) ===================== */}
      <section className="block" style={{ paddingTop: 0 }} data-screen-label="04 Use it">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Developer-friendly</span>
              <h2 className="display" style={{ marginTop: 18 }}>
                Call it with <em>your key.</em>
              </h2>
            </div>
            <p>
              One endpoint, one header, structured JSON back. No proxies, no
              browsers, no CAPTCHA handling on your side — we do all of it.
            </p>
          </div>

          <ApiExample />

          <div className="api-get">
            <Link href="/dashboard/login" className="btn btn-primary">
              Get your API key <span className="arrow">→</span>
            </Link>
            <span className="api-get-note">
              5,000 free credits · no card required
            </span>
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="block" style={{ paddingTop: 0 }} id="contact" data-screen-label="05 CTA">
        <div className="container">
          <div className="cta">
            <div>
              <span className="eyebrow">Get started</span>
              <h2 style={{ marginTop: 18 }}>
                Tell us your <em>target.</em>
              </h2>
              <p>
                Ready API or a site we don&apos;t list yet — tell us what you
                need and the fields that matter. You&apos;ll get a reply from an
                engineer, and a free sample where we can run one.
              </p>
              <div className="hero-bullets" style={{ marginTop: 28 }}>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Reply within one business day
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Free sample where we can run one
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                <span className="v" style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>
                  khalid@fastscraping.com
                </span>
              </div>
              <div className="meta-row">
                <span className="k">Response time</span>
                <span className="v">&lt; 24 hours</span>
              </div>
              <div className="meta-row">
                <span className="k">Sample data</span>
                <span className="v">Within 48–72 hours</span>
              </div>
              <div className="actions">
                <Link href="/contact" className="btn btn-accent">
                  Contact us
                </Link>
                <Link href="/dashboard/login" className="btn btn-ghost">
                  Start free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
