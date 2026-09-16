# Collaudo di un blueprint — `xrcopilotlab-bp test`

Un blueprint applicato è un insieme di agenti, orchestratori e processi che nessuno ha ancora
interrogato. Il collaudo è una **suite** di domande e input scritta accanto al manifest, che la
CLI esegue sul tenant raccogliendo tutto ciò che l'API restituisce, e un **report** che dice
caso per caso com'è andata e — quando è andata male — da quale componente cominciare a guardare.

La suite è la regressione del blueprint: si scrive una volta, si rilancia dopo ogni versione
della piattaforma o delle librerie (`XRCopilotLab.KnowledgeGraph`, `XRCopilotLab.Agent.*`) che
il tenant consuma. La skill `xrcopilotlab-blueprint-test` guida la scrittura delle domande, il
giudizio delle risposte, il triage e le segnalazioni.

## I tre comandi

```bash
xrcopilotlab-bp test init     blueprints/<nome>.yml                 # scheletro della suite dal manifest
xrcopilotlab-bp test validate blueprints/tests/<nome>.tests.yml     # verifica offline, contro il manifest
xrcopilotlab-bp test run      blueprints/tests/<nome>.tests.yml --env staging --company <guid>
```

| Comando | Cosa fa | Rete | Exit |
|---|---|---|---|
| `test init <manifest>` | Scrive `blueprints/tests/<nome>.tests.yml`: un caso positivo e uno negativo per agente, uno per orchestratore, uno per processo, con le attese deducibili dal manifest già compilate e le domande da scrivere (`TODO`). Non sovrascrive una suite esistente senza `--overwrite`; `--out` per un altro percorso | no | `0` |
| `test validate <suite>` | Struttura, segnaposto, contraddizioni; con il manifest (`--manifest`, o trovato da solo accanto alla suite) anche i riferimenti: entità, skill, file, attività, campi obbligatori del modulo di avvio | no | `0` valida · `2` errori |
| `test run <suite>` | Esegue i casi sul tenant, scrive `report.json` e `report.md` | sì | `0` tutti passati · `7` almeno un caso non passato · `2` suite non valida · `3` nessun run del tag |

