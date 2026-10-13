#!/usr/bin/env bash
# Verifica che un plugin toccato alzi la versione, e che il catalogo la riporti.
#
#   ./verifica-versioni.sh <ref-di-base>     es. origin/main
#
# Avviatore: la logica sta in tools/verifica_versioni.py, che gira uguale su macOS, Linux e Windows.
# Gemello di verifica-versioni.ps1 — due porte sulla stessa stanza, nessuna logica duplicata.
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"
py="$(command -v python3 || command -v python || true)"
[ -n "$py" ] || { echo "Serve Python 3: installalo da python.org o con il gestore di pacchetti." >&2; exit 1; }

exec "$py" "$root/tools/verifica_versioni.py" "$@"
