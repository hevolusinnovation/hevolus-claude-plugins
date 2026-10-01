# Manifest di un blueprint — riferimento

Formato **v1**. Schema JSON:
[`blueprint.v1.schema.json`](blueprint.v1.schema.json).
Esempio completo: [`esempio-minimo.yml`](esempio-minimo.yml).

Due regole valgono ovunque nel file:

- **I nomi si scrivono senza prefisso.** Il planner antepone `BP-<TAG>-`. Scriverlo a mano è un
  errore segnalato (`BP014`), perché produrrebbe `BP-TEST-BP-TEST-…`.
- **I segreti si citano, non si scrivono.** Ogni campo che conterrebbe una credenziale porta il
  **nome di una chiave** di App Configuration (`Blueprints:Secrets:<TAG>:<nome>`), creata con
  `xrcopilotlab-bp secrets set`. `<TAG>` è il tag del manifest: un valore in chiaro, o la chiave di
  un altro tag, è un errore (`BP047`) — chi applica leggerebbe la credenziale di un altro blueprint.

## Intestazione

```yaml
blueprint: test-agenda      # slug minuscolo, stabile fra le versioni
version: 1                  # progressiva; una versione pubblicata è immutabile
tag: TEST                   # ^[A-Z0-9]{2,20}$ — entra nel prefisso di ogni entità
description: ...
extends: null               # riservato: accettato ma non ancora applicato

tenant:
  companyId: 1111...        # GUID del tenant
  topic: Agenda di Studio   # crea un topic nuovo: diventa BP-TEST-Agenda di Studio
```

### Dove finiscono gli agenti: tre modi, uno per volta

| Campo | Cosa fa |
|---|---|
| `topic: <nome>` | **Crea** un topic nuovo, prefissato `BP-<TAG>-` |
| `existingTopic: <nome>` | **Riusa** un topic già presente, scritto come compare nella UI, senza prefisso |
| `topicId: <guid>` | **Riusa** un topic per id, quando il nome è ambiguo |

Indicarne due insieme è un errore (`BP007`): lascerebbe indovinare quale vince.

Riusare un topic non lo modifica e non lo mette in inventario, quindi **il rollback non lo rimuove**:
un blueprint annullato non porta via con sé il lavoro di qualcun altro. Il preflight verifica però
che quel topic esista davvero (`BP064`), perché un nome cambiato o un id sbagliato produrrebbe
agenti in un posto che non c'è.

```yaml
# Aggiungere un agente a un topic già in uso
tenant:
  companyId: 1111...
  existingTopic: Marketing
```

I nomi degli agenti vengono comunque confrontati con quelli **già presenti in quel topic**: se uno
coincide, il piano si ferma.

## `businessRoles`

Ruoli aziendali: sono le lane dei processi BPM, non i ruoli RBAC della piattaforma.

```yaml
businessRoles:
  - key: referente                 # chiave simbolica, citata da processes[].starterRoles
    name: Referente agenda
    description: ...
    members: [utente@studio.it]    # gli utenti devono già esistere: il blueprint li aggiunge, non li crea
```

## `knowledge`

I profili: il **RAG**. I tre livelli non sono intercambiabili, e confonderli produce un ambiente che
non fallisce — risponde a vuoto.

```
TOPIC      il repository dei file. Un file caricato qui non è interrogabile da nessuno.
  └─ PROFILO   ne seleziona un sottoinsieme e lo indicizza. Si attiva, consuma licenza,
     │         e si collega agli agenti.
     └─ AGENTE  non vede il topic: vede i profili che gli sono stati collegati.
```

```yaml
knowledge:
  - key: contabilita
    name: Contabilita di gruppo     # senza prefisso: lo aggiunge il planner
    description: ...
    language: it
    # knowledgeGraph: true          # È IL DEFAULT: si scrive solo per metterlo a false
    files:
      - path: data/mapping.xlsx     # relativo alla cartella del manifest
        fileType: reference         # DA OMETTERE salvo richiesta esplicita (= original)
      - path: data/giornale.xlsx
```

**Il profilo è knowledge graph salvo richiesta contraria.** `knowledgeGraph: false` chiede l'indice
di ricerca classico, e si scrive solo se qualcuno lo ha chiesto: il grafo è ciò che regge le domande
che attraversano più documenti, cioè quelle per cui si costruisce un agente invece di una ricerca.

**Il tipo del file non si dichiara.** Un file caricato senza dire altro è `original`, ed è la forma
giusta quasi sempre. `reference`, `target` e `template` si scrivono solo quando l'utente li chiede o
quando un dossier distingue di proposito i ruoli. Lo *scope* non è dichiarabile ed è sempre `None`:
indica la provenienza del file, non il suo ruolo, e l'API rifiuta con 400 un file di profilo che ne
porti un altro.

**I file viaggiano con la versione.** Il `push` li archivia accanto al manifest, in
`blueprints/<company>/<bp>/v<N>/files/`, e l'`apply` legge da lì: è ciò che permette a un collega di
applicare la stessa versione dalla sua macchina senza avere la cartella dei dati.

