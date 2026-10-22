#!/usr/bin/env python3
"""
Porta il plugin `blueprints` a una release nuova della CLI (bp) o del registratore (demo), e alza plugin e
catalogo di una minor: è la PR che si apriva a mano dopo ogni release. La lanciano da sole le pipeline di
release (blueprints-cli-release.yml nella webapp, demo-cli-release.yml nel registratore) dopo aver
rispecchiato la release qui; si può lanciare anche a mano.

  python3 tools/alza_release.py --tipo bp   --versione 2.28.0
  python3 tools/alza_release.py --tipo demo --versione 1.5.0

Esce con 0 e non tocca niente se il plugin chiede già quella versione (stampa «già allineato»).
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
BIN = RADICE / "plugins" / "blueprints" / "bin"
# I documenti che citano la release della CLI con il suo link: si aggiornano insieme al numero.
LINK_BP = [RADICE / "README.md", RADICE / "docs" / "installare.md",
           RADICE / "plugins" / "blueprints" / "skills" / "xrcopilotlab-blueprint" / "references" / "installazione.md"]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tipo", choices=["bp", "demo"], required=True)
    ap.add_argument("--versione", required=True)
    a = ap.parse_args()
    if not re.fullmatch(r"\d+\.\d+\.\d+", a.versione):
        sys.exit(f"versione non valida: {a.versione} (serve X.Y.Z)")

    file = BIN / ("version.txt" if a.tipo == "bp" else "demo-version.txt")
    prima = file.read_text(encoding="utf-8").strip()
    if prima == a.versione:
        print(f"già allineato: {file.relative_to(RADICE)} = {prima}")
        return 0
    file.write_text(a.versione + "\n", encoding="utf-8")
    print(f"{file.relative_to(RADICE)}: {prima} → {a.versione}")

    if a.tipo == "bp":
        for doc in LINK_BP:
            if not doc.is_file():
                continue
            testo = doc.read_text(encoding="utf-8")
            nuovo = testo.replace(f"bp-v{prima}", f"bp-v{a.versione}")
            if nuovo != testo:
                doc.write_text(nuovo, encoding="utf-8")
                print(f"  link aggiornati in {doc.relative_to(RADICE)}")

    subprocess.run([sys.executable, str(RADICE / "tools" / "alza_versioni.py"), "--plugin", "blueprints", "--livello", "minor"],
                   check=True, cwd=RADICE)
    return 0


if __name__ == "__main__":
    sys.exit(main())
