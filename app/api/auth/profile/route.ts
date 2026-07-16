import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().max(80).optional(),
  company: z.string().max(80).optional(),
});

/// Name and company only. Email is identity here — changing it would move the
/// account, so that stays an admin action.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });

  const name = parsed.data.name?.trim() || null;
  const company = parsed.data.company?.trim() || null;

  await prisma.user.update({ where: { id: me.id }, data: { name, company } });
  return NextResponse.json({ ok: true, name, company });
}
