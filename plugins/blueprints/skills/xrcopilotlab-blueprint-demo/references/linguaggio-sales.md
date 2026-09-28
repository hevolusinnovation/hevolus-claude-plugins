# Il linguaggio del brief

Il brief lo legge un'agenzia, e l'agenzia riusa le parole che trova. Una parola tecnica nel brief
diventa una parola tecnica in un post. Per questo il brief usa già il lessico finale: quello di chi
compra, non quello di chi costruisce.

Il vocabolario di base è lo stesso delle guide per il cliente,
[`../../xrcopilotlab-blueprint-guide/references/linguaggio.md`](../../xrcopilotlab-blueprint-guide/references/linguaggio.md).
Qui ci sono le differenze che contano per il marketing.

## Dire / non dire

Questa tabella entra **anche nel brief**, nella sezione «Le parole»: l'agenzia la deve avere sotto
gli occhi.

| Si dice | Non si dice | Perché |
|---|---|---|
| un **assistente** con un compito solo | agente, bot, AI agent, copilota | «agente» evoca autonomia; l'assistente propone |
| l'assistente **propone**, la persona **decide** | automatizza tutto, fa da solo, sostituisce | non è vero, e spaventa chi compra |
| una **pratica** che passa da una persona all'altra | processo BPM, workflow, istanza | |
| un **compito** che arriva alla persona giusta, con un tempo | task, work item, ticket | |
| un **controllo** che gira da solo ogni sera | job schedulato, cron, trigger | |
| l'**archivio** dei vostri documenti | knowledge base, knowledge graph, RAG, vector | |
| **collegato** alla vostra posta, al calendario, a un registro pubblico | integrazione API, connettore MCP, webhook | |
| **più ricerche insieme**, poi una sintesi | orchestrazione, pipeline, multi-agente | |
| il **vostro ambiente** | tenant, istanza, deployment | |
| si **vede prima** ogni modifica, e si procede dopo il vostro sì | piano, apply, provisioning, manifest | |
| **non inventa**: quando un dato manca, lo dice | zero allucinazioni, accuratezza 100% | la prima è una promessa verificabile, la seconda no |
| **intelligenza artificiale**, una volta, dove serve | AI-powered, AI generativa, LLM, GPT, modello | il prodotto non si vende col nome della tecnologia |

## La lista nera

Nessuna di queste parole compare nel brief (salvo la colonna «Non si dice» della tabella qui
sopra, dove servono come esempio). È il controllo bloccante del §4 della skill:

```
agente agenti agent orchestratore orchestrazione pipeline workflow BPM BPMN MCP API webhook
tenant manifest blueprint prompt LLM GPT RAG token embedding knowledge graph cron trigger
deploy provisioning endpoint JSON YAML dashboard backend
```

**«Agente di commercio» non si scrive nemmeno quando è la parola del settore.** È il mestiere del
venditore che gira dai clienti, ma nel brief l'agenzia la leggerebbe come un'intelligenza artificiale.
Si scrive «venditore della rete», «rete vendita», «commerciale».

Il controllo si fa sul testo del brief, esclusa la tabella «Le parole», con una ricerca per parola
intera e senza distinzione fra maiuscole e minuscole. Ogni occorrenza si riscrive con la colonna
«Si dice». Nomi di prodotti di terzi che il cliente conosce — Outlook, Microsoft 365 — si possono
usare: sono parole sue.

## Il tono

- **La giornata di lavoro, non la tecnologia.** «Lunedì alle 15 arriva una PEC e la pratica è già
  pronta» vale più di qualunque aggettivo.
- **Prima e dopo, in concreto.** Il prima è la fatica di oggi detta come la direbbe chi la fa; il dopo
  è la stessa scena, con meno ricopiature e più controllo.
- **Il controllo della persona è un argomento di vendita**, non una clausola: chi compra teme di
  perdere il controllo, e ogni scenario deve dire dove lo tiene.
- **Nessuna enfasi.** Niente «rivoluzionario», «potente», «intelligente», «in pochi clic»,
  «senza sforzo». Il brief convince perché è preciso; l'enfasi, se serve, la mette l'agenzia.
- **Frasi di una riga o due**, verbi attivi, «voi» per il cliente finale.

## Prima e dopo

> ❌ Un agente legge la mailbox via MCP, estrae le entità e apre un'istanza BPM con un work item per
> il referente.

> ✅ L'assistente legge la casella dell'agenda, riconosce un avviso di udienza e prepara la pratica
> con i dati già compilati. La referente la controlla e sceglie chi ci va.

> ❌ Riduce del 70% il tempo di gestione delle comunicazioni.

> ✅ Nessuno ricopia più gli estremi di una comunicazione: la referente li verifica sul testo
> originale, che resta accanto alla proposta.
