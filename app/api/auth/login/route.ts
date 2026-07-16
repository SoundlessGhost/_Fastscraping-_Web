import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { isBootstrapAdmin } from "@/lib/auth/admins";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email().max(160),
  password: z.string().max(200),
});

// Deliberately vague so this endpoint can't be used to discover which emails exist.
const INVALID = "Invalid email or password.";

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: INVALID }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    return NextResponse.json({ ok: false, error: INVALID }, { status: 401 });
  }

  const good = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!good) {
    return NextResponse.json({ ok: false, error: INVALID }, { status: 401 });
  }

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
