import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "fs_session";

// --- CSRF: state-changing requests must be same-origin ------------------------
//
// The browser stamps `Origin` on cross-site requests and page JavaScript can't
// forge it, so comparing it to our own host blocks cross-site request forgery
// even when a session cookie rides along (a second layer under sameSite=lax).
//
// We block only on a *positive* mismatch: a request with no Origin/Referer isn't
// a browser-driven cross-site request (CSRF relies on the victim's browser auto-
// sending cookies, and browsers always send Origin on such POSTs), so absent
// headers are allowed rather than breaking non-browser clients.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// The origins the app is legitimately served from. Explicit, so the check holds
// regardless of what Host the container sees behind Caddy.
const ALLOWED_HOSTS = new Set(["www.fastscraping.com", "fastscraping.com"]);

/// null = header absent (no signal). true/false = matches / mismatches us.
function hostMatches(value: string | null, selfHost: string | null): boolean | null {
  if (!value) return null;
  try {
    const h = new URL(value).host;
    return h === selfHost || ALLOWED_HOSTS.has(h);
  } catch {
    return false; // malformed header → treat as cross-site
  }
}

function csrfOk(req: NextRequest): boolean {
  const selfHost = req.headers.get("host");
  const byOrigin = hostMatches(req.headers.get("origin"), selfHost);
  if (byOrigin !== null) return byOrigin; // Origin present → decisive
  const byReferer = hostMatches(req.headers.get("referer"), selfHost);
  if (byReferer !== null) return byReferer; // fall back to Referer
  return true; // neither present → not a browser CSRF vector
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CSRF guard runs first, on every matched route (incl. /api).
  if (!SAFE_METHODS.has(req.method) && !csrfOk(req)) {
    return NextResponse.json(
      { ok: false, error: "Cross-site request blocked." },
      { status: 403 },
    );
  }

  // The login page is never gated below.
  //
  // It used to bounce anyone holding a cookie to /dashboard, which looped
  // forever the moment a cookie outlived its session: the layout can tell the
  // session is dead and sends you to login, middleware sees the cookie and
  // sends you back, and around it goes — so a revoked user could never reach
  // the page that would let them sign in again. Whether a session is real is
  // only knowable where Prisma runs, so that decision belongs to the page.
  if (pathname.startsWith("/dashboard/login")) return NextResponse.next();

  // Cookie-presence gate for the app shell only (NOT /api — those return their
  // own 401s and some are public). The real session check happens server-side.
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!req.cookies.has(SESSION_COOKIE)) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/:path*"],
};
