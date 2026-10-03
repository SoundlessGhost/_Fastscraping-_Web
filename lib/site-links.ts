/// Links the marketing site repeats in many places. One source, so changing
/// the booking page or a nav label is a one-line edit.
export const BOOK_CALL_URL =
  "https://calendly.com/khalid-fastscraping/data-strategy-call-with-khalid";

/// Self-serve signup lives in the app (the login page switches to sign-up).
export const TRIAL_URL = "/dashboard/login";

export const MAIN_NAV = [
  { href: "/apis", label: "APIs" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
] as const;

export const LEGAL_NAV = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/refund", label: "Refund & Cancellation" },
  { href: "/privacy", label: "Privacy & Cookies" },
  { href: "/compliance", label: "Acceptable Use" },
] as const;

