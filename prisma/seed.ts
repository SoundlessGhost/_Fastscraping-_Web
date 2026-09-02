// Seeds the service catalog — the list the dashboard sidebar nests into
// category -> platform -> region -> endpoint.
//
// Only Shopee Brazil PDP is wired to a real backend; everything else is a
// placeholder left DISABLED ("coming soon") until we have its host:port.
// Rows are upserted by slug and the update only touches labels, so a service
// an admin has edited (base URL, status, adapter) survives a re-run.
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

/// The brands listed under "Active pipelines for" on the homepage, mapped onto
/// the dashboard's categories. Marketing copy and the catalogue should not
/// disagree about what we run, so this list mirrors app/page.tsx.
///
/// Real estate is listed last on purpose — the sidebar follows sortOrder, and
/// these are the least-used of the lot.
const MARQUEE = [
  { slug: "stubhub", name: "StubHub", category: "ticketing" },
  { slug: "seatgeek", name: "SeatGeek", category: "ticketing" },
  { slug: "indeed", name: "Indeed", category: "jobs" },
  { slug: "glassdoor", name: "Glassdoor", category: "jobs" },
  { slug: "linkedin", name: "LinkedIn", category: "b2b" },
  { slug: "starbucks", name: "Starbucks", category: "restaurant" },
  { slug: "mcdonalds", name: "McDonald's", category: "restaurant" },
  { slug: "doordash", name: "DoorDash", category: "delivery" },
  { slug: "amazon", name: "Amazon", category: "ecommerce" },
  { slug: "walmart", name: "Walmart", category: "ecommerce" },

  // Real estate sits last in the sidebar, so it comes last here — the tree is
  // built in the order rows arrive, which the API sorts by sortOrder.
  { slug: "immoscout24", name: "ImmoScout24", category: "realestate" },
  { slug: "urbanhome", name: "Urbanhome", category: "realestate" },
  { slug: "newhome", name: "Newhome", category: "realestate" },
  { slug: "flatfox", name: "Flatfox", category: "realestate" },
  { slug: "tutti", name: "Tutti", category: "realestate" },
];

const SERVICES: Seed[] = [
  // --- E-commerce / Shopee -------------------------------------------------
  // Neither entry carries a region: the twbr orchestrator serves TW+BR and the
  // compose backend serves all eight markets, so both sit under "All regions"
  // and the per-market split comes from /me/usage instead of the sidebar.
  // Order is deliberate — web first, compose second.
  // PDP is the one that exists: shop_id + item_id in, full product data out.
  //
  // Port 8888 is deliberate and correct, despite its unit being named
  // `shopee-api-simple-test` and its database `shopee_pdp_test`. Those names
  // are wrong: 8888 holds 4.3 GB and drains its queue, while the plainly-named
  // 9999 holds 55 MB with ~1600 jobs stuck pending. Check pg_database_size and
  // /health before ever "correcting" this back.
  { slug: "shopee-pdp-web-get-pc", name: "PDP ( web get_pc )", category: "ecommerce", platform: "shopee", endpoint: "pdp", baseUrl: "http://212.90.121.151:8888", kind: "shopee-usage", status: "ACTIVE", sortOrder: 10 },

  // The multi-region compose backend: one host serving all eight Shopee markets
  // (br tw id my th ph vn sg) off shared devices, so it carries no single
  // region — `region: null` makes the sidebar file it under "All regions" and
  // the split comes from /me/usage's region-keyed buckets instead.
  //
  // Its /me/usage was built to our spec (getpc-me-usage-spec.md, Aug 2026), so
  // the existing `shopee-usage` adapter reads it unchanged. Separate from
  // the web orchestrator on purpose: that one stays exactly as it is.
  { slug: "shopee-pdp-compose-get-pc", name: "PDP ( compose get_pc )", category: "ecommerce", platform: "shopee", endpoint: "pdp", baseUrl: "http://169.58.203.69:7007", kind: "shopee-usage", status: "ACTIVE", sortOrder: 20 },


  // --- E-commerce / Temu ---------------------------------------------------
  // One entry, no region and no endpoint: DashShell renders a brand like this as
  // a single flat link instead of a "Temu > United States > Search" tree, which
  // is what it should have been all along.
  { slug: "temu-pdp", name: "PDP (good_id)", category: "ecommerce", platform: "temu", baseUrl: "http://86.48.2.59:5566", kind: "temu-usage", status: "ACTIVE", sortOrder: 50 },

  // --- Real estate / Homegate (live) ---------------------------------------
  // Homegate v2 on 86.48.2.59:8900. Its /me/usage is flatter than Shopee's
  // (no region, no job-health), so it gets its own adapter. Listed last-ish so
  // real estate stays at the bottom of the sidebar.
  { slug: "homegate", name: "Homegate", category: "realestate", platform: "homegate", baseUrl: "http://86.48.2.59:8900", kind: "homegate-usage", status: "ACTIVE", sortOrder: 109 },

  // --- The brands the homepage marquee advertises --------------------------
  // Name only: no region, no endpoint. These are here so the dashboard shows
  // the same catalogue the site sells, and each one says plainly that it isn't
  // live yet — the marquee already implies we run them, and a client who signs
  // up shouldn't find the cupboard bare.
  //
  // Kept in step with the "Active pipelines for" list in app/page.tsx.
  ...MARQUEE.map((m, i) => ({
    slug: m.slug,
    name: m.name,
    category: m.category,
    platform: m.slug,
    baseUrl: PLACEHOLDER,
    status: "DISABLED" as const,
    sortOrder: 100 + i,
  })),
];

/// Slugs that changed after rows already existed. A slug is the URL a client
/// bookmarks, so renaming has to happen **in place**: an upsert on the new slug
/// would leave the old row behind (prune only touches placeholder URLs) and the
/// client's key, which points at the row id, would stay attached to the orphan.
const RENAMED: Record<string, string> = {
  "shopee-br-pdp": "shopee-pdp-web-get-pc",
  "shopee-multi-pdp": "shopee-pdp-compose-get-pc",
};

async function main() {
  for (const [from, to] of Object.entries(RENAMED)) {
    const old = await prisma.service.findUnique({ where: { slug: from } });
    if (!old) continue;
    // If both exist someone already created the new one by hand — leave it be
    // rather than guessing which row the keys belong to.
    if (await prisma.service.findUnique({ where: { slug: to } })) {
      console.log(`skip rename ${from}: ${to} already exists`);
      continue;
    }
    await prisma.service.update({ where: { id: old.id }, data: { slug: to } });
    console.log(`renamed ${from} -> ${to}`);
  }

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
