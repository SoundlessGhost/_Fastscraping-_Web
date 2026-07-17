// Talking to a client's service backend, and flattening whatever it answers
// into one shape the dashboard can render.
//
// Two rules drive this file:
//  1. The backend owns the API key. We never decide whether a key is valid —
//     we ask the service that runs it, exactly like its real users do
//     (key in a header; the backend checks it exists before doing any work).
//  2. Every backend answers a little differently, so `kind` picks an adapter.
//     Unknown kinds fall back to a tolerant reader rather than crashing.

export type UsagePoint = { date: string; total: number; by: Record<string, number> };

export type Credits = {
  total: number | null;
  used: number | null;
  remaining: number | null;
};

/// `notFound` = the product genuinely wasn't there, `billable` = completed +
/// notFound. The orchestrator charges for those two and not for failed /
/// captcha / pending, so its own totals count billable jobs only — the UI has
/// to say the same thing or the numbers won't add up for the client.
export type Jobs = {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  notFound: number | null;
  billable: number | null;
};

export type NormalizedUsage = {
  owner: string | null;
  credits: Credits | null;
  jobs: Jobs | null;
  totals: { today: number; last7: number; last30: number; thisMonth: number; lifetime: number };
  /// What the stacked chart splits by ("region"), or null when the backend
  /// reports a single undifferentiated number.
  dimension: string | null;
  /// Dimension keys that actually carry traffic, in first-seen order.
  dims: string[];
  daily: UsagePoint[];
  raw: unknown;
};

export type FetchResult =
  | { ok: true; data: NormalizedUsage }
  | { ok: false; reason: "unauthorized" | "unreachable" | "bad_response"; status: number | null; message: string };

/// The columns of a Service row this module needs. Kept structural so callers
/// can pass a Prisma row or a seed literal.
export type ServiceTarget = {
  baseUrl: string;
  usagePath: string;
  authHeader: string;
  kind: string;
};

const TIMEOUT_MS = 20_000;

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function maybeNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/// Credit shapes differ per backend and we have not seen the real one yet, so
/// accept the plausible spellings and derive whatever is missing.
function readCredits(raw: Record<string, unknown>): Credits | null {
  const c = raw["credits"] ?? raw["credit"] ?? raw["balance"] ?? null;
  if (c === null || c === undefined) return null;

  if (typeof c === "number") {
    return { total: null, used: null, remaining: c };
  }
  if (!isRecord(c)) return null;

  let total = maybeNum(c["total"] ?? c["purchased"] ?? c["limit"] ?? c["allocated"]);
  let used = maybeNum(c["used"] ?? c["consumed"] ?? c["spent"]);
  let remaining = maybeNum(c["remaining"] ?? c["left"] ?? c["available"] ?? c["balance"]);

  if (remaining === null && total !== null && used !== null) remaining = total - used;
  if (used === null && total !== null && remaining !== null) used = total - remaining;
  if (total === null && used !== null && remaining !== null) total = used + remaining;

  if (total === null && used === null && remaining === null) return null;
  return { total, used, remaining };
}

/// Older backends report four job states; the PDP orchestrator adds two more.
/// The extras stay null when absent so the UI can hide them rather than show a
/// confident zero.
function readJobs(jobs: Record<string, unknown>): Jobs {
  return {
    total: num(jobs["total"]),
    completed: num(jobs["completed"]),
    failed: num(jobs["failed"]),
    pending: num(jobs["pending"]),
    notFound: maybeNum(jobs["not_found"]),
    billable: maybeNum(jobs["billable"]),
  };
}

