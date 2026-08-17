import Link from "next/link";
import TocSpy from "@/components/TocSpy";
import "../styles/about.css";import "../styles/legal.css";
import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";

export const metadata: Metadata = withShareCard({
  title: "Data compliance & acceptable use",
  description:
    "What Fastscraping will and won't collect. Publicly accessible data only — no logins, no paywalls, no personal data brokerage. GDPR and CCPA aligned.",
  alternates: { canonical: "/compliance" },
  openGraph: {
    title: "Data compliance & acceptable use · Fastscraping",
    description:
      "Publicly accessible data only. No logins, no paywalls, no personal data brokerage.",
    url: "/compliance",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Data compliance · Fastscraping",
    description: "Publicly accessible data only. Clear limits, in writing.",
  },
});

export default function CompliancePage() {
  return (
    <>
      <TocSpy />

      <section className="legal-hero" data-screen-label="01 Compliance hero">
        <div className="container">
          <div className="lh-band">
            <div className="lh-trail">
              <Link href="/">Home</Link>
              <span className="sep">→</span>
              <span>Legal</span>
              <span className="sep">→</span>
              <span style={{ color: "var(--ink)" }}>Compliance</span>
            </div>
            <div className="lh-stamp">
              <span className="lh-stamp-label">Last updated</span>
              <span className="lh-stamp-date">17 Aug · 2026</span>
            </div>
          </div>

          <div className="lh-headline">
            <h1 className="lh-h1">
              <em>Compliance.</em>
            </h1>
            <aside className="lh-deck">
              <p>
                What we will and won&apos;t collect, in writing. The headline:{" "}
                <strong>
                  publicly accessible data only — nothing behind a login, a
                  paywall, or an account
                </strong>
                .
              </p>
              <div className="lh-deck-meta">
                <span className="lh-tag">Public data only</span>
                <span className="lh-tag">GDPR &amp; CCPA aligned</span>
                <span className="lh-tag">Takedowns honoured</span>
              </div>
            </aside>
          </div>

          <div className="tldr-card">
            <div>
              <div className="tldr-h">The gist</div>
              <div className="tldr-sub">In 60 seconds</div>
            </div>
            <ul className="tldr-list">
              <li>
                We collect <strong>publicly accessible data only</strong> — the
                pages any visitor can open without signing in.
              </li>
              <li>
                We never sign in, share credentials, or collect anything behind
                a login or paywall.
              </li>
              <li>
                We are not a data broker. We don&apos;t build, sell, or licence
                personal-data lists.
              </li>
              <li>
                We collect at a measured rate — never enough to degrade the
                sites we read.
              </li>
              <li>
                We decline projects that aren&apos;t lawful, and we say no often
                enough that it&apos;s a real policy.
              </li>
              <li>
                Site owner or individual with a concern? Email us and we&apos;ll
                act on it.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="legal-main" data-screen-label="02 Compliance body">
        <div className="container">
          <div className="legal-grid">
            <nav className="toc">
              <div className="toc-h">On this page</div>
              <ol className="toc-list">
                <li>
                  <a href="#s-scope">
                    <span className="toc-n">01</span>
                    <span>What we collect</span>
                  </a>
                </li>
                <li>
                  <a href="#s-never">
                    <span className="toc-n">02</span>
                    <span>What we never collect</span>
                  </a>
                </li>
                <li>
                  <a href="#s-decline">
                    <span className="toc-n">03</span>
                    <span>Work we decline</span>
                  </a>
                </li>
                <li>
                  <a href="#s-how">
                    <span className="toc-n">04</span>
                    <span>How we collect</span>
                  </a>
                </li>
                <li>
                  <a href="#s-personal">
                    <span className="toc-n">05</span>
                    <span>Personal data</span>
                  </a>
                </li>
                <li>
                  <a href="#s-clients">
                    <span className="toc-n">06</span>
                    <span>Client obligations</span>
                  </a>
                </li>
                <li>
                  <a href="#s-takedown">
                    <span className="toc-n">07</span>
                    <span>Takedowns &amp; objections</span>
                  </a>
                </li>
                <li>
                  <a href="#s-contact">
                    <span className="toc-n">08</span>
                    <span>Contact us</span>
                  </a>
                </li>
              </ol>
              <div className="toc-foot">
                <span>Raise a concern</span>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=khalid@fastscraping.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  khalid@fastscraping.com
                </a>
              </div>
            </nav>

            <article className="prose">
              <p className="prose-intro">
                Fastscraping is a managed data-engineering service. Clients hire
                us to collect, structure, and maintain information that is
                already published openly on the web. This page sets out the
                limits we work within — for clients deciding whether we&apos;re
                a fit, and for site owners who want to know what we do.
              </p>

              <section id="s-scope">
                <div className="prose-num">01 · What we collect</div>
                <h2>
                  Public pages, <em>nothing more.</em>
                </h2>
                <p>
                  We collect information that is publicly accessible — the same
                  pages any visitor can open in a browser without an account.
                  Typical examples:
                </p>
                <ul>
                  <li>
                    Public product listings, catalogue pages, specifications,
                    and public pricing.
                  </li>
                  <li>Public company and business directory information.</li>
                  <li>Public job postings.</li>
                  <li>Publicly published reviews and ratings.</li>
                  <li>
                    Open datasets, government and regulatory publications, and
                    public filings.
                  </li>
                </ul>
                <p>
                  We structure that information, keep it current, and deliver it
                  to the client in the format their systems need. That is the
                  whole of the service.
                </p>
              </section>

              <section id="s-never">
                <div className="prose-num">02 · What we never collect</div>
                <h2>The hard limits.</h2>
                <p>
                  These aren&apos;t negotiable, and no fee changes them. We do
                  not:
                </p>
                <ul>
                  <li>
                    <strong>Sign in to anything.</strong> We don&apos;t create
                    accounts, use client credentials, or collect data that
                    requires being logged in.
                  </li>
                  <li>
                    <strong>Go behind paywalls.</strong> Subscription-only or
                    pay-to-read content is out of scope.
                  </li>
                  <li>
                    <strong>Touch private or internal systems.</strong> No
                    private APIs, no internal endpoints, no non-public
                    infrastructure.
                  </li>
                  <li>
                    <strong>Collect credentials or payment data.</strong> No
                    passwords, no card numbers, no bank details — ever.
                  </li>
                  <li>
                    <strong>Collect special-category personal data.</strong> No
                    health, biometric, genetic, financial-account, precise
                    location, religious, political, or sexual-orientation data
                    about individuals.
                  </li>
                  <li>
                    <strong>Collect data about children.</strong> We don&apos;t
                    work with sources directed at under-16s.
                  </li>
                </ul>
              </section>

              <section id="s-decline">
                <div className="prose-num">03 · Work we decline</div>
                <h2>
                  We say <em>no.</em>
                </h2>
                <p>
                  Not every request is a project we&apos;ll take. We turn down
                  work where the purpose or the source makes it inappropriate,
                  including:
                </p>
                <ul>
                  <li>
                    Surveillance, stalking, harassment, or building profiles of
                    private individuals.
                  </li>
                  <li>
                    Assembling contact lists for unsolicited bulk messaging.
                  </li>
                  <li>
                    Circumventing access controls, authentication, or digital
                    rights management.
                  </li>
                  <li>
                    Wholesale copying of a copyrighted work or database for
                    republication.
                  </li>
                  <li>
                    Collection from a source that has told us, in writing, not
                    to.
                  </li>
                  <li>
                    Any use intended to defraud, discriminate unlawfully, or
                    break competition law.
                  </li>
                </ul>
                <p>
                  If a project drifts into this territory after it starts, we
                  stop, tell the client why, and refund anything prepaid for the
                  undelivered portion — see our{" "}
                  <Link href="/refund">Refund policy</Link>.
                </p>
              </section>

              <section id="s-how">
                <div className="prose-num">04 · How we collect</div>
                <h2>Good citizens of the web.</h2>
                <p>
                  A source site should never notice us as a burden. In practice
                  that means:
                </p>
                <ul>
                  <li>
                    <strong>Measured request rates.</strong> We pace collection
                    so it stays a rounding error against a site&apos;s ordinary
                    traffic, and never runs at a volume that could degrade
                    service for its real users.
                  </li>
                  <li>
                    <strong>Identifiable traffic.</strong> We can be reached.
                    Site operators who want to talk to us have a name and an
                    address to write to, at the bottom of this page.
                  </li>
                  <li>
                    <strong>Cache, don&apos;t hammer.</strong> We store what we
                    collect and re-fetch on a schedule that matches how often
                    the source actually changes.
                  </li>
                  <li>
                    <strong>Stop when asked.</strong> A request from a site
                    owner to stop is honoured — see section 07.
                  </li>
                </ul>
              </section>

              <section id="s-personal">
                <div className="prose-num">05 · Personal data</div>
                <h2>
                  We are <em>not</em> a data broker.
                </h2>
                <p>
                  We do not build, sell, licence, or maintain databases of
                  personal information, and we don&apos;t offer
                  contact-enrichment or people-search products of any kind.
                </p>
                <p>
                  Most of what we collect is about companies, products, and
                  prices, not people. Where public business information
                  incidentally includes a person — an author byline, a publicly
                  listed business contact — we treat it as personal data under
                  GDPR and CCPA, minimise it, and apply the retention limits set
                  out in our <Link href="/privacy">Privacy policy</Link>.
                </p>
                <p>
                  For data collected on a client&apos;s instruction, the client
                  is the data controller and Fastscraping acts as processor. We
                  sign data processing agreements, and we support Standard
                  Contractual Clauses for transfers out of the EU.
                </p>
              </section>

              <section id="s-clients">
                <div className="prose-num">06 · Client obligations</div>
                <h2>What we ask of you.</h2>
                <p>
                  Compliance runs in both directions. When you engage us, you
                  confirm that:
                </p>
                <ul>
                  <li>
                    You have a lawful basis and a legitimate business purpose
                    for the data you&apos;re asking for.
                  </li>
                  <li>
                    You&apos;ll use it in line with our{" "}
                    <Link href="/terms">Terms of service</Link> and applicable
                    law, including data-protection law.
                  </li>
                  <li>
                    You won&apos;t use it for any of the purposes listed in
                    section 03.
                  </li>
                  <li>
                    You&apos;ll handle any personal data in the delivery as a
                    controller, including honouring data-subject requests.
                  </li>
                </ul>
                <p>
                  If we learn that delivered data is being used outside these
                  limits, we may suspend or terminate the engagement.
                </p>
              </section>

              <section id="s-takedown">
                <div className="prose-num">07 · Takedowns &amp; objections</div>
                <h2>
                  A real address, <em>and a real answer.</em>
                </h2>
                <p>
                  <strong>If you operate a website</strong> and would prefer we
                  didn&apos;t collect from it, email us. We don&apos;t argue the
                  point — we&apos;ll confirm the domain, add it to our
                  exclusion list, and stop. We aim to confirm within five
                  business days.
                </p>
                <p>
                  <strong>If you&apos;re an individual</strong> and believe we
                  hold information about you, you can ask us what we hold and
                  ask us to delete it, wherever you live. Where we hold it on a
                  client&apos;s behalf we&apos;ll pass the request to that
                  client and support them in answering it. See the rights
                  section of our <Link href="/privacy">Privacy policy</Link>.
                </p>
                <p>
                  <strong>If you hold rights in content</strong> you believe has
                  been copied improperly, write to us with the detail and
                  we&apos;ll investigate and respond.
                </p>
              </section>

              <section id="s-contact">
                <div className="prose-num">08 · Contact us</div>
                <h2>Talk to a person.</h2>
                <p>
                  Compliance questions, takedown requests, and data-subject
                  requests all go to the same place, and a human reads them:
                </p>
                <dl>
                  <dt>Email</dt>
                  <dd>
                    <a
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=khalid@fastscraping.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      khalid@fastscraping.com
                    </a>{" "}
                    — replies within one business day
                  </dd>
                  <dt>Mail</dt>
                  <dd>
                    Fast Scraping LLC · 30 N Gould St, Ste R · Sheridan, WY
                    82801 · United States
                  </dd>
                </dl>
              </section>

              <div className="legal-foot-card">
                <div>
                  <span
                    className="eyebrow hot"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Legal review before you buy?
                  </span>
                  <h3>
                    Send this page to your counsel —{" "}
                    <em>we&apos;ll answer their questions.</em>
                  </h3>
                  <p>
                    We&apos;re used to procurement and legal review. Send us the
                    questionnaire, the DPA, or the security review and
                    we&apos;ll work through it with you.
                  </p>
                </div>
                <div className="legal-foot-actions">
                  <Link href="/contact" className="btn btn-primary">
                    Contact us <span className="arrow">→</span>
                  </Link>
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=khalid@fastscraping.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                  >
                    Email directly
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
