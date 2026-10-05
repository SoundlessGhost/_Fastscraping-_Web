import { NextResponse } from "next/server";
import { Resend } from "resend";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { COMPANY } from "@/lib/company";
import { creditStripeSession, stripe, usd } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/// Stripe calls this after a payment. The signature check proves the event came
/// from Stripe, so nobody can credit a wallet by posting here themselves.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const sig = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.purpose !== "wallet_topup") return NextResponse.json({ received: true });
    const result = await creditStripeSession(session);
    if (result === "credited") await notifyTopup(session).catch((e) => console.error("[stripe] notify failed", e));
  }

  return NextResponse.json({ received: true });
}

async function notifyTopup(session: Stripe.Checkout.Session) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const user = await prisma.user.findUnique({ where: { id: session.metadata?.userId ?? "" }, select: { email: true } });
  const amount = usd(session.amount_total ?? 0);
  await new Resend(key).emails.send({
    from: process.env.CONTACT_FROM ?? "Fastscraping <notes@fastscraping.com>",
    to: process.env.BILLING_NOTIFY_TO ?? process.env.CONTACT_TO ?? COMPANY.email,
    subject: `[Wallet] ${amount} card top-up · ${user?.email ?? "unknown"}`,
    text: `${user?.email ?? "A client"} added ${amount} to their wallet by card.\nStripe session: ${session.id}\n\nMove it onto their API key credits from Admin > Users.`,
  });
}
