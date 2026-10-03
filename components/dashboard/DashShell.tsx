"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildTree, endpointLabel, platformLabel, type ServiceNode } from "@/lib/services/taxonomy";
import type { SessionUser } from "@/lib/auth/session";
import AccountFoot from "@/components/dashboard/AccountFoot";
import { ConfirmProvider } from "@/components/ui/Confirm";
import BrandMark from "@/components/brand/BrandMark";
import HelpMenu from "@/components/dashboard/HelpMenu";
import { IcCard, IcHelp, IcPlus } from "@/components/dashboard/icons";

// The frame every dashboard page sits in: service tree on the left, account
// bar on top. The tree is rendered from the catalog the layout loaded, so it is
// already correct on first paint — no loading flash.

function serviceHref(slug: string) {
  return `/dashboard/s/${slug}`;
}

/// A leaf's own label. The service name wins: it is the specific thing an admin
/// typed ("PDP (compose get_pc)"), while the endpoint label is a shared category
/// — two services on the same endpoint would otherwise render identically.
function leafLabel(s: ServiceNode) {
  return s.name || (s.endpoint ? endpointLabel(s.endpoint) : s.slug);
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
  const [drawer, setDrawer] = useState(false);

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

  const activeService = activeSlug ? services.find((s) => s.slug === activeSlug) : null;
  const pageTitle = activeService
    ? `${platformLabel(activeService.platform)} · ${leafLabel(activeService)}`
    : pathname === "/dashboard/billing"
      ? "Billing & credits"
      : pathname === "/dashboard/support"
        ? "Support"
        : "Dashboard";

  return (
    <div className={`ds ${drawer ? "ds--drawer" : ""}`}>
      <aside className="ds-side">
        <div className="ds-side-head">
          <Link href="/" className="ds-logo" aria-label="Fastscraping home">
            <BrandMark size={24} />
            <span>fastscraping</span>
            <span className="ds-logo-sub">Console</span>
          </Link>
          <button className="ds-drawer-close" onClick={() => setDrawer(false)} aria-label="Close menu">
            ×
          </button>
        </div>

        <nav className="ds-nav">
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
            href="/dashboard/billing"
            className={`ds-item ${pathname === "/dashboard/billing" ? "is-active" : ""}`}
            onClick={() => setDrawer(false)}
          >
            <span className="ds-item-ic">{IcCard}</span>
            <span className="ds-item-label">Billing &amp; credits</span>
          </Link>
          <Link
            href="/dashboard/support"
            className={`ds-item ${pathname === "/dashboard/support" ? "is-active" : ""}`}
            onClick={() => setDrawer(false)}
          >
            <span className="ds-item-ic">{IcHelp}</span>
            <span className="ds-item-label">Support</span>
          </Link>
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
      <div className="ds-main">
        <header className="ds-top">
          <button className="ds-burger" onClick={() => setDrawer(true)} aria-label="Open menu">
            <span />
            <span />
          </button>
          <span className="ds-top-title">{pageTitle}</span>
          <span className="ds-top-spacer" />
          <HelpMenu />
          <Link href="/dashboard/billing" className="ds-tb ds-tb--pri">
            {IcPlus}
            <span className="ds-tb-label">Buy credits</span>
          </Link>
        </header>
        <main className="ds-content">
          <ConfirmProvider>{children}</ConfirmProvider>
        </main>
      </div>
    </div>
  );
}
