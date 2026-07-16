"use client";

import { useEffect, useMemo, useState } from "react";
import { regionColor, regionName } from "@/lib/regions";
import type { ServiceNode } from "@/lib/services/taxonomy";
import type { NormalizedUsage } from "@/lib/services/usage";

// Usage for one service, drawn from the normalised shape — so a new backend
// only needs an adapter, never a new chart.

const nf = new Intl.NumberFormat("en-US");
const INTERVALS = [
  { v: 1, l: "24h" },
  { v: 3, l: "3d" },
  { v: 7, l: "7d" },
  { v: 30, l: "30d" },
];

const VBW = 900;
const VBH = 320;
const PADL = 42;
const PADR = 14;
const PADT = 16;
const PADB = 30;
const plotH = VBH - PADT - PADB;

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const fmtAxis = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : String(v));

/// The dimension keys are region codes today; label/colour fall back for
/// anything else a future backend splits by.
const dimLabel = (k: string) => regionName(k);
const dimColor = (k: string) => regionColor(k);

type Data = { usage: NormalizedUsage; interval: number };

export default function ServiceUsage({ service, title }: { service: ServiceNode; title: string }) {
  const [interval, setInterval] = useState(7);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dim, setDim] = useState("all");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`/api/services/${service.slug}/usage?interval=${interval}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!alive) return;
        if (!r.ok) {
          setError(body.message ?? "Could not load usage.");
          setData(null);
          return;
        }
        setData({ usage: body.usage, interval: body.interval });
      })
      .catch(() => alive && setError("Network error."))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [service.slug, interval]);

  const usage = data?.usage ?? null;
  const dims = usage?.dims ?? [];
  const shown = useMemo(() => (dim === "all" ? dims : dims.filter((d) => d === dim)), [dim, dims]);

  const days = usage?.daily ?? [];
  const sumOf = (row: { total: number; by: Record<string, number> }) =>
    dim === "all" ? row.total : (row.by[dim] ?? 0);

  const top = Math.max(1, ...days.map(sumOf));
  const yOf = (v: number) => PADT + plotH - (v / top) * plotH;
  const colW = days.length ? (VBW - PADL - PADR) / days.length : 0;
  const barW = Math.min(26, colW * 0.62);
  const lblStep = Math.max(1, Math.ceil(days.length / 8));
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: Math.round(top * f), y: yOf(top * f) }));

  const rangeTotal = days.reduce((s, d) => s + sumOf(d), 0);
  const credits = usage?.credits ?? null;
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
            {usage && <> · key verified</>}
          </p>
        </div>

        <div className="dash-controls">
          <div className="dash-seg">
            {INTERVALS.map((it) => (
              <button key={it.v} className={interval === it.v ? "on" : ""} onClick={() => setInterval(it.v)}>
                {it.l}
              </button>
            ))}
          </div>
          {dims.length > 0 && (
            <select className="dash-region" value={dim} onChange={(e) => setDim(e.target.value)} aria-label="Filter">
              <option value="all">All regions</option>
              {dims.map((d) => (
                <option key={d} value={d}>
                  {dimLabel(d)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="su-error">
          <b>{error}</b>
          <span>
            If your key changed, remove it in Settings and add the new one.
          </span>
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
          <div className="su-credit">
            <span className="su-credit-k">Credits remaining</span>
            <span className="su-credit-v">{credits.remaining !== null ? nf.format(credits.remaining) : "—"}</span>
          </div>
          <div className="su-credit">
            <span className="su-credit-k">Used</span>
            <span className="su-credit-v">{credits.used !== null ? nf.format(credits.used) : "—"}</span>
          </div>
          <div className="su-credit">
            <span className="su-credit-k">Purchased</span>
            <span className="su-credit-v">{credits.total !== null ? nf.format(credits.total) : "—"}</span>
          </div>
          {credits.total ? (
            <div className="su-credit-bar">
              <span
                style={{
                  width: `${Math.min(100, Math.max(0, ((credits.used ?? 0) / credits.total) * 100))}%`,
                }}
              />
            </div>
          ) : null}
        </div>
      )}

      <div className="dash-grid">
        {/* CHART */}
        <div className="dash-card">
          <div className="dash-card-h">
            <div className="dash-card-t">
              Traffic overview <small>requests / day{usage?.dimension ? " · stacked by region" : ""}</small>
            </div>
            {shown.length > 0 && (
              <div className="dash-legend">
                {shown.map((c) => (
                  <span key={c}>
                    <i style={{ background: dimColor(c) }} />
                    {dimLabel(c)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="dash-chart">
            {loading && !usage ? (
              <div className="su-load">loading…</div>
            ) : (
              <svg viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="none">
                {grid.map((g, i) => (
                  <g key={i}>
                    <line x1={PADL} x2={VBW - PADR} y1={g.y} y2={g.y} stroke="rgba(19,22,19,0.07)" strokeWidth={1} />
                    <text x={PADL - 8} y={g.y + 3} textAnchor="end" fontSize="9.5" fontWeight="500" fontFamily="var(--font-mono)" fill="#6b6e69">
                      {fmtAxis(g.v)}
                    </text>
                  </g>
                ))}

                {days.map((d, i) => {
                  const cx = PADL + colW * (i + 0.5);
                  let acc = 0;
                  const stack = shown.length ? shown : ["_"];
                  return (
                    <g key={d.date}>
                      {stack.map((c) => {
                        const v = c === "_" ? sumOf(d) : (d.by[c] ?? 0);
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
                            height={Math.max(0, h)}
                            fill={c === "_" ? "#0e5d44" : dimColor(c)}
                            rx={2}
                          />
                        );
                      })}
                      {(days.length - 1 - i) % lblStep === 0 ? (
                        <text x={cx} y={VBH - 8} textAnchor="middle" fontSize="9.5" fontWeight="500" fontFamily="var(--font-mono)" fill="#6b6e69">
                          {shortDate(d.date)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}

                {days.length > 1 ? (
                  <polyline
                    points={days.map((d, i) => `${PADL + colW * (i + 0.5)},${yOf(sumOf(d))}`).join(" ")}
                    fill="none"
                    stroke="#131613"
                    strokeWidth="1.4"
                    strokeDasharray="4 3"
                    opacity="0.5"
                  />
                ) : null}
              </svg>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dash-col">
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
              </div>
            </div>
          )}

          <div className="dash-card">
            <div className="dash-card-h">
              <div className="dash-card-t">
                Top regions <small>this range</small>
              </div>
            </div>
            {shown.length === 0 || rangeTotal === 0 ? (
              <div className="dash-empty">
                <div className="dash-empty-t">No activity yet</div>
                <div className="dash-empty-s">regions appear once they have requests</div>
              </div>
            ) : (
              <div className="dash-regions">
                {shown
                  .map((c) => ({ c, v: days.reduce((s, d) => s + (d.by[c] ?? 0), 0) }))
                  .sort((a, b) => b.v - a.v)
                  .map(({ c, v }) => (
                    <div className="dash-region-row" key={c}>
                      <div className="dash-region-name">{dimLabel(c)}</div>
                      <div className="dash-region-bar">
                        <span style={{ width: `${(v / rangeTotal) * 100}%`, background: dimColor(c) }} />
                      </div>
                      <div className="dash-region-n">{nf.format(v)}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
