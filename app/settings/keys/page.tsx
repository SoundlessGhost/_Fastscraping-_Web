import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCatalogForUser } from "@/lib/services/catalog";
import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import Settings from "@/components/dashboard/Settings";

export const dynamic = "force-dynamic";

export default async function KeysSettingsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/dashboard/login");

  const connected = (await getCatalogForUser(me.id)).filter((s) => s.connection);

  // Decrypted here so Reveal is a local toggle; every other page gets the mask.
  const links = await prisma.clientService.findMany({
    where: { userId: me.id },
    include: { service: { select: { slug: true } } },
  });
  const keys: Record<string, string> = {};
  for (const l of links) {
    try {
      keys[l.service.slug] = decryptSecret(l.apiKeyEnc);
    } catch {
      // Key unreadable (ENCRYPTION_KEY changed) — fall back to the mask.
    }
  }

  return <Settings section="keys" user={me} services={connected} keys={keys} memberSince={null} devices={[]} />;
}
