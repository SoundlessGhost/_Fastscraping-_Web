"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth/session";
import AccountFoot from "@/components/dashboard/AccountFoot";
import { ConfirmProvider } from "@/components/ui/Confirm";

// The /settings area: same app-shell frame as the dashboard (fixed sidebar,
// scrolling content, no top bar) but the sidebar is a settings menu instead of
// the service tree. More sections drop into NAV as they're built.

const GearIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const UserIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const KeyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3" />
  </svg>
);

const NAV = [
  { href: "/settings/general", label: "General", icon: GearIcon },
  { href: "/settings/keys", label: "API keys", icon: KeyIcon },
  { href: "/settings/account", label: "Account", icon: UserIcon },
];

export default function SettingsShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  return (
    <div className={`ds ${drawer ? "ds--drawer" : ""}`}>
      <aside className="ds-side">
        <div className="ds-side-head">
          <Link href="/" className="brand">
            <span className="brand-mark">f</span>
            <span>Fastscraping</span>
          </Link>
          <button className="ds-drawer-close" onClick={() => setDrawer(false)} aria-label="Close menu">
            ×
          </button>
        </div>

        <nav className="ds-nav">
          <Link href="/dashboard" className="ds-item" onClick={() => setDrawer(false)}>
            <span className="ds-item-label">← Dashboard</span>
          </Link>

          <div className="ds-cat" style={{ marginTop: 10 }}>
            <div className="ds-cat-head">Settings</div>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setDrawer(false)}
                className={`set-item ${pathname === n.href ? "is-active" : ""}`}
              >
                <span className="set-ic">{n.icon}</span>
                <span className="ds-item-label">{n.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="ds-side-foot">
          {user.role === "ADMIN" && (
            <Link href="/admin" className="ds-item" onClick={() => setDrawer(false)}>
              <span className="ds-item-label">Admin</span>
              <span className="ds-tag">admin</span>
            </Link>
          )}
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
