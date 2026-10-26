import { ImapFlow } from "imapflow";
import { prisma } from "@/lib/db";
import { SHOPEE_MAILBOXES } from "@/lib/otp/shopee-mailboxes";

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
/// Max email bodies to download in a single ingest. Shopee mailboxes get a lot
/// of mail, and downloading dozens of bodies in one session held the mailbox lock
/// long enough that the server intermittently answered "Command failed". Capped
/// per run (newest first); the IDLE worker and the next poll pick up the rest.
const BODY_FETCH_MAX = 15;
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

/// 6 digits not glued to other digits — the shape every brand's code uses.
const CODE_RE = /(?<!\d)(\d{6})(?!\d)/;

type Brand = {
  id: string;
  label: string;
  match: RegExp;
  /// "subject" — Temu and Indeed spell the 6-digit code in the subject.
  /// "mailbox" — Shopee: show the WHOLE email in a reading pane. Every mail
  ///   forwarded from a Shopee-account mailbox is kept (not just OTP/login), so
  ///   the tab is a real inbox, not a code list.
  codeIn: "subject" | "mailbox";
};

/// Brands the dashboard knows about. Temu/Indeed match by sender; Shopee also
/// matches by recipient (any mail to a mailbox in SHOPEE_MAILBOXES — see brandOf).
export const BRANDS: readonly Brand[] = [
  { id: "temu", label: "Temu", match: /temu/i, codeIn: "subject" },
  { id: "indeed", label: "Indeed", match: /indeed/i, codeIn: "subject" },
  { id: "shopee", label: "Shopee", match: /shopee/i, codeIn: "mailbox" },
];

export type BrandId = string;

/// Which brand a message belongs to. A mail delivered to one of our dedicated
/// Shopee-account mailboxes is Shopee whatever its sender — those inboxes are
/// Shopee-only and the user wants EVERY mail from them, not just OTP/login.
/// Otherwise match Temu / Indeed by sender or subject. Null = not one of ours.
export function brandOf(fromAddr: string, subject: string, account?: string): BrandId | null {
  if (account && SHOPEE_MAILBOXES.has(account.toLowerCase())) return "shopee";
  for (const b of BRANDS) {
    if (b.match.test(fromAddr) || b.match.test(subject)) return b.id;
  }
  return null;
}

function brandDef(id: BrandId): Brand | undefined {
  return BRANDS.find((b) => b.id === id);
}

/// Pull a 6-digit code out of a decoded mail body. Prefer one sitting next to an
/// OTP/verification keyword, so a stray 6-digit order number never wins; fall
/// back to a lone 6-digit when the body is essentially just the code.
function codeFromBody(text: string): string {
  const near = text.match(
    /(?:OTP|驗證碼|验证码|verification code|código|codigo|code)\D{0,40}(\d{6})(?!\d)/i,
  );
  if (near) return near[1]!;
  const lone = text.match(/(?<!\d)(\d{6})(?!\d)/);
  return lone ? lone[1]! : "";
}

/// HTML -> visible text, for reading a code.
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/// Pull the "confirm this login" link out of a Shopee security mail. The confirm
/// link is always a Shopee short link (tw.shp.ee / my.shp.ee / …); every other
/// link in the mail is help, app-store or social. Keying on that domain — not on
/// the anchor text — makes this work whatever language the mail is in. Falls back
/// to an anchor whose visible text is a "here / confirm" word.
function linkFromBody(html: string): string {
  const h = html.replace(/=\r?\n/g, ""); // rejoin any quoted-printable soft breaks
  const shp = h.match(/https?:\/\/[a-z0-9.-]*\bshp\.ee\/[^\s"'<>]+/i);
  if (shp) return shp[0].replace(/&amp;/g, "&");
  const re = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(h))) {
    const text = m[2]!.replace(/<[^>]+>/g, "").trim();
    if (/\bhere\b|此處|此处|確認|确认|confirm|點擊|点击/i.test(text)) {
      return m[1]!.replace(/&amp;/g, "&");
    }
  }
  return "";
}

/// Walk an imapflow bodyStructure to the first text part to read (HTML preferred,
/// then plain), so we download just the body — not the whole raw message.
function findTextPart(node: unknown, want: string): string | null {
  if (!node || typeof node !== "object") return null;
  const n = node as { type?: string; part?: string; childNodes?: unknown[] };
  if (n.type === want && n.part) return n.part;
  for (const c of n.childNodes ?? []) {
    const r = findTextPart(c, want);
    if (r) return r;
  }
  return null;
}

