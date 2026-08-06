-- Optional USD->BDT rate per invoice, for the "Convert to BDT" line on the
-- public invoice page. Null = no conversion shown.

ALTER TABLE "Invoice" ADD COLUMN "bdtRate" DOUBLE PRECISION;
