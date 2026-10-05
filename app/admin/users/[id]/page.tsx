import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { decryptSecret, maskSecret } from "@/lib/crypto";
import type { ServiceNode } from "@/lib/services/taxonomy";
import ClientView from "@/components/admin/ClientView";
import WalletAdmin from "@/components/admin/WalletAdmin";
import { usd, walletBalanceCents } from "@/lib/wallet";

export const dynamic = "force-dynamic";

// The admin layout already gates this on role === ADMIN.
export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      clientServices: { include: { service: true } },
    },
  });
  if (!user) notFound();

  // Only the services this client has connected a key for — that's all view-as
  // can show usage for. A client can hold several keys per service now, so group
  // by service and hang every key off it (one row per service, not per key).
  const bySlug = new Map<string, ServiceNode>();
  for (const cs of user.clientServices) {
    let keyMask = "";
    try {
      keyMask = maskSecret(decryptSecret(cs.apiKeyEnc));
    } catch {
      keyMask = "••••";
    }
    const conn = {
      id: cs.id,
      label: cs.label,
      status: cs.status,
      verifiedAt: cs.verifiedAt?.toISOString() ?? null,
      lastError: cs.lastError,
      keyMask,
    };
    const existing = bySlug.get(cs.service.slug);
    if (existing) {
      existing.connections.push(conn);
      continue;
    }
    bySlug.set(cs.service.slug, {
      slug: cs.service.slug,
      name: cs.service.name,
      category: cs.service.category,
      platform: cs.service.platform,
      region: cs.service.region,
      endpoint: cs.service.endpoint,
      kind: cs.service.kind,
      status: cs.service.status,
      connection: conn,
      connections: [conn],
    });
  }
  const services: ServiceNode[] = [...bySlug.values()];

  const [balanceCents, txns] = await Promise.all([
    walletBalanceCents(user.id),
    prisma.walletTxn.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const df = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <>
      <div className="ds-head">
        <div>
          <h1 className="dash-title">
            Client <em>dashboard</em>
          </h1>
          <p className="dash-meta">
            <b>{user.email}</b> · {services.length} connected service{services.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <WalletAdmin
        userId={user.id}
        balance={usd(balanceCents)}
        txns={txns.map((t) => ({ id: t.id, date: df.format(t.createdAt), source: t.source, note: t.note, amount: usd(t.amountCents) }))}
      />

      <ClientView userId={user.id} email={user.email} services={services} />
    </>
  );
}
