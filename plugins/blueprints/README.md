# blueprints

Configura un ambiente XRCopilotLab da un manifest YAML: topic, profili di knowledge, ruoli
aziendali, agenti con system message, modello e skill, connessioni, server MCP, orchestratori, agent
task e processi BPM pubblicati. Mostra il piano e chiede conferma prima di creare qualsiasi cosa.

**Manuale d'uso: [docs/manuale.md](docs/manuale.md).**

```
/plugin marketplace add hevolusinnovation/hevolus-claude-plugins
/plugin install blueprints@hevolus
```

Poi, dentro Claude Code, basta chiedere: «crea un blueprint per…». La skill conduce l'intervista,
scrive il file, lo valida e mostra il piano. Se il cliente ha dei documenti, propone anche come
dividerli fra i profili e su che modello mettere ciascun agente: «ho questi documenti, a quali
agenti li collego?».

## Cosa contiene

| | |
|---|---|
| `skills/xrcopilotlab-blueprint/` | La skill, con le regole del grafo BPM, la traccia dell'intervista, i tre livelli della knowledge e come si ripartiscono i documenti, la scelta del modello, il ciclo per una fonte HTTP via MCP Builder, il riferimento del manifest e dei comandi, lo schema e due esempi |
| `skills/xrcopilotlab-blueprint-test/` | La skill di collaudo: scrive le domande per agenti, orchestratori e processi, le esegue con `xrcopilotlab-bp test run`, giudica le risposte e attribuisce ogni fallimento a un componente; porta con sé il formato delle suite e un esempio |
| `bin/` | Gli avviatori della CLI, che la scaricano al primo uso |
| `docs/manuale.md` | Il manuale per chi lo usa |

I file sotto `skills/` sono una copia sincronizzata dal repository di prodotto: si modificano là,
non qui. Vedi il [README del catalogo](../../README.md).
