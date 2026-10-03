"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isAppRoute, scrollShellTop } from "@/lib/chrome";
import { BOOK_CALL_URL, MAIN_NAV, TRIAL_URL } from "@/lib/site-links";
import BrandMark from "@/components/brand/BrandMark";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Whether the visitor has a live session. Checked client-side so the marketing
  // pages stay static; when logged in the header shows "Dashboard" instead of
  // "Log in". Starts false so SSR and first client render match.
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { authed: false }))
      .then((d) => {
        if (alive) setAuthed(Boolean(d?.authed));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Close the drawer on navigation and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (isAppRoute(pathname)) return null;

  const same = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Already here: glide to the top of the scroll shell instead of re-navigating.
    if (href === pathname) {
      e.preventDefault();
      scrollShellTop();
    }
    setOpen(false);
  };

  const account = authed
    ? { href: "/dashboard", label: "Dashboard" }
    : { href: TRIAL_URL, label: "Log in" };

  return (
    <header className="fsx-head">
      <div className="fsx-wrap">
        <Link href="/" className="fsx-brand" aria-label="Fastscraping home" onClick={same("/")}>
          <BrandMark size={32} />
          <span>fastscraping</span>
        </Link>
        <nav className="fsx-nav" aria-label="Main">
          {MAIN_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={same(n.href)}
              aria-current={pathname === n.href ? "page" : undefined}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="fsx-actions">
          <a className="fsx-link" href={BOOK_CALL_URL} target="_blank" rel="noopener">
            Book a call
          </a>
          <Link className="fsx-link" href={account.href}>
            {account.label}
          </Link>
          <Link className="fsx-btn" href="/contact">
            Get a trial key
          </Link>
        </div>
        <button
          type="button"
          className="fsx-burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="fsx-drawer"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16131F" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      <nav id="fsx-drawer" className={`fsx-drawer${open ? " is-open" : ""}`} aria-label="Mobile">
        {MAIN_NAV.map((n) => (
          <Link key={n.href} href={n.href} onClick={same(n.href)}>
            {n.label}
          </Link>
        ))}
        <a href={BOOK_CALL_URL} target="_blank" rel="noopener">
          Book a call
        </a>
        <Link href={account.href}>{account.label}</Link>
        <Link className="fsx-btn" href="/contact">
          Get a trial key
        </Link>
      </nav>
    </header>
  );
}
