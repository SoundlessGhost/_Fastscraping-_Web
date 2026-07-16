import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { adminOr401 } from "@/lib/auth/guard";
import { isBootstrapAdmin } from "@/lib/auth/admins";

export const runtime = "nodejs";

const Patch = z.object({
  role: z.enum(["ADMIN", "CLIENT"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  verify: z.boolean().optional(),
});

/// Change one account. Two locks that exist to stop an admin locking everyone
/// (including themselves) out of the dashboard:
///   - you cannot demote or disable yourself
///   - you cannot demote an ADMIN_EMAILS account (login would re-promote it
///     anyway, so the UI must not pretend otherwise)
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  const { admin } = gate;

  const { id } = await ctx.params;
  const parsed = Patch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });

  const { role, status, verify } = parsed.data;

  if (target.id === admin.id && (role === "CLIENT" || status === "DISABLED")) {
    return NextResponse.json(
      { ok: false, error: "You can't remove your own admin access." },
      { status: 400 },
    );
  }

  if (role === "CLIENT" && isBootstrapAdmin(target.email)) {
    return NextResponse.json(
      { ok: false, error: "This account is an admin via ADMIN_EMAILS. Remove it from that list first." },
      { status: 400 },
    );
  }

  const data: { role?: "ADMIN" | "CLIENT"; status?: "ACTIVE" | "DISABLED"; emailVerifiedAt?: Date } = {};
  if (role) data.role = role;
  if (status) data.status = status;
  if (verify) data.emailVerifiedAt = new Date();

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "Nothing to change." }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id }, data });

  // Disabling should take effect now, not at the next login.
  if (status === "DISABLED") {
    await prisma.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "admin.user_update", target: target.email, meta: data },
  });

  return NextResponse.json({ ok: true, user: { id: updated.id, role: updated.role, status: updated.status } });
}

/// Delete an account. Cascades to its sessions and its stored keys; usage on
/// the service backends is untouched.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  const { admin } = gate;

  const { id } = await ctx.params;
  if (id === admin.id) {
    return NextResponse.json({ ok: false, error: "You can't delete your own account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });

  await prisma.user.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "admin.user_delete", target: target.email },
  });

  return NextResponse.json({ ok: true });
}
