"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import KMAvatar from "@/components/KMAvatar";

// The homepage hero: a centered editorial block, then two full-bleed bands —
// the stats strip and the live extraction feed.
//
// A client component because the feed rotates one cell at a time. Everything it
// shows is decorative: no fetch, no backend, so it renders the same whether or
// not anything is reachable.

type Event = {
  site: string;
  badge: string;
  tint: string;
  note: string;
  status: string;
  ok: boolean;
  /// Only used before hydration — see `times` below.
  seed: string;
};

const EVENTS: Event[] = [
  { seed: "12:18:44", site: "Amazon", badge: "Az", tint: "#FF9E2C", note: "Akamai bypass", status: "200 OK", ok: true },
  { seed: "12:18:42", site: "Indeed", badge: "In", tint: "#5A8DEE", note: "Cloudflare passed", status: "200 OK", ok: true },
  { seed: "12:18:41", site: "Starbucks", badge: "Sb", tint: "#3ECF8E", note: "Proxy rotated", status: "ROTATED", ok: false },
  { seed: "12:18:39", site: "StubHub", badge: "Sh", tint: "#B47CF0", note: "Page 47 / 250", status: "200 OK", ok: true },
  { seed: "12:18:38", site: "ImmoScout24", badge: "Im", tint: "#FF6B6B", note: "DataDome OK", status: "200 OK", ok: true },
  { seed: "12:18:36", site: "Glassdoor", badge: "Gd", tint: "#3ECF8E", note: "Captcha bypass", status: "200 OK", ok: true },
  { seed: "12:18:36", site: "SeatGeek", badge: "Sg", tint: "#FF7A45", note: "TLS handshake", status: "200 OK", ok: true },
  { seed: "12:18:35", site: "Zillow", badge: "Zl", tint: "#5A8DEE", note: "Session warmed", status: "200 OK", ok: true },
  { seed: "12:18:33", site: "Booking.com", badge: "Bk", tint: "#2C7BE5", note: "Geo-routed DE", status: "200 OK", ok: true },
  { seed: "12:18:32", site: "Yelp", badge: "Yp", tint: "#FF6B6B", note: "PerimeterX OK", status: "200 OK", ok: true },
  { seed: "12:18:30", site: "Idealista", badge: "Id", tint: "#3ECF8E", note: "Page 12 / 88", status: "200 OK", ok: true },
  { seed: "12:18:29", site: "Walmart", badge: "Wm", tint: "#5A8DEE", note: "Fingerprint set", status: "200 OK", ok: true },
  { seed: "12:18:27", site: "Expedia", badge: "Ex", tint: "#FFC93C", note: "Login wall passed", status: "200 OK", ok: true },
  { seed: "12:18:26", site: "Target", badge: "Tg", tint: "#FF6B6B", note: "Akamai bypass", status: "200 OK", ok: true },
  { seed: "12:18:24", site: "Carrefour", badge: "Cf", tint: "#2C7BE5", note: "Proxy rotated", status: "ROTATED", ok: false },
  { seed: "12:18:23", site: "Rightmove", badge: "Rm", tint: "#3ECF8E", note: "DataDome OK", status: "200 OK", ok: true },
];

const CELLS = 8;
/// Deliberately slow. Anything under ~2s and the band starts competing with the
/// headline for attention, which is the whole reason this replaced a marquee.
const ROTATE_MS = 2600;

const CHIPS = ["Bypass Cloudflare & Captchas", "Large-scale on demand", "No proxy hassles"];

