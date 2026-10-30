#!/usr/bin/env sh
# Il report di governance dell'archivio di un tenant: per ogni blueprint pubblicato, l'ultima versione e che cosa manca
# alla sua governance. Solo letture: xrcopilotlab-bp status e pull.
#
# Uso:  archivio.sh <ambiente> <company-guid> <cartella-di-lavoro>
# Scrive <cartella>/<TAG>.yml per ogni tag e <cartella>/archivio.md con la tabella.
set -eu

ENV="${1:?ambiente}"; COMPANY="${2:?company}"; OUT="${3:?cartella}"
QUI="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT"

xrcopilotlab-bp status --env "$ENV" --company "$COMPANY" 2>/dev/null > "$OUT/status.txt"
TAGS="$(awk '/^Blueprint pubblicati/{f=1; next} /^Esecuzioni/{f=0} f && /^  [A-Z0-9]+ / {print $1}' "$OUT/status.txt" | awk '!v[$0]++')"
[ -n "$TAGS" ] || { echo "nessun blueprint pubblicato su $ENV per $COMPANY" >&2; exit 1; }

{
  echo "# Governance dell'archivio · $ENV · $(date +%Y-%m-%d)"
  echo
  echo "| Tag | Versione | Sezione governance | Uscite | Tool MCP che scrivono | Agenti aperti alle persone | Agent task da soli | Che cosa manca |"
  echo "|---|---|---|---|---|---|---|---|"
  for T in $TAGS; do
    if xrcopilotlab-bp pull --tag "$T" --env "$ENV" --company "$COMPANY" --out "$OUT/$T.yml" >/dev/null 2>&1; then
      python3 -I "$QUI/superficie.py" "$OUT/$T.yml" --riga 2>/dev/null || echo "| $T | ? | ? | | | | | manifest non leggibile |"
    else
      echo "| $T | ? | ? | | | | | pull non riuscito |"
    fi
  done
} > "$OUT/archivio.md"

echo "✓ $OUT/archivio.md ($(echo "$TAGS" | wc -l | tr -d ' ') blueprint)"
cat "$OUT/archivio.md"
