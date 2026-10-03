import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="fsx-page">
      <section className="fsx-wrap fsx-stack" style={{ minHeight: "60vh", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 16, padding: "96px 24px" }}>
        <span className="fsx-eyebrow">Error · 404</span>
        <h1 className="fsx-h1-sm">This page slipped through.</h1>
        <p className="fsx-p" style={{ maxWidth: "46ch", fontSize: 17 }}>
          The link may be broken, or the page moved. Let&apos;s get you back to something that works.
        </p>
        <div className="fsx-row" style={{ gap: 12, justifyContent: "center", marginTop: 8 }}>
          <Link href="/" className="fsx-btn">
            Back home →
          </Link>
          <Link href="/contact" className="fsx-btn fsx-btn-outline">
            Contact us
          </Link>
        </div>
      </section>
    </main>
  );
}
