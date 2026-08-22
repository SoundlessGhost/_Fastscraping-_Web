"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Code = {
  id: string;
  account: string;
  fromAddr: string;
  subject: string;
  code: string;
  source: string;
  receivedAt: string;
  fresh: boolean;
};

type Brand = { id: string; label: string };

const POLL_MS = 3000;

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    hour12: false,
  });

const ago = (iso: string) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

type Snapshot = { codes?: Code[]; brands?: Brand[]; configured?: boolean; error?: string | null };

/// `apiUrl` lets the same component serve both the admin page (default) and the
/// public secret-URL page (/codes/{token}) — only the endpoint differs.
/// `streamUrl` is the SSE endpoint for real-time push; it defaults to
/// `${apiUrl}/stream`, so callers only pass `apiUrl`.
export default function TemuCodes({
  apiUrl = "/api/admin/temu-codes",
  streamUrl,
}: {
  apiUrl?: string;
  streamUrl?: string;
}) {
  const stream = streamUrl ?? `${apiUrl}/stream`;
  const [codes, setCodes] = useState<Code[]>([]);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brand, setBrand] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [, force] = useState(0); // re-render so the "ago" labels tick
  const inFlight = useRef(false);

  // Apply a snapshot from either the SSE push or the poll — identical shape.
  const apply = useCallback((d: Snapshot) => {
    setCodes(d.codes ?? []);
    if (d.brands) setBrands(d.brands);
    setConfigured(!!d.configured);
    setError(d.error ?? null);
    setLoading(false);
  }, []);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const r = await fetch(apiUrl, { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error ?? "Could not load codes.");
        return;
      }
      apply(d);
    } catch {
      setError("Network error.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [apiUrl, apply]);

  // Real-time push: new codes land the instant the server's IDLE worker sees
  // them. The browser reconnects EventSource automatically; the poll below is
  // the safety net if the stream is unavailable.
  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;
    const es = new EventSource(stream);
    es.addEventListener("codes", (e) => {
      try {
        apply(JSON.parse((e as MessageEvent).data) as Snapshot);
      } catch {
        /* ignore a malformed frame */
      }
    });
    es.onerror = () => {
      /* transient — browser retries on its own; the poll covers the gap */
    };
    return () => es.close();
  }, [stream, apply]);

  useEffect(() => {
    load();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    // tick the relative-time labels once a second
    const tick = window.setInterval(() => force((n) => n + 1), 1000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(tick);
    };
  }, [load]);

  // Manual reload on top of the live push + 3 s poll — for when someone just
  // wants to force a fetch right now.
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const copy = async (c: Code) => {
    try {
      await navigator.clipboard.writeText(c.code);
      setCopied(c.id);
      setTimeout(() => setCopied((x) => (x === c.id ? null : x)), 1500);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  };

  // Client-side filter over code / account / sender — the list is small (≤100)
  // and already sorted newest-first, so filtering keeps that order.
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return codes.filter((c) => {
      if (brand !== "all" && c.source !== brand) return false;
      if (!q) return true;
      return (
        c.code.toLowerCase().includes(q) ||
        c.account.toLowerCase().includes(q) ||
        c.fromAddr.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q)
      );
    });
  }, [codes, query, brand]);

  /// Per-brand counts for the tab labels, so "Indeed 0" is visible rather than
  /// leaving someone wondering whether the filter is broken.
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: codes.length };
    for (const c of codes) m[c.source] = (m[c.source] ?? 0) + 1;
    return m;
  }, [codes]);

  return (
    <>
      <div className="ds-head">
        <div>
          <h1 className="dash-title">
            Verification <em>codes</em>
          </h1>
          <p className="dash-meta">
            incoming verification codes · live — new codes appear instantly
            {!loading && (
              <>
                {" "}
                · <b>{shown.length}</b>
                {shown.length !== codes.length ? ` of ${codes.length}` : ""} recent
              </>
            )}
          </p>
        </div>
        <div className="tc-search">
          <input
            type="search"
            className="tc-search-in"
            placeholder="Search code, account, sender…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="tc-refresh" onClick={refresh} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {!configured && (
        <div className="tc-note">
          IMAP isn&apos;t configured yet. Add <code>TEMU_IMAP_HOST/PORT/USER/PASS</code> to the server{" "}
          <code>.env</code>, then reload.
        </div>
      )}
      {configured && error && <div className="tc-note tc-note--warn">Mailbox: {error}</div>}

      {brands.length > 1 && (
        <div className="tc-tabs" role="tablist">
          {[{ id: "all", label: "All" }, ...brands].map((b) => (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={brand === b.id}
              className={`tc-tab${brand === b.id ? " is-on" : ""}`}
              onClick={() => setBrand(b.id)}
            >
              {b.label}
              <span className="tc-tab-n">{counts[b.id] ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      <div className="tc-list">
        <div className="tc-row tc-row--head">
          <span>Code</span>
          <span>Account</span>
          <span>From</span>
          <span className="tc-when">Received</span>
          <span className="tc-actions-h">Copy</span>
        </div>

        {loading && codes.length === 0 ? (
          <div className="tc-empty">loading…</div>
        ) : codes.length === 0 ? (
          <div className="tc-empty">No codes yet — they appear here within seconds of arriving.</div>
        ) : shown.length === 0 ? (
          <div className="tc-empty">
            No codes match{query ? ` “${query}”` : ""}
            {brand !== "all" ? ` in ${brands.find((b) => b.id === brand)?.label ?? brand}` : ""}.
          </div>
        ) : (
          shown.map((c) => (
            <div className={`tc-row${c.fresh ? " is-fresh" : ""}`} key={c.id}>
              <span className="tc-code">
                {c.code}
                {c.fresh && <span className="tc-fresh">new</span>}
              </span>
              <span className="tc-account" title={c.account}>
                <span className={`tc-src tc-src--${c.source}`}>{c.source}</span>
                {c.account}
              </span>
              <span className="tc-from" title={c.subject}>
                {c.fromAddr}
              </span>
              <span className="tc-when" title={fmtTime(c.receivedAt)}>
                {ago(c.receivedAt)}
              </span>
              <span className="tc-actions">
                <button className="tc-copy" onClick={() => copy(c)}>
                  {copied === c.id ? "Copied ✓" : "Copy"}
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
