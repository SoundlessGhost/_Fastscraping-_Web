/// The legal entity behind Fastscraping, in one place.
///
/// Fastscraping is the trading name; the contracting party is a Wyoming LLC
/// (Certificate of Organization filed 10 Aug 2026, WY SOS ID 2026-002051778).
/// The registered address is the company's registered-agent office, which is
/// also its mailing and principal office address on the filing.
///
/// The delivery team works from Bangladesh. Both facts are stated publicly on
/// purpose: the US entity is who you contract and pay, and GDPR requires us to
/// be straight about where data is actually processed. Never quietly drop the
/// second half to make the first look tidier.
export const COMPANY = {
  /// Brand / trading name — what the site calls itself everywhere.
  name: "Fastscraping",
  /// Registered legal name — use in contracts, invoices, and legal pages.
  legalName: "Fast Scraping LLC",
  entityType: "Limited Liability Company",
  jurisdiction: "Wyoming, United States",
  filingId: "2026-002051778",

  address: {
    street: "30 N Gould St, Ste R",
    city: "Sheridan",
    region: "WY",
    postalCode: "82801",
    country: "United States",
    countryCode: "US",
  },

  /// Where the people are. Stated openly — see the note above.
  operations: {
    city: "Sirajganj",
    region: "Rajshahi",
    country: "Bangladesh",
    timezone: "GMT+6",
  },

  email: "khalid@fastscraping.com",
  whatsapp: "+880 1788 791 134",
  /// US line, shown in the footer — payment reviewers asked for one.
  phone: "+1 (424) 483-3262",
  /// The company LinkedIn page — the footer links here.
  linkedin: "https://www.linkedin.com/company/fastscraping/",
  /// The community Discord invite — the footer links here.
  discord: "https://discord.gg/jCTCDVZxfB",
} as const;

/// "+14244833262" — COMPANY.phone in dialable form, for tel: links and JSON-LD.
export const COMPANY_PHONE_E164 = COMPANY.phone.replace(/[^\d+]/g, "");

/// "30 N Gould St, Ste R, Sheridan, WY 82801, United States"
export const COMPANY_ADDRESS_LINE = `${COMPANY.address.street}, ${COMPANY.address.city}, ${COMPANY.address.region} ${COMPANY.address.postalCode}, ${COMPANY.address.country}`;

/// "Fast Scraping LLC · 30 N Gould St, Ste R, Sheridan, WY 82801, United States"
export const COMPANY_LEGAL_LINE = `${COMPANY.legalName} · ${COMPANY_ADDRESS_LINE}`;
