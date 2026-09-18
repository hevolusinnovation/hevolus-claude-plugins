#!/usr/bin/env bash
# Costruisce lo zip di un plugin per Claude Desktop.
#
# Quale plugin lo dice superfici.json. Normalmente non serve lanciarlo a mano: la CI lo esegue
# a ogni release e allega lo zip alla pagina Releases, da dove i colleghi lo scaricano.
#
#   ./build-desktop-plugin.sh                              il plugin desktop, in dist/
#   ./build-desktop-plugin.sh ~/Assessments                altrove
#   ./build-desktop-plugin.sh --plugin assessment         se un giorno ce ne fosse più d'uno
#
# Avviatore: la logica sta in tools/build_desktop_plugin.py, che gira uguale su macOS, Linux e Windows.
# Gemello di build-desktop-plugin.ps1 — due porte sulla stessa stanza, nessuna logica duplicata.
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"
py="$(command -v python3 || command -v python || true)"
[ -n "$py" ] || { echo "Serve Python 3: installalo da python.org o con il gestore di pacchetti." >&2; exit 1; }

exec "$py" "$root/tools/build_desktop_plugin.py" "$@"
