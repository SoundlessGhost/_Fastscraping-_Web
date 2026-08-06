import { prisma } from "@/lib/db";
import { ingestCodes, otpConfigured, type IngestResult } from "@/lib/otp/imap";

// Shared by the admin page and the public secret-URL page. Ingestion is
// throttled to once per window and de-duped across concurrent requests (a
// module-level lock), so many viewers polling at once still hit IMAP only once;
// the list itself always comes from Postgres.

const THROTTLE_MS = 5000;
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

export async function getCodes() {
  let error: string | null = null;
  const pending = maybeIngest();
  if (pending) {
    const r = await pending;
    if (!r.ok) error = r.error;
  }

  const rows = await prisma.otpCode.findMany({ orderBy: { receivedAt: "desc" }, take: 100 });
  const now = Date.now();
  return {
    configured: otpConfigured(),
    error,
    codes: rows.map((r) => ({
      id: r.id,
      account: r.account,
      fromAddr: r.fromAddr,
      subject: r.subject,
      code: r.code,
      receivedAt: r.receivedAt.toISOString(),
      fresh: now - r.receivedAt.getTime() < FRESH_MS,
    })),
  };
}

/// The shared secret in the public URL /codes/{token}. Empty (unset) means the
/// public page is disabled — every token 404s until it's configured.
export function codesToken(): string {
  return process.env.TEMU_CODES_TOKEN ?? "";
}
