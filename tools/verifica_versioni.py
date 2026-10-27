"""Le versioni di una PR sono coerenti: plugin.json e catalogo dicono lo stesso numero.

    verifica-versioni <ref-di-base>     es. origin/main

Per ogni plugins/<nome>/ toccato rispetto alla base controlla che marketplace.json dichiari per quel
plugin la stessa versione di plugin.json: è un errore. Che le versioni (del plugin e del catalogo)
siano cambiate è solo un avviso: se la PR non le alza, le alza il merge
(.github/workflows/release.yml → tools/release_al_merge.py), che poi pubblica tag e pacchetti.
"""
import json, subprocess, sys

base = sys.argv[1] if len(sys.argv) > 1 else sys.exit("uso: verifica-versioni <ref-di-base>")

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

errori, avvisi = [], []
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
        avvisi.append(f"{nome}: la versione è ancora {ora}: la alza il merge.")
    if nome in dichiarate and dichiarate[nome] != ora:
        errori.append(f"{nome}: plugin.json dice {ora}, marketplace.json dice {dichiarate.get(nome)}.")

if market_old.get("version") == market_now.get("version"):
    avvisi.append(f"la versione del catalogo è ancora {market_now.get('version')}: la alza il merge.")

for a in avvisi:
    print(f"::notice::{a}")

if errori:
    for e in errori:
        print(f"::error::{e}")
    print("plugin.json e marketplace.json devono dire lo stesso numero — oppure non toccarli e lasciarli al merge.")
    sys.exit(1)

print("Versioni coerenti per: " + ", ".join(plugins) + f"; catalogo {market_now['version']}.")
