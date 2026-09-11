# blueprints

Configura un ambiente XRCopilotLab da un manifest YAML: topic, ruoli aziendali, agenti con system
message e skill, agent task e processi BPM pubblicati. Mostra il piano e chiede conferma prima di
creare qualsiasi cosa.

**Manuale d'uso: [docs/manuale.md](docs/manuale.md).**

```
/plugin marketplace add hevolusinnovation/hevolus-claude-plugins
/plugin install blueprints@hevolus
```

Poi, dentro Claude Code, basta chiedere: «crea un blueprint per…». La skill conduce l'intervista,
scrive il file, lo valida e mostra il piano.

## Cosa contiene

| | |
|---|---|
| `skills/xrcopilotlab-blueprint/` | La skill, con le regole del grafo BPM, la traccia dell'intervista, il riferimento del manifest e dei comandi, lo schema e due esempi |
| `bin/` | Gli avviatori della CLI, che la scaricano al primo uso |
| `docs/manuale.md` | Il manuale per chi lo usa |

I file sotto `skills/` sono una copia sincronizzata dal repository di prodotto: si modificano là,
non qui. Vedi il [README del catalogo](../../README.md).
