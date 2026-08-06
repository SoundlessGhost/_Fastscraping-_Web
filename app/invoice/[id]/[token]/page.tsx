import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { bdt, computeTotals, lineAmount, money, moneyUnit, type InvoiceItem } from "@/lib/invoice";
import "@/app/styles/invoice.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false }, // invoices are private links, never indexed
};

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string; token: string }>;
}) {
  const { id, token } = await params;

  const inv = await prisma.invoice.findUnique({ where: { id } });
  // Wrong or missing token reads as "not found", so ids stay non-enumerable.
  if (!inv || inv.token !== token) notFound();

  const items = (Array.isArray(inv.items) ? inv.items : []) as unknown as InvoiceItem[];
  const { subtotal, tax, total } = computeTotals(items, inv.taxAmount);
  const cur = inv.currency || "USD";
  const paid = inv.status === "PAID";

  return (
    <div className="inv-wrap">
      <div className="inv-card">
        {/* header */}
        <div className="inv-top">
          <div className="brand inv-brand">
            <span className="brand-mark">f</span>
            <span>Fastscraping</span>
          </div>
          <div className="inv-top-r">
            <div className="inv-label">Invoice</div>
            <div className="inv-number">{inv.number}</div>
            <span className={`inv-badge ${paid ? "is-paid" : "is-unpaid"}`}>{paid ? "Paid" : "Unpaid"}</span>
          </div>
        </div>

        {/* billed from / billed to — two tinted panels */}
        <div className="inv-parties">
          <div className="inv-panel">
            <div className="inv-meta-h">Billed from</div>
            <div className="inv-strong">Fastscraping</div>
            <div className="inv-muted">Dhaka, Bangladesh</div>
            <a className="inv-link" href="https://mail.google.com/mail/?view=cm&fs=1&to=khalid@fastscraping.com">
              khalid@fastscraping.com
            </a>
          </div>
          <div className="inv-panel">
            <div className="inv-meta-h">Billed to</div>
            <div className="inv-strong">{inv.clientName}</div>
            {inv.clientAddress && <div className="inv-muted">{inv.clientAddress}</div>}
            {inv.clientEmail && <div className="inv-muted">{inv.clientEmail}</div>}
          </div>
        </div>

        {/* invoice meta strip */}
        <div className="inv-datestrip">
          <div className="inv-ds-cell">
            <span className="inv-meta-h">Invoice no.</span>
            <span className="inv-ds-v">{inv.number}</span>
          </div>
          <div className="inv-ds-cell">
            <span className="inv-meta-h">Issued</span>
            <span className="inv-ds-v">{fmtDate(inv.issueDate)}</span>
          </div>
          {inv.dueDate && (
            <div className="inv-ds-cell">
              <span className="inv-meta-h">Due</span>
              <span className="inv-ds-v">{fmtDate(inv.dueDate)}</span>
            </div>
          )}
          <div className="inv-ds-cell inv-ds-amt">
            <span className="inv-meta-h">Amount due</span>
            <span className="inv-ds-v">{money(total, cur)}</span>
          </div>
        </div>

        {/* body: line items on the left, a summary + pay panel on the right */}
        <div className="inv-body">
          <div className="inv-main">
            {/* line items */}
            <div className="inv-table" role="table">
              <div className="inv-tr inv-tr--head" role="row">
                <span className="inv-c-sl">#</span>
                <span className="inv-c-desc">Description</span>
                <span className="inv-c-qty">Qty</span>
                <span className="inv-c-price">Unit price</span>
                <span className="inv-c-amt">Amount</span>
              </div>
              {items.map((it, i) => (
                <div className="inv-tr" role="row" key={i}>
                  <span className="inv-c-sl">{i + 1}</span>
                  <span className="inv-c-desc">{it.description}</span>
                  <span className="inv-c-qty">{new Intl.NumberFormat("en-US").format(it.quantity)}</span>
                  <span className="inv-c-price">{moneyUnit(it.unitPrice, cur)}</span>
                  <span className="inv-c-amt">{money(lineAmount(it), cur)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* summary + pay */}
          <aside className="inv-aside">
            <div className="inv-totals">
              <div className="inv-total-row">
                <span>Subtotal</span>
                <span>{money(subtotal, cur)}</span>
              </div>
              {tax > 0 && (
                <div className="inv-total-row">
                  <span>Tax</span>
                  <span>{money(tax, cur)}</span>
                </div>
              )}
              <div className="inv-total-row inv-grand">
                <span>Total due</span>
                <span>{money(total, cur)}</span>
              </div>
              {/* optional BDT line — the admin sets the rate per invoice */}
              {inv.bdtRate ? (
                <>
                  <div className="inv-total-row inv-grand inv-bdt-total">
                    <span>Total due (BDT)</span>
                    <span>{bdt(total * inv.bdtRate)}</span>
                  </div>
                  <div className="inv-bdt-sub">payable in BDT at checkout</div>
                  <div className="inv-bdt-rate">
                    1 {cur} ={" "}
                    {inv.bdtRate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT
                  </div>
                </>
              ) : null}
            </div>

            {/* pay */}
            {!paid && inv.paymentUrl ? (
              <a className="inv-pay" href={inv.paymentUrl} target="_blank" rel="noopener noreferrer">
                Proceed to Payment <span aria-hidden="true">→</span>
              </a>
            ) : paid ? (
              <div className="inv-paidnote">This invoice has been paid. Thank you.</div>
            ) : (
              <div className="inv-paidnote">A payment link will be added shortly.</div>
            )}
          </aside>
        </div>

        {inv.notes && <div className="inv-notes">{inv.notes}</div>}

        <div className="inv-foot">This is a computer-generated invoice, no signature required.</div>
      </div>
    </div>
  );
}
