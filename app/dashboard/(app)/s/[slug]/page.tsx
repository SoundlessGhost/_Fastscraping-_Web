import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCatalogForUser } from "@/lib/services/catalog";
import { platformLabel } from "@/lib/services/taxonomy";
import { regionName } from "@/lib/regions";
import ConnectPanel from "@/components/dashboard/ConnectPanel";
import ServiceUsage from "@/components/dashboard/ServiceUsage";

export default async function ServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string; add?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/dashboard/login");

  const service = (await getCatalogForUser(user.id)).find((s) => s.slug === slug);
  if (!service) notFound();

  const platform = platformLabel(service.platform);
  // A brand that is its own single service has name === platform; printing both
  // would title the page "StubHub · StubHub".
  const title = [platform, service.region ? regionName(service.region) : null, service.name === platform ? null : service.name]
    .filter(Boolean)
    .join(" · ");

  const keys = service.connections;

  // Adding another key — only reachable once at least one is connected.
  if (sp.add && keys.length > 0) {
    return <ConnectPanel service={service} title={title} mode="add" />;
  }

  // No key yet -> ask for one. The key decides what you see, so this is the gate.
  if (keys.length === 0) return <ConnectPanel service={service} title={title} />;

  // Which key's usage to show. An unknown/stale ?k= falls back to the first.
  const selected = keys.find((k) => k.id === sp.k) ?? keys[0];

  return <ServiceUsage service={service} title={title} connections={keys} selectedKeyId={selected.id} />;
}
