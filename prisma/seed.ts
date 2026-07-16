// Seeds the service catalog — the list the dashboard sidebar nests into
// category -> platform -> region -> endpoint.
//
// Only the Shopee usage backend is real; everything else is a placeholder left
// DISABLED ("coming soon") until we have its host:port. Nothing here is
// destructive: rows are upserted by slug, so editing a service from the admin
// panel survives a re-run, and a row removed from this file stays in the DB.
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }),
});

type Seed = {
  slug: string;
  name: string;
  category: string;
  platform: string;
  region?: string;
  endpoint?: string;
  baseUrl: string;
  kind?: string;
  usagePath?: string;
  authHeader?: string;
  status?: "ACTIVE" | "DISABLED";
  sortOrder?: number;
  notes?: string;
};

const PLACEHOLDER = "http://0.0.0.0:0";

const SERVICES: Seed[] = [
  // --- E-commerce / Shopee -------------------------------------------------
  // The one live backend: a single key covers every region, so it sits at
  // platform level with no region/endpoint.
  {
    slug: "shopee-usage",
    name: "Shopee usage",
    category: "ecommerce",
    platform: "shopee",
    baseUrl: process.env["SCRAPE_API_BASE"] ?? "http://86.48.2.59:8040",
    kind: "shopee-usage",
    status: "ACTIVE",
    sortOrder: 0,
    notes: "One key reports every Shopee market.",
  },
  { slug: "shopee-br-pdp", name: "PDP", category: "ecommerce", platform: "shopee", region: "br", endpoint: "pdp", baseUrl: PLACEHOLDER, status: "DISABLED", sortOrder: 10 },
  { slug: "shopee-br-get-pc", name: "get_pc", category: "ecommerce", platform: "shopee", region: "br", endpoint: "get_pc", baseUrl: PLACEHOLDER, status: "DISABLED", sortOrder: 11 },
  { slug: "shopee-br-cvc", name: "CVC", category: "ecommerce", platform: "shopee", region: "br", endpoint: "cvc", baseUrl: PLACEHOLDER, status: "DISABLED", sortOrder: 12 },
  { slug: "shopee-tw-pdp", name: "PDP", category: "ecommerce", platform: "shopee", region: "tw", endpoint: "pdp", baseUrl: PLACEHOLDER, status: "DISABLED", sortOrder: 20 },
  { slug: "shopee-tw-get-pc", name: "get_pc", category: "ecommerce", platform: "shopee", region: "tw", endpoint: "get_pc", baseUrl: PLACEHOLDER, status: "DISABLED", sortOrder: 21 },
  { slug: "shopee-th-get-pc", name: "get_pc", category: "ecommerce", platform: "shopee", region: "th", endpoint: "get_pc", baseUrl: PLACEHOLDER, status: "DISABLED", sortOrder: 30 },
  { slug: "shopee-id-get-pc", name: "get_pc", category: "ecommerce", platform: "shopee", region: "id", endpoint: "get_pc", baseUrl: PLACEHOLDER, status: "DISABLED", sortOrder: 40 },

  // --- E-commerce / Temu ---------------------------------------------------
  { slug: "temu-us-search", name: "Search", category: "ecommerce", platform: "temu", region: "us", endpoint: "search", baseUrl: PLACEHOLDER, status: "DISABLED", sortOrder: 50 },
  { slug: "temu-us-pdp", name: "PDP", category: "ecommerce", platform: "temu", region: "us", endpoint: "pdp", baseUrl: PLACEHOLDER, status: "DISABLED", sortOrder: 51 },
  { slug: "temu-de-search", name: "Search", category: "ecommerce", platform: "temu", region: "de", endpoint: "search", baseUrl: PLACEHOLDER, status: "DISABLED", sortOrder: 60 },

  // --- Real estate ---------------------------------------------------------
  { slug: "homegate-ch-listings", name: "Listings", category: "realestate", platform: "homegate", region: "ch", endpoint: "listings", baseUrl: PLACEHOLDER, status: "DISABLED", sortOrder: 70 },
  { slug: "immoscout-ch-listings", name: "Listings", category: "realestate", platform: "immoscout", region: "ch", endpoint: "listings", baseUrl: PLACEHOLDER, status: "DISABLED", sortOrder: 80 },
];

async function main() {
  for (const s of SERVICES) {
    const data = {
      name: s.name,
      category: s.category,
      platform: s.platform,
      region: s.region ?? null,
      endpoint: s.endpoint ?? null,
      baseUrl: s.baseUrl,
      kind: s.kind ?? "generic",
      usagePath: s.usagePath ?? "/me/usage",
      authHeader: s.authHeader ?? "X-API-Key",
      status: s.status ?? "DISABLED",
      sortOrder: s.sortOrder ?? 0,
      notes: s.notes ?? null,
    };
    await prisma.service.upsert({
      where: { slug: s.slug },
      create: { slug: s.slug, ...data },
      // Only fill in a service that has not been edited by hand yet: leave the
      // admin's baseUrl/status alone on re-run.
      update: { name: data.name, category: data.category, platform: data.platform, region: data.region, endpoint: data.endpoint, sortOrder: data.sortOrder },
    });
  }
  const total = await prisma.service.count();
  console.log(`seeded ${SERVICES.length} services (catalog now holds ${total})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