Opzioni di `test run`: `--tag` (default: quello della suite), `--run <runId>` (default: l'ultimo
run completato del tag), `--only <k1,k2>` (chiavi, tag o entità dei casi da eseguire — un valore combacia con la chiave,
con un tag **o con il target**: `--only agenda` esegue anche i casi `sim-…` sull'agente `agenda`), `--out
<cartella>` (default `blueprints/tests/reports/<tag>/<data>/`), più le comuni `--env`,
`--company`, `--version`.

## Collaudare con ingressi veri

La suite esercita agenti, orchestratori e processi con domande e `caseData` scritti nel file. Quando
l'ingresso è vero — una mail nella casella sorvegliata, un dettato in chat all'agente che apre la
pratica — non c'è un caso da eseguire, ma ci sono tre domande, e tre comandi:

Se la casella è nostra, il giro si automatizza con un caso `kind: flow` (sotto, nel formato della
suite): la mail la manda la suite, i compiti li completa lei, il calendario lo controlla lei.

| Domanda | Comando | Cosa guardare |
|---|---|---|
| È passata? | `schedule logs <task-di-ingresso> --tag <TAG>` | L'esecuzione con il testo del messaggio; «NESSUN AVVISO» ai giri senza posta; la quota giornaliera |
| Dove sta la pratica? | `instances list --tag <TAG> --running` | Il nodo del token: `verifica:waiting` e `assegna:waiting` aspettano una persona |
| Perché non va avanti? | `instances show <id> --tag <TAG>` | Gli eventi in ordine, i compiti aperti, i dati del caso; un `AgentTaskDispatched` fermo da più di due minuti è la issue #1000 |

I passi automatici che scrivono fuori dal tenant (il calendario) stanno **dopo** i compiti umani:
finché un compito aspetta, non c'è niente da cercare nel calendario. Guida al triage:
[`.claude/skills/xrcopilotlab-blueprint-test/references/triage.md`](../../.claude/skills/xrcopilotlab-blueprint-test/references/triage.md).

## Come si risolvono le entità

Le entità del blueprint si trovano **dall'inventario del run**: sono gli id che il blueprint ha
creato, per chiave del manifest (`agents[].key`, `orchestrators[].key`, `processes[].key`). Senza
`--run` si usa l'ultimo run completato del tag; se non ce n'è nessuno e il manifest è pubblicato,
si cercano per nome qualificato (`BP-<TAG>-…`) sul tenant.

Un caso la cui entità non esiste sul tenant esce in **errore** («non trovato»): succede quando la
suite è scritta per una versione del manifest più nuova di quella applicata. È l'informazione
giusta, e `--only` permette di eseguire la parte che il tenant ha.

## Il formato della suite

```yaml
blueprint: studiopolis-agenda        # id del manifest
tag: STUDIOPOLIS                     # tag: da qui il run e le entità
version: 4                           # versione del manifest per cui è scritta (informativa)
description: Collaudo dello scenario Agenda

defaults:
  language: it                       # answerLanguage di ogni caso, salvo override
  timeoutSeconds: 180                # oltre → il caso è in errore
  userId: collaudo@hevolus.it        # per conto di chi si parla (default: l'utente della CLI)
                                     # un'email si traduce nell'id dell'utente sul tenant: serve
                                     # quando il processo ha ruoli di avvio

cases:
  - key: agenda-avviso-completo      # unica nella suite, compare nel report
    name: "Agenda: avviso completo"
    kind: agent                      # agent | orchestrator | process
    target: agenda                   # chiave nel manifest
    message: |                       # oppure conversation: [turno 1, turno 2]  (stessa conversazione)
      TRIBUNALE DI BARI — R.G. 4127/2025 — udienza 14 ottobre 2026 ore 9:30
    language: it                     # override del default
    timeoutSeconds: 60
    expect:
      answer: >                      # NON verificata dalla CLI: è per il giudizio umano
        Data, ora, sede, numero di ruolo; nessun termine proposto.
      contains: ["14 ottobre 2026", "4127/2025"]
      notContains: ["scadenza"]
      matches: ["(?i)R\\.G\\.\\s*\\d+/\\d{4}"]
      numbers:                       # confronto per valore, non per stringa; il segno conta
        - { label: righe, value: 5995 }
        - { label: saldo, text: "−495.233,91", tolerance: 0.5 }
      wrongAnswers:                  # risposte sbagliate note: se compaiono, fail con la diagnosi
        - { number: 5, means: "campione del recupero, non la popolazione", suspect: KnowledgeGraph }
        - { contains: "giroconto", means: "criterio per importo, vietato dal prompt" }
      language: it
      maxSeconds: 60
      noError: true                  # default true: scriverlo solo per toglierlo
      knowledge:
        used: true                   # almeno un chunk/file iniettato
        files: [Regolamento]         # per contenimento nel nome, senza maiuscole
        notFiles: [Listino]
      skills: [archviz]              # skill che devono risultare selezionate
      noSkills: false
      steps: [letture, confronto]    # orchestratore: passi con successo E stato Completed (Running/in pausa non contano)
      process:                       # processo
        events: [InstanceStarted, ActivityCompleted, WorkItemCreated]   # sottosequenza ordinata
        completed: [estrai]          # attività con ActivityCompleted
        waitingAt: verifica          # id dell'attività con un compito aperto
        status: Running              # stato dell'istanza quando il caso si ferma
        caseData:                    # chiave → frammento contenuto nel valore
          proposta: "14 ottobre 2026"
    caseData:                        # processo: i campi del modulo di avvio (tipi YAML 1.2)
      testoAvviso: "…"
      materia: Civile
    tags: [agent, negative]          # per --only e per leggere il report
    purpose: Che cosa il caso dimostra, in una frase.
    notes: Avvertenze, storia della domanda, cosa citare a voce.
```

Ogni attesa valorizzata è un controllo; un'attesa assente non controlla niente. `answer` è
l'unica che la CLI non verifica: la riporta accanto alla risposta reale, e il giudizio è di chi
legge — ed è per questo che il report conta i casi «da giudicare».

`numbers` legge i numeri della risposta come li scrive un documento contabile italiano
(`5.995`, `157.735,34`, `−495.233,91`) o un modello anglosassone (`157735.34`) e li confronta
**per valore** con la tolleranza dichiarata: è il modo di scrivere l'atteso di una domanda come
«quante righe hanno *Chiusura conti* nelle osservazioni» senza dipendere dalla formattazione.
`wrongAnswers` è la memoria delle risposte sbagliate già viste: ciascuna porta la sua diagnosi
(`means`) e, se lo si sa, il componente a cui rimanda (`suspect`), che il triage riprende. I set
di domande delle demo — atteso, tolleranza, «risposte sbagliate da riconoscere» — si traducono
così; l'esempio completo è `blueprints/tests/finlogic-bilancio-aggregato.tests.yml`.

### `kind: flow` — il giro intero, con ingressi veri

Quando la casella di collaudo è nostra, un caso può percorrere tutto il processo da solo: manda la
mail con un tool del blueprint, aspetta che il task schedulato la passi e che nasca l'istanza,
compila i compiti umani per conto di `defaults.userId`, controlla il calendario. È l'**unico** caso
in cui la CLI completa un compito al posto di una persona, e lo fa solo perché un passo `complete`
lo dichiara, con il modulo scritto nella suite.

```yaml
  - key: flusso-udienza
    kind: flow
    target: presa-in-carico              # il processo che deve aprire l'istanza
    steps:                               # in ordine; il primo che fallisce ferma il caso
      - name: mail alla casella
        tool: { server: m365, name: invia_messaggio,
                args: { a: test@hevolus.it, oggetto: "…", corpo: "…" } }
      - waitInstance: { caseData: { testoAvviso: "4127/2025" } }   # un'istanza nata dopo l'inizio del caso
        withinSeconds: 200                                          # (default 180)
      - expect: { waitingAt: verifica, caseData: { tipoProposto: Udienza } }   # come expect.process, con attesa
      - complete: { activity: verifica, form: { tipo: Udienza, datiCompleti: true, dataUdienza: "2026-09-22" } }
      - complete: { activity: assegna,  form: { professionista: "{{userId}}" } }
      - expect: { waitingAt: conferma, caseData: { esitoRegistrazione: REGISTRATO } }
      - tool: { server: m365, name: cerca_eventi, args: { inizio: "…", fine: "…" }, contains: ["4127/2025"] }
      - waitInstance: { absent: true, caseData: { testoAvviso: "Fattura" } }   # il messaggio va SCARTATO
```

| Passo | Cosa fa | Riesce se |
|---|---|---|
| `tool` | Chiama un tool di un server MCP del blueprint (`server`, `name`, `args`) | il tool non risponde con un errore, e la risposta contiene `contains` e non `notContains` |
| `waitInstance` | Aspetta un'istanza del processo target avviata dopo l'inizio del caso, il cui caseData contiene i frammenti in `caseData` | compare entro `withinSeconds`; con `absent: true`, se **non** compare |
| `complete` | Prende e completa il compito aperto sull'attività, con `form` | il compito c'è entro `withinSeconds` e il completamento riesce |
| `expect` | Le stesse attese di `expect.process`, verificate finché si assestano | tutte vere entro `withinSeconds` |

Segnaposto nelle stringhe di `args` e `form`: `{{userId}}` (l'utente di collaudo, come id — è
ciò che vuole un campo di tipo utente), `{{instanceId}}`, `{{caseData.<chiave>}}`. Nel report ogni
passo è un controllo con durata e dettaglio; un passo mai raggiunto non compare. Ciò che i passi
scrivono fuori dal tenant (gli eventi sul calendario) **resta**: la suite non lo cancella, e va
detto a chi legge. Esempio completo: `blueprints/tests/studiopolis-agenda-flusso.tests.yml`.

### Che cosa fa un caso, per tipo

| Tipo | Cosa fa la CLI | Quando si ferma |
|---|---|---|
| `agent` | Una chat sincrona con `enableLogs: true` sull'endpoint `default`, un turno per messaggio nella stessa conversazione | alla risposta dell'ultimo turno |
| `orchestrator` | `execute` sull'orchestratore, poi interroga lo stato ogni 3 secondi | a `completed`, `failed`, `cancelled`, `paused` (HITL: esce in errore) o al timeout |
| `process` | Avvia un'istanza con `caseData`, poi legge istanza, eventi e compiti ogni 3 secondi | quando c'è un compito aperto su `waitingAt` (o, senza, un compito aperto qualsiasi), quando lo stato non è più `Running`, o al timeout |

Per conto di chi si parla e si avvia lo decide `defaults.userId`: un'**email** si traduce nell'id
dell'utente sul tenant. Serve ai processi con ruoli di avvio, che confrontano l'id: senza, la CLI
usa il nome utente del sistema operativo e l'avvio esce 403 «Non autorizzato ad avviare questo
processo». Subito dopo l'avvio l'istanza può non esistere ancora (passa da una coda): la CLI
riprova sul 404 finché non compare o scade il timeout.

Per scrivere i casi di un processo serve il modello di esecuzione del motore (token, gateway,
work item, soglie) e le domande da farsi sul grafo: sono in
`.claude/skills/xrcopilotlab-blueprint-test/references/bpm.md`.

La CLI **non completa mai un compito umano**: sarebbe firmare un modulo al posto di una
persona. I rami di un processo si collaudano dal loro ingresso (un'istanza per combinazione del
modulo di avvio), non attraversandoli.

### Collaudare un agente su MCP senza la fonte: le letture simulate

Quando la fonte esterna non è ancora pronta — una casella di posta che nessuno controlla — la
**logica** dell'agente si collauda lo stesso: il contenuto che restituirebbe lo strumento va nel
messaggio, nella forma in cui lo restituirebbe (il corpo di una PEC, la risposta JSON di Graph), con
l'istruzione di non chiamare gli strumenti. Si tengono sotto un tag (`simulata`) e si spostano i casi
sulla fonte vera in una suite a parte, da lanciare quando c'è.

Due cose da sapere. La pipeline MCP aggiunge al messaggio «Use the available MCP tools…», quindi
l'agente **può** chiamare lo strumento vero nonostante l'istruzione: un errore di sistema o un dato
che non è nel testo incollato vuol dire questo, e va nel giudizio. E una lettura simulata non prova
la chiamata: formato delle date, permessi, fuso orario restano della suite sulla fonte vera.

La forma della risposta dello strumento conta: incollare la risposta **vera** di un'API (per esempio
`calendarView` con gli orari in UTC) ha trovato un difetto che una versione «ripulita» avrebbe
nascosto.

Un caso che fa **scrivere** un agente su una fonte esterna (creare un evento, mandare una mail) non
sta nella suite di regressione: lascia tracce fuori dal tenant. Va in una suite a parte, lanciata
solo con un sì esplicito.

## Il report

Due file nella cartella del report:

- `report.json` — tutto: per ogni caso i controlli, le evidenze intere (turni, risposta, passi
  del `CompletionLog` con parametri e durate, file di knowledge consultati, chunk, skill
  selezionate, intent, lingua, token; per un orchestratore i passi; per un processo istanza,
  eventi, compiti, case data), il sospetto.
- `report.md` — per leggere: riepilogo, tabella dei casi, «Dove guardare» raggruppato per
  componente, un capitolo per caso con domanda, risposta, risposta attesa, controlli, evidenze.

La cartella `blueprints/tests/reports/` è ignorata da git: contiene risposte e id del tenant.

### Gli esiti

| Esito | Significa |
|---|---|
| `Passed` | tutti i controlli verificabili sono passati (la risposta in prosa resta da giudicare) |
| `Failed` | almeno un controllo non è passato: il tenant ha risposto, e la risposta non è quella attesa |
| `Error` | nessuna risposta valutabile: errore di trasporto, timeout, entità non trovata, orchestratore in HITL |
| `Skipped` | escluso da `--only` |

### Il sospetto

Per ogni caso non passato il report indica **da quale componente cominciare a guardare**, con
un grado di fiducia e la ragione ancorata alle evidenze:

| Componente | Segnalazione | Codice da guardare |
|---|---|---|
| `Manifest` — prompt, partizione della knowledge, attesa scritta male | nessuna: si corregge il file | il manifest |
| `KnowledgeGraph` | issue in `xrcopilotlab-webapp-dotnet`, label `kgraph` | `hevolusinnovation/xrcopilotlab-knowledge-graph` |
| `Skills` | issue in `xrcopilotlab-webapp-dotnet`, label `skills` | `hevolusinnovation/xrcopilotlab-agent-framework` |
| `Orchestration`, `Process`, `WebApp` | issue in `xrcopilotlab-webapp-dotnet`, label `blueprints` | questo repository |
| `Environment` — rete, credenziali, tenant, lentezza | nessuna | — |

Le issue si aprono sempre nella webapp, dove l'AI Team pianifica il lavoro: la label dice il
componente, il corpo cita la libreria come «dove guardare».

La fiducia è `High` per un errore che nomina il componente, `Medium` per un comportamento letto
nel log, `Low` per un'inferenza da un'assenza. Un sospetto è un punto di partenza, non un
verdetto: la tabella evidenza → verifica è nella skill
(`.claude/skills/xrcopilotlab-blueprint-test/references/triage.md`).

## Codici dei rilievi (`BT0xx`)

| Codice | Rilievo | Severità |
|---|---|---|
| `BT001` | La suite non ha casi | errore |
| `BT002` | Un caso non ha la chiave | errore |
| `BT003` | Due casi condividono la chiave | errore |
| `BT004` | Un caso non indica l'entità (`target`) | errore |
| `BT005` | L'entità non esiste nel manifest | errore |
| `BT006` | Un caso su agente o orchestratore non ha `message` né `conversation` | errore |
| `BT007` | Un segnaposto `TODO` non è stato scritto | errore |
| `BT008` | Un'espressione regolare non è valida | errore |
| `BT010` | Nessuna attesa verificabile dalla CLI | avviso |
| `BT011` | Una skill attesa non è dichiarata dall'agente | avviso |
| `BT012` | Un file atteso non è nei profili dell'agente | avviso |
| `BT013` | Un'attività attesa non esiste nel processo | errore |
| `BT014` | Un campo obbligatorio del modulo di avvio manca nel `caseData` | errore |
| `BT015` | Il tag della suite non coincide con quello del manifest | avviso |
| `BT016` | Un passo atteso non esiste nell'orchestratore | avviso |
| `BT017` | Attese incompatibili (`skills` + `noSkills`, `used: false` + `files`) | errore |
| `BT018` | Un numero atteso non è leggibile (né `value` né un `text` interpretabile) | errore |
| `BT019` | Una risposta sbagliata da riconoscere non dice come riconoscerla (`contains`, `pattern` o `number`) | errore |
| `BT020` | Un caso `flow` senza passi, o un passo che non è esattamente uno fra `tool`, `waitInstance`, `complete`, `expect` | errore |
| `BT021` | Un passo `tool` cita un server MCP o un tool che il manifest non dichiara | errore |

## Dove vive il codice

| Cosa | Dove |
|---|---|
| Modelli della suite, del report, del sospetto | `XRCopilotLab.Core/Models/Blueprints/Testing/` |
| Parser, scheletro, validatore, valutatore, triage, report — funzioni pure | `XRCopilotLab.BluePrints/Testing/` |
| Esecuzione sul tenant (chat, orchestratori, processi) | `XRCopilotLab.BluePrints.Cli/Services/BlueprintTestRunner.cs` |
| Il comando | `XRCopilotLab.BluePrints.Cli/Commands/TestCommand.cs` |
| Test | `tests/BluePrints/Test*Tests.cs` |

Le suite dei blueprint del repository stanno in `blueprints/tests/`; `test-agenda.tests.yml` è
l'esempio minimo e completo del formato.
