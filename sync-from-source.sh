#!/usr/bin/env bash
# Allinea le skill al repository sorgente di XRCopilotLab.
#
# Le skill vivono in xrcopilotlab-webapp-dotnet: qui ne serve una copia, e si rifà con questo
# invece che a mano. Riscrive anche i link che nel plugin punterebbero a file inesistenti.
#
#   ./sync-from-source.sh ../xrcopilotlab-webapp-dotnet
#
# Avviatore: la logica sta in tools/sync_from_source.py, che gira uguale su macOS, Linux e Windows.
# Gemello di sync-from-source.ps1 — due porte sulla stessa stanza, nessuna logica duplicata.
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"
py="$(command -v python3 || command -v python || true)"
[ -n "$py" ] || { echo "Serve Python 3: installalo da python.org o con il gestore di pacchetti." >&2; exit 1; }

exec "$py" "$root/tools/sync_from_source.py" "$@"
