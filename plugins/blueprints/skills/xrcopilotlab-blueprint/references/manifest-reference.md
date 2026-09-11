# Manifest di un blueprint — riferimento

Formato **v1**. Schema JSON:
[`XRCopilotLab.BluePrints/Schema/blueprint.v1.schema.json`](../../src/XRCopilotLab/XRCopilotLab.BluePrints/Schema/blueprint.v1.schema.json).
Esempio completo: [`blueprints/test-agenda.yml`](../../blueprints/test-agenda.yml).

Due regole valgono ovunque nel file:

- **I nomi si scrivono senza prefisso.** Il planner antepone `BP-<TAG>-`. Scriverlo a mano è un
  errore segnalato (`BP014`), perché produrrebbe `BP-TEST-BP-TEST-…`.
- **I segreti si citano, non si scrivono.** Ogni campo che conterrebbe una credenziale porta il
  **nome di una chiave** di App Configuration (`Blueprints:Secrets:<TAG>:<nome>`), creata con
  `xrcopilotlab-bp secrets set`.

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

## `agents`

```yaml
agents:
  - key: agenda
    name: Agenda
    description: ...
    systemMessage: |
      ...
    model: ...            # facoltativo: senza, vale il default del tenant
    temperature: 0.2
    maxTokens: 4000
    language: it          # lingua dell'endpoint di default
    skills: []            # SkillId già a catalogo, es. legal-research
    mcp: []               # chiavi di mcpServers (milestone 2)
```

Ogni agente riceve un **endpoint di default** come quando lo si crea dall'interfaccia: senza, un
agente esiste ma non è interrogabile.

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

`agent` e `orchestrator` sono alternativi: indicarne due, o nessuno, è un errore (`BP021`). Gli
agent task su orchestratore sono dichiarabili ma non ancora creati (milestone 2).

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
- la variabile di una condizione deve essere la `key` di un campo form o un `outputVariable`.

### `form` — i campi di un modulo

```yaml
form:
  - key: testoAvviso
    label: Testo dell'avviso
    type: textarea         # text | textarea | number | bool | date | select | user
    description: ...       # spiegazione sotto l'etichetta, non un segnaposto
    required: true
    readonly: false
    context: false         # sola lettura, alimentato da una variabile a monte
    options: [a, b]        # solo per select
    optionsTargetName: ... # solo per select, opzioni da una sorgente dati esterna
```

Il tipo **allegato** non è ancora accettato dalla specifica dichiarativa della piattaforma: un
processo che ne ha bisogno si disegna nel designer e si importa con `bpmnFile`.

## `connections` e `mcpServers` — milestone 2

Dichiarabili e verificati, non ancora creati. Il piano lo segnala con un avviso.

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
    variables: { mailbox: test@hevolus.it }
    tools:
      - name: cerca_eventi
        method: GET
        path: /users/{{mailbox}}/calendarView
        parameters: { start: string, end: string }
        transform: return data.value.map(e => ({ subject: e.subject }));
    testTool: cerca_eventi
    publish: true

  - key: normattiva
    kind: external
    name: Normattiva
    url: https://.../mcp
    auth: { kind: CustomHeaders, header: X-API-Key, secret: Blueprints:Secrets:LEGAL:mcp-apikey }
```

## `external` — milestone 2

```yaml
external:
  mailbox: test@hevolus.it
  auth: interactive                  # interactive | appRegistration
  ingress:
    kind: logicapp                   # logicapp | scheduledAgentTask
    target: processes.presa-in-carico.webhook
  calendar:
    kind: logicapp
    exposeAs: mcpServers.calendario
  manualSteps:
    - authorize-office365-connection
  resourceGroup: rg-...
  location: italynorth
```

`auth: interactive` non richiede una registrazione di applicazione: il connettore Office 365 di una
Logic App si autorizza una volta sola con un accesso alla casella. `appRegistration` usa i permessi
applicativi di Microsoft Graph con una Application Access Policy che limita l'accesso a quella sola
casella, ed è la forma da preferire in produzione.

## Codici dei rilievi

| Intervallo | Area |
|---|---|
| `BP001`–`BP007` | Intestazione: tag, identificativo, versione, tenant, topic ambiguo |
| `BP010`–`BP014` | Chiavi e nomi: mancanti, duplicati, già prefissati |
| `BP020`–`BP023` | Riferimenti fra sezioni e alternative esclusive |
| `BP030`–`BP033` | Processi: specifica non valida, ruolo, agent task o sotto-processo sconosciuto |
| `BP040`–`BP044` | Connessioni e server MCP |
| `BP050`–`BP051` | Risorse esterne |
| `BP060`–`BP064` | Preflight: collisione di nome, skill, utente, segreto o topic mancante |
| `BP070` | Sezione dichiarata ma non ancora applicata |
