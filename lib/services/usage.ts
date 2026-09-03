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

/// A key with no quota is unlimited, not empty. The backend says so explicitly
/// because "total: null" on its own reads as 0 — which would tell a client with
/// an unlimited plan that they had run out.
export type Credits = {
  total: number | null;
  used: number | null;
  remaining: number | null;
  unlimited: boolean;
};

/// The key's rate limits, when its backend reports them.
export type Limits = {
  perMinute: number | null;
  perHour: number | null;
  perDay: number | null;
  concurrency: number | null;
};

/// Facts about the key itself (never the key material).
export type KeyInfo = {
  isActive: boolean | null;
  createdAt: string | null;
};

/// What the client pays per 1,000 billable requests, as reported by the service
/// backend itself — the price lives on the API key, next to its quota and
/// limits, so there is exactly one source of truth. A backend that reports no
/// price simply shows no cost.
export type Pricing = { per1000: number; currency: string };

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

/// The same five figures the stat strip shows, for one dimension key.
export type DimTotals = { today: number; last7: number; last30: number; thisMonth: number; lifetime: number };

export type NormalizedUsage = {
  owner: string | null;
  /// Null until a rate is known — the cost card is hidden rather than showing $0.
  pricing: Pricing | null;
  /// Every date we know a figure for, keyed YYYY-MM-DD. Wider than `daily`:
  /// the backend also reports a day-by-day breakdown of this month and last,
  /// which is what the date picker reaches into.
  byDate: Record<string, { total: number; by: Record<string, number> }>;
  credits: Credits | null;
  limits: Limits | null;
  keyInfo: KeyInfo | null;
  jobs: Jobs | null;
  totals: { today: number; last7: number; last30: number; thisMonth: number; lifetime: number };
  /// Per-dimension totals, keyed the same way as `dims` — what the stat strip
  /// shows once the page is filtered to one region. Null for a backend that
  /// reports a single undifferentiated stream, which is also how the UI decides
  /// whether to offer a region switcher at all.
  ///
  /// Only traffic lives here. Credits, rate limits and job health stay off it on
  /// purpose: every backend reports those per *key*, not per region, so a
  /// per-region copy would be invented rather than measured.
  regions: Record<string, DimTotals> | null;
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

// The orchestrator now aggregates usage in SQL (~1s even for a busy key), so
// this only needs to cover a slow network or a cold cache, not a 15s scan.
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
    return { total: null, used: null, remaining: c, unlimited: false };
  }
  if (!isRecord(c)) return null;

  let total = maybeNum(c["total"] ?? c["purchased"] ?? c["limit"] ?? c["allocated"]);
  let used = maybeNum(c["used"] ?? c["consumed"] ?? c["spent"]);
  let remaining = maybeNum(c["remaining"] ?? c["left"] ?? c["available"] ?? c["balance"]);

  // Trust an explicit flag; otherwise "used but no cap" is the unlimited shape.
  const unlimited =
    typeof c["unlimited"] === "boolean" ? c["unlimited"] : total === null && used !== null;

  if (!unlimited) {
    if (remaining === null && total !== null && used !== null) remaining = total - used;
    if (used === null && total !== null && remaining !== null) used = total - remaining;
    if (total === null && used !== null && remaining !== null) total = used + remaining;
  }

  if (total === null && used === null && remaining === null && !unlimited) return null;
  return { total, used, remaining, unlimited };
}

function readLimits(raw: Record<string, unknown>): Limits | null {
  const l = raw["limits"];
  if (!isRecord(l)) return null;
  return {
    perMinute: maybeNum(l["per_minute"]),
    perHour: maybeNum(l["per_hour"]),
    perDay: maybeNum(l["per_day"]),
    concurrency: maybeNum(l["concurrency"]),
  };
}

/// Reads a price the backend volunteers. We haven't asked any backend to send
/// The Shopee orchestrator reports `pricing: {per_1000, currency}`; other
/// backends may spell it differently, so accept the plausible shapes rather
/// than one exact form. Null when the backend prices nothing.
function readPricing(raw: Record<string, unknown>): Pricing | null {
  const p = raw["pricing"];
  if (isRecord(p)) {
    const per = maybeNum(p["per_1000"] ?? p["per1000"] ?? p["price_per_1000"]);
    if (per !== null) {
      return { per1000: per, currency: typeof p["currency"] === "string" ? p["currency"] : "USD" };
    }
  }
  const flat = maybeNum(raw["price_per_1000"] ?? raw["cost_per_1000"]);
  return flat === null ? null : { per1000: flat, currency: "USD" };
}

