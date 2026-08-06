import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminOr401 } from "@/lib/auth/guard";
import { InvoiceInput } from "@/lib/invoice";

export const runtime = "nodejs";

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/// Full edit of an existing invoice (id/number/token are never changed).
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  const { admin } = gate;

  const { id } = await ctx.params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Invoice not found." }, { status: 404 });

  const parsed = InvoiceInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const d = parsed.data;

  await prisma.invoice.update({
    where: { id },
    data: {
      clientName: d.clientName,
      clientEmail: d.clientEmail,
      clientAddress: d.clientAddress,
      items: d.items,
      currency: d.currency || "USD",
      taxAmount: d.taxAmount,
      bdtRate: d.bdtRate ?? null,
      notes: d.notes,
      paymentUrl: d.paymentUrl,
      status: d.status,
      issueDate: parseDate(d.issueDate) ?? existing.issueDate,
      dueDate: parseDate(d.dueDate),
    },
  });

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "admin.invoice_update", target: existing.number },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  const { admin } = gate;

  const { id } = await ctx.params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Invoice not found." }, { status: 404 });

  await prisma.invoice.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "admin.invoice_delete", target: existing.number },
  });

  return NextResponse.json({ ok: true });
}
