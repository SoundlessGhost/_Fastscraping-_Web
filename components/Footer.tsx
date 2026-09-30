"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { isAppRoute, scrollShellTop } from "@/lib/chrome";
import { COMPANY, COMPANY_ADDRESS_LINE } from "@/lib/company";

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
              After years of building web scrapers — and fighting proxies,
              headless browsers and CAPTCHAs to keep them running — we built
              Fastscraping to handle all of it for you. Tell us the site and the
              fields you need, and we deliver clean, structured data at any scale.
            </p>
            <div className="social-links">
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
              <a
                href={COMPANY.discord}
                className="discord"
                aria-label="Discord"
                title="Discord"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.291.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Solutions</h4>
            <ul>
              <li><Link href="/solutions#pricing-intelligence">Pricing intelligence</Link></li>
              <li><Link href="/solutions#web-data-apis">Web data APIs</Link></li>
              <li><Link href="/solutions#data-pipelines">Custom data pipelines</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/services">Services</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><Link href="/terms">Terms of Use</Link></li>
              <li><Link href="/privacy">Privacy and Cookies Policy</Link></li>
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
