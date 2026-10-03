/// Billing and trial settings for the client dashboard, read from the server
/// environment so prices and payment links change without a code deploy.
///
/// BILLING_PACKS — JSON array of credit packs. Each `url` is a Stripe Payment
/// Link (https://buy.stripe.com/...). Payment Link URLs are public by design,
/// so no Stripe secret ever lives here. Example:
///   [{"id":"s10","name":"Starter","credits":"10,000 requests","price":"$50",
///     "blurb":"Try a full integration","url":"https://buy.stripe.com/xyz"}]
/// When it is unset or invalid, the page shows quote-based plans instead.
///
/// Trial keys (self-serve, one per account):
///   TRIAL_ENABLED=1            turn the button on (anything else = off)
///   TRIAL_SERVICE_SLUG         dashboard service the key is attached to
///   TRIAL_ADMIN_URL            backend base URL that issues keys
///   TRIAL_ADMIN_TOKEN          that backend's admin token (server-only)
///   TRIAL_QUOTA=200            lifetime request cap for the trial key
///   TRIAL_PER_MINUTE=20, TRIAL_PER_HOUR=200, TRIAL_PER_DAY=200, TRIAL_CONCURRENCY=10

export type CreditPack = {
  id: string;
  name: string;
  credits: string;
  price: string;
  blurb?: string;
  url: string;
  highlight?: boolean;
};

function str(v: unknown, max = 120): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function creditPacks(): CreditPack[] {
  const raw = process.env.BILLING_PACKS;
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .map((p, i) => ({
        id: str(p?.id, 40) || `pack-${i}`,
        name: str(p?.name, 40),
        credits: str(p?.credits, 60),
        price: str(p?.price, 24),
        blurb: str(p?.blurb, 140) || undefined,
        url: str(p?.url, 300),
        highlight: p?.highlight === true,
      }))
      .filter((p) => p.name && p.price && /^https:\/\//.test(p.url));
  } catch {
    console.error("[billing] BILLING_PACKS is not valid JSON");
    return [];
  }
}

function int(name: string, fallback: number): number {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export type TrialConfig = {
  enabled: boolean;
  serviceSlug: string;
  adminUrl: string;
  adminToken: string;
  quota: number;
  perMinute: number;
  perHour: number;
  perDay: number;
  concurrency: number;
};

export function trialConfig(): TrialConfig {
  const adminUrl = (process.env.TRIAL_ADMIN_URL ?? "").replace(/\/+$/, "");
  const adminToken = process.env.TRIAL_ADMIN_TOKEN ?? "";
  const serviceSlug = process.env.TRIAL_SERVICE_SLUG ?? "";
  return {
    // Only on when explicitly enabled AND fully configured.
    enabled: process.env.TRIAL_ENABLED === "1" && !!adminUrl && !!adminToken && !!serviceSlug,
    serviceSlug,
    adminUrl,
    adminToken,
    quota: int("TRIAL_QUOTA", 200),
    perMinute: int("TRIAL_PER_MINUTE", 20),
    perHour: int("TRIAL_PER_HOUR", 200),
    perDay: int("TRIAL_PER_DAY", 200),
    concurrency: int("TRIAL_CONCURRENCY", 10),
  };
}

/// AuditLog action that marks "this account already took its trial".
export const TRIAL_AUDIT_ACTION = "trial.key.issue";
