import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCatalogForUser } from "@/lib/services/catalog";
import { platformLabel } from "@/lib/services/taxonomy";
import { regionName } from "@/lib/regions";
import ConnectPanel from "@/components/dashboard/ConnectPanel";
import ServiceUsage from "@/components/dashboard/ServiceUsage";

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/dashboard/login");

  const service = (await getCatalogForUser(user.id)).find((s) => s.slug === slug);
  if (!service) notFound();

  const title = [platformLabel(service.platform), service.region ? regionName(service.region) : null, service.name]
    .filter(Boolean)
    .join(" · ");

  // No key yet -> ask for one. The key decides what you see, so this is the gate.
  if (!service.connection) return <ConnectPanel service={service} title={title} />;

  return <ServiceUsage service={service} title={title} />;
}