/// The Shopee usage backend (`GET /me/usage?interval=n`): totals and daily rows
/// are objects keyed by region code plus an `all` sum, and region keys only
/// appear once they have traffic.
function adaptShopee(raw: Record<string, unknown>): NormalizedUsage {
  const totals = isRecord(raw["totals"]) ? raw["totals"] : {};
  const bucket = (name: string): number => {
    const b = totals[name];
    return isRecord(b) ? num(b["all"]) : 0;
  };

  const dims: string[] = [];
  const daily: UsagePoint[] = [];
  const rows = Array.isArray(raw["daily"]) ? raw["daily"] : [];

  for (const row of rows) {
    if (!isRecord(row)) continue;
    const date = typeof row["date"] === "string" ? row["date"] : null;
    if (!date) continue;

    const by: Record<string, number> = {};
    for (const [k, v] of Object.entries(row)) {
      if (k === "date" || k === "all") continue;
      const n = num(v);
      if (n <= 0) continue;
      by[k] = n;
      if (!dims.includes(k)) dims.push(k);
    }
    daily.push({ date, total: num(row["all"]), by });
  }

  const jobs = isRecord(raw["jobs"]) ? raw["jobs"] : null;

  return {
    owner: typeof raw["owner"] === "string" ? raw["owner"] : null,
    credits: readCredits(raw),
    jobs: jobs ? readJobs(jobs) : null,
    totals: {
      today: bucket("today"),
      last7: bucket("last_7_days"),
      last30: bucket("last_30_days"),
      thisMonth: bucket("this_month"),
      lifetime: bucket("lifetime"),
    },
    dimension: "region",
    dims,
    daily,
    raw,
  };
}

/// Best effort for a backend we have not written an adapter for yet: show what
/// we can recognise, show nothing (not a wrong number) for what we cannot.
function adaptGeneric(raw: Record<string, unknown>): NormalizedUsage {
  const totals = isRecord(raw["totals"]) ? raw["totals"] : {};
  const bucket = (name: string): number => {
    const b = totals[name];
    if (typeof b === "number") return num(b);
    return isRecord(b) ? num(b["all"]) : 0;
  };

  const daily: UsagePoint[] = [];
  const rows = Array.isArray(raw["daily"]) ? raw["daily"] : [];
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const date = typeof row["date"] === "string" ? row["date"] : null;
    if (!date) continue;
    const total = num(row["all"] ?? row["total"] ?? row["count"] ?? row["requests"]);
    daily.push({ date, total, by: {} });
  }

  const jobs = isRecord(raw["jobs"]) ? raw["jobs"] : null;

  return {
    owner: typeof raw["owner"] === "string" ? raw["owner"] : null,
    credits: readCredits(raw),
    jobs: jobs ? readJobs(jobs) : null,
    totals: {
      today: bucket("today"),
      last7: bucket("last_7_days"),
      last30: bucket("last_30_days"),
      thisMonth: bucket("this_month"),
      lifetime: bucket("lifetime") || num(raw["request_count"]),
    },
    dimension: null,
    dims: [],
    daily,
    raw,
  };
}

export function normalizeUsage(kind: string, raw: unknown): NormalizedUsage | null {
  if (!isRecord(raw)) return null;
  switch (kind) {
    case "shopee-usage":
      return adaptShopee(raw);
    default:
      return adaptGeneric(raw);
  }
}

/// One request to a service backend with the client's key in its own header.
/// Runs server-side only, so the key never reaches the browser.
async function callBackend(
  service: ServiceTarget,
  apiKey: string,
  search: string,
): Promise<{ res: Response } | { error: FetchResult }> {
  const url = `${service.baseUrl.replace(/\/+$/, "")}${service.usagePath}${search}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { [service.authHeader]: apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { res };
  } catch {
    return {
      error: {
        ok: false,
        reason: "unreachable",
        status: null,
        message: "Service did not respond",
      },
    };
  }
}

export async function fetchServiceUsage(
  service: ServiceTarget,
  apiKey: string,
  interval: number,
): Promise<FetchResult> {
  const call = await callBackend(service, apiKey, `?interval=${interval}`);
  if ("error" in call) return call.error;
  const { res } = call;

  if (res.status === 401 || res.status === 403) {
    return { ok: false, reason: "unauthorized", status: res.status, message: "Key rejected by the service" };
  }
  if (!res.ok) {
    return { ok: false, reason: "bad_response", status: res.status, message: `Service returned ${res.status}` };
  }

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    return { ok: false, reason: "bad_response", status: res.status, message: "Service returned invalid JSON" };
  }

  const data = normalizeUsage(service.kind, raw);
  if (!data) {
    return { ok: false, reason: "bad_response", status: res.status, message: "Unexpected response shape" };
  }
  return { ok: true, data };
}

/// Asks the service whether this key exists — the same check its real users go
/// through. Used before we store a key.
export async function verifyKey(service: ServiceTarget, apiKey: string): Promise<FetchResult> {
  return fetchServiceUsage(service, apiKey, 1);
}
