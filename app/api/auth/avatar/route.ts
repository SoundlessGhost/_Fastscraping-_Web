import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

/// Uploads are accepted up to 10 MB, but never stored at that size: we re-encode
/// to a small square WebP, which lands around 10-40 KB. That keeps the header
/// avatar instant and the database small.
///
/// Re-encoding is also the reason we don't have to trust the file: sharp either
/// decodes it as an image or throws, so a renamed .exe never becomes an avatar.
const MAX_BYTES = 10 * 1024 * 1024;
const SIDE = 256;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Choose an image first." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 10 MB.` },
      { status: 413 },
    );
  }
  if (file.type && !ACCEPTED.includes(file.type)) {
    return NextResponse.json({ ok: false, error: "Use a JPG, PNG, WebP, GIF or AVIF image." }, { status: 415 });
  }

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate() // honour EXIF orientation, or phone photos come out sideways
      .resize(SIDE, SIDE, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json({ ok: false, error: "That file isn't an image we can read." }, { status: 400 });
  }

  // Prisma's Bytes wants a view over a plain ArrayBuffer; a Node Buffer is
  // typed over ArrayBufferLike, so copy into one.
  const bytes = new Uint8Array(webp.byteLength);
  bytes.set(webp);

  const now = new Date();
  await prisma.$transaction([
    prisma.avatar.upsert({
      where: { userId: me.id },
      create: { userId: me.id, mime: "image/webp", data: bytes },
      update: { mime: "image/webp", data: bytes },
    }),
    prisma.user.update({ where: { id: me.id }, data: { avatarUpdatedAt: now } }),
  ]);

  return NextResponse.json({ ok: true, version: now.getTime(), bytes: bytes.length });
}

/// Back to the default illustration.
export async function DELETE() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });

  await prisma.avatar.deleteMany({ where: { userId: me.id } });
  await prisma.user.update({ where: { id: me.id }, data: { avatarUpdatedAt: null } });

  return NextResponse.json({ ok: true });
}
