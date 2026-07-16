import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { encryptSecret, maskSecret } from "@/lib/crypto";
import { verifyKey } from "@/lib/services/usage";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  apiKey: z.string().min(8).max(300),
  label: z.string().max(60).optional(),
});

/// Connect a key to a service.
///
/// We do not decide whether the key is good — we ask the backend that runs the
/// service, the same check its real callers go through. Only a key the backend
/// accepts gets stored (encrypted).
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { slug } = await ctx.params;
  const service = await prisma.service.findUnique({ where: { slug } });
  if (!service) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (service.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "NOT_READY", message: "This service is not connected to a backend yet." },
      { status: 409 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID", message: "Enter a valid API key." }, { status: 400 });
  }
  const apiKey = parsed.data.apiKey.trim();

  const probe = await verifyKey(service, apiKey);
  if (!probe.ok) {
    const status = probe.reason === "unauthorized" ? 401 : 502;
    return NextResponse.json(
      {
        error: probe.reason.toUpperCase(),
        message:
          probe.reason === "unauthorized"
            ? "That key was rejected by the service."
            : `Could not reach the service (${probe.message}). Try again in a moment.`,
      },
      { status },
    );
  }

  const link = await prisma.clientService.upsert({
    where: { userId_serviceId: { userId: user.id, serviceId: service.id } },
    create: {
      userId: user.id,
      serviceId: service.id,
      apiKeyEnc: encryptSecret(apiKey),
      label: parsed.data.label ?? null,
      verifiedAt: new Date(),
    },
    update: {
      apiKeyEnc: encryptSecret(apiKey),
      label: parsed.data.label ?? null,
      status: "ACTIVE",
      verifiedAt: new Date(),
      lastError: null,
    },
  });

  await prisma.auditLog.create({
    data: { actorId: user.id, action: "service.connect", target: service.slug },
  });

  return NextResponse.json({
    ok: true,
    owner: probe.data.owner,
    connection: {
      verifiedAt: link.verifiedAt?.toISOString() ?? null,
      lastError: null,
      keyMask: maskSecret(apiKey),
    },
  });
}

/// Forget a key. The service and any usage on the backend are untouched.
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { slug } = await ctx.params;
  const service = await prisma.service.findUnique({ where: { slug } });
  if (!service) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.clientService
    .delete({ where: { userId_serviceId: { userId: user.id, serviceId: service.id } } })
    .catch(() => {});

  await prisma.auditLog.create({
    data: { actorId: user.id, action: "service.disconnect", target: service.slug },
  });

  return NextResponse.json({ ok: true });
}
