import { redirect } from "next/navigation";
import { getCurrentUser, getSessionCookie } from "@/lib/auth/session";
import { getCatalogForUser } from "@/lib/services/catalog";
import { prisma } from "@/lib/db";
import { daysUntilPasswordChangeAllowed } from "@/lib/auth/password";
import { decryptSecret } from "@/lib/crypto";
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

  const connected = (await getCatalogForUser(me.id)).filter((s) => s.connection);

  // Decrypted here, and only here: Settings is the one page that shows a key in
  // full, so Reveal can be a local toggle instead of another round trip. Every
  // other page only ever receives the mask.
  const links = await prisma.clientService.findMany({
    where: { userId: me.id },
    include: { service: { select: { slug: true } } },
  });
  const keys: Record<string, string> = {};
  for (const l of links) {
    try {
      keys[l.service.slug] = decryptSecret(l.apiKeyEnc);
    } catch {
      // Key unreadable (ENCRYPTION_KEY changed) — leave it out; the row falls
      // back to the mask rather than the page failing.
    }
  }

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
      services={connected}
      keys={keys}
      passwordWaitDays={daysUntilPasswordChangeAllowed(row?.lastPasswordChangeAt ?? null)}
      memberSince={row?.createdAt.toISOString() ?? null}
      devices={devices}
    />
  );
}
