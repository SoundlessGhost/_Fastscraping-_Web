-- Client invoices for scraping usage.
--
-- Displayed at /invoice/{id}/{token}; the token is an unguessable secret so the
-- URL is safe to share. Payment is a link to an SSLCommerz page the admin sets.

CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PAID');

CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "clientAddress" TEXT,
    "items" JSONB NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentUrl" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");
