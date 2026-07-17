"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { buildTree, endpointLabel, type ServiceNode } from "@/lib/services/taxonomy";
import type { SessionUser } from "@/lib/auth/session";
import Avatar from "@/components/dashboard/Avatar";

// The frame every dashboard page sits in: service tree on the left, account
// bar on top. The tree is rendered from the catalog the layout loaded, so it is
// already correct on first paint — no loading flash.

function serviceHref(slug: string) {
  return `/dashboard/s/${slug}`;
}

/// A leaf's own label: the endpoint name if it has one, else the service name.
function leafLabel(s: ServiceNode) {
  return s.endpoint ? endpointLabel(s.endpoint) : s.name;
}

export default function DashShell({
  user,
  services,
  children,
}: {
  user: SessionUser;
  services: ServiceNode[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [busy, setBusy] = useState(false);

  const tree = useMemo(() => buildTree(services), [services]);
  const activeSlug = pathname.startsWith("/dashboard/s/") ? pathname.split("/")[3] : null;

  // Open a platform when it holds the page you are on, or when you have a key
  // in it. Everything else starts folded so the tree stays scannable.
  const initiallyOpen = useMemo(() => {
    const open = new Set<string>();
    for (const cat of tree) {
      for (const plat of cat.platforms) {
        const holdsActive = plat.regions.some((r) => r.services.some((s) => s.slug === activeSlug));
        if (holdsActive || plat.connected > 0) open.add(`${cat.category}/${plat.platform}`);
      }
    }
    return open;
  }, [tree, activeSlug]);

  const [opened, setOpened] = useState<Set<string>>(initiallyOpen);
  const [touched, setTouched] = useState(false);
  const isOpen = (key: string) => (touched ? opened.has(key) : initiallyOpen.has(key));

  function togglePlatform(key: string) {
    const next = new Set(touched ? opened : initiallyOpen);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setTouched(true);
    setOpened(next);
  }

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/dashboard/login");
    router.refresh();
  }

  const connectedCount = services.filter((s) => s.connection).length;

  return (
    <div className={`ds ${drawer ? "ds--drawer" : ""}`}>
      <aside className="ds-side">
        <div className="ds-side-head">
          {/* Same markup as the site header, so the logo is literally the
              same logo — not a lookalike. Styles come from base.css. */}
          <Link href="/" className="brand">
            <span className="brand-mark">f</span>
            <span>Fastscraping</span>
          </Link>
          <button className="ds-drawer-close" onClick={() => setDrawer(false)} aria-label="Close menu">
            ×
          </button>
        </div>

        <nav className="ds-nav">
          <Link
            href="/dashboard"
            className={`ds-item ${pathname === "/dashboard" ? "is-active" : ""}`}
            onClick={() => setDrawer(false)}
          >
            <span className="ds-item-label">Overview</span>
            <span className="ds-count">{connectedCount}</span>
          </Link>

          {tree.map((cat) => (
            <div className="ds-cat" key={cat.category}>
              <div className="ds-cat-head">{cat.label}</div>

              {cat.platforms.map((plat) => {
                const key = `${cat.category}/${plat.platform}`;
                const open = isOpen(key);

                // A brand with a single service and no region or endpoint under
                // it is the service. Nesting it would print its name twice with
                // a pointless "All regions" in between, so link it directly.
                const only =
                  plat.regions.length === 1 &&
                  plat.regions[0].region === null &&
                  plat.regions[0].services.length === 1 &&
                  !plat.regions[0].services[0].endpoint
                    ? plat.regions[0].services[0]
                    : null;

                if (only) {
                  const state = only.connection
                    ? only.connection.lastError
                      ? "err"
                      : "on"
                    : only.status === "ACTIVE"
                      ? "off"
                      : "soon";
                  return (
                    <Link
                      key={key}
                      href={serviceHref(only.slug)}
                      onClick={() => setDrawer(false)}
                      className={`ds-plat-solo ${activeSlug === only.slug ? "is-active" : ""}`}
                      title={state === "soon" ? "Not live yet" : undefined}
                    >
                      <span className={`ds-dot ds-dot--${state}`} aria-hidden="true" />
                      <span className="ds-plat-name">{plat.label}</span>
                    </Link>
                  );
                }

                return (
                  <div className="ds-plat" key={key}>
                    <button
                      className={`ds-plat-head ${open ? "is-open" : ""}`}
                      onClick={() => togglePlatform(key)}
                      aria-expanded={open}
                    >
                      <span className="ds-chev" aria-hidden="true" />
                      <span className="ds-plat-name">{plat.label}</span>
                      <span className="ds-count">
                        {plat.connected}/{plat.count}
                      </span>
                    </button>

                    {open && (
                      <div className="ds-plat-body">
                        {plat.regions.map((reg) => (
                          <div className="ds-reg" key={reg.region ?? "_all"}>
                            <div className="ds-reg-head">{reg.label}</div>
                            {reg.services.map((s) => {
                              const state = s.connection
                                ? s.connection.lastError
                                  ? "err"
                                  : "on"
                                : s.status === "ACTIVE"
                                  ? "off"
                                  : "soon";
                              return (
                                <Link
                                  key={s.slug}
                                  href={serviceHref(s.slug)}
                                  onClick={() => setDrawer(false)}
                                  className={`ds-svc ${activeSlug === s.slug ? "is-active" : ""}`}
                                  title={
                                    state === "soon"
                                      ? "Not wired to a backend yet"
                                      : state === "off"
                                        ? "Add your API key to view usage"
                                        : undefined
                                  }
                                >
                                  <span className={`ds-dot ds-dot--${state}`} aria-hidden="true" />
                                  <span className="ds-svc-name">{leafLabel(s)}</span>
                                </Link>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="ds-side-foot">
          <Link
            href="/dashboard/settings"
            className={`ds-item ${pathname === "/dashboard/settings" ? "is-active" : ""}`}
            onClick={() => setDrawer(false)}
          >
            <span className="ds-item-label">Settings</span>
          </Link>
          {user.role === "ADMIN" && (
            <Link href="/admin" className="ds-item" onClick={() => setDrawer(false)}>
              <span className="ds-item-label">Admin</span>
              <span className="ds-tag">admin</span>
            </Link>
          )}
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
          <Link href="/dashboard/settings" className="ds-avatar" title="Account settings">
            <Avatar user={user} size={32} />
          </Link>
          <button className="btn btn-ghost ds-logout" onClick={logout} disabled={busy}>
            {busy ? "…" : "Log out"}
          </button>
        </header>

        <main className="ds-content">{children}</main>
      </div>
    </div>
  );
}
