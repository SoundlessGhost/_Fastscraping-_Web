import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";
import LegalDoc from "@/components/brand/LegalDoc";
import { LEGAL_REFUND } from "@/lib/legal/content";

export const metadata: Metadata = withShareCard({
  title: "Refund & Cancellation Policy",
  description: "How refunds, credits, cancellations and payment disputes work for Fastscraping services.",
  alternates: { canonical: "/refund" },
});

export default function Page() {
  return <LegalDoc current="/refund" title={"Refund & Cancellation Policy"} html={LEGAL_REFUND} />;
}
