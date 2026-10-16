import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getCodeBody, codesToken } from "@/lib/otp/codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenOk(got: string): boolean {
  const want = codesToken();
  if (!want || got.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

// Public reading-pane body fetch, gated only by the long secret in the URL (same
// as the list endpoint). Wrong/absent token → 404.
export async function GET(_req: Request, ctx: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await ctx.params;
  if (!tokenOk(token)) return new NextResponse("Not found", { status: 404 });
  const body = await getCodeBody(id);
  if (!body) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({ ok: true, ...body });
}
