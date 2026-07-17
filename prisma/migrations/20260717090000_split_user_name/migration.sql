-- Split User.name into firstName / lastName.
--
-- Hand-written rather than auto-generated: the generated version drops "name"
-- outright, which would throw away every existing account's name. This copies
-- the data across first, then drops the old column.
--   "Khalid Mahmud"  -> first "Khalid", last "Mahmud"
--   "Khalid"         -> first "Khalid", last NULL
--   "Md Khalid Shawon" -> first "Md", last "Khalid Shawon"

ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;

UPDATE "User"
SET
  "firstName" = NULLIF(split_part(btrim("name"), ' ', 1), ''),
  "lastName"  = NULLIF(
                  btrim(
                    CASE
                      WHEN strpos(btrim("name"), ' ') = 0 THEN ''
                      ELSE substr(btrim("name"), strpos(btrim("name"), ' ') + 1)
                    END
                  ),
                  ''
                )
WHERE "name" IS NOT NULL AND btrim("name") <> '';

ALTER TABLE "User" DROP COLUMN "name";
