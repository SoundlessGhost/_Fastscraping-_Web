"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ui/Confirm";
import { computeTotals, lineAmount, money, type InvoiceItem } from "@/lib/invoice";

export type AdminInvoice = {
  id: string;
  token: string;
  number: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  items: InvoiceItem[];
  currency: string;
  taxAmount: number;
  notes: string;
  paymentUrl: string;
  status: "UNPAID" | "PAID";
  issueDate: string; // yyyy-mm-dd
  dueDate: string; // yyyy-mm-dd or ""
  total: number;
  createdAt: string;
};

type Draft = Omit<AdminInvoice, "total" | "createdAt" | "token">;

const todayYmd = () => new Date().toISOString().slice(0, 10);

const blankDraft = (): Draft => ({
  id: "",
  number: "",
  clientName: "",
  clientEmail: "",
  clientAddress: "",
  items: [{ description: "", quantity: 1, unitPrice: 0 }],
  currency: "USD",
  taxAmount: 0,
  notes: "",
  paymentUrl: "",
  status: "UNPAID",
  issueDate: todayYmd(),
  dueDate: "",
});

// Relative path — identical on server and client, so the <a href> hydrates
// cleanly. The absolute URL (for copying) is built at click time from origin.
const invoicePath = (inv: { id: string; token: string }) => `/invoice/${inv.id}/${inv.token}`;

