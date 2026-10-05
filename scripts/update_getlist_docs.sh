#!/usr/bin/env bash
# Publish the Shopee Item Sold API (get_list jobs) docs to https://www.fastscraping.com/docs/shopee-get-list
#
# SOURCE OF TRUTH: /opt/getpc_docs/get_list.html on the getpc server 169.58.203.69 (a copy of
# handoff/getlist_api/docs/get_list.html in the Shopee project; it says <BASE_URL>, the generator puts the real
# base URL in). Edit THAT file, then run this script from Git Bash:
#
#   cd "/c/Users/shawo/OneDrive/Desktop/Fast Scraping/website/fastscraping-web"
#   bash scripts/update_getlist_docs.sh            # build + deploy + push
#   bash scripts/update_getlist_docs.sh --dry-run  # only regenerate + build locally
#
# Same steps as update_shopee_docs.sh: fetch -> scripts/gen_getlist_doc.py -> next build -> commit -> deploy to the
# website server 89.117.59.90 (previous image tagged for rollback) -> push to GitHub (redesign-ultraviolet and main).
set -euo pipefail
cd "$(dirname "$0")/.."

DOCS_HOST=root@169.58.203.69
SITE_HOST=root@89.117.59.90
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "1/5 fetching source page from the getpc server"
scp -q "$DOCS_HOST:/opt/getpc_docs/get_list.html" "$TMP/get_list.html"

echo "2/5 generating lib/docs/shopee-get-list-doc.ts"
PYTHONIOENCODING=utf-8 python scripts/gen_getlist_doc.py "$TMP/get_list.html"
if grep -q "169\.58\." lib/docs/shopee-get-list-doc.ts; then echo "ERROR: server IP leaked into the docs"; exit 1; fi

echo "3/5 building"
npx next build >"$TMP/build.log" 2>&1 || { tail -30 "$TMP/build.log"; exit 1; }

if [ "${1:-}" = "--dry-run" ]; then echo "dry run: built OK, nothing deployed"; exit 0; fi

if git diff --quiet -- lib/docs/shopee-get-list-doc.ts; then
  echo "docs unchanged, nothing to deploy"; exit 0
fi

echo "4/5 committing and deploying"
git add lib/docs/shopee-get-list-doc.ts scripts/gen_getlist_doc.py
git commit -q -m "Docs: update Shopee Item Sold API reference"
REV=$(git rev-parse --short HEAD)
git archive --format=tar.gz -o "$TMP/rel.tgz" HEAD
scp -q "$TMP/rel.tgz" "$SITE_HOST:/tmp/fs-rel.tgz"
ssh "$SITE_HOST" "set -e; cd /opt/Fastscraping
  docker tag fastscraping-app:latest fastscraping-app:before-$REV
  rm -rf /tmp/fs-new && mkdir /tmp/fs-new && tar xzf /tmp/fs-rel.tgz -C /tmp/fs-new
  rsync -a --exclude .env --exclude '.env.*' --exclude 'backup*' --exclude lib/generated /tmp/fs-new/ /opt/Fastscraping/
  docker compose build fs-app >/dev/null
  docker compose up -d fs-app >/dev/null
  sleep 12; docker compose ps fs-app --format '{{.Status}}'"
code=$(curl -s -o /dev/null -w '%{http_code}' https://www.fastscraping.com/docs/shopee-get-list)
echo "live check: /docs/shopee-get-list -> $code"
[ "$code" = "200" ] || { echo "ROLLBACK: ssh $SITE_HOST 'cd /opt/Fastscraping && docker tag fastscraping-app:before-$REV fastscraping-app:latest && docker compose up -d --no-build fs-app'"; exit 1; }

echo "5/5 pushing to GitHub"
git push -q origin HEAD:redesign-ultraviolet
git push -q origin HEAD:main
echo "done: $REV live at https://www.fastscraping.com/docs/shopee-get-list"
