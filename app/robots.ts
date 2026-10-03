import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/admin", "/settings", "/codes", "/invoice"],
      },
    ],
    sitemap: "https://www.fastscraping.com/sitemap.xml",
    host: "https://www.fastscraping.com",
  };
}
