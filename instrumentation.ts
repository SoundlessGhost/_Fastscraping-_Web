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
  }
}
