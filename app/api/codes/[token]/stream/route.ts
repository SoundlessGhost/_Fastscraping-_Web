import { timingSafeEqual } from "node:crypto";
import { codesToken } from "@/lib/otp/codes";
import { codesEventStream } from "@/lib/otp/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenOk(got: string): boolean {
  const want = codesToken();
  if (!want || got.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

// Public real-time stream, gated by the same URL secret as the page. Wrong token
// → 404, identical to the JSON route.
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!tokenOk(token)) return new Response("Not found", { status: 404 });
  return codesEventStream(req.signal);
}
