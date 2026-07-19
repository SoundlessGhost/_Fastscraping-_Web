import { prisma } from "@/lib/db";
import { generateCode, hashCode, verifyCode } from "@/lib/crypto";
import type { CodePurpose } from "@/lib/generated/prisma/enums";

export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;
/// Hard daily ceiling on password-reset emails per address — protects our
/// transactional-email budget from a client (or someone targeting an address)
/// spamming code requests.
export const RESET_MAX_PER_DAY = 3;
/// Same protection for signup verification emails. A little more generous than
/// reset, since a genuine new user may legitimately retry a few times, but low
/// enough that hammering one address can't burn a meaningful slice of the daily
/// email quota. (Distributed/alias abuse is covered by the login/IP throttle.)
export const SIGNUP_MAX_PER_DAY = 5;

/**
 * Issues a fresh 6-digit code for an email+purpose. Any earlier unused codes are
 * invalidated so only the newest one works. Returns the plaintext code exactly
 * once — the caller emails it; we only ever store the hash.
 *
 * `maxPerDay` caps how many codes may be issued for this email+purpose in a
 * rolling 24 h — used to keep reset requests from burning the email quota.
 */
export async function issueCode(
  email: string,
  purpose: CodePurpose,
  opts?: { maxPerDay?: number },
): Promise<{ ok: true; code: string } | { ok: false; error: string; retryAfter?: number }> {
  if (opts?.maxPerDay) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const today = await prisma.emailCode.count({
      where: { email, purpose, createdAt: { gte: since } },
    });
    if (today >= opts.maxPerDay) {
      return { ok: false, error: "Too many code requests today. Please try again tomorrow." };
    }
  }

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
