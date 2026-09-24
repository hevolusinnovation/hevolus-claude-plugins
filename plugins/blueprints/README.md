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

## Le tre skill

| Skill | Si attiva quando | Produce |
|---|---|---|
| `xrcopilotlab-blueprint` | «crea un blueprint», «configura il cliente da zero», «applica il manifest», o si nomina `xrcopilotlab-bp` | il manifest `.yml`, il piano, il tenant configurato |
| `xrcopilotlab-blueprint-test` | «collauda il blueprint», «scrivi le domande di test», «vedi se funziona», «prepara le domande per il cliente», o si nomina `test run` | la suite `.tests.yml`, il report, il giudizio, le bozze di issue, le domande di prova per il cliente |
| `xrcopilotlab-blueprint-guide` | «scrivi la guida per il cliente», «spiega il blueprint al cliente», «una guida non tecnica» | la guida non tecnica `guida-<scenario>.md`, con i disegni, e la sua pagina web |

Si invocano anche per nome (`/xrcopilotlab-blueprint`, `/xrcopilotlab-blueprint-test`, `/xrcopilotlab-blueprint-guide`): senza
argomenti si orientano e si fermano, senza partire a fare domande.

Il dettaglio di ciascuna, con esempi di manifest e di suite: [§ Le
skill](../../docs/le-skill.md). Prima di usarlo serve l'accesso ad Azure:
[§ L'accesso](../../docs/accesso-azure.md).

## Cosa contiene

| | |
|---|---|
| `skills/xrcopilotlab-blueprint/` | La skill di provisioning, con le regole del grafo BPM, la traccia dell'intervista, i tre livelli della knowledge e come si ripartiscono i documenti, la scelta del modello, il ciclo per una fonte HTTP via MCP Builder, il riferimento del manifest e dei comandi, lo schema e due esempi |
| `skills/xrcopilotlab-blueprint-test/` | La skill di collaudo: scrive le domande per agenti, orchestratori e processi, le esegue con `xrcopilotlab-bp test run`, giudica le risposte, attribuisce ogni fallimento a un componente e ne ricava le domande di prova per il cliente; porta con sé il formato delle suite, il modello di esecuzione del motore BPM, i criteri del giudizio, la tabella del triage e una suite d'esempio |
| `skills/xrcopilotlab-blueprint-guide/` | La skill della guida per il cliente: racconta il flusso, dove lavora l'AI, come è stato collaudato e perché il manifest conviene, in parole non tecniche e con disegni semplici, e la pubblica come pagina web; porta con sé il vocabolario, i modelli dei disegni e le regole della pagina |
| `bin/` | Gli avviatori della CLI, che la scaricano al primo uso; dicono anche quando il plugin è indietro |
| `hooks/hooks.json` | All'apertura di una sessione, una riga se c'è una versione più recente del plugin (skill o CLI nuove), con i comandi per aggiornarlo |
| `docs/manuale.md` | Il manuale per chi lo usa |

I file sotto `skills/` sono una copia sincronizzata dal repository di prodotto: si modificano là,
non qui. Vedi [§ Manutenzione](../../docs/manutenzione.md).
