import { prisma } from "@/lib/db";

/**
 * Login rate limiting, backed by the `LoginAttempt` table (no Redis in this
 * stack, and Prisma can't run on the edge — so the ledger lives in Postgres).
 *
 * We throttle on two keys at once:
 *   - email:<addr>  strict — stops one account being brute-forced.
 *   - ip:<addr>     looser — stops one source spraying many accounts, but high
 *                   enough that an office/NAT behind a single IP isn't locked
 *                   out collectively.
 *
 * A failed attempt records a row under both keys. Within the window, once a
 * key reaches its ceiling, further attempts are refused until the oldest row
 * for that key ages out — a natural sliding window, no scheduled unlock needed.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const EMAIL_MAX = 8;
const IP_MAX = 20;

/** Best-effort client IP from proxy headers (we sit behind bayna's Caddy). */
export function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip")?.trim() || null;
}

function targets(email: string, ip: string | null): { key: string; max: number }[] {
  const t = [{ key: `email:${email}`, max: EMAIL_MAX }];
  if (ip) t.push({ key: `ip:${ip}`, max: IP_MAX });
  return t;
}

/**
 * Returns `{ retryAfter }` (seconds) if the caller is currently rate-limited,
 * or null if the attempt may proceed. Call this before doing any password work.
 */
export async function checkLoginThrottle(
  email: string,
  ip: string | null,
): Promise<{ retryAfter: number } | null> {
  const now = Date.now();
  const since = new Date(now - WINDOW_MS);

  for (const { key, max } of targets(email, ip)) {
    const count = await prisma.loginAttempt.count({ where: { key, createdAt: { gte: since } } });
    if (count >= max) {
      const oldest = await prisma.loginAttempt.findFirst({
        where: { key, createdAt: { gte: since } },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      });
      const unlockAt = (oldest?.createdAt.getTime() ?? now) + WINDOW_MS;
      return { retryAfter: Math.max(1, Math.ceil((unlockAt - now) / 1000)) };
    }
  }
  return null;
}

/** Records one failed attempt under every key, and prunes anything expired. */
export async function recordLoginFailure(email: string, ip: string | null): Promise<void> {
  const data = targets(email, ip).map(({ key }) => ({ key }));
  await prisma.loginAttempt.createMany({ data });
  // Opportunistic cleanup keeps the table bounded without a cron job.
  await prisma.loginAttempt
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - WINDOW_MS) } } })
    .catch(() => {});
}

/** Clears the ledger for these keys after a successful login. */
export async function clearLoginFailures(email: string, ip: string | null): Promise<void> {
  const keys = targets(email, ip).map((t) => t.key);
  await prisma.loginAttempt.deleteMany({ where: { key: { in: keys } } }).catch(() => {});
}
