import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/// Read-only trail. Deliberately has no delete: a log you can edit is not a log.
export default async function AdminAudit() {
  const rows = await prisma.auditLog.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { email: true } } },
  });

  return (
    <>
      <div className="ds-head">
        <div>
          <h1 className="dash-title">
            Audit <em>log</em>
          </h1>
          <p className="dash-meta">last {rows.length} actions · newest first · UTC</p>
        </div>
      </div>

      <div className="dash-card ad-card">
        {rows.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-t">Nothing logged yet</div>
          </div>
        ) : (
          <div className="ad-log">
            <div className="ad-log-row ad-log-row--head">
              <span>Action</span>
              <span>Target</span>
              <span>By</span>
              <span>When</span>
            </div>
            {rows.map((r) => (
              <div className="ad-log-row" key={r.id}>
                <span className="ad-log-a">{r.action}</span>
                <span className="ad-log-t">{r.target ?? "—"}</span>
                <span className="ad-log-w">{r.actor?.email ?? "system"}</span>
                <span className="ad-log-d">{r.createdAt.toISOString().replace("T", " ").slice(0, 16)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