function readKeyInfo(raw: Record<string, unknown>): KeyInfo | null {
  const k = raw["key"];
  if (!isRecord(k)) return null;
  return {
    isActive: typeof k["is_active"] === "boolean" ? k["is_active"] : null,
    createdAt: typeof k["created_at"] === "string" ? k["created_at"] : null,
  };
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

/// Bill off the jobs table, not the orchestrator's `request_count` meter.
///
/// `request_count` (which the backend reports as `credits.used`) counts every
/// job a client *submits* — it includes jobs that later failed, and it was
/// reset when the prepaid package was set up. So it matches neither the stated
/// policy (failed / captcha / pending aren't charged) nor the client's real
/// history. `jobs.billable` = completed + not_found is exactly what the client
/// is charged for, counted from their first request — so we show that as "used"
/// and derive "remaining" from it.
///
/// Only override when there's a real quota to bill against and a billable figure
/// to use; an unlimited or quota-less key keeps whatever the backend said.
function billFromBillable(credits: Credits | null, jobs: Jobs | null): Credits | null {
  if (!credits || credits.unlimited || credits.total === null) return credits;
  if (jobs === null || jobs.billable === null) return credits;
  return {
    ...credits,
    used: jobs.billable,
    remaining: Math.max(0, credits.total - jobs.billable),
  };
}

/// `monthly_breakdown` is keyed "YYYY-MM" -> { "<day-of-month>": 0 | {region: n,
/// all: n}, total: {...} }, and is null for a month with no traffic. Flatten it
/// to real dates so a date picker can just look one up.
function readMonthlyBreakdown(raw: Record<string, unknown>) {
  const out: Record<string, { total: number; by: Record<string, number> }> = {};
  const mb = raw["monthly_breakdown"];
  if (!isRecord(mb)) return out;

  for (const [month, days] of Object.entries(mb)) {
    // A null month isn't "unknown" — the backend returns null precisely when
    // the month held no billable jobs. So fill it in as zeros rather than
    // leaving a gap the date picker would have to disclaim.
    if (days === null) {
      const [y, m] = month.split("-").map(Number);
      if (!y || !m) continue;
      const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
      for (let d = 1; d <= last; d++) {
        out[`${month}-${String(d).padStart(2, "0")}`] = { total: 0, by: {} };
      }
      continue;
    }
    if (!isRecord(days)) continue;
    for (const [day, v] of Object.entries(days)) {
      if (day === "total") continue;
      const date = `${month}-${day.padStart(2, "0")}`;

      // A quiet day comes back as the number 0, not an object. Keep it: "we
      // know there were none" is an answer, and dropping it would leave the
      // date picker saying it has no figures for a day it does.
      if (!isRecord(v)) {
        out[date] = { total: 0, by: {} };
        continue;
      }

      const by: Record<string, number> = {};
      for (const [k, n] of Object.entries(v)) {
        if (k === "all") continue;
        const c = num(n);
        if (c > 0) by[k] = c;
      }
      out[date] = { total: num(v["all"]), by };
    }
  }
  return out;
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

  const jobsRaw = isRecord(raw["jobs"]) ? raw["jobs"] : null;
  const jobs = jobsRaw ? readJobs(jobsRaw) : null;

  const byDate: Record<string, { total: number; by: Record<string, number> }> = {};
  for (const d of daily) byDate[d.date] = { total: d.total, by: d.by };
  Object.assign(byDate, readMonthlyBreakdown(raw));

  // The same buckets, read per region instead of at `all` — every market this
  // key has touched, whether or not it has traffic in the visible window.
  const regionCodes = new Set<string>(dims);
  for (const name of ["today", "last_7_days", "last_30_days", "this_month", "lifetime"]) {
    const b = totals[name];
    if (isRecord(b)) for (const k of Object.keys(b)) if (k !== "all") regionCodes.add(k);
  }
  const perRegion = (name: string, code: string): number => {
    const b = totals[name];
    return isRecord(b) ? num(b[code]) : 0;
  };
  const regions: Record<string, DimTotals> = {};
  for (const code of regionCodes) {
    regions[code] = {
      today: perRegion("today", code),
      last7: perRegion("last_7_days", code),
      last30: perRegion("last_30_days", code),
      thisMonth: perRegion("this_month", code),
      lifetime: perRegion("lifetime", code),
    };
  }

  return {
    owner: typeof raw["owner"] === "string" ? raw["owner"] : null,
    pricing: readPricing(raw),
    byDate,
    credits: billFromBillable(readCredits(raw), jobs),
    limits: readLimits(raw),
    keyInfo: readKeyInfo(raw),
    jobs,
    totals: {
      today: bucket("today"),
      last7: bucket("last_7_days"),
      last30: bucket("last_30_days"),
      thisMonth: bucket("this_month"),
      lifetime: bucket("lifetime"),
    },
    regions: Object.keys(regions).length ? regions : null,
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

  const byDate: Record<string, { total: number; by: Record<string, number> }> = {};
  for (const d of daily) byDate[d.date] = { total: d.total, by: d.by };

  return {
    owner: typeof raw["owner"] === "string" ? raw["owner"] : null,
    pricing: readPricing(raw),
    byDate,
    credits: readCredits(raw),
    limits: readLimits(raw),
    keyInfo: readKeyInfo(raw),
    jobs: jobs ? readJobs(jobs) : null,
    totals: {
      today: bucket("today"),
      last7: bucket("last_7_days"),
      last30: bucket("last_30_days"),
      thisMonth: bucket("this_month"),
      lifetime: bucket("lifetime") || num(raw["request_count"]),
    },
    regions: null,
    dimension: null,
    dims: [],
    daily,
    raw,
  };
}

/// The homegate-v2 framework's `monthly_breakdown` is flatter than Shopee's:
/// each month is `{ "<day>": count, ..., "total": n }` — plain integers, no
/// region, no per-day object — and a month with no traffic is `null`. Flatten
/// to real dates, keeping zeros (a known 0 is an answer). "total" and any
/// non-numeric day key are skipped.
///
/// Shared by every backend on that framework (Homegate, Temu), including the
/// per-region copies Temu nests inside `by_region`.
function flattenDayMap(mb: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isRecord(mb)) return out;
  for (const [month, days] of Object.entries(mb)) {
    if (!isRecord(days)) continue;
    for (const [day, v] of Object.entries(days)) {
      if (day === "total" || !/^\d+$/.test(day)) continue;
      out[`${month}-${day.padStart(2, "0")}`] = num(v);
    }
  }
  return out;
}

function readHomegateDays(raw: Record<string, unknown>): Record<string, number> {
  return flattenDayMap(raw["monthly_breakdown"]);
}

/// Last-n-calendar-days helpers (UTC) for the backends that report `today` and
/// `this_month` but no rolling windows — those get summed from the breakdown.
function dayWindow(dayMap: Record<string, number>) {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const dayBack = (i: number) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
  const sumLast = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += dayMap[iso(dayBack(i))] ?? 0;
    return s;
  };
  return { iso, dayBack, sumLast };
}

