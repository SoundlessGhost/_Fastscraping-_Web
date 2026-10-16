-- Store the full email HTML for mailbox-style brands (Shopee), so the dashboard
-- can show the whole message in a reading pane. Nullable: code-only brands
-- (Temu, Indeed) leave it empty.
ALTER TABLE "OtpCode" ADD COLUMN "body" TEXT;
