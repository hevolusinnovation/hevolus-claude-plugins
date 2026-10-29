# Manifest di un blueprint — riferimento

Formato **v1**. Schema JSON:
[`blueprint.v1.schema.json`](blueprint.v1.schema.json).
Esempio completo: [`esempio-minimo.yml`](esempio-minimo.yml).

Due regole valgono ovunque nel file:

- **I nomi si scrivono senza prefisso.** Il planner antepone `BP-<TAG>-`, oppure il prefisso scelto in
  [`naming.prefix`](#naming-come-si-chiamano-le-entità). Scriverlo a mano è un errore segnalato
  (`BP014`), perché produrrebbe `BP-TEST-BP-TEST-…`.
- **I segreti si citano, non si scrivono.** Ogni campo che conterrebbe una credenziale porta il
  **nome di una chiave** di App Configuration (`Blueprints:Secrets:<TAG>:<nome>`), creata con
  `xrcopilotlab-bp secrets set`. `<TAG>` è il tag del manifest: un valore in chiaro, o la chiave di
  un altro tag, è un errore (`BP047`) — chi applica leggerebbe la credenziale di un altro blueprint.
  Il `<nome>` deve poter stare in Key Vault: lettere, cifre, `-`, `.` e `:`, e due nomi che
  differiscono solo per maiuscole, `.` o `:` sono lo stesso segreto (`BP047`).

## Intestazione

```yaml
blueprint: test-agenda      # slug minuscolo, stabile fra le versioni
version: 1                  # progressiva; una versione pubblicata è immutabile
tag: TEST                   # ^[A-Z0-9]{2,20}$ — senza naming, entra nel prefisso di ogni entità
description: ...
extends: null               # riservato: accettato ma non ancora applicato
access:                     # facoltativo (#1518): chi lo vede, se si copia, chi lo governa
  scope: staging            # public | staging | tenant
  locked: false             # true: si vede, ma lo copiano e lo aggiornano solo gli owner
  owners: [giuseppe.zileni@hevolus.it]
naming:                     # facoltativo: senza, il prefisso è BP-TEST-
  prefix: "Studio · "       # «Studio · Agenda»; "" = nessun prefisso

tenant:
  companyId: 1111...        # GUID del tenant
  topic: Agenda di Studio   # crea un topic nuovo: diventa BP-TEST-Agenda di Studio
```

### `naming`: come si chiamano le entità

Senza `naming` ogni entità creata si chiama `BP-<TAG>-<nome>`. Con `naming.prefix` si sceglie il
testo da anteporre, così com'è, spazi compresi:

| `naming.prefix` | `name: Agenda` diventa |
|---|---|
| *(assente)* | `BP-TEST-Agenda` |
| `"Studio · "` | `Studio · Agenda` |
| `"Legal - "` | `Legal - Agenda` |
| `""` | `Agenda` |

Il prefisso è cosmetico: che un'entità sia del blueprint lo dice l'inventario del run, non il nome.
Tre cose da sapere prima di sceglierlo:

- **Si decide prima del primo apply.** Su un blueprint già applicato una versione con un prefisso
  diverso si ferma (`BP111`): un aggiornamento non rinomina, e creerebbe un doppione di ogni entità.
  Per cambiarlo: `rollback` e `apply` di nuovo.
- **Senza prefisso le collisioni sono più probabili.** Un agente fatto a mano che si chiama come uno
  del manifest ferma il piano (`BP060`), come sempre: il blueprint non sovrascrive.
- **Al massimo 40 caratteri, su una riga, non di soli spazi** (`BP110`): finisce nel nome di ogni
  entità.

I segreti restano legati al **tag** (`Blueprints:Secrets:<TAG>:<nome>`), non al prefisso.

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

### Più topic: `topics`

Un blueprint può vivere in più topic — è il caso del backup di un tenant intero (#1175). Il topic di
`tenant` resta quello di default; gli altri si dichiarano in `topics`, ognuno con una chiave e uno
solo fra `name` (lo crea), `existingTopic` e `topicId` (lo riusa):

```yaml
tenant:
  companyId: 1111...
  topic: Generale

topics:
  - key: legale
    name: Legale
  - key: hr
    existingTopic: Risorse umane

agents:
  - key: assistente          # nel topic di tenant
    name: Assistente
  - key: avvocato
    name: Avvocato
    topic: legale            # nel topic «BP-<TAG>-Legale», creato dal blueprint
```

- `topic: <chiave>` si mette su **agenti, profili di knowledge e agent task**. Senza, l'entità sta nel
  topic di `tenant`; una chiave che `topics` non dichiara è un errore (`BP008`).
- Un **orchestratore** non ha un topic: ogni suo step porta quello del proprio agente, quindi un
  orchestratore può usare agenti di topic diversi.
- La chiave `topic` è riservata al topic di `tenant`. I nomi di agenti e profili si confrontano con
  quelli già presenti **nel topic in cui finiscono**.
- Se ogni agente e profilo dichiara il proprio topic, `tenant` può non indicarne uno.

### `embed`: l'endpoint di chat in un sito (#1518)

Su un agente (`agents[].embed`) o su un orchestratore (`orchestrators[].embed`):

```yaml
embed:
  public: true                          # embed pubblico in iframe
  domains: [https://sito.it, http://localhost:4280]   # origini autorizzate (anche https://*.sito.it)
  identity: jwt-hs256                   # declared | jwt-hs256 | jwt-rs256 | session (facoltativa)
  requireIdentity: true                 # senza identità l'embed non risponde
  showDocuments: false                  # niente schede dei file della knowledge sotto le risposte (default: com'è)
```

L'apply porta l'endpoint di chat a questo stato a **ogni versione** (operazione `ConfigureEmbed`): lo attiva, imposta
l'embed pubblico, aggiunge i domini mancanti e toglie quelli dell'endpoint non più dichiarati (quelli dell'azienda
non si toccano), salva la modalità d'identità. Il segreto HS256 o la chiave pubblica RS256 si impostano dalla UI e
restano. Alla fine stampa l'indirizzo dell'iframe, relativo al sito della webapp, e per `session` la chiave API,
mostrata una sola volta. Domini e identità sbagliati: `BP129`, `BP130`.

Ogni dominio dell'endpoint entra nell'inventario del run (tipo `EmbedDomain`): la riga non se ne va con l'agente,
e il `rollback` la toglie prima di lui.

### `access`: scope, blocco e owner

Facoltativa: senza, il blueprint resta com'era (nessun owner, nessun blocco). Con la chiave:

| Campo | Valori | Che cosa decide |
|---|---|---|
| `scope` | `public` · `staging` · `tenant` | Dove sta. `public`: nel catalogo dell'ambiente (il tenant `default`), lo vedono tutti i tenant. `staging`: in un tenant di staging. `tenant`: in un tenant di produzione. Gli ultimi due li vede solo il loro tenant. Lo scrive l'archivio quando la versione arriva (push, chat, promozione, installazione): nel manifest è solo una dichiarazione, che `catalog publish` vuole `public`. |
| `locked` | `true` · `false` | Se vero si vede come gli altri, ma lo copiano (installazione, promozione, esportazione, pubblicazione) e lo aggiornano solo i suoi owner (`BP123`, `BP125`). |
| `owners` | email | Chi governa il blueprint: solo loro cambiano `access` (`BP124`), pubblicano nel catalogo (`BP127`) e, se è bloccato, portano nuove versioni. Almeno uno (`BP121`). |

- **Chi vede che cosa.** Ogni ambiente, staging e produzione, è multi-tenant e ha il suo database. In ciascuno un
  tenant vede il catalogo dell'ambiente (il tenant `default`, convenzione della webapp) e i propri blueprint, mai
  quelli di un altro tenant. Pubblicare in produzione un modello collaudato nel catalogo di staging vuol dire copiarne
  la versione nel catalogo di produzione (`catalog pull --env staging`, poi `catalog publish --env prod`); una
  correzione è una versione nuova che fa lo stesso giro.
- **Le copie prendono lo scope della destinazione**, in qualunque verso — da un tenant a un altro, da staging a
  produzione e viceversa: `public` nel catalogo, `staging` in un tenant di staging, `tenant` in un tenant di
  produzione. Le fanno solo gli utenti Hevolus. L'installazione dal catalogo lo scrive nel manifest installato; la
  promozione, che copia il manifest identico, lo registra nell'archivio (campo `scope` del documento). Una copia di
  un blueprint bloccato resta bloccata, con gli stessi owner.
- **Valgono gli owner della versione in vigore**: una nuova versione che li cambia la porta un owner. Chi toglie sé
  stesso riceve `BP126` e conferma con `--release-ownership`: da lì non governa più il blueprint.
- **Chi sei** si legge dall'identità verificata (oggi il token Azure con cui la CLI scrive, con #1333 il token del
  prodotto), mai da un profilo o da un'opzione. La CLI avvisa e si ferma prima; il controllo che conta è del server.
- **Solo membri di Hevolus.** Oggi ogni operazione sui blueprint è riservata ai membri di Hevolus, anche
  l'installazione dei modelli pubblici. Lo decide `HevolusIdentity`, un punto solo: dal token, tenant Entra di
  Hevolus, email `@hevolus.it` e nessun segno d'ospite (`acct = 1`, `#EXT#` nell'`upn`, un `idp` esterno); dall'utente
  registrato (le chiamate della webapp, che passano solo l'id), email `@hevolus.it` e, se c'è, il tenant salvato al
  primo accesso. Nessun ruolo nuovo. Configurazione: sezione `BlueprintAccess` (`HevolusTenantId`,
  `HevolusEmailDomain`), con i valori di Hevolus come predefiniti.
- **Dove lo applica il server.** Le rotte `cli/*` rispondono 403 `hevolus_only` a chi non è membro; il catalogo
  della webapp e i backup del tenant rispondono 403; la chat dei blueprint della webapp non si apre. Il catalogo
  (CLI e webapp) mostra i modelli `public`, anche bloccati (li installa solo un owner), e quelli ancora senza `access`. La chat applica le
  stesse regole degli owner prima di pubblicare o applicare una versione.

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

La forma che ne risulta è **un profilo per dominio** (dal 20/10/2026; prima era un profilo per
agente): gli agenti che lavorano sugli stessi documenti condividono un profilo, perché ogni profilo
attivo consuma una licenza e un profilo per agente su un blueprint grande la supera (`BP071`). In un
blueprint a moduli è un profilo per segmento, in un modulo che i moduli del segmento richiedono. Due
eccezioni restano: mai un profilo unico per tutto il blueprint, e il passo a valle di una catena ha
un profilo con i soli file che deve leggere (caso 3). I nomi dei file portano il dominio, così in un
profilo condiviso la selezione per nome esclude gli altri. `xrcopilotlab-bp suggest` propone un
profilo per agente come punto di partenza da accorpare; il validatore segnala i casi qui sopra con
`BP028` — sempre come avvisi, perché la decisione richiede di sapere che cosa fa ciascun agente.

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
    skills: []            # SkillId già a catalogo, es. video-gen
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

**Il foglio lo legge una skill solo se l'agente ne ha una che legge i fogli.** Sono le skill con
`ReadsAgentSpreadsheets` nel catalogo (`_Skills`): oggi solo `spreadsheet` (le skill marketing che li
leggevano sono uscite con la #1614). Se l'agente non ne ha nessuna, un foglio
`reference` entra nel Knowledge Graph come un documento qualunque: viene indicizzato e **cercato**,
non letto riga per riga, e le domande che attraversano tutte le righe tornano a perderne una parte.
Il piano oggi non lo segnala: le `skills` dell'agente vanno controllate a mano accanto a `files`.

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

Il tipo e le impostazioni di risposta valgono alla creazione (ciò che non si dichiara prende il default della UI:
Q&A, `concise`, 1.2, …) e in un aggiornamento sul posto, dove cambiano **solo** se dichiarati. Fino alla #1612
(ottobre 2026) l'apply li ignorava e creava ogni agente Q&A: un agente `type: base` riceveva il grounding stretto
delle Q&A e, in un dialogo a più turni, rifiutava di rispondere a un seguito come «B».

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

#### Gli allegati del messaggio: `attachments.fromMessage`

Un'uscita `webhook` verso `processes.<chiave>.webhook` porta al processo solo il **testo**. Perché il processo
riceva anche gli **allegati** del messaggio di posta, si dichiara da dove si leggono:

```yaml
    prompt: |
      Elenca i messaggi non letti arrivati da ieri. Per il primo, chiudi la risposta con una riga:
      MAIL_MESSAGE_ID: <id del messaggio>
    outputActions:
      - type: webhook
        url: processes.presa-in-carico.webhook
        attachments:
          fromMessage:
            connection: graph-posta       # connessione del manifest, auth OAuth2ClientCredentials verso Graph
            mailbox: gare@azienda.it      # l'indirizzo (o l'id) della casella in cui sta il messaggio
```

- L'agente nomina il messaggio con la riga `MAIL_MESSAGE_ID: <id>` alla fine del proprio testo (il `prompt` del
  task glielo chiede). L'adattatore toglie la riga dal testo e nel corpo della POST mette **solo il riferimento**
  (connessione, casella, id del messaggio): mai file né credenziali. Senza una riga utilizzabile il processo parte
  lo stesso e `allegatiMailErrori` lo dice.
- I file li scarica la piattaforma (un lavoro in background, non la richiesta HTTP) attraverso la connessione, e
  stanno sull'istanza nel campo `allegatiMail` (la lista di file dei campi `file`): li vedono i passi con
  `shareAttachments` e il work item interattivo.
- **Limiti per messaggio**: 30 file, 25 MB l'uno, 100 MB in tutto. Ciò che non entra — oltre i limiti, immagini
  «inline» (loghi e firme), link a file nel cloud — non sparisce in silenzio: una riga per file in
  `allegatiMailErrori`. Gli ZIP e le mail allegate (anche la busta di una PEC) restano com'è: le skill delle gare li
  aprono quando leggono.
- **Costo**: i file importati dalla mail **non** passano da Content Understanding (che si paga a pagina) quando un
  passo li condivide con un agente: le skill delle gare li leggono dall'URL, in locale. Un agente senza skill riceve il
  testo di `.docx` e `.xlsx`, non quello dei PDF.
- Vale solo con `type: webhook` verso `processes.<chiave>.webhook` e una connessione `OAuth2ClientCredentials` del
  manifest; altrimenti `BP144`. La connessione deve avere il permesso di lettura della posta (`Mail.Read`) sulla casella.

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
      shareAttachments: true   # l'agent task riceve gli allegati dei campi file delle attività precedenti
      expectedDurationMinutes: 2

    - id: dialoga
      type: Task
      performer: AiAssisted
      agentTaskName: Estrazione udienza
      roleName: Referente agenda
      interactive: true        # il work item mostra la chat con l'agente invece di eseguire in automatico

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
- `interactive` — booleano, solo con `performer: AiAssisted`. Il work item mostra la chat con
  l'agente o l'orchestratore dell'agent task, invece di eseguirlo in automatico; le risposte
  riempiono i campi del form;
- il **Process Copilot** del compito («Spiegami il compito», «Precompila il form») non ha campi nel
  manifest: compare da sé su ogni work item aperto non interattivo;
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
        # scomporre un allegato .eml in base64: vedi leggi_eml nel manifest di STUDIOPOLIS (`pull --tag STUDIOPOLIS`).
        # Le `variables` del server entrano anche nello script (`"{{mittentiAmmessi}}".split(",")`) quando si
        # applica, dalla CLI 2.16.3: a runtime il sandbox vede solo `input`. Vedi il filtro dei mittenti.
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

#### `kind: native` — un server nativo Google, con l'app del cliente

Per leggere o scrivere su un servizio Google **a nome di una persona** (calendario, Drive, posta). La
piattaforma ha per questi servizi un server MCP nativo; ma è uno solo, di tutti i tenant, e l'account
Google collegato sarebbe uno solo. Con `native` il blueprint crea per il tenant una **copia**, con la
sua riga OAuth e l'app Google del cliente, e l'autorizzazione la dà una persona del tenant.

```yaml
mcpServers:
  - key: calendario
    kind: native
    name: Google Calendar                   # riceve il prefisso BP-<TAG>-
    service: calendar                       # calendar | drive | gmail
    clientId: Blueprints:Secrets:STUDIOPOLIS:google-client-id
    clientSecret: Blueprints:Secrets:STUDIOPOLIS:google-client-secret
```

- **L'app Google è del cliente**: `clientId` e `clientSecret` sono riferimenti a segreti
  (`BP047` rifiuta un valore in chiaro), che si impostano con `secrets set`. Il valore finisce solo
  nella riga OAuth del server, non nel manifest.
- **Non si configura**: `connection`, `tools`, `url`, `auth`, `mcpId` e simili appartengono al server
  nativo, e su un `native` sono un errore (`BP043`). Un servizio senza server nativo è `BP107`.
- **L'apply non autorizza**: crea il server e la riga OAuth «da autorizzare». Poi una persona esegue
  `xrcopilotlab-bp mcp authorize <chiave> --tag <TAG>` (o lo fa dalla UI, Interoperabilità ›
  MCP Servers) e accede con il suo account Google. Finché non lo fa, l'agente che lo usa dichiara la
  fonte non disponibile. Se i segreti dell'app mancano all'apply, la riga nasce vuota e il piano avvisa
  (`BP063`): `mcp authorize` la completa.
- **Si smonta col blueprint**: il rollback toglie la riga OAuth e poi il server dal catalogo del tenant.
  Il server nativo di piattaforma non si tocca mai.
- Gli agenti lo citano in `mcp:` come qualunque altro server.

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

### Una connessione verso il calendario editoriale di un agente: `calendar`

Serve quando un agente, un orchestratore o un passo di processo deve **leggere o scrivere il piano editoriale (PED)** di un
agente: slot liberi, proposta dello slot, prenotazione, conferma dopo l'approvazione, revisione settimanale, KPI nel piano,
dashboard. Il calendario è della piattaforma; la connessione lo raggiunge attraverso l'**hook** dell'agente, che nasce all'apply,
dopo l'agente, con una chiave che si vede una volta sola (#1614):

```yaml
connections:
  - key: calendario
    name: calendario-ped
    provider: webhook
    calendar: marketing             # chiave dell'agente che ha il PED fra i suoi file; niente baseUrl, niente auth

mcpServers:
  - key: calendario
    kind: builder
    name: Calendario editoriale
    connection: calendario
    tools:
      - name: slot_liberi
        method: GET
        path: /entries
        query: { from: "{{dal}}", to: "{{al}}" }   # giorni AAAA-MM-GG
      - name: proponi_slot
        method: POST
        path: /proposal              # { channels, typology, contentRef, eventDate, requestedDate, windowStart, windowEnd }
      - name: prenota_slot
        method: POST
        path: /reservations          # { channel, slotStart, contentRef, typology, topic }
      - name: conferma_slot
        method: POST
        path: /reservations/{{prenotazione}}/commit
        body: '{"approvedBy":"{{user_email}}"}'
```

- **Di quale piano si tratta lo decide l'hook**, non la richiesta: un tool non può toccare il PED di un altro agente, e il
  modello sceglie date e canali, mai di chi è il piano.
- **La chiave si rigenera a ogni apply** e la connessione riceve quella nuova: non va in Key Vault, nessun ruolo Azure.
- **Chi approva** si registra nel piano: `conferma_slot` e `review/apply` vogliono `approvedBy`, che il tool riempie con
  `{{user_email}}` del gateway, mai con un nome scelto dal modello.
- Le **regole** (contenuti al giorno, fasce orarie, distanza fra tipologie, tipologie legate a un evento) stanno nella sezione
  `planning` della connessione `marketing-editorial-plan-excel` del PED. Le altre rotte: `POST /review`, `POST /review/apply`,
  `POST /performance`, `POST /dashboard`.
- `BP143`: agente che non esiste, oppure `baseUrl`/`auth`/`process`/`config` insieme a `calendar` (errore); agente senza un
  `.xlsx` fra i file, o nessuna connessione con il layout del PED (avviso).

### Una connessione con un proprio schema: `config`

Non tutte le connessioni sono un webhook HTTP. Il **layout del piano editoriale** che legge il
Marketing Agent (`marketing-editorial-plan-excel`: foglio, riga d'intestazione, mappa delle colonne,
formati di data) è una connessione del tenant con un JSON suo, senza indirizzo né credenziale. Si
dichiara con `config`, che diventa il `ConfigJson` **così com'è**:

```yaml
connections:
  - key: ped-layout
    name: piano-editoriale-layout
    provider: marketing-editorial-plan-excel
    config:
      sheet: Piano Editoriale
      headerRow: 2
      columns: { date: Data, time: Ora, channel: Canale, typology: Code, topic: Titolo, state: Stato }
      dateFormats: [dd/MM/yyyy]
      recordedState: Pianificato
```

`config` è la connessione per intero: insieme a `baseUrl`, `headers`, `auth` o `process` è un errore
(`BP048`), come lo è vuoto. Un server MCP `builder` **non** vi si può appoggiare — i suoi tool hanno
bisogno di un indirizzo, che qui non c'è — e il validatore lo ferma con lo stesso codice. Una
credenziale, se il provider ne vuole una, si imposta dall'interfaccia sulla connessione creata.
`export` riporta in `config` le connessioni dei provider che non sono webhook, e `connections refresh`
le riscrive dal manifest come le altre.

## `orchestrators`

Un orchestratore sono **step** e **flows**: i nodi e gli archi che li collegano. Si chiamano `flows`
e non `connections` perché nel manifest `connections` sono già le connessioni verso i sistemi di
terze parti, e la stessa parola con due sensi costa un'ora a chi legge.

**Si parte dal primo step.** Non c'è uno step di avvio da dichiarare: l'orchestrazione parte dallo
step a cui nessun flusso arriva — la stessa regola del motore e del designer, dove uno step «Start»
non si può nemmeno aggiungere: si trascina il primo agente e si parte da lì. Nel manifest quello
step si elenca per primo, e i flussi collegano il resto. Uno step `type: start` scritto per
abitudine è accettato, segnalato (`BP094`) e ignorato dal piano insieme ai suoi flussi.

**`alwaysRunFlow: true` per un orchestratore che smista una chat.** Dopo un'esecuzione completata, per un'ora il
messaggio successivo della stessa conversazione non riesegue il flusso: un classificatore lo prende per un seguito
(«grazie», «ok») e un modello senza cronologia né strumenti risponde con una frase di cortesia. Va bene per un flusso
che produce un risultato; per un router che smista ogni messaggio vuol dire che la seconda domanda non arriva mai agli
agenti — HEVBPMKT rispondeva «proposta inviata» senza aver chiamato il processo. Con `alwaysRunFlow: true` ogni
messaggio esegue il flusso. Non dichiarato, un aggiornamento lo lascia com'è. Per un dialogo a più turni con un solo
agente (le domande di una proposta) serve anche `allowAgentInteraction: true` sul suo step: l'esecuzione resta in
pausa a ogni domanda e il messaggio dopo riprende lo stesso step.

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
| `agent` | Esegue un agente | `agent`, `userMessageTemplate`, `requireStructuredOutput`, `outputSchema`, `skillMetadata`, `allowAgentInteraction`, `allowFileUploadOnPause`, `useTempFiles`, `shareGeneratedFiles`, `maxLoopIterations`, `loopInstruction` |
| `parallelGroup` | Più agenti insieme | `agents`, `agentOutputs`, `agentMessages`, `agentSkillMetadata`, `maxParallel`, `summarize` |
| `handoffGroup` | Più agenti che si passano il turno | `agents`, `agentOutputs` |
| `condition` | Bivio su una condizione | `condition` — **due** flussi uscenti, `condition: true` e `condition: false` |
| `switch` | Più vie su un valore | `switchVariable`, `cases`, `defaultCase` — un flusso per ogni caso, con `label` |
| `userQuestion` | Chiede all'utente | `question`, `contextVariable`, `ctas`, `allowFileUpload` |
| `humanApproval` | Attende un sì o un no | `title`, `recipients`, `timeoutHours` — **due** flussi, `label: approved` e `label: rejected` |
| `sendMessage` | Mostra un messaggio | `text` |
| `action` | Esegue un'azione | `provider` (`email`/`webhook`/`javascript`), `action`, `connection`, `input`, `outputMapping` |
| `terminate` | Uscita | — |

#### Un gruppo parallelo con un compito per ciascun membro (#1691)

Senza altro, ogni membro di un `parallelGroup` riceve gli stessi valori dell'`inputMapping` del gruppo, e
nient'altro: va bene per agenti che sanno da sé che cosa farne (una news e una newsletter dallo stesso recap).
Quando ogni ramo ha un compito diverso, o esegue una skill che vuole il suo `payload`, li si dà membro per membro:

```yaml
- key: media
  name: Immagini e parlato
  type: parallelGroup
  agents: [immagini-scena, voce]
  agentOutputs: { immagini-scena: immagini, voce: testoVoce }
  summarize: false
  inputMapping: { storyboard: Lo storyboard approvato. }
  agentMessages:                    # il messaggio di ciascun membro, come userMessageTemplate
    immagini-scena: "Genera un'immagine per scena. {{storyboard}}"
    voce: "Scrivi il testo della voce, una riga per scena. {{storyboard}}"
  agentSkillMetadata:               # i parametri di skill di ciascun membro, come skillMetadata
    immagini-scena: { quality: high }
```

- `agentMessages` vuole un `inputMapping` sul gruppo, la stessa condizione per cui il motore rende lo
  `userMessageTemplate` di uno step `agent`; senza, è un errore.
- I file che un membro genera diventano `{variabile}_file` e `{variabile}_files` della sua variabile di
  `agentOutputs` (o di `{AgentId}_output`), come dopo uno step `agent`: nell'esempio, `immagini_files` per le clip.
- Valgono solo per `parallelGroup`; in un `handoffGroup` sono un avviso. Una chiave che non è fra gli `agents`
  è un errore.

**La condizione di un orchestratore non è quella di un gateway.** I gateway dei processi usano
`{ var, op, value }`; il motore delle orchestrazioni legge invece `type` e, a seconda del tipo,
`left`/`right`, `key`, `conditions` o `condition`. La forma dei processi in un bivio di orchestratore
è `BP097`, e fermerebbe lo step solo all'esecuzione.

```yaml
- key: bivio
  name: Serve conferma?
  type: condition
  condition:                      # confronti: equals, contains, greater_than, less_than,
    type: and                     #   greater_than_or_equal, less_than_or_equal (left + right)
    conditions:                   # exists (key) · and / or (conditions) · not (condition)
      - { type: exists, key: analisi }
      - { type: equals, left: "{{context.categoria}}", right: urgente }
```

Ogni step che non sia `terminate` vuole almeno un flusso uscente, e **uno solo** step — l'ingresso —
non ne vuole di entranti: nessuno (un ciclo chiuso) o più d'uno è `BP095`. Le altre regole del
grafo non sono riscritte dalla CLI: si delega al validatore della piattaforma, lo stesso che gira
sul server, ed è da lì che arrivano i messaggi dei rilievi `BP092`.

`recipients` di `humanApproval` devono essere utenti del tenant: il preflight lo verifica.

#### `outputMapping` — due direzioni, secondo il tipo di step

`outputMapping` porta il risultato di uno step nel contesto, da cui i passi a valle lo leggono con
`{{variabile}}`. Sugli step `agent` la **chiave** è la variabile e il valore la descrive. Sugli step
`action` la direzione è **opposta**, ed è quella che il motore legge alla ripresa dell'azione: la chiave
è il **percorso nell'output**, il valore la **variabile**.

```yaml
- key: scadenze
  name: Giorni alle scadenze
  type: action
  provider: javascript
  action: run
  input:
    code: |
      return { esito: { giorni: 12, urgente: false }, righe: [{ nome: "Offerta" }] };
  outputMapping:
    esito.giorni: giorni_alla_scadenza   # percorso → variabile
    righe[0].nome: prima_scadenza
```

- Per uno script `javascript` il percorso parte da ciò che lo script **restituisce**, senza prefissi:
  `body.` è la convenzione del `webhook` (`statusCode`, `headers`, `body`), e su uno script non trova niente.
- Il percorso ammette punti, indici (`righe.0.nome` o `righe[0].nome`) e `*` per l'intero risultato. Una
  stringa arriva nel contesto senza apici; oggetti, array, numeri e booleani come JSON.
- Un percorso che non esiste non ferma lo step: la variabile resta non impostata (e il motore lo registra).
- Il valore deve essere un nome di variabile valido (`^[a-zA-Z_][a-zA-Z0-9_]*$`): altrimenti `BP093`.
- Un aggiornamento confronta questo campo solo se il manifest lo dichiara: una mappatura messa a mano dal
  designer su uno step che il manifest non cita non viene segnalata né tolta.

#### `skillMetadata` — le chiavi che il motore riconosce

`skillMetadata` è una mappa di stringhe libera: il validatore non ne controlla le chiavi. Due sono
riservate al motore e decidono come lo step interroga la knowledge dei suoi agenti. Valgono sugli
step `agent` e, passate dal gruppo ai membri, sui `parallelGroup` e `handoffGroup`. Senza la chiave non
cambia niente; un valore sconosciuto lascia il comportamento di default.

| Chiave | Valori | Effetto |
|---|---|---|
| `knowledge.query` | `request` (default), `step`, `both` | Con che testo si cerca nella knowledge: la richiesta dell'utente, il messaggio dello step, o entrambi. Serve quando lo step costruisce apposta un messaggio per la ricerca (per esempio «NOME, partita IVA …»). |
| `knowledge.records` | `verbatim` | I rami ricevono i record trovati per identificativo così come sono salvati, non la sintesi di un modello; la sintesi resta solo se non ne trova. Serve a chi legge i record da sé e non può perderne per strada. |

```yaml
- type: parallelGroup
  skillMetadata:
    knowledge.query: step
    knowledge.records: verbatim
  agents: [cribis, bilanci]
```

Esempio reale: il manifest di `COMO` (`xrcopilotlab-bp pull --tag COMO`). Le chiavi sono definite in
`StepKnowledgeQuery` e `StepKnowledgeRecords` (`XRCopilotLab.Core/Services/Orchestration/`).

#### `outputMapping` `skill:` — i dati strutturati di una skill diventano variabili

Una skill restituisce, oltre al testo e ai file, un risultato strutturato (`Data` e `Fields` dell'envelope): il
rapporto di compilazione di un modulo, i valori calcolati, un esito. Su uno step `agent` che la esegue, una voce di
`outputMapping` il cui **valore** comincia con `skill:` non è una descrizione per l'agente ma un **percorso** in quel
risultato; la **chiave** resta il nome della variabile, che i passi a valle citano con `{{variabile}}`.

```yaml
- key: compila
  type: agent
  agent: compilatore               # ha la skill che compila il modulo
  outputMapping:
    riassunto: Il riassunto per l'utente.        # come sempre: lo chiede il blocco OUTPUT all'agente
    campi_compilati: "skill:data.filled"         # percorso nel risultato della skill
    partita_iva: "skill:fields.partita_iva"
```

- Il percorso parte da una di queste radici: `data` (il contenuto proprio della skill), `fields` (i valori con
  etichetta, per chiave o, senza, per etichetta), `skillId`, `kind`. Le proprietà di `data` sono in camelCase.
- **Un valore è un percorso solo se dopo `skill:` c'è una radice valida.** Il valore di una riga è, da sempre, anche
  un testo libero per l'agente: una descrizione che comincia per caso con «Skill: …» resta una descrizione, e
  l'agente se la vede chiedere come prima. Per non lasciar passare un refuso, nei blueprint un valore che comincia con
  `skill:`, non ha spazi e non parte da una radice (`skill:esito.giorni`, `skill:Data.esito`) è `BP093`
  (`INVALID_SKILL_OUTPUT_PATH`); a runtime resterebbe una descrizione.
- Il percorso ammette punti, indici (`rows.1.source` o `rows[1].source`) e valori annidati. Una stringa arriva senza
  apici; un numero, un booleano, un oggetto o un array come JSON.
- Le voci `skill:` **non sono chieste all'agente**: non entrano nelle istruzioni del blocco `OUTPUT` né nel
  controllo «chiave non emessa». Uno step con solo voci `skill:` non chiede niente all'agente.
- Un percorso che non esiste nel risultato non ferma lo step — la skill è riuscita — ma la variabile resta **non
  impostata**, e la traccia dello step la elenca come `[MISSING]`.
- Se lo step ha eseguito più skill, vale il primo risultato in cui il percorso esiste. Il risultato strutturato passa
  fino a 256 KB; oltre, la skill non lo consegna allo step e lo scrive nel log.

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

## `modules`: scenari installabili separatamente

Un blueprint può dichiarare **moduli**: scenari che si installano da soli, tutti insieme, una parte o
uno alla volta nel tempo sullo stesso tenant (`plan`/`apply --modules`, vedi
[`cli-reference.md`](cli-reference.md#moduli-installazione-parziale-e-incrementale)). Un manifest senza
`modules` si comporta come prima: tutto insieme.

```yaml
modules:
  - key: civile                      # kebab-case; si scrive in --modules
    title: Diritto civile
    description: Agenda e promemoria delle cause civili
    agents: [agente-civile]
    agentTasks: [promemoria-civile]
  - key: penale
    title: Diritto penale
    requires: [civile]               # i moduli da cui dipende
    agents: [agente-penale]
    knowledge: [kb-penale]
    businessRoles: [cancelleria-penale]
    orchestrators: [smistamento]
    processes: [verifica-calendario]
    connections: [pec-penale]
    mcpServers: [mcp-pec]
```

| Campo | Significato |
|---|---|
| `key` | Chiave del modulo, kebab-case. `core` è riservato. |
| `title`, `description` | Ciò che il piano e `status` mostrano. |
| `requires` | Le chiavi dei moduli da cui dipende. Le dipendenze transitive valgono: se `udienze` richiede `penale` e `penale` richiede `civile`, `udienze` può citare entità di `civile`. |
| `agents`, `knowledge`, `businessRoles`, `agentTasks`, `processes`, `orchestrators`, `connections`, `mcpServers` | Le **chiavi** delle entità del modulo, sezione per sezione. |

Le regole:

- **Il modulo `core` è implicito**: contiene tutte le entità che nessun modulo elenca, e sempre topic,
  `tenant` ed `external`. Si installa sempre.
- **Un'entità appartiene a un modulo solo** (`BP134`). Ciò che serve a più moduli va in `core`, o in un
  modulo che tutti richiedono.
- **Ogni modulo è chiuso rispetto alle dipendenze** (`BP135`): se una sua entità ne cita una di un altro
  modulo — un agente il suo profilo o server MCP, uno step il suo agente, un agent task l'agente,
  l'orchestratore o il webhook di processo a cui consegna, un processo i suoi ruoli, agent task e
  sotto-processi, un server MCP la sua connessione, una connessione `process:` il suo processo — quel modulo
  deve stare in `requires`. `core` non può citare entità dei moduli.
- **Niente cicli** fra i moduli (`BP136`).
- **La versione è del blueprint, non del modulo**: sul tenant tutti i moduli installati sono alla stessa
  versione. Un modulo aggiunto con una versione più nuova porta a quella versione anche gli altri, e il piano
  lo dice.

## `testData`: i dati di collaudo

Un blueprint si mette a punto su un tenant di prova, e per girare lì porta valori che in produzione non
valgono: la stessa persona in tutti i ruoli, una soglia scelta per far passare il processo da tutti i rami,
il server MCP del tenant di prova, un indirizzo di callback che non esiste ancora. `testData` li dichiara,
uno per voce, con la domanda da fare prima della produzione:

```yaml
testData:
  - key: persone
    what: Membri di tutti i ruoli, owner dei processi e destinatari delle approvazioni
    value: giuseppe.zileni@hevolus.it
    where: [businessRoles, processes.*.owners, orchestrators.comunicazione-investitori.approvazione]
    production: Per ogni ruolo aziendale, quali utenti del tenant ne fanno parte?
  - key: soglia-affidamento
    what: Soglia oltre la quale un fido lo approva il CFO
    value: "50000"
    where: [processes.affidamento-clienti.chiApprova]
    production: Sopra quale importo di fido decide il CFO invece del responsabile credito?
```

| Campo | Significato |
|---|---|
| `key` | Chiave della voce, unica nella sezione. |
| `what` | Che cosa è fittizio, in parole semplici. |
| `value` | Il valore usato in collaudo, così com'è nel manifest. |
| `where` | Dove compare: sezioni, chiavi di entità, campi. Testo libero, serve a chi lo sostituisce. |
| `production` | La domanda da fare alla persona prima della produzione. Obbligatoria. |

Che cosa ne fa il piano:

- **fuori dalla produzione** elenca ogni voce come avviso (`BP141`), così chi approva sa che cosa è finto;
- **in produzione** ogni voce è un errore (`BP140`) e il piano non si applica: si fa la domanda, si scrive il
  valore vero nel manifest e si toglie la voce. Una persona segnaposto riceverebbe i compiti di un cliente vero.

Un valore finto lasciato solo in un commento si perde alla prima copia del manifest; nella sezione viaggia
con la versione, con `promote` e con il catalogo. La skill `xrcopilotlab-blueprint` e la chat dei blueprint
la riempiono mentre scrivono il manifest per un ambiente di prova, e ne fanno le domande prima della produzione.

## `governance`: la governance dei sistemi che il blueprint crea

Un blueprint crea agenti che mandano email, chiamano webhook e usano server MCP. La sezione `governance` fa nascere
con il blueprint le regole che li controllano, i regolamenti che le raggruppano e la loro scheda nella pagina
Governance › Policy › Schede degli agenti, invece di rifarle a mano su ogni tenant (#1635; riallineata ai regolamenti
con #1652, dopo la riunione con il CTO del 26/10/2026):

```yaml
governance:
  models:                                   # regolamenti Hevolus, mai scritti dal blueprint
    - id: uscite-di-rete                     # per tema, o per riferimento: riferimento-gdpr, riferimento-ai-act…
      agents: [istruttoria]                  # a chi si applica; assente = tutti gli agenti
  rules:                                    # regole proprie, con i limiti dell'editor delle regole
    - key: host-ammessi
      name: Webhook solo verso il CRM
      operation: action.webhook
      completes: uscite-di-rete-host-fuori-elenco   # completa la regola Hevolus e ne prende il posto
      if:
        - { attribute: host, operator: not_in, value: [api.crm-cliente.it] }
      then: deny
    - key: no-delete-crm
      name: Niente cancellazioni verso il CRM
      operation: action.webhook              # tool.invoke | action.email | action.webhook | action.script
      agent: istruttoria                     # chiave di un agente o di un agent task; assente = tutti
      if:
        - { attribute: http_method, operator: in, value: [DELETE, PUT] }
      then: deny                             # log | warn | deny
      priority: high                         # low | normal | high
      message: Le cancellazioni nel CRM le fa una persona.
  ruleGroups:                               # regolamenti del blueprint
    - key: credito
      title: Regole del credito
      rules: [no-delete-crm, webhook-delete] # chiavi di governance.rules o id di regole Hevolus
      agents: [istruttoria]
  systems:                                  # la scheda dei suoi agenti, per chiave
    istruttoria:
      purpose: Prepara l'istruttoria della pratica dai documenti caricati.
      classification: internal               # internal | people_facing | high_risk
      alternative: Procedura manuale dell'ufficio crediti.
  publish: true                             # pubblica dopo l'apply (default true)
```

| Campo | Significato |
|---|---|
| `models[].id` | Un regolamento Hevolus: per tema (`perimetro-comunicazioni`, `uscite-di-rete`) o per riferimento (`riferimento-gdpr`, `riferimento-ai-act`, `riferimento-owasp`, `riferimento-soc2`, `riferimento-cis`). Il blueprint **non scrive regolamenti Hevolus**. Che esista sull'ambiente lo dice il preflight (`BP149`). La chiave resta `models` per i manifest già scritti. |
| `models[].agents` | Le chiavi degli agenti o agent task a cui si applica (`BP147`); senza, tutti gli agenti del tenant. |
| `models[].values`, `models[].disabledRules` | **Ritirati** (`BP154`): i regolamenti non hanno parametri, e spegnere una regola Hevolus vale per tutto il tenant — lo decide una persona dalla pagina. Si leggono per dirlo, non si applicano. |
| `rules[]` | Regole proprie del tenant. Si giudicano con **la stessa funzione dell'editor delle regole** (`BP146`): una regola che l'interfaccia rifiuterebbe, il manifest la rifiuta. Il nome prende il prefisso del blueprint. |
| `rules[].agent` | La chiave di un agente o di un agent task del manifest (`BP147`); senza, la regola vale per tutti gli agenti del tenant. Dentro un regolamento conta l'ambito del regolamento. |
| `rules[].if` | Le condizioni, tutte vere insieme: attributo del catalogo, operatore, valore. Senza condizioni la regola vale per ogni azione di quel tipo. |
| `rules[].completes` | L'id di una regola Hevolus «da completare» (vuole un valore del cliente, come i domini ammessi): la regola del manifest ne prende il posto nei regolamenti Hevolus applicati. Senza, il piano dice quali restano da completare (`BP156`); un id che non è una regola Hevolus ferma il piano (`BP157`). |
| `ruleGroups[]` | I regolamenti del blueprint: `key`, `title` (prende il prefisso), `description`, `rules` (chiavi di `governance.rules` o id di regole Hevolus), `agents`, `enabled`. Una regola dentro un regolamento vale dove vale il regolamento; se due ambiti si sovrappongono vince il più largo (`BP157`). |
| `systems.<agente>` | Finalità, classificazione e alternativa dell'agente nella sua scheda. **Il responsabile non si scrive qui**: è una persona del cliente, e si indica dalla scheda dopo l'installazione. |
| `publish` | Pubblica la copia di lavoro del tenant dopo l'apply. Se il tenant ha modifiche non pubblicate che non sono del blueprint, il piano si ferma: pubblicherebbe il lavoro di qualcun altro. |

Che cosa fa il piano (`BP148`–`BP157`):

- un **regolamento Hevolus** si cerca fra quelli dell'ambiente; uno già applicato **a mano** ferma il piano; le sue regole
  da completare che nessuna regola del manifest completa si dicono (`BP156`);
- una **regola** o un **regolamento** con lo stesso nome già sul tenant è una collisione (`BP060`); quelli del blueprint si
  aggiornano sul posto;
- una **scheda** già compilata a mano resta quella del tenant; il piano ricorda di indicare il responsabile;
- se la **governance del tenant è spenta** lo dice (`BP155`): le regole si scrivono e si pubblicano, ma decidono solo dopo
  che una persona la accende da Governance › Stato. **Il blueprint non la accende mai**;
- la **pubblicazione** chiude il piano, e si ferma se la governance del tenant ha modifiche non pubblicate di altri;
- un ambiente **senza governance** lascia fuori la sezione, con un avviso.

Che cosa fa l'apply, con gli stessi endpoint della pagina Governance › Policy:

| Operazione | Che cosa fa | Inventario |
|---|---|---|
| `ApplyGovernanceModel` | applica il regolamento Hevolus, a tutti o agli agenti di `agents` risolti nei loro id | `GovernanceModel` (id del regolamento) |
| `CreateGovernanceRule` / `UpdateGovernanceRule` | crea la regola nella copia di lavoro, con `agent` risolto e `completes` come regola di origine; in un aggiornamento la modifica sul posto | `GovernanceRule` (id della regola) |
| `CreateGovernanceRulebook` / `UpdateGovernanceRulebook` | crea il regolamento, con le chiavi delle regole risolte negli id del run e gli agenti nei loro id; in un aggiornamento lo modifica sul posto | `GovernanceRulebook` (id del regolamento) |
| `DeclareGovernanceSystem` | scrive finalità, classificazione e alternativa; in un aggiornamento tiene il responsabile indicato da una persona | `GovernanceSystem` (id dell'agente) |
| `PublishGovernance` | pubblica la copia di lavoro: le regole entrano in vigore (se la governance del tenant è accesa) | `GovernancePublication` (ultima versione) |

Regolamento Hevolus, scheda e pubblicazione si ripetono a ogni apply (sono idempotenti): in un aggiornamento il run
eredita le loro voci, e riconosciute lì le scelte nuove non arriverebbero sul tenant.

`rollback` e `delete --with-entities` tolgono regole, regolamenti e regolamenti Hevolus applicati dalla copia di lavoro,
svuotano la scheda e alla fine **ripubblicano**, così le regole del blueprint escono davvero dal vigore. Se la
ripubblicazione fallisce, il rollback lo dice fra i fallimenti: si pubblica a mano da Governance › Policy.

**Stato** (26/10/2026): validatore, piano e apply sono pronti sul disegno a regolamenti (#1652). Un apply con la sezione
richiede un'API che abbia la governance (#1579): su un ambiente senza, il piano lascia fuori la sezione (`BP148`).

## `apps`: le app di App Builder del blueprint (#1566)

Le app che usano le entità del blueprint — un cruscotto per un ruolo, un widget per il sito del cliente, una
procedura, una scena 3D — fanno parte del blueprint. I sorgenti stanno in una cartella accanto al manifest e
viaggiano con la versione come la knowledge, sotto `apps/<chiave>/` nell'archivio.

```yaml
apps:
  - key: cruscotto-cup                  # kebab-case, unica: è anche la cartella nell'archivio
    title: Cruscotto dell'operatore CUP # senza prefisso
    description: Posti liberati, verifica dei tempi, tutela e richiamate
    kind: demo                          # demo | product
    template: spa-react                 # spa-react (default) | static-site
    layout: dashboard                   # dashboard | chat | wizard | widget | scene3d
    uses: [copilot-cup, disdetta-riallocazione, percorso-tutela, richiamata-cup]
    source: apps/cruscotto-cup/         # relativa al manifest
    brief: apps/cruscotto-cup/brief.md
  - key: totem-accoglienza              # adottata da un collega
    title: Totem dell'accoglienza
    kind: demo
    layout: scene3d
    uses: [accoglienza-cup]
    source: apps/totem-accoglienza/
    origin:
      env: staging
      company: Hevolus Innovation
      projectId: <id del progetto App Builder>
      createdBy: collega@hevolus.it
      adoptedBy: giuseppe.zileni@hevolus.it
      adoptedAt: 2026-10-27
```

| Campo | Significato |
|---|---|
| `kind` | `demo`: costruita sui dati di collaudo, con passi simulati, per mostrare il blueprint. `product`: la usa il cliente. Si chiede a chi l'ha fatta. |
| `layout` | Il modo di lavorare. `scene3d` è una scena Babylon.js in cui ogni oggetto è un comando: al più **una** fra le app senza `origin` (`BP160`). |
| `uses` | Le chiavi di agenti, orchestratori, processi e agent task che l'app chiama (`BP159`). |
| `source` | La cartella dei sorgenti. Entra tutto tranne `node_modules`, `dist`, `.vite`, `.git` e i `.env` (resta `.env.example`). |
| `origin` | Solo per un'app **adottata**: il progetto d'origine, che resta intatto. In un modello del catalogo niente `company` né `projectId` (`BP164`). |

Le regole:

- **I sorgenti si controllano prima di scrivere** (`validate`, `push`, `catalog publish`): niente che somigli a una
  credenziale, nessun `.env`, nessuna chiamata a XRCopilot dal codice del browser (`BP161`); un id scritto nel
  codice è un avviso (`BP162`), perché sul tenant di destinazione l'entità ha un altro id.
- **Chi copia sceglie le app di demo**: `promote` e `catalog install` chiedono quali portare, con risposta proposta
  tutte (`--demo-apps`, vedi [`cli-reference.md`](cli-reference.md)). Le app `product` viaggiano sempre.
- **Le app non stanno nei moduli**: si scelgono alla copia, non all'apply.
- **L'apply crea ogni app in App Builder**, per ultima: un progetto con il prefisso del blueprint (il nome è
  `title`) e, come snapshot, i sorgenti della versione. Non apre una sessione e non consuma il budget del mese: la
  prima sessione che qualcuno apre riparte da quei file, stesi sopra il template. L'app entra nell'inventario
  (`App`), e `rollback` e `delete` tolgono il progetto con il suo snapshot. Un progetto con una sessione aperta non
  si toglie: va chiuso prima da App Builder.
- **Con App Builder spento sul tenant** le app non si creano e il piano lo dice (`BP165`); il resto si applica.
  Un progetto con lo stesso nome già sul tenant è una collisione (`BP060`).
- **Le app si creano solo in produzione** (`BP169` altrove): App Builder apre le sessioni solo lì. Fuori produzione
  sezione e sorgenti restano nell'archivio e viaggiano con la copia; verso la produzione `promote` e `catalog install`
  chiedono quali app di demo portare (proposta: tutte).
- **Un aggiornamento riscrive un'app già creata solo se nessuno ci ha lavorato.** L'apply confronta il progetto in App
  Builder con i file che aveva scritto:
  - sorgenti uguali a quelli della versione applicata: niente da fare;
  - mai aperta dopo l'apply, oppure aperta senza cambiare i file del blueprint: si aggiorna sul posto (`UpdateApp`);
  - modificata (un file scritto dall'apply è cambiato o tolto): resta com'è (`BP166`). Per sostituirla
    `apply --replace-apps <chiave>`, che prima salva l'export del progetto nell'archivio; per tenere le modifiche si
    riportano nei sorgenti del blueprint e si fa il push di una versione nuova;
  - sessione aperta: non si scrive (`BP167`);
  - progetto tolto a mano: si ricrea (`BP168`).
- **Un'app di demo lasciata all'origine da `promote`** è nel manifest ma non nell'archivio: l'apply non la crea e
  lo dice. Lo stesso per una versione scritta senza la cartella dell'app (un push fatto lontano dai sorgenti).

Come si costruisce un'app e come si adotta quella di un collega: skill `xrcopilotlab-blueprint-app`.

## Codici dei rilievi

| Intervallo | Area |
|---|---|
| `BP001`–`BP007` | Intestazione: tag, identificativo, versione, tenant, topic ambiguo |
| `BP010`–`BP016` | Chiavi e nomi: mancanti, duplicati, già prefissati; modello dell'agente non dichiarato (`BP015`); descrizione più larga della colonna SQL che la riceve — 500 caratteri per topic, profilo e agente, 1000 per orchestratore, ruolo e agent task (`BP016`, errore: l'apply si fermerebbe sul tenant a entità già create) |
| `BP020`–`BP023` | Riferimenti fra sezioni e alternative esclusive |
| `BP030`–`BP033` | Processi: specifica non valida, ruolo, agent task o sotto-processo sconosciuto |
| `BP040`–`BP048` | Connessioni e server MCP; connessione verso il webhook di un processo (`BP045`); segreto scritto in chiaro o di un altro tag (`BP047`); `config` di una connessione mescolato ai campi del webhook o usato da un server MCP (`BP048`) |
| `BP024`–`BP029` | Agent task: trigger, schedulazione, code di uscita; file di knowledge inutilizzabile (`BP027`); partizionamento dei profili (`BP028`); cron più fitto della quota giornaliera (`BP029`) |
| `BP050`–`BP052` | Risorse esterne, ed equivalenti nativi |
| `BP060`–`BP065` | Preflight: collisione di nome, skill, utente, segreto o topic mancante; modello fuori catalogo (`BP065`) |
| `BP070` | Sezione dichiarata ma non ancora applicata |
| `BP090`–`BP092` | Orchestratori: tipo di step, campi, grafo |
| `BP132`–`BP138` | Moduli: chiavi, entità elencate, appartenenza unica, dipendenze chiuse, cicli, scelta con `--modules`, rollback di un modulo richiesto |
| `BP139`–`BP141` | Dati di collaudo: voce incompleta, dato di collaudo in produzione (errore), elenco fuori dalla produzione (avviso) |
| `BP145`–`BP157` | Governance: sezione malformata, regola che l'editor rifiuterebbe, agente che il manifest non dichiara; nel piano governance non letta, regolamento che l'ambiente non ha, regolamento applicato a mano, modifiche non pubblicate di altri, scheda già compilata, responsabile da indicare, valori ritirati, governance del tenant spenta, regola da completare, regolamento o `completes` che non vanno |
