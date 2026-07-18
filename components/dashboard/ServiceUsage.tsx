"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { regionColor, regionName } from "@/lib/regions";
import type { ServiceNode } from "@/lib/services/taxonomy";
import type { NormalizedUsage } from "@/lib/services/usage";

// Usage for one service, drawn from the normalised shape — so a new backend
// only needs an adapter, never a new chart.
//
// We fetch once at the widest range and slice locally. The backend recomputes
// nothing per interval (its totals are interval-independent and `daily` is just
// truncated), so asking again for 7 days would buy exactly the rows we already
// hold — and cost a round trip. Switching ranges is therefore instant.

const nf = new Intl.NumberFormat("en-US");
const RANGES = [
  { v: 1, l: "24h" },
  { v: 3, l: "3d" },
  { v: 7, l: "7d" },
  { v: 30, l: "30d" },
];
const WIDEST = 30;
/// The backend answers in ~1s now, so a 10s poll feels near-live without
/// stacking (one request at a time, and only while the tab is visible). If many
/// clients ever watch at once, each refresh is still a real DB scan on the
/// orchestrator — raise this or add caching then.
const REFRESH_MS = 10_000;

const VBW = 900;
const VBH = 300;
const PADL = 44;
const PADR = 16;
const PADT = 18;
const PADB = 34;
const plotH = VBH - PADT - PADB;
const plotW = VBW - PADL - PADR;

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const fmtAxis = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : String(v));

const dimLabel = (k: string) => regionName(k);
const dimColor = (k: string) => regionColor(k);

const todayUTC = () => new Date().toISOString().slice(0, 10);

const fmtAgo = (sec: number) =>
  sec < 60 ? `${sec}s` : sec < 3600 ? `${Math.round(sec / 60)}m` : `${Math.round(sec / 3600)}h`;

type Point = { date: string; total: number; by: Record<string, number> };
type Tip = { x: number; y: number; day: Point } | null;

function Spinner({ label }: { label?: string }) {
  return (
    <div className="su-spin" role="status" aria-live="polite">
      <span className="su-spin-ring" />
      {label && <span className="su-spin-l">{label}</span>}
    </div>
  );
}

