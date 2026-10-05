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
import WalletCard from "@/components/dashboard/WalletCard";
import { creditStripeSession, stripe, usd, walletBalanceCents, walletConfig } from "@/lib/wallet";

export const metadata: Metadata = { title: "Billing & credits" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" });

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string; session_id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard/login");
  const sp = await searchParams;
  const wallet = walletConfig();

  // Back from Stripe: credit right away if the webhook has not landed yet.
  // Idempotent, and only for this user's own paid session.
  let topupNote: { ok: boolean; text: string } | null = null;
  if (sp.topup === "success" && sp.session_id && wallet.cardEnabled && /^cs_[A-Za-z0-9_]+$/.test(sp.session_id)) {
    try {
      const session = await stripe().checkout.sessions.retrieve(sp.session_id);
      if (session.metadata?.userId === user.id) {
        await creditStripeSession(session);
        topupNote =
          session.payment_status === "paid"
            ? { ok: true, text: `Payment received: ${usd(session.amount_total ?? 0)} added to your wallet. Thank you.` }
            : { ok: true, text: "Payment is processing. Your wallet updates as soon as the bank confirms it." };
      }
    } catch (e) {
      console.error("[billing] session lookup failed", e);
      topupNote = { ok: true, text: "Payment received. Your wallet updates within a minute." };
    }
  } else if (sp.topup === "cancelled") {
    topupNote = { ok: false, text: "Payment cancelled. Nothing was charged." };
  }

  const [services, invoices, trialUsed, balanceCents, txns] = await Promise.all([
    getCatalogForUser(user.id),
    prisma.invoice.findMany({
      where: { clientEmail: { equals: user.email, mode: "insensitive" } },
      orderBy: { issueDate: "desc" },
      take: 50,
    }),
    prisma.auditLog.findFirst({ where: { actorId: user.id, action: TRIAL_AUDIT_ACTION }, select: { id: true } }),
    walletBalanceCents(user.id),
    prisma.walletTxn.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
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

      {topupNote ? (
        <div className={`ap2-banner ${topupNote.ok ? "" : "ap2-banner--warn"}`} role="status">
          {topupNote.text}
        </div>
      ) : null}

      <section className="ap2-sec" aria-labelledby="wal-h">
        <h2 id="wal-h">Wallet</h2>
        <WalletCard
          balance={usd(balanceCents)}
          cardEnabled={wallet.cardEnabled}
          min={wallet.min}
          max={wallet.max}
          presets={wallet.presets}
          email={user.email}
        />
        {txns.length > 0 ? (
          <div className="ap2-table-wrap">
            <table className="ap2-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Note</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.id}>
                    <td>{dateFmt.format(t.createdAt)}</td>
                    <td>
                      {t.source === "stripe"
                        ? "Card top-up"
                        : t.source === "bank"
                          ? "Bank transfer"
                          : t.amountCents < 0
                            ? "Moved to API credits"
                            : "Adjustment"}
                    </td>
                    <td>{t.source === "stripe" ? "Stripe" : (t.note ?? "")}</td>
                    <td className="ap2-num">{usd(t.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="ap2-sec" aria-labelledby="bal-h">
        <h2 id="bal-h">API key credits</h2>
        <BalanceList rows={rows} />
      </section>

      <section className="ap2-sec" aria-labelledby="buy-h">
        <h2 id="buy-h">Plans</h2>
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
            <p>Prices depend on the platform, market and volume. Add balance above, or tell us what you need and get a quote the same day.</p>
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