Tre cose da sapere prima di scrivere questa sezione:

| | |
|---|---|
| **L'attivazione consuma licenza** | Serve un prodotto di scope `XRCopilotLab.Profile`. Senza, l'API risponde **403** e il run si ferma lasciando profilo e file sul tenant: si attiva dall'interfaccia quando la licenza c'è. |
| **L'indicizzazione prosegue dopo l'apply** | `activateIndex` torna appena il lavoro è in coda. Finché non è completa l'agente risponde su una knowledge parziale — sintomo identico a quello di un prompt sbagliato. |
| **`.xls` non viene ingerito** | Passa il caricamento e poi rompe: è il formato binario pre-2007, che nessun lettore OpenXML apre. Il validatore lo rifiuta con `BP027`: va convertito in `.xlsx` prima. Un **`.xlsm` invece va bene così com'è** — è un pacchetto OpenXML con dentro un `vbaProject.bin` che il lettore ignora, e la pipeline canonica lo ingerisce come un `.xlsx`. |

Il **rollback** toglie il profilo e **lascia i documenti** nel topic, dichiarandoli: disfa
configurazione, non cancella i file di un cliente.

### Come si dividono i file fra i profili

Non è una questione di ordine: il modo in cui i file sono ripartiti decide che cosa l'agente
riesce a recuperare. Tre meccanismi, tutti a query time.

**1. Un profilo è una partizione interrogata da sola.** Due profili su un agente sono due query in
parallelo le cui risposte vengono concatenate. Fra profili **non esiste join**: una domanda che deve
incrociare due famiglie di documenti le incrocia nel prompt, non nel grafo.

**2. Dentro un profilo i file si selezionano per nome.** Si tengono le sole sorgenti il cui nome
contiene una parola della domanda (almeno quattro caratteri), e se qualcuna corrisponde **le altre
sono escluse**. È una regola di correttezza — il giornale di una società non deve rispondere per
un'altra — e ha due conseguenze da tenere a mente:

- il nome del file è la chiave di selezione, quindi ci va dentro ciò che lo distingue: società,
  periodo. `giornale.xlsx` non è nominabile, `socialware-giornale-2025.xlsx` sì;
- un **riferimento comune** che nessuna domanda nomina (uno schema, una tabella di corrispondenza)
  viene escluso appena un file specifico corrisponde. Va in un profilo suo.

**3. In una catena orchestrata quella selezione si spegne.** Il messaggio di un passo a valle
contiene l'output del precedente: centinaia di parole, quindi quasi ogni nome file corrisponde e i
dataset si caricano interi. Per quegli agenti il profilo deve contenere **solo** ciò che devono
leggere — quello che arriva dal passo precedente è già nel messaggio.

La forma che ne risulta, e che conviene come punto di partenza, è **un profilo per agente**. Il
comando `xrcopilotlab-bp suggest` la propone e segnala i tre casi qui sopra; il validatore li
segnala con `BP028` — sempre come avvisi, perché la decisione richiede di sapere che cosa fa ciascun
agente, e quello il manifest non lo dice.

## `agents`

```yaml
agents:
  - key: agenda
    name: Agenda
    description: ...
    systemMessage: |
      ...
    model: gpt-5.4-mini   # nome a catalogo. Senza, nasce su gpt-5.4 (BP015 lo avvisa)
    temperature: 0.2
    maxTokens: 4000
    language: it          # lingua dell'endpoint di default
    # endpoint: Anthropic Studio Polis   # solo se la company ha un endpoint AI proprio
    skills: []            # SkillId già a catalogo, es. legal-research
    mcp: []               # chiavi di mcpServers, anche quelli kind: existing
    knowledge: []         # chiavi di knowledge[]: i profili che l'agente interroga
    files: []             # file collegati all'agente, per le skill che li leggono (vedi sotto)
```

Un agente **senza `knowledge`** non ha accesso ai documenti, per quanti file ci siano nel topic:
vede i profili, non il repository.

### `files`: un foglio per una skill

```yaml
agents:
  - key: elenco
    name: AgenteElenco
    skills: [spreadsheet]
    files:
      - path: ../dati/associati.xlsx
        name: associati-tabella.xlsx   # nome nel topic; assente = nome del file
        # fileType: reference          # ASSENTE = reference: è il tipo che spreadsheet legge
```

Alcune skill lavorano sui file **dell'agente**, non su un profilo: `spreadsheet` carica in DuckDB i
fogli di tipo `reference` collegati all'agente e ci fa filtri, conteggi e aggregazioni con numeri
verificati. È la strada per le domande che attraversano tutte le righe — «tutte le aziende della
filiera tessile» — dove un profilo, che cerca, può perderne una parte.