export default function ServiceUsage({
  service,
  title,
  // Where to fetch the widest window from. Defaults to the signed-in client's
  // own endpoint; the admin view-as passes a per-user endpoint instead. Same
  // response shape either way, so everything below is unchanged.
  usageUrl = `/api/services/${service.slug}/usage?interval=${WIDEST}`,
}: {
  service: ServiceNode;
  title: string;
  usageUrl?: string;
}) {
  const [range, setRange] = useState(7);
  const [usage, setUsage] = useState<NormalizedUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [ago, setAgo] = useState(0);
  const [tip, setTip] = useState<Tip>(null);
  const inFlight = useRef(false);

  const load = useCallback(
    async (mode: "first" | "refresh") => {
      // The backend walks every job row for this key, so a call is expensive.
      // Never let two run at once.
      if (inFlight.current) return;
      inFlight.current = true;
      if (mode === "first") setLoading(true);
      else setRefreshing(true);

      try {
        const r = await fetch(usageUrl, { cache: "no-store" });
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          // A refresh that fails leaves the numbers we already have on screen —
          // stale data beats an empty page.
          if (mode === "first") setUsage(null);
          setError(body.message ?? "Could not load usage.");
          return;
        }
        setUsage(body.usage);
        setError(null);
        setUpdatedAt(Date.now());
      } catch {
        setError("Network error.");
      } finally {
        inFlight.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [usageUrl],
  );

  useEffect(() => {
    setUsage(null);
    setUpdatedAt(null);
    load("first");
  }, [service.slug, load]);

  // Keep the numbers current without anyone pressing anything. Two rules keep
  // this from hammering the backend: only while the tab is actually being
  // looked at, and one request at a time.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") load("refresh");
    };
    const id = window.setInterval(tick, REFRESH_MS);

    // Coming back to a tab that sat in the background: catch up immediately
    // rather than waiting out the rest of the interval.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!updatedAt || Date.now() - updatedAt > REFRESH_MS) load("refresh");
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, updatedAt]);

  // Drives the "updated Ns ago" label.
  useEffect(() => {
    if (!updatedAt) return;
    const id = window.setInterval(() => setAgo(Math.round((Date.now() - updatedAt) / 1000)), 1000);
    setAgo(0);
    return () => window.clearInterval(id);
  }, [updatedAt]);

  const all = useMemo(() => usage?.daily ?? [], [usage]);
  const days = useMemo(() => (all.length > range ? all.slice(-range) : all), [all, range]);

  // Only regions with traffic *in the visible range* get a colour and a legend
  // slot — otherwise a quiet month shows a legend of things that aren't there.
  const dims = useMemo(() => {
    const seen: string[] = [];
    for (const d of days) for (const k of Object.keys(d.by)) if (!seen.includes(k)) seen.push(k);
    return seen;
  }, [days]);

  const top = Math.max(1, ...days.map((d) => d.total));
  const yOf = (v: number) => PADT + plotH - (v / top) * plotH;
  const colW = days.length ? plotW / days.length : 0;
  const barW = Math.max(3, Math.min(30, colW * 0.6));
  const lblStep = Math.max(1, Math.ceil(days.length / 8));
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: Math.round(top * f), y: yOf(top * f) }));

  const rangeTotal = days.reduce((s, d) => s + d.total, 0);
  const avg = days.length ? rangeTotal / days.length : 0;
  const busiest = days.reduce<Point | null>((b, d) => (!b || d.total > b.total ? d : b), null);

  // The heaviest days in view, biggest first — quiet days are not interesting
  // here, so they never make the list. A service with no Job-health card hands
  // the whole right column to this panel, so we fill it with more days rather
  // than leave three rows floating in the empty space.
  const busiestDays = useMemo(() => {
    const ranked = days.filter((d) => d.total > 0).sort((a, b) => b.total - a.total);
    return ranked.slice(0, usage?.jobs ? 3 : 6);
  }, [days, usage?.jobs]);
  const today = todayUTC();

  // Date picker: the backend reports this month and last day-by-day, on top of
  // the daily window — so offer exactly the span we hold figures for.
  const [pickedDate, setPickedDate] = useState<string>(today);
  const known = useMemo(() => Object.keys(usage?.byDate ?? {}).sort(), [usage]);
  const picked = usage?.byDate[pickedDate] ?? null;

  const credits = usage?.credits ?? null;
  const limits = usage?.limits ?? null;
  const jobs = usage?.jobs ?? null;

  return (
    <>
      <div className="ds-head">
        <div>
          <h1 className="dash-title">
            {title} <em>usage</em>
          </h1>
          <p className="dash-meta">
            owner <b>{usage?.owner ?? "—"}</b> · all times UTC
            {updatedAt && (
              <>
                {" · "}
                <span className="su-live" title="Refreshes on its own every minute">
                  <i className={refreshing ? "is-busy" : ""} />
                  {refreshing ? "updating…" : ago < 5 ? "just now" : `updated ${fmtAgo(ago)} ago`}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="dash-controls">
          <div className="dash-seg">
            {RANGES.map((it) => (
              <button key={it.v} className={range === it.v ? "on" : ""} onClick={() => setRange(it.v)}>
                {it.l}
              </button>
            ))}
          </div>
          <button
            className="su-refresh"
            onClick={() => load("refresh")}
            disabled={refreshing || loading}
            title="Fetch the latest numbers now"
          >
            <span className={`su-refresh-i ${refreshing ? "is-busy" : ""}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="su-error">
          <b>{error}</b>
          <span>If your key changed, remove it in Settings and add the new one.</span>
        </div>
      )}

      {/* STAT STRIP */}
      <div className="dash-stats">
        <div className="dash-stat">
          <div className="dash-stat-k">Today</div>
          <div className="dash-stat-v">{usage ? nf.format(usage.totals.today) : "—"}</div>
          <div className="dash-stat-s">requests so far · UTC</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-k">Last 7 days</div>
          <div className="dash-stat-v">{usage ? nf.format(usage.totals.last7) : "—"}</div>
          <div className="dash-stat-s">avg {usage ? nf.format(Math.round(usage.totals.last7 / 7)) : "0"} / day</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-k">This month</div>
          <div className="dash-stat-v">{usage ? nf.format(usage.totals.thisMonth) : "—"}</div>
          <div className="dash-stat-s">rolling 30 days</div>
        </div>
        <div className="dash-stat dash-stat--dark">
          <div className="dash-stat-k">Lifetime</div>
          <div className="dash-stat-v">{usage ? nf.format(usage.totals.lifetime) : "—"}</div>
          <div className="dash-stat-s">since first request</div>
        </div>
      </div>

      {/* CREDITS — only when the backend reports them */}
      {credits && (
        <div className="su-credits">
          {/* Reads the way the maths runs: bought, spent, left. */}
          <div className="su-credit">
            <span className="su-credit-k">Purchased</span>
            <span className="su-credit-v">
              {credits.unlimited ? "—" : credits.total !== null ? nf.format(credits.total) : "—"}
            </span>
          </div>
          <div className="su-credit">
            <span className="su-credit-k">Used</span>
            <span className="su-credit-v">{credits.used !== null ? nf.format(credits.used) : "—"}</span>
          </div>
          <div className="su-credit">
            <span className="su-credit-k">Credits remaining</span>
            <span className={`su-credit-v ${credits.unlimited ? "is-unl" : ""}`}>
              {credits.unlimited ? "Unlimited" : credits.remaining !== null ? nf.format(credits.remaining) : "—"}
            </span>
          </div>
          {!credits.unlimited && credits.total ? (
            <div className="su-credit-bar">
              <span
                style={{ width: `${Math.min(100, Math.max(0, ((credits.used ?? 0) / credits.total) * 100))}%` }}
              />
            </div>
          ) : null}
          {limits && (
            <div className="su-limits">
              {limits.perMinute !== null && <span>{nf.format(limits.perMinute)} / min</span>}
              {limits.perHour !== null && <span>{nf.format(limits.perHour)} / hour</span>}
              {limits.perDay !== null && <span>{nf.format(limits.perDay)} / day</span>}
              {limits.concurrency !== null && <span>{limits.concurrency} concurrent</span>}
            </div>
          )}
        </div>
      )}

      <div className="dash-grid">
        {/* CHART */}
        <div className="dash-card su-chartcard">
          <div className="dash-card-h">
            <div className="dash-card-t">
              Traffic overview{" "}
              <small>
                {nf.format(rangeTotal)} requests over {days.length} day{days.length === 1 ? "" : "s"} ·{" "}
                {nf.format(Math.round(avg))} / day average
              </small>
            </div>
            {dims.length > 0 && (
              <div className="dash-legend">
                {dims.map((c) => (
                  <span key={c}>
                    <i style={{ background: dimColor(c) }} />
                    {dimLabel(c)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="dash-chart su-chart">
            {loading ? (
              <Spinner label="loading usage…" />
            ) : rangeTotal === 0 ? (
              <div className="su-nodata">
                <b>No requests in this range</b>
                <span>pick a longer range, or check back once jobs run</span>
              </div>
            ) : (
              <svg viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="none" onMouseLeave={() => setTip(null)}>
                {/* horizontal grid + y labels */}
                {grid.map((g, i) => (
                  <g key={i}>
                    <line
                      x1={PADL}
                      x2={VBW - PADR}
                      y1={g.y}
                      y2={g.y}
                      stroke="rgba(19,22,19,0.07)"
                      strokeWidth={1}
                    />
                    <text
                      x={PADL - 10}
                      y={g.y + 3}
                      textAnchor="end"
                      fontSize="9.5"
                      fontWeight="500"
                      fontFamily="var(--font-mono)"
                      fill="#6b6e69"
                    >
                      {fmtAxis(g.v)}
                    </text>
                  </g>
                ))}

                {/* average line — the "is today normal?" reference */}
                {avg > 0 && days.length > 1 && (
                  <g>
                    <line
                      x1={PADL}
                      x2={VBW - PADR}
                      y1={yOf(avg)}
                      y2={yOf(avg)}
                      stroke="#131613"
                      strokeWidth={1}
                      strokeDasharray="3 4"
                      opacity={0.4}
                    />
                    <text
                      x={VBW - PADR}
                      y={yOf(avg) - 6}
                      textAnchor="end"
                      fontSize="9"
                      fontWeight="500"
                      fontFamily="var(--font-mono)"
                      fill="#6b6e69"
                    >
                      avg {fmtAxis(Math.round(avg))}
                    </text>
                  </g>
                )}

                {days.map((d, i) => {
                  const cx = PADL + colW * (i + 0.5);
                  const isToday = d.date === today;
                  const isTip = tip?.day.date === d.date;
                  let acc = 0;

                  return (
                    <g key={d.date}>
                      {/* hover band, drawn under the bar */}
                      {isTip && (
                        <rect
                          x={cx - colW / 2}
                          y={PADT}
                          width={colW}
                          height={plotH}
                          fill="rgba(19,22,19,0.045)"
                          rx={3}
                        />
                      )}

                      {/* zero days still get a mark, so "nothing happened" reads
                          as a fact rather than a gap in the chart */}
                      {d.total === 0 ? (
                        <line
                          x1={cx - barW / 2}
                          x2={cx + barW / 2}
                          y1={PADT + plotH}
                          y2={PADT + plotH}
                          stroke="#c9c7c0"
                          strokeWidth={2}
                          strokeLinecap="round"
                        />
                      ) : (
                        (dims.length ? dims : ["_"]).map((c) => {
                          const v = c === "_" ? d.total : (d.by[c] ?? 0);
                          if (v <= 0) return null;
                          const h = (v / top) * plotH;
                          const y = yOf(acc + v);
                          acc += v;
                          return (
                            <rect
                              key={c}
                              x={cx - barW / 2}
                              y={y}
                              width={barW}
                              height={Math.max(1.5, h)}
                              fill={c === "_" ? "#0e5d44" : dimColor(c)}
                              rx={2}
                              opacity={isTip ? 1 : 0.92}
                            />
                          );
                        })
                      )}

                      {/* full-height hit area */}
                      <rect
                        x={cx - colW / 2}
                        y={PADT}
                        width={colW}
                        height={plotH}
                        fill="transparent"
                        onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, day: d })}
                      />

                      {(days.length - 1 - i) % lblStep === 0 ? (
                        <text
                          x={cx}
                          y={VBH - 12}
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight={isToday ? 700 : 500}
                          fontFamily="var(--font-mono)"
                          fill={isToday ? "#131613" : "#6b6e69"}
                        >
                          {isToday ? "today" : shortDate(d.date)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}

                {/* busiest day gets its number, so the peak is readable without hovering */}
                {busiest && busiest.total > 0 && days.length > 2 && (
                  <text
                    x={PADL + colW * (days.indexOf(busiest) + 0.5)}
                    y={yOf(busiest.total) - 7}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="var(--font-mono)"
                    fill="#131613"
                  >
                    {nf.format(busiest.total)}
                  </text>
                )}

                {/* baseline */}
                <line
                  x1={PADL}
                  x2={VBW - PADR}
                  y1={PADT + plotH}
                  y2={PADT + plotH}
                  stroke="rgba(19,22,19,0.18)"
                  strokeWidth={1}
                />
              </svg>
            )}
          </div>

          {tip && (
            <div className="dash-tip" style={{ left: tip.x, top: tip.y }}>
              {longDate(tip.day.date)}
              {Object.entries(tip.day.by).map(([k, v]) => (
                <div key={k}>
                  {dimLabel(k)} <b>{nf.format(v)}</b>
                </div>
              ))}
              <div>
                total <b>{nf.format(tip.day.total)}</b>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="dash-col">
          {loading && !usage ? (
            <div className="dash-card su-sidecard">
              <Spinner />
            </div>
          ) : (
            <>
              {jobs && (
                <div className="dash-card">
                  <div className="dash-card-h">
                    <div className="dash-card-t">Job health</div>
                  </div>
                  <div className="dash-health-row">
                    <div className="dash-health-cell">
                      <div className="dash-health-v ok">{nf.format(jobs.completed)}</div>
                      <div className="dash-health-l">completed</div>
                    </div>
                    {jobs.notFound !== null && (
                      <div className="dash-health-cell">
                        <div className="dash-health-v">{nf.format(jobs.notFound)}</div>
                        <div className="dash-health-l">not found</div>
                      </div>
                    )}
                    <div className="dash-health-cell">
                      <div className="dash-health-v bad">{nf.format(jobs.failed)}</div>
                      <div className="dash-health-l">failed</div>
                    </div>
                    <div className="dash-health-cell">
                      <div className="dash-health-v">{nf.format(jobs.pending)}</div>
                      <div className="dash-health-l">pending</div>
                    </div>
                  </div>
                  <div className="dash-meter">
                    <span className="m-ok" style={{ width: jobs.total ? `${(jobs.completed / jobs.total) * 100}%` : "0%" }} />
                    <span className="m-bad" style={{ width: jobs.total ? `${(jobs.failed / jobs.total) * 100}%` : "0%" }} />
                  </div>
                  <div className="dash-meter-s">
                    {jobs.total ? `${((jobs.completed / jobs.total) * 100).toFixed(1)}% success` : "no jobs yet"} ·{" "}
                    {nf.format(jobs.total)} total
                    {jobs.billable !== null && <> · {nf.format(jobs.billable)} billable</>}
                  </div>
                  {jobs.billable !== null && (
                    <div className="su-billnote">
                      Billable = completed + not found. Failed, captcha and pending jobs aren&apos;t charged.
                    </div>
                  )}
                </div>
              )}

              <div className="dash-card su-topcard">
                <div className="dash-card-h">
                  <div className="dash-card-t">
                    Top usage <small>busiest days in this range</small>
                  </div>
                </div>
                {busiestDays.length === 0 ? (
                  <div className="dash-empty">
                    <div className="dash-empty-t">No activity yet</div>
                    <div className="dash-empty-s">your busiest days will show up here</div>
                  </div>
                ) : (
                  <div className="su-top">
                    {busiestDays.map((d, i) => (
                      <div
                        className="su-top-row"
                        key={d.date}
                        title={Object.entries(d.by)
                          .sort((a, b) => b[1] - a[1])
                          .map(([k, v]) => `${dimLabel(k)} ${nf.format(v)}`)
                          .join(" · ")}
                      >
                        <span className="su-top-rank">{i + 1}</span>
                        <span className="su-top-date">{shortDate(d.date)}</span>
                        <span className="su-top-bar">
                          <span style={{ width: `${(d.total / busiestDays[0].total) * 100}%` }} />
                        </span>
                        <span className="su-top-n">{nf.format(d.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* DAY BREAKDOWN — full width under the grid */}
      {usage && (
        <div className="dash-card su-day">
          <div className="dash-card-h">
            <div className="dash-card-t">
              Day breakdown <small>requests on a specific date (UTC)</small>
            </div>
            <input
              type="date"
              className="su-date"
              value={pickedDate}
              min={known[0] ?? undefined}
              max={today}
              onChange={(e) => setPickedDate(e.target.value || today)}
            />
          </div>

          <div className="su-day-body">
            <div className="su-day-n">
              <span className="su-day-v">{nf.format(picked?.total ?? 0)}</span>
              <span className="su-day-s">
                requests on <b>{pickedDate}</b>
                {!picked && " · no figures held for this date"}
                {picked && picked.total === 0 && " · no activity"}
              </span>
            </div>

            {picked && picked.total > 0 && (
              <div className="su-day-split">
                {Object.entries(picked.by)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => (
                    <span className="su-day-chip" key={k}>
                      <i style={{ background: dimColor(k) }} />
                      {dimLabel(k)} <b>{nf.format(v)}</b>
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
