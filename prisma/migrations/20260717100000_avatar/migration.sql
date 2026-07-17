-- Profile pictures.
--
-- The bytes live in their own table so a plain User lookup (which happens on
-- every request, to resolve the session) never carries an image with it.

ALTER TABLE "User" ADD COLUMN "avatarUpdatedAt" TIMESTAMP(3);

CREATE TABLE "Avatar" (
    "userId" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avatar_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "Avatar"
  ADD CONSTRAINT "Avatar_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
