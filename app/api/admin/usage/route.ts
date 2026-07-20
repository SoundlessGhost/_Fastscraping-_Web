import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adminOr401 } from "@/lib/auth/guard";
import { decryptSecret } from "@/lib/crypto";
import { fetchServiceUsage } from "@/lib/services/usage";

export const dynamic = "force-dynamic";

const ALLOWED_INTERVALS = [1, 3, 7, 30];

/// View-as: an admin sees a client's usage exactly as the client would, by
/// using that client's own stored key server-side. Read-only — it never mutates
/// the client's connection — and every view is written to the audit log, so
/// looking at someone's usage is itself on the record.
///
/// The key is decrypted only here and never leaves the server.
export async function GET(req: NextRequest) {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  const { admin } = gate;

  const userId = req.nextUrl.searchParams.get("user");
  const slug = req.nextUrl.searchParams.get("slug");
  if (!userId || !slug) {
    return NextResponse.json({ error: "MISSING_PARAMS" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({
    where: { slug },
    include: { clientServices: { where: { userId } } },
  });
  if (!service) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const link = service.clientServices[0];
  if (!link) return NextResponse.json({ error: "NOT_CONNECTED" }, { status: 403 });

  const requested = Number(req.nextUrl.searchParams.get("interval") ?? 30);
  const interval = ALLOWED_INTERVALS.includes(requested) ? requested : 30;

  let apiKey: string;
  try {
    apiKey = decryptSecret(link.apiKeyEnc);
  } catch {
    return NextResponse.json({ error: "KEY_UNREADABLE" }, { status: 500 });
  }

  // Log the view once per fetch. The dashboard auto-refreshes, so this can
  // repeat — that's fine; it's a truthful record of an admin watching.
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "admin.view_usage", target: `${slug} of user ${userId}` },
  });

  const result = await fetchServiceUsage(service, apiKey, interval);
  if (!result.ok) {
    const status = result.reason === "unauthorized" ? 401 : 502;
    return NextResponse.json({ error: result.reason.toUpperCase(), message: result.message }, { status });
  }

  const { raw, ...data } = result.data;
  void raw;

  return NextResponse.json({
    ok: true,
    interval,
    service: { slug: service.slug, name: service.name, kind: service.kind },
    usage: data,
  });
}
