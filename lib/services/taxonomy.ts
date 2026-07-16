// Display names for the sidebar tree, plus the grouping that turns a flat list
// of services into  category -> platform -> region -> endpoint.
//
// These are labels only. The real list of services lives in the database so a
// new backend can be added from the admin panel without touching code; anything
// missing here just falls back to a prettified slug.
import { regionName } from "@/lib/regions";

export const CATEGORIES: Record<string, { label: string; blurb: string }> = {
  ecommerce: { label: "E-commerce", blurb: "Marketplace product & pricing data" },
  realestate: { label: "Real estate", blurb: "Listing & property feeds" },
};

export const PLATFORMS: Record<string, { label: string }> = {
  shopee: { label: "Shopee" },
  temu: { label: "Temu" },
  homegate: { label: "Homegate" },
  immoscout: { label: "ImmoScout24" },
};

export const ENDPOINTS: Record<string, { label: string; blurb: string }> = {
  pdp: { label: "PDP", blurb: "Product detail pages" },
  get_pc: { label: "get_pc", blurb: "Product collection / listing" },
  cvc: { label: "CVC", blurb: "Category & variant crawl" },
  search: { label: "Search", blurb: "Keyword search results" },
  listings: { label: "Listings", blurb: "Property listings" },
};

const pretty = (slug: string) =>
  slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const categoryLabel = (slug: string) => CATEGORIES[slug]?.label ?? pretty(slug);
export const categoryBlurb = (slug: string) => CATEGORIES[slug]?.blurb ?? "";
export const platformLabel = (slug: string) => PLATFORMS[slug]?.label ?? pretty(slug);
export const endpointLabel = (slug: string) => ENDPOINTS[slug]?.label ?? pretty(slug);
export const endpointBlurb = (slug: string) => ENDPOINTS[slug]?.blurb ?? "";

/// One service as the browser sees it. Never carries baseUrl or the key.
export type ServiceNode = {
  slug: string;
  name: string;
  category: string;
  platform: string;
  region: string | null;
  endpoint: string | null;
  kind: string;
  /// DISABLED = in the catalog but not wired to a backend yet ("coming soon").
  status: "ACTIVE" | "DISABLED";
  /// null when this client has not connected a key for it yet.
  connection: { verifiedAt: string | null; lastError: string | null; keyMask: string } | null;
};

export type RegionGroup = { region: string | null; label: string; services: ServiceNode[] };
export type PlatformGroup = { platform: string; label: string; regions: RegionGroup[]; count: number; connected: number };
export type CategoryGroup = { category: string; label: string; blurb: string; platforms: PlatformGroup[]; count: number; connected: number };

/// Flat rows -> nested tree, preserving the order the rows arrive in (the API
/// sorts by sortOrder, then name).
export function buildTree(services: ServiceNode[]): CategoryGroup[] {
  const cats = new Map<string, CategoryGroup>();

  for (const s of services) {
    let cat = cats.get(s.category);
    if (!cat) {
      cat = {
        category: s.category,
        label: categoryLabel(s.category),
        blurb: categoryBlurb(s.category),
        platforms: [],
        count: 0,
        connected: 0,
      };
      cats.set(s.category, cat);
    }

    let plat = cat.platforms.find((p) => p.platform === s.platform);
    if (!plat) {
      plat = { platform: s.platform, label: platformLabel(s.platform), regions: [], count: 0, connected: 0 };
      cat.platforms.push(plat);
    }

    let reg = plat.regions.find((r) => r.region === s.region);
    if (!reg) {
      reg = { region: s.region, label: s.region ? regionName(s.region) : "All regions", services: [] };
      plat.regions.push(reg);
    }

    reg.services.push(s);
    cat.count++;
    plat.count++;
    if (s.connection) {
      cat.connected++;
      plat.connected++;
    }
  }

  return [...cats.values()];
}