L'apply carica il file nel topic con il suo tipo e lo collega all'agente (`AgentsFiles`), dopo che
l'agente esiste: vale quindi anche su un agente che un aggiornamento sul posto non ricrea. Il `push`
archivia il file con la versione, come quelli dei profili.

**Un nome di file nel topic ha un tipo solo.** Se lo stesso foglio serve a un profilo (`original`) e
a una skill (`reference`), va dichiarato due volte con due `name` diversi: con lo stesso nome il
validatore si ferma con `BP017`, perché il secondo caricamento cambierebbe il tipo del primo.

Il rollback toglie il collegamento insieme all'agente; il file resta nel topic, come quelli dei
profili. Un aggiornamento sul posto collega i file nuovi e **non ricarica** quelli già collegati: per
cambiare il contenuto di un foglio si cambia il suo `name`.

**Il modello va dichiarato.** Vive sull'endpoint di default dell'agente e il nome deve essere a
catalogo: il preflight lo verifica e rifiuta con `BP065` un nome che non c'è, elencando i
disponibili. Omettere il campo è lecito — l'agente nasce su `gpt-5.4` — ma produce un `BP015`,
perché rileggendo il manifest non si distingue una scelta consapevole da una dimenticanza.

La fascia giusta dipende dal lavoro, non dal prestigio: un passo che classifica un intento o
instrada sta bene su un `-nano` e costa una frazione; un passo che deve ricucire contenuto
recuperato da documenti no, e lì risparmiare significa sbagliare i numeri. `xrcopilotlab-bp suggest`
propone una fascia per agente **con i segnali su cui si basa**, da confermare. I nomi che non
dichiarano la fascia — un `codex`, un `fast-non-reasoning`, le famiglie non GPT — non vengono mai
proposti per esclusione: per quelli il compromesso lo dice la descrizione a catalogo.

Ogni agente riceve un **endpoint di default** come quando lo si crea dall'interfaccia: senza, un
agente esiste ma non è interrogabile.

**`endpoint` serve solo quando la company ne ha uno suo.** Gli endpoint condivisi della piattaforma
valgono per tutti e non si citano; un endpoint della company — tipicamente il suo account Anthropic,
perché il consumo sia fatturato a lei — è sempre un non-default, e la piattaforma lo usa **solo se
esiste un collegamento esplicito** con l'agente. Senza quel collegamento l'agente parla con
l'endpoint condiviso qualunque modello dichiari, e la differenza non si vede da nessuna parte se non
in fattura.

Si scrive il nome come compare nella configurazione del tenant, **senza prefisso**: l'endpoint non è
del blueprint, che lo collega e basta. Il preflight rifiuta con `BP066` un nome che la company non
ha, elencando quelli che ha; il rollback scollega l'agente e lascia l'endpoint dov'è.

### Tipo, comportamento della risposta e endpoint di chat

```yaml
agents:
  - key: agenda
    name: Agenda
    type: base                     # base | smart (Q&A). Assente = smart
    verbosityLevel: concise        # veryConcise | concise | verbose | noLimit. Assente = concise
    minRankingScore: 1.2           # solo smart
    minWordsValidation: 0          # solo smart
    searchTopK: 5                  # solo smart — chunk RAG per profilo. Assente = default (3)
    reasoningEffort: medium        # minimal | low | medium | high — solo sui modelli che lo supportano
    disableHistory: false
    enableGroundednessDetection: false
    enablePermanentMemory: false
    chatEndpoints:                 # uno o più endpoint di chat, sempre creati inattivi
      - model: gpt-5.4-mini
        language: it
        welcomeMessage: Come posso aiutarti?
        enableSuggestions: true
        suggestionMode: manual     # automatic | manual | manualAutomatic
        manualSuggestions: [Quali eventi oggi?]
```

`chatEndpoints` assente o vuoto significa **un** endpoint implicito, costruito da `model` e
`language` di primo livello — il comportamento storico. Con uno o più elementi se ne crea uno per
ciascuno: un agente importato con due endpoint nel tenant sorgente ne ha due anche in destinazione.
Sempre inattivi: l'attivazione, come quella dell'agente, resta una scelta di chi importa.

## `agentTasks`

Sono i «performer» delle attività di processo non umane.

```yaml
agentTasks:
  - key: estrai-udienza
    name: Estrazione udienza
    description: ...
    agent: agenda         # chiave di un agente — in alternativa: orchestrator
    prompt: |
      ...{{variabile}}...
```

`agent` e `orchestrator` sono alternativi: indicarne due, o nessuno, è un errore (`BP021`).

### Quando parte, e dove va a finire l'esito

```yaml
agentTasks:
  - key: sorveglia-posta
    name: Sorveglianza protocollo
    agent: lettore-posta
    prompt: Elenca i messaggi non letti arrivati da ieri.
    trigger: scheduled              # manual (default) | scheduled | webhook
    schedule:
      cron: "*/5 * * * *"           # cinque campi
      timeZone: Europe/Rome         # fuso IANA, default UTC
    outputActions:
      - type: webhook
        url: processes.presa-in-carico.webhook
      - type: email
        recipients: [protocollo@studio.it]
        subject: "{{taskName}} — {{date}}"
```

