import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import Settings from "@/components/dashboard/Settings";

export const dynamic = "force-dynamic";

export default async function GeneralSettingsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/dashboard/login");

  const row = await prisma.user.findUnique({
    where: { id: me.id },
    select: { createdAt: true },
  });

  // General is just the profile — the key/session data the Account page needs
  // isn't loaded here.
  return (
    <Settings
      section="general"
      user={me}
      services={[]}
      keys={{}}
      memberSince={row?.createdAt.toISOString() ?? null}
      devices={[]}
    />
  );
}
