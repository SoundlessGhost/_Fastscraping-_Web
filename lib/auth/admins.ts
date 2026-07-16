/**
 * Bootstrap admins. Any email listed in ADMIN_EMAILS becomes an ADMIN when it
 * signs up (or on its next login). Additional admins can be promoted later from
 * the admin dashboard — this env var only seeds the first one(s).
 *
 * ADMIN_EMAILS="a@x.com,b@y.com"
 */
export function bootstrapAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isBootstrapAdmin(email: string): boolean {
  return bootstrapAdminEmails().includes(email.trim().toLowerCase());
}
