import "server-only";
import { prisma } from "@/lib/db";
import { decryptSecret, maskSecret } from "@/lib/crypto";
import type { ServiceNode } from "@/lib/services/taxonomy";

/// The catalog as one client sees it: every service, plus their own connection
/// where they have one. Shared by the dashboard layout and /api/services so the
/// sidebar and the API can never disagree.
///
/// Deliberately drops baseUrl and key material — callers render this straight
/// into the browser.
export async function getCatalogForUser(userId: string): Promise<ServiceNode[]> {
  const rows = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { clientServices: { where: { userId } } },
  });

  return rows.map((s) => {
    const link = s.clientServices[0];
    let keyMask = "";
    if (link) {
      try {
        keyMask = maskSecret(decryptSecret(link.apiKeyEnc));
      } catch {
        keyMask = "••••"; // unreadable (ENCRYPTION_KEY changed) — still connected
      }
    }
    return {
      slug: s.slug,
      name: s.name,
      category: s.category,
      platform: s.platform,
      region: s.region,
      endpoint: s.endpoint,
      kind: s.kind,
      status: s.status,
      connection: link
        ? {
            verifiedAt: link.verifiedAt?.toISOString() ?? null,
            lastError: link.lastError,
            keyMask,
          }
        : null,
    };
  });
}
