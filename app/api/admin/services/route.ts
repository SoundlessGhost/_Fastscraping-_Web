import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminOr401 } from "@/lib/auth/guard";
import { ServiceInput } from "@/lib/services/schema";

export const runtime = "nodejs";

export async function GET() {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;

  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { clientServices: true } } },
  });

  return NextResponse.json({
    services: services.map((s) => ({
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
    })),
  });
}

export async function POST(req: Request) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  const { admin } = gate;

  const parsed = ServiceInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const taken = await prisma.service.findUnique({ where: { slug: parsed.data.slug } });
  if (taken) return NextResponse.json({ ok: false, error: "That slug is already used." }, { status: 409 });

  const created = await prisma.service.create({
    data: {
      ...parsed.data,
      region: parsed.data.region || null,
      endpoint: parsed.data.endpoint || null,
      notes: parsed.data.notes || null,
    },
  });

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "admin.service_create", target: created.slug },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
