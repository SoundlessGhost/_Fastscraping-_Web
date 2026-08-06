import { NextResponse } from "next/server";
import { adminOr401 } from "@/lib/auth/guard";
import { getCodes } from "@/lib/otp/codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The admin dashboard polls this. Ingestion (throttled + de-duped) and the list
// live in lib/otp/codes so the public secret-URL page shares the same throttle.
export async function GET() {
  const gate = await adminOr401();
  if ("res" in gate) return gate.res;
  return NextResponse.json({ ok: true, ...(await getCodes()) });
}
