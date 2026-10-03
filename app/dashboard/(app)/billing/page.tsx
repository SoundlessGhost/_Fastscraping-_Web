import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getCatalogForUser } from "@/lib/services/catalog";
import { platformLabel } from "@/lib/services/taxonomy";
import { computeTotals, money, type InvoiceItem } from "@/lib/invoice";
import { creditPacks, trialConfig, TRIAL_AUDIT_ACTION } from "@/lib/billing";
import { BOOK_CALL_URL } from "@/lib/site-links";
import BalanceList, { type BalanceRow } from "@/components/dashboard/BalanceList";
import TrialCard from "@/components/dashboard/TrialCard";

export const metadata: Metadata = { title: "Billing & credits" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" });

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard/login");

  const [services, invoices, trialUsed] = await Promise.all([
    getCatalogForUser(user.id),
    prisma.invoice.findMany({
      where: { clientEmail: { equals: user.email, mode: "insensitive" } },
      orderBy: { issueDate: "desc" },
      take: 50,
    }),
    prisma.auditLog.findFirst({ where: { actorId: user.id, action: TRIAL_AUDIT_ACTION }, select: { id: true } }),
  ]);

  const rows: BalanceRow[] = services.flatMap((s) =>
    s.connections.map((c) => ({
      slug: s.slug,
      service: `${platformLabel(s.platform)} · ${s.name}`,
      keyId: c.id,
      keyLabel: c.label,
    })),
  );

  const packs = creditPacks();
  const trial = trialConfig();
  const trialService = services.find((s) => s.slug === trial.serviceSlug);

  return (
    <div className="ap2">
      <div className="ap2-head">
        <h1>Billing &amp; credits</h1>
        <p>
          Every API is prepaid: you buy request credits, and only successful requests are billed. Pricing is set per platform
          and volume, so the same account can hold keys on several services.
        </p>
      </div>

      <section className="ap2-sec" aria-labelledby="bal-h">
        <h2 id="bal-h">Your balance</h2>
        <BalanceList rows={rows} />
      </section>

      <section className="ap2-sec" aria-labelledby="buy-h">
        <h2 id="buy-h">Buy credits</h2>
        {packs.length > 0 ? (
          <>
            <p>Pay by card through Stripe. Credits are added to your key within one business day, usually much sooner.</p>
            <div className="ap2-grid">
              {packs.map((p) => (
                <div key={p.id} className={`ap2-card ${p.highlight ? "ap2-card--hi" : ""}`}>
                  {p.highlight ? <span className="ap2-tag">Most popular</span> : null}
                  <h3>{p.name}</h3>
                  <div className="ap2-price">{p.price}</div>
                  <p>{p.credits}</p>
                  {p.blurb ? <p>{p.blurb}</p> : null}
                  <a className="ap2-btn ap2-cta" href={p.url} target="_blank" rel="noopener">
                    Buy with card
                  </a>
                </div>
              ))}
              <TrialCard enabled={trial.enabled} used={!!trialUsed} quota={trial.quota} serviceName={trialService?.name ?? null} />
            </div>
          </>
        ) : (
          <>
            <p>Prices depend on the platform, market and volume. Tell us what you need and you get a quote the same day.</p>
            <div className="ap2-grid">
              <TrialCard enabled={trial.enabled} used={!!trialUsed} quota={trial.quota} serviceName={trialService?.name ?? null} />
              <div className="ap2-card">
                <span className="ap2-tag">Pay as you go</span>
                <h3>Credit packs</h3>
                <p>Prepaid requests on one platform. Top up whenever you like; unused credits stay on your key.</p>
                <ul className="ap2-list">
                  <li>Billed per successful request</li>
                  <li>Card, bank transfer or invoice</li>
                  <li>Live balance on this page</li>
                </ul>
                <Link className="ap2-btn ap2-cta" href="/dashboard/support?topic=Buy%20credits%20or%20change%20plan">
                  Get a price for credits
                </Link>
              </div>
              <div className="ap2-card">
                <span className="ap2-tag">Monthly</span>
                <h3>Committed plan</h3>
                <p>A fixed monthly volume at a lower unit price, with higher rate limits and priority support.</p>
                <ul className="ap2-list">
                  <li>Lower price per 1,000 requests</li>
                  <li>Custom rate and concurrency limits</li>
                  <li>Monthly invoice</li>
                </ul>
                <a className="ap2-btn ap2-btn--out ap2-cta" href={BOOK_CALL_URL} target="_blank" rel="noopener">
                  Book a call
                </a>
              </div>
              <div className="ap2-card">
                <span className="ap2-tag">Enterprise</span>
                <h3>Managed feeds</h3>
                <p>New platforms, scheduled datasets and custom pipelines, delivered to your storage on a schedule.</p>
                <ul className="ap2-list">
                  <li>Any site, scoped per project</li>
                  <li>Delivery to S3, GCS or your API</li>
                  <li>Written terms and an SLA</li>
                </ul>
                <a className="ap2-btn ap2-btn--out ap2-cta" href={BOOK_CALL_URL} target="_blank" rel="noopener">
                  Talk to Khalid
                </a>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="ap2-sec" aria-labelledby="inv-h">
        <h2 id="inv-h">Invoices</h2>
        {invoices.length === 0 ? (
          <div className="ap2-empty">No invoices yet. Invoices sent to {user.email} appear here with a link to pay.</div>
        ) : (
          <div className="ap2-table-wrap">
            <table className="ap2-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const items = (Array.isArray(inv.items) ? inv.items : []) as unknown as InvoiceItem[];
                  const { total } = computeTotals(items, inv.taxAmount);
                  const paid = inv.status === "PAID";
                  return (
                    <tr key={inv.id}>
                      <td>
                        <a href={`/invoice/${inv.id}/${inv.token}`} target="_blank" rel="noopener">
                          {inv.number}
                        </a>
                      </td>
                      <td>{dateFmt.format(inv.issueDate)}</td>
                      <td>{inv.dueDate ? dateFmt.format(inv.dueDate) : "—"}</td>
                      <td className="ap2-num">{money(total, inv.currency)}</td>
                      <td>
                        <span className={`ap2-pill ${paid ? "ap2-pill--paid" : "ap2-pill--unpaid"}`}>{paid ? "Paid" : "Unpaid"}</span>
                      </td>
                      <td>
                        {!paid && inv.paymentUrl ? (
                          <a href={inv.paymentUrl} target="_blank" rel="noopener">
                            Pay now
                          </a>
                        ) : (
                          <a href={`/invoice/${inv.id}/${inv.token}`} target="_blank" rel="noopener">
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="ap2-note">
          Billed by Fast Scraping LLC, Wyoming, USA. See the <Link href="/refund">refund policy</Link> and{" "}
          <Link href="/terms">terms</Link>. Questions about a charge go to <Link href="/dashboard/support?topic=Billing%20or%20invoice">Support</Link>.
        </p>
      </section>
    </div>
  );
}
