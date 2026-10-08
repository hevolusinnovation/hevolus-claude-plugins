# blueprints

Configura un ambiente XRCopilotLab da un manifest YAML: topic, profili di knowledge, ruoli
aziendali, agenti con system message, modello e skill, connessioni, server MCP, orchestratori, agent
task e processi BPM pubblicati. Mostra il piano e chiede conferma prima di creare qualsiasi cosa.
E, una volta applicato, lo **collauda**: domande agli agenti, agli orchestratori e ai processi,
report, giudizio delle risposte, e l'attribuzione di ogni difetto al componente che lo causa.

**Manuale d'uso: [docs/manuale.md](docs/manuale.md).** Ogni comando della CLI, con tutte le opzioni:
[docs/cli.md](docs/cli.md).

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

## Le skill

| Skill | Si attiva quando | Produce |
|---|---|---|
| `xrcopilotlab-blueprint` | «crea un blueprint», «configura il cliente da zero», «applica il manifest», o si nomina `xrcopilotlab-bp` | il manifest `.yml`, il piano, il tenant configurato |
| `xrcopilotlab-blueprint-test` | «collauda il blueprint», «scrivi le domande di test», «vedi se funziona», «prepara le domande per il cliente», o si nomina `test run` | la suite `.tests.yml`, il report, il giudizio, le bozze di issue, le domande di prova per il cliente |
| `xrcopilotlab-blueprint-guide` | «scrivi la guida per il cliente», «spiega il blueprint al cliente», «una guida non tecnica», «le slide per i sales» | la guida non tecnica a story slides `guida-<scenario>.md`, con i disegni, e la sua pagina web |
| `xrcopilotlab-blueprint-demo` | «il brief per l'agenzia», «gli scenari per i sales», «cosa possiamo vendere da questo blueprint o assessment» | il brief per l'agenzia di marketing: gli scenari vendibili, anonimi e senza tecnicismi, come artifact «DEMO-» con il PDF |
| `xrcopilotlab-blueprint-storyboard` | «lo storyboard del blueprint», «le tavole del video», «la voce fuori campo» | lo storyboard di un video breve (80 s): tavole a 6 riquadri con schizzi, battute e audio guida di prova, come artifact; con il banco `xrcopilotlab-demo` il video narrato di default: un solo video reale — creazione da manifest con un processo disegnato a mano, poi il risultato — con la voce, senza sottotitoli, con download |
| `xrcopilotlab-blueprint-bpm-flow` | «il flow chart del blueprint», «disegna i processi del manifest», «il diagramma BPMN» | l'artifact «Flussi BPM <scenario>»: diagrammi a corsie, panoramica di quando partono e quanto durano, passo per passo, PDF |
| `xrcopilotlab-blueprint-version` | «la mail delle novità dei blueprint», «cosa è cambiato dalla 2.x alla 2.y» | la bozza di mail in HTML: comandi per aggiornare, link alla guida, novità per versione, riepilogo delle feature |
| `xrcopilotlab-blueprint-howto` | «come si usano le skill dei blueprint», «da dove comincio», «l'howto dei blueprint» | l'artifact «Dall'intervista alla demo»: il percorso intero, tappa per tappa |

Si invocano anche per nome (`/xrcopilotlab-blueprint`, `/xrcopilotlab-blueprint-test`, `/xrcopilotlab-blueprint-guide`, `/xrcopilotlab-blueprint-demo`, `/xrcopilotlab-blueprint-storyboard`, `/xrcopilotlab-blueprint-bpm-flow`, `/xrcopilotlab-blueprint-version`, `/xrcopilotlab-blueprint-howto`): senza
argomenti si orientano e si fermano, senza partire a fare domande.

