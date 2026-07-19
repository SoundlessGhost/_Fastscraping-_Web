import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { isBootstrapAdmin } from "@/lib/auth/admins";
import {
  checkLoginThrottle,
  recordLoginFailure,
  clearLoginFailures,
  clientIp,
} from "@/lib/auth/throttle";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email().max(160),
  password: z.string().max(200),
});

// Deliberately vague so this endpoint can't be used to discover which emails exist.
const INVALID = "Invalid email or password.";
const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: INVALID }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const ip = clientIp(req);

  // Rate-limit gate — before any password work, so brute-force / credential-
  // stuffing can't run unbounded. Applies whether or not the account exists.
  const throttled = await checkLoginThrottle(email, ip);
  if (throttled) {
    return NextResponse.json(
      { ok: false, error: TOO_MANY },
      { status: 429, headers: { "Retry-After": String(throttled.retryAfter) } },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    await recordLoginFailure(email, ip);
    return NextResponse.json({ ok: false, error: INVALID }, { status: 401 });
  }

  const good = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!good) {
    await recordLoginFailure(email, ip);
    return NextResponse.json({ ok: false, error: INVALID }, { status: 401 });
  }

  // Correct password — clear the ledger for these keys so a legitimate user who
  // fumbled a few times isn't left locked out.
  await clearLoginFailures(email, ip);

  if (!user.emailVerifiedAt) {
    return NextResponse.json(
      { ok: false, error: "Please verify your email first.", needsVerification: true },
      { status: 403 },
    );
  }
  if (user.status !== "ACTIVE") {
    return NextResponse.json(
      { ok: false, error: "This account has been disabled. Contact support." },
      { status: 403 },
    );
  }

  // Keeps ADMIN_EMAILS authoritative even if the account signed up earlier.
  let role = user.role;
  if (isBootstrapAdmin(email) && role !== "ADMIN") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    role = "ADMIN";
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, role });
}
