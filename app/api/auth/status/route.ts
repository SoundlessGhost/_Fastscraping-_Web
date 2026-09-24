import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight auth check for the marketing header: returns whether the visitor
// has a valid session, so the header can show a "Dashboard" button instead of
// "Login". Anonymous visitors have no session cookie, so getCurrentUser()
// short-circuits with no DB query.
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ authed: Boolean(user) });
}
