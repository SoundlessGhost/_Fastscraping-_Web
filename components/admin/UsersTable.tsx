"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  role: "ADMIN" | "CLIENT";
  status: "ACTIVE" | "DISABLED";
  verified: boolean;
  createdAt: string;
  lastSeenAt: string | null;
  liveSessions: number;
  keyCount: number;
  services: string[];
  /// Admin via ADMIN_EMAILS — demoting them here would not stick.
  isBootstrapAdmin: boolean;
  isSelf: boolean;
};

/// Either half may be missing; show whatever they gave us.
const fullName = (u: { firstName: string | null; lastName: string | null }) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ");

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function UsersTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) =>
      [u.email, u.firstName ?? "", u.lastName ?? "", u.company ?? ""].some((v) =>
        v.toLowerCase().includes(needle),
      ),
    );
  }, [q, users]);

  async function act(id: string, body: Record<string, unknown>) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "Could not apply that change.");
      else router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(null);
    }
  }

  async function revoke(id: string, email: string) {
    if (!confirm(`Sign ${email} out of every device?`)) return;
    setBusy(id);
    await fetch(`/api/admin/users/${id}/sessions`, { method: "DELETE" }).catch(() => {});
    setBusy(null);
    router.refresh();
  }

  async function remove(u: AdminUser) {
    const warn =
      u.keyCount > 0
        ? `\n\nThis also deletes ${u.keyCount} stored key${u.keyCount === 1 ? "" : "s"}. Their usage on the service backends is not affected.`
        : "";
    if (!confirm(`Delete ${u.email} permanently?${warn}`)) return;
    setBusy(u.id);
    setError(null);
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error ?? "Could not delete.");
    setBusy(null);
    router.refresh();
  }

  return (
    <>
      <div className="ds-head">
        <div>
          <h1 className="dash-title">
            Accounts <em>&amp; access</em>
          </h1>
          <p className="dash-meta">
            <b>{users.length}</b> account{users.length === 1 ? "" : "s"} · signup is open to anyone
          </p>
        </div>
        <input
          className="cn-in ad-search"
          placeholder="Search email, name, company…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <div className="su-error"><b>{error}</b></div>}

      <div className="ad-table">
        <div className="ad-tr ad-tr--head">
          <span>Account</span>
          <span>Role</span>
          <span>Keys</span>
          <span>Last seen</span>
          <span>Actions</span>
        </div>

        {filtered.length === 0 && (
          <div className="dash-empty">
            <div className="dash-empty-t">No accounts match</div>
          </div>
        )}

        {filtered.map((u) => (
          <div key={u.id}>
            <div className={`ad-tr ${u.status === "DISABLED" ? "is-off" : ""}`}>
              <span className="ad-acct">
                <button className="ad-acct-b" onClick={() => setOpen(open === u.id ? null : u.id)}>
                  <span className="ad-email">{u.email}</span>
                  <span className="ad-sub">
                    {fullName(u) || u.company
                      ? [fullName(u), u.company].filter(Boolean).join(" · ")
                      : "no name set"}
                    {!u.verified && <b className="ad-flag"> unverified</b>}
                    {u.status === "DISABLED" && <b className="ad-flag"> disabled</b>}
                    {u.isSelf && <b className="ad-you"> you</b>}
                  </span>
                </button>
              </span>

              <span>
                <span className={`ad-pill ${u.role === "ADMIN" ? "is-admin" : ""}`}>{u.role.toLowerCase()}</span>
              </span>

              <span className="ad-num">{u.keyCount}</span>
              <span className="ad-when">
                {fmtDate(u.lastSeenAt)}
                {u.liveSessions > 0 && <i className="ad-live">{u.liveSessions} live</i>}
              </span>

              <span className="ad-acts">
                {u.role === "CLIENT" ? (
                  <button disabled={busy === u.id} onClick={() => act(u.id, { role: "ADMIN" })}>
                    Make admin
                  </button>
                ) : (
                  <button
                    disabled={busy === u.id || u.isSelf || u.isBootstrapAdmin}
                    title={
                      u.isSelf
                        ? "You can't remove your own admin access"
                        : u.isBootstrapAdmin
                          ? "Admin via ADMIN_EMAILS — remove it from that list first"
                          : undefined
                    }
                    onClick={() => act(u.id, { role: "CLIENT" })}
                  >
                    Make client
                  </button>
                )}

                {u.status === "ACTIVE" ? (
                  <button
                    disabled={busy === u.id || u.isSelf}
                    title={u.isSelf ? "You can't disable yourself" : undefined}
                    onClick={() => act(u.id, { status: "DISABLED" })}
                  >
                    Disable
                  </button>
                ) : (
                  <button disabled={busy === u.id} onClick={() => act(u.id, { status: "ACTIVE" })}>
                    Enable
                  </button>
                )}

                {!u.verified && (
                  <button disabled={busy === u.id} onClick={() => act(u.id, { verify: true })}>
                    Verify
                  </button>
                )}

                {u.liveSessions > 0 && (
                  <button disabled={busy === u.id} onClick={() => revoke(u.id, u.email)}>
                    Sign out
                  </button>
                )}

                <button
                  className="ad-danger"
                  disabled={busy === u.id || u.isSelf}
                  onClick={() => remove(u)}
                >
                  Delete
                </button>
              </span>
            </div>

            {open === u.id && (
              <div className="ad-detail">
                <div>
                  <span className="ov-k">Joined</span>
                  <span className="ad-detail-v">{fmtDate(u.createdAt)}</span>
                </div>
                <div>
                  <span className="ov-k">Connected services</span>
                  <span className="ad-detail-v">{u.services.length ? u.services.join(", ") : "none yet"}</span>
                </div>
                <div>
                  <span className="ov-k">Email</span>
                  <span className="ad-detail-v">{u.verified ? "verified" : "not verified"}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
