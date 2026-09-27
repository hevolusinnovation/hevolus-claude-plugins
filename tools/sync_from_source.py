"""Allinea il plugin al repository sorgente di XRCopilotLab.

Le skill e i loro riferimenti vivono in xrcopilotlab-webapp-dotnet: qui ne serve una copia, perché
chi installa il plugin quel repository non ce l'ha. Copiarla a mano vorrebbe dire vederla divergere
alla prima modifica, quindi la copia si rifà con questo script e si committa.

Nel repository di prodotto le skill puntano a `docs/` e a `blueprints/`, che chi installa il plugin
non ha: i link si riscrivono sui file copiati, qui sotto.

    sync-from-source [percorso-del-repo-xrcopilotlab]
"""

import shutil
import sys
from pathlib import Path

from comune import RADICE, ferma, leggi_testo, prepara_console, scrivi_testo

DEST = RADICE / "plugins" / "blueprints" / "skills" / "xrcopilotlab-blueprint"
DEST_TEST = RADICE / "plugins" / "blueprints" / "skills" / "xrcopilotlab-blueprint-test"
DEST_GUIDE = RADICE / "plugins" / "blueprints" / "skills" / "xrcopilotlab-blueprint-guide"

# Ogni riga: dove sta nel repository di prodotto → dove va nel plugin.
# Un riferimento nuovo in una skill va aggiunto QUI: se non compare, la copia nel plugin non esiste
# e la skill punta a un file che chi l'ha installata non ha.
COPIE = [
    # La skill di provisioning e i riferimenti che le appartengono.
    (".claude/skills/xrcopilotlab-blueprint/SKILL.md", DEST / "SKILL.md"),
    (".claude/skills/xrcopilotlab-blueprint/references/installazione.md", DEST / "references"),
    (".claude/skills/xrcopilotlab-blueprint/references/regole-del-grafo.md", DEST / "references"),
    (".claude/skills/xrcopilotlab-blueprint/references/intervista.md", DEST / "references"),
    (".claude/skills/xrcopilotlab-blueprint/references/mcp-builder.md", DEST / "references"),
    (".claude/skills/xrcopilotlab-blueprint/references/knowledge.md", DEST / "references"),
    (".claude/skills/xrcopilotlab-blueprint/references/modelli.md", DEST / "references"),
    # I riferimenti che nel repository stanno altrove e qui devono viaggiare con la skill.
    ("docs/blueprints/manifest-reference.md", DEST / "references"),
    ("docs/blueprints/cli-reference.md", DEST / "references"),
    ("docs/blueprints/microsoft365-setup.md", DEST / "references"),
    ("src/XRCopilotLab/XRCopilotLab.BluePrints/Schema/blueprint.v1.schema.json", DEST / "references"),
    ("blueprints/studiopolis-agenda.yml", DEST / "references" / "esempio-agenda.yml"),
    ("blueprints/test-agenda.yml", DEST / "references" / "esempio-minimo.yml"),
    # La skill di collaudo: collauda un blueprint applicato con `xrcopilotlab-bp test`.
    (".claude/skills/xrcopilotlab-blueprint-test/SKILL.md", DEST_TEST / "SKILL.md"),
    (".claude/skills/xrcopilotlab-blueprint-test/references/domande.md", DEST_TEST / "references"),
    (".claude/skills/xrcopilotlab-blueprint-test/references/giudizio.md", DEST_TEST / "references"),
    (".claude/skills/xrcopilotlab-blueprint-test/references/triage.md", DEST_TEST / "references"),
    (".claude/skills/xrcopilotlab-blueprint-test/references/segnalazione.md", DEST_TEST / "references"),
    (".claude/skills/xrcopilotlab-blueprint-test/references/consegna-dev.md", DEST_TEST / "references"),
    (".claude/skills/xrcopilotlab-blueprint-test/references/bpm.md", DEST_TEST / "references"),
    (".claude/skills/xrcopilotlab-blueprint-test/references/browser.md", DEST_TEST / "references"),
    (".claude/skills/xrcopilotlab-blueprint-test/references/guida-cliente.md", DEST_TEST / "references"),
    ("docs/blueprints/testing.md", DEST_TEST / "references"),
    ("blueprints/tests/studiopolis-agenda.tests.yml", DEST_TEST / "references" / "esempio-suite-agenda.tests.yml"),
    # La skill delle due guide — per il cliente a slide, tecnica per l'AI Specialist: legge manifest, suite, materiali e dossier, non esegue niente.
    (".claude/skills/xrcopilotlab-blueprint-guide/SKILL.md", DEST_GUIDE / "SKILL.md"),
    (".claude/skills/xrcopilotlab-blueprint-guide/references/linguaggio.md", DEST_GUIDE / "references"),
    (".claude/skills/xrcopilotlab-blueprint-guide/references/grafici.md", DEST_GUIDE / "references"),
    (".claude/skills/xrcopilotlab-blueprint-guide/references/pagina-web.md", DEST_GUIDE / "references"),
    (".claude/skills/xrcopilotlab-blueprint-guide/references/guida-tecnica.md", DEST_GUIDE / "references"),
]

