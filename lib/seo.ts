import type { Metadata } from "next";

// Shared share-card metadata.
//
// A page that declares its own `openGraph` **replaces** the root layout's
// rather than merging into it. Every marketing page set a custom og:title, and
// so silently dropped the share image, site name and locale along with it —
// leaving sixteen pages that render as a bare link when someone shares them,
// while still claiming `twitter:card=summary_large_image`.
//
// `withShareCard` puts those shared parts back underneath whatever the page
// says, so a page can override any of them but can never lose them by omission.

export const SITE_URL = "https://www.fastscraping.com";

/// The site's share card, drawn by app/opengraph-image.tsx. Referenced by path
/// so there is one image to change, and `metadataBase` in the root layout turns
/// it into the absolute URL the scrapers require.
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Fastscraping — Web data at scale for e-commerce market intelligence",
};

/// Wraps a page's metadata so it keeps the share card, site name, locale and
/// handle. The page's own values are spread last and therefore win — this only
/// fills in what the page didn't say.
export function withShareCard(meta: Metadata): Metadata {
  return {
    ...meta,
    openGraph: {
      type: "website",
      siteName: "Fastscraping",
      ...(typeof meta.alternates?.canonical === "string" ? { url: meta.alternates.canonical } : {}),
      locale: "en_US",
      images: [OG_IMAGE],
      ...meta.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      images: [OG_IMAGE],
      ...meta.twitter,
    },
  };
}
