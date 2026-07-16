// Region code -> display name + chart color.
// Shopee markets first (these carry the chart palette), then everything else we
// run services in. Unknown codes still render — see the fallbacks below.
export const REGIONS: Record<string, { name: string; color: string }> = {
  id: { name: "Indonesia", color: "#0e5d44" },
  my: { name: "Malaysia", color: "#1d9e75" },
  th: { name: "Thailand", color: "#ba7517" },
  sg: { name: "Singapore", color: "#378add" },
  ph: { name: "Philippines", color: "#7e2e8a" },
  vn: { name: "Vietnam", color: "#d4537e" },
  tw: { name: "Taiwan", color: "#0f6e56" },
  br: { name: "Brazil", color: "#d85a30" },
  mx: { name: "Mexico", color: "#c79b3a" },
  ar: { name: "Argentina", color: "#4a8fbf" },
  cl: { name: "Chile", color: "#8a6b3d" },
  co: { name: "Colombia", color: "#b03a5b" },
  us: { name: "United States", color: "#2f6f9f" },
  ch: { name: "Switzerland", color: "#b8342c" },
  de: { name: "Germany", color: "#5a5a52" },
  fr: { name: "France", color: "#3b5ea8" },
  gb: { name: "United Kingdom", color: "#6b4a8a" },
};

// Stable display order for region lists / chart stacks.
export const REGION_ORDER = Object.keys(REGIONS);

export const regionName = (code: string) => REGIONS[code]?.name ?? code.toUpperCase();
export const regionColor = (code: string) => REGIONS[code]?.color ?? "#888780";
