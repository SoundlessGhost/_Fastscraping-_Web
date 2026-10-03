import type { Metadata } from "next";
import Link from "next/link";
import { withShareCard } from "@/lib/seo";
import { BOOK_CALL_URL } from "@/lib/site-links";

export const metadata: Metadata = withShareCard({
  title: "Custom Scrapers & Managed Data Pipelines",
  description:
    "Ready-made web data APIs, custom scrapers for protected sites, scheduled data pipelines and datasets on demand. Anti-bot, devices and proxies handled.",
  alternates: { canonical: "/solutions" },
});

type Sol = {
  tag: string;
  title: string;
  body: string;
  cta: { href: string; label: string; external?: boolean };
  facts: [string, string][];
  dark?: boolean;
};

const SOLUTIONS: Sol[] = [
  {
    tag: "01 · Web Data APIs",
    title: "Marketplace data, one request at a time.",
    body: "Async REST endpoints for Shopee (8 markets), Temu, Swiss real-estate portals and more. Submit a job, poll, get the full page as JSON. Billed only on success.",
    cta: { href: "/apis", label: "Browse the APIs →" },
    facts: [
      ["Best for", "Market intelligence, repricing, brand protection"],
      ["Delivery", "REST API, JSON, 2-hour result cache"],
      ["Start", "Trial key the same day, 1,000 requests free"],
      ["Scale", "100k+ product pages a day in production"],
    ],
  },
  {
    tag: "02 · Custom scrapers",
    title: "A scraper built for the site you name.",
    body: "Protected sites, mobile apps, sites your in-house crawler gave up on. We build it, run it on real devices and in-country proxies, and hand you the data, not the code to babysit. Clean sample within 48–72 hours before you commit.",
    cta: { href: "/contact", label: "Describe your target →" },
    facts: [
      ["Best for", "One hard platform, a new market, a mobile-only source"],
      ["Handles", "Cloudflare, DataDome, PerimeterX, Akamai, app-only APIs"],
      ["Delivery", "API, SFTP, S3 or webhook; JSON, Parquet, CSV, TSV"],
      ["Ownership", "We maintain it; layout changes fixed within 24 hours"],
    ],
  },
  {
    tag: "03 · Large-scale data pipelines",
    title: "Millions of records a week, on a schedule.",
    body: "For data and analytics teams that need the same feed every day or every week with coverage that doesn't drift. Ticketing marketplaces at 24M+ listings a day, restaurant and delivery menus for 16,000+ stores a week, job boards at 1.39M postings a week.",
    cta: { href: BOOK_CALL_URL, label: "Book a call about your pipeline →", external: true },
    facts: [
      ["Best for", "Data aggregators, analytics teams, DaaS products"],
      ["QA every run", "Coverage diff vs last run, duplicates, formats, volumes"],
      ["SLA", "Delivery windows are commitments; you hear from us first"],
      ["Pricing", "Flat monthly fee per platform"],
    ],
  },
  {
    tag: "04 · Data on demand (DaaS)",
    title: "Order a dataset. Receive a file.",
    body: "No integration, no pipeline. Tell us the platform, the market, the category or the list of items, and the fields you need. We deliver a one-off or recurring dataset, and you pay for the records delivered.",
    cta: { href: "/contact", label: "Request a dataset →" },
    facts: [
      ["Best for", "Research, due diligence, one-time category studies"],
      ["Examples", "Every SKU in a Shopee category with prices and sold counts"],
      ["Format", "CSV, Parquet or JSON, with a field dictionary"],
      ["Turnaround", "Sample in 48–72 hours, full set scoped on the call"],
    ],
    dark: true,
  },
];

const INFRA = [
  ["Real-device fleets", "Physical and cloud Android devices for app-first platforms."],
  ["In-country mobile proxies", "Country-specific, human-paced. Not just rotating IPs."],
  ["Complete browser identities", "Fingerprint and TLS consistent end to end."],
  ["Schema discipline", "Same columns, same types, every run. Your pipeline never notices us."],
];

