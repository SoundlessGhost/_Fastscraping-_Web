import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { getCurrentUser, displayName } from "@/lib/auth/session";
import { COMPANY } from "@/lib/company";
import { buildContactHtml, buildContactText } from "@/lib/contact-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOPICS = new Set([
  "Technical issue",
  "Billing or invoice",
  "Buy credits or change plan",
  "Trial key",
  "New platform or endpoint",
  "Something else",
]);

const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/// Support request from inside the dashboard. The sender is the signed-in
/// account, so nobody can file a ticket as someone else, and the reply goes
/// straight to the account email.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const topic = TOPICS.has(s(body?.topic, 60)) ? s(body.topic, 60) : "Something else";
  const service = s(body?.service, 120);
  const message = s(body?.message, 4000);
  if (message.length < 10) {
    return NextResponse.json({ ok: false, error: "Tell us a little more (at least 10 characters)." }, { status: 400 });
  }

  // A light per-account limit: five requests in ten minutes is plenty.
  const recent = await prisma.auditLog.count({
    where: { actorId: user.id, action: "support.request", createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) } },
  });
  if (recent >= 5) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[support] missing RESEND_API_KEY");
    return NextResponse.json({ ok: false, error: `Email is not configured. Write to ${COMPANY.supportEmail}.` }, { status: 500 });
  }

  const name = displayName(user) ?? user.email;
  const payload = {
    name,
    company: user.company ?? "",
    email: user.email,
    topic: `Support · ${topic}`,
    message: `${service ? `Service: ${service}\n` : ""}Account: ${user.email} (${user.id})\n\n${message}`,
  };

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.CONTACT_FROM ?? "Fastscraping <notes@fastscraping.com>",
    to: process.env.SUPPORT_TO ?? COMPANY.supportEmail,
    replyTo: user.email,
    subject: `[Support] ${topic} · ${name}`,
    html: buildContactHtml(payload),
    text: buildContactText(payload),
  });
  if (error) {
    console.error("[support] resend error", error);
    return NextResponse.json({ ok: false, error: `Could not send. Please email ${COMPANY.supportEmail}.` }, { status: 502 });
  }

  await prisma.auditLog.create({ data: { actorId: user.id, action: "support.request", target: topic } });
  return NextResponse.json({ ok: true });
}
