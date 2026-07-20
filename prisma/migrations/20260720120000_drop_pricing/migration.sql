-- Drop our own per-1,000 pricing columns.
--
-- Pricing now lives on the API key inside each service's own backend (the
-- Shopee orchestrator reports it as `pricing` on /me/usage), so keeping a second
-- copy here only invited the two to disagree. Superseded 20260720080000_pricing,
-- which was live for a few hours; the only value ever stored was re-entered on
-- the orchestrator, so nothing is lost.

ALTER TABLE "ClientService" DROP COLUMN IF EXISTS "pricePer1000";

ALTER TABLE "Service" DROP COLUMN IF EXISTS "pricePer1000";
