"use client";

// Last-resort boundary: fires only when the root layout itself fails, so it
// replaces the whole document and must render its own <html>/<body>. The app's
// global stylesheet isn't guaranteed here, so styles are inlined to match the
// cream/emerald brand. Production-only (Next shows the dev overlay otherwise).

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f4f1ea",
          color: "#131613",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "48ch" }}>
          <p
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "0.75rem",
              color: "#0e5d44",
              margin: "0 0 12px",
            }}
          >
            Something went wrong
          </p>
          <h1 style={{ fontSize: "2rem", lineHeight: 1.2, margin: "0 0 16px", fontWeight: 600 }}>
            We hit an unexpected error.
          </h1>
          <p style={{ color: "#5b5f5b", lineHeight: 1.6, margin: "0 0 28px" }}>
            Please try again in a moment. If it keeps happening, get in touch and
            we&apos;ll take a look.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#0e5d44",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "12px 22px",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Try again →
          </button>
        </div>
      </body>
    </html>
  );
}
