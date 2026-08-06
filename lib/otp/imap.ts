import { ImapFlow } from "imapflow";
import { prisma } from "@/lib/db";

// Reads the central mailbox over IMAP, extracts Temu verification codes and
// stores them in Postgres (de-duped by Message-ID). Credentials come from the
// server env only — never from code or the browser. See the handoff spec.

const cfg = {
  host: process.env.TEMU_IMAP_HOST ?? "",
  port: Number(process.env.TEMU_IMAP_PORT ?? 993),
  user: process.env.TEMU_IMAP_USER ?? "",
  pass: process.env.TEMU_IMAP_PASS ?? "",
};

/// True once the central-inbox IMAP env vars are set. The dashboard shows a
/// "not configured" note instead of erroring when they aren't.
export function otpConfigured(): boolean {
  return Boolean(cfg.host && cfg.user && cfg.pass);
}

/// A fresh IMAP client from the central-inbox env. Shared by the throttled
/// ingest and the persistent IDLE worker.
export function newImapClient(): ImapFlow {
  return new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: true,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
  });
}

/// How far back to look each poll. Codes expire in minutes, so a short window is
/// plenty; de-dupe by Message-ID makes re-reading the same mail harmless.
const LOOKBACK_MS = 24 * 60 * 60 * 1000;
/// Bound the work on a busy inbox — newest N since the lookback.
const MAX_MESSAGES = 150;
/// Drop rows older than this so the table stays small.
const KEEP_MS = 7 * 24 * 60 * 60 * 1000;

/// 6 digits not glued to other digits — the Temu code shape.
const CODE_RE = /(?<!\d)(\d{6})(?!\d)/;

/// Pull a header value out of the raw header block imapflow returns.
function headerValue(raw: string, name: string): string | null {
  const re = new RegExp(`^${name}:\\s*(.+)$`, "im");
  const m = raw.match(re);
  return m ? m[1]!.trim() : null;
}

/// Just the address out of a "Name <addr@x>" or "addr@x" string.
function addrOnly(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = v.match(/<([^>]+)>/);
  return (m ? m[1] : v).trim().toLowerCase();
}

export type IngestResult = { ok: true; added: number } | { ok: false; error: string };

/// Connects, ingests new codes, prunes old ones. Safe to call on a throttle from
/// the list endpoint — one short IMAP session per call.
export async function ingestCodes(): Promise<IngestResult> {
  if (!otpConfigured()) return { ok: false, error: "IMAP not configured" };

  const client = newImapClient();

  let added = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date(Date.now() - LOOKBACK_MS);
      const uids = (await client.search({ since }, { uid: true })) || [];
      const recent = uids.slice(-MAX_MESSAGES);
      if (recent.length) {
        for await (const msg of client.fetch(
          recent,
          { envelope: true, internalDate: true, headers: ["delivered-to", "to"] },
          { uid: true },
        )) {
          const env = msg.envelope;
          const subject = env?.subject ?? "";
          const fromAddr = addrOnly(env?.from?.[0]?.address) ?? "";
          if (!/temu/i.test(fromAddr) && !/temu/i.test(subject)) continue;

          const code = subject.match(CODE_RE)?.[1] ?? "";
          if (!code) continue;

          const messageId = env?.messageId ?? `uid-${msg.uid}@${cfg.user}`;
          const rawHeaders = msg.headers ? msg.headers.toString() : "";
          const account =
            addrOnly(headerValue(rawHeaders, "delivered-to")) ??
            addrOnly(env?.to?.[0]?.address) ??
            "unknown";
          const receivedAt = env?.date ?? msg.internalDate ?? new Date();

          const res = await prisma.otpCode.upsert({
            where: { messageId },
            create: { messageId, account, fromAddr, subject, code, receivedAt },
            update: {}, // seen before — leave it
          });
          // upsert doesn't tell us insert vs update; count by checking createdAt≈now
          if (Date.now() - res.createdAt.getTime() < 5000) added++;
        }
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (e) {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
    return { ok: false, error: e instanceof Error ? e.message : "IMAP error" };
  }

  // Opportunistic prune.
  prisma.otpCode
    .deleteMany({ where: { receivedAt: { lt: new Date(Date.now() - KEEP_MS) } } })
    .catch(() => {});

  return { ok: true, added };
}
