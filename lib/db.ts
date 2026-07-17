import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 takes the connection through a driver adapter rather than a schema url.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let client: PrismaClient | undefined;

/// Built on first use, not on import — and then kept.
///
/// `next build` imports every route to collect its metadata, but never queries.
/// Constructing at import time made the build demand a live DATABASE_URL, which
/// a Docker build has no business needing. Deferring it means the image builds
/// without a database and connects when it actually serves.
function getClient(): PrismaClient {
  if (client) return client;

  // In dev the module is re-imported on every hot reload; reuse the instance
  // across them or the connection pool runs out.
  client = globalForPrisma.prisma;
  if (client) return client;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
