import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { adminOr401 } from "@/lib/auth/guard";
import { InvoiceInput } from "@/lib/invoice";

export const runtime = "nodejs";

/// Unguessable URL secret.
const genToken = () => randomBytes(18).toString("base64url");
/// Human reference, e.g. INV-8F3A2C.
const genNumber = () => `INV-${randomBytes(3).toString("hex").toUpperCase()}`;

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(req: Request) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  const { admin } = gate;

  const parsed = InvoiceInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const d = parsed.data;

  const issueDate = parseDate(d.issueDate) ?? new Date();

  // Number is unique; on the rare collision, try a few fresh ones.
  let created;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    try {
      created = await prisma.invoice.create({
        data: {
          token: genToken(),
          number: genNumber(),
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
          issueDate,
          dueDate: parseDate(d.dueDate),
        },
      });
    } catch (e) {
      // Unique-violation on `number` → retry; anything else → bail.
      if (attempt === 4 || !(e as { code?: string }).code) throw e;
    }
  }
  if (!created) return NextResponse.json({ ok: false, error: "Could not create invoice." }, { status: 500 });

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "admin.invoice_create", target: created.number },
  });

  return NextResponse.json({ ok: true, id: created.id, token: created.token, number: created.number });
}
