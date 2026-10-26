-- Tag each OTP row with the central inbox it arrived through, so a second
-- cPanel source (Leadconnect) can be shown as its own brand without relying on
-- per-message sender rules. Existing rows came through the cloakfetch relay.
ALTER TABLE "OtpCode" ADD COLUMN "inbox" TEXT NOT NULL DEFAULT 'cloakfetch';

CREATE INDEX "OtpCode_inbox_receivedAt_idx" ON "OtpCode" ("inbox", "receivedAt");
