import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";
import DocScript from "@/components/docs/DocScript";
import { DOC_CSS, DOC_HTML, DOC_JS } from "@/lib/docs/shopee-cbc-doc";

export const metadata: Metadata = withShareCard({
  title: "Shopee Listings API (CBC) Docs",
  description:
    "Shopee category, search, brand, shop and collection pages as JSON: 60 products per page with price, sold counts and rating, billed per page with products.",
  alternates: { canonical: "/docs/shopee-cbc" },
});

/// The Shopee Listings API (POST /cbc) reference. Content is generated from the standalone reference by
/// scripts/gen_cbc_doc.py, scoped under .apidoc so its styles never leak into the rest of the site.
export default function ShopeeCbcDocs() {
  return (
    <div className="apidoc-host">
      <style dangerouslySetInnerHTML={{ __html: DOC_CSS }} />
      <div className="apidoc" dangerouslySetInnerHTML={{ __html: DOC_HTML }} />
      <DocScript code={DOC_JS} />
    </div>
  );
}
