"""Costruisce lo zip di un plugin per Claude Desktop.

Quale plugin lo dice superfici.json, non questo script: si costruisce il pacchetto dei plugin
dichiarati «desktop», e provare a costruirlo per uno che gira su Claude Code si ferma qui invece di
produrre un archivio che nessuno potrebbe caricare.

Normalmente non serve lanciarlo a mano: la CI lo esegue a ogni release e allega lo zip alla pagina
Releases, che è da dove i colleghi lo scaricano (vedi docs/installare.md).
"""

import json
import sys
import zipfile
from pathlib import Path

from comune import RADICE, carica_manifest, carica_superfici, ferma, prepara_console

ESCLUSI = (".DS_Store",)


def scegli_plugin(richiesto):
    """Il plugin da impacchettare, e il nome con cui apparirà nell'app."""
    superfici = carica_superfici()
    desktop = [n for n, d in superfici.items() if d.get("superficie") == "desktop"]

    if richiesto:
        d = superfici.get(richiesto)
        if d is None:
            ferma(f"«{richiesto}» non è dichiarato in superfici.json")
        if d.get("superficie") != "desktop":
            ferma(
                f"«{richiesto}» gira su Claude Code, non su Desktop: si installa dal catalogo con "
                "/plugin install, e non c'è nessuno zip da costruire"
            )
        scelto = richiesto
    elif len(desktop) == 1:
        scelto = desktop[0]
    elif not desktop:
        ferma("Nessun plugin dichiarato «desktop» in superfici.json")
    else:
        ferma("Più plugin desktop (" + ", ".join(desktop) + "): scegli con --plugin <nome>")

    return scelto, superfici[scelto]["nomeNelPacchetto"]


def costruisci(plugin, nome_nel_pacchetto, out_dir):
    src = RADICE / "plugins" / plugin
    versione = carica_manifest(plugin)["version"]

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    zip_path = (out_dir / f"{nome_nel_pacchetto.capitalize()}-{versione}.zip").resolve()
    if zip_path.exists():
        zip_path.unlink()

    # Il manifest del pacchetto Desktop porta il nome con cui il plugin appare nell'app.
    manifest = carica_manifest(plugin)
    manifest["name"] = nome_nel_pacchetto
    manifest_testo = json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"

    skills = sorted(
        p for p in (src / "skills").rglob("*")
        if p.is_file() and p.name not in ESCLUSI and "__MACOSX" not in p.parts
    )

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(".claude-plugin/plugin.json", manifest_testo)
        for p in skills:
            z.write(p, f"skills/{p.relative_to(src / 'skills').as_posix()}")
        # Il manuale del plugin è il README che si legge dentro l'app.
        z.write(src / "docs" / "manuale.md", "README.md")

    print(zip_path)
    print("Caricalo su claude.ai/customize/plugins e conferma dall'anteprima.")


def main(argv):
    prepara_console()
    out_dir, plugin = None, None

    argv = list(argv)
    while argv:
        arg = argv.pop(0)
        if arg == "--plugin":
            plugin = argv.pop(0) if argv else None
        elif arg in ("-h", "--help"):
            print(__doc__.strip())
            print("\n  build-desktop-plugin [cartella-di-destinazione] [--plugin <nome>]")
            return 0
        else:
            out_dir = arg

    plugin, nome_nel_pacchetto = scegli_plugin(plugin)
    costruisci(plugin, nome_nel_pacchetto, out_dir or RADICE / "dist")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
