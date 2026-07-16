import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

/**
 * Client API keys are stored encrypted at rest, never in plaintext.
 * AES-256-GCM; the stored string is  v1.<iv>.<authTag>.<ciphertext>  (base64url).
 */

const VERSION = "v1";

function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set");
  // Accept either 64 hex chars or any passphrase (hashed to 32 bytes).
  const buf = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : createHash("sha256").update(raw).digest();
  return buf;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ct.toString("base64url"),
  ].join(".");
}

export function decryptSecret(stored: string): string {
  const [v, ivB64, tagB64, ctB64] = stored.split(".");
  if (v !== VERSION || !ivB64 || !tagB64 || !ctB64) {
    throw new Error("Malformed encrypted value");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/** Show only the tail of a key in the UI: "sk_••••wur" */
export function maskSecret(plain: string): string {
  const tail = plain.slice(-4);
  const head = plain.slice(0, 3);
  return `${head}_••••${tail}`;
}

/** 6-digit email code. Stored hashed, compared in constant time. */
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function verifyCode(code: string, hash: string): boolean {
  const a = Buffer.from(hashCode(code), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