Il dettaglio di ciascuna, con esempi di manifest e di suite: [§ Le
skill](../../docs/le-skill.md). Prima di usarlo serve l'accesso ad Azure:
[§ L'accesso](../../docs/accesso-azure.md).

## Cosa contiene

| | |
|---|---|
| `skills/xrcopilotlab-blueprint/` | La skill di provisioning, con le regole del grafo BPM, la traccia dell'intervista, i tre livelli della knowledge e come si ripartiscono i documenti, la scelta del modello, il ciclo per una fonte HTTP via MCP Builder, il riferimento del manifest e dei comandi, lo schema e due esempi |
| `skills/xrcopilotlab-blueprint-test/` | La skill di collaudo: scrive le domande per agenti, orchestratori e processi, le esegue con `xrcopilotlab-bp test run`, giudica le risposte, attribuisce ogni fallimento a un componente e ne ricava le domande di prova per il cliente; porta con sé il formato delle suite, il modello di esecuzione del motore BPM, i criteri del giudizio, la tabella del triage e una suite d'esempio |
| `skills/xrcopilotlab-blueprint-guide/` | La skill delle due guide della demo — per il cliente a story slides, tecnica per l'AI Specialist con passi e piano B di ogni demo —: racconta il flusso, dove lavora l'AI, domande di esempio con le risposte possibili e come è fatto l'ambiente descritto nel manifest, in parole non tecniche e con disegni semplici, senza i risultati del collaudo; la pubblica come pagina web e ne fa il deck per i sales; porta con sé il vocabolario, i modelli dei disegni e le regole della pagina |
| `skills/xrcopilotlab-blueprint-demo/` | La skill del brief per l'agenzia di marketing: da un manifest o da un assessment ricava gli scenari di processo vendibili — l'origine, quelli che se ne derivano e quelli già realizzati —, prova lo stato di ciascuno contro un registro di capacità già viste funzionare, anonimizza i clienti, toglie le parole tecniche e pubblica un artifact «DEMO-» con il PDF; porta con sé il registro degli scenari, il lessico, le regole di riservatezza e il modello della pagina |
| `skills/xrcopilotlab-blueprint-storyboard/` | La skill dello storyboard: da un manifest ricava un video breve in tavole — scene, tempi, schizzi, battute della voce — e un audio guida di prova, e di default ne ricava **un solo video narrato** dell'applicazione vera — creazione da manifest (con un processo disegnato a mano nell'editor) e risultato già creato, 1920×1080, cursore, voce neurale, senza sottotitoli — montato con `compose-video.py`; gli schizzi animati restano su richiesta; mostra sempre come si assegna la knowledge a un assistente e come nasce un assistente con le sue skill. La registrazione parte solo dopo un sì |
| `skills/xrcopilotlab-blueprint-bpm-flow/` | La skill dei flussi: dal manifest ricava un artifact con un diagramma BPMN per processo e orchestratore, la panoramica di quando partono e quanto durano, la spiegazione semplice e il PDF. Legge, non esegue: la pagina interpreta da sola il manifest incorporato |
| `skills/xrcopilotlab-blueprint-version/` | La skill della mail delle novità: legge lo storico del catalogo fra due versioni del plugin e compone una bozza HTML con i comandi per aggiornare, il link alla guida e il riepilogo delle feature |
| `skills/xrcopilotlab-blueprint-howto/` | La skill della guida d'uso: pubblica allo stesso link l'artifact «Dall'intervista alla demo», con il percorso dall'installazione alla demo, dopo averne confrontato i fatti con le skill installate; porta con sé la pagina |
| `bin/` | Gli avviatori della CLI (`xrcopilotlab-bp`) e del banco di registrazione video (`xrcopilotlab-demo`), che li scaricano al primo uso; il primo dice anche quando il plugin è indietro |
| `hooks/hooks.json` | All'apertura di una sessione, una riga se c'è una versione più recente del plugin (skill o CLI nuove), con i comandi per aggiornarlo |
| `docs/manuale.md` | Il manuale per chi lo usa |
| `docs/cli.md` | La guida completa alla CLI `xrcopilotlab-bp`: ogni comando, ogni opzione, conferme e codici di uscita |

I file sotto `skills/` sono una copia sincronizzata dal repository di prodotto: si modificano là,
non qui. Vedi [§ Manutenzione](../../docs/manutenzione.md).
