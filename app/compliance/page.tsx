import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";
import LegalDoc from "@/components/brand/LegalDoc";
import { LEGAL_COMPLIANCE } from "@/lib/legal/content";

export const metadata: Metadata = withShareCard({
  title: "Acceptable Use & Data Compliance",
  description: "What Fastscraping collects, what it refuses, and what clients agree to when using delivered data.",
  alternates: { canonical: "/compliance" },
});

export default function Page() {
  return <LegalDoc current="/compliance" title={"Acceptable Use & Data Compliance"} html={LEGAL_COMPLIANCE} />;
}
