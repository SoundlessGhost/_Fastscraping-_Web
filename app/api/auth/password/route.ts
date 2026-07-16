import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import {
  daysUntilPasswordChangeAllowed,
  hashPassword,
  passwordProblem,
  verifyPassword,
} from "@/lib/auth/password";
import { getSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

const Body = z.object({
  currentPassword: z.string().max(200),
  password: z.string().max(200),
});

/// Change your own password while signed in. Same 30-day rule as the emailed
/// reset — this is the door next to that one, not a way around it.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }
  const { currentPassword, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user?.passwordHash) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ ok: false, error: "Current password is wrong." }, { status: 400 });
  }

  const pwProblem = passwordProblem(password);
  if (pwProblem) return NextResponse.json({ ok: false, error: pwProblem }, { status: 400 });

  if (await verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { ok: false, error: "New password must be different from the current one." },
      { status: 400 },
    );
  }

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

  const now = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password), lastPasswordChangeAt: now },
  });

  // Log out everywhere else, but keep this device signed in.
  const cookie = await getSessionCookie();
  await prisma.session.updateMany({
    where: { userId: user.id, revokedAt: null, id: { not: cookie.sessionId ?? "" } },
    data: { revokedAt: now },
  });

  await prisma.auditLog.create({
    data: { actorId: user.id, action: "user.password_change", target: user.id },
  });

  return NextResponse.json({ ok: true });
}
