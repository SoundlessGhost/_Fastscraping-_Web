"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ServiceUsage from "@/components/dashboard/ServiceUsage";
import { platformLabel, type ServiceNode } from "@/lib/services/taxonomy";
import { regionName } from "@/lib/regions";

// What an admin sees when looking at a client's dashboard: the same usage view
// the client gets, but read-only and clearly marked. Every fetch is
// audit-logged on the server.

/// Sets this client's negotiated rate for one service. Blank clears the
/// override, so the service default applies again. The client's dashboard picks
/// the new figure up on its next auto-refresh.
function RateEditor({
  userId,
  slug,
  serviceLabel,
  initial,
  fallback,
}: {
  userId: string;
  slug: string;
  serviceLabel: string;
  initial: number | null;
  fallback: number | null;
}) {
  const [value, setValue] = useState(initial === null ? "" : String(initial));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Switching service tabs has to reload the field, not keep the old one.
  useEffect(() => {
    setValue(initial === null ? "" : String(initial));
    setMsg(null);
  }, [slug, initial]);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pricePer1000: value.trim() === "" ? null : Number(value) }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? "Saved" : (data.error ?? "Could not save."));
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-rate">
      <span className="adm-rate-k">Price / 1,000</span>
      <input
        className="adm-rate-in"
        type="number"
        step="0.01"
        min="0"
        placeholder={fallback === null ? "unpriced" : String(fallback)}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button className="adm-rate-btn" onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </button>
      {/* Always name the service: a client can hold keys for several, each with
          its own negotiated rate, and the tabs above switch which one this is. */}
      <span className="adm-rate-s">
        for <b>{serviceLabel}</b>
        {value.trim() === ""
          ? fallback === null
            ? " · no rate set, no cost shown"
            : ` · using service default $${fallback.toFixed(2)}`
          : " · client-specific rate"}
      </span>
      {msg && <span className="adm-rate-msg">{msg}</span>}
    </div>
  );
}

function fullName(s: ServiceNode) {
  const platform = platformLabel(s.platform);
  return [platform, s.region ? regionName(s.region) : null, s.name === platform ? null : s.name]
    .filter(Boolean)
    .join(" · ");
}

export type Rates = Record<string, { client: number | null; fallback: number | null }>;

export default function ClientView({
  userId,
  email,
  services,
  rates,
}: {
  userId: string;
  email: string;
  /// Only the services this client has actually connected a key for.
  services: ServiceNode[];
  /// Per-service price per 1,000 requests: this client's override + the
  /// service default it falls back to.
  rates: Rates;
}) {
  const [active, setActive] = useState<ServiceNode | null>(services[0] ?? null);

  return (
    <>
      <div className="adm-viewbar">
        <div>
          <span className="adm-viewbar-k">Viewing as</span>{" "}
          <b>{email}</b> <span className="adm-viewbar-ro">read-only · logged</span>
        </div>
        <Link href="/admin/users" className="adm-link">
          ← Back to accounts
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="dash-empty" style={{ marginTop: 20 }}>
          <div className="dash-empty-t">No connected services</div>
          <div className="dash-empty-s">this client hasn&apos;t added a key to any service yet</div>
        </div>
      ) : (
        <>
          {services.length > 1 && (
            <div className="adm-viewtabs">
              {services.map((s) => (
                <button
                  key={s.slug}
                  className={`adm-viewtab ${active?.slug === s.slug ? "is-on" : ""}`}
                  onClick={() => setActive(s)}
                >
                  {fullName(s)}
                </button>
              ))}
            </div>
          )}

          {/* Below the tabs on purpose: the rate belongs to the selected
              service, and rates are negotiated per service, not per account. */}
          {active && (
            <RateEditor
              userId={userId}
              slug={active.slug}
              serviceLabel={fullName(active)}
              initial={rates[active.slug]?.client ?? null}
              fallback={rates[active.slug]?.fallback ?? null}
            />
          )}

          {active && (
            <ServiceUsage
              key={active.slug}
              service={active}
              title={fullName(active)}
              usageUrl={`/api/admin/usage?user=${userId}&slug=${active.slug}&interval=30`}
            />
          )}
        </>
      )}
    </>
  );
}
