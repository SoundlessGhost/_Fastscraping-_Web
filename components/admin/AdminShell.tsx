"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth/session";
import AccountFoot from "@/components/dashboard/AccountFoot";
import { ConfirmProvider } from "@/components/ui/Confirm";

// Same frame as the client dashboard (ds-* classes), different nav — so the two
// sides of the product stay one product. No top bar: the account row lives in
// the sidebar footer.

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/audit", label: "Audit log" },
];

export default function AdminShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  return (
    <div className={`ds ${drawer ? "ds--drawer" : ""}`}>
      <aside className="ds-side">
        <div className="ds-side-head">
          <Link href="/admin" className="brand">
            <span className="brand-mark">f</span>
            <span>Fastscraping</span>
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
          <AccountFoot user={user} />
        </div>
      </aside>

      <button className="ds-scrim" onClick={() => setDrawer(false)} aria-hidden="true" tabIndex={-1} />
      <button className="ds-burger ds-burger--float" onClick={() => setDrawer(true)} aria-label="Open menu">
        <span />
        <span />
      </button>

      <div className="ds-main">
        <main className="ds-content">
          <ConfirmProvider>{children}</ConfirmProvider>
        </main>
      </div>
    </div>
  );
}
