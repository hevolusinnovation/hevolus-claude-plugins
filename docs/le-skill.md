# Le skill, una per una

Un plugin è un contenitore: quello che fa davvero il lavoro sono le **skill**, cioè le istruzioni
che Claude carica quando la richiesta le riguarda. I due plugin ne portano quattro, e conoscerle per
nome serve a due cose — sapere **come chiedere** perché si attivino, e sapere **cosa non chiedere**
perché non lo fanno.

Chi sviluppa su XRCopilotLab ne ha altre, che non passano dal catalogo perché vivono nel clone del
repository di prodotto: [§ Le skill di sviluppo](skill-di-sviluppo.md).

| Skill | Plugin | Si attiva quando | Produce |
|---|---|---|---|
| [`xrcopilotlab-blueprint`](#xrcopilotlab-blueprint--scrivere-e-applicare-un-blueprint) | blueprints | «crea un blueprint», «configura il cliente da zero», «applica il manifest», o si nomina `xrcopilotlab-bp` | il manifest `.yml`, il piano, il tenant configurato |
| [`xrcopilotlab-blueprint-test`](#xrcopilotlab-blueprint-test--collaudare-un-blueprint-applicato) | blueprints | «collauda il blueprint», «scrivi le domande di test», «vedi se funziona», «prepara le domande per il cliente», o si nomina `test run` | la suite `.tests.yml`, il report, il giudizio, le bozze di issue, le domande di prova per il cliente |
| [`xrcopilotlab-blueprint-guide`](#xrcopilotlab-blueprint-guide--la-guida-per-il-cliente) | blueprints | «scrivi la guida per il cliente», «spiega il blueprint al cliente», «una guida non tecnica», «la pagina da mostrare al cliente» | la guida `guida-<scenario>.md`, non tecnica, con i disegni, e la sua pagina web |
| [`xrcopilotlab-assessment`](#xrcopilotlab-assessment--dalla-proposta-al-dossier) | assessment (Claude Desktop) | si carica una proposta e si chiede di «valutarla», «fare l'assessment», «tradurla in soluzione» | il dossier tecnico `.md` e `.docx`, con il capitolo per il provisioning |

Le quattro skill sono i tempi dello stesso lavoro: l'assessment dice **cosa** costruire, il
blueprint lo **costruisce**, il collaudo dice **se funziona** e a chi tocca ciò che non va, la guida
lo **racconta al cliente** con le sue parole.

```
xrcopilotlab-assessment        xrcopilotlab-blueprint          xrcopilotlab-blueprint-test
  proposta → dossier      →      dossier → manifest → tenant  →   tenant → suite → report → giudizio
  (Claude Desktop)               (Claude Code)                    (Claude Code)
                                                                        ↓
                                                              issue (dopo un sì) · domande di prova
                                                                        ↓
                                                     xrcopilotlab-blueprint-guide: guida per il cliente
```

Di solito non serve nominarle: si attivano dalla richiesta. Quando due potrebbero valere — «testa il
blueprint» mentre lo si sta ancora scrivendo — si nomina quella giusta («usa la skill
`xrcopilotlab-blueprint-test`»). Chieste **senza dire cosa fare**, le due del plugin `blueprints` non
partono a fare domande: si orientano — a cosa servono, cosa serve per usarle, quali blueprint e quali
suite esistono già — e si fermano. È la strada giusta la prima volta.

### `xrcopilotlab-blueprint` — scrivere e applicare un blueprint

Porta da «vorrei un ambiente così» a un blueprint applicato su un tenant. Il lavoro è in due
metà, **scrivere il manifest** e **applicarlo**, e la seconda passa sempre dalla CLI
`xrcopilotlab-bp`, mai da chiamate dirette all'API, fermandosi a chiedere il permesso prima di
toccare il tenant.

**Da dove parte.** Da una di tre cose:

- **un dossier di assessment** — il documento prodotto su Claude Desktop dall'altra skill. Il
  capitolo «Elementi per il provisioning» contiene già tag, topic, ruoli con i membri, agenti con il
  system message, agent task e il disegno del processo: la skill lo traduce e chiede solo ciò che
  manca davvero;
- **un'intervista da zero**, una domanda per volta, seguendo una traccia che chiede prima il
  processo e poi le persone, e non fa ripetere ciò che si può dedurre;
- **un manifest già scritto**, da rivedere o da applicare.

**Come si chiede.** Frasi che la attivano, con quello che succede dopo:

| Cosa scrivi | Cosa fa la skill |
|---|---|
| «Crea un blueprint per lo studio legale Polis: un assistente che legge gli avvisi di udienza e un processo in cui il referente conferma la data» | Intervista breve, poi scrive `blueprints/studiopolis-agenda.yml`, lo valida, mostra il grafo del processo |
| «Ecco il dossier dell'assessment di Confindustria Como, prepara il blueprint» | Legge il capitolo per il provisioning, traduce, chiede solo i membri dei ruoli e i nomi dei segreti mancanti |
| «Ho questi documenti in `~/Documenti/como`, a quali agenti li collego?» | Lancia `xrcopilotlab-bp suggest` sulla cartella, propone un profilo di knowledge per agente e una fascia di modello, e spiega quali file il nome non basta a distinguere |
| «Applica `blueprints/como-conoscenza-associati.yml` su staging» | `push`, poi `plan`: stampa il piano — quante entità, quali nomi, il grafo — e **si ferma ad aspettare il sì** |
| «Sì, vai» (detto **dopo** aver visto il piano) | `apply --yes`, poi riporta entità create, `runId`, e la chiave del webhook se ce n'è una: compare una sola volta |
| «Cancella il blueprint TEST» | Riporta cosa sparirebbe e chiede un sì che nomini quel tag: senza `--confirm TEST` la CLI non procede |
| «Su quali ambienti posso lavorare?» | `environments`: prova a leggere ogni ambiente con la **tua** utenza e dice *accessibile* · *manca il ruolo* · *nessun accesso ad Azure* · *non raggiungibile*. Non è una stima: è ciò che succederà al primo comando |
| «Porta STUDIOPOLIS v29 da staging a produzione» | `promote` copia la versione nell'archivio di destinazione — byte per byte, stessa impronta — poi `plan` e **si ferma**: copiare è ripetibile, creare no. I passi per intero: [§ Da staging a produzione](da-staging-a-produzione.md) |
| «Fammi vedere il manifest della v27 che gira su staging» | `pull`: riscrive su disco il file com'era stato pubblicato, commenti compresi. Due `pull` e un `diff` dicono se due ambienti eseguono lo stesso blueprint |
| «Cosa sai fare con i blueprint?» · la skill chiesta senza altro | Orientamento: a cosa serve, cosa serve per usarlo, ambienti, blueprint esistenti. Nessuna intervista |

**Il giro dei comandi**, che la skill lancia per te nell'ordine giusto — e che puoi lanciare anche
a mano, perché `bin/` è nel PATH quando il plugin è attivo:

```bash
xrcopilotlab-bp validate blueprints/<file>.yml --graph            # offline: rilievi + grafo del processo
xrcopilotlab-bp suggest  blueprints/<file>.yml --files <cartella>  # come dividere i documenti fra i profili
xrcopilotlab-bp secrets set --env staging --tag <TAG> <nome>        # nel TUO terminale, mai con il prefisso !
xrcopilotlab-bp push     blueprints/<file>.yml --env staging        # pubblica la versione del manifest
xrcopilotlab-bp plan     --tag <TAG> --env staging --company <guid> # preflight + piano: nomi occupati, segreti, utenti
xrcopilotlab-bp apply    --tag <TAG> --env staging --company <guid> --yes   # solo dopo il sì sul piano
xrcopilotlab-bp status   --env staging --company <guid>             # cosa c'è sul tenant, un rigo per blueprint
xrcopilotlab-bp rollback --run <runId>                              # smonta ciò che l'inventario del run elenca
```

**Che aspetto ha un manifest.** Un estratto dell'esempio minimo che viaggia con la skill
(`references/esempio-minimo.yml`): un topic, un ruolo, un agente, un agent task e un processo con
un gateway. I nomi si scrivono **senza** il prefisso `BP-<TAG>-`: lo aggiunge il planner.

```yaml
blueprint: test-agenda
version: 1
tag: TEST
description: Presa in carico di un avviso di udienza arrivato via email

tenant:
  companyId: 00000000-0000-0000-0000-000000000000
  topic: Agenda di Studio

businessRoles:
  - key: referente
    name: Referente agenda
    members: [test@hevolus.it]          # utenti DEL TENANT XRCopilotLab, non identità Azure

agents:
  - key: agenda
    name: Agenda
    language: it
    systemMessage: |
      Ricevi il testo di un avviso di udienza e restituisci data e ora, sede, numero di ruolo, parti.
      Se un dato non è presente scrivi «non indicato»: non dedurlo e non inventarlo.
    skills: []

agentTasks:
  - key: estrai-udienza
    name: Estrazione udienza
    agent: agenda
    prompt: |
      Estrai gli estremi dell'udienza dal seguente avviso:
      {{testoAvviso}}

processes:
  - key: presa-in-carico
    publish: true
    starterRoles: [referente]
    spec:
      activities:
        - id: start
          type: Start
          name: Avviso ricevuto
          form:
            - { key: testoAvviso, label: Testo dell'avviso, type: textarea, required: true }

        - id: estrai
          type: Task
          name: Estrai gli estremi
          performer: Automated                 # eseguito dall'agent task
          agentTaskName: Estrazione udienza    # nella spec i riferimenti sono NOMI, non chiavi
          outputVariable: proposta

        - id: conferma
          type: Task
          name: Conferma del referente
          performer: HumanOnly                 # compito in lista di lavoro, sulla corsia del ruolo
          roleName: Referente agenda
          form:
            - { key: proposta, label: Proposta dell'assistente, type: textarea, context: true }
            - { key: confermato, label: Estremi confermati, type: bool }

        - id: registra
          type: Task
          name: Registra in calendario
          performer: HumanOnly
          roleName: Referente agenda

        - id: fine
          type: End
          name: Presa in carico conclusa

      gateways:
        - id: esito
          type: Exclusive
          name: Estremi confermati

      flows:
        - { from: start, to: estrai }
        - { from: estrai, to: conferma }
        - { from: conferma, to: esito }
        - { from: esito, to: registra, label: confermati, condition: { var: confermato, op: eq, value: true } }
        - { from: esito, to: estrai, label: da rifare }    # il ramo senza condizione: obbligatorio, uno solo
        - { from: registra, to: fine }
```

**Le regole che la skill applica al posto tuo** — e che spiegano perché a volte si ferma:

- **nessuna creazione senza un sì sul piano**: `--yes` è la forma scritta dell'approvazione appena
  data, non una scorciatoia. Senza terminale interattivo la CLI esce con codice `6` e la skill
  chiede, non aggiunge il flag;
- **se un nome esiste già il piano si ferma** (`BP060`): non esiste aggiornamento in place. La skill
  riporta le tre strade — rinominare, cambiare tag, rimuovere l'entità — senza sceglierne una;
- **i segreti si citano per nome** (`Blueprints:Secrets:<TAG>:<nome>`) e si impostano con
  `secrets set` nel **tuo** terminale: il valore non passa mai per la conversazione;
- **un profilo di knowledge per agente**: il topic è il deposito dei file, il profilo è ciò che li
  indicizza e si collega all'agente. Un agente su un topic pieno di file ma senza profilo non vede
  niente;
- **il modello si dichiara**: senza `model:` l'agente nasce sul default (`BP015` avvisa), un nome
  fuori catalogo ferma il piano (`BP065`);
- **in produzione solo i tenant a cui appartieni**: l'API li ricava dalla tua utenza, come per
  l'interfaccia, e rifiuta gli altri anche con il GUID scritto a mano

**Cosa non fa.** Non modifica un singolo agente o processo già esistente (per quello si va dalla
UI); non crea l'ingresso *push* della posta (`ingress.kind: logicapp`, che vuole una Logic App e
un'autorizzazione umana); non eredita fra blueprint (`extends`). Tutto il resto — connessioni,
server MCP via MCP Builder, orchestratori, agent task schedulati — lo crea davvero.

Riferimenti che viaggiano con la skill: le regole del grafo BPM, la traccia dell'intervista, i tre
livelli della knowledge, la scelta del modello, il ciclo per una fonte HTTP via MCP Builder (con
Microsoft 365 come caso guidato), il riferimento del manifest e dei comandi, lo schema JSON e due
esempi commentati. Manuale passo passo: [`plugins/blueprints/docs/manuale.md`](../plugins/blueprints/docs/manuale.md).

### `xrcopilotlab-blueprint-test` — collaudare un blueprint applicato

Porta un blueprint applicato da «esiste sul tenant» a «sappiamo come risponde, e sappiamo di chi è
ogni difetto», e da lì a «il cliente sa cosa provare e cosa aspettarsi». Cinque mosse: **scrivere
le domande, eseguirle, giudicare, segnalare, scrivere le domande di prova per il cliente**. La
guida allo scenario è della skill che segue.

La divisione del lavoro è netta, ed è ciò che rende il collaudo ripetibile:

| Chi | Fa | Non fa |
|---|---|---|
| **La CLI** (`xrcopilotlab-bp test`) | esegue i casi, raccoglie **tutte** le evidenze (risposte, passi della pipeline, file di knowledge consultati, skill selezionate, eventi e compiti dell'istanza), verifica le attese meccaniche, propone un sospetto per fallimento | non giudica se una risposta è *buona* |
| **La skill** | scrive domande e risposte attese, giudica le risposte in prosa, conferma o smentisce il sospetto leggendo il codice, scrive segnalazioni e guide | non chiama l'API direttamente, non apre issue senza un sì |
| **Tu** | decidi su quale tenant si esegue, approvi le segnalazioni | — |

**Come si chiede.** Frasi che la attivano, con quello che succede dopo:

| Cosa scrivi | Cosa fa la skill |
|---|---|
| «Collauda il blueprint STUDIOPOLIS su staging» | Cerca `blueprints/tests/studiopolis-*.tests.yml`; se c'è la valida e **ti mostra le domande** prima di eseguire; se non c'è genera lo scheletro e le scrive leggendo il manifest |
| «Scrivi le domande di test per gli agenti di FINLOGIC» | `test init` dal manifest, poi compila i `TODO` — un caso positivo e uno negativo per agente, uno per orchestratore, uno per processo — partendo dal system message di ciascun agente |
| «Ecco le domande della demo, traducile in una suite» (con un file `demo-domande-*.md`) | Traduce campo per campo: la domanda **identica** in `message`, l'atteso in `expect.answer`, i numeri con tolleranza in `expect.numbers`, le «risposte sbagliate da riconoscere» in `expect.wrongAnswers` |
| «Esegui solo i casi dell'agente agenda» | `test run … --only agenda`: un valore combacia con la chiave, con un tag **o con il target** del caso |
| «Il benvenuto dell'orchestratore non compare, guarda tu» | Apre Chrome con l'estensione **Claude in Chrome** e guarda ciò che vede il cliente: la suite prova l'API, e lo strato che sta in mezzo — chat, form di avvio, coda dei compiti — sa rompersi da solo lasciandola verde. Guarda e non cambia niente |
| «Cosa è andato male, e di chi è?» | Legge il report, dà un verdetto **pass / parziale / fail** per ogni caso, fa il triage per componente e scrive `giudizio.md` |
| «Apri le issue» (**dopo** aver visto le bozze) | Le apre in `xrcopilotlab-webapp-dotnet` con la label del componente, una per difetto confermato, e riporta i numeri nel giudizio |
| «Prepara le domande di prova per il cliente» · «Scrivi la guida del processo per il cliente» | Scrive `demo-domande-<scenario>.md` e `guida-<scenario>.md` nella cartella del cliente dell'assessment, e pubblica la guida anche come pagina web |
| «Come si collauda un blueprint?» · la skill chiesta senza altro | Orientamento: a cosa serve, cosa serve, quali suite esistono, quali blueprint hanno un run. Poi la domanda: quale blueprint, su quale ambiente |

**I tre comandi** della CLI dietro la skill:

```bash
xrcopilotlab-bp test init     blueprints/<nome>.yml                       # scheletro della suite dal manifest, offline
xrcopilotlab-bp test validate blueprints/tests/<nome>.tests.yml           # verifica contro il manifest, offline
xrcopilotlab-bp test run      blueprints/tests/<nome>.tests.yml --env staging --company <guid> [--only k1,tag,entità]
```

| Comando | Rete | Exit |
|---|---|---|
| `test init` | no | `0` — non sovrascrive una suite esistente senza `--overwrite` |
| `test validate` | no | `0` valida · `2` rilievi `BT0xx` (entità inesistente, `TODO` non scritto, attese incompatibili…) |
| `test run` | sì | `0` tutti passati · `7` almeno un caso non passato · `2` suite non valida · `3` nessun run del tag sul tenant |

Il `7` **non è un errore della CLI**: è l'esito del collaudo.

**Che aspetto ha una suite.** Un file `blueprints/tests/<nome>.tests.yml` accanto al manifest. Tre
casi presi dall'esempio che viaggia con la skill (`references/esempio-suite-agenda.tests.yml`): un
agente che deve estrarre, uno che **non** deve fare una cosa, e un processo seguito fino al primo
compito umano.

```yaml
blueprint: studiopolis-agenda
tag: STUDIOPOLIS                       # da qui il run e le entità: gli id che il blueprint ha creato
version: 7
defaults:
  language: it
  timeoutSeconds: 180
  userId: collaudo@hevolus.it          # per conto di chi si parla: senza, i processi con ruoli di avvio escono 403

cases:
  - key: agenda-avviso-completo
    kind: agent
    target: agenda                     # chiave dell'agente nel manifest
    message: |
      TRIBUNALE ORDINARIO DI BARI — Sezione Seconda Civile
      R.G. n. 4127/2025 — Rossi Mario c/ Alfa S.r.l.
      Udienza fissata per il 14 ottobre 2026 alle ore 9:30, aula 3, Giudice dott.ssa Bianchi.
    expect:
      answer: >                        # in prosa: la CLI NON la verifica, la giudica la skill
        Sei voci, tutte valorizzate; nessun termine proposto.
      contains: ["14 ottobre 2026", "9:30", "4127/2025", "Bianchi"]
      notContains: ["termine per", "scadenza"]
      wrongAnswers:                    # risposte sbagliate già viste: se compaiono, fail con la diagnosi
        - pattern: "(?i)(ho|è stat[oa]) (registrat|creat|inserit)"
          means: L'agente di estrazione ha scritto in calendario, ma la registrazione è del referente.
          suspect: Manifest
      maxSeconds: 60
    tags: [agent, agenda]

  - key: agenda-non-calcola-termini
    kind: agent
    target: agenda
    message: |
      Udienza il 14 ottobre 2026, R.G. 4127/2025. Entro quando va depositata la memoria ex art. 183 c.p.c.?
    expect:
      answer: Riporta gli estremi e dichiara che non calcola termini processuali.
      notContains: ["giorni prima", "entro il"]
    tags: [agent, agenda, negative]

  - key: presa-in-carico-udienza-avvio
    kind: process
    target: presa-in-carico-udienza
    timeoutSeconds: 300
    caseData:                          # i campi del modulo di avvio, con i tipi YAML 1.2
      testoAvviso: "TRIBUNALE DI BARI — R.G. 4127/2025 — udienza 14 ottobre 2026 ore 9:30"
      materia: Civile
    expect:
      process:
        events: [InstanceStarted, ActivityCompleted, WorkItemCreated]   # sottosequenza ordinata
        completed: [estrai]            # il passo automatico è passato
        waitingAt: verifica            # c'è un compito aperto sul passo umano
        status: Running
        caseData: { proposta: "14 ottobre 2026" }
    tags: [process]
```

Per una domanda **numerica** — «quante righe hanno *Chiusura conti* nelle osservazioni» — l'atteso
si scrive per valore, non per stringa, così non dipende dalla formattazione:

```yaml
    expect:
      numbers:
        - { label: righe, value: 5995 }                           # legge 5.995, 5995, 5,995
        - { label: saldo, text: "−495.233,91", tolerance: 0.5 }   # il segno conta
      wrongAnswers:
        - { number: 5, means: "campione del recupero, non la popolazione", suspect: KnowledgeGraph }
```

**Cosa fa un caso, per tipo.** Un caso `agent` è una chat sincrona con i log accesi: un turno per
messaggio, conversazione nuova per ogni caso. Un caso `orchestrator` lancia l'esecuzione e interroga
lo stato fino a `completed`, `failed` o al timeout; se si ferma in attesa di un umano (`paused`)
esce in errore, e non è un fallimento dell'orchestratore. Un caso `process` **avvia un'istanza vera**
con i dati del modulo e la segue fino al compito umano atteso: l'istanza resta lì, chi ha il ruolo
la vedrà fra i suoi compiti — la skill lo dice prima di lanciare. La CLI **non completa mai un
compito umano**: sarebbe firmare un modulo al posto di una persona.

**Se la fonte esterna non è pronta** (una casella di posta che nessuno controlla), la logica
dell'agente si collauda con le **letture simulate**: il contenuto che restituirebbe lo strumento va
nel messaggio, nella forma vera (il corpo di una PEC, il JSON di `calendarView`), sotto il tag
`simulata`. I casi sulla fonte vera vanno in una suite a parte; quelli che **scrivono** fuori dal
tenant in una terza, lanciata solo con un sì esplicito.

**Il report** finisce in `blueprints/tests/reports/<tag>/<data>/` — `report.md` per leggere,
`report.json` per tutto il resto. La cartella è ignorata da git: contiene risposte e id del tenant.
Sopra al report la skill scrive **`giudizio.md`**: una tabella caso · esito CLI · verdetto · perché,
i casi da rivedere con atteso, risposta e diagnosi, e le attese da correggere nella suite. Un caso
può essere `Passed` per la CLI e **fail** per la skill (i numeri ci sono, ma ha attribuito un conto
«dove gli sembrava giusto»), o `Failed` per la CLI e **pass** (un `contains` che il modello ha
riformulato legittimamente — e allora si corregge l'attesa). I quattro criteri, in ordine:
esattezza dei numeri entro tolleranza e con il segno, nessuna invenzione, completezza, forma.

**Il triage: di chi è ogni fallimento.** Per ogni caso non passato il report porta un **sospetto**
— componente, fiducia (`High` per un errore che lo nomina, `Medium` per un comportamento letto nel
log, `Low` per un'inferenza da un'assenza), ragione — e la skill lo conferma o lo smentisce
**leggendo il codice** nei cloni fratelli prima di segnalare. La regola di fondo:

> Un fallimento si attribuisce a un componente solo quando c'è un'evidenza **di quel componente**.
> L'assenza di una cosa (nessun chunk, nessuna skill) è un indizio, non una prova.

| Componente | Dove si segnala | Dove guardare |
|---|---|---|
| `Manifest` — prompt, partizione della knowledge, attesa scritta male | nessuna issue: si corregge il file e si rilancia con `--only` | il manifest o la suite |
| `KnowledgeGraph` | issue in `xrcopilotlab-webapp-dotnet`, label `kgraph` | `xrcopilotlab-knowledge-graph` |
| `Skills` | issue in `xrcopilotlab-webapp-dotnet`, label `skills` | `xrcopilotlab-agent-framework` |
| `Orchestration`, `Process`, `WebApp` | issue in `xrcopilotlab-webapp-dotnet`, label `blueprints` | la webapp |
| `Environment` — rete, credenziali, tenant, lentezza | nessuna | — |
| non attribuibile | si dice così, con le ipotesi e cosa servirebbe per decidere | — |

Le issue si aprono **tutte nella webapp**, dove l'AI Team pianifica il lavoro: la label dice il
componente, il corpo cita la libreria come «dove guardare». Il titolo comincia con il componente
(«Knowledge graph: …», «BPM: …») e porta **anche l'inverso** — cosa dovrebbe succedere, scritto
come il caso della suite — così chi corregge ha già il test di regressione. Fallimenti diversi con
la stessa causa sono **una** segnalazione; un fallimento che si ripete su tutti i casi di un agente è
quasi sempre il manifest.

**Segnalare, solo dopo un sì.** Prima le **bozze**, in
`reports/<tag>/<data>/segnalazioni/<n>-<repo>-<slug>.md`, con ciò che serve a riprodurre senza il
tenant: domanda, risposta, passi del log che contano, file consultati, versioni delle librerie
(`KGraph.props`, `AgentFramework.props`), ambiente, id della conversazione o dell'istanza. Poi la
skill le mostra — titolo, repository, una riga ciascuna — e chiede **quali** aprire. Un sì vale per
le bozze mostrate, non per quelle che scriverà dopo.

**Le guide per il cliente.** Al termine di un collaudo — e sempre a quello finale — la skill
traduce suite e giudizio in due documenti che il cliente può leggere, nella cartella del cliente del
repository dell'assessment:

- **le domande di prova** (`demo-domande-<scenario>.md`): la tabella di stato in testa
  (✅ pronta · 🟡 da correggere · ⛔ da non mostrare come funzionante · ⏳ attende una fonte), le
  domande della suite **identiche** in blocchi di codice, l'atteso e le risposte sbagliate nella
  lingua del cliente («ha inventato un orario», non «suspect: KnowledgeGraph»), una scheda di
  valutazione, e una sezione interna per chi conduce con i difetti aperti;
- **la guida allo scenario** (`guida-<scenario>.md`), se c'è un processo o un'orchestrazione: i
  concetti, il diagramma dal grafo, i passi, le criticità del cliente → i meccanismi, gli agenti e
  cosa non fanno, collaudato e mancante — **e la sua pagina web**, che è ciò che si proietta e si
  condivide, aperta nel browser appena pubblicata.

Nelle guide non entrano id di istanze, run, webhook o chiavi, né il triage per componente: al
cliente si dice cosa non funziona e quando sarà corretto, non dove nel codice. E «collaudato» si
scrive solo per ciò che è stato provato davvero, non per una simulazione.

**Cosa non fa.** Non scrive né applica un manifest (quello è `xrcopilotlab-blueprint`); non fa test
unitari del codice; non chiama l'API a mano (`curl`, `.Client`) — se manca un'evidenza si estende la
CLI, non si aggira; non esegue su un ambiente o un tenant che non hai indicato, e mai `--env prod`
su un tenant che non sia quello di Hevolus; non apre issue senza il sì sulle bozze; non attribuisce
un fallimento a una libreria per esclusione; non corregge manifest e libreria nello stesso giro —
prima si sistema ciò che è del manifest e si rilancia, ciò che resta è ciò che si segnala.

Riferimenti che viaggiano con la skill: che cosa chiedere a un agente con knowledge, con skill, a un
orchestratore, a un processo (`domande.md`); i quattro criteri del verdetto (`giudizio.md`); la
tabella evidenza → componente → verifica (`triage.md`); il modello di segnalazione
(`segnalazione.md`); il modello di esecuzione del motore BPM e le otto domande da farsi su ogni
processo (`bpm.md`); le guide per il cliente (`guida-cliente.md`); il formato completo di suite e
report con i codici `BT0xx` (`testing.md`); una suite reale (`esempio-suite-agenda.tests.yml`).

### `xrcopilotlab-blueprint-guide` — la guida per il cliente

Porta un blueprint da «funziona, e sappiamo come» a «il cliente capisce che cosa ha, perché gli
conviene, e che cosa aspettarsi». Il lettore è chi usa il servizio e chi lo compra, quasi mai un
tecnico: niente orchestratori, topic o server MCP — «la catena di assistenti», «l'archivio dei
documenti», «un collegamento a un servizio esterno».

La guida racconta cinque cose: che cosa fa per il cliente, in una frase; **il flusso come una
storia**, con un disegno di pochi riquadri; **dove lavora l'AI e dove decidono le persone** (e che
cosa l'AI non fa); **come è stato collaudato**, con l'esito vero dell'ultimo giudizio; **perché un
ambiente descritto in un manifest conviene** — si vede prima di farlo, si ripete, si aggiorna senza
rifarlo, ha una storia di versioni. I disegni sono Mermaid, con quattro colori fissi (persone, AI,
archivi, regole fisse); la guida si pubblica anche come **pagina web** da proiettare, con una copia
HTML che si apre senza account.

**Non esegue test e non tocca il tenant**: legge il manifest, il giudizio e la suite che escono dalla
skill di collaudo, e il dossier dell'assessment per le criticità dette dal cliente. Se il collaudo è
vecchio, lo dice e propone di rifarlo.

| Cosa scrivi | Cosa fa la skill |
|---|---|
| «Scrivi la guida per il cliente di COMO» | Legge manifest, ultimo giudizio e dossier, scrive `guida-<scenario>.md` nella cartella del cliente e **te la mostra** |
| «Pubblicala» | Carica `artifact-design`, verifica l'organizzazione, pubblica la pagina e la apre nel browser, con la copia HTML locale |
| «Aggiorna la guida dopo il collaudo di oggi» | Rifà l'esito, i limiti e le versioni; la storia resta finché il flusso non cambia |

### `xrcopilotlab-assessment` — dalla proposta al dossier

Gira su **Claude Desktop**. Traduce una proposta di progetto — tipicamente un'offerta Hevolus — in
una **soluzione concreta di agenti orchestrati su XRCopilotLab** e ne valuta la fattibilità
tecnica. L'output è un **dossier tecnico** che un ingegnere porta all'incontro con il cliente, passa
a chi prepara la quotazione, e consegna a chi scriverà il blueprint.

**Come si chiede.** Si carica la proposta (PDF o Word) in una chat di Claude Desktop e si chiede di
valutarla. La skill si attiva da sola, anche senza nominare XRCopilotLab:

| Cosa scrivi | Cosa fa la skill |
|---|---|
| «Ecco la proposta per Studio Polis, fai l'assessment» | Le cinque fasi in ordine, poi salva il dossier `.md` e lo converte in `.docx` sul template Office |
| «Come lo implementiamo su XRCopilotLab?» · «Traducila in architettura» | Idem: estrae scenari e obiettivi, progetta agenti e processi, verifica le fonti |
| «Quanto è fattibile la parte sul Registro Imprese?» | Discovery di fattibilità sulla fonte: vie di accesso già verificate per le fonti italiane ricorrenti, esito 🟢 GO · 🟡 CONDIZIONALE · 🔴 NO-GO con il fallback |
| «Il cliente ha un suo template Word» | Passa il template del cliente al generatore al posto di quello bundlato |

**Le cinque fasi:**

1. **Scenari e obiettivi** — cosa il cliente vuole ottenere, non come è scritto: una tabella
   `Obiettivo | Descrizione (dal testo) | Note` per scenario.
2. **Orchestrazione di agenti** — la scelta che costa di più se sbagliata: se il cliente descrive
   «una domanda e una risposta» è **chat + agenti orchestrati**; se descrive «chi fa cosa e in che
   ordine» è un **processo BPM**, con attività, modalità di ogni passo (umano / AI-assistito /
   automatico), corsie su ruoli aziendali, moduli e gateway. Ogni agente ha una bozza di system
   prompt e, per convenzione nostra, al più un MCP; l'orchestratore coordina e **non ha** un prompt.
   Un assistente su documenti è un agente sul knowledge graph nativo, **senza** MCP.
3. **Discovery di fattibilità** — per ogni fonte dati: domande al cliente, verifiche tecniche
   (endpoint, autenticazione, permessi), un test eseguibile, e l'esito GO / CONDIZIONALE / NO-GO.
   Il discrimine principale: autenticazione machine-to-machine o interattiva (SPID, login umano).
   **3-bis** — i **punti in sospeso**: ciò che la proposta non chiarisce si raccoglie come domande
   aperte, non si risolve inventando.
4. **Il dossier** — Markdown e Word, prosa prima delle tabelle, bozze di prompt in blocchi di codice,
   diagrammi a mappa mentale (problema → agenti → fonte).
5. **La consegna al provisioning** — il capitolo **«Elementi per il provisioning»**: tag suggerito,
   topic con i documenti, ruoli con i membri, agenti con system message e skill, agent task,
   processo con attività, corsie, moduli e gateway, segreti **citati per nome e mai per valore**, e
   i passi manuali residui. È il capitolo da cui `xrcopilotlab-blueprint` parte senza tornare a
   chiedere.

**Cosa non scrive.** Niente tecnologie interne né framework sotto il cofano — per il cliente
esistono agenti XRCopilotLab e, dove serve, server MCP verso le sue fonti. Niente pricing, niente
«a pagamento» o «incluso»: ciò che esula dal perimetro base si marca come **opzionale** con l'effort
tecnico, e la valutazione economica resta a chi cura l'offerta. E niente promesse su ciò che il BPM
**non fa** — timer e scadenze che avanzano da sole, join dopo un fork parallelo, allegati letti dagli
agenti, avvio schedulato: ognuna va scritta come componente da costruire, con la sua stima.

**Cosa non fa.** Non redige la proposta commerciale né l'offerta economica: produce la valutazione
tecnica. Non scrive il manifest: quello è il lavoro della skill successiva, su Claude Code.

Riferimenti che viaggiano con la skill: i vincoli e la filosofia della piattaforma
(`xrcopilotlab-platform.md`, con la sezione «BPM — cosa NON fa»), la struttura del dossier
(`dossier-structure.md`), le vie di accesso verificate alle fonti italiane (`data-sources-italy.md`),
il generatore Word e il template Office. Manuale: [`plugins/assessment/docs/manuale.md`](../plugins/assessment/docs/manuale.md).

