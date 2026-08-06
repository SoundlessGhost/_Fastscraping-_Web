-- Verification (OTP) codes pulled from the central mailbox for the Temu-codes
-- dashboard. De-duped by the email Message-ID.

CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "fromAddr" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OtpCode_messageId_key" ON "OtpCode"("messageId");

CREATE INDEX "OtpCode_receivedAt_idx" ON "OtpCode"("receivedAt");
