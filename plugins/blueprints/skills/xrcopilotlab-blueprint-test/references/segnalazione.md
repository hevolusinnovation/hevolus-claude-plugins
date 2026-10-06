# Scrivere la segnalazione

Una segnalazione che nasce da un collaudo ha un vantaggio che le altre non hanno: **le prove ci
sono già**. La domanda, la risposta, il log, i file consultati, la versione. Il lavoro è metterle
nell'ordine in cui chi corregge le vuole, e nel repository giusto — con la forma che quel
repository pretende.

La bozza si scrive prima in `~/.xrcopilotlab/blueprints/<TAG>/reports/<aaaammgg-hhmmss>/segnalazioni/<n>-<repo>-<slug>.md`
e si apre **solo dopo il sì** dell'utente su quella bozza.

## Dove si apre, e in che forma

**Sempre in `hevolusinnovation/xrcopilotlab-webapp-dotnet`**, anche quando la correzione andrà
in una libreria: è il repository in cui il lavoro dell'AI Team viene pianificato (progetto «AI
Team» #5), e i cloni delle librerie sono dove si guarda, non dove si segnala. Il componente lo
dicono le label:

| Componente | Label | Dove si guarda (nel corpo, come «technical evidence») |
|---|---|---|
| KnowledgeGraph | `bug`, `kgraph` | `hevolusinnovation/xrcopilotlab-knowledge-graph` (clone `../xrcopilotlab-knowledge-graph`) |
| Skills | `bug`, `skills` | `hevolusinnovation/xrcopilotlab-agent-framework` (clone `../xrcopilotlab-agent-framework`) |
| Orchestration, Process, WebApp | `bug`, `blueprints` | questo repository |

La issue la scrive la skill `xrcopilotlab-issue-report`, con la sua regola: **il problema, non
il codice** — niente file, classi, metodi, SQL, snippet. Vale anche per una issue che nasce da un
collaudo. Che cosa le passi:

- **Problem**: che cosa fa l'agente, osservato. «Asked for the balance of three named accounts
  from the journal, the normalization agent answers that the account rows are not available and
  returns closing entries instead; the chain then reports "not determinable".»
- **Impact**: chi lo vede e come. «Any question that names account codes and a filter phrase;
  the demo question D1 of FinLogic cannot be answered.»
- **Steps to reproduce**: ambiente, tenant, blueprint e run; la suite e la chiave del caso
  (`finlogic-bilancio-aggregato.tests.yml` del tag `FINLOGIC`, `d1-tre-conti`); la domanda esatta;
  la data del report.
- **Expected behavior**: la risposta attesa in prosa del caso, con i numeri.
- **Acceptance criteria**: il caso della suite passa (e, per un file tabellare, il caso proposto
  per `AssessmentRegressionTests` della libreria).
- La riga di chiusura ammessa — `> Implementation notes captured for the planning phase.` — è il
  posto in cui dire che la bozza tecnica esiste: «Technical evidence: blueprint test report of
  <data>, case <key>, execution <id>».

La **bozza tecnica** resta nel report, in
`~/.xrcopilotlab/blueprints/<TAG>/reports/<aaaammgg-hhmmss>/segnalazioni/<n>-<slug>.md` — e nell'archivio, con
`files put <cartella del report> --kind report --tag <TAG>` —, ed è quella che chi corregge
apre dopo aver letto la issue. Modello:

```markdown
# <Componente>: <cosa fa di sbagliato, in una riga>

Issue: #<n> (dopo l'apertura) · label <kgraph|skills|blueprints>
Codice da guardare: <repository della libreria, o questo>

## Cosa succede
<Una frase: con questo input, il componente restituisce X invece di Y.>

## Come riprodurre
- Versione: `XRCopilotLab.KnowledgeGraph` <KnowledgeGraphVersion> / `XRCopilotLab.Agent.*` <AgentFrameworkVersion> (branch <nome>), ambiente <staging>, run <runId>
- Entità: <agente/orchestratore>, profilo <nome>, file <elenco con tipo>
- Domanda (esatta):
  > <la domanda>
- Risposta ottenuta:
  > <la parte che conta>
- Evidenze: passi del log che contano (`InjectKgChunks`: profili, byte; `SkillExecution`: Result, MatchedSkills; passi dell'orchestratore con output), numeri trovati, conversazione/esecuzione `<id>`

## Cosa ci si aspettava
<La risposta attesa del caso, con i numeri e la tolleranza.>

## Dove guardare (ipotesi, con fiducia dichiarata)
<Il metodo o il flusso che sembra responsabile e perché — es. «`CanonicalRetriever`: la frase del
filtro ha vinto sugli identificativi; nessun instradamento al piano analitico». Se non c'è
un'ipotesi, dirlo.>

## Regressione proposta
<Il caso come test: la chiave della suite, e — per un file tabellare — la forma di
`AssessmentRegressionTests` (domanda → ciò che il retrieval deve restituire).>
```

Il titolo comincia con il componente — «Knowledge graph: …», «Skills: …», «BPM: …» — così
l'elenco delle issue si legge da solo.

## Che cosa non va scritto

- **Segreti, chiavi, connection string.** Il log dei passi contiene endpoint e nomi di
  deployment: quelli sì; una chiave, mai. Rileggere la bozza cercando `key=`, `sig=`, `Bearer`.
- **Dati personali del cliente.** Le domande della suite non ne hanno (regola in
  [`domande.md`](domande.md)); se la risposta ne contiene — un nome preso da un file del tenant —
  si sostituisce con `<nome>` e si dice che è stato sostituito.
- **Il testo intero della risposta quando basta un pezzo.** Chi legge deve trovare il punto.
- **Il giudizio al posto dell'evidenza.** «La risposta è sbagliata» non serve; «la risposta dice
  30 giorni, il file dice 20» sì.
- **La soluzione.** Un'ipotesi su dove guardare è utile; una pull request in prosa no.

## Dopo l'apertura

- Numero della issue accanto al caso nel `giudizio.md`.
- Se la stessa causa spiega più casi, **una** issue con tutti i casi elencati, non una per caso.
- Quando la libreria pubblica la correzione, il bump di versione (`KnowledgeGraphVersion` in
  `KGraph.props`, o `AgentFrameworkVersion`) si verifica rilanciando la suite: è per questo che
  la suite sta nell'archivio del blueprint (`test run --from-archive`).
