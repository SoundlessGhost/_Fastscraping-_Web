import Link from "next/link";
import TocSpy from "@/components/TocSpy";
import "../styles/about.css";import "../styles/legal.css";
import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";

export const metadata: Metadata = withShareCard({
  title: "Refund & cancellation policy",
  description:
    "How billing, cancellation, and refunds work at Fastscraping. Month-to-month, no lock-in, and a clear remedy when data doesn't meet spec.",
  alternates: { canonical: "/refund" },
  openGraph: {
    title: "Refund & cancellation policy · Fastscraping",
    description: "Month-to-month. Cancel any time. Clear remedies when data misses spec.",
    url: "/refund",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Refund & cancellation policy · Fastscraping",
    description: "Month-to-month. Cancel any time.",
  },
});

export default function RefundPage() {
  return (
    <>
      <TocSpy />

      <section className="legal-hero" data-screen-label="01 Refund hero">
        <div className="container">
          <div className="lh-band">
            <div className="lh-trail">
              <Link href="/">Home</Link>
              <span className="sep">→</span>
              <span>Legal</span>
              <span className="sep">→</span>
              <span style={{ color: "var(--ink)" }}>Refunds</span>
            </div>
            <div className="lh-stamp">
              <span className="lh-stamp-label">Last updated</span>
              <span className="lh-stamp-date">17 Aug · 2026</span>
            </div>
          </div>

          <div className="lh-headline">
            <h1 className="lh-h1">
              <em>Refunds.</em>
            </h1>
            <aside className="lh-deck">
              <p>
                How billing, cancellation, and refunds work. The headline:{" "}
                <strong>
                  you&apos;re never locked in, and if data misses the agreed
                  spec we fix it or refund it
                </strong>
                .
              </p>
              <div className="lh-deck-meta">
                <span className="lh-tag">Month-to-month</span>
                <span className="lh-tag">No lock-in</span>
                <span className="lh-tag">Re-run or refund</span>
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
                Cancel any time with 30 days&apos; notice — no termination fee,
                no penalty.
              </li>
              <li>
                If delivered data misses the agreed specification, we re-run it
                free or refund that delivery.
              </li>
              <li>
                Unused prepaid credit is refundable on request when your account
                closes.
              </li>
              <li>
                Approved refunds go back to the original payment method, within
                5–10 business days.
              </li>
              <li>
                Work already delivered and accepted isn&apos;t refundable — but
                talk to us, we&apos;re reasonable.
              </li>
              <li>
                Email us before opening a dispute. We answer within one business
                day.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="legal-main" data-screen-label="02 Refund body">
        <div className="container">
          <div className="legal-grid">
            <nav className="toc">
              <div className="toc-h">On this page</div>
              <ol className="toc-list">
                <li>
                  <a href="#s-billing">
                    <span className="toc-n">01</span>
                    <span>How billing works</span>
                  </a>
                </li>
                <li>
                  <a href="#s-cancel">
                    <span className="toc-n">02</span>
                    <span>Cancelling</span>
                  </a>
                </li>
                <li>
                  <a href="#s-eligible">
                    <span className="toc-n">03</span>
                    <span>When we refund</span>
                  </a>
                </li>
                <li>
                  <a href="#s-noteligible">
                    <span className="toc-n">04</span>
                    <span>When we don&apos;t</span>
                  </a>
                </li>
                <li>
                  <a href="#s-credits">
                    <span className="toc-n">05</span>
                    <span>Prepaid credit</span>
                  </a>
                </li>
                <li>
                  <a href="#s-how">
                    <span className="toc-n">06</span>
                    <span>Requesting a refund</span>
                  </a>
                </li>
                <li>
                  <a href="#s-timing">
                    <span className="toc-n">07</span>
                    <span>Timing &amp; method</span>
                  </a>
                </li>
                <li>
                  <a href="#s-disputes">
                    <span className="toc-n">08</span>
                    <span>Disputes &amp; chargebacks</span>
                  </a>
                </li>
                <li>
                  <a href="#s-contact">
                    <span className="toc-n">09</span>
                    <span>Contact us</span>
                  </a>
                </li>
              </ol>
              <div className="toc-foot">
                <span>Need a refund?</span>
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
                This policy explains how billing, cancellation, and refunds work
                for the managed data services provided by{" "}
                <strong>Fast Scraping LLC</strong> (trading as Fastscraping), a
                Wyoming limited liability company. It applies alongside our{" "}
                <Link href="/terms">Terms of service</Link>; where
                a signed Statement of Work or Master Services Agreement says
                something different, that signed document controls.
              </p>

              <section id="s-billing">
                <div className="prose-num">01 · How billing works</div>
                <h2>
                  What you&apos;re <em>paying for.</em>
                </h2>
                <p>
                  Fastscraping is a business-to-business managed service. We
                  agree a scope and a price in a Statement of Work, then bill
                  for it in one of two ways:
                </p>
                <ul>
                  <li>
                    <strong>Monthly retainer</strong> — a recurring fee for an
                    agreed volume or scope, invoiced monthly in advance.
                  </li>
                  <li>
                    <strong>Prepaid credit</strong> — you top up a balance and
                    usage draws it down at the per-request rate in your SOW.
                  </li>
                </ul>
                <p>
                  Invoices are payable within 14 days. All prices are quoted in
                  US dollars and are exclusive of any taxes that may apply in
                  your jurisdiction.
                </p>
              </section>

              <section id="s-cancel">
                <div className="prose-num">02 · Cancelling</div>
                <h2>Cancel any time.</h2>
                <p>
                  There is no minimum term, no lock-in, and no cancellation fee.
                  To cancel, email us — 30 days&apos; notice is all we ask, so
                  we can wind pipelines down cleanly and hand over any data you
                  still need.
                </p>
                <ul>
                  <li>
                    Your service continues through the notice period, and the
                    final month is billed as normal.
                  </li>
                  <li>
                    We don&apos;t start a new billing period once notice is
                    given.
                  </li>
                  <li>
                    On request, we&apos;ll export everything we hold for you
                    before the account closes.
                  </li>
                </ul>
              </section>

              <section id="s-eligible">
                <div className="prose-num">03 · When we refund</div>
                <h2>
                  If we miss, <em>we make it right.</em>
                </h2>
                <p>
                  We stand behind what we deliver. You&apos;re entitled to a
                  free re-run or a refund of the affected delivery when:
                </p>
                <ul>
                  <li>
                    <strong>Data misses the agreed specification</strong> —
                    wrong fields, wrong source, or accuracy below what the SOW
                    commits to, and we can&apos;t correct it within a reasonable
                    window.
                  </li>
                  <li>
                    <strong>We fail to deliver</strong> — a scheduled delivery
                    doesn&apos;t arrive and the delay is on our side.
                  </li>
                  <li>
                    <strong>You were billed in error</strong> — duplicate
                    charges, incorrect volumes, or a rate that doesn&apos;t
                    match your SOW. Always refunded in full.
                  </li>
                  <li>
                    <strong>We cancel your project</strong> — if we decide we
                    can&apos;t continue, any prepaid amount for undelivered work
                    is refunded in full.
                  </li>
                </ul>
                <p>
                  Our default remedy is to re-run the job at no charge, because
                  most clients want the data more than the money back. If a
                  re-run won&apos;t solve it, we refund.
                </p>
              </section>

              <section id="s-noteligible">
                <div className="prose-num">04 · When we don&apos;t</div>
                <h2>The honest limits.</h2>
                <p>Refunds generally aren&apos;t available for:</p>
                <ul>
                  <li>
                    Work already delivered, accepted, and used — where the data
                    met the agreed spec.
                  </li>
                  <li>
                    A change of mind about scope after the work has been
                    completed.
                  </li>
                  <li>
                    Delays or failures caused by factors outside our control —
                    for example a source site going offline, restructuring, or
                    removing data we were contracted to collect.
                  </li>
                  <li>
                    Data we declined to collect on legal or compliance grounds
                    (see our{" "}
                    <Link href="/compliance">Data compliance policy</Link>) —
                    though any prepaid amount for that work is refunded in full.
                  </li>
                </ul>
                <p>
                  None of this is meant to be rigid. If you think a charge
                  isn&apos;t fair, tell us — we&apos;d rather resolve it than
                  win an argument.
                </p>
              </section>

              <section id="s-credits">
                <div className="prose-num">05 · Prepaid credit</div>
                <h2>Unused balance.</h2>
                <p>
                  Prepaid credit doesn&apos;t expire while your account is
                  active. If you close your account with credit remaining, you
                  can ask for it back and we&apos;ll refund the unused portion —
                  minus any usage already incurred but not yet drawn down.
                </p>
                <p>
                  Credit is tied to your account and isn&apos;t transferable to
                  another company without our written agreement.
                </p>
              </section>

              <section id="s-how">
                <div className="prose-num">06 · Requesting a refund</div>
                <h2>How to ask.</h2>
                <p>
                  Email{" "}
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=khalid@fastscraping.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    khalid@fastscraping.com
                  </a>{" "}
                  with:
                </p>
                <ul>
                  <li>Your company name and the invoice number.</li>
                  <li>Which delivery or charge you&apos;re querying.</li>
                  <li>
                    What went wrong — a sample of the affected records helps us
                    move fast.
                  </li>
                </ul>
                <p>
                  Please raise it within <strong>30 days</strong> of the
                  delivery or invoice date, while the run is still fresh enough
                  for us to investigate properly.
                </p>
                <p>
                  We acknowledge every request within one business day and aim
                  to reach a decision within five.
                </p>
              </section>

              <section id="s-timing">
                <div className="prose-num">07 · Timing &amp; method</div>
                <h2>Getting your money back.</h2>
                <p>
                  Approved refunds are issued to the original payment method —
                  if you paid by card, it goes back to that card. We can&apos;t
                  redirect a refund to a different account.
                </p>
                <p>
                  We process approved refunds within{" "}
                  <strong>5 business days</strong>. Depending on your bank or
                  card issuer, it can take a further 5–10 business days to
                  appear on your statement. Refunds are issued in the original
                  currency of the invoice; we aren&apos;t responsible for
                  exchange-rate movement or bank fees between payment and
                  refund.
                </p>
              </section>

              <section id="s-disputes">
                <div className="prose-num">08 · Disputes &amp; chargebacks</div>
                <h2>Talk to us first.</h2>
                <p>
                  If something looks wrong on an invoice, please contact us
                  before raising a dispute with your bank or card issuer.
                  Almost every billing question we&apos;ve had was resolved by
                  email in under a day, and a chargeback simply makes that
                  slower for both of us.
                </p>
                <p>
                  If a dispute is opened, we&apos;ll respond with the SOW,
                  delivery records, and usage logs for the period in question.
                  Disputes that can&apos;t be settled directly are handled under
                  the dispute-resolution terms in our{" "}
                  <Link href="/terms">Terms of service</Link>.
                </p>
              </section>

              <section id="s-contact">
                <div className="prose-num">09 · Contact us</div>
                <h2>Questions about a charge?</h2>
                <p>
                  We&apos;d rather hear from you early than late. Any billing
                  question, however small:
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
                    Not sure what you were billed for?
                  </span>
                  <h3>
                    Send us the invoice —{" "}
                    <em>we&apos;ll walk you through it.</em>
                  </h3>
                  <p>
                    Every invoice is backed by usage logs we&apos;re happy to
                    share. If the numbers don&apos;t add up, we want to know.
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
