/// Routes where the marketing header + footer must NOT render — the app shells
/// (which draw their own sidebar/top bar) plus the standalone public invoice
/// page (a clean bill, no site nav). Both sides of the app check this, so adding
/// a new such route only means editing this list.
export function isAppRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/invoice") ||
    pathname.startsWith("/codes")
  );
}

/// Scrolls the marketing shell to the top. The page does NOT scroll on `window`
/// — `body` is `overflow:hidden` and `.site-scroll` is the real scroll region
/// (see app/layout.tsx) — so `window.scrollTo` is a no-op here. Call this
/// instead. Client-only; safe to import anywhere since it touches the DOM only
/// when invoked.
export function scrollShellTop(smooth = true): void {
  const opts: ScrollToOptions = { top: 0, behavior: smooth ? "smooth" : "auto" };
  const el = document.querySelector<HTMLElement>(".site-scroll");
  (el ?? window).scrollTo(opts);
}
