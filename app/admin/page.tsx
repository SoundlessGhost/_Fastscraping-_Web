import Link from "next/link";
import { prisma } from "@/lib/db";
import { bootstrapAdminEmails } from "@/lib/auth/admins";

export const dynamic = "force-dynamic";

const nf = new Intl.NumberFormat("en-US");

export default async function AdminOverview() {
  const [users, admins, disabled, unverified, services, live, connections, sessions, recent] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { status: "DISABLED" } }),
      prisma.user.count({ where: { emailVerifiedAt: null } }),
      prisma.service.count(),
      prisma.service.count({ where: { status: "ACTIVE" } }),
      prisma.clientService.count(),
      prisma.session.count({ where: { revokedAt: null } }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { email: true } } },
      }),
    ]);

  return (
    <>
      <div className="ds-head">
        <div>
          <h1 className="dash-title">
            Admin <em>overview</em>
          </h1>
          <p className="dash-meta">
            bootstrap admins · <b>{bootstrapAdminEmails().join(", ") || "none set"}</b>
          </p>
        </div>
      </div>

      <div className="dash-stats">
        <div className="dash-stat">
          <div className="dash-stat-k">Accounts</div>
          <div className="dash-stat-v">{nf.format(users)}</div>
          <div className="dash-stat-s">
            {nf.format(admins)} admin · {nf.format(disabled)} disabled
          </div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-k">Services</div>
          <div className="dash-stat-v">{nf.format(services)}</div>
          <div className="dash-stat-s">{nf.format(live)} wired to a backend</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-k">Connected keys</div>
          <div className="dash-stat-v">{nf.format(connections)}</div>
          <div className="dash-stat-s">client ↔ service links</div>
        </div>
        <div className="dash-stat dash-stat--dark">
          <div className="dash-stat-k">Live sessions</div>
          <div className="dash-stat-v">{nf.format(sessions)}</div>
          <div className="dash-stat-s">{nf.format(unverified)} accounts unverified</div>
        </div>
      </div>

      <div className="ad-quick">
        <Link href="/admin/services" className="ov-pick">
          <span className="ov-pick-n">Add a service to the catalog</span>
          <span className="ov-pick-a">Services →</span>
        </Link>
        <Link href="/admin/users" className="ov-pick">
          <span className="ov-pick-n">Manage accounts &amp; access</span>
          <span className="ov-pick-a">Users →</span>
        </Link>
      </div>

      <div className="dash-card ad-card">
        <div className="dash-card-h">
          <div className="dash-card-t">
            Recent activity <small>newest first</small>
          </div>
          <Link href="/admin/audit" className="ad-link">
            Full log →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-t">Nothing yet</div>
            <div className="dash-empty-s">actions show up here as they happen</div>
          </div>
        ) : (
          <div className="ad-log">
            {recent.map((r) => (
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
