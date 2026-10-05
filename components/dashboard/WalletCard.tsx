"use client";

import { useState } from "react";

type Props = {
  balance: string;
  cardEnabled: boolean;
  min: number;
  max: number;
  presets: number[];
  email: string;
};

/// Wallet balance + "Add balance". Card payments go to Stripe's hosted page;
/// bank transfers become an invoice request to the team.
export default function WalletCard({ balance, cardEnabled, min, max, presets, email }: Props) {
  const [amount, setAmount] = useState<number>(presets[1] ?? presets[0] ?? min);
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState<"card" | "bank">(cardEnabled ? "card" : "bank");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [company, setCompany] = useState("");

  const value = custom ? Math.round(Number(custom)) : amount;
  const valid = Number.isFinite(value) && value >= min && (mode === "bank" || value <= max);

  async function payByCard() {
    if (!valid) return setErr(`Choose an amount between $${min} and $${max.toLocaleString("en-US")}.`);
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd: value }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error(d.error || "Could not open the payment page.");
      window.location.href = d.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not open the payment page.");
      setBusy(false);
    }
  }

  async function requestInvoice() {
    if (!Number.isFinite(value) || value < min) return setErr(`The smallest top-up is $${min}.`);
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: "Bank transfer or invoice",
          message: `Please send an invoice to add $${value.toLocaleString("en-US")} to my wallet by bank transfer.${
            company.trim() ? `\nBill to: ${company.trim()}` : ""
          }`,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "Could not send the request.");
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send the request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ap2-wallet">
      <div className="ap2-wallet-bal">
        <span className="ap2-wallet-k">Wallet balance</span>
        <span className="ap2-wallet-v">{balance}</span>
        <span className="ap2-note">Prepaid USD. We move it onto your API keys as request credits at your agreed rate.</span>
      </div>

      <div className="ap2-wallet-add">
        <div className="ap2-seg" role="tablist" aria-label="Payment method">
          <button role="tab" aria-selected={mode === "card"} className={mode === "card" ? "is-on" : ""} onClick={() => setMode("card")}>
            Card
          </button>
          <button role="tab" aria-selected={mode === "bank"} className={mode === "bank" ? "is-on" : ""} onClick={() => setMode("bank")}>
            Bank transfer / invoice
          </button>
        </div>

        {sent ? (
          <p className="ap2-ok">Request sent. We email an invoice with bank details to {email}, usually the same day.</p>
        ) : (
          <>
            <div className="ap2-amts">
              {presets.map((p) => (
                <button
                  key={p}
                  className={`ap2-amt ${!custom && amount === p ? "is-on" : ""}`}
                  onClick={() => {
                    setAmount(p);
                    setCustom("");
                  }}
                >
                  ${p.toLocaleString("en-US")}
                </button>
              ))}
              <label className="ap2-amt ap2-amt--in">
                <span>$</span>
                <input
                  inputMode="numeric"
                  placeholder="Other"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                  aria-label="Custom amount in USD"
                />
              </label>
            </div>

            {mode === "card" ? (
              cardEnabled ? (
                <>
                  <button className="ap2-btn" onClick={payByCard} disabled={busy || !valid}>
                    {busy ? "Opening secure checkout…" : `Add $${(valid ? value : 0).toLocaleString("en-US")} by card`}
                  </button>
                  <p className="ap2-note">
                    Secure payment by Stripe. Visa, Mastercard, Amex and more. Card top-ups from ${min} to ${max.toLocaleString("en-US")}; larger amounts by invoice.
                  </p>
                </>
              ) : (
                <p className="ap2-note">Card payments open soon. Use bank transfer / invoice for now.</p>
              )
            ) : (
              <>
                <div className="ap2-field">
                  <label htmlFor="wl-co">Bill to (company name and address, optional)</label>
                  <input id="wl-co" value={company} onChange={(e) => setCompany(e.target.value.slice(0, 200))} />
                </div>
                <button className="ap2-btn" onClick={requestInvoice} disabled={busy}>
                  {busy ? "Sending…" : `Request an invoice for $${(Number.isFinite(value) ? value : 0).toLocaleString("en-US")}`}
                </button>
                <p className="ap2-note">For wire, ACH or local bank transfer. The balance is added when the payment arrives.</p>
              </>
            )}
          </>
        )}
        {err ? (
          <p className="ap2-err" role="alert">
            {err}
          </p>
        ) : null}
      </div>
    </div>
  );
}
