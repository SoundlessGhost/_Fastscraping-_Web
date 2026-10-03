import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { encryptSecret, maskSecret } from "@/lib/crypto";
import { trialConfig, TRIAL_AUDIT_ACTION } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/// Issue a self-serve trial key: one per account, ever.
///
/// The key is created on the backend through its admin API with a lifetime
/// request cap (total_quota), stored encrypted as a normal key on the trial
/// service, and returned once so the client can copy it. The backend enforces
/// the cap, so a leaked trial key can never cost more than the quota.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const cfg = trialConfig();
  if (!cfg.enabled) {
    return NextResponse.json(
      { error: "DISABLED", message: "Self-serve trials are not open yet. Request one from Support." },
      { status: 409 },
    );
  }

  const already = await prisma.auditLog.findFirst({
    where: { actorId: user.id, action: TRIAL_AUDIT_ACTION },
    select: { id: true },
  });
  if (already) {
    return NextResponse.json(
      { error: "USED", message: "This account already has a trial key. Ask Support if you need more requests." },
      { status: 409 },
    );
  }

  const service = await prisma.service.findUnique({ where: { slug: cfg.serviceSlug } });
  if (!service || service.status !== "ACTIVE") {
    return NextResponse.json({ error: "NOT_READY", message: "The trial service is not available right now." }, { status: 503 });
  }

  // Claim the trial before calling the backend, so two quick clicks can never
  // mint two keys. If the backend call fails, the claim is released again.
  const claim = await prisma.auditLog.create({
    data: { actorId: user.id, action: TRIAL_AUDIT_ACTION, target: service.slug, meta: { state: "pending" } },
  });
  const raced = await prisma.auditLog.count({ where: { actorId: user.id, action: TRIAL_AUDIT_ACTION } });
  if (raced > 1) {
    await prisma.auditLog.delete({ where: { id: claim.id } });
    return NextResponse.json({ error: "USED", message: "This account already has a trial key." }, { status: 409 });
  }

  const owner = `trial-web-${user.email.split("@")[0].replace(/[^a-z0-9]+/gi, "").slice(0, 20) || "user"}-${user.id.slice(-6)}`;
  let key = "";
  try {
    const r = await fetch(`${cfg.adminUrl}/admin/apikeys`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Token": cfg.adminToken },
      body: JSON.stringify({
        owner,
        total_quota: cfg.quota,
        per_minute: cfg.perMinute,
        per_hour: cfg.perHour,
        per_day: cfg.perDay,
        concurrency: cfg.concurrency,
        is_active: true,
      }),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    const body = await r.json().catch(() => ({}));
    key = typeof body?.key === "string" ? body.key : "";
    if (!r.ok || !key) throw new Error(`backend ${r.status}`);
  } catch (e) {
    console.error("[trial] key issue failed", e);
    await prisma.auditLog.delete({ where: { id: claim.id } }).catch(() => {});
    return NextResponse.json(
      { error: "BACKEND", message: "Could not create a trial key just now. Try again in a minute or contact Support." },
      { status: 502 },
    );
  }

  await prisma.clientService.create({
    data: {
      userId: user.id,
      serviceId: service.id,
      apiKeyEnc: encryptSecret(key),
      label: "Trial",
      verifiedAt: new Date(),
    },
  });
  await prisma.auditLog.update({
    where: { id: claim.id },
    data: { meta: { state: "issued", owner, quota: cfg.quota, keyMask: maskSecret(key) } },
  });

  return NextResponse.json({ ok: true, key, quota: cfg.quota, service: service.slug, serviceName: service.name });
}
