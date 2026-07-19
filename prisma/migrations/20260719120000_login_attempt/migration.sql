-- Failed-login ledger for rate limiting.
--
-- One row per failed login attempt, keyed by "email:<addr>" and "ip:<addr>" so
-- we can throttle both a single account being brute-forced and one source
-- spraying many accounts. Rows age out of a short window and are pruned
-- opportunistically, keeping the table small without a cron.

CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LoginAttempt_key_createdAt_idx" ON "LoginAttempt"("key", "createdAt");

CREATE INDEX "LoginAttempt_createdAt_idx" ON "LoginAttempt"("createdAt");
