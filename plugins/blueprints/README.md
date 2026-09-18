# blueprints

Configura un ambiente XRCopilotLab da un manifest YAML: topic, profili di knowledge, ruoli
aziendali, agenti con system message, modello e skill, connessioni, server MCP, orchestratori, agent
task e processi BPM pubblicati. Mostra il piano e chiede conferma prima di creare qualsiasi cosa.
E, una volta applicato, lo **collauda**: domande agli agenti, agli orchestratori e ai processi,
report, giudizio delle risposte, e l'attribuzione di ogni difetto al componente che lo causa.

**Manuale d'uso: [docs/manuale.md](docs/manuale.md).**

```
/plugin marketplace add hevolusinnovation/hevolus-claude-plugins
/plugin install blueprints@hevolus
```

Poi, dentro Claude Code, basta chiedere: «crea un blueprint per…». La skill conduce l'intervista,
scrive il file, lo valida e mostra il piano. Se il cliente ha dei documenti, propone anche come
dividerli fra i profili e su che modello mettere ciascun agente: «ho questi documenti, a quali
agenti li collego?».

Quando il blueprint è applicato, il lavoro passa alla seconda skill: «collauda il blueprint
STUDIOPOLIS», «scrivi le domande di test per questi agenti», «cosa è andato male, e di chi è?».

## Le due skill

| Skill | Si attiva quando | Produce |
|---|---|---|
| `xrcopilotlab-blueprint` | «crea un blueprint», «configura il cliente da zero», «applica il manifest», o si nomina `xrcopilotlab-bp` | il manifest `.yml`, il piano, il tenant configurato |
| `xrcopilotlab-blueprint-test` | «collauda il blueprint», «scrivi le domande di test», «vedi se funziona», «prepara le domande per il cliente», o si nomina `test run` | la suite `.tests.yml`, il report, il giudizio, le bozze di issue, le guide per il cliente |

Si invocano anche per nome (`/xrcopilotlab-blueprint`, `/xrcopilotlab-blueprint-test`): senza
argomenti si orientano e si fermano, senza partire a fare domande.

Il dettaglio di ciascuna, con esempi di manifest e di suite: [§ Le
skill](../../docs/le-skill.md). Prima di usarlo serve l'accesso ad Azure:
[§ L'accesso](../../docs/accesso-azure.md).

## Cosa contiene

| | |
|---|---|
| `skills/xrcopilotlab-blueprint/` | La skill di provisioning, con le regole del grafo BPM, la traccia dell'intervista, i tre livelli della knowledge e come si ripartiscono i documenti, la scelta del modello, il ciclo per una fonte HTTP via MCP Builder, il riferimento del manifest e dei comandi, lo schema e due esempi |
| `skills/xrcopilotlab-blueprint-test/` | La skill di collaudo: scrive le domande per agenti, orchestratori e processi, le esegue con `xrcopilotlab-bp test run`, giudica le risposte, attribuisce ogni fallimento a un componente e ne ricava le guide per il cliente; porta con sé il formato delle suite, il modello di esecuzione del motore BPM, i criteri del giudizio, la tabella del triage e una suite d'esempio |
| `bin/` | Gli avviatori della CLI, che la scaricano al primo uso |
| `docs/manuale.md` | Il manuale per chi lo usa |

I file sotto `skills/` sono una copia sincronizzata dal repository di prodotto: si modificano là,
non qui. Vedi [§ Manutenzione](../../docs/manutenzione.md).
