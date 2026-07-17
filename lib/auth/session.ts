import { getIronSession, type SessionOptions } from "iron-session";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * The cookie carries only a session id; the session itself lives in Postgres so
 * an admin can revoke it. Cookie is encrypted + httpOnly.
 */
export interface AppSession {
  sessionId?: string;
}

export const SESSION_COOKIE = "fs_session";

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "",
  cookieName: SESSION_COOKIE,
  ttl: 0, // stay logged in until logout or revoke
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  },
};

export async function getSessionCookie() {
  return getIronSession<AppSession>(await cookies(), sessionOptions);
}

export async function createSession(userId: string) {
  const h = await headers();
  const row = await prisma.session.create({
    data: {
      userId,
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
      ip:
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        h.get("x-real-ip") ??
        null,
    },
  });
  const cookie = await getSessionCookie();
  cookie.sessionId = row.id;
  await cookie.save();
  return row;
}

export async function destroySession() {
  const cookie = await getSessionCookie();
  if (cookie.sessionId) {
    await prisma.session
      .update({
        where: { id: cookie.sessionId },
        data: { revokedAt: new Date() },
      })
      .catch(() => {});
  }
  cookie.destroy();
}

export type SessionUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  role: "ADMIN" | "CLIENT";
  /// Timestamp of the last avatar upload, or null when they use the default.
  /// Doubles as the cache-buster in the image URL.
  avatarVersion: number | null;
};

/// Whatever we can show as a person's name, or null when they set neither.
export function displayName(u: { firstName: string | null; lastName: string | null }): string | null {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || null;
}

/** Resolves the cookie -> live DB session -> active user. Null if anything fails. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookie = await getSessionCookie();
  if (!cookie.sessionId) return null;

  const row = await prisma.session.findUnique({
    where: { id: cookie.sessionId },
    include: { user: true },
  });

  if (!row || row.revokedAt || row.user.status !== "ACTIVE") return null;

  // best-effort activity stamp
  prisma.session
    .update({ where: { id: row.id }, data: { lastSeenAt: new Date() } })
    .catch(() => {});

  return {
    id: row.user.id,
    email: row.user.email,
    firstName: row.user.firstName,
    lastName: row.user.lastName,
    company: row.user.company,
    role: row.user.role,
    avatarVersion: row.user.avatarUpdatedAt?.getTime() ?? null,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
