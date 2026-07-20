import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/crypto";
import { fetchServiceUsage, resolvePricing } from "@/lib/services/usage";

export const dynamic = "force-dynamic";

const ALLOWED_INTERVALS = [1, 3, 7, 30];

/// Usage for one service: decrypt this client's key, ask that service's own
/// backend, normalise the answer. The key is added server-side and never
/// reaches the browser.
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { slug } = await ctx.params;
  const service = await prisma.service.findUnique({
    where: { slug },
    include: { clientServices: { where: { userId: user.id } } },
  });
  if (!service) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const link = service.clientServices[0];
  if (!link || link.status !== "ACTIVE") {
    return NextResponse.json({ error: "NOT_CONNECTED" }, { status: 403 });
  }

  const requested = Number(req.nextUrl.searchParams.get("interval") ?? 7);
  const interval = ALLOWED_INTERVALS.includes(requested) ? requested : 7;

  let apiKey: string;
  try {
    apiKey = decryptSecret(link.apiKeyEnc);
  } catch {
    return NextResponse.json({ error: "KEY_UNREADABLE" }, { status: 500 });
  }

  const result = await fetchServiceUsage(service, apiKey, interval);

  if (!result.ok) {
    // Cache the backend's verdict so the sidebar can flag a dead key without
    // re-probing on every render.
    await prisma.clientService
      .update({
        where: { id: link.id },
        data: {
          lastError: result.message,
          verifiedAt: result.reason === "unauthorized" ? null : link.verifiedAt,
        },
      })
      .catch(() => {});

    const status = result.reason === "unauthorized" ? 401 : 502;
    return NextResponse.json({ error: result.reason.toUpperCase(), message: result.message }, { status });
  }

  if (link.lastError) {
    await prisma.clientService
      .update({ where: { id: link.id }, data: { lastError: null, verifiedAt: new Date() } })
      .catch(() => {});
  }

  const { raw, ...data } = result.data;
  void raw; // the browser gets the normalised shape only

  // Backend price wins; otherwise this client's negotiated rate, else the
  // service default.
  data.pricing = resolvePricing(data.pricing, link.pricePer1000, service.pricePer1000);
  return NextResponse.json({ ok: true, interval, service: { slug: service.slug, name: service.name, kind: service.kind }, usage: data });
}
