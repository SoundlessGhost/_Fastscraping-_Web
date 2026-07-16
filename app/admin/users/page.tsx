import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { bootstrapAdminEmails } from "@/lib/auth/admins";
import UsersTable, { type AdminUser } from "@/components/admin/UsersTable";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const me = await getCurrentUser();

  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { clientServices: true } },
      sessions: { where: { revokedAt: null }, select: { id: true, lastSeenAt: true } },
      clientServices: { include: { service: { select: { slug: true, name: true } } } },
    },
  });

  const bootstrap = new Set(bootstrapAdminEmails());

  const users: AdminUser[] = rows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    company: u.company,
    role: u.role,
    status: u.status,
    verified: Boolean(u.emailVerifiedAt),
    createdAt: u.createdAt.toISOString(),
    lastSeenAt:
      u.sessions.map((s) => s.lastSeenAt.toISOString()).sort().at(-1) ?? null,
    liveSessions: u.sessions.length,
    keyCount: u._count.clientServices,
    services: u.clientServices.map((cs) => cs.service.slug),
    isBootstrapAdmin: bootstrap.has(u.email.toLowerCase()),
    isSelf: u.id === me?.id,
  }));

  return <UsersTable users={users} />;
}