La casella in-app riceve **sempre** l'esito e non va dichiarata: in `outputActions` si elencano le
destinazioni aggiuntive.

### Quanto può girare: `executionPolicy`

```yaml
agentTasks:
  - key: sorveglia-posta
    trigger: scheduled
    schedule: { cron: "* * * * *", timeZone: Europe/Rome }
    executionPolicy:
      maxDailyExecutions: 2000     # default della piattaforma: 100
      timeoutSeconds: 300          # default: 300
      maxRetries: 0                # default: 0
```

La piattaforma conta le esecuzioni di ogni agent task **per giorno UTC** e, raggiunta la quota,
salta le successive: un avviso nel log del worker e nient'altro — niente errore sul task, niente
email. La quota di default è **100**, che per un task schedulato ogni minuto (1440 giri al giorno)
significa fermarsi poco prima delle due di notte e riprendere a mezzanotte. Il validatore stima i
giri al giorno dal cron (minuti × ore, per le forme che si sanno contare) e avvisa con **`BP029`**
quando superano la quota, dichiarata o di default. Ciò che non è dichiarato resta al default della
piattaforma. Dopo l'apply, `xrcopilotlab-bp schedule logs <chiave> --tag <TAG>` mostra la quota
del task com'è sul tenant e le ultime esecuzioni.

`url` accetta un indirizzo assoluto oppure la forma `processes.<chiave>.webhook`. La seconda è
quella che conta: il planner ci mette l'indirizzo e la chiave del webhook che **questo stesso
blueprint** sta creando, e la chiave — che si vede una volta sola e non è più recuperabile — non
deve passare da nessuna parte.

È così che un agent task schedulato diventa l'**ingresso** di un processo a partire da una fonte
esterna: l'agente legge la fonte attraverso il proprio server MCP, e a ogni giro consegna il
risultato al processo. Non serve nulla fuori dal tenant.

## `processes`

Un processo si descrive in due modi alternativi: `spec` dichiarativa oppure `bpmnFile`. Indicarli
entrambi, o nessuno, è un errore (`BP022`).

```yaml
processes:
  - key: presa-in-carico
    name: ...                  # se assente si usa spec.name
    spec: { ... }              # in alternativa: bpmnFile: ./presa-in-carico.bpmn
    publish: true
    owners: [utente@studio.it] # ricevono gli alert di superamento soglia
    starterRoles: [referente]  # chiavi di businessRoles abilitate ad avviare
    webhook:
      enabled: true
      allowedIps: []
```

Dopo la creazione la CLI **esporta il `.bpmn`** risultante accanto al manifest: è l'artefatto
standard con cui il processo si riapre nel designer o si porta su un altro tenant.

La chiave del webhook viene mostrata **una sola volta** al termine di `apply`.

### `spec` — il grafo BPMN 2.0

È esattamente la specifica accettata da `POST processes/{companyId}/generate`, la stessa che
produce il Process Buddy. Il backend ne calcola il layout e genera il diagramma: il processo che
ne esce è indistinguibile da uno disegnato a mano.

```yaml
spec:
  version: 1
  name: Presa in carico avviso di udienza
  description: ...
  categoryName: Risk, Compliance & Trust    # categoria del tenant: NON viene prefissata
  criticality: Medium                       # Low | Medium | High | Critical
  dataSensitivity: Confidential             # Public | Internal | Confidential | Regulated
  tags: { chiave: valore }

  activities:
    - id: start                # NCName: ^[A-Za-z_][A-Za-z0-9_-]*$
      type: Start              # Start | End | Task | CallActivity
      name: Avviso ricevuto
      form: [ ... ]

    - id: estrai
      type: Task
      name: Estrai gli estremi
      performer: Automated     # HumanOnly | AiAssisted | Automated
      agentTaskName: Estrazione udienza     # nome SENZA prefisso: lo qualifica il planner
      outputVariable: proposta
      expectedDurationMinutes: 2

    - id: conferma
      type: Task
      performer: HumanOnly
      roleName: Referente agenda            # nome SENZA prefisso
      maxLeadTimeMinutes: 1440              # oltre la soglia parte l'alert email agli owner
      form: [ ... ]

    - id: fine
      type: End

  gateways:
    - id: esito
      type: Exclusive          # Exclusive | Parallel
      name: Estremi confermati?

  flows:
    - from: conferma
      to: esito
    - from: esito
      to: registra
      condition: { var: confermato, op: eq, value: true }
      label: confermati
    - from: esito
      to: estrai
      label: da rifare         # ramo senza condizione = default
```

**L'id dei flussi è facoltativo**: se manca viene generato in modo deterministico da sorgente e
destinazione, così il file resta leggibile e due esecuzioni dello stesso manifest producono lo
stesso diagramma.

