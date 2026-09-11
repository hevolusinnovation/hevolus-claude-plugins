#!/usr/bin/env bash
# Allinea il plugin al repository sorgente di XRCopilotLab.
#
# La skill e i suoi riferimenti vivono in xrcopilotlab-webapp-dotnet: qui ne serve una copia,
# perché chi installa il plugin quel repository non ce l'ha. Copiarla a mano vorrebbe dire vederla
# divergere alla prima modifica, quindi la copia si rifà con questo script e si committa.
#
#   ./sync-from-source.sh [percorso-del-repo-xrcopilotlab]

set -euo pipefail

SRC="${1:-../xrcopilotlab-webapp-dotnet}"
DEST="plugins/blueprints/skills/xrcopilotlab-blueprint"

if [ ! -f "$SRC/CLAUDE.md" ]; then
  echo "Non trovo il repository XRCopilotLab in '$SRC'." >&2
  echo "Passalo come argomento: ./sync-from-source.sh /percorso/di/xrcopilotlab-webapp-dotnet" >&2
  exit 1
fi

mkdir -p "$DEST/references"

# La skill e i riferimenti che le appartengono.
cp "$SRC/.claude/skills/xrcopilotlab-blueprint/SKILL.md"                       "$DEST/SKILL.md"
cp "$SRC/.claude/skills/xrcopilotlab-blueprint/references/regole-del-grafo.md" "$DEST/references/"
cp "$SRC/.claude/skills/xrcopilotlab-blueprint/references/intervista.md"       "$DEST/references/"
cp "$SRC/.claude/skills/xrcopilotlab-blueprint/references/mcp-builder.md"      "$DEST/references/"
cp "$SRC/.claude/skills/xrcopilotlab-blueprint/references/knowledge.md"        "$DEST/references/"

# I riferimenti che nel repository stanno altrove e qui devono viaggiare con la skill.
cp "$SRC/docs/blueprints/manifest-reference.md" "$DEST/references/"
cp "$SRC/docs/blueprints/cli-reference.md"      "$DEST/references/"
cp "$SRC/src/XRCopilotLab/XRCopilotLab.BluePrints/Schema/blueprint.v1.schema.json" "$DEST/references/"
cp "$SRC/blueprints/studiopolis-agenda.yml"     "$DEST/references/esempio-agenda.yml"
cp "$SRC/blueprints/test-agenda.yml"            "$DEST/references/esempio-minimo.yml"

# Nel repository la SKILL.md punta a percorsi che qui non esistono: si riscrivono sui file copiati.
python3 - "$DEST/SKILL.md" <<'PY'
import sys, re
p = sys.argv[1]
s = open(p).read()

s = s.replace("[`docs/blueprints/manifest-reference.md`](../../../docs/blueprints/manifest-reference.md)",
              "[`references/manifest-reference.md`](references/manifest-reference.md)")
s = s.replace("[`docs/blueprints/cli-reference.md`](../../../docs/blueprints/cli-reference.md)",
              "[`references/cli-reference.md`](references/cli-reference.md)")
s = s.replace("| Guida d'insieme | [`BLUEPRINTS.md`](../../../BLUEPRINTS.md) |",
              "| Manuale d'uso del plugin | [`../../docs/manuale.md`](../../docs/manuale.md) |")
s = s.replace("Lo schema autorevole è `src/XRCopilotLab/XRCopilotLab.BluePrints/Schema/blueprint.v1.schema.json`.\nUn esempio completo e commentato è in `blueprints/`.",
              "Lo schema è in [`references/blueprint.v1.schema.json`](references/blueprint.v1.schema.json).\n"
              "Due esempi commentati: [`references/esempio-agenda.yml`](references/esempio-agenda.yml) (scenario reale)\n"
              "e [`references/esempio-minimo.yml`](references/esempio-minimo.yml) (il giro più corto).")
s = s.replace("Il file va in `blueprints/<tag-minuscolo>-<slug>.yml`.",
              "Il file va in `blueprints/<tag-minuscolo>-<slug>.yml` dentro il progetto dell'utente; se quella\ncartella non esiste, si crea.")

open(p, "w").write(s)
print("percorsi della skill riscritti")
PY

echo "Allineato da: $SRC"
ls -1 "$DEST/references"
