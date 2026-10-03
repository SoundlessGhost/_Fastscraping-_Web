import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReset from "@/components/ScrollReset";
import { COMPANY } from "@/lib/company";
import "./styles/base.css";
import "./globals.css";
import "./styles/nav-mobile.css";
import "./styles/brand.css";

const SITE_URL = "https://www.fastscraping.com";




// Marketing site (Oct 2026 Ultraviolet redesign): Manrope for text, JetBrains
// Mono for code. Scoped through --next-font-manrope / --next-font-jetbrains in
// styles/brand.css so the app shells keep their own type.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--next-font-manrope",
  display: "swap",
  preload: true,
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--next-font-jetbrains",
  display: "swap",
  preload: false,
});



export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Fastscraping — Web data at scale for e-commerce intelligence",
    template: "%s · Fastscraping",
  },
  description:
    "Scraping APIs and anti-bot infrastructure for e-commerce market intelligence: Shopee data in 8 markets with per-variant prices, stock and sold counts.",
  applicationName: "Fastscraping",
  authors: [{ name: "Md Khalid Mahmud Shawon", url: SITE_URL }],
  creator: "Md Khalid Mahmud Shawon",
  publisher: "Fastscraping",
  keywords: [
    "web scraping API",
    "Shopee API",
    "Shopee product data",
    "Shopee scraper",
    "e-commerce market intelligence",
    "pricing intelligence",
    "price monitoring",
    "marketplace data",
    "restaurant menu data",
    "real estate data API",
    "digital shelf data",
    "managed data pipelines",
    "data as a service",
    "custom web scraper",
    "Fastscraping",
  ],
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Fastscraping",
    title: "Fastscraping — Web data at scale for e-commerce intelligence",
    description:
      "Scraping APIs and anti-bot infrastructure for e-commerce market intelligence: Shopee data in 8 markets with per-variant prices, stock and sold counts.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fastscraping — Web data at scale for e-commerce intelligence",
    description:
      "Scraping APIs and anti-bot infrastructure for e-commerce market intelligence: Shopee data in 8 markets with per-variant prices, stock and sold counts.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Versioned file names: browsers cache favicons by URL for a long time, so
  // the old "f" icon kept showing after the Oct 2026 rebrand under /icon.svg.
  icons: {
    icon: [
      { url: "/icon-v2.svg", type: "image/svg+xml" },
      { url: "/favicon-v2.ico", sizes: "any" },
    ],
    shortcut: [{ url: "/favicon-v2.ico" }],
    // A real file in public/, not app/apple-icon.svg: Next builds a route for
    // icon.svg but not for apple-icon.svg, so that path 404'd and iOS had no
    // home-screen icon. PNG also because Google will not take an SVG for the
    // structured-data logo below, and one file should serve both.
    apple: [{ url: "/apple-icon-v2.png", type: "image/png", sizes: "180x180" }],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#16131f" },
  ],
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: COMPANY.name,
  legalName: COMPANY.legalName,
  alternateName: "Fastscraping — Web data at scale",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  email: COMPANY.email,
  foundingDate: "2023",
  founder: {
    "@type": "Person",
    name: "Md Khalid Mahmud Shawon",
    jobTitle: "Founder",
    sameAs: [
      "https://linkedin.com/in/md-khalid-mahmud-shawon",
      "https://upwork.com/freelancers/khalidalsaba",
    ],
  },
  // Registered address of the LLC. The delivery team sits in Bangladesh — that
  // is the areaServed/location below, not a second postal address.
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY.address.street,
    addressLocality: COMPANY.address.city,
    addressRegion: COMPANY.address.region,
    postalCode: COMPANY.address.postalCode,
    addressCountry: COMPANY.address.countryCode,
  },
  location: {
    "@type": "Place",
    name: "Operations",
    address: {
      "@type": "PostalAddress",
      addressLocality: COMPANY.operations.city,
      addressRegion: COMPANY.operations.region,
      addressCountry: "BD",
    },
  },
  sameAs: [
    COMPANY.linkedin,
    "https://linkedin.com/in/md-khalid-mahmud-shawon",
    "https://upwork.com/freelancers/khalidalsaba",
  ],
  description:
    "Scraping APIs and anti-bot infrastructure powering e-commerce market intelligence: Shopee product data across 8 markets, Temu, Swiss real-estate APIs, custom scrapers and managed data pipelines. Public data only.",
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Fastscraping",
  url: SITE_URL,
};

const fontClass = `${manrope.variable} ${jetbrains.variable}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-accent="violet" className={fontClass}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
      </head>
      <body>
        <ScrollReset />
        <Header />
        {/* App-shell scroll: the header is the fixed top of a flex column and
            everything below scrolls in here, so the scrollbar starts under the
            header (LinkedIn-style). On app routes Header/Footer render null and
            the dashboard's own .ds fills this region. */}
        <div className="site-scroll">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