**Il tipo dei valori è preservato.** `value: true` è un booleano, `value: "true"` una stringa,
`value: 30` un numero. Il motore confronta per tipo, quindi la differenza conta: un booleano
scritto fra virgolette non farebbe mai scattare il ramo. Vale il core schema di YAML 1.2, quindi
`no`, `yes`, `on` e `off` restano stringhe.

**Vincoli del motore**, verificati dal validatore:

- esattamente uno `Start`, almeno un `End`, nessun nodo irraggiungibile;
- un gateway **esclusivo** ha almeno due rami uscenti ed **esattamente uno senza condizione**, il
  default;
- un gateway **parallelo** è solo fork: i rami non possono riconvergere, ognuno finisce su un `End`;
- `Automated` e `AiAssisted` richiedono `agentTaskName`; `HumanOnly` e `AiAssisted` richiedono
  `roleName` oppure `assignmentExpression`;
- un'attività `Automated` non genera work item, quindi non può avere un form;
- la variabile di una condizione deve essere la `key` di un campo form o un `outputVariable`, e
  se è un campo allegato l'unico operatore ammesso è `exists`;
- un campo allegato (`type: file`) sta su un'attività umana, mai sullo `Start`.

### `form` — i campi di un modulo

```yaml
form:
  - key: testoAvviso
    label: Testo dell'avviso
    type: textarea         # text | textarea | number | bool | date | select | user | file
    description: ...       # spiegazione sotto l'etichetta, non un segnaposto
    required: true
    readonly: false
    context: false         # sola lettura, alimentato da una variabile a monte
    options: [a, b]        # solo per select
    optionsTargetName: ... # solo per select, opzioni da una sorgente dati esterna
```

#### `type: file` — l'allegato

Un campo `file` raccoglie uno o più documenti: chi svolge l'attività li carica, e da quel momento
sono **variabili del processo** come gli altri dati, quindi gli step successivi li ritrovano fra i
dati a monte e li scaricano.

```yaml
- id: sopralluogo
  type: Task
  name: Sopralluogo
  performer: HumanOnly
  roleName: Tecnico
  form:
    - key: verbale
      label: Verbale firmato
      type: file
      required: true       # non si completa l'attività senza almeno un file
```

Due vincoli, e in entrambi i casi il validatore si ferma invece di lasciar nascere un campo che non
funziona:

- **solo su un'attività umana, mai sullo `Start`.** Un allegato appartiene all'istanza e
  all'attività in cui è stato caricato, e il form di avvio gira prima che l'istanza esista. Un
  documento da raccogliere all'avvio si chiede nella prima attività umana del processo.
- **una condizione può solo chiedere se c'è**, cioè `op: exists`. Il valore di un campo allegato è
  la lista dei file, non uno scalare: `eq` non darebbe errore, semplicemente non sarebbe mai vero e
  il ramo non scatterebbe mai.

Per leggere un allegato in uno step successivo lo si dichiara come qualunque altra variabile a
monte (`context: true`), e chi apre l'attività lo trova con nome, dimensione e download.

## `connections` e `mcpServers`

Una **connessione** è la portatrice delle credenziali verso un sistema di terze parti; un **server
MCP** dichiarativo è l'insieme di chiamate HTTP che un agente può fare su quella connessione. Il
blueprint crea entrambi, prova un tool e pubblica il server nel catalogo del tenant.

Le autenticazioni ammesse sono `None`, `Bearer`, `Basic`, `CustomHeaders` e
`OAuth2ClientCredentials`: coprono praticamente ogni API HTTP, Microsoft Graph compreso. Restano
fuori le due varianti PKCE, e non per dimenticanza — pretendono che una persona autorizzi
l'accesso dal browser, cosa che un blueprint applicato senza nessuno davanti non può fare.

