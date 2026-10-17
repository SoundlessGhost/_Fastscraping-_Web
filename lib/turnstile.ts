/// Cloudflare Turnstile server-side verification for public forms.
///
/// Env: TURNSTILE_SECRET_KEY (server) + NEXT_PUBLIC_TURNSTILE_SITE_KEY (widget).
/// When the secret is not configured the check is skipped, so the form keeps
/// working on environments that have no keys yet (preview, local dev).

export type TurnstileResult =
  | { ok: true; skipped: boolean }
  | { ok: false; reason: string };

export function turnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };
  if (!token || typeof token !== "string" || token.length > 2048) {
    return { ok: false, reason: "missing-token" };
  }
  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    if (remoteIp) form.set("remoteip", remoteIp);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(8000),
    });
    const d = (await r.json().catch(() => ({}))) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (d.success) return { ok: true, skipped: false };
    return { ok: false, reason: (d["error-codes"] ?? ["unknown"]).join(",") };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "verify-failed" };
  }
}

/// Best-effort client IP behind Caddy / proxies.
export function clientIp(req: Request): string | null {
  const h = req.headers;
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xr = h.get("x-real-ip");
  if (xr) return xr.trim();
  return null;
}

/// Tiny in-memory fixed-window limiter (per process). Good enough for a
/// contact form on a single container; resets on restart.
const buckets = new Map<string, { n: number; resetAt: number }>();
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { n: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return false;
  }
  b.n += 1;
  return b.n > max;
}
