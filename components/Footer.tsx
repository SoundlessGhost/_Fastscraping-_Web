"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { isAppRoute, scrollShellTop } from "@/lib/chrome";
import { COMPANY, COMPANY_ADDRESS_LINE, COMPANY_PHONE_E164 } from "@/lib/company";

export default function Footer() {
  const pathname = usePathname();
  if (isAppRoute(pathname)) return null;
  const scrollTopIfHome = (e: MouseEvent<HTMLAnchorElement>) => {
    // The shell scrolls in .site-scroll, not window — see scrollShellTop.
    if (pathname === "/") {
      e.preventDefault();
      scrollShellTop();
    }
  };
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="brand" onClick={scrollTopIfHome}>
              <span className="brand-mark">f</span>
              <span>Fastscraping</span>
            </Link>
            <p>
              Your web scraping team on demand. Structured public web data at scale — no infrastructure, no firefighting, no hassles.
            </p>
            <a href={`tel:${COMPANY_PHONE_E164}`} className="phone">
              {COMPANY.phone}
            </a>
            <div className="social-links">
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${COMPANY.email}`}
                className="gmail"
                aria-label={`Email ${COMPANY.email}`}
                title={COMPANY.email}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                </svg>
              </a>
              <a
                href={COMPANY.linkedin}
                className="linkedin"
                aria-label="LinkedIn"
                title="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Solutions</h4>
            <ul>
              <li><Link href="/solutions#pricing-intelligence">Pricing intelligence</Link></li>
              <li><Link href="/solutions#marketplace-intelligence">Marketplace intelligence</Link></li>
              <li><Link href="/solutions#job-market">Job market insights</Link></li>
              <li><Link href="/solutions#linkedin-data">LinkedIn data platform</Link></li>
              <li><Link href="/solutions#web-data-apis">Web data APIs</Link></li>
              <li><Link href="/solutions#data-pipelines">Data pipelines &amp; ETL</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Industries</h4>
            <ul>
              <li><Link href="/industries#i-retail">E-commerce &amp; retail</Link></li>
              <li><Link href="/industries#i-realestate">Real estate</Link></li>
              <li><Link href="/industries#i-talent">Talent &amp; recruitment</Link></li>
              <li><Link href="/industries#i-ticketing">Ticketing &amp; events</Link></li>
              <li><Link href="/industries#i-food">Food delivery</Link></li>
              <li><Link href="/industries#i-ai">AI &amp; machine learning</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/services">Services</Link></li>
              <li><Link href="/case-studies">Case studies</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><a href={COMPANY.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/compliance">Compliance</Link></li>
              <li><Link href="/refund">Refunds</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-base">
          {/* The page is prerendered, so the server stamps whatever year it was
              built in. This is a client component, so the browser re-renders the
              real year on hydration and a stale copyright can't outlive New
              Year's Day waiting for the next deploy — suppressHydrationWarning
              because that difference is the point, not a bug. */}
          {/* One line: the registered address earns its place here more than
              "All rights reserved" did — copyright holds without asserting it. */}
          <div>
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {COMPANY.legalName} ·{" "}
            {COMPANY_ADDRESS_LINE}
          </div>
          {/* Short on purpose: the registered address opposite is the long half,
              and both must stay on one line. Where the team actually sits is
              disclosed in the privacy policy, which is where GDPR wants it. */}
          <div>Built for data teams</div>
        </div>
      </div>
    </footer>
  );
}
