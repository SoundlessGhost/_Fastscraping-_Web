"use client";

import { useState } from "react";
import Link from "next/link";
import ServiceUsage from "@/components/dashboard/ServiceUsage";
import { platformLabel, type ServiceNode } from "@/lib/services/taxonomy";
import { regionName } from "@/lib/regions";

// What an admin sees when looking at a client's dashboard: the same usage view
// the client gets, but read-only and clearly marked. Every fetch is
// audit-logged on the server.

function fullName(s: ServiceNode) {
  const platform = platformLabel(s.platform);
  return [platform, s.region ? regionName(s.region) : null, s.name === platform ? null : s.name]
    .filter(Boolean)
    .join(" · ");
}

export default function ClientView({
  userId,
  email,
  services,
}: {
  userId: string;
  email: string;
  /// Only the services this client has actually connected a key for.
  services: ServiceNode[];
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
