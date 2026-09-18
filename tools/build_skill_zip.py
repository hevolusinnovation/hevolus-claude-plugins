"""Costruisce lo zip di UNA skill per il caricamento su claude.ai (Impostazioni → Skill).

Non è lo stesso pacchetto del plugin: build_desktop_plugin produce un PLUGIN, con `.claude-plugin/`,
`skills/` e `README.md` alla radice dell'archivio. L'uploader delle skill vuole l'opposto — una sola
cartella di primo livello, che è la skill:

    xrcopilotlab-blueprint-test/
    ├── SKILL.md
    └── references/…

Caricare il pacchetto del plugin al posto di quello della skill dà l'errore
«All files must be inside the top-level folder».
"""

import re
import sys
import zipfile
from pathlib import Path

from comune import RADICE, ferma, leggi_testo, prepara_console

ESCLUSI = (".DS_Store",)


def controlla_frontmatter(skill_md, cartella):
    """Il frontmatter prima di tutto.

    L'uploader lo rifiuta dopo il caricamento, e l'errore non dice quale regola è saltata. Le regole
    sono tre, e due si violano senza accorgersene.
    """
    s = leggi_testo(skill_md)
    m = re.match(r"^---\n(.*?)\n---\n", s.replace("\r\n", "\n"), re.S)
    if not m:
        ferma(f"{skill_md}: manca il frontmatter YAML")
    fm = m.group(1)
    nome = re.search(r"^name:\s*(.+)$", fm, re.M).group(1).strip()
    desc = " ".join(re.search(r"^description:\s*(.*)$", fm, re.S | re.M).group(1).split())

    errori = []
    if nome != cartella:
        errori.append(f"il campo name ({nome}) non è il nome della cartella ({cartella})")
    if len(nome) > 64:
        errori.append(f"name di {len(nome)} caratteri, il massimo è 64")
    if not re.fullmatch(r"[a-z0-9-]+", nome):
        errori.append("name: ammessi solo minuscole, numeri e trattini")
    for parola in ("anthropic", "claude"):
        if parola in nome.lower():
            errori.append(f"name contiene la parola riservata «{parola}»")
    if not desc:
        errori.append("description vuota")
    if len(desc) > 1024:
        errori.append(f"description di {len(desc)} caratteri, il massimo è 1024")
    # Un segnaposto come <nome> viene letto come tag XML e fa rifiutare la skill.
    for campo, valore in (("name", nome), ("description", desc)):
        tag = re.findall(r"<[^<>\s][^<>]*>", valore)
        if tag:
            errori.append(f"{campo}: sembra contenere tag XML {tag} — riscrivili senza < >")

    if errori:
        ferma(f"{skill_md}\n  - " + "\n  - ".join(errori))
    print(f"  frontmatter ok — name {len(nome)}/64, description {len(desc)}/1024")


def costruisci(src, out_dir):
    src = Path(src).resolve()
    nome = src.name

    skill_md = src / "SKILL.md"
    if not skill_md.is_file():
        ferma(f"Non trovo {skill_md}")

    controlla_frontmatter(skill_md, nome)

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    zip_path = (out_dir / f"{nome}.zip").resolve()
    if zip_path.exists():
        zip_path.unlink()

    # L'unica cartella di primo livello dell'archivio: la skill, con il suo nome.
    file = sorted(
        p for p in src.rglob("*")
        if p.is_file() and p.name not in ESCLUSI and "__MACOSX" not in p.parts
    )
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for p in file:
            # I nomi dentro un archivio usano sempre «/», anche costruito su Windows.
            z.write(p, f"{nome}/{p.relative_to(src).as_posix()}")

    # Verifica: ogni voce dell'archivio sta dentro <nome>/, e SKILL.md è alla sua radice.
    with zipfile.ZipFile(zip_path) as z:
        nomi = z.namelist()
    fuori = [n for n in nomi if not n.startswith(nome + "/")]
    if fuori:
        ferma("FUORI dalla cartella di primo livello: " + ", ".join(fuori[:5]))
    if f"{nome}/SKILL.md" not in nomi:
        ferma(f"manca {nome}/SKILL.md alla radice della cartella")
    print(f"{zip_path}  ({len(nomi)} file, una sola cartella di primo livello: {nome}/)")


def main(argv):
    prepara_console()
    if argv[:1] == ["--all"]:
        out_dir = argv[1] if len(argv) > 1 else RADICE / "dist" / "skills"
        for skill in sorted((RADICE / "plugins").glob("*/skills/*")):
            if skill.is_dir():
                costruisci(skill, out_dir)
    elif argv:
        costruisci(argv[0], argv[1] if len(argv) > 1 else RADICE / "dist" / "skills")
    else:
        print(
            "Uso: build-skill-zip <cartella-della-skill> [destinazione]   oppure   build-skill-zip --all",
            file=sys.stderr,
        )
        return 2

    print()
    print("Caricalo su claude.ai → Impostazioni → Capacità → Skill (o la libreria skill del team).")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
