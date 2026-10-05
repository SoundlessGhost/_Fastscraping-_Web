import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { stripe, walletConfig } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.SITE_URL ?? "https://www.fastscraping.com";

/// Start a card top-up: creates a Stripe Checkout Session for the amount the
/// client picked and returns Stripe's hosted payment URL. The wallet is only
/// credited when Stripe confirms the payment (webhook or success return).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });

  const cfg = walletConfig();
  if (!cfg.cardEnabled) {
    return NextResponse.json({ ok: false, error: "Card payments are not open yet. Pay by invoice instead." }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const amount = Math.round(Number(body?.amountUsd));
  if (!Number.isFinite(amount) || amount < cfg.min || amount > cfg.max) {
    return NextResponse.json(
      { ok: false, error: `Choose an amount between $${cfg.min} and $${cfg.max.toLocaleString("en-US")}.` },
      { status: 400 },
    );
  }

  // Light abuse guard: at most 10 checkout attempts per account per hour.
  const recent = await prisma.auditLog.count({
    where: { actorId: user.id, action: "wallet.checkout", createdAt: { gt: new Date(Date.now() - 3600_000) } },
  });
  if (recent >= 10) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try again in an hour or contact support." }, { status: 429 });
  }

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { userId: user.id, purpose: "wallet_topup" },
      payment_intent_data: { metadata: { userId: user.id, purpose: "wallet_topup" }, description: "Fastscraping wallet top-up" },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount * 100,
            product_data: {
              name: "Fastscraping wallet balance",
              description: "Prepaid balance for Fastscraping data APIs",
            },
          },
        },
      ],
      success_url: `${SITE}/dashboard/billing?topup=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/dashboard/billing?topup=cancelled`,
    });
    await prisma.auditLog.create({
      data: { actorId: user.id, action: "wallet.checkout", target: session.id, meta: { amountUsd: amount } },
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (e) {
    console.error("[billing] checkout create failed", e);
    return NextResponse.json({ ok: false, error: "Could not open the payment page. Try again or contact support." }, { status: 502 });
  }
}
