import "server-only";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

/// Prepaid wallet: clients add USD by card (Stripe Checkout) or by bank
/// transfer against an invoice. Card data never touches this server; Stripe
/// hosts the payment page and tells us about the payment through a signed
/// webhook.
///
/// Server env (all optional; card top-up stays off until both keys are set):
///   STRIPE_SECRET_KEY       restricted key (rk_...) with Checkout Sessions: Write
///   STRIPE_WEBHOOK_SECRET   whsec_... for /api/stripe/webhook
///   WALLET_MIN_USD=50       smallest card top-up
///   WALLET_MAX_USD=5000     largest card top-up (bigger amounts go by invoice)
///   WALLET_PRESETS=100,250,500,1000

export const WALLET_TOPUP_ACTION = "wallet.topup";

function int(name: string, fallback: number): number {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function walletConfig() {
  const min = int("WALLET_MIN_USD", 50);
  const max = Math.max(min, int("WALLET_MAX_USD", 5000));
  const presets = (process.env.WALLET_PRESETS ?? "100,250,500,1000")
    .split(",")
    .map((x) => Number.parseInt(x.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= min && n <= max);
  return {
    cardEnabled: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET,
    min,
    max,
    presets: presets.length ? presets : [min],
  };
}

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!_stripe) _stripe = new Stripe(key, { maxNetworkRetries: 2, timeout: 20000 });
  return _stripe;
}

export async function walletBalanceCents(userId: string): Promise<number> {
  const agg = await prisma.walletTxn.aggregate({ where: { userId }, _sum: { amountCents: true } });
  return agg._sum.amountCents ?? 0;
}

export function usd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/// Credit a paid Checkout Session exactly once. Safe to call from both the
/// webhook and the success redirect: the unique stripeSessionId makes the
/// second call a no-op.
export async function creditStripeSession(session: Stripe.Checkout.Session): Promise<"credited" | "duplicate" | "skipped"> {
  if (session.payment_status !== "paid") return "skipped";
  const userId = session.metadata?.userId ?? session.client_reference_id ?? "";
  const cents = session.amount_total ?? 0;
  if (!userId || cents <= 0 || (session.currency ?? "usd").toLowerCase() !== "usd") return "skipped";
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return "skipped";
  try {
    await prisma.walletTxn.create({
      data: {
        userId,
        amountCents: cents,
        kind: "TOPUP",
        source: "stripe",
        stripeSessionId: session.id,
        note: `Card top-up ${typeof session.payment_intent === "string" ? session.payment_intent : ""}`.trim(),
      },
    });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") return "duplicate";
    throw e;
  }
  await prisma.auditLog.create({
    data: { actorId: userId, action: WALLET_TOPUP_ACTION, target: session.id, meta: { cents, source: "stripe" } },
  });
  return "credited";
}
