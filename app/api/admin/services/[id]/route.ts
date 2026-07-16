import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminOr401 } from "@/lib/auth/guard";
import { ServiceInput } from "@/lib/services/schema";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  const { admin } = gate;

  const { id } = await ctx.params;
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Service not found." }, { status: 404 });

  const parsed = ServiceInput.partial().safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const taken = await prisma.service.findUnique({ where: { slug: parsed.data.slug } });
    if (taken) return NextResponse.json({ ok: false, error: "That slug is already used." }, { status: 409 });
  }

  const data = { ...parsed.data };
  if ("region" in data) data.region = data.region || null;
  if ("endpoint" in data) data.endpoint = data.endpoint || null;
  if ("notes" in data) data.notes = data.notes || null;

  const updated = await prisma.service.update({ where: { id }, data });

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "admin.service_update", target: updated.slug, meta: data },
  });

  return NextResponse.json({ ok: true });
}

/// Deleting a service also drops every client's stored key for it (cascade).
/// The caller is expected to have shown that count first — see the confirm in
/// the services editor.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  const { admin } = gate;

  const { id } = await ctx.params;
  const existing = await prisma.service.findUnique({
    where: { id },
    include: { _count: { select: { clientServices: true } } },
  });
  if (!existing) return NextResponse.json({ ok: false, error: "Service not found." }, { status: 404 });

  await prisma.service.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "admin.service_delete",
      target: existing.slug,
      meta: { droppedKeys: existing._count.clientServices },
    },
  });

  return NextResponse.json({ ok: true, droppedKeys: existing._count.clientServices });
}
