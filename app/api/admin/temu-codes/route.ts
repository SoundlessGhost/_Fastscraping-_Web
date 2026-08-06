import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminOr401 } from "@/lib/auth/guard";
import { ingestCodes, otpConfigured, type IngestResult } from "@/lib/otp/imap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The dashboard polls this. To avoid hitting IMAP on every poll (and from every
// open tab), ingestion is throttled to once per window and de-duped across
// concurrent requests; the list itself always comes from Postgres (fast).
const THROTTLE_MS = 8000;
const FRESH_MS = 5 * 60 * 1000;

let lastIngest = 0;
let inFlight: Promise<IngestResult> | null = null;

function maybeIngest(): Promise<IngestResult> | null {
  if (!otpConfigured()) return null;
  if (inFlight) return inFlight; // a poll already refreshing — reuse it
  if (Date.now() - lastIngest < THROTTLE_MS) return null; // fresh enough
  inFlight = ingestCodes().finally(() => {
    lastIngest = Date.now();
    inFlight = null;
  });
  return inFlight;
}

export async function GET() {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;

  let ingestError: string | null = null;
  const pending = maybeIngest();
  if (pending) {
    const r = await pending;
    if (!r.ok) ingestError = r.error;
  }

  const rows = await prisma.otpCode.findMany({
    orderBy: { receivedAt: "desc" },
    take: 60,
  });

  const now = Date.now();
  return NextResponse.json({
    ok: true,
    configured: otpConfigured(),
    error: ingestError,
    codes: rows.map((r) => ({
      id: r.id,
      account: r.account,
      fromAddr: r.fromAddr,
      subject: r.subject,
      code: r.code,
      receivedAt: r.receivedAt.toISOString(),
      fresh: now - r.receivedAt.getTime() < FRESH_MS,
    })),
  });
}
