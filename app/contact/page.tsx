import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";
import { BOOK_CALL_URL } from "@/lib/site-links";
import { COMPANY, COMPANY_ADDRESS_LINE } from "@/lib/company";
import ContactFormUV from "@/components/brand/ContactFormUV";

export const metadata: Metadata = withShareCard({
  title: "Contact — Free Trial Key or a Call",
  description:
    "Send 3–5 product links and get JSON back. Free trial key the same day, a sample on a new platform in 48–72 hours, or book a call with Khalid.",
  alternates: { canonical: "/contact" },
});

function Row({ href, label, external, icon }: { href: string; label: string; external?: boolean; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      style={{
        display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "#16131F",
        background: "#fff", border: "1px solid #E3E0F2", borderRadius: 10, padding: "14px 16px", fontWeight: 600, fontSize: 16,
      }}
    >
      <span className="fsx-icon" style={{ width: 36, height: 36, borderRadius: 8 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4B3FA3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon}
        </svg>
      </span>
      {label}
    </a>
  );
}

export default function ContactPage() {
  return (
    <main className="fsx-page">
      <section className="fsx-wrap fsx-row" style={{ paddingTop: 72, paddingBottom: 88, gap: 48, alignItems: "flex-start" }}>
        <div className="fsx-stack" style={{ flex: "1 1 400px", minWidth: 0, gap: 24 }}>
          <div className="fsx-stack" style={{ gap: 12 }}>
            <span className="fsx-eyebrow">Contact</span>
            <h1 className="fsx-h1-sm">Send a few product links. Get JSON back.</h1>
            <p className="fsx-p" style={{ fontSize: 18, lineHeight: 1.5 }}>
              Replies within 24 hours. A trial key the same day, or a clean sample on a new platform within 48–72 hours.
            </p>
          </div>
          <a
            href={BOOK_CALL_URL}
            target="_blank"
            rel="noopener"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, textDecoration: "none",
              background: "#4B3FA3", color: "#fff", borderRadius: 12, padding: "20px 22px",
            }}
          >
            <span className="fsx-stack" style={{ gap: 4 }}>
              <strong style={{ fontSize: 18 }}>Book a 30-min call with Khalid</strong>
              <span style={{ fontSize: 14, color: "#E4DFFF" }}>Google Meet · pick a slot that suits you</span>
            </span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
          <div className="fsx-stack" style={{ gap: 12 }}>
            <Row
              href={`mailto:${COMPANY.email}`}
              label={COMPANY.email}
              icon={
                <>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </>
              }
            />
            <Row
              href="https://www.linkedin.com/in/md-khalid-mahmud-shawon/"
              label="LinkedIn · Md Khalid Mahmud Shawon"
              external
              icon={
                <>
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </>
              }
            />
            <Row
              href="https://t.me/khalid_alsaba"
              label="Telegram · @khalid_alsaba"
              external
              icon={
                <>
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22l-4-9-9-4 20-7z" />
                </>
              }
            />
            <Row
              href={COMPANY.discord}
              label="Discord · developer support"
              external
              icon={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />}
            />
          </div>
          <p className="fsx-p" style={{ fontSize: 14 }}>
            {COMPANY.legalName} · {COMPANY_ADDRESS_LINE}. US-registered, engineering team in Bangladesh.
          </p>
        </div>
        <ContactFormUV />
      </section>
    </main>
  );
}
