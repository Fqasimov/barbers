#!/usr/bin/env bash
# Builds everything the web host serves, into deploy/out/:
#
#   out/site/  →  https://<domain>        the website (landing page, map, /privacy, /terms, /help)
#   out/app/   →  https://app.<domain>    the app in a browser: salon panel (/panel), QR reviews (/r/…),
#                                          salon pages (/salon/…, /s/…) and the full client app
#
# The API (backend/) is deployed separately; see docs/deploy.md.
#
# Usage, from the repository root:
#   DOMAIN=yazilnow.az deploy/build.sh
#
# Optional:
#   API_URL=https://api.yazilnow.az   APP_URL=https://app.yazilnow.az
#   PAYMENTS=off|on                    (default off until a payment provider is connected)
#   APPLE_TEAM_ID=ABCDE12345           writes .well-known/apple-app-site-association (iPhone opens QR links in the app)
#   ANDROID_SHA256=AA:BB:…             writes .well-known/assetlinks.json (Android opens QR links in the app)
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN=${DOMAIN:?set DOMAIN, e.g. DOMAIN=yazilnow.az}
SITE_URL="https://${DOMAIN}"
# LAYOUT=single: everything on the one domain, for hosting without subdomains (cPanel):
#   https://<domain>/  website · /app/ the app in a browser · /api, /admin the server
LAYOUT=${LAYOUT:-subdomains}
if [ "$LAYOUT" = single ]; then
  API_URL=${API_URL:-https://${DOMAIN}}
  APP_URL=${APP_URL:-https://${DOMAIN}/app}
  export EXPO_WEB_BASE_URL=/app
else
  API_URL=${API_URL:-https://api.${DOMAIN}}
  APP_URL=${APP_URL:-https://app.${DOMAIN}}
fi
PAYMENTS=${PAYMENTS:-off}
OUT=deploy/out
BUNDLE_ID=$(node -p "require('./app.json').expo.ios.bundleIdentifier")
PACKAGE=$(node -p "require('./app.json').expo.android.package")

rm -rf "$OUT"
mkdir -p "$OUT"

echo "› Website → $OUT/site"
(cd web && npm ci --no-audit --no-fund && npm run build)
cp -R web/dist "$OUT/site"
cat > "$OUT/site/config.js" <<JS
// Site settings. Edit these on the server; no rebuild needed.
window.USTA_CONFIG = {
  apiUrl: '${API_URL}',
  appUrl: '${APP_URL}',
  // Store pages. Empty: the buttons say "Coming soon".
  appStoreUrl: '',
  playStoreUrl: '',
  supportEmail: 'support@${DOMAIN}',
  // Shown in the footer once filled in.
  company: { name: '', voen: '', address: '' },
};
JS
if [ "$LAYOUT" = single ]; then
  cp deploy/apache/single-site.htaccess "$OUT/site/.htaccess"
else
  cp deploy/apache/site.htaccess "$OUT/site/.htaccess"
fi

echo "› App in a browser → $OUT/app"
npm ci --no-audit --no-fund
EXPO_PUBLIC_API_URL="$API_URL" \
EXPO_PUBLIC_SITE_URL="$SITE_URL" \
EXPO_PUBLIC_SUPPORT_EMAIL="support@${DOMAIN}" \
EXPO_PUBLIC_PAYMENTS="$PAYMENTS" \
EXPO_OFFLINE=1 \
  npx expo export --platform web --output-dir "$OUT/app" --clear
# Metro caches inlined EXPO_PUBLIC_* values; make sure the bundle really talks to this API.
if ! grep -q "${API_URL#https://}" "$OUT"/app/_expo/static/js/web/*.js || grep -q "localhost:8000" "$OUT"/app/_expo/static/js/web/*.js; then
  echo "The app bundle does not point at ${API_URL}. Stop." >&2
  exit 1
fi
if [ "$LAYOUT" = single ]; then
  cp deploy/apache/single-app.htaccess "$OUT/app/.htaccess"
else
  cp deploy/apache/app.htaccess "$OUT/app/.htaccess"
fi
# The configs name yazilnow.az; point them at this domain.
sed -i "s|https://app.yazilnow.az|${APP_URL}|g; s|https://api.yazilnow.az|${API_URL}|g" "$OUT/site/.htaccess" "$OUT/app/.htaccess"

# Universal links / App Links: with these files on the website, a scanned QR opens the installed app.
if [ -n "${APPLE_TEAM_ID:-}" ] || [ -n "${ANDROID_SHA256:-}" ]; then
  mkdir -p "$OUT/site/.well-known"
fi
if [ -n "${APPLE_TEAM_ID:-}" ]; then
  cat > "$OUT/site/.well-known/apple-app-site-association" <<JSON
{
  "applinks": {
    "details": [
      {
        "appIDs": ["${APPLE_TEAM_ID}.${BUNDLE_ID}"],
        "components": [{ "/": "/r/*" }, { "/": "/s/*" }, { "/": "/salon/*" }]
      }
    ]
  }
}
JSON
fi
if [ -n "${ANDROID_SHA256:-}" ]; then
  cat > "$OUT/site/.well-known/assetlinks.json" <<JSON
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": { "namespace": "android_app", "package_name": "${PACKAGE}", "sha256_cert_fingerprints": ["${ANDROID_SHA256}"] }
  }
]
JSON
fi

echo
echo "Done. Upload:"
echo "  $OUT/site/  →  web root of ${SITE_URL}   (keep the server's config.js if you edited it there)"
echo "  $OUT/app/   →  web root of ${APP_URL}"
echo "API: ${API_URL} (backend/, see docs/deploy.md). Its CORS_ALLOWED_ORIGINS must list ${SITE_URL},https://www.${DOMAIN},${APP_URL}"
