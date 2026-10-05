/// The platforms the marketing site lists, in one place so Home and /apis never
/// disagree. Names identify data sources only — no affiliation is implied, and
/// client names never appear here.
///
/// status:
///   live     — self-serve API running in production today
///   pipeline — running in production as a managed feed (scheduled delivery)
///   request  — available on request; we scope and build it per client

export type PlatformStatus = "live" | "pipeline" | "request";

export type Platform = {
  name: string;
  status: PlatformStatus;
  detail: string;
  /// Individual sites covered by this card, shown as small chips.
  sites?: string[];
  /// Shown on the home grid (the rest appear on /apis only).
  home?: boolean;
  /// Public docs page; /apis links the card title and adds "Read the docs".
  href?: string;
};

export const SHOPEE = {
  name: "Shopee Product Data API",
  markets: ["Thailand", "Indonesia", "Malaysia", "Philippines", "Vietnam", "Singapore", "Taiwan", "Brazil"],
  detail:
    "Full product page per request across TH · ID · MY · PH · VN · SG · TW · BR. Price and stock per variant, vouchers, sold count, ratings, shop data.",
};

export const PLATFORMS: Platform[] = [
  {
    name: "Shopee Item Sold API (Vietnam)",
    status: "live",
    detail:
      "Exact lifetime sold per listing, Shopee's merged sold figure, 30-day sold, price and stock. Jobs of 300 to 1,000 items, $3 per 1,000 items returned.",
    href: "/docs/shopee-get-list",
  },
  {
    name: "Shopee listings (Brazil)",
    status: "live",
    detail: "Category, search, brand and shop result pages with sold counts, page by page.",
    home: true,
    href: "/docs/shopee-cbc",
  },
  {
    name: "Temu",
    status: "live",
    detail: "Product detail and goods-list data for Brazil and Mexico.",
    home: true,
  },
  {
    name: "Naver Shopping (Korea)",
    status: "live",
    detail: "Brand-store benefits, coupons, product and search results from Naver Shopping, collected over Korean mobile networks.",
    home: true,
  },
  {
    name: "US restaurant menus",
    status: "pipeline",
    detail:
      "Store-level menus and prices for major quick-service chains and a leading delivery marketplace. 16,000+ stores, 55M records a week.",
    sites: ["McDonald's", "Starbucks", "Subway", "Dutch Bros"],
    home: true,
  },
  {
    name: "Ticketing marketplaces",
    status: "pipeline",
    detail: "Event, section, row, quantity, list and checkout price. 215k+ events and 24M+ listings a day, delivered daily.",
    home: true,
  },
  {
    name: "Swiss real estate",
    status: "live",
    detail: "Dedicated REST APIs for live listings, prices and land-registry data, with per-request pricing.",
    sites: ["ImmoScout24", "Homegate", "Newhome", "Urbanhome", "Flatfox", "tutti.ch", "ge.ch"],
    home: true,
  },
  {
    name: "Job boards",
    status: "pipeline",
    detail: "1.39M postings a week across 5 countries, weekly delivery.",
    sites: ["Indeed"],
  },
  {
    name: "GrabFood (Southeast Asia)",
    status: "request",
    detail: "Restaurants by area, full menus with item prices, promos and delivery fees. Scoped per market on request.",
  },
  {
    name: "Professional profiles & companies",
    status: "request",
    detail: "Enterprise-scale profile and company data for B2B intelligence.",
  },
  {
    name: "Airline fares",
    status: "request",
    detail: "Fare monitoring across major US and European carriers with sub-30-minute freshness.",
  },
];

/// Popular e-commerce and marketplace sites we build on request, by region.
/// Listed quietly (chips), not as headline cards.
export const ON_REQUEST_GROUPS: { region: string; sites: string[] }[] = [
  { region: "US & global", sites: ["Amazon", "Walmart", "eBay", "Target", "Best Buy", "Costco", "Home Depot", "Etsy", "Wayfair", "Shein", "AliExpress", "Alibaba"] },
  { region: "Southeast Asia", sites: ["Lazada", "TikTok Shop", "Tokopedia", "Blibli", "Bukalapak", "Tiki", "Zalora"] },
  { region: "East Asia", sites: ["Coupang", "Gmarket", "11st", "Rakuten", "Mercari", "Taobao", "JD.com", "momo", "PChome"] },
  { region: "Latin America", sites: ["Mercado Libre", "Magalu", "Americanas", "Casas Bahia", "Falabella"] },
  { region: "Europe, Middle East & India", sites: ["Zalando", "Otto", "Allegro", "Bol.com", "Noon", "Flipkart", "Myntra"] },
  { region: "Travel & local", sites: ["Booking.com", "Airbnb", "Google Maps", "Tripadvisor"] },
];

/// Short list for one-line mentions (home page).
export const ON_REQUEST_SITES = ["Amazon", "Walmart", "eBay", "Lazada", "TikTok Shop", "Tokopedia", "Coupang", "Mercado Libre", "Zalando", "Flipkart"];

export const STATUS_LABEL: Record<PlatformStatus, string> = {
  live: "LIVE",
  pipeline: "PIPELINE",
  request: "ON REQUEST",
};
