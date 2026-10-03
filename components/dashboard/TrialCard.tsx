"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  enabled: boolean;
  used: boolean;
  quota: number;
  serviceName: string | null;
};

/// One free trial key per account. When self-serve trials are switched off,
/// the card turns into a request that goes to Support instead.
export default function TrialCard({ enabled, used, quota, serviceName }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  async function issue() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/trial", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.key) throw new Error(d.message || "Could not create a trial key.");
      setKey(d.key);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create a trial key.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the key is still selectable on screen */
    }
  }

  return (
    <div className="ap2-card ap2-card--hi">
      <span className="ap2-tag">Free trial</span>
      <h3>Test with real data before you pay</h3>
      {key ? (
        <>
          <p className="ap2-ok">Your trial key is ready. Copy it now. It is also saved under {serviceName ?? "the service"} in the left menu.</p>
          <div className="ap2-key">
            <span>{key}</span>
            <button className="ap2-btn ap2-btn--out" onClick={copy} style={{ minHeight: 32 }}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="ap2-note">Send requests with the header X-API-Key. The key stops after {quota.toLocaleString("en-US")} requests.</p>
        </>
      ) : enabled && !used ? (
        <>
          <p>
            {quota.toLocaleString("en-US")} free requests on {serviceName ?? "our Shopee API"}. One trial per account, no card needed.
          </p>
          <div className="ap2-cta ap2-row">
            <button className="ap2-btn" onClick={issue} disabled={busy}>
              {busy ? "Creating key…" : "Get my trial key"}
            </button>
          </div>
        </>
      ) : used ? (
        <>
          <p>This account has already used its trial. Need more test volume or another platform? Ask and we will extend it.</p>
          <div className="ap2-cta">
            <Link className="ap2-btn ap2-btn--out" href="/dashboard/support?topic=Trial%20key">
              Ask for more trial requests
            </Link>
          </div>
        </>
      ) : (
        <>
          <p>Tell us the platform and market you need. We send a trial key the same day, usually within a few hours.</p>
          <div className="ap2-cta">
            <Link className="ap2-btn" href="/dashboard/support?topic=Trial%20key">
              Request a trial key
            </Link>
          </div>
        </>
      )}
      {err ? (
        <p className="ap2-err" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
