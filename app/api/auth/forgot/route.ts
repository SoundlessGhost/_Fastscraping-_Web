import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { issueCode } from "@/lib/auth/codes";
import { sendResetCode } from "@/lib/auth/email";

export const runtime = "nodejs";

const Body = z.object({ email: z.string().email().max(160) });

/**
 * Always answers ok — never reveals whether an account exists.
 * A code is only actually sent when the account is real and verified.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.emailVerifiedAt && user.status === "ACTIVE") {
    const issued = await issueCode(email, "RESET");
    if (issued.ok) await sendResetCode(email, issued.code);
  }

  return NextResponse.json({ ok: true });
}
