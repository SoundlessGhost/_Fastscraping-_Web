-- Per-1,000-request pricing, so the dashboard can show an estimated cost.
--
-- Two levels: a default on the service, and a per-client override on the link
-- (rates are negotiated client by client). Both nullable — a service with no
-- price simply shows no cost. A backend that reports its own `pricing` in
-- /me/usage takes precedence over either.

ALTER TABLE "Service" ADD COLUMN "pricePer1000" DOUBLE PRECISION;

ALTER TABLE "ClientService" ADD COLUMN "pricePer1000" DOUBLE PRECISION;
