import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminOr401 } from "@/lib/auth/guard";

export const runtime = "nodejs";

/// Sign a user out of every device. Sessions live in Postgres precisely so this
/// is possible — revoking here takes effect on their next request.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  const { admin } = gate;

  const { id } = await ctx.params;
  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!target) return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });

  const { count } = await prisma.session.updateMany({
    where: { userId: id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "admin.sessions_revoke", target: target.email, meta: { count } },
  });

  return NextResponse.json({ ok: true, revoked: count });
}
