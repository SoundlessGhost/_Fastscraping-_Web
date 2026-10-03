"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type BalanceRow = { slug: string; service: string; keyId: string; keyLabel: string | null };

type Credits = { total: number | null; used: number | null; remaining: number | null; unlimited: boolean };
type State = { credits: Credits | null; error: string | null; loading: boolean };

const nf = new Intl.NumberFormat("en-US");

/// Remaining credits for every key the client holds, each row loading on its
/// own so one slow backend never blocks the table.
function Row({ r }: { r: BalanceRow }) {
  const [st, setSt] = useState<State>({ credits: null, error: null, loading: true });
  useEffect(() => {
    let alive = true;
    fetch(`/api/services/${r.slug}/usage?interval=7&k=${encodeURIComponent(r.keyId)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) setSt({ credits: null, error: body.message ?? "Unavailable", loading: false });
        else setSt({ credits: body.usage?.credits ?? null, error: null, loading: false });
      })
      .catch(() => alive && setSt({ credits: null, error: "Unavailable", loading: false }));
    return () => {
      alive = false;
    };
  }, [r.slug, r.keyId]);

  const c = st.credits;
  const remaining = st.loading ? "…" : st.error ? "—" : !c ? "—" : c.unlimited ? "Unlimited" : c.remaining === null ? "—" : nf.format(c.remaining);
  const used = st.loading || !c || c.used === null ? "—" : nf.format(c.used);
  const total = st.loading || !c ? "—" : c.unlimited ? "∞" : c.total === null ? "—" : nf.format(c.total);
  const low = !!c && !c.unlimited && c.total !== null && c.remaining !== null && c.total > 0 && c.remaining / c.total < 0.1;

  return (
    <tr>
      <td>
        <Link href={`/dashboard/s/${r.slug}`}>{r.service}</Link>
      </td>
      <td>{r.keyLabel ?? "Key"}</td>
      <td className="ap2-num">{used}</td>
      <td className="ap2-num">{total}</td>
      <td className="ap2-num">
        {remaining}
        {low ? (
          <>
            {" "}
            <span className="ap2-pill ap2-pill--unpaid">Low</span>
          </>
        ) : null}
        {st.error ? <span className="ap2-note"> {st.error}</span> : null}
      </td>
    </tr>
  );
}

export default function BalanceList({ rows }: { rows: BalanceRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="ap2-empty">
        No API keys connected yet. Take a trial key below, or add a key you already have from any service in the left menu.
      </div>
    );
  }
  return (
    <div className="ap2-table-wrap">
      <table className="ap2-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Key</th>
            <th>Used</th>
            <th>Plan total</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Row key={r.keyId} r={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
