import { codesBus } from "./bus";
import { listCodes } from "./codes";

// Server-Sent Events stream of the codes list. Sends an initial snapshot, then
// pushes a fresh snapshot every time the IDLE worker signals new mail — so a
// code reaches an open page within a second of landing in the mailbox. A comment
// heartbeat keeps intermediaries from dropping an otherwise-idle connection.
// Both the public (token) and admin routes call this after their own auth.
export function codesEventStream(signal: AbortSignal): Response {
  const encoder = new TextEncoder();
  let closed = false;
  let onChange: (() => void) | null = null;
  let hb: ReturnType<typeof setInterval> | null = null;

  const detach = () => {
    if (hb) clearInterval(hb);
    if (onChange) codesBus.off("change", onChange);
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const cleanup = () => {
        if (closed) return;
        closed = true;
        detach();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup(); // consumer went away between checks
        }
      };
      const push = async () => {
        try {
          const snap = await listCodes();
          write(`event: codes\ndata: ${JSON.stringify(snap)}\n\n`);
        } catch {
          /* transient DB blip — the next change/heartbeat will retry */
        }
      };

      void push(); // initial snapshot
      onChange = () => {
        void push();
      };
      codesBus.on("change", onChange);
      hb = setInterval(() => write(`: ping\n\n`), 25_000);

      // Client disconnected — stop pushing and release the listener.
      signal.addEventListener("abort", cleanup);
    },
    cancel() {
      closed = true;
      detach();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // belt-and-suspenders against proxy buffering
    },
  });
}
