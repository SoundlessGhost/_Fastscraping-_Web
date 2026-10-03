"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/dashboard/Avatar";
import type { SessionUser } from "@/lib/auth/session";

// The account row at the bottom of both sidebars: avatar + name + a chevron
// that opens a small menu (email, Settings, Get help, Log out).

const IconGear = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconHelp = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconOut = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function AccountFoot({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/dashboard/login");
    router.refresh();
  }

  return (
    <div className="ds-acct">
      {open && <button className="ds-acct-scrim" onClick={() => setOpen(false)} aria-hidden="true" tabIndex={-1} />}

      {open && (
        <div className="ds-acct-menu" role="menu">
          <div className="ds-acct-email" title={user.email}>{user.email}</div>
          <Link href="/settings/general" className="ds-acct-mi" role="menuitem" onClick={() => setOpen(false)}>
            <span className="ds-acct-mi-ic">{IconGear}</span> Settings
          </Link>
          <Link href="/dashboard/support" className="ds-acct-mi" role="menuitem" onClick={() => setOpen(false)}>
            <span className="ds-acct-mi-ic">{IconHelp}</span> Get help
          </Link>
          <div className="ds-acct-sep" />
          <button className="ds-acct-mi" role="menuitem" onClick={logout} disabled={busy}>
            <span className="ds-acct-mi-ic">{IconOut}</span> {busy ? "Logging out…" : "Log out"}
          </button>
        </div>
      )}

      <button
        className={`ds-acct-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar user={user} size={30} />
        <span className="ds-acct-name">{name}</span>
        <svg className="ds-acct-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
