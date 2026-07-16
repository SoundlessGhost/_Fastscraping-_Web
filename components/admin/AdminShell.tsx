"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth/session";

// Same frame as the client dashboard (ds-* classes), different nav — so the two
// sides of the product stay one product.

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/audit", label: "Audit log" },
];

export default function AdminShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/dashboard/login");
    router.refresh();
  }

  return (
    <div className={`ds ${drawer ? "ds--drawer" : ""}`}>
      <aside className="ds-side">
        <div className="ds-side-head">
          <Link href="/admin" className="ds-brand">
            <span className="ds-brand-mark">f</span>
            <span className="ds-brand-name">Fastscraping</span>
          </Link>
          <button className="ds-drawer-close" onClick={() => setDrawer(false)} aria-label="Close menu">
            ×
          </button>
        </div>

        <nav className="ds-nav">
          <div className="ds-cat" style={{ marginTop: 4 }}>
            <div className="ds-cat-head">Admin</div>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setDrawer(false)}
                className={`ds-item ${pathname === n.href ? "is-active" : ""}`}
              >
                <span className="ds-item-label">{n.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="ds-side-foot">
          <Link href="/dashboard" className="ds-item" onClick={() => setDrawer(false)}>
            <span className="ds-item-label">← My dashboard</span>
          </Link>
        </div>
      </aside>

      <button className="ds-scrim" onClick={() => setDrawer(false)} aria-hidden="true" tabIndex={-1} />

      <div className="ds-main">
        <header className="ds-top">
          <button className="ds-burger" onClick={() => setDrawer(true)} aria-label="Open menu">
            <span />
            <span />
          </button>
          <div className="ds-top-spacer" />
          <div className="ds-who">
            <span className="ds-who-dot" />
            <span className="ds-who-email">{user.email}</span>
          </div>
          <span className="ds-tag">admin</span>
          <button className="btn btn-ghost ds-logout" onClick={logout} disabled={busy}>
            {busy ? "…" : "Log out"}
          </button>
        </header>

        <main className="ds-content">{children}</main>
      </div>
    </div>
  );
}
