import { redirect } from "next/navigation";
import { getCurrentUser, getSessionCookie } from "@/lib/auth/session";
import { getCatalogForUser } from "@/lib/services/catalog";
import { prisma } from "@/lib/db";
import { daysUntilPasswordChangeAllowed } from "@/lib/auth/password";
import Settings, { type DeviceSession } from "@/components/dashboard/Settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/dashboard/login");

  const cookie = await getSessionCookie();

  const [row, sessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: me.id },
      select: { lastPasswordChangeAt: true, createdAt: true },
    }),
    prisma.session.findMany({
      where: { userId: me.id, revokedAt: null },
      orderBy: { lastSeenAt: "desc" },
      take: 20,
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
      user={me}
      services={(await getCatalogForUser(me.id)).filter((s) => s.connection)}
      passwordWaitDays={daysUntilPasswordChangeAllowed(row?.lastPasswordChangeAt ?? null)}
      memberSince={row?.createdAt.toISOString() ?? null}
      devices={devices}
    />
  );
}
