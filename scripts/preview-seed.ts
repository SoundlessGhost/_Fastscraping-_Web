// LOCAL PREVIEW ONLY: seeds a throwaway database with one verified test client,
// one connected key and two invoices, so the logged-in pages can be checked.
// Never run against production. Usage:
//   DATABASE_URL=... ENCRYPTION_KEY=... PREVIEW_PASSWORD=... npx tsx scripts/preview-seed.ts
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { encryptSecret } from "../lib/crypto";

const url = process.env["DATABASE_URL"] ?? "";
if (!/127\.0\.0\.1:5999\/preview/.test(url)) throw new Error("preview-seed only runs against the local preview DB");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  const email = "preview-client@example.test";
  const pass = process.env["PREVIEW_PASSWORD"];
  if (!pass) throw new Error("PREVIEW_PASSWORD missing");
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: await bcrypt.hash(pass, 10), emailVerifiedAt: new Date() },
    create: { email, firstName: "Preview", lastName: "Client", company: "Test Co", passwordHash: await bcrypt.hash(pass, 10), emailVerifiedAt: new Date() },
  });
  const svc = await prisma.service.findFirst({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } });
  if (svc) {
    await prisma.service.update({ where: { id: svc.id }, data: { baseUrl: "http://127.0.0.1:9" } });
    const has = await prisma.clientService.findFirst({ where: { userId: user.id, serviceId: svc.id } });
    if (!has)
      await prisma.clientService.create({
        data: { userId: user.id, serviceId: svc.id, apiKeyEnc: encryptSecret("test_key_0123456789abcdef"), label: "Main", verifiedAt: new Date() },
      });
  }
  for (const [n, status, url2] of [
    ["INV-PREV01", "UNPAID", "https://example.test/pay"],
    ["INV-PREV00", "PAID", null],
  ] as const) {
    await prisma.invoice.upsert({
      where: { number: n },
      update: {},
      create: {
        number: n,
        token: `tok${n}`,
        clientName: "Test Co",
        clientEmail: "Preview-Client@example.test",
        items: [{ description: "Shopee API credits (100k requests)", quantity: 1, unitPrice: 450 }],
        status,
        paymentUrl: url2,
        dueDate: new Date(Date.now() + 7 * 864e5),
      },
    });
  }
  console.log("seeded", user.email, svc?.slug);
}
main().finally(() => prisma.$disconnect());
