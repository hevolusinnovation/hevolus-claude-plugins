#!/usr/bin/env bash
# Costruisce lo zip del plugin per Claude Desktop a partire da plugins/assessment/.
#
# L'assessment non si installa da Claude Code: si carica come plugin su
# claude.ai/customize/plugins, perché il lavoro (proposta in PDF/Word, dossier, Word finale)
# si fa in chat con i file sotto mano, non da terminale.
#
#   ./build-desktop-plugin.sh [cartella-di-destinazione]
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"
src="$root/plugins/assessment"
out_dir="${1:-$root/dist}"

version="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["version"])' \
  "$src/.claude-plugin/plugin.json")"

stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT

mkdir -p "$stage/.claude-plugin"
# Il manifest del pacchetto Desktop porta il nome con cui il plugin appare nell'app.
python3 - "$src/.claude-plugin/plugin.json" "$stage/.claude-plugin/plugin.json" <<'PY'
import json, sys
src, dst = sys.argv[1], sys.argv[2]
m = json.load(open(src))
m["name"] = "xrcopilotlab"
json.dump(m, open(dst, "w"), indent=2, ensure_ascii=False)
open(dst, "a").write("\n")
PY

cp -R "$src/skills" "$stage/skills"
cp "$src/docs/manuale.md" "$stage/README.md"
find "$stage" -name '.DS_Store' -delete

mkdir -p "$out_dir"
zip_path="$out_dir/Xrcopilotlab-$version.zip"
rm -f "$zip_path"
(cd "$stage" && zip -qr "$zip_path" .)

echo "$zip_path"
echo "Caricalo su claude.ai/customize/plugins e conferma dall'anteprima."
