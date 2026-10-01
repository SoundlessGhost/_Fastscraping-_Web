"use client";

import { useEffect, useRef, useState } from "react";

/* Live competitor price index for the Pricing Intelligence page. All data is
   demo data (wired to the real API in production). The initial grid is seeded
   deterministically so the server and first client render match; after mount a
   random competitor price moves every 2.6s, the row flashes, and undercut
   alerts tick up. */

const SKUS = [
  { name: "Sony WH-1000XM5", cat: "Headphones · 12 sellers", you: 318, base: 349, spread: 40 },
  { name: "Dyson V15 Detect", cat: "Home · 9 sellers", you: 649, base: 689, spread: 70 },
  { name: "Nike Pegasus 41", cat: "Footwear · 11 sellers", you: 134, base: 139, spread: 22 },
  { name: 'iPad Air 11" M2', cat: "Tablets · 12 sellers", you: 579, base: 589, spread: 50 },
  { name: "Ninja AF101 Air Fryer", cat: "Kitchen · 10 sellers", you: 99, base: 92, spread: 18 },
];
const SELLERS = ["Amazon", "Walmart", "Best Buy", "Target", "eBay", "Costco", "Newegg", "B&H", "Kohl's", "Macy's", "Zalando", "Argos"];

const fmt = (v: number) => "$" + Math.round(v);

// Seeded init so SSR === first client render (no hydration mismatch).
function seededGrid(): number[][] {
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  return SKUS.map((s) => SELLERS.map(() => Math.round(s.base + (rnd() - 0.5) * s.spread)));
}

const START_EVENT = "Latest scan · 12 min ago · 2.4M SKUs reindexed";

export default function LivePriceIndex() {
  const [comp, setComp] = useState<number[][]>(seededGrid);
  const [flash, setFlash] = useState(-1);
  const [alerts, setAlerts] = useState(147);
  const [event, setEvent] = useState(START_EVENT);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      const i = Math.floor(Math.random() * SKUS.length);
      const j = Math.floor(Math.random() * SELLERS.length);
      const sku = SKUS[i];
      setComp((prev) => {
        const old = prev[i][j];
        let nv = Math.round(old + (Math.random() < 0.55 ? -1 : 1) * (2 + Math.random() * sku.spread * 0.25));
        nv = Math.max(Math.round(sku.base - sku.spread * 0.75), Math.min(Math.round(sku.base + sku.spread * 0.75), nv));
        const undercut = nv < sku.you && old >= sku.you;
        setEvent(
          `${SELLERS[j]} ${nv < old ? "cut" : "raised"} ${sku.name} ${fmt(old)} → ${fmt(nv)}${undercut ? " · undercut alert sent" : ""}`,
        );
        if (undercut) setAlerts((a) => a + 1);
        return prev.map((r, k) => (k === i ? r.map((v, m) => (m === j ? nv : v)) : r));
      });
      setFlash(i);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(-1), 1100);
    }, 2600);
    return () => {
      clearInterval(id);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const rows = SKUS.map((sku, i) => {
    const c = comp[i];
    const min = Math.min(...c);
    const max = Math.max(...c);
    const sorted = [...c].sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)];
    const lo = Math.min(min, sku.you);
    const hi = Math.max(max, sku.you);
    const span = Math.max(1, hi - lo);
    const pct = (v: number) => (((v - lo) / span) * 100).toFixed(1) + "%";
    const d = sku.you - min;
    let status = "Competitive";
    let color = "var(--pi-ink)";
    if (sku.you <= min) {
      status = "Lowest price";
      color = "var(--pi-green)";
    } else if (sku.you > med) {
      status = "Over market";
      color = "var(--pi-over)";
    }
    return {
      name: sku.name,
      cat: sku.cat,
      min: fmt(min),
      max: fmt(max),
      you: fmt(sku.you),
      delta: d <= 0 ? "−$" + Math.round(-d) : "+$" + Math.round(d),
      youPct: pct(sku.you),
      medPct: pct(med),
      status,
      color,
      flash: flash === i,
    };
  });

  return (
    <div className="pi-index">
      <div className="pi-index-head">
        <div className="pi-index-title">
          <b>Price index</b>
          <span>5 SKUs · 12 competitors</span>
        </div>
        <div className="pi-index-live">
          <span className="dot" />
          Monitoring
        </div>
      </div>
      <div className="pi-index-scroll">
        <div className="pi-index-inner">
          <div className="pi-index-cols">
            <span>Product</span>
            <span>Market range · min → max</span>
            <span className="r">You vs lowest</span>
          </div>
          {rows.map((r) => (
            <div
              className="pi-row"
              key={r.name}
              style={{ background: r.flash ? "#eef4ef" : "var(--card)" }}
            >
              <div>
                <div className="pi-row-name">{r.name}</div>
                <div className="pi-row-cat">{r.cat}</div>
              </div>
              <div className="pi-bar-wrap">
                <span className="pi-bar-min">{r.min}</span>
                <div className="pi-bar">
                  <div className="pi-bar-track" />
                  <span className="pi-bar-med" style={{ left: r.medPct }} />
                  <span
                    className="pi-bar-you"
                    style={{ left: r.youPct, background: r.color, boxShadow: `0 0 0 1px ${r.color}` }}
                  />
                </div>
                <span className="pi-bar-max">{r.max}</span>
              </div>
              <div className="pi-row-right">
                <div className="pi-row-status" style={{ color: r.color }}>
                  {r.status}
                </div>
                <div className="pi-row-you">
                  {r.you} · {r.delta}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="pi-index-foot">
        <span>{event}</span>
        <span>
          <b>{alerts}</b> undercut alerts today
        </span>
      </div>
    </div>
  );
}
