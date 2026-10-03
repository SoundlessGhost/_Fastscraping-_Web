import type { Metadata } from "next";
import Link from "next/link";
import { withShareCard } from "@/lib/seo";
import { BOOK_CALL_URL } from "@/lib/site-links";

export const metadata: Metadata = withShareCard({
  title: "Pricing — priced per platform, paid for data",
  description:
    "APIs billed per successful request, managed pipelines at a flat monthly fee per platform, datasets per record delivered. Every quote is built for the platform, markets and volume you need.",
  alternates: { canonical: "/pricing" },
});

const DRIVERS = [
  ["Platform difficulty", "Anti-bot strength, app-only data, device cost per request."],
  ["Markets", "Each country is its own fleet and proxy pool. Taiwan and Brazil cost more than Thailand."],
  ["Volume and freshness", "Daily refresh of 1M SKUs is priced differently from a weekly 50k."],
  ["Fields and delivery", "Full page vs price-only; API vs scheduled files to your warehouse."],
];

const FAQ = [
  ["What counts as a successful request?", "A job that returns the page with the fields for that market. Pending, failed, blocked or not-found jobs are free and can be retried."],
  ["Is there a minimum?", "No minimum on APIs. Pipelines are monthly and can be cancelled with 30 days' notice."],
  ["How do we pay?", "Monthly invoice in USD. Card (Stripe), PayPal or bank transfer. A usage export is available for reconciliation. See the Refund & Cancellation policy for the details."],
];

