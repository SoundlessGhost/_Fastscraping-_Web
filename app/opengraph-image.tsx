import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Fastscraping — Web data at scale for e-commerce market intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/// The share card: Ultraviolet ground with the 96px grid, the Tile-F mark and
/// the hero line — the same look as the site hero and the LinkedIn banner.
export default async function Image() {
  const grid =
    "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)";
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#4B3FA3",
          backgroundImage: grid,
          backgroundSize: "96px 96px",
          padding: "64px 72px",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ position: "relative", width: 72, height: 60, display: "flex" }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 60, height: 60, borderRadius: 10, background: "#ECEAF8" }} />
            {[6, 16, 26, 37, 47].map((y) => (
              <div key={y} style={{ position: "absolute", left: 13, top: y, width: 7, height: 7, background: "#16131F" }} />
            ))}
            <div style={{ position: "absolute", left: 13, top: 7, width: 58, height: 6, background: "#4B3FA3" }} />
            <div style={{ position: "absolute", left: 13, top: 28, width: 44, height: 6, background: "#4B3FA3" }} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>fastscraping</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "stretch", gap: 18 }}>
            <div style={{ width: 10, background: "#D6CEFF", borderRadius: 3 }} />
            <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>Web data at scale.</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 34, color: "#E4DFFF", maxWidth: 980, lineHeight: 1.3 }}>
            <span>Scraping APIs and anti-bot infrastructure powering&nbsp;</span>
            <span style={{ color: "#FFFFFF", fontWeight: 700 }}>e-commerce market intelligence</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#D6CEFF" }}>
          <span>Shopee · 8 markets · GrabFood Indonesia · custom pipelines</span>
          <span style={{ color: "#FFFFFF", fontWeight: 700 }}>fastscraping.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
