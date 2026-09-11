import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReset from "@/components/ScrollReset";
import { COMPANY, COMPANY_PHONE_E164 } from "@/lib/company";
import "./styles/base.css";
import "./globals.css";
import "./styles/nav-mobile.css";

const SITE_URL = "https://www.fastscraping.com";

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--next-font-geist",
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--next-font-geist-mono",
  display: "swap",
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--next-font-instrument-serif",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Fastscraping — Your web scraping team on demand",
    template: "%s · Fastscraping",
  },
  description:
    "Managed web data extraction service. We build, run and maintain the pipelines that keep public web data flowing reliably — clean structured data delivered to your API, warehouse or S3.",
  applicationName: "Fastscraping",
  authors: [{ name: "Md Khalid Mahmud Shawon", url: SITE_URL }],
  creator: "Md Khalid Mahmud Shawon",
  publisher: "Fastscraping",
  keywords: [
    "web scraping",
    "web data extraction",
    "enterprise data collection",
    "public web data",
    "managed data pipelines",
    "data as a service",
    "structured web data",
    "data pipelines",
    "ETL",
    "LinkedIn data",
    "pricing intelligence",
    "marketplace intelligence",
    "job market data",
    "web data API",
    "large-scale data collection",
    "headless browser",
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
    title: "Fastscraping — Your web scraping team on demand",
    description:
      "Structured public web data, delivered reliably at any scale — pipelines we build, run and maintain for you.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fastscraping — Your web scraping team on demand",
    description:
      "Structured public web data, delivered reliably at any scale — pipelines we build, run and maintain for you.",
    creator: "@fastscraping",
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
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    // A real file in public/, not app/apple-icon.svg: Next builds a route for
    // icon.svg but not for apple-icon.svg, so that path 404'd and iOS had no
    // home-screen icon. PNG also because Google will not take an SVG for the
    // structured-data logo below, and one file should serve both.
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
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
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#131613" },
  ],
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: COMPANY.name,
  legalName: COMPANY.legalName,
  alternateName: "Fastscraping — Your web scraping team on demand",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  email: COMPANY.email,
  telephone: COMPANY_PHONE_E164,
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
  // The organisation's own profiles. The founder's personal LinkedIn belongs on
  // `founder` above, not here.
  sameAs: [
    COMPANY.linkedin,
    "https://upwork.com/freelancers/khalidalsaba",
  ],
  description:
    "Managed enterprise web data extraction for data teams, AI companies and agencies. Public data only, custom pipelines, white-label delivery.",
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Fastscraping",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const fontClass = `${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-accent="emerald" className={fontClass}>
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
