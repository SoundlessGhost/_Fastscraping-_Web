"use client";

import { useMemo, useState } from "react";

// A compact two-click date-range picker for the usage chart. Bounded to the
// window we actually hold figures for ([min, max]); everything outside is
// disabled so a client can't ask for a day we can't answer.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const fmt = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export type DateRange = { start: string; end: string };

export default function RangeCalendar({
  min,
  max,
  value,
  single = false,
  onApply,
  onClose,
}: {
  min: string;
  max: string;
  value: DateRange | null;
  /// One-date mode (Day breakdown): a click selects and applies immediately.
  single?: boolean;
  onApply: (r: DateRange) => void;
  onClose: () => void;
}) {
  const [start, setStart] = useState<string | null>(value?.start ?? null);
  const [end, setEnd] = useState<string | null>(value?.end ?? null);
  const [view, setView] = useState(() => {
    const base = value?.end ?? max;
    const d = new Date(`${base}T00:00:00Z`);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  });

  const cells = useMemo(() => {
    const firstDow = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    const out: (string | null)[] = [];
    for (let i = 0; i < firstDow; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(iso(view.y, view.m, d));
    return out;
  }, [view]);

  const inBounds = (date: string) => date >= min && date <= max;

  function clickDay(date: string) {
    if (!inBounds(date)) return;
    if (single) {
      onApply({ start: date, end: date });
      return;
    }
    if (!start || end) {
      // starting a fresh selection
      setStart(date);
      setEnd(null);
    } else if (date < start) {
      setEnd(start);
      setStart(date);
    } else {
      setEnd(date);
    }
  }

  const isEdge = (date: string) => date === start || date === end;
  const inRange = (date: string) => !!(start && end && date >= start && date <= end);

  // Month navigation, clamped to the months that hold [min, max].
  const viewFirst = iso(view.y, view.m, 1);
  const viewLast = iso(view.y, view.m, new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate());
  const canPrev = viewFirst > min;
  const canNext = viewLast < max;
  const step = (delta: number) => {
    const m = view.m + delta;
    const y = view.y + Math.floor(m / 12);
    setView({ y, m: ((m % 12) + 12) % 12 });
  };

  return (
    <div className="cal" role="dialog" aria-label="Pick a date range">
      <div className="cal-head">
        <button type="button" className="cal-nav" onClick={() => step(-1)} disabled={!canPrev} aria-label="Previous month">
          ‹
        </button>
        <span className="cal-title">
          {MONTHS[view.m]} {view.y}
        </span>
        <button type="button" className="cal-nav" onClick={() => step(1)} disabled={!canNext} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="cal-dow">
        {DOW.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((date, i) =>
          date ? (
            <button
              type="button"
              key={date}
              className={`cal-day${isEdge(date) ? " is-edge" : ""}${inRange(date) && !isEdge(date) ? " is-in" : ""}`}
              disabled={!inBounds(date)}
              onClick={() => clickDay(date)}
            >
              {Number(date.slice(-2))}
            </button>
          ) : (
            <span key={`e${i}`} />
          ),
        )}
      </div>

      <div className="cal-foot">
        <span className="cal-sel">
          {single
            ? start
              ? fmt(start)
              : "Pick a date"
            : start
              ? end
                ? `${fmt(start)} – ${fmt(end)}`
                : `${fmt(start)} → pick end`
              : "Pick a start date"}
        </span>
        <div className="cal-acts">
          <button type="button" className="cal-btn cal-cancel" onClick={onClose}>
            {single ? "Close" : "Cancel"}
          </button>
          {!single && (
            <button
              type="button"
              className="cal-btn cal-apply"
              disabled={!start || !end}
              onClick={() => start && end && onApply({ start, end })}
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
