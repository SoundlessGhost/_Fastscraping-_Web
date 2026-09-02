import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { encryptSecret, maskSecret } from "@/lib/crypto";
import { verifyKey } from "@/lib/services/usage";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  apiKey: z.string().min(8).max(300),
  // Client-given name for the key. Required when adding a new key so the
  // switcher has something to show; optional when editing an existing one
  // (leave it out to keep the current name). Capped short (12 chars) so the
  // switcher and Settings rows stay tidy.
  label: z.string().max(12).optional(),
  // Present -> edit this existing key. Absent -> add a new key to the service.
  keyId: z.string().optional(),
});

/// Connect a key to a service — or add another one.
///
/// A client may hold several keys per service now, so this creates a new key by
/// default and only updates in place when a `keyId` is given. Either way we do
/// not decide whether the key is good: we ask the backend that runs the
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
  const label = parsed.data.label?.trim() || null;
  const keyId = parsed.data.keyId;

  // Adding a new key must carry a name — that is how the client tells their keys
  // apart in the switcher. Editing keeps whatever name it already had.
  if (!keyId && !label) {
    return NextResponse.json(
      { error: "NO_LABEL", message: "Give this key a name so you can tell it apart." },
      { status: 400 },
    );
  }

  // Editing: the key must be one of this client's keys for this service.
  let existing = null as Awaited<ReturnType<typeof prisma.clientService.findFirst>> | null;
  if (keyId) {
    existing = await prisma.clientService.findFirst({
      where: { id: keyId, userId: user.id, serviceId: service.id },
    });
    if (!existing) return NextResponse.json({ error: "NOT_FOUND", message: "Key not found." }, { status: 404 });
  }

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

  const link = existing
    ? await prisma.clientService.update({
        where: { id: existing.id },
        data: {
          apiKeyEnc: encryptSecret(apiKey),
          ...(label ? { label } : {}),
          status: "ACTIVE",
          verifiedAt: new Date(),
          lastError: null,
        },
      })
    : await prisma.clientService.create({
        data: {
          userId: user.id,
          serviceId: service.id,
          apiKeyEnc: encryptSecret(apiKey),
          label,
          verifiedAt: new Date(),
        },
      });

  await prisma.auditLog.create({
    data: { actorId: user.id, action: existing ? "service.key.update" : "service.key.add", target: service.slug },
  });

  return NextResponse.json({
    ok: true,
    owner: probe.data.owner,
    key: {
      id: link.id,
      label: link.label,
      verifiedAt: link.verifiedAt?.toISOString() ?? null,
      lastError: null,
      keyMask: maskSecret(apiKey),
    },
  });
}

/// Forget a key. Pass `?k=<keyId>` to remove one specific key; with no id it
/// disconnects the service entirely (every key this client has for it). The
/// service and any usage on the backend are untouched either way.
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { slug } = await ctx.params;
  const service = await prisma.service.findUnique({ where: { slug } });
  if (!service) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const keyId = req.nextUrl.searchParams.get("k");

  const { count } = await prisma.clientService.deleteMany({
    where: {
      userId: user.id,
      serviceId: service.id,
      ...(keyId ? { id: keyId } : {}),
    },
  });

  await prisma.auditLog.create({
    data: { actorId: user.id, action: keyId ? "service.key.remove" : "service.disconnect", target: service.slug },
  });

  return NextResponse.json({ ok: true, removed: count });
}
