import { redirect } from "next/navigation";
import { getCurrentUser, getSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import Settings, { type DeviceSession } from "@/components/dashboard/Settings";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/dashboard/login");

  const cookie = await getSessionCookie();

  const [row, sessions] = await Promise.all([
    prisma.user.findUnique({ where: { id: me.id }, select: { createdAt: true } }),
    prisma.session.findMany({
      where: { userId: me.id, revokedAt: null },
      orderBy: { lastSeenAt: "desc" },
      take: 50,
    }),
  ]);

  const devices: DeviceSession[] = sessions.map((s) => ({
    id: s.id,
    userAgent: s.userAgent,
    ip: s.ip,
    lastSeenAt: s.lastSeenAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    isCurrent: s.id === cookie.sessionId,
  }));

  return (
    <Settings
      section="account"
      user={me}
      services={[]}
      keys={{}}
      memberSince={row?.createdAt.toISOString() ?? null}
      devices={devices}
    />
  );
}