export default function PricingPage() {
  return (
    <main className="fsx-page">
      <section style={{ background: "#fff", borderBottom: "1px solid #E3E0F2" }}>
        <div className="fsx-wrap fsx-stack" style={{ padding: "72px 24px 56px", gap: 16 }}>
          <span className="fsx-eyebrow">Pricing</span>
          <h1 className="fsx-h1-sm" style={{ maxWidth: 820 }}>
            Priced per platform. Paid for data, not attempts.
          </h1>
          <p className="fsx-lede">
            Every platform has a different anti-bot, a different device cost and a different page. So every quote is
            built for the platform, the markets and the volume you need. Three billing models, no surprises.
          </p>
        </div>
      </section>

      <section className="fsx-wrap fsx-grid-3" style={{ paddingTop: 72, paddingBottom: 40, alignItems: "stretch" }}>
        <article className="fsx-card" style={{ padding: 36, gap: 18 }}>
          <div className="fsx-stack" style={{ gap: 6 }}>
            <h2 className="fsx-h3">Web Data APIs</h2>
            <span className="fsx-p" style={{ fontSize: 15 }}>
              Shopee, GrabFood, Temu and other ready-made endpoints
            </span>
          </div>
          <div className="fsx-stack" style={{ gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Per 1,000 successful requests</span>
            <span className="fsx-p" style={{ fontSize: 15, fontWeight: 600 }}>
              Rate set per platform and market. Volume tiers above 1M a month.
            </span>
          </div>
          <ul className="fsx-list">
            <li>Free trial: 1,000 requests, no card</li>
            <li>Failed, blocked or not-found jobs are never billed</li>
            <li>Usage dashboard and monthly billing export</li>
          </ul>
          <Link className="fsx-btn" href="/contact" style={{ marginTop: "auto" }}>
            Get a trial key
          </Link>
        </article>

        <article className="fsx-card-uv" style={{ padding: 36, gap: 18 }}>
          <div className="fsx-stack" style={{ gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <h2 className="fsx-h3">Managed pipelines</h2>
              <span className="fsx-pill fsx-pill-strong">Most clients</span>
            </div>
            <span style={{ fontSize: 15, color: "#E4DFFF" }}>Scheduled extraction and delivery, one platform per plan</span>
          </div>
          <div className="fsx-stack" style={{ gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Flat monthly fee per platform</span>
            <span style={{ fontSize: 15, color: "#E4DFFF", fontWeight: 600 }}>
              Scoped by volume, frequency and fields. Mobile-app sources priced separately.
            </span>
          </div>
          <ul className="fsx-list">
            <li>Daily or weekly delivery to SFTP, S3 or webhook</li>
            <li>JSON, Parquet, CSV or TSV, one schema every run</li>
            <li>Coverage checks, duplicate detection, 24 h fix window</li>
          </ul>
          <a className="fsx-btn fsx-btn-white" href={BOOK_CALL_URL} target="_blank" rel="noopener" style={{ marginTop: "auto" }}>
            Book a call with Khalid
          </a>
        </article>

        <article className="fsx-card" style={{ padding: 36, gap: 18 }}>
          <div className="fsx-stack" style={{ gap: 6 }}>
            <h2 className="fsx-h3">Data on demand</h2>
            <span className="fsx-p" style={{ fontSize: 15 }}>
              One-off or recurring datasets, no integration
            </span>
          </div>
          <div className="fsx-stack" style={{ gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Per record delivered</span>
            <span className="fsx-p" style={{ fontSize: 15, fontWeight: 600 }}>
              Quoted on the scope: platform, market, items, fields.
            </span>
          </div>
          <ul className="fsx-list">
            <li>Sample in 48–72 hours before you commit</li>
            <li>CSV, Parquet or JSON with a field dictionary</li>
            <li>White-label and reseller terms available</li>
          </ul>
          <Link className="fsx-btn fsx-btn-outline" href="/contact" style={{ marginTop: "auto" }}>
            Request a dataset
          </Link>
        </article>
      </section>

      <section className="fsx-wrap fsx-row" style={{ paddingTop: 40, paddingBottom: 80, gap: 48, alignItems: "flex-start" }}>
        <div className="fsx-stack" style={{ flex: "1 1 380px", minWidth: 0, gap: 12 }}>
          <span className="fsx-eyebrow">What sets the rate</span>
          <h2 className="fsx-h2" style={{ fontSize: 36 }}>
            Why we don&apos;t publish one price list.
          </h2>
          <p className="fsx-p">
            A Shopee Taiwan product page and an Amazon search page cost very different things to collect reliably. The
            quote reflects that, and nothing else.
          </p>
        </div>
        <ul className="fsx-grid-2" style={{ flex: "1 1 560px", minWidth: 0, listStyle: "none", margin: 0, padding: 0, gap: 14 }}>
          {DRIVERS.map(([t, d]) => (
            <li key={t} className="fsx-card-sm">
              <strong style={{ fontSize: 16 }}>{t}</strong>
              <span style={{ fontSize: 14, color: "#5B5676", lineHeight: 1.5 }}>{d}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="fsx-violet">
        <div className="fsx-wrap fsx-row" style={{ padding: "72px 24px", gap: 32, alignItems: "center", justifyContent: "space-between" }}>
          <div className="fsx-stack" style={{ gap: 8, maxWidth: 680 }}>
            <h2 className="fsx-h2" style={{ fontSize: 34 }}>
              Get a quote in one call.
            </h2>
            <p style={{ margin: 0, fontSize: 17, color: "#E4DFFF", lineHeight: 1.5 }}>
              30 minutes with Khalid, the person who runs the pipelines. You leave with a number, a trial key and a
              sample date. No sales sequence.
            </p>
          </div>
          <div className="fsx-stack" style={{ gap: 10 }}>
            <a className="fsx-btn fsx-btn-lg fsx-btn-white" href={BOOK_CALL_URL} target="_blank" rel="noopener">
              Book a call with Khalid
            </a>
            <Link className="fsx-btn fsx-btn-lg fsx-btn-ghost" href="/contact">
              Or send product links
            </Link>
          </div>
        </div>
      </section>

      <section className="fsx-white">
        <div className="fsx-wrap fsx-grid-3 fsx-section-sm" style={{ gap: 32 }}>
          {FAQ.map(([q, a]) => (
            <div key={q} className="fsx-stack" style={{ gap: 8 }}>
              <strong style={{ fontSize: 17 }}>{q}</strong>
              <span style={{ fontSize: 15, color: "#5B5676", lineHeight: 1.55 }}>{a}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
