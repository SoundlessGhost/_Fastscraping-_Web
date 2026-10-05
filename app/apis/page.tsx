import type { Metadata } from "next";
import Link from "next/link";
import { withShareCard } from "@/lib/seo";
import { BOOK_CALL_URL } from "@/lib/site-links";
import { ON_REQUEST_GROUPS, PLATFORMS, STATUS_LABEL } from "@/lib/platforms";

export const metadata: Metadata = withShareCard({
  title: "Shopee, Temu, Naver & Real Estate Data APIs",
  description:
    "Shopee product data API for 8 markets incl. Taiwan and Brazil, plus Temu, Naver Shopping and Swiss real-estate APIs. Pay only for successful requests.",
  alternates: { canonical: "/apis" },
});

const MARKETS = ["Thailand", "Indonesia", "Malaysia", "Philippines", "Vietnam", "Singapore"];

const FIELDS = [
  ["Variants", "Price, price before discount, stock per model/SKU"],
  ["Promotions", "Vouchers, discounts, flash-sale flags"],
  ["Demand", "Sold count, rating histogram, review count"],
  ["Seller", "Shop name, rating, location, follower count"],
  ["Shipping (TW, BR)", "Shipping options and fees"],
];


export default function ApisPage() {
  return (
    <main className="fsx-page">
      <section style={{ background: "#fff", borderBottom: "1px solid #E3E0F2" }}>
        <div className="fsx-wrap fsx-stack" style={{ padding: "72px 24px 56px", gap: 16 }}>
          <span className="fsx-eyebrow">Web Data APIs</span>
          <h1 className="fsx-h1-sm" style={{ maxWidth: 820 }}>
            One request. The whole product page.
          </h1>
          <p className="fsx-lede">
            Async REST APIs that return structured marketplace data in one schema across markets. Pay only for
            successful requests. Free trial of 1,000 requests, no card.
          </p>
        </div>
      </section>

      <section className="fsx-wrap fsx-row" style={{ paddingTop: 72, paddingBottom: 72, gap: 40, alignItems: "flex-start" }}>
        <div className="fsx-stack" style={{ flex: "1 1 460px", minWidth: 0, gap: 20 }}>
          <div className="fsx-row" style={{ gap: 10, alignItems: "center" }}>
            <h2 className="fsx-h2" style={{ fontSize: 36 }}>
              Shopee Product Data API
            </h2>
            <span className="fsx-pill" style={{ background: "#4B3FA3", color: "#fff" }}>
              LIVE
            </span>
          </div>
          <p className="fsx-p" style={{ fontSize: 17 }}>
            Built for Shopee&apos;s current anti-bot. Runs on real and cloud devices with country-specific mobile
            proxies, so the response is what a shopper in that market sees.
          </p>
          <div className="fsx-row" style={{ gap: 8 }}>
            {MARKETS.map((m) => (
              <span key={m} className="fsx-chip">
                {m}
              </span>
            ))}
            <span className="fsx-chip fsx-chip-on">Taiwan</span>
            <span className="fsx-chip fsx-chip-on">Brazil</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="fsx-table">
              <thead>
                <tr>
                  <th scope="col">Field group</th>
                  <th scope="col">What you get</th>
                </tr>
              </thead>
              <tbody>
                {FIELDS.map(([a, b]) => (
                  <tr key={a}>
                    <td>{a}</td>
                    <td>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="fsx-row" style={{ gap: 24, fontSize: 14, color: "#5B5676", fontWeight: 600 }}>
            <span>Median 10–20 s in TH, ID, PH</span>
            <span>25–50 s in SG, VN, MY, BR</span>
            <span>1–3 min in Taiwan</span>
          </div>
        </div>
        <div className="fsx-stack" style={{ flex: "1 1 420px", minWidth: 0, gap: 16 }}>
          <div className="fsx-code" style={{ fontSize: 13 }}>
            <pre>
              <span className="c"># 1. submit</span>
              {`
curl -X POST $BASE_URL/jobs \\
  -H "X-API-Key: $KEY" \\
  -d '{"shop_id": 123456, "item_id": 987654321, "region": "tw"}'

`}
              <span className="c"># → {`{"job_id": "8f2c91", "status": "pending"}`}</span>
              {`

`}
              <span className="c"># 2. poll</span>
              {`
curl $BASE_URL/jobs/8f2c91 \\
  -H "X-API-Key: $KEY"`}
            </pre>
          </div>
          <div className="fsx-card-sm" style={{ fontSize: 14, color: "#5B5676", lineHeight: 1.5 }}>
            <strong style={{ color: "#16131F", fontSize: 15 }}>Billing rules</strong>
            <span>1 successful job = 1 billable request. Pending, failed or not-found jobs are free.</span>
            <span>Results cached for 2 hours. Resubmitting the same item inside that window returns the cached result.</span>
            <span>Your key comes with your trial; examples here are illustrative.</span>
          </div>
          <span style={{ fontSize: 14, color: "#5B5676", lineHeight: 1.5 }}>
            Need exact sold counts only? See the{" "}
            <Link className="fsx-link" href="/docs/shopee-get-list">
              Shopee Item Sold API docs
            </Link>
            .
          </span>
          <Link className="fsx-btn fsx-btn-outline" href="/docs/shopee-api" style={{ alignSelf: "flex-start" }}>
            Read the full API docs
          </Link>
        </div>
      </section>

      <section className="fsx-white">
        <div className="fsx-wrap fsx-stack fsx-section-sm" style={{ gap: 32 }}>
          <h2 className="fsx-h2" style={{ fontSize: 36 }}>
            More platforms and feeds
          </h2>
          <div className="fsx-grid-3" style={{ gap: 16 }}>
            {PLATFORMS.map((m) => (
              <article key={m.name} className="fsx-card-sm" style={{ background: "#F7F6FC", padding: 24, gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>
                    {m.href ? (
                      <Link href={m.href} style={{ color: "inherit", textDecoration: "none" }}>
                        {m.name}
                      </Link>
                    ) : (
                      m.name
                    )}
                  </h3>
                  <span className="fsx-pill">{STATUS_LABEL[m.status]}</span>
                </div>
                <span style={{ fontSize: 14, color: "#5B5676", lineHeight: 1.5 }}>{m.detail}</span>
              {m.sites ? (
                <div className="fsx-row" style={{ gap: 6 }}>
                  {m.sites.map((x) => (
                    <span key={x} className="fsx-chip" style={{ fontSize: 12, padding: "4px 10px", background: "#fff", border: "1px solid #E3E0F2" }}>
                      {x}
                    </span>
                  ))}
                </div>
              ) : null}
              {m.href ? (
                <Link className="fsx-link" href={m.href} style={{ fontSize: 14, fontWeight: 700 }}>
                  Read the docs →
                </Link>
              ) : null}
              </article>
            ))}
          </div>
          <div className="fsx-stack" style={{ gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Also built on request</h3>
            {ON_REQUEST_GROUPS.map((g) => (
              <div key={g.region} className="fsx-row" style={{ gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#5B5676", minWidth: 190 }}>{g.region}</span>
                {g.sites.map((n) => (
                  <span key={n} className="fsx-chip" style={{ fontWeight: 600, fontSize: 12, padding: "4px 10px" }}>
                    {n}
                  </span>
                ))}
              </div>
            ))}
            <p className="fsx-p" style={{ fontSize: 14 }}>
              Any public website, priced per platform. Clean sample within 48–72 hours before you commit.
            </p>
          </div>
        </div>
      </section>

      <section className="fsx-violet">
        <div className="fsx-wrap fsx-row" style={{ padding: "72px 24px", gap: 32, alignItems: "center", justifyContent: "space-between" }}>
          <div className="fsx-stack" style={{ gap: 8, maxWidth: 640 }}>
            <h2 className="fsx-h2" style={{ fontSize: 34 }}>
              Test it on your own SKUs.
            </h2>
            <p style={{ margin: 0, fontSize: 17, color: "#E4DFFF", lineHeight: 1.5 }}>
              Send 3–5 product links. You get a trial key and the JSON back, usually the same day.
            </p>
          </div>
          <div className="fsx-row" style={{ gap: 12 }}>
            <Link className="fsx-btn fsx-btn-lg fsx-btn-white" href="/contact">
              Get a trial key
            </Link>
            <a className="fsx-btn fsx-btn-lg fsx-btn-ghost" href={BOOK_CALL_URL} target="_blank" rel="noopener">
              Book a call
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
