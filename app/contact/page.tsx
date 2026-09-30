import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import "../styles/contact.css";
import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";

export const metadata: Metadata = withShareCard({
  title: "Contact",
  description:
    "Tell us which site and what you need from it. You'll get a reply from an engineer, not a sales script, within one business day.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact · Fastscraping",
    description:
      "Tell us which site and what you need from it — reply within one business day.",
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact · Fastscraping",
    description: "Tell us which site and what you need from it.",
  },
});

const NEXT_STEPS = [
  {
    n: "01",
    t: "An engineer reads it",
    d: "We check the target, the anti-bot setup, and whether an existing endpoint already covers it.",
    when: "Same day",
  },
  {
    n: "02",
    t: "You get a sample",
    d: "Where we can, we run a small extraction on your site so you see real rows before any call.",
    when: "< 24h",
  },
  {
    n: "03",
    t: "Scope & quote",
    d: "A short call, or just an email, to fix fields, schedule, delivery and a fixed price.",
    when: "1–2 days",
  },
];

const QUICK = [
  {
    t: "Just want to try it?",
    d: "No need to talk to anyone. 5,000 free credits, no card, live in two minutes.",
    cta: "Start free",
    href: "/dashboard/login",
  },
  {
    t: "Looking for the details?",
    d: "Every service, supported target and delivery option, with the fields we return.",
    cta: "Browse services",
    href: "/services",
  },
  {
    t: "Already a customer?",
    d: "Email support with your account email and a request ID. We answer technical questions within a few hours.",
    cta: "Email support",
    href: "mailto:khalid@fastscraping.com",
  },
];

export default function ContactPage() {
  return (
    <div className="cx" data-screen-label="Contact">
      <div className="cx-wrap">
        {/* Main grid */}
        <div className="cx-main">

          {/* Left column */}
          <div className="cx-left">
            <div className="cx-eyebrow">Talk to the team</div>
            <h1 className="cx-h1">
              Tell us which site, and{" "}
              <span>what you need from it.</span>
            </h1>
            <p className="cx-intro">
              Tell us what you&apos;re working on in a line or two. You&apos;ll
              get a reply from an engineer, not a sales script, within one
              business day.
            </p>

            <a href="mailto:khalid@fastscraping.com" className="cx-getintouch">
              <div className="cx-git-ic">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3.5 7 8.5 6 8.5-6" />
                </svg>
              </div>
              <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                <div className="cx-git-t">Get in touch</div>
                <div className="cx-git-mail">khalid@fastscraping.com</div>
              </div>
              <span className="cx-git-arr">→</span>
            </a>

            <div style={{ marginTop: 52 }}>
              <div className="cx-next-h">What happens next</div>
              <div className="cx-next">
                {NEXT_STEPS.map((s) => (
                  <div className="cx-next-row" key={s.n}>
                    <div className="cx-next-n">{s.n}</div>
                    <div>
                      <div className="cx-next-t">{s.t}</div>
                      <div className="cx-next-d">{s.d}</div>
                    </div>
                    <div className="cx-next-when">{s.when}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: form */}
          <ContactForm />
        </div>
      </div>

      {/* Bottom band */}
      <section className="cx-band">
        <div className="cx-band-grid">
          {QUICK.map((q) => (
            <div key={q.t}>
              <div className="cx-band-t">{q.t}</div>
              <p className="cx-band-d">{q.d}</p>
              {q.href.startsWith("mailto:") ? (
                <a href={q.href} className="cx-band-cta">
                  {q.cta} →
                </a>
              ) : (
                <Link href={q.href} className="cx-band-cta">
                  {q.cta} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
