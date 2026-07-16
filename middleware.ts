import { NextResponse, type NextRequest } from "next/server";

// Lightweight cookie-presence gate. The real check (live session row + active
// user + role) happens server-side in the pages/routes, since Prisma can't run
// on the edge runtime.
const SESSION_COOKIE = "fs_session";

export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE);
  const { pathname } = req.nextUrl;
  const isLogin = pathname.startsWith("/dashboard/login");

  if (!isLogin && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard/login";
    return NextResponse.redirect(url);
  }

  if (isLogin && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
