import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";
import LegalDoc from "@/components/brand/LegalDoc";
import { LEGAL_PRIVACY } from "@/lib/legal/content";

export const metadata: Metadata = withShareCard({
  title: "Privacy & Cookies Policy",
  description: "What personal data Fastscraping collects, why, who processes it and your rights.",
  alternates: { canonical: "/privacy" },
});

export default function Page() {
  return <LegalDoc current="/privacy" title={"Privacy & Cookies Policy"} html={LEGAL_PRIVACY} />;
}
