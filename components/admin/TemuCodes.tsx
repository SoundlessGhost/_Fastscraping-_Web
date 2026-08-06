"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Code = {
  id: string;
  account: string;
  fromAddr: string;
  subject: string;
  code: string;
  receivedAt: string;
  fresh: boolean;
};

const POLL_MS = 5000;

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

/// `apiUrl` lets the same component serve both the admin page (default) and the
/// public secret-URL page (/codes/{token}) — only the endpoint differs.
export default function TemuCodes({ apiUrl = "/api/admin/temu-codes" }: { apiUrl?: string }) {
  const [codes, setCodes] = useState<Code[]>([]);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [, force] = useState(0); // re-render so the "ago" labels tick
  const inFlight = useRef(false);

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
      setCodes(d.codes ?? []);
      setConfigured(!!d.configured);
      setError(d.error ?? null);
    } catch {
      setError("Network error.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [apiUrl]);

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
    if (!q) return codes;
    return codes.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.account.toLowerCase().includes(q) ||
        c.fromAddr.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q),
    );
  }, [codes, query]);

  return (
    <>
      <div className="ds-head">
        <div>
          <h1 className="dash-title">
            Temu <em>codes</em>
          </h1>
          <p className="dash-meta">
            incoming verification codes · refreshes every 5s
            {!loading && (
              <>
                {" "}
                · <b>{query ? shown.length : codes.length}</b>
                {query ? ` of ${codes.length}` : ""} recent
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
        </div>
      </div>

      {!configured && (
        <div className="tc-note">
          IMAP isn&apos;t configured yet. Add <code>TEMU_IMAP_HOST/PORT/USER/PASS</code> to the server{" "}
          <code>.env</code>, then reload.
        </div>
      )}
      {configured && error && <div className="tc-note tc-note--warn">Mailbox: {error}</div>}

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
          <div className="tc-empty">No codes match “{query}”.</div>
        ) : (
          shown.map((c) => (
            <div className={`tc-row${c.fresh ? " is-fresh" : ""}`} key={c.id}>
              <span className="tc-code">
                {c.code}
                {c.fresh && <span className="tc-fresh">new</span>}
              </span>
              <span className="tc-account" title={c.account}>
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
