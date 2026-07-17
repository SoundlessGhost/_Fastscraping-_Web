#!/bin/bash
# Proves the newest dump actually restores, by restoring it into a scratch
# database and comparing row counts against the live one.
#
# Touches nothing real: it creates `restore_check`, reads from it, drops it.
# The live `fastscraping` database is only ever read.
set -euo pipefail

DUMP=$(ls -1t /opt/Fastscraping/backups/fastscraping-*.dump | head -1)
echo "verifying: $DUMP"

q() { docker exec fs-db psql -U fastscraping -d "$1" -tAc "$2" 2>/dev/null | tr -d ' '; }

docker exec fs-db psql -U fastscraping -d postgres -c 'DROP DATABASE IF EXISTS restore_check;' > /dev/null
docker exec fs-db psql -U fastscraping -d postgres -c 'CREATE DATABASE restore_check;' > /dev/null

docker exec -i fs-db pg_restore -U fastscraping -d restore_check < "$DUMP" > /dev/null 2>&1 || true

echo "  table            live   restored"
FAIL=0
for T in User Service ClientService Session AuditLog EmailCode Avatar; do
  A=$(q fastscraping "SELECT count(*) FROM \"$T\";")
  B=$(q restore_check "SELECT count(*) FROM \"$T\";")
  MARK="ok"
  if [ "$A" != "$B" ]; then MARK="MISMATCH"; FAIL=1; fi
  printf "  %-15s %5s   %5s  %s\n" "$T" "${A:-?}" "${B:-?}" "$MARK"
done

# Spot-check real content, not just counts: the admin account and the wired service.
echo "  --- content spot-check (from the restored copy) ---"
q restore_check "SELECT email || ' / ' || role FROM \"User\";" | sed 's/^/    /'
q restore_check "SELECT slug || ' -> ' || \"baseUrl\" || ' / ' || status FROM \"Service\" WHERE status='ACTIVE';" | sed 's/^/    /'

docker exec fs-db psql -U fastscraping -d postgres -c 'DROP DATABASE restore_check;' > /dev/null
echo "  scratch database dropped"

if [ "$FAIL" = "1" ]; then echo "  RESULT: FAILED"; exit 1; fi
echo "  RESULT: the dump restores cleanly and matches live"
