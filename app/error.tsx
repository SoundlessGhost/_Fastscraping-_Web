"use client";

// Catches unexpected errors thrown while rendering a page (the root layout
// stays, so nav/footer remain around this). Shown instead of a raw stack trace;
// no error details are surfaced to the visitor.

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="fsx-page">
      <section className="fsx-wrap fsx-stack" style={{ minHeight: "60vh", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 16, padding: "96px 24px" }}>
        <span className="fsx-eyebrow">Something went wrong</span>
        <h1 className="fsx-h1-sm">That didn&apos;t go as planned.</h1>
        <p className="fsx-p" style={{ maxWidth: "46ch", fontSize: 17 }}>
          A temporary error stopped this page from loading. You can try again, or head back and pick up where you left off.
        </p>
        <div className="fsx-row" style={{ gap: 12, justifyContent: "center", marginTop: 8 }}>
          <button type="button" onClick={reset} className="fsx-btn">
            Try again →
          </button>
          <Link href="/" className="fsx-btn fsx-btn-outline">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