export default function InvoicesManager({ invoices }: { invoices: AdminInvoice[] }) {
  const router = useRouter();
  const confirm = useConfirm();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const isEdit = !!draft?.id;
  const totals = useMemo(
    () => computeTotals(draft?.items ?? [], draft?.taxAmount ?? 0),
    [draft?.items, draft?.taxAmount],
  );

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const setItem = (i: number, patch: Partial<InvoiceItem>) =>
    setDraft((d) => (d ? { ...d, items: d.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) } : d));
  const addItem = () =>
    setDraft((d) => (d ? { ...d, items: [...d.items, { description: "", quantity: 1, unitPrice: 0 }] } : d));
  const removeItem = (i: number) =>
    setDraft((d) => (d ? { ...d, items: d.items.filter((_, j) => j !== i) } : d));

  const startNew = () => {
    setError(null);
    setDraft(blankDraft());
  };
  const startEdit = (inv: AdminInvoice) => {
    setError(null);
    const { total, createdAt, token, ...rest } = inv;
    void total;
    void createdAt;
    void token;
    setDraft({ ...rest });
  };

  const copyLink = async (inv: AdminInvoice) => {
    try {
      await navigator.clipboard.writeText(window.location.origin + invoicePath(inv));
      setCopied(inv.id);
      setTimeout(() => setCopied((c) => (c === inv.id ? null : c)), 1800);
    } catch {
      setError("Could not copy — copy it from the invoice page instead.");
    }
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setError(null);
    const body = {
      clientName: draft.clientName.trim(),
      clientEmail: draft.clientEmail.trim(),
      clientAddress: draft.clientAddress.trim(),
      items: draft.items.map((it) => ({
        description: it.description.trim(),
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
      })),
      currency: (draft.currency || "USD").trim().toUpperCase(),
      taxAmount: Number(draft.taxAmount) || 0,
      notes: draft.notes.trim(),
      paymentUrl: draft.paymentUrl.trim(),
      status: draft.status,
      issueDate: draft.issueDate,
      dueDate: draft.dueDate,
    };
    try {
      const res = await fetch(isEdit ? `/api/admin/invoices/${draft.id}` : "/api/admin/invoices", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setDraft(null);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const togglePaid = async (inv: AdminInvoice) => {
    const next = inv.status === "PAID" ? "UNPAID" : "PAID";
    const res = await fetch(`/api/admin/invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: inv.clientName,
        clientEmail: inv.clientEmail,
        clientAddress: inv.clientAddress,
        items: inv.items,
        currency: inv.currency,
        taxAmount: inv.taxAmount,
        notes: inv.notes,
        paymentUrl: inv.paymentUrl,
        status: next,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
      }),
    });
    if (res.ok) router.refresh();
  };

  const del = async (inv: AdminInvoice) => {
    const ok = await confirm({
      title: `Delete ${inv.number}?`,
      body: "The invoice link will stop working. This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/invoices/${inv.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  return (
    <>
      <div className="ds-head">
        <div>
          <h1 className="dash-title">
            Invoices <em>billing</em>
          </h1>
          <p className="dash-meta">create a branded invoice link, then send it to the client</p>
        </div>
        {!draft && (
          <button className="btn btn-primary" onClick={startNew}>
            New invoice <span className="arrow">→</span>
          </button>
        )}
      </div>

      {/* ---- form ---- */}
      {draft && (
        <div className="adm-card invx-form">
          <div className="adm-form-body">
            <div className="adm-fgrid">
              <label>
                <span className="cn-l">Client name</span>
                <input className="cn-in" value={draft.clientName} onChange={(e) => set("clientName", e.target.value)} />
              </label>
              <label>
                <span className="cn-l">Client email <i>optional</i></span>
                <input className="cn-in" value={draft.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} />
              </label>
              <label>
                <span className="cn-l">Client address <i>optional</i></span>
                <input className="cn-in" value={draft.clientAddress} onChange={(e) => set("clientAddress", e.target.value)} />
              </label>
            </div>

            {/* line items */}
            <div className="invx-items">
              <div className="invx-item invx-item--head">
                <span>Description</span>
                <span>Qty</span>
                <span>Unit price</span>
                <span>Amount</span>
                <span />
              </div>
              {draft.items.map((it, i) => (
                <div className="invx-item" key={i}>
                  <input
                    className="cn-in"
                    placeholder="e.g. Shopee Brazil PDP — requests"
                    value={it.description}
                    onChange={(e) => setItem(i, { description: e.target.value })}
                  />
                  <input
                    className="cn-in"
                    type="number"
                    min="0"
                    step="any"
                    value={it.quantity}
                    onChange={(e) => setItem(i, { quantity: Number(e.target.value) })}
                  />
                  <input
                    className="cn-in"
                    type="number"
                    min="0"
                    step="any"
                    value={it.unitPrice}
                    onChange={(e) => setItem(i, { unitPrice: Number(e.target.value) })}
                  />
                  <span className="invx-amt">{money(lineAmount(it), draft.currency)}</span>
                  <button
                    className="invx-x"
                    onClick={() => removeItem(i)}
                    disabled={draft.items.length === 1}
                    aria-label="Remove line"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="invx-additem" onClick={addItem}>
                + Add line
              </button>
            </div>

            <div className="adm-fgrid">
              <label>
                <span className="cn-l">Currency</span>
                <input className="cn-in" value={draft.currency} onChange={(e) => set("currency", e.target.value)} />
              </label>
              <label>
                <span className="cn-l">Tax <i>flat, optional</i></span>
                <input
                  className="cn-in"
                  type="number"
                  min="0"
                  step="any"
                  value={draft.taxAmount}
                  onChange={(e) => set("taxAmount", Number(e.target.value))}
                />
              </label>
              <label>
                <span className="cn-l">Status</span>
                <select
                  className="cn-in"
                  value={draft.status}
                  onChange={(e) => set("status", e.target.value as Draft["status"])}
                >
                  <option value="UNPAID">Unpaid</option>
                  <option value="PAID">Paid</option>
                </select>
              </label>
              <label>
                <span className="cn-l">Issue date</span>
                <input className="cn-in" type="date" value={draft.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
              </label>
              <label>
                <span className="cn-l">Due date <i>optional</i></span>
                <input className="cn-in" type="date" value={draft.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
              </label>
            </div>

            <label>
              <span className="cn-l">SSLCommerz payment URL <i>the Proceed-to-Payment link</i></span>
              <input
                className="cn-in"
                placeholder="https://..."
                value={draft.paymentUrl}
                onChange={(e) => set("paymentUrl", e.target.value)}
              />
            </label>
            <label>
              <span className="cn-l">Notes / terms <i>optional</i></span>
              <textarea
                className="cn-in invx-notes"
                rows={2}
                value={draft.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </label>

            <div className="invx-totalbar">
              <span>Subtotal {money(totals.subtotal, draft.currency)}</span>
              {totals.tax > 0 && <span>· Tax {money(totals.tax, draft.currency)}</span>}
              <b>· Total {money(totals.total, draft.currency)}</b>
            </div>

            {error && <p className="cn-err">{error}</p>}

            <div className="adm-form-acts">
              <button className="btn btn-primary" onClick={save} disabled={busy}>
                {busy ? "Saving…" : isEdit ? "Save changes" : "Create invoice"}
              </button>
              <button className="btn btn-ghost" onClick={() => setDraft(null)} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- list ---- */}
      <div className="adm-table invx-list">
        <div className="invx-row invx-row--head">
          <span>Invoice</span>
          <span>Client</span>
          <span className="invx-num">Total</span>
          <span>Status</span>
          <span className="invx-acts-h">Actions</span>
        </div>
        {invoices.length === 0 ? (
          <div className="invx-empty">No invoices yet — create your first one.</div>
        ) : (
          invoices.map((inv) => (
            <div className="invx-row" key={inv.id}>
              <span className="invx-numcell">
                <b>{inv.number}</b>
                <small>
                  {new Date(inv.createdAt).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "short",
                    timeZone: "UTC",
                  })}
                </small>
              </span>
              <span className="invx-client">{inv.clientName}</span>
              <span className="invx-num">{money(inv.total, inv.currency)}</span>
              <span>
                <span className={`adm-pill ${inv.status === "PAID" ? "is-admin" : ""}`}>
                  {inv.status === "PAID" ? "Paid" : "Unpaid"}
                </span>
              </span>
              <span className="adm-acts">
                <button onClick={() => copyLink(inv)}>{copied === inv.id ? "Copied ✓" : "Copy link"}</button>
                <a href={invoicePath(inv)} target="_blank" rel="noopener noreferrer" className="invx-open">
                  Open
                </a>
                <button onClick={() => togglePaid(inv)}>{inv.status === "PAID" ? "Mark unpaid" : "Mark paid"}</button>
                <button onClick={() => startEdit(inv)}>Edit</button>
                <button className="adm-danger" onClick={() => del(inv)}>
                  Delete
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
