import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { isBootstrapAdmin } from "@/lib/auth/admins";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function baseUrl(h: Headers): string {
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

// Google redirects here with ?code&state. We verify state, exchange the code
// for a profile, find-or-create the user (Google accounts have no password —
// passwordHash stays null), open a session and land them on the dashboard.
export async function GET(req: NextRequest) {
  const h = await headers();
  const origin = baseUrl(h);
  const fail = (err: string) => {
    const res = NextResponse.redirect(`${origin}/dashboard/login?error=${err}`);
    res.cookies.delete("g_oauth_state");
    return res;
  };

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("g_oauth_state")?.value;

  if (req.nextUrl.searchParams.get("error")) return fail("google_denied");
  if (!code || !state || !savedState || state !== savedState) return fail("google_state");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("google_unconfigured");

  const redirectUri = `${origin}/api/auth/google/callback`;

  // 1) code -> tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return fail("google_token");
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) return fail("google_token");

  // 2) tokens -> profile
  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!infoRes.ok) return fail("google_profile");
  const info = (await infoRes.json()) as {
    email?: string;
    email_verified?: boolean;
    given_name?: string;
    family_name?: string;
  };

  const email = (info.email ?? "").trim().toLowerCase();
  if (!email || info.email_verified === false) return fail("google_email");

  // 3) find or create the user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        firstName: info.given_name || null,
        lastName: info.family_name || null,
        emailVerifiedAt: new Date(),
        role: isBootstrapAdmin(email) ? "ADMIN" : "CLIENT",
      },
    });
  } else {
    if (user.status !== "ACTIVE") return fail("account_disabled");
    const patch: { emailVerifiedAt?: Date; role?: "ADMIN" } = {};
    if (!user.emailVerifiedAt) patch.emailVerifiedAt = new Date();
    if (isBootstrapAdmin(email) && user.role !== "ADMIN") patch.role = "ADMIN";
    if (Object.keys(patch).length) {
      user = await prisma.user.update({ where: { id: user.id }, data: patch });
    }
  }

  // 4) open the session and clear the CSRF cookie
  await createSession(user.id);
  const res = NextResponse.redirect(`${origin}/dashboard`);
  res.cookies.delete("g_oauth_state");
  return res;
}
