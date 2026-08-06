import { prisma } from "@/lib/db";
import { computeTotals, type InvoiceItem } from "@/lib/invoice";
import InvoicesManager, { type AdminInvoice } from "@/components/admin/InvoicesManager";

export const dynamic = "force-dynamic";

const ymd = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

// The admin layout already gates this on role === ADMIN.
export default async function AdminInvoices() {
  const rows = await prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  const invoices: AdminInvoice[] = rows.map((r) => {
    const items = (Array.isArray(r.items) ? r.items : []) as unknown as InvoiceItem[];
    return {
      id: r.id,
      token: r.token,
      number: r.number,
      clientName: r.clientName,
      clientEmail: r.clientEmail ?? "",
      clientAddress: r.clientAddress ?? "",
      items,
      currency: r.currency,
      taxAmount: r.taxAmount,
      bdtRate: r.bdtRate,
      notes: r.notes ?? "",
      paymentUrl: r.paymentUrl ?? "",
      status: r.status,
      issueDate: ymd(r.issueDate),
      dueDate: ymd(r.dueDate),
      total: computeTotals(items, r.taxAmount).total,
      createdAt: r.createdAt.toISOString(),
    };
  });

  return <InvoicesManager invoices={invoices} />;
}
