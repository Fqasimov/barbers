#!/usr/bin/env bash
# Builds the salon panel (the app's salon screens in a browser) for the website.
#   scripts/export-panel.sh <out-dir> [--preview]
# --preview: on-device demo backend, payments off, and files relative to the
# page so it runs from any sub-folder (the shareable preview).
# Without it: set EXPO_PUBLIC_API_URL to the live API and serve <out-dir> at /panel
# with every unknown path falling back to index.html.
set -euo pipefail
OUT=${1:?out dir}
if [ "${2:-}" = "--preview" ]; then
  export EXPO_PUBLIC_API_URL= EXPO_PUBLIC_PAYMENTS=off
fi
rm -rf "$OUT"
EXPO_OFFLINE=1 npx expo export --platform web --output-dir "$OUT"
if [ "${2:-}" = "--preview" ]; then
  python3 - "$OUT" <<'PY'
import glob, sys
out = sys.argv[1]
for f in glob.glob(out + '/_expo/static/js/web/*.js'):
    s = open(f).read().replace('"/assets/', '"./assets/')
    open(f, 'w').write(s)
h = open(out + '/index.html').read()
h = h.replace('src="/_expo/', 'src="./expo/').replace('href="/favicon.ico"', 'href="./favicon.ico"')
h = h.replace('<title>Usta</title>', '<title>yazılnow Salon panel</title>')
boot = """<script>
      // Preview from a sub-folder: files stay relative to it; the app starts at /panel.
      (function () {
        var dir = location.pathname.replace(/[^/]*$/, '');
        document.write('<base href="' + dir + '">');
        history.replaceState(null, '', '/panel' + location.search);
      })();
    </script>
    <meta charset="utf-8" />"""
h = h.replace('<meta charset="utf-8" />', boot, 1)
open(out + '/index.html', 'w').write(h)
PY
  # Some hosts reserve names starting with "_".
  mv "$OUT/_expo" "$OUT/expo"
fi
echo "Panel exported to $OUT"
