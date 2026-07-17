import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/crypto";

export const dynamic = "force-dynamic";

/// Reveals the caller's own stored key in full, for the copy button in
/// Settings. Separate from the catalog endpoint on purpose: the catalog is
/// fetched on every dashboard page load and only ever carries the mask, so a
/// key leaves the server only when someone deliberately asks for it.
///
/// You can only ever read your own — the lookup is scoped by session user id.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { slug } = await ctx.params;
  const service = await prisma.service.findUnique({
    where: { slug },
    include: { clientServices: { where: { userId: user.id } } },
  });

  const link = service?.clientServices[0];
  if (!link) return NextResponse.json({ error: "NOT_CONNECTED" }, { status: 404 });

  let apiKey: string;
  try {
    apiKey = decryptSecret(link.apiKeyEnc);
  } catch {
    return NextResponse.json({ error: "KEY_UNREADABLE" }, { status: 500 });
  }

  await prisma.auditLog.create({
    data: { actorId: user.id, action: "service.key_reveal", target: slug },
  });

  return NextResponse.json({ ok: true, apiKey });
}
