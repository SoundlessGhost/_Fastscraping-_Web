import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";
import LegalDoc from "@/components/brand/LegalDoc";
import { LEGAL_TERMS } from "@/lib/legal/content";

export const metadata: Metadata = withShareCard({
  title: "Terms of Service",
  description: "The terms that govern Fastscraping web data APIs, custom scrapers, pipelines and datasets.",
  alternates: { canonical: "/terms" },
});

export default function Page() {
  return <LegalDoc current="/terms" title={"Terms of Service"} html={LEGAL_TERMS} />;
}
