import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { consumeCode } from "@/lib/auth/codes";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { isBootstrapAdmin } from "@/lib/auth/admins";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email().max(160),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
  password: z.string().max(200),
  name: z.string().max(120).optional(),
  company: z.string().max(120).optional(),
});

/** Step 2 of signup: verify the code, set the password, create the account. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const { code, password, name, company } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  const pwProblem = passwordProblem(password);
  if (pwProblem) return NextResponse.json({ ok: false, error: pwProblem }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerifiedAt) {
    return NextResponse.json(
      { ok: false, error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const check = await consumeCode(email, "SIGNUP", code);
  if (!check.ok) return NextResponse.json({ ok: false, error: check.error }, { status: 400 });

  const now = new Date();
  const passwordHash = await hashPassword(password);
  const admin = isBootstrapAdmin(email);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name: name?.trim() || null,
      company: company?.trim() || null,
      emailVerifiedAt: now,
      lastPasswordChangeAt: now,
      role: admin ? "ADMIN" : "CLIENT",
    },
    update: {
      passwordHash,
      name: name?.trim() || null,
      company: company?.trim() || null,
      emailVerifiedAt: now,
      lastPasswordChangeAt: now,
      ...(admin ? { role: "ADMIN" as const } : {}),
    },
  });

  await prisma.auditLog.create({
    data: { actorId: user.id, action: "user.signup", target: user.id },
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true, role: user.role });
}
