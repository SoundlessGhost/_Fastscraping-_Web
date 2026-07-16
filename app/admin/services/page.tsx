import { prisma } from "@/lib/db";
import ServicesEditor, { type AdminService } from "@/components/admin/ServicesEditor";

export const dynamic = "force-dynamic";

export default async function AdminServices() {
  const rows = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { clientServices: true } } },
  });

  const services: AdminService[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    category: s.category,
    platform: s.platform,
    region: s.region,
    endpoint: s.endpoint,
    baseUrl: s.baseUrl,
    usagePath: s.usagePath,
    authHeader: s.authHeader,
    kind: s.kind,
    status: s.status,
    sortOrder: s.sortOrder,
    notes: s.notes,
    clients: s._count.clientServices,
  }));

  return <ServicesEditor services={services} />;
}
