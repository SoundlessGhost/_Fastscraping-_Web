import { z } from "zod";

// Shared invoice types, validation and money math. No node:crypto here so the
// admin form (a client component) can import it for a live total preview; the
// id/number/token generators live in the create route (server only).

export type InvoiceItem = { description: string; quantity: number; unitPrice: number };

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function lineAmount(it: InvoiceItem): number {
  return round2((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0));
}

/// Subtotal (sum of line amounts), tax and grand total — the single place the
/// arithmetic lives, so the form preview, the public page and the stored figure
/// can never disagree.
export function computeTotals(items: InvoiceItem[], taxAmount = 0) {
  const subtotal = round2(items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0));
  const tax = round2(Number(taxAmount) || 0);
  return { subtotal, tax, total: round2(subtotal + tax) };
}

export function money(amount: number, currency = "USD"): string {
  const code = /^[A-Z]{3}$/.test(currency) ? currency : "USD";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(amount || 0);
}

/// Bangladeshi taka, e.g. "৳240,000.00" — used for the optional conversion line.
export function bdt(amount: number): string {
  return `৳${(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/// Unit prices can be sub-cent (e.g. $0.005 per request); showing them at the
/// usual 2 decimals rounds to $0.01 and makes qty × price stop matching the
/// line amount. Allow up to 4 decimals so the rate reads honestly, while totals
/// keep `money`'s 2-decimal cents.
export function moneyUnit(amount: number, currency = "USD"): string {
  const code = /^[A-Z]{3}$/.test(currency) ? currency : "USD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount || 0);
}

const Item = z.object({
  description: z.string().trim().min(1, "Each line needs a description.").max(200),
  quantity: z.number().min(0).max(1_000_000_000),
  unitPrice: z.number().min(0).max(1_000_000_000),
});

/// Empty-string-friendly optional text (form fields send "" for blanks).
const optText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null));

/// What the admin create/edit form submits. Dates arrive as `yyyy-mm-dd`.
export const InvoiceInput = z.object({
  clientName: z.string().trim().min(1, "Client name is required.").max(160),
  clientEmail: optText(200),
  clientAddress: optText(300),
  items: z.array(Item).min(1, "Add at least one line item."),
  currency: z.string().trim().max(3).default("USD"),
  taxAmount: z.number().min(0).max(1_000_000_000).default(0),
  /// Null/absent = no BDT conversion shown.
  bdtRate: z.number().min(0).max(100000).nullable().optional(),
  notes: optText(1000),
  paymentUrl: optText(1000),
  status: z.enum(["UNPAID", "PAID"]).default("UNPAID"),
  issueDate: z.string().min(1),
  dueDate: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
});

export type InvoiceInputT = z.infer<typeof InvoiceInput>;
