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

// ---- mailbox housekeeping ------------------------------------------------
// The central inbox is a relay, not an archive: 1280 forwarders push every
// Temu/Indeed mail into it, marketing included, and it filled its 1 GB quota in
// weeks. A full mailbox silently rejects new mail, which is exactly how codes
// stopped arriving. So the ingest now cleans up after itself.
//
// Safety: we only delete mail older than PURGE_AFTER_MS, which is twice the
// window ingestCodes() ever searches (LOOKBACK_MS). Anything past that can
// never be harvested again, so removing it cannot cost a single code — and the
// codes themselves live in Postgres, not here.
const PURGE_AFTER_MS = 2 * LOOKBACK_MS;
/// Cap per run so one ingest can't sit there deleting for minutes.
const PURGE_MAX = 2000;
/// Housekeeping is cheap but not free — at most once an hour.
const PURGE_EVERY_MS = 60 * 60 * 1000;

let lastPurge = 0;

/// Deletes mail older than the harvest window. Runs inside the caller's mailbox
/// lock. Never throws: a failed cleanup must not fail the ingest that found
/// codes. Returns how many were removed.
async function purgeOldMail(client: ImapFlow): Promise<number> {
  if (Date.now() - lastPurge < PURGE_EVERY_MS) return 0;
  lastPurge = Date.now();
  try {
    const before = new Date(Date.now() - PURGE_AFTER_MS);
    const stale = (await client.search({ before }, { uid: true })) || [];
    if (!stale.length) return 0;
    const batch = stale.slice(0, PURGE_MAX);
    await client.messageDelete(batch, { uid: true });
    console.log(`[otp-idle] mailbox cleanup — removed ${batch.length} message(s) older than 48h`);
    return batch.length;
  } catch (e) {
    console.error("[otp-idle] mailbox cleanup failed:", e instanceof Error ? e.message : e);
    return 0;
  }
}

/// 6 digits not glued to other digits — the shape both brands use.
const CODE_RE = /(?<!\d)(\d{6})(?!\d)/;

/// The senders we harvest codes from. Both put the code in the subject line
/// ("... code: 690686"), so no body fetch is needed. Adding a brand is one
/// entry here — the ingest filter and the dashboard badges both read this list.
export const BRANDS = [
  { id: "temu", label: "Temu", match: /temu/i },
  { id: "indeed", label: "Indeed", match: /indeed/i },
] as const;

export type BrandId = (typeof BRANDS)[number]["id"];

/// Which brand a message belongs to — matched on sender first, then subject.
/// Null means "not one of ours", and the ingest skips it.
export function brandOf(fromAddr: string, subject: string): BrandId | null {
  for (const b of BRANDS) {
    if (b.match.test(fromAddr) || b.match.test(subject)) return b.id;
  }
  return null;
}

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
          if (!brandOf(fromAddr, subject)) continue;

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

      // Housekeeping while we still hold the lock — keeps the quota from
      // filling, which is what stopped codes arriving in Aug 2026.
      await purgeOldMail(client);
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
