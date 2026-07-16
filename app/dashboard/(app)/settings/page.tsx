import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCatalogForUser } from "@/lib/services/catalog";
import { prisma } from "@/lib/db";
import { daysUntilPasswordChangeAllowed } from "@/lib/auth/password";
import Settings from "@/components/dashboard/Settings";

export default async function SettingsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/dashboard/login");

  const row = await prisma.user.findUnique({
    where: { id: me.id },
    select: { lastPasswordChangeAt: true, createdAt: true },
  });

  return (
    <Settings
      user={me}
      services={(await getCatalogForUser(me.id)).filter((s) => s.connection)}
      passwordWaitDays={daysUntilPasswordChangeAllowed(row?.lastPasswordChangeAt ?? null)}
      memberSince={row?.createdAt.toISOString() ?? null}
    />
  );
}
