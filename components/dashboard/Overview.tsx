"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { platformLabel, type ServiceNode } from "@/lib/services/taxonomy";
import { regionName } from "@/lib/regions";
import type { SessionUser } from "@/lib/auth/session";

// Landing page of the dashboard: what you have keys for, and what you could.
//
// Each connected card loads its own usage, so one slow backend never holds up
// the rest of the page.

function fullName(s: ServiceNode) {
  const platform = platformLabel(s.platform);
  const bits = [platform];
  if (s.region) bits.push(regionName(s.region));
  // For a brand that is its own single service the two are the same string,
  // and "StubHub · StubHub" helps nobody.
  if (s.name !== platform) bits.push(s.name);
  return bits.join(" · ");
}

const nf = new Intl.NumberFormat("en-US");

type CardUsage = {
  today: number;
  last7: number;
  lifetime: number;
  remaining: number | null;
};

function ServiceCard({ s }: { s: ServiceNode }) {
  const [usage, setUsage] = useState<CardUsage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/services/${s.slug}/usage?interval=7`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!alive) return;
        if (!r.ok) {
          setError(body.message ?? "Could not load usage");
          return;
        }
        setUsage({
          today: body.usage.totals.today,
          last7: body.usage.totals.last7,
          lifetime: body.usage.totals.lifetime,
          remaining: body.usage.credits?.remaining ?? null,
        });
      })
      .catch(() => alive && setError("Could not load usage"));
    return () => {
      alive = false;
    };
  }, [s.slug]);

  return (
    <Link href={`/dashboard/s/${s.slug}`} className="ov-card">
      <div className="ov-card-h">
        <span className={`ds-dot ds-dot--${error ? "err" : "on"}`} />
        <span className="ov-card-t">{fullName(s)}</span>
      </div>

      {error ? (
        <p className="ov-err">{error}</p>
      ) : (
        <div className="ov-nums">
          <div>
            <span className="ov-k">Today</span>
            <span className="ov-v">{usage ? nf.format(usage.today) : "—"}</span>
          </div>
          <div>
            <span className="ov-k">7 days</span>
            <span className="ov-v">{usage ? nf.format(usage.last7) : "—"}</span>
          </div>
          <div>
            <span className="ov-k">Lifetime</span>
            <span className="ov-v">{usage ? nf.format(usage.lifetime) : "—"}</span>
          </div>
        </div>
      )}

      <div className="ov-card-f">
        <span className="ov-key">{s.connection?.keyMask}</span>
        {usage?.remaining !== null && usage?.remaining !== undefined && (
          <span className="ov-credit">{nf.format(usage.remaining)} credits left</span>
        )}
      </div>
    </Link>
  );
}

export default function Overview({ user, services }: { user: SessionUser; services: ServiceNode[] }) {
  const connected = services.filter((s) => s.connection);
  const available = services.filter((s) => !s.connection && s.status === "ACTIVE");
  const soon = services.filter((s) => !s.connection && s.status !== "ACTIVE");

  return (
    <>
      <div className="ds-head">
        <div>
          <h1 className="dash-title">
            Your <em>services</em>
          </h1>
          <p className="dash-meta">
            signed in as <b>{user.email}</b> · all times UTC
          </p>
        </div>
      </div>

      {connected.length === 0 ? (
        <div className="ov-empty">
          <h2 className="ov-empty-t">Connect your first service</h2>
          <p className="ov-empty-s">
            Every service checks your API key against its own backend — the same key you already use to
            call it. Pick a service and paste its key to see usage here.
          </p>
          {available.length > 0 && (
            <div className="ov-empty-list">
              {available.map((s) => (
                <Link key={s.slug} href={`/dashboard/s/${s.slug}`} className="ov-pick">
                  <span className="ov-pick-n">{fullName(s)}</span>
                  <span className="ov-pick-a">Add key →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="ov-grid">
          {connected.map((s) => (
            <ServiceCard key={s.slug} s={s} />
          ))}
        </div>
      )}

      {connected.length > 0 && available.length > 0 && (
        <section className="ov-sec">
          <h2 className="ov-sec-t">Available to connect</h2>
          <div className="ov-empty-list">
            {available.map((s) => (
              <Link key={s.slug} href={`/dashboard/s/${s.slug}`} className="ov-pick">
                <span className="ov-pick-n">{fullName(s)}</span>
                <span className="ov-pick-a">Add key →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {soon.length > 0 && (
        <section className="ov-sec">
          <h2 className="ov-sec-t">Coming soon</h2>
          <p className="ov-sec-s">In the catalog, not wired to a backend yet.</p>
          <div className="ov-soon">
            {soon.map((s) => (
              <span key={s.slug} className="ov-soon-chip">
                {fullName(s)}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
