#!/usr/bin/env bash
# Costruisce lo zip di UNA skill per il caricamento su claude.ai (Impostazioni → Skill).
#
# Non è lo stesso pacchetto del plugin: build-desktop-plugin.sh produce un PLUGIN, con
# `.claude-plugin/`, `skills/` e `README.md` alla radice dell'archivio. L'uploader delle skill
# vuole l'opposto — una sola cartella di primo livello, che è la skill:
#
#   xrcopilotlab-blueprint-test/
#   ├── SKILL.md
#   └── references/…
#
# Caricare il pacchetto del plugin al posto di quello della skill dà l'errore
# «All files must be inside the top-level folder».
#
#   ./build-skill-zip.sh plugins/blueprints/skills/xrcopilotlab-blueprint-test [cartella-di-destinazione]
#   ./build-skill-zip.sh --all
set -euo pipefail

root="$(cd "$(dirname "$0")" && pwd)"

build_one() {
  local src="$1" out_dir="$2"
  src="${src%/}"
  local name; name="$(basename "$src")"

  [ -f "$src/SKILL.md" ] || { echo "Non trovo $src/SKILL.md" >&2; return 1; }

  # Il frontmatter prima di tutto: l'uploader lo rifiuta dopo il caricamento, e l'errore non
  # dice quale regola è saltata. Le regole sono tre, e due si violano senza accorgersene.
  python3 - "$src/SKILL.md" "$name" <<'PY'
import re, sys
path, folder = sys.argv[1], sys.argv[2]
s = open(path).read()
m = re.match(r'^---\n(.*?)\n---\n', s, re.S)
if not m:
    sys.exit(f"{path}: manca il frontmatter YAML")
fm = m.group(1)
name = re.search(r'^name:\s*(.+)$', fm, re.M).group(1).strip()
desc = ' '.join(re.search(r'^description:\s*(.*)$', fm, re.S | re.M).group(1).split())

errori = []
if name != folder:
    errori.append(f"il campo name ({name}) non è il nome della cartella ({folder})")
if len(name) > 64:
    errori.append(f"name di {len(name)} caratteri, il massimo è 64")
if not re.fullmatch(r'[a-z0-9-]+', name):
    errori.append("name: ammessi solo minuscole, numeri e trattini")
for parola in ("anthropic", "claude"):
    if parola in name.lower():
        errori.append(f"name contiene la parola riservata «{parola}»")
if not desc:
    errori.append("description vuota")
if len(desc) > 1024:
    errori.append(f"description di {len(desc)} caratteri, il massimo è 1024")
# Un segnaposto come <nome> viene letto come tag XML e fa rifiutare la skill.
for campo, valore in (("name", name), ("description", desc)):
    tag = re.findall(r'<[^<>\s][^<>]*>', valore)
    if tag:
        errori.append(f"{campo}: sembra contenere tag XML {tag} — riscrivili senza < >")

if errori:
    sys.exit(f"{path}\n  - " + "\n  - ".join(errori))
print(f"  frontmatter ok — name {len(name)}/64, description {len(desc)}/1024")
PY

  local stage; stage="$(mktemp -d)"
  trap 'rm -rf "$stage"' RETURN

  # L'unica cartella di primo livello dell'archivio: la skill, con il suo nome.
  cp -R "$src" "$stage/$name"
  find "$stage" -name '.DS_Store' -delete

  mkdir -p "$out_dir"
  local zip_path="$out_dir/$name.zip"
  rm -f "$zip_path"
  (cd "$stage" && zip -qr "$zip_path" "$name" -x '*.DS_Store' '__MACOSX/*')

  # Verifica: ogni voce dell'archivio sta dentro <name>/, e SKILL.md è alla sua radice.
  python3 - "$zip_path" "$name" <<'PY'
import sys, zipfile
path, name = sys.argv[1], sys.argv[2]
names = zipfile.ZipFile(path).namelist()
fuori = [n for n in names if not n.startswith(name + "/")]
if fuori:
    sys.exit("FUORI dalla cartella di primo livello: " + ", ".join(fuori[:5]))
if f"{name}/SKILL.md" not in names:
    sys.exit(f"manca {name}/SKILL.md alla radice della cartella")
print(f"{path}  ({len([n for n in names if not n.endswith('/')])} file, una sola cartella di primo livello: {name}/)")
PY
}

if [ "${1:-}" = "--all" ]; then
  out_dir="${2:-$root/dist/skills}"
  for skill in "$root"/plugins/*/skills/*/; do
    build_one "$skill" "$out_dir"
  done
else
  [ $# -ge 1 ] || { echo "Uso: $0 <cartella-della-skill> [destinazione]   oppure   $0 --all" >&2; exit 2; }
  build_one "$1" "${2:-$root/dist/skills}"
fi

echo
echo "Caricalo su claude.ai → Impostazioni → Capacità → Skill (o la libreria skill del team)."