/// The Homegate v2 backend (`GET /me/usage`): a single stream of requests, no
/// region split and no job-health breakdown. `totals` are plain integers and
/// there's no `last_7_days`/`last_30_days`, so those two are summed here from
/// the daily breakdown. Credits/limits/jobs aren't reported, so their cards
/// simply don't appear.
function adaptHomegate(raw: Record<string, unknown>): NormalizedUsage {
  const totals = isRecord(raw["totals"]) ? raw["totals"] : {};
  const dayMap = readHomegateDays(raw);

  // Sum the last n calendar days (UTC) out of the breakdown — this is what the
  // "Last 7 days" stat and the chart window need, and the backend omits them.
  const { iso, dayBack, sumLast } = dayWindow(dayMap);

  // Daily series for the last 30 days, oldest -> newest, matching Shopee so the
  // same chart/date-picker code renders it.
  const daily: UsagePoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = iso(dayBack(i));
    daily.push({ date, total: dayMap[date] ?? 0, by: {} });
  }

  const byDate: Record<string, { total: number; by: Record<string, number> }> = {};
  for (const [date, n] of Object.entries(dayMap)) byDate[date] = { total: n, by: {} };

  return {
    owner: typeof raw["owner"] === "string" ? raw["owner"] : null,
    pricing: readPricing(raw),
    byDate,
    credits: readCredits(raw),
    limits: readLimits(raw),
    keyInfo: readKeyInfo(raw),
    jobs: null, // Homegate's /me/usage reports no completed/failed/pending split
    totals: {
      today: num(totals["today"]),
      last7: sumLast(7),
      last30: sumLast(30),
      thisMonth: num(totals["this_month"]),
      lifetime: num(totals["lifetime"]),
    },
    regions: null, // Homegate reports one undifferentiated stream
    dimension: null,
    dims: [],
    daily,
    raw,
  };
}

