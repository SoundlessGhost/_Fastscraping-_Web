import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";
import LegalDoc from "@/components/brand/LegalDoc";
import { LEGAL_TERMS } from "@/lib/legal/content";

export const metadata: Metadata = withShareCard({
  title: "Terms of Service",
  description: "Terms for Fastscraping web data APIs, custom scrapers, managed pipelines and datasets: billing per successful request, data licence, liability and disputes.",
  alternates: { canonical: "/terms" },
});

export default function Page() {
  return <LegalDoc current="/terms" title={"Terms of Service"} html={LEGAL_TERMS} />;
}
