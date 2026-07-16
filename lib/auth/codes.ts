import { prisma } from "@/lib/db";
import { generateCode, hashCode, verifyCode } from "@/lib/crypto";
import type { CodePurpose } from "@/lib/generated/prisma/enums";

export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Issues a fresh 6-digit code for an email+purpose. Any earlier unused codes are
 * invalidated so only the newest one works. Returns the plaintext code exactly
 * once — the caller emails it; we only ever store the hash.
 */
export async function issueCode(
  email: string,
  purpose: CodePurpose,
): Promise<{ ok: true; code: string } | { ok: false; error: string; retryAfter?: number }> {
  const latest = await prisma.emailCode.findFirst({
    where: { email, purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (latest) {
    const age = (Date.now() - latest.createdAt.getTime()) / 1000;
    if (age < RESEND_COOLDOWN_SECONDS) {
      return {
        ok: false,
        error: "Please wait before requesting another code.",
        retryAfter: Math.ceil(RESEND_COOLDOWN_SECONDS - age),
      };
    }
  }

  // Burn older codes so only the newest is valid.
  await prisma.emailCode.updateMany({
    where: { email, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = generateCode();
  await prisma.emailCode.create({
    data: {
      email,
      purpose,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
    },
  });

  return { ok: true, code };
}

/**
 * Checks a submitted code and marks it used on success. Wrong guesses count
 * against MAX_ATTEMPTS so a 6-digit code can't be brute forced.
 */
export async function consumeCode(
  email: string,
  purpose: CodePurpose,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.emailCode.findFirst({
    where: { email, purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!row) return { ok: false, error: "No active code. Request a new one." };
  if (row.expiresAt < new Date()) {
    return { ok: false, error: "Code expired. Request a new one." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Request a new code." };
  }

  if (!verifyCode(code, row.codeHash)) {
    await prisma.emailCode.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Incorrect code." };
  }

  await prisma.emailCode.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
  return { ok: true };
}
