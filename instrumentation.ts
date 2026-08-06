/**
 * Next.js runs `register()` once when the server process starts (not during
 * `next build`). We use it to validate the environment up front: if a required
 * secret is missing or a placeholder, the container exits immediately with a
 * clear message instead of booting and 500-ing on the first request.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("./lib/env");
    try {
      validateEnv();
    } catch (err) {
      console.error(
        "\n[startup] Environment validation failed:\n  " +
          (err instanceof Error ? err.message : String(err)) +
          "\n",
      );
      // Hard-exit so the deploy fails visibly rather than serving with a broken
      // security posture. Docker's restart policy will surface the crash loop.
      process.exit(1);
    }

    // Start the persistent IMAP IDLE worker so new Temu codes push to open pages
    // in real time. Non-fatal: if it can't start, the throttled poll still serves
    // codes, so a failure here must never take the server down.
    try {
      const { startIdleWorker } = await import("./lib/otp/idle");
      startIdleWorker();
    } catch (err) {
      console.error("[startup] IMAP IDLE worker failed to start:", err);
    }
  }
}
