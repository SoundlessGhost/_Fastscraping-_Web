"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Txn = { id: string; date: string; source: string; note: string | null; amount: string };

/// Admin view of one client's wallet: balance, recent entries, and a form to
/// record a bank transfer or move balance onto API credits (negative entry).
export default function WalletAdmin({ userId, balance, txns }: { userId: string; balance: string; txns: Txn[] }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<"bank" | "admin">("bank");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/users/${userId}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd: Number(amount), source, note }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "Could not save.");
      setAmount("");
      setNote("");
      setMsg({ ok: true, t: "Saved." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, t: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-wallet">
      <div className="adm-wallet-top">
        <span>
          Wallet balance <b>{balance}</b>
        </span>
        <span className="ap2-note">Positive = money in. Negative = moved onto the client&apos;s API key as credits.</span>
      </div>
      <div className="adm-wallet-form">
        <label>
          Type
          <select value={source} onChange={(e) => setSource(e.target.value as "bank" | "admin")}>
            <option value="bank">Bank transfer received</option>
            <option value="admin">Adjustment / move to credits</option>
          </select>
        </label>
        <label>
          Amount (USD)
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.-]/g, ""))} placeholder="e.g. 500 or -450" />
        </label>
        <label style={{ flex: "1 1 220px" }}>
          Note
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="INV-1234 or '100k Shopee credits on key Main'" />
        </label>
        <button className="ap2-btn" onClick={save} disabled={busy || !amount || !note}>
          {busy ? "Saving…" : "Save entry"}
        </button>
      </div>
      {msg ? <p className={msg.ok ? "ap2-ok" : "ap2-err"}>{msg.t}</p> : null}
      {txns.length > 0 ? (
        <div className="ap2-table-wrap">
          <table className="ap2-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Note</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.source}</td>
                  <td>{t.note}</td>
                  <td className="ap2-num">{t.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
