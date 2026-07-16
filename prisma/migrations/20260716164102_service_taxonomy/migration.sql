/*
  Warnings:

  - Added the required column `category` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClientService" ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "authHeader" TEXT NOT NULL DEFAULT 'X-API-Key',
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "endpoint" TEXT,
ADD COLUMN     "platform" TEXT NOT NULL,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usagePath" TEXT NOT NULL DEFAULT '/me/usage';

-- CreateIndex
CREATE INDEX "Service_category_platform_idx" ON "Service"("category", "platform");

-- CreateIndex
CREATE INDEX "Service_status_idx" ON "Service"("status");
