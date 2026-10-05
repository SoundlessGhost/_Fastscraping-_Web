import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminOr401 } from "@/lib/auth/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/// Admin wallet entry: record a bank transfer, or adjust the balance (negative
/// when wallet money is moved onto the client's API key as request credits).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const amount = Number(body?.amountUsd);
  const source = body?.source === "bank" ? "bank" : "admin";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 200) : "";
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 100000) {
    return NextResponse.json({ ok: false, error: "Enter a non-zero amount in USD." }, { status: 400 });
  }
  if (!note) return NextResponse.json({ ok: false, error: "Add a short note (invoice number or reason)." }, { status: 400 });
  if (source === "bank" && amount < 0) {
    return NextResponse.json({ ok: false, error: "A bank transfer must be a positive amount." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });

  const cents = Math.round(amount * 100);
  const txn = await prisma.walletTxn.create({
    data: { userId: id, amountCents: cents, kind: source === "bank" ? "TOPUP" : "ADJUST", source, note, actorId: gate.admin.id },
  });
  await prisma.auditLog.create({
    data: { actorId: gate.admin.id, action: "wallet.admin_entry", target: id, meta: { cents, source, note, txn: txn.id } },
  });
  return NextResponse.json({ ok: true });
}
