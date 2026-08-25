import { prisma } from "@/lib/db";
import { ingestCodes, otpConfigured, brandOf, BRANDS, type IngestResult } from "@/lib/otp/imap";

// Shared by the admin page and the public secret-URL page. Ingestion is
// throttled to once per window and de-duped across concurrent requests (a
// module-level lock), so many viewers polling at once still hit IMAP only once;
// the list itself always comes from Postgres.

const THROTTLE_MS = 5000;
/// How many codes to show per brand. Kept modest — the list is a live feed of
/// codes that expire in minutes, not an archive.
const PER_BRAND = 50;
const FRESH_MS = 5 * 60 * 1000;

let lastIngest = 0;
let inFlight: Promise<IngestResult> | null = null;

function maybeIngest(): Promise<IngestResult> | null {
  if (!otpConfigured()) return null;
  if (inFlight) return inFlight;
  if (Date.now() - lastIngest < THROTTLE_MS) return null;
  inFlight = ingestCodes().finally(() => {
    lastIngest = Date.now();
    inFlight = null;
  });
  return inFlight;
}

/// DB-only snapshot, no IMAP. The IDLE worker keeps the table current in real
/// time, so this is what the SSE stream pushes and what the poll falls back to.
export async function listCodes() {
  // Query per brand, not one global "newest 100". Temu outnumbers Indeed by
  // roughly 30:1, so a single global limit pushed every Indeed code off the end
  // and the Indeed tab looked broken. Each brand now gets its own slice and the
  // union is re-sorted, so a low-volume sender is always represented.
  const perBrand = await Promise.all(
    BRANDS.map((b) =>
      prisma.otpCode.findMany({
        where: {
          OR: [
            { fromAddr: { contains: b.id, mode: "insensitive" } },
            { subject: { contains: b.id, mode: "insensitive" } },
          ],
        },
        orderBy: { receivedAt: "desc" },
        take: PER_BRAND,
      }),
    ),
  );

  // Anything that matched the ingest but not these narrower queries still shows
  // up here, so nothing silently disappears from the list.
  const recent = await prisma.otpCode.findMany({ orderBy: { receivedAt: "desc" }, take: PER_BRAND });

  const seen = new Set<string>();
  const rows = [...perBrand.flat(), ...recent]
    .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());

  const now = Date.now();
  return {
    configured: otpConfigured(),
    error: null as string | null,
    // Which brand each code came from is derived from the sender we already
    // store, so adding a brand needs no migration and no backfill.
    brands: BRANDS.map((b) => ({ id: b.id, label: b.label })),
    codes: rows.map((r) => ({
      id: r.id,
      account: r.account,
      fromAddr: r.fromAddr,
      subject: r.subject,
      code: r.code,
      source: brandOf(r.fromAddr, r.subject) ?? "other",
      receivedAt: r.receivedAt.toISOString(),
      fresh: now - r.receivedAt.getTime() < FRESH_MS,
    })),
  };
}

/// Poll path: opportunistically ingest (throttled) as a fallback for the IDLE
/// worker, then return the list.
export async function getCodes() {
  let error: string | null = null;
  const pending = maybeIngest();
  if (pending) {
    const r = await pending;
    if (!r.ok) error = r.error;
  }
  const snap = await listCodes();
  return { ...snap, error: error ?? snap.error };
}

/// The shared secret in the public URL /codes/{token}. Empty (unset) means the
/// public page is disabled — every token 404s until it's configured.
export function codesToken(): string {
  return process.env.TEMU_CODES_TOKEN ?? "";
}
