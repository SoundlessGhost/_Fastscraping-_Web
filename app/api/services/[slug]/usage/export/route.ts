import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/crypto";
import { fetchServiceUsage, resolvePricing } from "@/lib/services/usage";
import { buildUsageWorkbook, datesBetween } from "@/lib/services/usage-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/// Same window the dashboard loads, so the export sees exactly the figures the
/// page is showing.
const WIDEST = 30;
/// The backend only reports day-by-day figures for this month and last, so a
/// wider request can't produce more data — this is just an abuse ceiling.
const MAX_SPAN_DAYS = 400;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function bad(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/// Usage summary for one service as a real .xlsx workbook. Auth, ownership and
/// key handling mirror the usage route exactly: the client's key is decrypted
/// server-side, used once, and never leaves this process.
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return bad("UNAUTHENTICATED", 401);

  const from = req.nextUrl.searchParams.get("from") ?? "";
  const to = req.nextUrl.searchParams.get("to") ?? "";
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to) return bad("BAD_RANGE", 400);
  const span = datesBetween(from, to).length;
  if (span === 0 || span > MAX_SPAN_DAYS) return bad("BAD_RANGE", 400);

  const { slug } = await ctx.params;
  const service = await prisma.service.findUnique({
    where: { slug },
    include: { clientServices: { where: { userId: user.id } } },
  });
  if (!service) return bad("NOT_FOUND", 404);

  const link = service.clientServices[0];
  if (!link || link.status !== "ACTIVE") return bad("NOT_CONNECTED", 403);

  let apiKey: string;
  try {
    apiKey = decryptSecret(link.apiKeyEnc);
  } catch {
    return bad("KEY_UNREADABLE", 500);
  }

  const result = await fetchServiceUsage(service, apiKey, WIDEST);
  if (!result.ok) {
    const status = result.reason === "unauthorized" ? 401 : 502;
    return NextResponse.json({ error: result.reason.toUpperCase(), message: result.message }, { status });
  }

  // Same hybrid rate the dashboard shows, so the file can't disagree with it.
  const usage = {
    ...result.data,
    pricing: resolvePricing(result.data.pricing, link.pricePer1000, service.pricePer1000),
  };

  const bytes = await buildUsageWorkbook({
    serviceName: service.name,
    accountEmail: user.email,
    from,
    to,
    usage,
  });

  const filename = `fastscraping-${service.slug}-usage-${from}_${to}.xlsx`;
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(bytes.length),
      "Cache-Control": "no-store",
    },
  });
}
