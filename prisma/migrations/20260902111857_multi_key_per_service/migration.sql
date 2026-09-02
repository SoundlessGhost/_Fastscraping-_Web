-- DropIndex
DROP INDEX "ClientService_userId_idx";

-- DropIndex
DROP INDEX "ClientService_userId_serviceId_key";

-- CreateIndex
CREATE INDEX "ClientService_userId_serviceId_idx" ON "ClientService"("userId", "serviceId");
