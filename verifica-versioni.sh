#!/usr/bin/env bash
# Una modifica a un plugin alza la sua versione, e il catalogo la riporta.
#
#   ./verifica-versioni.sh <ref-di-base>     es. origin/main
#
# Per ogni plugins/<nome>/ toccato rispetto alla base controlla che:
#   1. la versione di .claude-plugin/plugin.json sia cambiata;
#   2. marketplace.json dichiari per quel plugin la stessa versione di plugin.json;
#   3. la versione del catalogo (marketplace.json) sia cambiata.
# È ciò che fa partire la release automatica (.github/workflows/release.yml): senza un numero
# nuovo, il merge non produce né tag né pacchetti.
set -euo pipefail

BASE="${1:?uso: $0 <ref-di-base>}"
python3 - "$BASE" <<'PY'
import json, subprocess, sys

base = sys.argv[1]

def git(*a):
    return subprocess.run(["git", *a], check=True, capture_output=True, text=True).stdout

def show(path):
    try:
        return json.loads(git("show", f"{base}:{path}"))
    except subprocess.CalledProcessError:
        return None

changed = git("diff", "--name-only", f"{base}...HEAD").split("\n")
plugins = sorted({p.split("/")[1] for p in changed if p.startswith("plugins/") and p.count("/") >= 2})

if not plugins:
    print("Nessun plugin toccato: niente da verificare.")
    sys.exit(0)

errori = []
market_now = json.load(open(".claude-plugin/marketplace.json"))
market_old = show(".claude-plugin/marketplace.json") or {}
dichiarate = {p["name"]: p.get("version") for p in market_now["plugins"]}

for nome in plugins:
    path = f"plugins/{nome}/.claude-plugin/plugin.json"
    try:
        ora = json.load(open(path))["version"]
    except FileNotFoundError:
        continue  # plugin rimosso
    prima = (show(path) or {}).get("version")
    if prima == ora:
        errori.append(f"{nome}: toccato ma la versione è ancora {ora} ({path}).")
    if dichiarate.get(nome) != ora:
        errori.append(f"{nome}: plugin.json dice {ora}, marketplace.json dice {dichiarate.get(nome)}.")

if market_old.get("version") == market_now.get("version"):
    errori.append(f"la versione del catalogo è ancora {market_now.get('version')} (.claude-plugin/marketplace.json).")

if errori:
    for e in errori:
        print(f"::error::{e}")
    print("Alzare le versioni nella stessa PR: la release automatica parte da lì.")
    sys.exit(1)

print("Versioni alzate per: " + ", ".join(plugins) + f"; catalogo {market_now['version']}.")
PY
