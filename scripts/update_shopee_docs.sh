#!/usr/bin/env bash
# Publish the Shopee Product API docs to https://www.fastscraping.com/docs/shopee-api
#
# SOURCE OF TRUTH: /opt/getpc_docs/index.html on the getpc server 169.58.203.69
# (the standalone reference, also served at :7080). Edit THAT file (add an
# endpoint, change a field, etc.), then run this script from Git Bash:
#
#   cd "/c/Users/shawo/OneDrive/Desktop/Fast Scraping/website/fastscraping-web"
#   bash scripts/update_shopee_docs.sh            # build + deploy + push
#   bash scripts/update_shopee_docs.sh --dry-run  # only regenerate + build locally
#
# What it does: copies the source page down -> scripts/gen_shopee_doc.py rewrites
# it for the site (scoped CSS, brand colours, base URL
# https://shopee-multi-region.fastscraping.com, never a server IP) -> next build ->
# commit -> deploy to the website server 89.117.59.90 (previous image tagged
# for rollback) -> push to GitHub (branch redesign-ultraviolet and main).
#
# If the generator stops with an AssertionError, a wording fix it expects is no
# longer in the source; update the WORDING map in scripts/gen_shopee_doc.py.
set -euo pipefail
cd "$(dirname "$0")/.."

DOCS_HOST=root@169.58.203.69
SITE_HOST=root@89.117.59.90
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "1/5 fetching source page from the getpc server"
scp -q "$DOCS_HOST:/opt/getpc_docs/index.html" "$TMP/getpc_docs.html"

echo "2/5 generating lib/docs/shopee-api-doc.ts"
PYTHONIOENCODING=utf-8 python scripts/gen_shopee_doc.py "$TMP/getpc_docs.html"
if grep -q "169\.58\." lib/docs/shopee-api-doc.ts; then echo "ERROR: server IP leaked into the docs"; exit 1; fi

echo "3/5 building"
npx next build >"$TMP/build.log" 2>&1 || { tail -30 "$TMP/build.log"; exit 1; }

if [ "${1:-}" = "--dry-run" ]; then echo "dry run: built OK, nothing deployed"; exit 0; fi

if git diff --quiet -- lib/docs/shopee-api-doc.ts; then
  echo "docs unchanged, nothing to deploy"; exit 0
fi

echo "4/5 committing and deploying"
git add lib/docs/shopee-api-doc.ts scripts/gen_shopee_doc.py
git commit -q -m "Docs: update Shopee Product API reference"
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
code=$(curl -s -o /dev/null -w '%{http_code}' https://www.fastscraping.com/docs/shopee-api)
echo "live check: /docs/shopee-api -> $code"
[ "$code" = "200" ] || { echo "ROLLBACK: ssh $SITE_HOST 'cd /opt/Fastscraping && docker tag fastscraping-app:before-$REV fastscraping-app:latest && docker compose up -d --no-build fs-app'"; exit 1; }

echo "5/5 pushing to GitHub"
git push -q origin HEAD:redesign-ultraviolet
git push -q origin HEAD:main
echo "done: $REV live at https://www.fastscraping.com/docs/shopee-api"
