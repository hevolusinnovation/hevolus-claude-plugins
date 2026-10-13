"""Alza la versione di un plugin e quella del catalogo, nei tre punti dove stanno.

    python tools/alza_versioni.py [--plugin blueprints] [--livello minor|patch]

Tocca: plugins/<nome>/.claude-plugin/plugin.json, la voce del plugin in
.claude-plugin/marketplace.json e la versione del catalogo (anch'essa in marketplace.json). Sono i tre
numeri che verifica-versioni controlla e da cui la release automatica ricava il tag.

Lo usa il workflow che allinea le skill alla sorgente (xrcopilotlab-webapp-dotnet), perché una
copia rigenerata è un cambiamento di contenuto e deve portare un numero nuovo come ogni altro.
Le sostituzioni sono testuali: l'impaginazione dei JSON non cambia, il diff mostra solo i numeri.
"""

import argparse
import json
import re
import sys

from comune import RADICE, prepara_console


def alza(versione, livello):
    major, minor, patch = (int(x) for x in versione.split("."))
    if livello == "minor":
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


def sostituisci_una_volta(testo, schema, nuova, dove):
    """Sostituisce l'unica occorrenza di `schema`; se non c'è esattamente una, ferma tutto."""
    trovate = re.findall(schema, testo, flags=re.M)
    if len(trovate) != 1:
        raise SystemExit(f"{dove}: attese 1 occorrenza, trovate {len(trovate)}: non tocco niente.")
    return re.sub(schema, nuova, testo, count=1, flags=re.M)


def main(argv):
    prepara_console()
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--plugin", default="blueprints")
    ap.add_argument("--livello", choices=["minor", "patch"], default="minor")
    args = ap.parse_args(argv)

    plugin_json = RADICE / "plugins" / args.plugin / ".claude-plugin" / "plugin.json"
    catalogo = RADICE / ".claude-plugin" / "marketplace.json"

    p_testo = plugin_json.read_text(encoding="utf-8")
    c_testo = catalogo.read_text(encoding="utf-8")
    c_json = json.loads(c_testo)

    p_old = json.loads(p_testo)["version"]
    voce = next((p for p in c_json["plugins"] if p["name"] == args.plugin), None)
    if voce is None:
        raise SystemExit(f"Il catalogo non ha il plugin '{args.plugin}'.")
    if voce["version"] != p_old:
        raise SystemExit(f"plugin.json dice {p_old}, il catalogo {voce['version']}: allinearli prima di alzare.")

    p_new = alza(p_old, args.livello)
    c_old = c_json["version"]
    c_new = alza(c_old, args.livello)

    plugin_json.write_text(
        sostituisci_una_volta(p_testo, r'^(\s*"version"\s*:\s*)"' + re.escape(p_old) + '"', rf'\g<1>"{p_new}"', str(plugin_json)),
        encoding="utf-8",
    )

    # La versione del catalogo è quella a profondità 1; quella del plugin sta dentro «plugins».
    c_testo = sostituisci_una_volta(c_testo, r'^(  "version"\s*:\s*)"' + re.escape(c_old) + '"', rf'\g<1>"{c_new}"', "catalogo")
    nome = re.escape(args.plugin)
    blocco = re.search(r'("name"\s*:\s*"' + nome + r'".*?"version"\s*:\s*)"' + re.escape(p_old) + '"', c_testo, flags=re.S)
    if not blocco:
        raise SystemExit("Non trovo la versione del plugin nel catalogo.")
    c_testo = c_testo[: blocco.start()] + blocco.group(1) + f'"{p_new}"' + c_testo[blocco.end():]
    catalogo.write_text(c_testo, encoding="utf-8")

    print(f"{args.plugin}: {p_old} → {p_new} · catalogo: {c_old} → {c_new}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
