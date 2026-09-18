#!/usr/bin/env bash
# Costruisce lo zip di UNA skill per il caricamento su claude.ai (Impostazioni → Skill).
#
# Non è lo stesso pacchetto del plugin: l'uploader delle skill vuole una sola cartella di primo
# livello, che è la skill. Caricare il pacchetto sbagliato dà l'errore
# «All files must be inside the top-level folder».
#
#   ./build-skill-zip.sh plugins/blueprints/skills/xrcopilotlab-blueprint-test
#   ./build-skill-zip.sh --all
#
# Avviatore: la logica sta in tools/build_skill_zip.py, che gira uguale su macOS, Linux e Windows.
# Gemello di build-skill-zip.ps1 — due porte sulla stessa stanza, nessuna logica duplicata.
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"
py="$(command -v python3 || command -v python || true)"
[ -n "$py" ] || { echo "Serve Python 3: installalo da python.org o con il gestore di pacchetti." >&2; exit 1; }

exec "$py" "$root/tools/build_skill_zip.py" "$@"
