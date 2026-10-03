"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isAppRoute } from "@/lib/chrome";
import { COMPANY, COMPANY_ADDRESS_LINE, COMPANY_PHONE_E164 } from "@/lib/company";
import { BOOK_CALL_URL, LEGAL_NAV } from "@/lib/site-links";
import BrandMark from "@/components/brand/BrandMark";

export default function Footer() {
  const pathname = usePathname();
  if (isAppRoute(pathname)) return null;
  const year = new Date().getFullYear();
  return (
    <footer className="fsx-foot">
      <div className="fsx-wrap">
        <div className="fsx-foot-col" style={{ maxWidth: 380 }}>
          <Link href="/" className="fsx-brand" aria-label="Fastscraping home" style={{ color: "#fff" }}>
            <BrandMark size={28} />
            <span>fastscraping</span>
          </Link>
          <span>Web data APIs and managed pipelines for e-commerce and pricing intelligence.</span>
          <span>
            {COMPANY.legalName} · {COMPANY_ADDRESS_LINE}
          </span>
          <span>US-registered, engineering team in Bangladesh.</span>
          <span>
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> ·{" "}
            <a href={`tel:${COMPANY_PHONE_E164}`}>{COMPANY.phone}</a>
          </span>
        </div>
        <div className="fsx-foot-cols">
          <div className="fsx-foot-col">
            <h4>Product</h4>
            <Link href="/apis">Web Data APIs</Link>
            <Link href="/solutions">Solutions</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/dashboard/login">Log in</Link>
          </div>
          <div className="fsx-foot-col">
            <h4>Company</h4>
            <Link href="/contact">Contact</Link>
            <a href={BOOK_CALL_URL} target="_blank" rel="noopener">
              Book a call
            </a>
            <a href={COMPANY.linkedin} target="_blank" rel="noopener">
              LinkedIn
            </a>
            <a href={COMPANY.discord} target="_blank" rel="noopener">
              Discord
            </a>
          </div>
          <div className="fsx-foot-col">
            <h4>Legal</h4>
            {LEGAL_NAV.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="fsx-foot-base">
        <div className="fsx-wrap">
          © {year} {COMPANY.legalName}. Not affiliated with Shopee, Grab or any other platform named on this site; their names identify data sources only.
        </div>
      </div>
    </footer>
  );
}