```yaml
connections:
  - key: graph
    name: Graph
    provider: webhook
    baseUrl: https://graph.microsoft.com/v1.0
    auth:
      kind: OAuth2ClientCredentials       # None | Bearer | Basic | CustomHeaders | OAuth2ClientCredentials
      tokenUrl: https://login.microsoftonline.com/<tenant>/oauth2/v2.0/token
      clientId: Blueprints:Secrets:TEST:graph-client-id
      clientSecret: Blueprints:Secrets:TEST:graph-client-secret
      scope: https://graph.microsoft.com/.default

mcpServers:
  - key: calendario
    kind: builder                          # builder | external
    name: Calendario
    connection: graph
    systemPrompt: |                        # istruzioni d'uso, che viaggiano col server
      Chiama cerca_eventi prima di invia: senza la finestra non sai se lo slot è libero.
      Le date sono sempre ISO 8601 con la Z. Questo server non vede le mail, solo il calendario.
    promptMode: append                     # append (default) | replace | skip
    variables: { mailbox: test@hevolus.it }
    tools:
      - name: cerca_eventi
        method: GET
        path: /users/{{mailbox}}/calendarView
        # Il valore di un parametro è la sua DESCRIZIONE: è quella che il modello legge per
        # decidere come chiamare il tool. Per il controllo pieno si scrive l'oggetto.
        parameters:
          start: Inizio della finestra, ISO 8601
          end: { type: string, description: Fine della finestra, ISO 8601 }
        required: [start, end]
        query: { startDateTime: "{{start}}", endDateTime: "{{end}}" }
        # Il transform è il corpo di una funzione che riceve la risposta come `input` (non `data`):
        # gira nel sandbox QuickJS del builder, senza atob, fetch o librerie. Vale anche per
        # scomporre un allegato .eml in base64: vedi leggi_eml in blueprints/studiopolis-agenda.yml.
        transform: return input.value.map(e => ({ subject: e.subject }));
      - name: invia
        method: POST
        path: /users/{{mailbox}}/sendMail
        responseFormat: text      # json (default) | xml | text — Graph risponde 202 senza corpo: non è un JSON
        body: '{"message":{"subject":"{{oggetto}}"}}'
    testTool: cerca_eventi
    testArguments: { start: "2026-01-01T00:00:00Z", end: "2026-01-02T00:00:00Z" }
    publish: true

  - key: normattiva
    kind: external
    name: Normattiva
    url: https://.../mcp
    auth: { kind: CustomHeaders, header: X-API-Key, secret: Blueprints:Secrets:TEST:mcp-apikey }

  - key: web-search
    kind: existing                         # già nel catalogo del tenant: solo collegato
    name: Web Search                       # il nome ESATTO del catalogo, senza prefisso
    # mcpId: 8f1c…                         # solo se più server hanno lo stesso nome
```

#### `kind: existing` — un server che è già sul tenant

Serve per i server che il tenant ha già nel suo catalogo MCP e che il blueprint deve solo collegare
agli agenti: un server condiviso come `web-search`, uno registrato a mano, uno creato da un altro
blueprint. Si scrivono chiave, `kind: existing` e il **nome esatto del catalogo**; gli agenti lo
citano in `mcp:` come qualunque altro server.

- **Il nome non riceve il prefisso** `BP-<TAG>-`: il server non l'ha creato il blueprint, e con il
  prefisso si cercherebbe un server che non esiste.
- **Il blueprint non lo crea, non lo pubblica e non lo mette in inventario**: né `rollback` né
  `delete` possono toccarlo. Del blueprint è solo il **collegamento** agente → server, che il
  rollback toglie insieme all'agente.
- **Non si configura**: `connection`, `tools`, `variables`, `testTool`, `url`, `auth` e
  `timeoutSeconds` appartengono a chi lo ha registrato, e su un `existing` sono un errore (`BP043`).
  `systemPrompt` e `promptMode` restano ammessi: sono istruzioni per gli agenti del blueprint, e
  vengono dal manifest, non dal server.
- **Il preflight lo cerca nel catalogo**, per `mcpId` se c'è e altrimenti per nome (senza badare
  alle maiuscole). Se non c'è, se il nome è ambiguo o se il catalogo non si è potuto leggere, il
  piano si ferma con `BP069`, e il messaggio elenca i server che il catalogo contiene.
- **Un collegamento che esiste già** — fatto a mano dalla UI prima che il manifest lo dichiarasse —
  non viene rifatto: finisce in inventario come `Adopted`, e il rollback lo lascia dov'è.

#### `systemPrompt` e `promptMode` — le istruzioni d'uso del server

Chi conosce quegli strumenti scrive **una volta sola** in che ordine vanno chiamati, quali parametri
sono facili da sbagliare, come si leggono le risposte e cosa quel sistema non copre. Il testo resta
sul server, e da lì raggiunge ogni agente a cui il server viene collegato.

`promptMode` dice cosa farne sull'agente. Dall'interfaccia la domanda si fa a ogni collegamento; in
un manifest la risposta si scrive sul server, perché non c'è nessuno a cui chiederla al momento
giusto:

| `promptMode` | Effetto sul `systemMessage` dell'agente |
|---|---|
| `append` (default) | Il prompt del server va in coda, separato da una riga vuota. |
| `replace` | Il prompt del server sostituisce quello dell'agente. |
| `skip` | L'agente resta com'è: il testo vive solo sul server. |

La composizione avviene alla **creazione** dell'agente, non al collegamento: l'agente nasce già con
le istruzioni, e il piano dice quali server vi hanno contribuito — `con il prompt suggerito di
«calendario»` — così ci si accorge di cosa sta per succedere prima che succeda. Se un agente usa più
server, si applicano nell'ordine in cui li elenca, e un `replace` azzera ciò che è stato composto
fino a lì.

Due rilievi (`BP046`): un `promptMode` che non è una delle tre parole è un **errore** — verrebbe
letto come `append`, e il manifest direbbe una cosa mentre ne succede un'altra; un `promptMode` su
un server **senza** `systemPrompt` è un **avviso**, perché quasi sempre è il prompt che si è
dimenticato di scrivere.

### Una connessione verso il webhook di un processo: `process`

