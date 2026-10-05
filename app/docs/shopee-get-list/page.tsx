import type { Metadata } from "next";
import Script from "next/script";
import { withShareCard } from "@/lib/seo";
import { DOC_CSS, DOC_HTML, DOC_JS } from "@/lib/docs/shopee-get-list-doc";

export const metadata: Metadata = withShareCard({
  title: "Shopee Item Sold API (get_list) Docs",
  description:
    "Exact sold counts per Shopee Vietnam listing: lifetime, merged and 30-day sold, price and stock. Jobs of 300 to 1,000 items, $3 per 1,000 items returned.",
  alternates: { canonical: "/docs/shopee-get-list" },
});

/// The Shopee Item Sold API (get_list jobs) reference. Content is generated from the standalone reference by
/// scripts/gen_getlist_doc.py, scoped under .apidoc so its styles never leak into the rest of the site.
export default function ShopeeGetListDocs() {
  return (
    <div className="apidoc-host">
      <style dangerouslySetInnerHTML={{ __html: DOC_CSS }} />
      <div className="apidoc" dangerouslySetInnerHTML={{ __html: DOC_HTML }} />
      <Script id="getlist-doc-js" strategy="afterInteractive">
        {DOC_JS}
      </Script>
    </div>
  );
}
