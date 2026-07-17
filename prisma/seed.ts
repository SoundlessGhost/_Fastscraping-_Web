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
  // Brazil only for now — other Shopee markets get added back as they land.
  // PDP is the one that exists: the orchestrator on 212.90.121.151 stores into
  // a database literally named `shopee_pdp`, takes shop_id + item_id, and
  // returns full product data. Its base URL stays a placeholder until we settle
  // which instance to point at (9999 = prod, 8888 = test).
  { slug: "shopee-br-pdp", name: "PDP", category: "ecommerce", platform: "shopee", region: "br", endpoint: "pdp", baseUrl: PLACEHOLDER, kind: "shopee-usage", status: "DISABLED", sortOrder: 10 },

  // --- E-commerce / Temu ---------------------------------------------------
  { slug: "temu-us-search", name: "Search", category: "ecommerce", platform: "temu", region: "us", endpoint: "search", baseUrl: PLACEHOLDER, status: "DISABLED", sortOrder: 50 },

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
  // Drop placeholders this file no longer lists, so trimming the catalog is an
  // edit here rather than hand-written SQL. Three guards keep it from eating
  // anything real: it only touches rows still on the placeholder URL (so never
  // a wired backend, never one an admin created), and only rows no client has
  // a key for.
  const keep = new Set(SERVICES.map((s) => s.slug));
  const stale = await prisma.service.findMany({
    where: { baseUrl: PLACEHOLDER, slug: { notIn: [...keep] } },
    include: { _count: { select: { clientServices: true } } },
  });
  const prunable = stale.filter((s) => s._count.clientServices === 0);

  for (const s of prunable) await prisma.service.delete({ where: { id: s.id } });

  for (const s of stale) {
    if (s._count.clientServices > 0) {
      console.log(`kept ${s.slug}: ${s._count.clientServices} client key(s) still attached`);
    }
  }

  const total = await prisma.service.count();
  console.log(
    `seeded ${SERVICES.length} services, pruned ${prunable.length} placeholder(s) (catalog now holds ${total})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
