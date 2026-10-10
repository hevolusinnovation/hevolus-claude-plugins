#!/bin/sh
# Assembla la pagina del manuale: modello + manuale.json.
# Uso: assembla.sh <manuale.json> > manuale-blueprint.html
D=$(cd "$(dirname "$0")" && pwd)
J="$1"
[ -f "$J" ] || { echo "manca il file del manuale: $J" >&2; exit 1; }
if command -v python3 >/dev/null 2>&1; then
  python3 -I -c 'import json,sys; json.load(open(sys.argv[1]))' "$J" 2>/dev/null || { echo "manuale.json non è JSON valido" >&2; exit 1; }
elif command -v node >/dev/null 2>&1; then
  node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$J" 2>/dev/null || { echo "manuale.json non è JSON valido" >&2; exit 1; }
fi
# "</" dentro uno <script> chiuderebbe il tag: lo si scrive "<\/"
awk -v j="$J" '
  /^__DATA__$/ { while ((getline l < j) > 0) { gsub(/<\//, "<\\/", l); print l } close(j); next }
  { print }
' "$D/report-viewer.html"
