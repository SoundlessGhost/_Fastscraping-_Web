/// Routes that render their own shell (sidebar + top bar). The marketing
/// header and footer must stay out of them — both sides of the app check this,
/// so adding a new shell route only means editing this list.
export function isAppRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
}