Serve quando è un **agente in chat** a dover aprire una pratica — l'avvocato detta due righe al
telefono e l'agente avvia lo stesso processo che avvierebbe una mail. Il tool che lo fa è una POST al
webhook del processo, e il webhook ha una chiave che nasce all'apply e si vede una volta sola:
nessuno può scriverla nel manifest. La connessione la dichiara così:

```yaml
connections:
  - key: pratiche
    name: pratiche-webhook
    provider: webhook
    process: presa-in-carico        # chiave del processo; niente baseUrl, niente auth

mcpServers:
  - key: pratiche
    kind: builder
    name: Pratiche
    connection: pratiche
    tools:
      - name: apri_pratica
        method: POST
        path: /                     # il webhook è la baseUrl stessa
        description: Apre una pratica con il testo dell'avviso e la fonte.
        parameters:
          testo: Il testo integrale dell'avviso, come è arrivato
          fonte: chat | mail | cancelleria
        required: [testo, fonte]
        body: |
          {"testoAvviso": "{{testo}}", "fonte": "{{fonte}}"}
```

All'apply la connessione nasce con un indirizzo di attesa (`https://webhook-in-attesa.invalid/`,
che non risolve); dopo la creazione del webhook l'operazione **«Scrive nella connessione indirizzo e
chiave»** mette l'URL vero, la chiave nell'header `X-Api-Key`, e conserva la chiave in Key Vault come
`Blueprints:Secrets:<TAG>:webhook-<chiave-processo>`. Il server MCP non si ritocca: i tool leggono la
connessione a ogni chiamata. Il corpo della POST diventa il `caseData` iniziale dell'istanza, come
per il webhook alimentato da un agent task. `baseUrl` o `auth` insieme a `process` sono un errore
(`BP045`), come un processo senza `webhook: { enabled: true }`.

Il processo **non** deve dipendere dall'agente che ha questo tool: la connessione si completa dopo
il webhook, e il webhook dopo il processo, quindi l'agente della chat e l'agente dei passi automatici
del processo sono due agenti distinti. `connections refresh` sa ricostruire anche questa
connessione: indirizzo dal webhook sul tenant, chiave dal segreto.

## `orchestrators`

Un orchestratore sono **step** e **flows**: i nodi e gli archi che li collegano. Si chiamano `flows`
e non `connections` perché nel manifest `connections` sono già le connessioni verso i sistemi di
terze parti, e la stessa parola con due sensi costa un'ora a chi legge.

**Si parte dal primo step.** Non c'è uno step di avvio da dichiarare: l'orchestrazione parte dallo
step a cui nessun flusso arriva — la stessa regola del motore e del designer, dove uno step «Start»
non si può nemmeno aggiungere: si trascina il primo agente e si parte da lì. Nel manifest quello
step si elenca per primo, e i flussi collegano il resto. Uno step `type: start` scritto per
abitudine è accettato, segnalato (`BP094`) e ignorato dal piano insieme ai suoi flussi.

**Il messaggio di benvenuto è `welcomeMessage`, non uno step.** Il blueprint crea con l'orchestratore
il suo endpoint di chat (come «Default Agent Endpoint» per gli agenti), e `welcomeMessage` è ciò
che la chat mostra **all'apertura, prima che l'utente scriva**: il posto giusto per dire come si fa
una domanda a questa orchestrazione e suggerirne alcune. Al massimo 1500 caratteri (`BP016`);
`language` è la lingua dell'endpoint (default `it`). Uno step `sendMessage` in testa **non** serve
allo scopo: il suo testo arriva in chat solo insieme alla risposta finale.

```yaml
orchestrators:
  - key: arricchimento
    name: Arricchimento scheda
    welcomeMessage: |
      Scrivi il nome dell'azienda e che cosa vuoi sapere. Per esempio: «Profilo di Rossi S.p.A.
      con le ultime notizie».
    steps:
      - key: profilo                     # il primo step: da qui si parte
        name: Profilo
        type: agent
        agent: profilo                   # chiave di agents[]
        userMessageTemplate: "{{input}}"
        timeoutSeconds: 90
        requireStructuredOutput: true
        outputSchema: { type: object, properties: { nome: { type: string } } }

      - key: fonti
        name: Fonti pubbliche
        type: parallelGroup
        agents: [web, registro]          # girano insieme
        agentOutputs: { web: notizie }   # dove finisce l'output di ciascuno
        maxParallel: 2

      - { key: fine, name: Fine, type: terminate }

    flows:
      - { from: profilo, to: fonti }
      - { from: fonti, to: fine }
```

### I tipi di step

