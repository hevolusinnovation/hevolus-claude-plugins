"""Le cose che servono a tutti gli script di questo repository.

La logica sta in Python e non negli script di shell per una ragione sola: deve girare uguale su
macOS, Linux e Windows. Gli `.sh` e i `.ps1` alla radice sono avviatori sottili — due porte sulla
stessa stanza — così non esistono due implementazioni che possono divergere.
"""

import json
import sys
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent


def prepara_console():
    """Fa parlare la console in UTF-8 anche su Windows.

    I messaggi di questi script usano «virgolette», frecce e accenti: su una console Windows
    configurata in cp1252 una stampa del genere non dà un testo storto, solleva un'eccezione e lo
    script muore per un motivo che non c'entra niente con il suo lavoro.
    """
    for flusso in (sys.stdout, sys.stderr):
        riconfigura = getattr(flusso, "reconfigure", None)
        if riconfigura is not None:
            try:
                riconfigura(encoding="utf-8")
            except (ValueError, OSError):
                pass


def carica_superfici():
    """La dichiarazione di dove gira ciascun plugin."""
    return json.loads((RADICE / "superfici.json").read_text(encoding="utf-8"))


def carica_manifest(plugin):
    percorso = RADICE / "plugins" / plugin / ".claude-plugin" / "plugin.json"
    return json.loads(percorso.read_text(encoding="utf-8"))


def carica_catalogo():
    percorso = RADICE / ".claude-plugin" / "marketplace.json"
    return json.loads(percorso.read_text(encoding="utf-8"))


def leggi_testo(percorso):
    """Legge un file di testo senza toccare i fine riga."""
    return Path(percorso).read_text(encoding="utf-8", newline="")


def scrivi_testo(percorso, contenuto):
    """Scrive un file di testo senza toccare i fine riga.

    Su Windows, scrivere in modalità testo trasformerebbe ogni `\\n` in `\\r\\n`: un file
    sincronizzato da una macchina Windows risulterebbe cambiato in ogni sua riga.
    """
    with open(percorso, "w", encoding="utf-8", newline="") as f:
        f.write(contenuto)


def ferma(messaggio):
    """Esce con un errore, come `sys.exit(str)`, ma sempre su stderr e con codice 1."""
    print(messaggio, file=sys.stderr)
    raise SystemExit(1)
