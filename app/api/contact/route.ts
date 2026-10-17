import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  buildContactHtml,
  buildContactText,
  type ContactPayload,
} from "@/lib/contact-email";
import { clientIp, rateLimited, turnstileConfigured, verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const trimStr = (v: unknown, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

// Anti-spam (2026-10-17, after a run of scripted fake "trial key" enquiries):
//  1. honeypot field `website` — bots fill it, humans never see it; we answer
//     ok:true and silently drop the note so the script learns nothing;
//  2. per-IP limit — 3 notes per 10 minutes;
//  3. Cloudflare Turnstile — enforced only when TURNSTILE_SECRET_KEY is set.
const RL_MAX = 3;
const RL_WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ContactPayload> & {
      website?: unknown;
      turnstileToken?: unknown;
    };

    if (trimStr(body.website, 200)) {
      console.warn("[contact] honeypot hit, dropped");
      return NextResponse.json({ ok: true });
    }

    const ip = clientIp(req);
    if (ip && rateLimited(`contact:${ip}`, RL_MAX, RL_WINDOW_MS)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again in a few minutes." },
        { status: 429 },
      );
    }

    if (turnstileConfigured()) {
      const v = await verifyTurnstile(trimStr(body.turnstileToken, 2048), ip);
      if (!v.ok) {
        console.warn("[contact] turnstile failed", v.reason, ip);
        return NextResponse.json(
          { ok: false, error: "Please complete the verification and try again." },
          { status: 400 },
        );
      }
    }

    const payload: ContactPayload = {
      name: trimStr(body.name, 120),
      company: trimStr(body.company, 120),
      email: trimStr(body.email, 160),
      topic: trimStr(body.topic, 120),
      message: trimStr(body.message, 4000),
    };

    if (payload.name.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Name is required." },
        { status: 400 },
      );
    }
    if (!isEmail(payload.email)) {
      return NextResponse.json(
        { ok: false, error: "Valid email required." },
        { status: 400 },
      );
    }
    if (!payload.topic) {
      return NextResponse.json(
        { ok: false, error: "Please pick a topic." },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[contact] missing RESEND_API_KEY");
      return NextResponse.json(
        { ok: false, error: "Email service not configured." },
        { status: 500 },
      );
    }

    const resend = new Resend(apiKey);
    const from = process.env.CONTACT_FROM ?? "Fastscraping <notes@fastscraping.com>";
    const to = process.env.CONTACT_TO ?? "khalid@fastscraping.com";

    const subject = `New enquiry · ${payload.topic} · ${payload.name}${payload.company ? ` (${payload.company})` : ""}`;

    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: payload.email,
      subject,
      html: buildContactHtml(payload),
      text: buildContactText(payload),
    });

    if (error) {
      console.error("[contact] resend error", error);
      return NextResponse.json(
        { ok: false, error: "Failed to send note." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] unexpected error", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error." },
      { status: 500 },
    );
  }
}