/// The Temu broker (`GET /me/usage`) reports the same `totals` +
/// `monthly_breakdown` shape as Homegate — same homegate-v2 framework — but adds
/// a `by_region` block: one entry per marketplace, each carrying its own
/// day-by-day breakdown. That split is the whole point of the service, since a
/// single key covers six marketplaces (us · ca · br · cl · mx · ar) and the
/// region is a parameter of the request, not a separate backend. So this reads
/// the split and feeds the stacked chart rather than falling through to the flat
/// Homegate reader, which would collapse all six into one band.
///
/// Requests made before the broker became region-aware carry no region, and the
/// backend groups them under `"unknown"`. Kept as its own band rather than
/// dropped — they are real requests the client made.
///
/// Day totals come from the top-level breakdown, never from summing the regions:
/// the two are counted by separate queries, so trusting the total the backend
/// states keeps the chart honest if a region ever goes unreported.
function adaptTemu(raw: Record<string, unknown>): NormalizedUsage {
  const totals = isRecord(raw["totals"]) ? raw["totals"] : {};
  const combined = flattenDayMap(raw["monthly_breakdown"]);

  const regionsRaw = isRecord(raw["by_region"]) ? raw["by_region"] : {};
  const perRegion: Array<{ code: string; days: Record<string, number>; lifetime: number; block: Record<string, unknown> }> = [];
  for (const [code, block] of Object.entries(regionsRaw)) {
    if (!isRecord(block)) continue;
    perRegion.push({
      code,
      days: flattenDayMap(block["monthly_breakdown"]),
      lifetime: num(block["lifetime"]),
      block,
    });
  }
  // Busiest first: the legend then reads in the order a client cares about, and
  // the chart stacks its biggest band at the bottom.
  perRegion.sort((a, b) => b.lifetime - a.lifetime);

  const byDate: Record<string, { total: number; by: Record<string, number> }> = {};
  for (const [date, total] of Object.entries(combined)) byDate[date] = { total, by: {} };
  for (const { code, days } of perRegion) {
    for (const [date, n] of Object.entries(days)) {
      if (n <= 0) continue;
      const slot = (byDate[date] ??= { total: n, by: {} });
      slot.by[code] = n;
    }
  }

  const { iso, dayBack, sumLast } = dayWindow(combined);

  // Last 30 days, oldest -> newest, matching Shopee so the same chart and
  // date-picker code renders it.
  const daily: UsagePoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = iso(dayBack(i));
    const e = byDate[date];
    daily.push({ date, total: e?.total ?? 0, by: e?.by ?? {} });
  }

  // `today`, `this_month` and `lifetime` are stated per region; the two rolling
  // windows are not, so they get summed from that region's own day map exactly
  // the way the combined figures are.
  const regions: Record<string, DimTotals> = {};
  for (const { code, days, block } of perRegion) {
    const w = dayWindow(days);
    regions[code] = {
      today: num(block["today"]),
      last7: w.sumLast(7),
      last30: w.sumLast(30),
      thisMonth: num(block["this_month"]),
      lifetime: num(block["lifetime"]),
    };
  }

  return {
    owner: typeof raw["owner"] === "string" ? raw["owner"] : null,
    pricing: readPricing(raw),
    byDate,
    credits: readCredits(raw),
    limits: readLimits(raw),
    keyInfo: readKeyInfo(raw),
    // The broker now reports a job-status split (completed / failed+timeout+captcha
    // / pending) in /me/usage — read it so the Job health card lights up.
    jobs: isRecord(raw["jobs"]) ? readJobs(raw["jobs"]) : null,
    totals: {
      today: num(totals["today"]),
      last7: sumLast(7),
      last30: sumLast(30),
      thisMonth: num(totals["this_month"]),
      lifetime: num(totals["lifetime"]),
    },
    regions: Object.keys(regions).length ? regions : null,
    dimension: "region",
    dims: perRegion.filter((r) => r.lifetime > 0).map((r) => r.code),
    daily,
    raw,
  };
}

/// One region's slice of a usage report, in the same shape — so the page, the
/// chart and the spreadsheet can all be built from one object without either
/// side re-deriving the filter and drifting from the other.
///
/// Traffic only. Credits, limits, job health and the rate are reported per key,
/// so they pass through untouched; a caller showing them beside one region has
/// to say they cover the whole key.
///
/// Returns the report unchanged when there is nothing to filter to — no region
/// asked for, or a backend that never split by one.
export function projectRegion(usage: NormalizedUsage, region: string | null): NormalizedUsage {
  if (!region || !usage.regions?.[region]) return usage;

  const byDate: NormalizedUsage["byDate"] = {};
  for (const [date, e] of Object.entries(usage.byDate)) {
    const n = e.by[region] ?? 0;
    byDate[date] = { total: n, by: n > 0 ? { [region]: n } : {} };
  }

  return {
    ...usage,
    byDate,
    totals: usage.regions[region],
    daily: usage.daily.map((d) => {
      const n = d.by[region] ?? 0;
      return { date: d.date, total: n, by: n > 0 ? { [region]: n } : {} };
    }),
    dims: [region],
  };
}

export function normalizeUsage(kind: string, raw: unknown): NormalizedUsage | null {
  if (!isRecord(raw)) return null;
  switch (kind) {
    case "shopee-usage":
      return adaptShopee(raw);
    case "homegate-usage":
      return adaptHomegate(raw);
    case "temu-usage":
      return adaptTemu(raw);
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
