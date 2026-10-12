#!/bin/sh
# Assembla la pagina dei flussi: modello + manifest estratto + spiegazioni + kit isometrico.
# Uso: assembla.sh <blocchi.yml> <spiegazioni.yml|-> "<Nome dello scenario>" > flussi-bpm.html
#   blocchi.yml     l'output di estrai-blocchi.sh
#   spiegazioni.yml le spiegazioni scritte in parole semplici (vedi SKILL.md §3); "-" se non ci sono
#   Nome            due o tre parole: finisce nel titolo («Flussi BPM <Nome>»)
#   figure          (facoltativo) cartella con le figure d'autore, una per processo: <chiave-del-processo>.svg
D=$(cd "$(dirname "$0")" && pwd)
B="$1"; S="$2"; N="$3"; F="$4"
[ -f "$B" ] || { echo "manca il file dei blocchi: $B" >&2; exit 1; }
[ -n "$N" ] || { echo "manca il nome dello scenario" >&2; exit 1; }
if [ "$S" = "-" ] || [ ! -f "$S" ]; then S=$(mktemp); printf 'flussi: {}\n' > "$S"; fi
# il kit isometrico (assets/iso/) avvolto in una funzione, e i suoi stili
KIT=$(mktemp); sh "$D/iso/inline-kit.sh" > "$KIT"
CSS=$(mktemp); cat "$D/iso/iso.css" "$D/iso/iso-bpm.css" > "$CSS"
# le figure d'autore: un <template id="fig-<chiave>"> per ogni <chiave>.svg (solo nomi semplici: lettere, cifre, - e _)
FIG=$(mktemp)
if [ -n "$F" ] && [ -d "$F" ]; then
  for f in "$F"/*.svg; do
    [ -f "$f" ] || continue
    k=$(basename "$f" .svg)
    case "$k" in *[!A-Za-z0-9_-]*) echo "figura ignorata (nome non valido): $f" >&2; continue ;; esac
    printf '<template id="fig-%s">' "$k" >> "$FIG"; cat "$f" >> "$FIG"; printf '</template>\n' >> "$FIG"
  done
fi
awk -v fig="$FIG" -v b="$B" -v s="$S" -v n="$N" -v kit="$KIT" -v css="$CSS" -v mappa="$D/mappa-isometrica.js" -v grafici="$D/grafici.js" -v player="$D/player.js" -v percorsi="$D/percorsi.js" -v video="$D/video.js" -v scena="$D/scena.js" '
  function dump(f,  l) { while ((getline l < f) > 0) print l; close(f) }
  /^__YAML__$/ { dump(b); next }
  /^__SPIEGAZIONI__$/ { dump(s); next }
  /^__FIGURE__$/ { dump(fig); next }
  /^__ISO_KIT__$/ { dump(kit); next }
  /^__ISO_CSS__$/ { dump(css); next }
  /^__ISO_MAPPA__$/ { dump(mappa); next }
  /^__GRAFICI__$/ { dump(grafici); next }
  /^__PERCORSI__$/ { dump(percorsi); next }
  /^__PLAYER__$/ { dump(player); next }
  /^__VIDEO__$/ { dump(video); next }
  /^__SCENA__$/ { dump(scena); next }
  { gsub(/__SCENARIO__/, n); print }
' "$D/bpm-viewer.html"
rm -f "$KIT" "$CSS" "$FIG"
