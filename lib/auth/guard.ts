import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";

/// Admin gate for route handlers. Returns the response to send back on
/// failure, or the admin on success — so a handler reads as:
///   const gate = await adminOr401(); if ("res" in gate) return gate.res;
export async function adminOr401(): Promise<{ res: NextResponse } | { admin: SessionUser }> {
  const user = await getCurrentUser();
  if (!user) return { res: NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 }) };
  if (user.role !== "ADMIN") return { res: NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 }) };
  return { admin: user };
}
