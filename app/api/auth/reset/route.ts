import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { consumeCode } from "@/lib/auth/codes";
import {
  daysUntilPasswordChangeAllowed,
  hashPassword,
  passwordProblem,
} from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email().max(160),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
  password: z.string().max(200),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const { code, password } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  const pwProblem = passwordProblem(password);
  if (pwProblem) return NextResponse.json({ ok: false, error: pwProblem }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.emailVerifiedAt || user.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Business rule: a password may only be changed once every 30 days.
  const waitDays = daysUntilPasswordChangeAllowed(user.lastPasswordChangeAt);
  if (waitDays > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `Your password was changed recently. You can change it again in ${waitDays} day${waitDays === 1 ? "" : "s"}.`,
      },
      { status: 429 },
    );
  }

  const check = await consumeCode(email, "RESET", code);
  if (!check.ok) return NextResponse.json({ ok: false, error: check.error }, { status: 400 });

  const now = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password), lastPasswordChangeAt: now },
  });

  // A password reset logs out every other device.
  await prisma.session.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: now },
  });

  await prisma.auditLog.create({
    data: { actorId: user.id, action: "user.password_reset", target: user.id },
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true, role: user.role });
}
