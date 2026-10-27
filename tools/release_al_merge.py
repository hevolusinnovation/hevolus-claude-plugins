#!/usr/bin/env python3
"""Al merge su main: allinea la CLI all'ultima release e alza le versioni che la PR non ha alzato.

    python3 tools/release_al_merge.py --base <sha-prima-del-merge> [--cli-da-github owner/repo]

Lo lancia .github/workflows/release.yml dopo ogni push su main, prima di decidere il tag. Fa tre cose,
e ognuna solo se serve:

  1. CLI e registratore: se fra le release di questo repository c'è un `bp-v<X.Y.Z>` (o `demo-v…`)
     più nuovo di bin/version.txt (o demo-version.txt) e con gli allegati di tutte le piattaforme,
     scrive quel numero — è ciò che l'avviatore scarica — e il plugin blueprints conta come toccato.
  2. Plugin: per ogni plugins/<nome>/ cambiato da `--base` la cui versione è rimasta quella di prima,
     alza plugin.json (e la voce nel catalogo, se il plugin ci sta). Minor se fra i messaggi del merge
     c'è un `feat`, o se è cambiata la CLI; patch altrimenti.
  3. Catalogo: se qualcosa è stato toccato e la versione del catalogo è rimasta quella di prima, la alza
     una volta sola, al livello più alto fra quelli usati. È il numero che diventa il tag.

Chi alza i numeri a mano nella PR non trova doppioni: si alza solo ciò che è fermo rispetto alla base.
Scrive in $GITHUB_OUTPUT `cambiato=true|false` e `messaggio=<riga per il commit>`.
"""
import argparse
import json
import os
import re
import subprocess
import sys

from comune import RADICE, prepara_console
from alza_release import allinea
from alza_versioni import alza_catalogo, alza_plugin

# Gli allegati che l'avviatore può chiedere: una release che ne manca uno rompe il download su quella
# piattaforma, quindi non la si adotta (lo stesso controllo di controlli.yml, fatto prima invece che dopo).
RID = ["osx-arm64", "osx-x64", "linux-x64", "linux-arm64", "win-x64", "win-arm64"]
ALLEGATI = {
    "bp": lambda r: f"xrcopilotlab-bp-{r}.exe" if r.startswith("win") else f"xrcopilotlab-bp-{r}",
    "demo": lambda r: f"xrcopilotlab-demo-{r}.zip" if r.startswith("win") else f"xrcopilotlab-demo-{r}.tar.gz",
}
FILE_VERSIONE = {"bp": "version.txt", "demo": "demo-version.txt"}


def git(*a):
    return subprocess.run(["git", *a], check=True, capture_output=True, text=True, cwd=RADICE).stdout


def numero(v):
    return tuple(int(x) for x in v.split("."))


def versione_a(ref, path):
    try:
        return json.loads(git("show", f"{ref}:{path}"))["version"]
    except subprocess.CalledProcessError:
        return None


def ultime_release(repo):
    """{tipo: versione} delle release più recenti e complete di CLI e registratore, lette con gh."""
    uscita = subprocess.run(
        ["gh", "api", "--paginate", f"repos/{repo}/releases?per_page=100",
         "--jq", '.[] | select(.draft | not) | {tag: .tag_name, allegati: [.assets[].name]}'],
        check=True, capture_output=True, text=True,
    ).stdout
    migliori = {}
    for riga in filter(None, uscita.splitlines()):
        r = json.loads(riga)
        m = re.fullmatch(r"(bp|demo)-v(\d+\.\d+\.\d+)", r["tag"])
        if not m:
            continue
        tipo, v = m.groups()
        mancanti = [x for x in RID if ALLEGATI[tipo](x) not in r["allegati"]]
        if mancanti:
            print(f"::warning::{r['tag']} non porta gli allegati per {', '.join(mancanti)}: non la adotto.")
            continue
        if tipo not in migliori or numero(v) > numero(migliori[tipo]):
            migliori[tipo] = v
    return migliori


def main(argv):
    prepara_console()
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--base", help="il commit prima del merge; senza, si allinea solo la CLI")
    ap.add_argument("--cli-da-github", metavar="OWNER/REPO", help="cerca le release bp-v/demo-v in questo repository")
    a = ap.parse_args(argv)

    fatto = []
    livelli = {}  # plugin → livello

    # 1. CLI e registratore — solo in avanti: una release più vecchia non sostituisce quella in uso.
    if a.cli_da_github:
        for tipo, v in sorted(ultime_release(a.cli_da_github).items()):
            attuale = (RADICE / "plugins" / "blueprints" / "bin" / FILE_VERSIONE[tipo]).read_text(encoding="utf-8").strip()
            if numero(v) > numero(attuale) and allinea(tipo, v):
                livelli["blueprints"] = "minor"
                fatto.append(f"{'CLI' if tipo == 'bp' else 'registratore'} {v}")

    # 2. Plugin toccati dal merge.
    minor_dai_messaggi = False
    if a.base:
        cambiati = git("diff", "--name-only", a.base, "HEAD").splitlines()
        for nome in sorted({p.split("/")[1] for p in cambiati if p.startswith("plugins/") and p.count("/") >= 2}):
            livelli.setdefault(nome, None)
        messaggi = git("log", "--format=%B", f"{a.base}..HEAD")
        minor_dai_messaggi = bool(re.search(r"^\s*feat(\(|!|:)", messaggi, flags=re.M))

    toccati = []
    for nome, livello in sorted(livelli.items()):
        path = f"plugins/{nome}/.claude-plugin/plugin.json"
        if not (RADICE / path).is_file():
            continue  # plugin rimosso
        toccati.append(nome)
        livello = livello or ("minor" if minor_dai_messaggi else "patch")
        livelli[nome] = livello
        ora = json.loads((RADICE / path).read_text(encoding="utf-8"))["version"]
        prima = versione_a(a.base, path) if a.base else ora
        if prima is not None and ora != prima:
            print(f"{nome}: già alzato nella PR ({prima} → {ora}).")
            continue
        p_old, p_new = alza_plugin(nome, livello)
        print(f"{nome}: {p_old} → {p_new}")
        fatto.append(f"{nome} {p_new}")

    # 3. Catalogo, una volta sola.
    if toccati:
        catalogo = ".claude-plugin/marketplace.json"
        ora = json.loads((RADICE / catalogo).read_text(encoding="utf-8"))["version"]
        prima = versione_a(a.base, catalogo) if a.base else ora
        if ora == prima:
            livello = "minor" if "minor" in livelli.values() else "patch"
            c_old, c_new = alza_catalogo(livello)
            print(f"catalogo: {c_old} → {c_new}")
            fatto.append(f"catalogo {c_new}")
        else:
            print(f"catalogo: già alzato nella PR ({prima} → {ora}).")

    cambiato = bool(fatto)
    messaggio = "chore(release): " + ", ".join(fatto) if cambiato else ""
    print(messaggio or "Niente da alzare.")
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as f:
            f.write(f"cambiato={'true' if cambiato else 'false'}\nmessaggio={messaggio}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
