import { NextResponse, type NextRequest } from "next/server";

// Cookie-presence gate only. The real check (live session row + active user +
// role) happens server-side in the pages/routes, since Prisma can't run on the
// edge runtime.
const SESSION_COOKIE = "fs_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login page is never gated here.
  //
  // It used to bounce anyone holding a cookie to /dashboard, which looped
  // forever the moment a cookie outlived its session: the layout can tell the
  // session is dead and sends you to login, middleware sees the cookie and
  // sends you back, and around it goes — so a revoked user could never reach
  // the page that would let them sign in again. Whether a session is real is
  // only knowable where Prisma runs, so that decision belongs to the page.
  if (pathname.startsWith("/dashboard/login")) return NextResponse.next();

  if (!req.cookies.has(SESSION_COOKIE)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
