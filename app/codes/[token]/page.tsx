import { notFound } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import type { Metadata } from "next";
import { codesToken } from "@/lib/otp/codes";
import TemuCodes from "@/components/admin/TemuCodes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false }, // secret link, never indexed
};

function tokenOk(got: string): boolean {
  const want = codesToken();
  if (!want || got.length !== want.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

// Public — no login. The long secret in the URL is the whole gate; a wrong or
// missing token is a plain 404, so the page is indistinguishable from one that
// isn't there. The client component polls /api/codes/{token} (same secret).
export default async function PublicCodesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!tokenOk(token)) notFound();
  return <TemuCodes apiUrl={`/api/codes/${encodeURIComponent(token)}`} />;
}
