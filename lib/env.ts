/**
 * Startup + runtime guards for the secrets the app can't safely run without.
 *
 * A missing or placeholder SESSION_SECRET isn't a "fix it later" bug: an empty
 * or predictable cookie password means anyone can forge a logged-in session. So
 * we refuse to hand back an unusable value — the getters throw, and
 * `validateEnv()` (called once at boot from instrumentation.ts) fails the whole
 * process rather than serving requests with a broken security posture.
 */

/// Example/scaffold values that must never reach production. If one of these is
/// still in the environment, someone copied `.env.example` without editing it.
const PLACEHOLDERS = new Set([
  "change_me_to_a_long_random_string_min_32_chars",
  "change_me",
  "changeme",
  "your-secret-here",
  "replace-me",
]);

function fail(name: string, why: string): never {
  throw new Error(`${name} ${why}. Set a strong value in the environment before starting.`);
}

/**
 * Validated SESSION_SECRET (iron-session cookie password). Must be a real,
 * non-placeholder string of at least 32 chars — iron-session itself requires
 * 32, and a shorter/blank value is what makes cookies forgeable.
 */
export function sessionSecret(): string {
  const v = process.env.SESSION_SECRET;
  if (!v) fail("SESSION_SECRET", "is not set");
  if (v.length < 32) fail("SESSION_SECRET", "must be at least 32 characters");
  if (PLACEHOLDERS.has(v)) fail("SESSION_SECRET", "is still the example placeholder");
  return v;
}

/**
 * Validated ENCRYPTION_KEY (AES-256-GCM key for client API keys at rest). We
 * only reject empty/placeholder here — the key's length is deliberately NOT
 * constrained, because `lib/crypto.ts` hashes any passphrase down to 32 bytes,
 * and tightening the rule could make an already-stored key undecryptable.
 */
export function encryptionKey(): string {
  const v = process.env.ENCRYPTION_KEY;
  if (!v) fail("ENCRYPTION_KEY", "is not set");
  if (PLACEHOLDERS.has(v)) fail("ENCRYPTION_KEY", "is still the example placeholder");
  return v;
}

function databaseUrl(): string {
  const v = process.env.DATABASE_URL;
  if (!v) fail("DATABASE_URL", "is not set");
  return v;
}

/**
 * Runs once at server boot (see instrumentation.ts). Touches every required
 * secret so a misconfigured deploy fails loudly at startup instead of throwing
 * an opaque 500 on the first request that happens to need it.
 */
export function validateEnv(): void {
  sessionSecret();
  encryptionKey();
  databaseUrl();
}
