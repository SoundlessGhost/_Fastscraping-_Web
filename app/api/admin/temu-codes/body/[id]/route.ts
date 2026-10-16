import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { getCodeBody } from "@/lib/otp/codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The Shopee reading pane fetches one email's full body on click (kept out of
// the list payload, which the dashboard polls). Admin-gated, same as the list.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  const { id } = await ctx.params;
  const body = await getCodeBody(id);
  if (!body) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({ ok: true, ...body });
}
