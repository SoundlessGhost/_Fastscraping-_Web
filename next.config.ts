import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Force HTTPS for a year. includeSubDomains covers every *.fastscraping.com —
  // safe because they're all served by the same Caddy (auto-HTTPS); it does NOT
  // touch the bare-IP backends. `preload` is intentionally omitted (it's a hard
  // commitment that requires submitting to the browser preload list).
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  // Ships a self-contained server with only the modules it actually imports,
  // so the container doesn't carry all of node_modules.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Oct 2026 redesign folded the old multi-page marketing site into
  // Home / APIs / Solutions / Pricing / Contact. Old URLs keep working.
  async redirects() {
    return [
      { source: "/solution/web-data-apis", destination: "/apis", permanent: true },
      { source: "/solution/:slug*", destination: "/solutions", permanent: true },
      { source: "/services", destination: "/solutions", permanent: true },
      { source: "/industries", destination: "/solutions", permanent: true },
      { source: "/about", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
