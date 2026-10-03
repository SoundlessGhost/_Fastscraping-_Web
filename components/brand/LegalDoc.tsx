import Link from "next/link";
import { COMPANY, COMPANY_ADDRESS_LINE } from "@/lib/company";
import { LEGAL_NAV } from "@/lib/site-links";
import { LEGAL_UPDATED } from "@/lib/legal/content";

/// Shared shell for the four legal documents. The body is static HTML generated
/// from our own markdown (lib/legal/content.ts), never user input.
export default function LegalDoc({ current, title, html }: { current: string; title: string; html: string }) {
  return (
    <main className="fsx-page">
      <section style={{ background: "#fff", borderBottom: "1px solid #E3E0F2" }}>
        <div className="fsx-wrap fsx-stack" style={{ padding: "64px 24px 40px", gap: 16 }}>
          <span className="fsx-eyebrow">Legal</span>
          <h1 className="fsx-h1-sm">{title}</h1>
          <p className="fsx-p" style={{ fontSize: 17, maxWidth: 760 }}>
            Last updated {LEGAL_UPDATED}. {COMPANY.legalName}, a Wyoming limited liability company, {COMPANY_ADDRESS_LINE}.
          </p>
          <nav aria-label="Legal documents" className="fsx-legal-nav">
            {LEGAL_NAV.map((l) => (
              <Link key={l.href} href={l.href} aria-current={l.href === current ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
      <article className="fsx-legal" dangerouslySetInnerHTML={{ __html: html }} />
      <section className="fsx-legal" style={{ paddingTop: 0 }}>
        <h2>Contact</h2>
        <p>
          {COMPANY.legalName} · {COMPANY_ADDRESS_LINE} · <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> ·{" "}
          {COMPANY.phone}
        </p>
      </section>
    </main>
  );
}
