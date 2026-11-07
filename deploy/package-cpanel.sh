#!/usr/bin/env bash
# Builds one zip for cPanel hosting: upload it with File Manager, extract it in your home folder, done.
#
#   deploy/out/yazilnow-cpanel.zip
#     public_html/        the website            → https://yazilnow.az
#     public_html/app/    the app in a browser   → https://yazilnow.az/app
#     yazilnow-api/       the server (Laravel)   → https://yazilnow.az/api and /admin, through the link public_html/server
#       .env              production settings, APP_KEY already generated; fill in the database and mail passwords
#     README-FIRST.txt
#
# Usage, from the repository root:  DOMAIN=yazilnow.az deploy/package-cpanel.sh
# SKIP_BUILD=1 reuses deploy/out/site and deploy/out/app from an earlier deploy/build.sh.
# UPDATE=1 builds an update zip: no .env, so extracting it keeps the server's settings.
set -euo pipefail
cd "$(dirname "$0")/.."
DOMAIN=${DOMAIN:-yazilnow.az}
OUT=deploy/out
PKG=$OUT/cpanel

# cPanel without subdomains: website at /, the app at /app, the server at /api and /admin.
export LAYOUT=single
[ -n "${SKIP_BUILD:-}" ] || DOMAIN=$DOMAIN LAYOUT=single deploy/build.sh

rm -rf "$PKG" "$OUT/yazilnow-cpanel.zip"
mkdir -p "$PKG"
cp -R "$OUT/site" "$PKG/public_html"
cp -R "$OUT/app" "$PKG/public_html/app"

echo "› Server → $PKG/yazilnow-api"
API=$PKG/yazilnow-api
mkdir -p "$API/vendor"
tar -C backend -cf - \
  --exclude=./vendor --exclude=./node_modules --exclude=./tests --exclude=./.env --exclude='./.env.*' \
  --exclude=./.phpunit.result.cache --exclude='./database/*.sqlite' --exclude='./storage/logs/*.log' \
  --exclude='./storage/framework/sessions/*' --exclude='./storage/framework/views/*.php' --exclude='./storage/framework/cache/data/*' \
  --exclude=./storage/app/public/salons --exclude='./bootstrap/cache/*.php' --exclude=./public/storage . | tar -C "$API" -xf -
# Production dependencies only, without git history.
tar -C backend/vendor -cf - --exclude=.git . | tar -C "$API/vendor" -xf -
(cd "$API" && COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction --quiet)
if [ -z "${UPDATE:-}" ]; then
cp deploy/backend.env.production "$API/.env"
KEY="base64:$(head -c 32 /dev/urandom | base64)"
# cPanel: its own mail server, a database prefixed with the account name, emails sent within seconds by cron.
sed -i \
  -e "s|^APP_KEY=.*|APP_KEY=${KEY}|" \
  -e "s|yazilnow\.az|${DOMAIN}|g" \
  -e "s|^DB_DATABASE=.*|DB_DATABASE=CPANELUSER_yazilnow|" \
  -e "s|^DB_USERNAME=.*|DB_USERNAME=CPANELUSER_yazilnow|" \
  -e "s|^MAIL_HOST=.*|MAIL_HOST=mail.${DOMAIN}|" \
  -e "s|^MAIL_USERNAME=.*|MAIL_USERNAME=no-reply@${DOMAIN}|" \
  -e "s|^APP_URL=.*|APP_URL=https://${DOMAIN}|" \
  -e "s|^SESSION_DOMAIN=.*|SESSION_DOMAIN=|" \
  -e "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}|" \
  "$API/.env"
chmod 600 "$API/.env"
fi
cp deploy/cpanel/README-FIRST.txt "$PKG/README-FIRST.txt"
sed -i "s|yazilnow\.az|${DOMAIN}|g" "$PKG/README-FIRST.txt"

(cd "$PKG" && zip -qr -X ../yazilnow-cpanel.zip public_html yazilnow-api README-FIRST.txt)
echo
echo "Done: $OUT/yazilnow-cpanel.zip ($(du -h "$OUT/yazilnow-cpanel.zip" | cut -f1)). Follow README-FIRST.txt inside it."
