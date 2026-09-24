import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public base URL of this request, honouring the reverse proxy (Caddy sets
// x-forwarded-proto/host). Works for http://localhost:3000 in dev and
// https://www.fastscraping.com in prod without extra config.
function baseUrl(h: Headers): string {
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

// Kicks off Google OAuth: stashes a CSRF `state` in an httpOnly cookie and
// redirects to Google's consent screen. The matching callback lives at
// /api/auth/google/callback (register both dev + prod URLs in Google Cloud).
export async function GET() {
  const h = await headers();
  const origin = baseUrl(h);
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(`${origin}/dashboard/login?error=google_unconfigured`);
  }

  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = `${origin}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
  res.cookies.set("g_oauth_state", state, {
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
