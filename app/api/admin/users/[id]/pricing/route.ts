import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { adminOr401 } from "@/lib/auth/guard";

export const runtime = "nodejs";

const Body = z.object({
  slug: z.string().min(1).max(60),
  /// Null clears the override, so the service default applies again.
  pricePer1000: z.number().min(0).max(100000).nullable(),
});

/// Sets what this client pays per 1,000 billable requests for one service.
/// Rates are negotiated per client, so this overrides the service default; the
/// backend's own `pricing` (if it ever reports one) still wins over both.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  const { admin } = gate;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid rate." }, { status: 400 });
  }
  const { slug, pricePer1000 } = parsed.data;

  const { id } = await ctx.params;
  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!target) return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });

  const link = await prisma.clientService.findFirst({
    where: { userId: id, service: { slug } },
    select: { id: true },
  });
  if (!link) {
    return NextResponse.json({ ok: false, error: "This client has no key for that service." }, { status: 404 });
  }

  await prisma.clientService.update({ where: { id: link.id }, data: { pricePer1000 } });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "admin.pricing_set",
      target: target.email,
      meta: { slug, pricePer1000 },
    },
  });

  return NextResponse.json({ ok: true, pricePer1000 });
}
