import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

/// Sign out everywhere except the browser making the request — the client-side
/// twin of the admin's revoke button.
export async function DELETE() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const cookie = await getSessionCookie();
  const { count } = await prisma.session.updateMany({
    where: { userId: me.id, revokedAt: null, id: { not: cookie.sessionId ?? "" } },
    data: { revokedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: { actorId: me.id, action: "user.sessions_revoke", target: me.email, meta: { count } },
  });

  return NextResponse.json({ ok: true, revoked: count });
}
