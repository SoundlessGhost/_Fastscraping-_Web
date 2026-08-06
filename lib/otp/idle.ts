import type { ImapFlow } from "imapflow";
import { ingestCodes, otpConfigured, newImapClient } from "./imap";
import { codesBus } from "./bus";

// Persistent IMAP IDLE worker. Holds one long-lived connection to the central
// mailbox; the moment new mail arrives the server ingests it and pushes to every
// open SSE stream — no waiting for the next poll. Runs as a process-wide
// singleton (started once from instrumentation.ts). If the connection drops it
// reconnects with backoff; the throttled poll ingest stays as a safety net, so a
// worker hiccup only ever falls back to ~poll latency, never to nothing.

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

async function runLoop(): Promise<void> {
  let backoff = 2000;
  for (;;) {
    let client: ImapFlow | null = null;
    try {
      client = newImapClient();
      client.on("error", () => {
        /* swallow — the close handler drives reconnect */
      });
      await client.connect();
      await client.mailboxOpen("INBOX");
      console.log("[otp-idle] connected — idling on INBOX for new codes");

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

/// Start the IDLE worker once per process. No-op if already started or if IMAP
/// isn't configured (the poll path still works).
export function startIdleWorker(): void {
  if (g.__otpIdleStarted) return;
  if (!otpConfigured()) return;
  g.__otpIdleStarted = true;
  void runLoop();
}