# I link da riscrivere sui file copiati: file → [(prima, dopo), …].
RISCRITTURE = {
    DEST / "SKILL.md": [
        (
            "[`docs/blueprints/manifest-reference.md`](../../../docs/blueprints/manifest-reference.md)",
            "[`references/manifest-reference.md`](references/manifest-reference.md)",
        ),
        (
            "[`docs/blueprints/cli-reference.md`](../../../docs/blueprints/cli-reference.md)",
            "[`references/cli-reference.md`](references/cli-reference.md)",
        ),
        (
            "| Guida d'insieme | [`BLUEPRINTS.md`](../../../BLUEPRINTS.md) |",
            "| Manuale d'uso del plugin | [`../../docs/manuale.md`](../../docs/manuale.md) |",
        ),
        (
            "Lo schema autorevole è `src/XRCopilotLab/XRCopilotLab.BluePrints/Schema/blueprint.v1.schema.json`.\n"
            "Un esempio completo e commentato è in `blueprints/`.",
            "Lo schema è in [`references/blueprint.v1.schema.json`](references/blueprint.v1.schema.json).\n"
            "Due esempi commentati: [`references/esempio-agenda.yml`](references/esempio-agenda.yml) (scenario reale)\n"
            "e [`references/esempio-minimo.yml`](references/esempio-minimo.yml) (il giro più corto).",
        ),
        (
            "Il file va in `blueprints/<tag-minuscolo>-<slug>.yml`.",
            "Il file va in `blueprints/<tag-minuscolo>-<slug>.yml` dentro il progetto dell'utente; se quella\n"
            "cartella non esiste, si crea.",
        ),
    ],
    DEST / "references" / "cli-reference.md": [
        (
            "[`README.md`](README.md)",
            "[`manuale.md`](../../../docs/manuale.md)",
        ),
        (
            "[`primi-passi.md`](primi-passi.md)",
            "[`manuale.md`](../../../docs/manuale.md)",
        ),
        (
            "[`testing.md`](testing.md)",
            "[`testing.md`](../../xrcopilotlab-blueprint-test/references/testing.md)",
        ),
    ],
    DEST / "references" / "manifest-reference.md": [
        (
            "[`XRCopilotLab.BluePrints/Schema/blueprint.v1.schema.json`]"
            "(../../src/XRCopilotLab/XRCopilotLab.BluePrints/Schema/blueprint.v1.schema.json)",
            "[`blueprint.v1.schema.json`](blueprint.v1.schema.json)",
        ),
        (
            "[`blueprints/test-agenda.yml`](../../blueprints/test-agenda.yml)",
            "[`esempio-minimo.yml`](esempio-minimo.yml)",
        ),
    ],
    DEST / "references" / "mcp-builder.md": [
        (
            "[`docs/blueprints/microsoft365-setup.md`](../../../../docs/blueprints/microsoft365-setup.md)",
            "[`references/microsoft365-setup.md`](microsoft365-setup.md)",
        ),
    ],
    DEST_TEST / "SKILL.md": [
        (
            "[`docs/blueprints/testing.md`](../../../docs/blueprints/testing.md)",
            "[`references/testing.md`](references/testing.md)",
        ),
        # La stessa destinazione compare anche con altre etichette: si riscrive il solo indirizzo.
        (
            "](../../../docs/blueprints/testing.md)",
            "](references/testing.md)",
        ),
    ],
    DEST_TEST / "references" / "testing.md": [
        (
            "[`.claude/skills/xrcopilotlab-blueprint-test/references/triage.md`]"
            "(../../.claude/skills/xrcopilotlab-blueprint-test/references/triage.md)",
            "[`triage.md`](triage.md)",
        ),
    ],
}


def sincronizza(src_root):
    copiati = set()
    for origine, destinazione in COPIE:
        sorgente = src_root / origine
        if not sorgente.is_file():
            ferma(f"Non trovo {sorgente}: la sorgente si è spostata, o lo script è indietro")
        if destinazione.suffix:
            finale = destinazione
        else:
            finale = destinazione / sorgente.name
        finale.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(sorgente, finale)
        copiati.add(finale.resolve())
    return copiati


def riscrivi_link():
    for percorso, sostituzioni in RISCRITTURE.items():
        testo = leggi_testo(percorso)
        mancate = []
        for prima, dopo in sostituzioni:
            if prima not in testo:
                # Non è un dettaglio: un link non riscritto punta, nel plugin, a un file che non c'è.
                mancate.append(prima.splitlines()[0])
                continue
            testo = testo.replace(prima, dopo)
        scrivi_testo(percorso, testo)
        nome = percorso.relative_to(RADICE)
        if mancate:
            print(f"  ATTENZIONE {nome}: non ho trovato cosa riscrivere — " + " · ".join(mancate))
            print("             il testo nella sorgente è cambiato: aggiorna le RISCRITTURE in tools/sync_from_source.py")
        else:
            print(f"  percorsi riscritti in {nome}")


def cerca_orfani(copiati):
    """I file che stanno nel plugin ma nessuno sincronizza.

    Sono quelli copiati a mano una volta: restano fermi per sempre, e nessuno se ne accorge finché
    la skill non cita qualcosa che nella sorgente è cambiato mesi prima.
    """
    orfani = []
    for dest in (DEST, DEST_TEST):
        for p in sorted(dest.rglob("*")):
            if p.is_file() and p.name != ".DS_Store" and p.resolve() not in copiati:
                orfani.append(p.relative_to(RADICE))
    if orfani:
        print()
        print("File nel plugin che nessuno sincronizza — aggiungili a COPIE o cancellali:")
        for p in orfani:
            print(f"  - {p}")
    return orfani


def main(argv):
    prepara_console()
    src_root = Path(argv[0] if argv else RADICE.parent / "xrcopilotlab-webapp-dotnet")

    if not (src_root / "CLAUDE.md").is_file():
        print(f"Non trovo il repository XRCopilotLab in '{src_root}'.", file=sys.stderr)
        ferma("Passalo come argomento: sync-from-source /percorso/di/xrcopilotlab-webapp-dotnet")

    copiati = sincronizza(src_root)
    riscrivi_link()
    orfani = cerca_orfani(copiati)

    print()
    print(f"Allineato da: {src_root}")
    return 1 if orfani else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
