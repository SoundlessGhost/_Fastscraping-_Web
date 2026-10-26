import type { ImapFlow } from "imapflow";
import { ingestCodes, otpConfigured, newImapClient, SOURCES, type MailSource } from "./imap";
import { codesBus } from "./bus";

// Persistent IMAP IDLE workers — one long-lived connection per central inbox.
// The moment new mail arrives in any of them the server ingests and pushes to
// every open SSE stream — no waiting for the next poll. Started once from
// instrumentation.ts. If a connection drops it reconnects with backoff; the
// throttled poll ingest stays as a safety net, so a worker hiccup only ever
// falls back to ~poll latency, never to nothing. An "exists" on any inbox runs
// a single shared ingest (all inboxes, coalesced + de-duped), so two workers
// firing at once can't stack connections or double-store.

const g = globalThis as unknown as { __otpIdleStarted?: boolean };

// One ingest at a time; an "exists" that lands mid-ingest coalesces into a
// single follow-up run instead of stacking connections.
let ingesting = false;
let again = false;

async function ingestAndNotify(): Promise<void> {
  if (ingesting) {
    again = true;
    return;
  }
  ingesting = true;
  try {
    do {
      again = false;
      const r = await ingestCodes();
      if (r.ok && r.added > 0) {
        console.log(`[otp-idle] ${r.added} new code(s) → pushing to open pages`);
        codesBus.emit("change");
      }
    } while (again);
  } catch {
    /* ingest logs its own errors via the returned result; never throw here */
  } finally {
    ingesting = false;
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function runLoop(source: MailSource): Promise<void> {
  let backoff = 2000;
  for (;;) {
    let client: ImapFlow | null = null;
    try {
      client = newImapClient(source);
      client.on("error", () => {
        /* swallow — the close handler drives reconnect */
      });
      await client.connect();
      await client.mailboxOpen("INBOX");
      console.log(`[otp-idle] ${source.id}: connected — idling on INBOX for new mail`);

      // Catch anything that arrived while we were disconnected.
      await ingestAndNotify();
      backoff = 2000; // healthy connect — reset backoff

      // imapflow auto-IDLEs an open, idle mailbox and fires "exists" when the
      // message count changes. Ingest on each new-mail signal.
      const onExists = () => {
        void ingestAndNotify();
      };
      client.on("exists", onExists);

      // Hold the connection open until it closes, then fall through to reconnect.
      await new Promise<void>((resolve) => {
        client!.once("close", () => resolve());
      });
    } catch {
      /* connect/open failed — back off and retry */
    } finally {
      if (client) {
        try {
          client.removeAllListeners();
        } catch {
          /* ignore */
        }
        try {
          await client.logout();
        } catch {
          /* already gone */
        }
      }
    }
    await sleep(backoff);
    backoff = Math.min(backoff * 2, 60_000); // cap at 1 min
  }
}

/// Start the IDLE workers once per process — one per configured inbox. No-op if
/// already started or if no inbox is configured (the poll path still works).
export function startIdleWorker(): void {
  if (g.__otpIdleStarted) return;
  if (!otpConfigured()) return;
  g.__otpIdleStarted = true;
  for (const source of SOURCES) void runLoop(source);
}