/// Download one decoded text part as raw HTML, bounded and with its own timeout
/// so a slow or stuck mailbox can never hang the ingest. The caller strips it for
/// a code or scans the hrefs for a link. Returns "" on any failure.
async function downloadBody(client: ImapFlow, uid: number, part: string): Promise<string> {
  try {
    const dl = (await Promise.race([
      client.download(uid, part, { uid: true }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("download timeout")), 20000)),
    ])) as { content: AsyncIterable<Buffer> };
    let buf = "";
    await Promise.race([
      (async () => {
        for await (const ch of dl.content) {
          buf += ch.toString("utf8");
          if (buf.length > 200_000) break;
        }
      })(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("stream timeout")), 20000)),
    ]);
    return buf;
  } catch {
    return "";
  }
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

      // One row upsert, shared by the subject path and the body path. Counts only
      // rows actually created so the caller can log "N new".
      const store = async (
        messageId: string, account: string, fromAddr: string,
        subject: string, code: string, receivedAt: Date, body?: string | null,
      ) => {
        const res = await prisma.otpCode.upsert({
          where: { messageId },
          create: { messageId, account, fromAddr, subject, code, receivedAt, body: body ?? null },
          update: {}, // seen before — leave it
        });
        if (Date.now() - res.createdAt.getTime() < 5000) added++;
      };

      // Body-brand (Shopee) messages: can't download a body while the fetch
      // iterator is open, so collect them and fetch their bodies in a second pass.
      type BodyJob = { uid: number; part: string; messageId: string; account: string; fromAddr: string; subject: string; receivedAt: Date };
      const bodyJobs: BodyJob[] = [];

      if (recent.length) {
        for await (const msg of client.fetch(
          recent,
          { envelope: true, internalDate: true, bodyStructure: true, headers: ["delivered-to", "to"] },
          { uid: true },
        )) {
          const env = msg.envelope;
          const subject = env?.subject ?? "";
          const fromAddr = addrOnly(env?.from?.[0]?.address) ?? "";
          const messageId = env?.messageId ?? `uid-${msg.uid}@${cfg.user}`;
          const rawHeaders = msg.headers ? msg.headers.toString() : "";
          const account =
            addrOnly(headerValue(rawHeaders, "delivered-to")) ??
            addrOnly(env?.to?.[0]?.address) ??
            "unknown";
          const receivedAt = new Date(env?.date ?? msg.internalDate ?? Date.now());

          // Match on recipient (Shopee mailbox) as well as sender.
          const brand = brandOf(fromAddr, subject, account);
          if (!brand) continue;

          if (brandDef(brand)?.codeIn === "mailbox") {
            // Keep the WHOLE email — every mail to a Shopee mailbox, not just
            // OTP/login. Collect it; its body is fetched in the second pass.
            const part =
              findTextPart(msg.bodyStructure, "text/html") ??
              findTextPart(msg.bodyStructure, "text/plain") ??
              "1";
            bodyJobs.push({ uid: msg.uid, part, messageId, account, fromAddr, subject, receivedAt });
            continue;
          }

          const code = subject.match(CODE_RE)?.[1] ?? "";
          if (!code) continue;
          await store(messageId, account, fromAddr, subject, code, receivedAt);
        }
      }

      // Second pass — bodies. Skip any messageId already stored so a code's body
      // is downloaded exactly once, not on every poll.
      if (bodyJobs.length) {
        const have = new Set(
          (await prisma.otpCode.findMany({
            where: { messageId: { in: bodyJobs.map((j) => j.messageId) } },
            select: { messageId: true },
          })).map((r) => r.messageId),
        );
        // Newest-first, capped per run so one ingest never holds the mailbox lock
        // downloading dozens of bodies (which intermittently failed "Command failed").
        const pending = bodyJobs
          .filter((j) => !have.has(j.messageId))
          .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
          .slice(0, BODY_FETCH_MAX);
        for (const j of pending) {
          const html = await downloadBody(client, j.uid, j.part);
          if (!html) continue;
          // Best-effort code/link for search; the whole email is kept regardless,
          // so even a plain Shopee mail (no code) still shows in the mailbox.
          const code = codeFromBody(stripHtml(html)) || linkFromBody(html) || "";
          await store(j.messageId, j.account, j.fromAddr, j.subject, code, j.receivedAt, html);
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
