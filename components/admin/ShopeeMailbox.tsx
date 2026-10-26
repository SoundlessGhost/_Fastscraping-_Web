"use client";

import { useCallback, useMemo, useState } from "react";

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

type Body = { subject: string; fromAddr: string; account: string; receivedAt: string; html: string };

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short", hour12: false });

const ago = (iso: string) => {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
};

/// The one mailbox tab: the list of forwarded-account mails on the left, and a
/// reading pane on the right that shows the WHOLE selected email (not an
/// extracted code). The body is fetched on click (`${apiUrl}/body/{id}`) and
/// rendered in a sandboxed iframe — no scripts run, and remote images are blocked
/// until "load images", so the email can't phone home. Rows from every cPanel
/// source (Shopee, Leadconnect, …) live in this one list, each tagged with a
/// coloured source chip (`c.source`) so you can tell which account it was for.
export default function ShopeeMailbox({ codes, apiUrl }: { codes: Code[]; apiUrl: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [body, setBody] = useState<Body | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loadImages, setLoadImages] = useState(false);

  const select = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setBody(null);
      setErr(null);
      setLoadImages(false);
      setLoading(true);
      try {
        const r = await fetch(`${apiUrl}/body/${id}`, { cache: "no-store" });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          setErr("This email is no longer available.");
          return;
        }
        setBody(d as Body);
      } catch {
        setErr("Network error.");
      } finally {
        setLoading(false);
      }
    },
    [apiUrl],
  );

  // The email HTML, wrapped with a strict CSP + base target so links open in a
  // new tab. Remote images are allowed only after "load images".
  const srcDoc = useMemo(() => {
    if (!body) return "";
    const img = loadImages ? "https: data:" : "data:";
    const csp = `default-src 'none'; img-src ${img}; style-src 'unsafe-inline'; font-src data: https:;`;
    // While images are blocked, hide them entirely so the email reads cleanly
    // instead of showing broken-image icons. "Load images" brings them back.
    const hideImg = loadImages ? "" : "img{display:none!important}";
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><base target="_blank"><style>body{margin:12px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1a1a1a;background:#fff;overflow-wrap:break-word;word-break:break-word}img{max-width:100%;height:auto}a{color:#2563eb}${hideImg}</style></head><body>${body.html}</body></html>`;
  }, [body, loadImages]);

  return (
    <div className={`sm-wrap${selectedId ? " sm-wrap--open" : ""}`}>
      <div className="sm-list">
        {codes.length === 0 ? (
          <div className="tc-empty">No emails yet — they appear here within seconds of arriving.</div>
        ) : (
          codes.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`sm-item${selectedId === c.id ? " is-sel" : ""}`}
              onClick={() => select(c.id)}
            >
              <div className="sm-it-top">
                <span className="sm-subj">{c.subject || "(no subject)"}</span>
                <span className="sm-time" title={fmtTime(c.receivedAt)}>{ago(c.receivedAt)}</span>
              </div>
              <div className="sm-from">{c.fromAddr}</div>
              <div className="sm-acct">
                <span className={`tc-src tc-src--${c.source}`}>{c.source}</span>
                {c.account}
                {c.fresh && <span className="sm-new">new</span>}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="sm-read">
        {!selectedId ? (
          <div className="sm-empty"><i className="ti ti-mail-opened" aria-hidden="true"></i> Select an email to read the full message.</div>
        ) : loading ? (
          <div className="sm-empty">loading…</div>
        ) : err ? (
          <div className="sm-empty">{err}</div>
        ) : body ? (
          <>
            <div className="sm-rhead">
              <button type="button" className="sm-back" onClick={() => setSelectedId(null)} aria-label="Back to list">
                <i className="ti ti-arrow-left" aria-hidden="true"></i>
              </button>
              <div className="sm-rmeta">
                <div className="sm-rsubj">{body.subject || "(no subject)"}</div>
                <div className="sm-rfrom">{body.fromAddr} · {fmtTime(body.receivedAt)}</div>
                <div className="sm-rto">to {body.account}</div>
              </div>
            </div>
            <div className="sm-block">
              <span><i className="ti ti-photo-off" aria-hidden="true"></i> remote images blocked</span>
              {!loadImages && (
                <button type="button" className="sm-loadimg" onClick={() => setLoadImages(true)}>load images</button>
              )}
            </div>
            <iframe
              className="sm-frame"
              title="email"
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              srcDoc={srcDoc}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