| `type` | Cosa fa | Campi propri |
|---|---|---|
| `start` | **Non serve**: l'ingresso è il primo step a cui nessun flusso arriva. Accettato per i manifest già scritti, segnalato con `BP094` e ignorato dal piano | — |
| `agent` | Esegue un agente | `agent`, `userMessageTemplate`, `requireStructuredOutput`, `outputSchema`, `skillMetadata`, `allowAgentInteraction`, `allowFileUploadOnPause`, `useTempFiles`, `maxLoopIterations`, `loopInstruction` |
| `parallelGroup` | Più agenti insieme | `agents`, `agentOutputs`, `maxParallel` |
| `handoffGroup` | Più agenti che si passano il turno | `agents`, `agentOutputs` |
| `condition` | Bivio su una condizione | `condition` — **due** flussi uscenti, `condition: true` e `condition: false` |
| `switch` | Più vie su un valore | `switchVariable`, `cases`, `defaultCase` — un flusso per ogni caso, con `label` |
| `userQuestion` | Chiede all'utente | `question`, `contextVariable`, `ctas`, `allowFileUpload` |
| `humanApproval` | Attende un sì o un no | `title`, `recipients`, `timeoutHours` — **due** flussi, `label: approved` e `label: rejected` |
| `sendMessage` | Mostra un messaggio | `text` |
| `action` | Esegue un'azione | `provider` (`email`/`webhook`/`javascript`), `action`, `connection`, `input` |
| `terminate` | Uscita | — |

Ogni step che non sia `terminate` vuole almeno un flusso uscente, e **uno solo** step — l'ingresso —
non ne vuole di entranti: nessuno (un ciclo chiuso) o più d'uno è `BP095`. Le altre regole del
grafo non sono riscritte dalla CLI: si delega al validatore della piattaforma, lo stesso che gira
sul server, ed è da lì che arrivano i messaggi dei rilievi `BP092`.

`recipients` di `humanApproval` devono essere utenti del tenant: il preflight lo verifica.

## `external`

Serve molto meno di quanto sembri, e conviene sapere perché.

Quasi tutto ciò che un tempo si scriveva qui ha un **equivalente nativo**, che il blueprint crea
davvero:

| Cosa volevi | Come si scrive oggi |
|---|---|
| Leggere una casella o un calendario | `connections` verso Microsoft Graph (`OAuth2ClientCredentials`) + `mcpServers` con `kind: builder` |
| Far partire un processo quando arriva qualcosa | Un agente con quel server MCP + `agentTasks` con `trigger: scheduled` e un `outputActions` `webhook` verso `processes.<chiave>.webhook` |
| `auth: appRegistration` | Le credenziali dell'app registrata stanno nella `connections` che interroga la fonte, citate per nome |

Scrivere quelle cose in `external` produce un errore `BP052` che indica la forma nativa: non è
pignoleria, è che lì non verrebbero create.

Resta scoperta **una sola** cosa: l'ingresso **push**, cioè reagire nell'attimo in cui la mail
arriva invece di guardare ogni N minuti. Vuole una Logic App con il connettore Office 365, e con
essa un'autorizzazione che una macchina non può dare al posto di una persona.

```yaml
external:
  mailbox: protocollo@studio.it
  auth: interactive                  # interactive | appRegistration
  ingress:
    kind: logicapp                   # l'unica modalità che richiede ancora infrastruttura
    target: processes.presa-in-carico.webhook
  manualSteps:
    - authorize-office365-connection
  resourceGroup: rg-...              # obbligatori con kind: logicapp
  location: italynorth
```

`xrcopilotlab-bp external <manifest>` elenca i passi manuali ed esce **5**. La differenza con la
variante a polling: quella il blueprint la crea per intero, questa no.

## Codici dei rilievi

| Intervallo | Area |
|---|---|
| `BP001`–`BP007` | Intestazione: tag, identificativo, versione, tenant, topic ambiguo |
| `BP010`–`BP016` | Chiavi e nomi: mancanti, duplicati, già prefissati; modello dell'agente non dichiarato (`BP015`); descrizione più larga della colonna SQL che la riceve — 500 caratteri per topic, profilo e agente, 1000 per orchestratore, ruolo e agent task (`BP016`, errore: l'apply si fermerebbe sul tenant a entità già create) |
| `BP020`–`BP023` | Riferimenti fra sezioni e alternative esclusive |
| `BP030`–`BP033` | Processi: specifica non valida, ruolo, agent task o sotto-processo sconosciuto |
| `BP040`–`BP047` | Connessioni e server MCP; connessione verso il webhook di un processo (`BP045`); segreto scritto in chiaro o di un altro tag (`BP047`) |
| `BP024`–`BP029` | Agent task: trigger, schedulazione, code di uscita; file di knowledge inutilizzabile (`BP027`); partizionamento dei profili (`BP028`); cron più fitto della quota giornaliera (`BP029`) |
| `BP050`–`BP052` | Risorse esterne, ed equivalenti nativi |
| `BP060`–`BP065` | Preflight: collisione di nome, skill, utente, segreto o topic mancante; modello fuori catalogo (`BP065`) |
| `BP070` | Sezione dichiarata ma non ancora applicata |
| `BP090`–`BP092` | Orchestratori: tipo di step, campi, grafo |
