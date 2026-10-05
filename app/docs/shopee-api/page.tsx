import type { Metadata } from "next";
import Script from "next/script";
import { withShareCard } from "@/lib/seo";
import { DOC_CSS, DOC_HTML, DOC_JS } from "@/lib/docs/shopee-api-doc";

export const metadata: Metadata = withShareCard({
  title: "Shopee Product API Docs",
  description:
    "API reference for the Shopee Product API: submit a product, poll the job, read price, stock, variants, sold count and shop data for 8 Shopee markets.",
  alternates: { canonical: "/docs/shopee-api" },
});

/// The Shopee Product API reference. Content is generated from the standalone
/// reference by scripts/gen_shopee_doc.py, scoped under .apidoc so its styles
/// never leak into the rest of the site.
export default function ShopeeApiDocs() {
  return (
    <div className="apidoc-host">
      <style dangerouslySetInnerHTML={{ __html: DOC_CSS }} />
      <div className="apidoc" dangerouslySetInnerHTML={{ __html: DOC_HTML }} />
      <Script id="apidoc-js" strategy="afterInteractive">
        {DOC_JS}
      </Script>
    </div>
  );
}
