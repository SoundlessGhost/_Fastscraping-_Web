import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

/// Serves a stored avatar. Signed-in only — a profile picture isn't secret, but
/// it also isn't something the open internet needs to be able to enumerate by
/// user id.
///
/// Cached hard and privately: the URL carries a ?v= stamp that changes on every
/// upload, so a stale picture can't stick around.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return new NextResponse(null, { status: 401 });

  const { id } = await ctx.params;
  const avatar = await prisma.avatar.findUnique({ where: { userId: id } });
  if (!avatar) return new NextResponse(null, { status: 404 });

  const bytes = Uint8Array.from(avatar.data);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": avatar.mime,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
