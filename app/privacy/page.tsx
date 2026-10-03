import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";
import LegalDoc from "@/components/brand/LegalDoc";
import { LEGAL_PRIVACY } from "@/lib/legal/content";

export const metadata: Metadata = withShareCard({
  title: "Privacy & Cookies Policy",
  description: "What personal data Fastscraping LLC collects, why, which processors handle it, how long it is kept and how to exercise your GDPR and CCPA rights.",
  alternates: { canonical: "/privacy" },
});

export default function Page() {
  return <LegalDoc current="/privacy" title={"Privacy & Cookies Policy"} html={LEGAL_PRIVACY} />;
}