const pad = (n: number) => String(n).padStart(2, "0");
const stamp = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export default function Hero() {
  // Which event sits in each of the eight slots, and how many times that slot
  // has been replaced. The version is half of the React key: without it React
  // patches the existing node instead of remounting it, and the entry animation
  // never plays again after the first render.
  const [slots, setSlots] = useState(() => Array.from({ length: CELLS }, (_, i) => i));
  const [vers, setVers] = useState(() => Array(CELLS).fill(0) as number[]);

  // Null until mounted, so the server and the first client render agree — the
  // canned `seed` strings stand in. Real clock takes over on mount, because a
  // counter that wraps at 60 produces timestamps that go backwards inside a
  // feed that claims to be chronological.
  const [times, setTimes] = useState<number[] | null>(null);
  const next = useRef(CELLS); // next event to pull in
  const cursor = useRef(0); // which slot gets replaced, round-robin

  useEffect(() => {
    const now = Date.now();
    setTimes(Array.from({ length: CELLS }, (_, i) => now - i * 1700));

    // Someone who asked for less motion gets the grid, static and complete.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (still.matches) return;

    const id = window.setInterval(() => {
      const i = cursor.current % CELLS;
      const pick = next.current % EVENTS.length;
      cursor.current += 1;
      next.current += 1;
      setSlots((s) => s.map((v, n) => (n === i ? pick : v)));
      setVers((v) => v.map((n, x) => (x === i ? n + 1 : n)));
      setTimes((t) => (t ? t.map((v, n) => (n === i ? Date.now() : v)) : t));
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  const cells = useMemo(
    () =>
      slots.map((idx, i) => {
        const e = EVENTS[idx]!;
        return { ...e, key: `${i}-${vers[i]}`, time: times ? stamp(times[i]!) : e.seed };
      }),
    [slots, vers, times],
  );

  return (
    <>
      <section className="hero" data-screen-label="01 Hero">
        <div className="container">
          <div className="hero-rule">
            <div className="hero-rule-l">
              <span className="hero-vchip">v8 · 2026</span>
              <span>Enterprise-grade data extraction</span>
            </div>
            <div className="hero-rule-r">
              <span className="hero-dot" aria-hidden="true" />
              42 pipelines running right now
            </div>
          </div>

          <h1 className="hero-title">
            We handle your <em>web scraping</em> pipeline.
          </h1>

          <p className="hero-lede">
            Structured data delivered <strong>reliably, at any scale</strong> — bypassing Cloudflare,
            DataDome and login walls. No proxy headaches. No infrastructure overhead. No babysitting.
          </p>

          <div className="hero-chips">
            {CHIPS.map((c) => (
              <span className="hero-chip" key={c}>
                <i aria-hidden="true">✓</i>
                {c}
              </span>
            ))}
          </div>

          <div className="hero-cta">
            <Link href="#contact" className="hero-btn hero-btn--solid">
              Free strategy call <span aria-hidden="true">→</span>
            </Link>
            <Link href="#solutions" className="hero-btn hero-btn--ghost">
              View solutions
            </Link>
          </div>

          <div className="hero-founder">
            <KMAvatar variant="large" />
            <div>
              <div className="hero-founder-n">Khalid Mahmud Shawon</div>
              <div className="hero-founder-r">Founder · Replies in &lt; 24h</div>
            </div>
          </div>
        </div>
      </section>

      {/* Full bleed: both bands run edge to edge, their contents back inside the container. */}
      <div className="hero-stats">
        <div className="container hero-stats-in">
          <div className="hero-stat">
            <b>24,357,327</b>
            <span>Records today</span>
          </div>
          <div className="hero-stat">
            <b className="is-accent">99.7%</b>
            <span>Bypass success</span>
          </div>
          <div className="hero-stat">
            <b>42</b>
            <span>Active pipelines</span>
          </div>
        </div>
      </div>

      <div className="hero-feed">
        <div className="container hero-feed-in">
          <div className="feed-head">
            <div className="feed-live">
              <span className="feed-dot" aria-hidden="true" />
              Live extraction feed
            </div>
            <div>Showing 8 of 42 pipelines</div>
          </div>

          <div className="feed-grid">
            {cells.map((c) => (
              <div className="feed-cell" key={c.key}>
                <div className="feed-cell-top">
                  <span className="feed-site">
                    <i style={{ background: c.tint }}>{c.badge}</i>
                    <b>{c.site}</b>
                  </span>
                  <span className={`feed-status${c.ok ? "" : " is-warn"}`}>
                    <i aria-hidden="true" />
                    {c.status}
                  </span>
                </div>
                <div className="feed-cell-sub">
                  <span>{c.time}</span>
                  <span aria-hidden="true">·</span>
                  <span className="feed-note">{c.note}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="feed-foot">
            <div>
              <span className="is-live">→ Bypassing</span>
              <span>Cloudflare · DataDome · PerimeterX · Akamai</span>
            </div>
            <div>
              <span>Delivered to</span>
              <span className="is-bright">SFTP · S3 · API · Webhook</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
