#!/usr/bin/env bash
# Pubblica nel canale Teams del team il report delle novità (una Adaptive Card), attraverso il flusso
# Power Automate «quando si riceve una richiesta webhook di Teams».
# Uso: teams.sh --check <card.json>     controlla la card (JSON valido, dimensione) e non invia niente
#      teams.sh --send  <card.json>     la pubblica nel canale
#
# L'indirizzo del flusso porta la firma (sig=…): chi lo ha può scrivere nel canale, quindi è un segreto.
# Non sta nella skill né nel repository: si legge da XRCOPILOTLAB_BP_TEAMS_WEBHOOK oppure dal file
# ~/.xrcopilotlab/teams/blueprint-version-webhook (permessi 600). Lo script non lo stampa mai.
set -euo pipefail

MODE="${1:?uso: teams.sh --check|--send <card.json>}"
CARD="${2:?uso: teams.sh --check|--send <card.json>}"
FILE="$HOME/.xrcopilotlab/teams/blueprint-version-webhook"
MAX_BYTES=27000   # Teams rifiuta i messaggi oltre ~28 KB

[ -f "$CARD" ] || { echo "Card non trovata: $CARD" >&2; exit 2; }

# Il payload che il flusso si aspetta: un messaggio con la card come allegato.
PAYLOAD="$(mktemp)"
trap 'rm -f "$PAYLOAD"' EXIT
python3 -I - "$CARD" "$PAYLOAD" <<'EOF'
import json, sys
card = json.load(open(sys.argv[1], encoding="utf-8"))
if card.get("type") != "AdaptiveCard":
    sys.exit("La card non è una AdaptiveCard (manca \"type\": \"AdaptiveCard\").")
left = [s for s in json.dumps(card, ensure_ascii=False).split("{{")[1:]]
if left:
    sys.exit("Nella card restano segnaposto {{…}}: " + ", ".join(s.split("}}")[0] for s in left[:5]))
payload = {"type": "message", "attachments": [
    {"contentType": "application/vnd.microsoft.card.adaptive", "contentUrl": None, "content": card}]}
json.dump(payload, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False)
EOF

SIZE=$(wc -c < "$PAYLOAD" | tr -d ' ')
if [ "$SIZE" -gt "$MAX_BYTES" ]; then
  echo "La card è di $SIZE byte, oltre il limite di Teams ($MAX_BYTES): accorcia le sezioni per versione." >&2
  exit 3
fi

if [ "$MODE" = "--check" ]; then
  echo "Card valida: $SIZE byte. Niente è stato inviato."
  exit 0
fi

[ "$MODE" = "--send" ] || { echo "Modo sconosciuto: $MODE (usa --check o --send)" >&2; exit 2; }

URL="${XRCOPILOTLAB_BP_TEAMS_WEBHOOK:-}"
if [ -z "$URL" ] && [ -f "$FILE" ]; then
  URL="$(head -n1 "$FILE")"
fi
if [ -z "$URL" ]; then
  echo "Manca l'indirizzo del canale: impostare XRCOPILOTLAB_BP_TEAMS_WEBHOOK o scriverlo in $FILE (chmod 600)." >&2
  exit 4
fi

STATUS=$(curl -sS -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  --data-binary "@$PAYLOAD" "$URL") || { echo "Il canale non risponde (errore di rete)." >&2; exit 5; }

case "$STATUS" in
  200|202) echo "Pubblicato nel canale Teams (HTTP $STATUS)." ;;
  *) echo "Il flusso ha risposto HTTP $STATUS: il messaggio non è stato pubblicato." >&2; exit 5 ;;
esac
