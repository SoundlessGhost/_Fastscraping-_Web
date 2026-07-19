"use client";

// Catches unexpected errors thrown while rendering a page (the root layout
// stays, so nav/footer remain around this). Shown instead of a raw stack trace;
// no error details are surfaced to the visitor.

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="block" style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
      <div className="container" style={{ textAlign: "center" }}>
        <span className="eyebrow">Something went wrong</span>
        <h1 className="display" style={{ marginTop: 16 }}>
          That didn&apos;t <em>go as planned.</em>
        </h1>
        <p
          style={{
            color: "var(--muted)",
            maxWidth: "46ch",
            margin: "16px auto 28px",
            lineHeight: 1.6,
          }}
        >
          A temporary error stopped this page from loading. You can try again, or
          head back and pick up where you left off.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={reset} className="btn btn-primary">
            Try again <span className="arrow">→</span>
          </button>
          <Link href="/" className="btn btn-ghost">
            Back home
          </Link>
        </div>
      </div>
    </section>
  );
}
