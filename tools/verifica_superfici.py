"""Verifica che la separazione fra Claude Code e Claude Desktop tenga.

La regola sta in superfici.json: ogni plugin dichiara DOVE gira, e da lì discende tutto il resto —
se compare nel catalogo, che pacchetto si costruisce, cosa può contenere. Questo script controlla
che il repository sia d'accordo con quella dichiarazione, perché è l'unica parte della separazione
che non si può affidare alla memoria di chi modifica.
"""

import re
import sys

from comune import RADICE, carica_catalogo, carica_manifest, carica_superfici, ferma, prepara_console

# Su Claude Desktop non c'è un terminale: queste cartelle non avrebbero dove girare.
SOLO_SU_CODE = {
    "bin": "non esiste un PATH in cui finire",
    "hooks": "gli hook sono di Claude Code",
    "commands": "i comandi slash sono di Claude Code",
    "agents": "i subagent sono di Claude Code",
}


def link_rotti(skill_dir):
    """I link relativi di una skill che puntano a file che il plugin non ha.

    È il guasto più comune quando si aggiunge un riferimento: la skill si installa, si attiva, e poi
    si ferma su un file che nel repository di prodotto c'è e qui no.
    """
    rotti = []
    for f in sorted(skill_dir.rglob("*.md")):
        dentro_blocco = False
        for n, riga in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            if riga.lstrip().startswith("```"):
                dentro_blocco = not dentro_blocco
                continue
            if dentro_blocco:
                continue
            # `![](path.png)` dentro un code span è un esempio, non un link.
            riga = re.sub(r"`[^`]*`", "", riga)
            for link in re.findall(r"\]\(([^)\s]+)\)", riga):
                if link.startswith(("http://", "https://", "mailto:", "#")):
                    continue
                bersaglio = link.split("#", 1)[0]
                if bersaglio and not (f.parent / bersaglio).exists():
                    rotti.append(f"{f.relative_to(RADICE)}:{n} → {link}")
    return rotti


def avviatori_spaiati():
    """Ogni script deve esistere per tutti e due i sistemi.

    Aggiungerne uno solo `.sh` significa che chi lavora su Windows scopre che manca il giorno in cui
    gli serve — cioè nel momento peggiore.
    """
    posix = {p.stem for p in RADICE.glob("*.sh")}
    windows = {p.stem for p in RADICE.glob("*.ps1")}
    return (
        [f"{n}.sh non ha il gemello {n}.ps1: su Windows quello script non si può lanciare" for n in sorted(posix - windows)]
        + [f"{n}.ps1 non ha il gemello {n}.sh" for n in sorted(windows - posix)]
    )


def main():
    prepara_console()
    errori = avviatori_spaiati()

    superfici = carica_superfici()
    catalogo = carica_catalogo()
    nel_catalogo = {p["name"]: p for p in catalogo["plugins"]}

    cartelle = sorted(d.name for d in (RADICE / "plugins").iterdir() if d.is_dir())

    # 1. Nessun plugin senza dichiarazione, nessuna dichiarazione senza plugin.
    for nome in cartelle:
        if nome not in superfici:
            errori.append(f"plugins/{nome}/ non è dichiarato in superfici.json: aggiungilo dicendo dove gira")
    for nome in superfici:
        if nome not in cartelle:
            errori.append(f"superfici.json dichiara «{nome}», ma plugins/{nome}/ non esiste")

    for nome in sorted(set(superfici) & set(cartelle)):
        d = superfici[nome]
        base = RADICE / "plugins" / nome
        superficie = d.get("superficie")

        if superficie not in ("code", "desktop"):
            errori.append(f"{nome}: superficie «{superficie}» — i valori ammessi sono «code» e «desktop»")
            continue

        if not (base / ".claude-plugin" / "plugin.json").is_file():
            errori.append(f"{nome}: manca plugins/{nome}/.claude-plugin/plugin.json")
            continue
        manifest = carica_manifest(nome)

        # 2. Almeno una skill, e ogni skill con il suo SKILL.md.
        skills_dir = base / "skills"
        if not skills_dir.is_dir():
            errori.append(f"{nome}: manca plugins/{nome}/skills/")
        else:
            skills = sorted(s.name for s in skills_dir.iterdir() if s.is_dir())
            if not skills:
                errori.append(f"{nome}: skills/ è vuota")
            for s in skills:
                if not (skills_dir / s / "SKILL.md").is_file():
                    errori.append(f"{nome}: skills/{s}/ non ha SKILL.md")
                for rotto in link_rotti(skills_dir / s):
                    errori.append(f"{nome}: link a un file che il plugin non ha — {rotto}")

        if superficie == "code":
            # 3. Chi gira su Claude Code si installa dal catalogo: deve esserci, con la stessa versione.
            if d.get("distribuzione") != "marketplace":
                errori.append(
                    f"{nome}: superficie «code» ma distribuzione «{d.get('distribuzione')}» — dev'essere «marketplace»"
                )
            voce = nel_catalogo.get(nome)
            if voce is None:
                errori.append(f"{nome}: gira su Claude Code ma non è elencato in .claude-plugin/marketplace.json")
            elif voce.get("version") != manifest.get("version"):
                errori.append(
                    f"{nome}: versione {manifest.get('version')} in plugin.json e {voce.get('version')} "
                    "nel catalogo — devono coincidere"
                )
        else:
            # 4. Chi gira su Claude Desktop NON passa dal catalogo: il catalogo lo legge solo Claude Code.
            if d.get("distribuzione") != "zip":
                errori.append(
                    f"{nome}: superficie «desktop» ma distribuzione «{d.get('distribuzione')}» — dev'essere «zip»"
                )
            if nome in nel_catalogo:
                errori.append(
                    f"{nome}: gira su Claude Desktop ma è elencato in marketplace.json — chi lo installasse "
                    "da Claude Code si troverebbe una skill che lì non ha niente da fare"
                )
            if not d.get("nomeNelPacchetto"):
                errori.append(f"{nome}: manca «nomeNelPacchetto» — è il nome con cui il plugin appare nell'app")
            for cartella, perche in SOLO_SU_CODE.items():
                if (base / cartella).is_dir():
                    errori.append(f"{nome}: contiene {cartella}/, ma gira su Claude Desktop, dove {perche}")

    # 5. Il catalogo non deve elencare plugin che non esistono.
    for nome in nel_catalogo:
        if nome not in superfici:
            errori.append(f"marketplace.json elenca «{nome}», che non è dichiarato in superfici.json")

    for nome in sorted(superfici):
        dove = "Claude Code · catalogo" if superfici[nome].get("superficie") == "code" else "Claude Desktop · zip"
        print(f"  {nome:<14} {dove}")

    if errori:
        print()
        ferma("La separazione non torna:\n  - " + "\n  - ".join(errori))
    print("\nSeparazione coerente: superfici.json, i manifest e il catalogo dicono la stessa cosa.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
