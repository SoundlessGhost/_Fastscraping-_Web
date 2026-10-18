import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/crypto";
import { safeTz } from "@/lib/services/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/// Services whose backend serves a per-job billing ledger at /me/billing.csv.
const LEDGER_KINDS = new Set(["shopee-usage"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 31;

function bad(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status });
}

/// Per-item history for one key: one CSV row per billed job (job_id, region,
/// shop_id, item_id, times, result, billable). The client's key is decrypted
/// here, used for this one backend call, and never sent to the browser. The
/// backend streams the file day by day, so it is passed straight through.
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return bad("UNAUTHENTICATED", "Please sign in again.", 401);

  const from = req.nextUrl.searchParams.get("from") ?? "";
  const to = req.nextUrl.searchParams.get("to") ?? "";
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to) return bad("BAD_RANGE", "Pick a valid date range.", 400);
  const days = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1;
  if (!Number.isFinite(days) || days < 1 || days > MAX_DAYS) {
    return bad("RANGE_TOO_LONG", `Item history covers up to ${MAX_DAYS} days per download. Pick a shorter range.`, 400);
  }

  const { slug } = await ctx.params;
  const service = await prisma.service.findUnique({
    where: { slug },
    include: { clientServices: { where: { userId: user.id }, orderBy: { createdAt: "asc" } } },
  });
  if (!service) return bad("NOT_FOUND", "Service not found.", 404);
  if (!LEDGER_KINDS.has(service.kind)) return bad("NOT_AVAILABLE", "Item history is not available for this service.", 400);

  const keyId = req.nextUrl.searchParams.get("k");
  const link = (keyId && service.clientServices.find((l) => l.id === keyId)) || service.clientServices[0];
  if (!link || link.status !== "ACTIVE") return bad("NOT_CONNECTED", "Add your API key first.", 403);

  let apiKey: string;
  try {
    apiKey = decryptSecret(link.apiKeyEnc);
  } catch {
    return bad("KEY_UNREADABLE", "Your saved key could not be read. Add it again.", 500);
  }

  // Same host as the usage endpoint: /me/usage -> /me/billing.csv
  const base = service.baseUrl.replace(/\/+$/, "");
  const path = service.usagePath.replace(/\/usage\/?$/, "/billing.csv");
  let res: Response;
  try {
    // from/to are calendar days in the dashboard's timezone (row timestamps stay UTC).
    const tz = safeTz(req.nextUrl.searchParams.get("tz"));
    res = await fetch(`${base}${path}?from=${from}&to=${to}${tz !== "UTC" ? `&tz=${encodeURIComponent(tz)}` : ""}`, {
      headers: { [service.authHeader]: apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(10 * 60 * 1000),
    });
  } catch {
    return bad("UNREACHABLE", "The service did not respond. Try again in a minute.", 502);
  }
  if (res.status === 429) return bad("BUSY", "An export for this key is already running. Try again when it finishes.", 429);
  if (res.status === 401 || res.status === 403) return bad("UNAUTHORIZED", "The service rejected this key.", 401);
  if (!res.ok || !res.body) return bad("BAD_RESPONSE", `The service returned ${res.status}.`, 502);

  const filename = `fastscraping-${service.slug}-items-${from}_${to}.csv`;
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
