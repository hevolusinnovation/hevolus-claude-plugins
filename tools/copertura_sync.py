"""Le skill del repository sorgente che il plugin non sincronizza.

    python tools/copertura_sync.py <percorso-di-xrcopilotlab-webapp-dotnet>

Una skill `xrcopilotlab-blueprint*` nella sorgente senza nemmeno una riga in COPIE
(tools/sync_from_source.py) non ha copia nel plugin: chi lo installa non la vede, e le skill che la
citano puntano a un file che non c'è. Esce 1 e le elenca.
"""

import sys
from pathlib import Path

from comune import prepara_console
from sync_from_source import COPIE


# Skill di chi sviluppa il prodotto: non hanno ragione di stare nel plugin.
ESCLUSE = {"xrcopilotlab-blueprint-sync"}


def main(argv):
    prepara_console()
    if not argv:
        raise SystemExit("uso: copertura_sync.py <percorso-di-xrcopilotlab-webapp-dotnet>")
    skills = Path(argv[0]) / ".claude" / "skills"
    coperte = {p.split("/")[2] for p, _ in COPIE if p.startswith(".claude/skills/")}
    mancanti = sorted(
        d.name for d in skills.glob("xrcopilotlab-blueprint*") if d.is_dir() and d.name not in coperte and d.name not in ESCLUSE
    )
    if mancanti:
        print("Skill nella sorgente senza copia nel plugin (aggiungerle a COPIE in tools/sync_from_source.py):")
        for n in mancanti:
            print(f"  - {n}")
        return 1
    print("Ogni skill xrcopilotlab-blueprint* della sorgente ha le sue righe in COPIE.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