export default function SolutionsPage() {
  return (
    <main className="fsx-page">
      <section style={{ background: "#fff", borderBottom: "1px solid #E3E0F2" }}>
        <div className="fsx-wrap fsx-stack" style={{ padding: "72px 24px 56px", gap: 16 }}>
          <span className="fsx-eyebrow">Solutions</span>
          <h1 className="fsx-h1-sm" style={{ maxWidth: 860 }}>
            Any website, any scale, delivered as data.
          </h1>
          <p className="fsx-lede">
            Ready-made APIs when the platform is one we already run. A custom pipeline when it isn&apos;t. Either way,
            the anti-bot work, the devices, the proxies and the schema discipline sit on our side.
          </p>
        </div>
      </section>

      <section className="fsx-wrap fsx-stack" style={{ paddingTop: 72, paddingBottom: 24, gap: 24 }}>
        {SOLUTIONS.map((s) => (
          <article
            key={s.tag}
            className={s.dark ? "fsx-card-uv" : "fsx-card"}
            style={{ padding: 40, flexDirection: "row", flexWrap: "wrap", gap: 40, alignItems: "flex-start" }}
          >
            <div className="fsx-stack" style={{ flex: "1 1 380px", minWidth: 0, gap: 12 }}>
              <span className="fsx-mono" style={s.dark ? { color: "#D6CEFF" } : undefined}>
                {s.tag}
              </span>
              <h2 className="fsx-h2" style={{ fontSize: 30 }}>
                {s.title}
              </h2>
              <p className="fsx-p">{s.body}</p>
              {s.cta.external ? (
                <a className="fsx-arrow" href={s.cta.href} target="_blank" rel="noopener" style={s.dark ? { color: "#fff" } : undefined}>
                  {s.cta.label}
                </a>
              ) : (
                <Link className="fsx-arrow" href={s.cta.href} style={s.dark ? { color: "#fff" } : undefined}>
                  {s.cta.label}
                </Link>
              )}
            </div>
            <ul className="fsx-facts" style={{ flex: "1 1 380px", minWidth: 0 }}>
              {s.facts.map(([k, v]) => (
                <li key={k}>
                  <strong>{k}</strong>
                  <br />
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="fsx-wrap fsx-stack" style={{ paddingTop: 56, paddingBottom: 88, gap: 28 }}>
        <div className="fsx-stack" style={{ gap: 10, maxWidth: 680 }}>
          <span className="fsx-eyebrow">Under every solution</span>
          <h2 className="fsx-h2" style={{ fontSize: 36 }}>
            The same infrastructure, whichever shape you pick.
          </h2>
        </div>
        <div className="fsx-grid-4">
          {INFRA.map(([t, d]) => (
            <div key={t} className="fsx-card-sm">
              <strong style={{ fontSize: 16 }}>{t}</strong>
              <span style={{ fontSize: 14, color: "#5B5676", lineHeight: 1.5 }}>{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="fsx-violet">
        <div className="fsx-wrap fsx-row" style={{ padding: "72px 24px", gap: 32, alignItems: "center", justifyContent: "space-between" }}>
          <div className="fsx-stack" style={{ gap: 8, maxWidth: 640 }}>
            <h2 className="fsx-h2" style={{ fontSize: 34 }}>
              Not sure which shape fits?
            </h2>
            <p style={{ margin: 0, fontSize: 17, color: "#E4DFFF", lineHeight: 1.5 }}>
              30 minutes with Khalid. Bring the sites and the fields; leave with a plan and a sample date.
            </p>
          </div>
          <a className="fsx-btn fsx-btn-lg fsx-btn-white" href={BOOK_CALL_URL} target="_blank" rel="noopener">
            Book a call with Khalid
          </a>
        </div>
      </section>
    </main>
  );
}
