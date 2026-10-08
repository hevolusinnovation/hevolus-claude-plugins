#!/bin/sh
# Assembla la pagina dei flussi: modello + manifest estratto + spiegazioni.
# Uso: assembla.sh <blocchi.yml> <spiegazioni.yml|-> "<Nome dello scenario>" > flussi-bpm.html
#   blocchi.yml     l'output di estrai-blocchi.sh
#   spiegazioni.yml le spiegazioni scritte in parole semplici (vedi SKILL.md §3); "-" se non ci sono
#   Nome            due o tre parole: finisce nel titolo («Flussi BPM <Nome>»)
D=$(cd "$(dirname "$0")" && pwd)
B="$1"; S="$2"; N="$3"
[ -f "$B" ] || { echo "manca il file dei blocchi: $B" >&2; exit 1; }
[ -n "$N" ] || { echo "manca il nome dello scenario" >&2; exit 1; }
if [ "$S" = "-" ] || [ ! -f "$S" ]; then S=$(mktemp); printf 'flussi: {}\n' > "$S"; fi
awk -v b="$B" -v s="$S" -v n="$N" '
  /^__YAML__$/ { while ((getline l < b) > 0) print l; close(b); next }
  /^__SPIEGAZIONI__$/ { while ((getline l < s) > 0) print l; close(s); next }
  { gsub(/__SCENARIO__/, n); print }
' "$D/bpm-viewer.html"
