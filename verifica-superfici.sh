#!/usr/bin/env bash
# Verifica che la separazione fra Claude Code e Claude Desktop tenga.
#
# Ogni plugin dichiara in superfici.json dove gira; questo controlla che i manifest e il
# catalogo dicano la stessa cosa. Gira anche in CI a ogni push.
#
#   ./verifica-superfici.sh
#
# Avviatore: la logica sta in tools/verifica_superfici.py, che gira uguale su macOS, Linux e Windows.
# Gemello di verifica-superfici.ps1 — due porte sulla stessa stanza, nessuna logica duplicata.
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"
py="$(command -v python3 || command -v python || true)"
[ -n "$py" ] || { echo "Serve Python 3: installalo da python.org o con il gestore di pacchetti." >&2; exit 1; }

exec "$py" "$root/tools/verifica_superfici.py" "$@"
