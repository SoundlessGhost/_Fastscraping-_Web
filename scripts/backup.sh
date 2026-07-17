#!/bin/bash
# Nightly backup of the Fastscraping database.
#
# Dumps from inside the fs-db container to /opt/Fastscraping/backups on the
# host, so a dump survives the container and its volume being destroyed.
#
# Custom format (-Fc): compressed, and pg_restore can pull a single table out
# of it rather than forcing an all-or-nothing restore.
#
# Restore:
#   docker exec -i fs-db pg_restore -U fastscraping -d fastscraping --clean \
#     --if-exists < /opt/Fastscraping/backups/<file>.dump
set -euo pipefail

DIR=/opt/Fastscraping/backups
KEEP_DAYS=14
STAMP=$(date -u +%Y-%m-%d_%H%M)
OUT="$DIR/fastscraping-$STAMP.dump"

echo "[$(date -u +'%F %T') UTC] starting"

if ! docker inspect -f '{{.State.Running}}' fs-db 2>/dev/null | grep -q true; then
  echo "  ERROR: fs-db is not running — no backup taken"
  exit 1
fi

# -Fc writes to stdout; capture on the host so we never depend on the volume.
docker exec fs-db pg_dump -U fastscraping -d fastscraping -Fc > "$OUT.part"

# A dump that cannot be listed is not a backup. Check before it counts as one.
if ! docker exec -i fs-db pg_restore -l < "$OUT.part" > /dev/null 2>&1; then
  echo "  ERROR: dump failed verification — keeping it as $OUT.bad for inspection"
  mv "$OUT.part" "$OUT.bad"
  exit 1
fi

mv "$OUT.part" "$OUT"
SIZE=$(du -h "$OUT" | cut -f1)
TABLES=$(docker exec -i fs-db pg_restore -l < "$OUT" | grep -c "TABLE DATA" || true)
echo "  ok: $OUT ($SIZE, $TABLES tables with data)"

# Prune old dumps, but never the last one — if backups have been failing for a
# fortnight, the newest is all there is and deleting it would be the last straw.
NEWEST=$(ls -1t "$DIR"/fastscraping-*.dump 2>/dev/null | head -1 || true)
find "$DIR" -name 'fastscraping-*.dump' -mtime "+$KEEP_DAYS" ! -path "$NEWEST" -print -delete \
  | sed 's/^/  pruned: /' || true

echo "  kept: $(ls -1 "$DIR"/fastscraping-*.dump 2>/dev/null | wc -l) dumps, $(du -sh "$DIR" | cut -f1) total"
