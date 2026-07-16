import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getCatalogForUser } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

/// The catalog, annotated with which services this client holds a key for.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  return NextResponse.json({ services: await getCatalogForUser(user.id) });
}
