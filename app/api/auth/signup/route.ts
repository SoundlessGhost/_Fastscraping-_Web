import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { issueCode, SIGNUP_MAX_PER_DAY } from "@/lib/auth/codes";
import { sendSignupCode } from "@/lib/auth/email";

export const runtime = "nodejs";

const Body = z.object({ email: z.string().email().max(160) });

/** Step 1 of open signup: email a 6-digit verification code. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerifiedAt) {
    return NextResponse.json(
      { ok: false, error: "An account with this email already exists. Log in instead." },
      { status: 409 },
    );
  }

  const issued = await issueCode(email, "SIGNUP", { maxPerDay: SIGNUP_MAX_PER_DAY });
  if (!issued.ok) {
    return NextResponse.json(
      { ok: false, error: issued.error, retryAfter: issued.retryAfter },
      { status: 429 },
    );
  }

  const sent = await sendSignupCode(email, issued.code);
  if (!sent.ok) {
    return NextResponse.json({ ok: false, error: sent.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
