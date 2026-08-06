import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getCodes, codesToken } from "@/lib/otp/codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/// Constant-time compare so the secret can't be teased out by timing. Length
/// mismatch short-circuits (lengths aren't secret).
function tokenOk(got: string): boolean {
  const want = codesToken();
  if (!want || got.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

// Public read of the codes, gated only by the long secret in the URL. No login:
// whoever holds the link can poll it. Wrong/absent token → 404 (not 401), so the
// endpoint is indistinguishable from one that doesn't exist.
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!tokenOk(token)) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({ ok: true, ...(await getCodes()) });
}
