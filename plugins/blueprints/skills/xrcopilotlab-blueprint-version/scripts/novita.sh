#!/usr/bin/env bash
# Elenca le novità del plugin `blueprints` fra due versioni, dallo storico del catalogo.
# Uso: novita.sh <da> [<a>] [<cartella-del-catalogo>]
#   da  versione che il collega ha adesso (esclusa)      es. 2.26.0
#   a   versione di arrivo (inclusa); vuota = l'ultima
# Sola lettura: non modifica il catalogo né il tenant.
set -euo pipefail

DA="${1:?uso: novita.sh <da> [<a>] [<cartella-catalogo>]}"
A="${2:-}"
CAT="${3:-$HOME/Hevolus/hevolus-claude-plugins}"
PLUGIN=plugins/blueprints/.claude-plugin/plugin.json

if [ ! -d "$CAT/.git" ]; then
  CAT="${TMPDIR:-/tmp}/hevolus-claude-plugins"
  [ -d "$CAT/.git" ] || gh repo clone hevolusinnovation/hevolus-claude-plugins "$CAT" -- --filter=blob:none --quiet
fi
git -C "$CAT" fetch --quiet origin main 2>/dev/null || true
REF=origin/main
git -C "$CAT" rev-parse --verify --quiet "$REF" >/dev/null || REF=HEAD

vers() { git -C "$CAT" show "$1:$PLUGIN" 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin)["version"])' 2>/dev/null || true; }
cmp_le() { [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -1)" = "$1" ]; }   # $1 <= $2

[ -n "$A" ] || A="$(vers "$REF")"
echo "# Plugin blueprints: da $DA (esclusa) a $A (inclusa)"

# dal più vecchio al più nuovo
for sha in $(git -C "$CAT" log --reverse --format=%h "$REF" -- "$PLUGIN"); do
  v="$(vers "$sha")"; [ -n "$v" ] || continue
  [ "$v" = "$DA" ] && continue
  cmp_le "$DA" "$v" || continue          # v > DA
  cmp_le "$v" "$A" || continue           # v <= A
  echo; echo "## $v — $(git -C "$CAT" log -1 --format='%ad' --date=short "$sha")"
  git -C "$CAT" log -1 --format='%B' "$sha" | grep -v -E '^(Co-Authored-By|Claude-Session):' | sed '/^$/N;/^\n$/D'
  echo "-- file toccati nelle skill:"
  git -C "$CAT" show --stat --format= "$sha" -- plugins/blueprints/skills | sed -n 's#.*skills/\([^/]*\)/.*#  \1#p' | sort -u
done

echo; echo "## CLI"
echo "plugin $DA → version.txt: $(git -C "$CAT" show "$(git -C "$CAT" log --reverse --format=%h "$REF" -- "$PLUGIN" | while read s; do [ "$(vers "$s")" = "$DA" ] && echo $s; done | head -1)":plugins/blueprints/bin/version.txt 2>/dev/null || echo '?')"
echo "plugin $A  → version.txt: $(git -C "$CAT" show "$REF:plugins/blueprints/bin/version.txt")"
