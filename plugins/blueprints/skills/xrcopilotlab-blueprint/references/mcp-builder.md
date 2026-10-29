# Un MCP sopra una fonte HTTP — il ciclo connessione → MCP → agente

Quando un blueprint ha bisogno di una fonte esterna che ancora non è collegata, la strada non è
scrivere un servizio: è **MCP Builder**, che costruisce un server dichiarativo sopra una connessione
HTTP senza scrivere codice.

> Procedura verificata end-to-end il **9 settembre 2026** costruendo il server VIES per
> l'assessment di Confindustria Como: sei casi di prova, cinque associati reali più una partita IVA
> sintetica, tutti con l'esito atteso. Quanto segue è quel percorso, compresi l'errore in cui si
> inciampa e il modo di evitarlo.

## Il pattern: una fonte, un MCP, un tool, un agente

```
Connessione HTTP  →  MCP con UN tool  →  Agente dedicato  →  (orchestrazione)
fonte pubblica       input tipizzati      traduce il JSON     gli agenti-fonte
o autenticata        output JSON grezzo   e governa i gap     confluiscono in parallelo
```

**Un tool per fonte, e nessuna normalizzazione nel tool.** Il tool restituisce il JSON della fonte
così com'è; tradurlo in linguaggio naturale, dichiarare i buchi e citare la provenienza è compito
dell'**agente**. Tenere le due cose separate è ciò che rende sia il tool sia il prompt riusabili: il
primo cambia quando cambia l'API, il secondo quando cambia ciò che serve dire all'utente.

Questo è anche il motivo della convenzione «un MCP per agente»: con una fonte per agente, ogni campo
arricchito porta con sé da dove viene, e quando una risposta è sbagliata si sa quale agente e quale
fonte l'hanno prodotta.

## Le tre sezioni della piattaforma, nell'ordine

### 1. Connessioni — registrare la fonte

| Campo | Esempio VIES |
|---|---|
| Nome | `vies-commissione-europea` |
| Provider | HTTP Webhook |
| baseUrl | `https://ec.europa.eu/taxation_customs/vies/rest-api` |
| Authentication | No Authentication |

**Annotare quanto path è già dentro il `baseUrl`.** Qui il `/rest-api` finale ne fa parte, e da solo
decide il passo successivo. È il prerequisito del MCP: senza connessione non c'è niente su cui
costruire.

Se la fonte richiede una credenziale, il valore **non si scrive nel manifest**: si cita una chiave
`Blueprints:Secrets:<TAG>:<nome>` e si imposta con `xrcopilotlab-bp secrets set`.

### 2. MCP Builder — generare il server con MCP Buddy

Si descrive a MCP Buddy la chiamata da fare, e lui genera server e tool. Il testo da adattare per
ogni nuova fonte:

```
Voglio collegare il servizio <NOME FONTE> (<cosa fa>).
<Autenticazione: nessuna | chiave | OAuth>.

Crea un tool chiamato "<nome_tool>" con questa chiamata:
Metodo: POST
URL: https://<host>/<path completo>
Content-Type: application/json
Body:
{ "campo": "{{parametro}}" }

Parametri del tool:
- <parametro> (string, obbligatorio): <significato, con un esempio reale>

La risposta è JSON e contiene tra gli altri i campi: <elenco con i tipi>.
Non serve mappare/filtrare la risposta: va bene restituire il JSON completo così com'è.

Descrizione del tool per l'agente che lo userà:
"<cosa verifica DAVVERO la fonte, e cosa NON verifica>"
```

Due righe di quel testo valgono più delle altre.

**L'esempio reale nel parametro.** Per VIES: «partita IVA SENZA il prefisso paese, es.
`00159560366`». Un parametro descritto in astratto produce chiamate sbagliate che sembrano problemi
della fonte.

**La descrizione del tool dice anche cosa la fonte NON fa.** Quella di VIES è:

> «Verifica se una partita IVA è abilitata alle operazioni intracomunitarie tramite VIES. NON
> verifica l'esistenza dell'impresa né lo stato di attività: una partita IVA valida ma non abilitata
> al VIES risulta correttamente "non abilitata" qui, il che non significa che l'azienda non esista.»

La legge il modello prima di decidere se chiamare lo strumento: è lì che si previene l'errore di
interpretazione, non nel prompt dell'agente — dove pure va ripetuto.

#### L'errore in cui si inciampa: 404 per path duplicato

Il `pathTemplate` generato ripete il path che sta già nel `baseUrl` della connessione, e la chiamata
risponde **404**.

```
baseUrl        https://ec.europa.eu/taxation_customs/vies/rest-api
pathTemplate   /taxation_customs/vies/rest-api/check-vat-number   ← sbagliato, 404
pathTemplate   /check-vat-number                                   ← corretto
```

**Regola: se il `baseUrl` include già un path, il `pathTemplate` del tool contiene solo la parte
rimanente.** Il 404 non dice questo, e manda a cercare nel posto sbagliato: si controlla qui per
primo.

### 3. Agenti — collegare il MCP e scrivere il prompt

Si parte da un **Agente Base** e si collega il server da *Aggiunta conoscenza → MCP*.

**Le istruzioni d'uso non si ricopiano più su ogni agente.** Dalla v3.2.0 il server porta un
`systemPrompt` — quando chiamare quale strumento e in che ordine, i parametri delicati, come si
leggono le risposte, cosa non copre — e quel testo raggiunge ogni agente a cui il server viene
collegato. Nel manifest si scrive una volta sul server, con `promptMode` a dire se va in coda al
prompt dell'agente (`append`, il default), se lo sostituisce (`replace`) o se resta solo sul server
(`skip`). Le regole qui sotto restano valide: cambia solo **dove** si scrivono — sul server quando
riguardano quegli strumenti, sull'agente quando riguardano il suo mestiere.

**Temperature 0.1–0.2.** È una trasformazione deterministica da JSON a linguaggio naturale, non
scrittura creativa.

Le regole che fanno la differenza in un prompt di agente-fonte — valgono per qualunque fonte, non
solo VIES:

- **un campo con un valore convenzionale di «vuoto» è assente.** VIES restituisce `"---"`, non
  `null`: riportarlo come dato reale è l'errore più facile;
- **un errore di servizio non è un esito negativo.** `MS_UNAVAILABLE`, `TIMEOUT`,
  `SERVICE_UNAVAILABLE` significano «la fonte non ha risposto», mai «il dato non risulta». Si
  dichiara il gap e si invita a riprovare;
- **un esito negativo vale solo per ciò che la fonte misura.** `valid: false` su VIES non dice che
  l'impresa non esista: dice che non è abilitata alle operazioni intracomunitarie, e la precisazione
  va nella risposta;
- **il dato si riporta come arriva**, formattazioni storiche comprese. VIES ha restituito
  `POSTE ITALIANE SPA !!SPA`: correggerlo sarebbe già interpretarlo;
- **fonte e data della verifica sempre citate**, JSON grezzo mai mostrato all'utente;
- **fuori perimetro si dichiara.** Se chiedono fatturato, soci o bilanci a un agente VIES, la
  risposta è che quello strumento non li ha — non un tentativo.

### 4. Validare prima di dichiararlo fatto

**Cinque casi reali più uno negativo.** Su VIES: cinque associati presi dall'estrazione del cliente
e una partita IVA sintetica, per vedere come viene gestito il gap. Sei su sei con l'esito atteso, e
nessuna invenzione sul caso negativo — che è la prova vera, perché è lì che un agente mal istruito
inventa.

## Come si scrive nel manifest

Un MCP costruito con MCP Builder **si dichiara**: i suoi tool sono già `{nome, metodo, path}` sopra
una connessione, cioè esattamente ciò che il formato prevede. L'esempio VIES, per intero:

```yaml
connections:
  - key: vies
    name: vies-commissione-europea
    provider: webhook
    baseUrl: https://ec.europa.eu/taxation_customs/vies/rest-api
    # fonte pubblica e gratuita: nessuna autenticazione, quindi nessun segreto da gestire

mcpServers:
  - key: vies
    kind: builder
    name: VIES-Registro-Imprese-MCP
    description: Verifica l'abilitazione di una partita IVA alle operazioni intracomunitarie.
    connection: vies
    tools:
      - name: vies_check_vat
        method: POST
        path: /check-vat-number        # solo la parte non già contenuta nel baseUrl
        description: >
          Verifica se una partita IVA è abilitata alle operazioni intracomunitarie tramite VIES.
          NON verifica l'esistenza dell'impresa né lo stato di attività.
        parameters:
          countryCode: Codice paese ISO 3166-1 alpha-2, es. IT
          vatNumber: Partita IVA senza il prefisso paese, es. 00159560366
        required: [countryCode, vatNumber]
        body: '{"countryCode":"{{countryCode}}","vatNumber":"{{vatNumber}}"}'
    systemPrompt: |
      Un `"---"` è un campo assente, non un dato. `valid: false` dice che la partita IVA non è
      abilitata alle operazioni intracomunitarie, non che l'impresa non esista. MS_UNAVAILABLE e
      TIMEOUT vogliono dire che la fonte non ha risposto: si dichiara il gap e si invita a riprovare.
      Questo strumento non conosce fatturato, soci né bilanci.
    promptMode: append
    testTool: vies_check_vat

agents:
  - key: vies
    name: AgenteVIES
    temperature: 0.1
    mcp: [vies]
    systemMessage: |
      ...le regole sui gap, sul perimetro e sulla citazione della fonte...
```

**La CLI ora crea questa sezione per intero**: la connessione, il server, la prova di un tool e la
pubblicazione nel catalogo del tenant, più il collegamento all'agente che lo userà. Il piano le
elenca come qualsiasi altra operazione, e si approvano insieme al resto.

Tre cose da sapere scrivendo i tool:

- **il `systemPrompt` del server è il posto giusto per le regole sui suoi dati** — i gap, il
  perimetro, come si leggono gli esiti. Nel `systemMessage` dell'agente resta ciò che riguarda il
  suo mestiere. Prima quelle regole andavano ripetute su ogni agente che usava la fonte, e
  divergevano alla prima modifica;

- **il valore di un parametro è la sua descrizione**, non il suo tipo: `vatNumber: Partita IVA senza
  prefisso` è ciò che il modello legge per decidere come chiamare il tool. Per il controllo pieno si
  scrive l'oggetto, `{ type: integer, description: ... }`;
- **`testTool` senza `testArguments` non prova niente**, e infatti la prova non viene nemmeno
  messa nel piano. Provare un tool prima di pubblicare è l'unico modo per accorgersi adesso di un
  path sbagliato: dopo, il sintomo è un agente che «non trova niente».

**Quando invece il MCP va scritto come servizio** — perché la fonte non è HTTP, richiede logica di
trasformazione, o custodisce un token per ogni entità autorizzata come nel caso di LinkedIn — non è
dichiarabile in questa forma: `kind: external` pretende l'URL di un server già ospitato. In quel
caso si annota nella `description` dell'agente che lo userà e si mette fra i passi manuali del piano
di attivazione.

**Quando il server è già nel catalogo del tenant** — `web-search`, un server registrato a mano,
uno creato da un altro blueprint — non si dichiara come `builder` né come `external`, e non si
collega dalla UI: si cita.

```yaml
mcpServers:
  - key: web-search
    kind: existing
    name: Web Search          # il nome esatto del catalogo, senza prefisso
    # mcpId: …                # solo se due server hanno lo stesso nome
agents:
  - key: bandi
    mcp: [web-search]
```

Il blueprint non lo crea e non lo mette in inventario: rollback e delete non lo toccano, e del
blueprint resta solo il collegamento. Un collegamento che c'era già viene adottato, non rifatto.
Se il nome non è nel catalogo il piano si ferma con `BP069` ed elenca i server che ci sono: è il
modo più rapido per scoprire come si chiama davvero.

## Le chiamate che rispondono senza corpo: `responseFormat: text`

`sendMail`, `reply` e molte POST rispondono **202 senza corpo**. Con il formato di default (`json`)
il parse fallisce e il tool risulta in errore anche se l'azione è riuscita — la mail parte lo
stesso, e l'agente crede di no. Su quei tool si dichiara `responseFormat: text`. Emerso il
16/09/2026 dalla suite di flusso di Studio Polis.

## Il `transform`: JavaScript sulla risposta, con tre regole

Un tool può portare un `transform`: il **corpo di una funzione** che riceve la risposta del sistema
esterno come `input` — non `data` — e restituisce ciò che l'agente deve vedere. Gira nel sandbox
QuickJS del builder (64 KB di sorgente, 5 secondi): niente `atob`, `fetch`, `Buffer`, librerie.
Tre regole: (1) `return` esplicito; (2) solo JavaScript puro — una decodifica base64 o
quoted-printable si scrive a mano, e ci sta (il tool `leggi_eml` di Studio Polis scompone un
`.eml` di una busta PEC in ~200 righe); (3) prima di applicare, provare il corpo in `node` con un
`new Function("input", corpo)` su una risposta vera: il sandbox non dà stack trace utili, e un
`ReferenceError` costa un rollback e un apply.

## Google (calendario, Drive, posta): non si costruisce, si copia il nativo

MCP Builder non è la strada per Google a nome di una persona. Le sue autenticazioni sono quelle che una
macchina può dare da sola (`None`, `Bearer`, `Basic`, `CustomHeaders`, `OAuth2ClientCredentials`), e il
calendario o la posta di un account Google chiedono il **consenso di quella persona**: Google non
concede il client credentials su quelle API, e un token `Bearer` scade in un'ora.

La piattaforma ha già i server MCP nativi (Google Calendar, Drive, GMail) con il flusso OAuth per
utente. Il blueprint ne crea per il tenant una **copia**, con l'app Google del cliente:

```yaml
mcpServers:
  - key: calendario
    kind: native
    name: Google Calendar
    service: calendar                       # calendar | drive | gmail
    clientId: Blueprints:Secrets:STUDIOPOLIS:google-client-id
    clientSecret: Blueprints:Secrets:STUDIOPOLIS:google-client-secret
agents:
  - key: riscontro
    name: Riscontro
    systemMessage: …
    mcp: [calendario]
```

1. **Il cliente crea l'app OAuth** nel suo Google Cloud: passi qui sotto. Non è qualcosa che il
   blueprint o la CLI possano fare per lui, e va detto **prima** dell'apply: il piano lo ricorda con
   l'avviso `BP112`, che porta i passi e l'URI dell'ambiente.
2. **I segreti** `google-client-id` e `google-client-secret` si impostano con `secrets set`, per
   tenant, nel terminale di chi ha i ruoli (mai in chat: il valore non si maneggia).
3. **`apply`** crea la copia nel catalogo del tenant e la riga OAuth «da autorizzare». Se i segreti
   mancano la riga nasce vuota e il piano avvisa (`BP063`), come per le connessioni.
4. **`mcp authorize calendario --tag <TAG>`** stampa il link di consenso Google, attende che la
   piattaforma registri l'autorizzazione e lo riferisce (exit 0). La persona accede con **il suo
   account Google**; la CLI non vede password né token. Se scade l'attesa (exit 5) il link resta
   valido.
5. **Finché non è autorizzato** l'agente che lo usa non legge niente: il prompt dell'agente deve dire
   di dichiarare la fonte «non disponibile» e proseguire sulle altre, non di insistere.
6. **Rollback e delete** smontano la riga OAuth e la copia nel catalogo del tenant. Il server nativo
   di piattaforma non si tocca mai.

### L'app OAuth Google del cliente, passo per passo

Da dare all'utente **ogni volta** che il manifest ha un server `native`, prima dell'apply. Li fa chi
amministra il Google Cloud del cliente, con il suo account:

1. **console.cloud.google.com** › selezionare (o creare) il progetto del cliente.
2. **API e servizi › Libreria** › abilitare la API del servizio:

   | `service` | API da abilitare | Scope che il server chiede |
   |---|---|---|
   | `drive` | Google Drive API | `https://www.googleapis.com/auth/drive` |
   | `gmail` | Gmail API | `https://www.googleapis.com/auth/gmail.modify` |
   | `calendar` | Google Calendar API | `https://www.googleapis.com/auth/calendar` |

3. **API e servizi › Schermata consenso OAuth**: tipo «Interno» se gli account che autorizzeranno sono
   del Workspace del cliente; altrimenti «Esterno», con quegli account fra gli **utenti di test**
   (finché l'app non è verificata da Google, gli altri vengono rifiutati). Aggiungere lo scope.
4. **API e servizi › Credenziali › Crea credenziali › ID client OAuth**, tipo **«Applicazione web»**.
5. **URI di reindirizzamento autorizzati** — quello dell'ambiente su cui si applica, identico, senza
   `/` finale (se la stessa app serve a più ambienti, si aggiungono tutti):

   | Ambiente | URI di reindirizzamento |
   |---|---|
   | staging | `https://func-xrcopilotlab-staging-01.azurewebsites.net/api/auth/google/callback` |
   | produzione | `https://func-xrcopilotlab-prod-01.azurewebsites.net/api/auth/google/callback` |

   È `<OAuthCallbackBaseUrl>/auth/google/callback`, con `OAuthCallbackBaseUrl` dell'App Configuration
   (etichetta `api`): se la tabella invecchia, comanda l'URI che stampano il piano (`BP112`) e
   `mcp authorize`. **Non** è lo `/oauth/callback` della Web, che serve alle connessioni OAuth 2.1 PKCE.
6. Copiare **ID client** e **secret** nei due segreti del manifest con `secrets set`, nel terminale di
   chi ha i ruoli. Mai in chat.
7. Dopo l'apply, `mcp authorize <chiave> --tag <TAG>`: il link si **copia intero e si incolla** nel
   browser. Cliccato nel terminale si spezza al `|` dello `state`.

Due errori che si incontrano, e cosa vogliono dire:

| Sintomo | Causa |
|---|---|
| `redirect_uri_mismatch` sulla pagina di Google | L'URI dell'ambiente non è fra quelli autorizzati dell'app (passo 5) |
| «McpOauthId could not be extracted from state» sulla pagina della piattaforma | L'URI di reindirizzamento è stato aperto a mano (lo chiama Google, non una persona), oppure il link di consenso è arrivato a Google spezzato |
| `access_denied` / «app non verificata» | Schermata di consenso «Esterno» e account non fra gli utenti di test (passo 3) |

Se ne esistono già due con lo stesso nome nel catalogo di piattaforma, la causa è un duplicato da
ripulire (migrazione 265): non si risolve con `mcpId` nel manifest.

**Perché non un server Google di terzi.** Registrato a mano con «OAuth 2.0 (Google Auth Code)», il
token arriva al server come **argomento dei tool** (`oauth_client_id`, `oauth_access_token`…), non come
`Authorization: Bearer`: lo capiscono solo i nostri server nativi. Un server esterno risponde
«autenticazione non disponibile» anche con l'health check verde e i tool visibili.

**PDF e Word su Drive.** Se l'agente deve leggerne il contenuto, la strada sicura è la knowledge: i
file nel topic, indicizzati da un profilo ([`knowledge.md`](knowledge.md)). Il server MCP serve a
cercare e a elencare.

## Server MCP remoti con OAuth: cosa si collega e cosa no

Un server MCP **già ospitato** (`kind: external`) che chiede OAuth a nome di una persona ricade in uno
di due casi, e va capito **prima** di scrivere il manifest:

| Il server… | Si collega? |
|---|---|
| pubblica i metadati OAuth e accetta la **registrazione dinamica del client** (RFC 7591) | Sì, ma **dalla UI**: «OAuth 2.1 + PKCE» sul server MCP. Il manifest non lo esprime: `external` non porta autenticazione. |
| chiede un **client OAuth statico** (client id e secret creati a mano dal provider, senza registrazione dinamica) | **No**, né dalla UI né dal blueprint. Sintomo in UI: «Failed to initiate the OAuth flow». |

Il secondo caso la piattaforma lo sa fare solo sulle **Connessioni** («OAuth 2.1 + PKCE (Generic)»),
non sui server MCP. Dirlo all'utente prima di applicare, senza scrivere un `kind: external` che
nascerebbe senza credenziali: le alternative sono `kind: native` se è Google, MCP Builder se la fonte
è un'API HTTP con un'autenticazione che una macchina può dare da sola, altrimenti un server da
scrivere e ospitare.

## Posta, calendario, file: Microsoft 365 si collega così

Quando la richiesta nomina una **casella**, un **calendario**, dei **contatti** o dei **file** su
Microsoft 365 — «deve leggere le mail che arrivano», «deve scrivere sul calendario comune», «deve
mandare la risposta con l'allegato» — la risposta è sempre la stessa forma, e va proposta senza
farsela chiedere:

1. una `connections` verso `https://graph.microsoft.com/v1.0` con `kind: OAuth2ClientCredentials`;
2. un `mcpServers` con `kind: builder` che espone **solo i tool che servono a quel cliente**;
3. gli agenti che li useranno, con `mcp: [<chiave>]`.

### La casella è una VARIABILE, non un parametro

```yaml
variables:
  mailbox: test@hevolus.it          # fissata qui: il modello non la vede

tools:
  - name: posta_in_arrivo
    path: /users/{{mailbox}}/mailFolders/inbox/messages    # sostituita alla creazione
    parameters:
      da: Momento da cui guardare, ISO 8601                # questo sì, lo sceglie il modello
```

Non è una questione di comodità. Un permesso applicativo `Mail.Read` vale su **tutto il tenant**:
se la casella fosse un parametro del tool, sarebbe l'agente a decidere di chi leggere la posta. Una
variabile è fissata alla creazione del server e nel prompt non compare mai.

Il validatore segnala un `{{segnaposto}}` che non è né una variabile né un parametro: resterebbe
nell'URL così com'è, e il sintomo sarebbe un 404 che sembra «l'endpoint non esiste».

### La domanda da fare per prima: di che tipo è l'account

«Microsoft» sono tre cose diverse, e sbagliarla manda a costruire l'impianto sbagliato:

- **Microsoft 365 di un'altra azienda** (la casella è nel tenant del cliente, come per Studio
  Polis) → permessi **applicativi** di un'app nostra multi-tenant, assegnati **ristretti alla
  casella** in Exchange con RBAC for Applications. È l'unico caso in cui servono: due tenant che
  devono parlarsi, e nessuno del cliente che autorizzi da dentro XRCopilotLab;
- **Microsoft 365 di chi usa l'agente** (una persona di Hevolus, la propria casella o il proprio
  calendario) → OAuth **delegato**, vedi [«La casella è di chi usa l'agente»](#la-casella-è-di-chi-usa-lagente-oauth-delegato).
  Niente permessi applicativi: valgono sul tenant intero e qui non servono;
- **account Microsoft personale** (`@outlook.com`, `@hotmail.com`, `@live.com`) → **non ha un
  tenant**, quindi le credenziali client non funzionano affatto. Serve OAuth **delegato**,
  autorizzato una volta da una persona con il pulsante *Autorizza* della pagina Connections.

E prima ancora: **la casella è davvero su un'API?** IMAP non è HTTP, e un connettore dichiarativo
non lo può raggiungere. Se il cliente ha la posta su un hosting qualunque, la risposta non è questa
pagina — vedi la issue sull'ingresso da una casella qualsiasi.

Chiederlo costa una riga; assumerlo costa la riprogettazione di tutto lo scenario.

### La casella è di chi usa l'agente: OAuth delegato

Il caso tipico: una persona di Hevolus si costruisce un agente che legge **il suo** calendario e
gli dice gli slot liberi. Qui i permessi applicativi sono sbagliati per costruzione — valgono su
ogni casella del tenant e vanno poi ristretti a mano — mentre basta che **lei** autorizzi la
piattaforma a leggere **la sua** casella.

La piattaforma lo fa già: connessione **`OAuth2PkceGeneric`** (OAuth 2.1 + PKCE, «Generic» nella
pagina Connections), su cui un server MCP Builder chiama Graph con il token della persona.

| | Valore |
|---|---|
| Authorization endpoint | `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize` |
| Token endpoint | `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token` |
| Client id | dell'app registration **delegata** dell'AI Team (una sola per tutti, nel tenant Hevolus) |
| Scope | `offline_access Calendars.ReadBasic` — il minimo per `getSchedule`; esclude corpo e allegati degli eventi, non l'oggetto |
| Path del tool | `POST /me/calendar/getSchedule` — **`/me`**, mai `/users/{{mailbox}}` |

Che cosa cambia rispetto alle credenziali applicative:

- il token vede **solo** la casella di chi ha autorizzato: non c'è niente da restringere in
  Exchange, e nessun Exchange Administrator nel giro;
- i permessi delegati a basso impatto come `Calendars.ReadBasic` li consente la persona stessa, se
  la policy di consenso del tenant lo permette; altrimenti è un consenso amministratore **delegato**,
  che non dà accesso a nessuna casella in più;
- l'app registration è **una per tutta Hevolus** e la possiede l'AI Team; ha come reindirizzamento
  l'URI della piattaforma (`OAuthPkce:RedirectUri` dell'ambiente) ed è un client pubblico: PKCE
  non chiede un client secret, quindi non c'è niente che scade;
- per dire gli slot liberi il tool è `getSchedule`, che restituisce libero/occupato: un tool su
  `calendarView` restituirebbe anche l'oggetto delle riunioni, e non serve;
- se la persona lascia l'azienda o revoca il consenso, l'agente smette di leggere, ed è giusto.

**Il manifest non sa ancora dichiararla**: `auth.kind` accetta `OAuth2ClientCredentials` ma non
`OAuth2PkceGeneric` (issue #1514). Finché non c'è, la connessione e il server si creano dalla UI e il manifest
collega il server con `kind: existing` (regola 7-bis). Va scritto fra i passi manuali del piano,
con chi li fa: la connessione l'AI Team, il pulsante *Autorizza* la persona.

### La seconda domanda: serve davvero un'app, e per fare cosa

**Prenotazioni sul proprio calendario** — «i clienti scelgono uno slot e prenotano» — sono
Microsoft Bookings («Bookings with me», dentro Outlook): disponibilità letta dal calendario, durata,
orari, riunione Teams, domande al prenotante. Se lo scenario è questo, la proposta è Bookings e
l'agente si limita a dare il link: niente app registration, niente consenso, niente segreti.

#### Come si usa Bookings: i passi da dare all'utente

Si danno così come sono, adattando durata, orari e domande a ciò che l'utente ha detto. Li fa lui,
dal suo Outlook, in una decina di minuti:

1. **Outlook sul web → Calendario → Bookings with me** (oppure `outlook.office.com/bookwithme`).
2. **Crea un tipo di riunione**:
   - un nome che il cliente capisca («Call conoscitiva con Hevolus») e la **durata** (es. 30 minuti);
   - la **disponibilità**: giorni e fascia oraria (es. lun–ven 09:00–18:00), più un margine fra
     un appuntamento e l'altro e il preavviso minimo;
   - **Riunione online: Teams**, così il link arriva da solo nell'invito;
   - **visibilità Pubblica** se deve prenotare anche chi è fuori dall'azienda, privata se il link
     va dato solo a chi si sceglie.
3. **Domande al prenotante**: nome ed email ci sono già; si aggiungono quelle che servono
   (cognome, azienda, tema dell'incontro), segnando quali sono obbligatorie.
4. **Informativa privacy**: nella descrizione del tipo di riunione va il link all'informativa
   dell'azienda, perché Bookings raccoglie dati di persone esterne.
5. **Copiare il link pubblico** della pagina: è ciò che l'agente darà, o che l'utente mette in firma.

Che cosa dire anche, perché è la domanda successiva:

- chi prenota vede **solo libero o occupato**, mai l'oggetto delle riunioni;
- l'invito arriva a entrambi; se il cliente annulla o sposta, il calendario si aggiorna da solo;
- se «Bookings with me» non compare in Outlook, va **abilitato** per quell'account: lo fa
  **DevOps**, ed è un'abilitazione, non un permesso. Non è un motivo per tornare all'app registration.

#### L'agente, quando c'è

Se l'utente vuole anche un agente in XRCopilotLab, il manifest ha **un agente senza `mcp:`**,
**nessuna connessione** e **nessun segreto**. Il link Bookings va nel system message, insieme a
queste regole:

- quando qualcuno chiede un incontro, proporre il link e dire che lì sceglie l'orario;
- non promettere mai un orario preciso e non dire mai quando l'utente è occupato: l'agente non lo sa;
- non raccogliere in chat i dati che Bookings chiede già: duplicarli vuol dire conservarli due volte.

Quando un'app serve, **i permessi si ricavano dai tool**, uno per uno:

| Il tool fa | Endpoint | Ruolo applicativo in Exchange |
|---|---|---|
| slot liberi / occupati | `POST /users/{{mailbox}}/calendar/getSchedule` | `Application Calendars.Read` |
| legge gli eventi (oggetto, partecipanti) | `GET /users/{{mailbox}}/calendarView` | `Application Calendars.Read` |
| crea o sposta un evento | `POST /users/{{mailbox}}/events` | `Application Calendars.ReadWrite` |
| legge la posta | `GET /users/{{mailbox}}/messages` | `Application Mail.Read` |
| invia, anche con allegati | `POST /users/{{mailbox}}/sendMail` | `Application Mail.Send` |

Un permesso senza un tool che lo usa non si chiede. «Leggere il calendario per dare gli slot
liberi» è la prima riga e basta: `Calendars.ReadWrite` lì è un permesso di scrittura su un agente
che non scrive.

### Una app per tutti i clienti, non una per cliente

_Da qui in giù vale per la casella **di un'altra azienda**: due tenant, permessi applicativi._

L'app si crea **multi-tenant** (`--sign-in-audience AzureADMultipleOrgs`) anche quando si comincia
con una casella interna di collaudo: è la stessa app che poi il cliente abiliterà sul proprio
tenant. Creata single-tenant, al primo cliente va rifatta.

Il modello cambia anche cosa si chiede al cliente: con il multi-tenant sono un riferimento all'app,
un indirizzo e un'assegnazione ristretta — nessun segreto che viaggia fra due aziende.

### I passi che il blueprint NON può fare

Procedura completa, con i comandi, chi serve per ciascun passo e il testo da inoltrare al cliente:
[`references/microsoft365-setup.md`](microsoft365-setup.md).


Il blueprint crea connessione, server, tool e collegamento agli agenti. I permessi no — vivono in
Entra e in Exchange. Vanno **riportati all'utente come passi da fare prima di applicare**, ciascuno
con il suo esecutore:

1. **registrazione applicativa**, **senza** permessi Graph dichiarati in Entra (AI Team, che ne
   resta owner);
2. ⚠️ **permesso ristretto alla casella con RBAC for Applications** in Exchange Online (Exchange
   Administrator): una *management scope* che contiene solo quella casella e un'assegnazione del
   ruolo applicativo che serve, e nessun altro:
   ```powershell
   New-ServicePrincipal -AppId <appId> -ObjectId <objectId del service principal> -DisplayName "<nome>"
   New-ManagementScope -Name "<nome>-casella" -RecipientRestrictionFilter "PrimarySmtpAddress -eq '<casella>'"
   New-ManagementRoleAssignment -App <appId> -Role "Application Calendars.Read" -CustomResourceScope "<nome>-casella"
   ```
   Il permesso **nasce già ristretto**: non c'è un consenso tenant-wide e quindi non c'è la
   finestra in cui l'app legge le caselle di tutti. Per questo **non si dà il consenso
   amministratore in Entra**: i permessi di Entra e quelli di Exchange si sommano, e un consenso
   tenant-wide renderebbe inutile la restrizione;
3. la **credenziale** dell'app — certificato se la piattaforma lo supporta, altrimenti client
   secret con scadenza annotata (AI Team);
4. i **segreti**, citati per nome nel manifest e impostati con `secrets set` — client id e client
   secret. Il loro valore non si chiede e non si scrive mai (AI Team).

L'**Application Access Policy** (`New-ApplicationAccessPolicy`) è il meccanismo legacy: Microsoft
chiede di non crearne di nuove. Resta solo per le app già consentite in Entra prima di questo
cambio, finché non si migrano.

### Quei passi non sono un blocco unico: verificare chi può fare cosa

I passi hanno livelli di privilegio diversi, e trattarli come una cosa sola manda a chiedere a un
amministratore cose che non servono — o peggio, a chiedere privilegi per chi non dovrebbe averli.

```bash
# Chi sta lavorando può creare registrazioni applicative?
az rest --method GET --url "https://graph.microsoft.com/v1.0/policies/authorizationPolicy" \
  --query "defaultUserRolePermissions.allowedToCreateApps"
```

Con `allowedToCreateApps: true` il passo 1 lo può fare l'assistente, creando l'app **senza
permessi richiesti**: in quello stato non accede a niente.

```bash
az ad app create --display-name "<nome>" --sign-in-audience AzureADMultipleOrgs
az ad sp create --id <appId>     # serve a Exchange come riferimento: non concede nulla
```

**Ma chi crea l'app ne diventa owner**, e un owner può generare nuove credenziali, cioè agire come
l'app. Se l'utenza con cui gira l'assistente non è dell'AI Team, non si crea l'app: si mette il
passo nella consegna, con l'AI Team come esecutore. Se è già stata creata così, la consegna dice di
aggiungere l'AI Team come owner e togliere l'utente:

```bash
az ad app owner list --id <appId> --query "[].userPrincipalName" -o tsv
```

**Il client secret** lo genera l'owner — dal portale o da `az ad app credential reset` — fuori
dalla sessione, perché il valore viene stampato e stampato qui finirebbe nella trascrizione.

Lo stato dell'assegnazione si controlla invece di darlo per fatto. Il test di Exchange salta la
cache, che per l'app vera dura da 30 minuti a 2 ore: un 403 subito dopo l'assegnazione non è
ancora un errore.

```powershell
Test-ServicePrincipalAuthorization -Identity <appId> -Resource <casella>         # InScope: True
Test-ServicePrincipalAuthorization -Identity <appId> -Resource <un'altra casella> # InScope: False
```

Le due verifiche insieme sono la prova: la prima dice che funziona, la seconda che è **ristretta**.

**Gli allegati non richiedono permessi sui file**: viaggiano dentro la chiamata di invio, come
contenuto codificato in base64. Chiedere `Files.Read.All` per mandare un allegato significa
chiedere accesso a tutto SharePoint per niente — e quel permesso Exchange non lo restringe.

### Il tool di prova si sceglie in sola lettura

`testTool` viene esercitato durante l'apply. Su Microsoft 365 si punta a una lettura su una finestra
vuota fra due date del passato: `getSchedule` per un agente che legge solo la disponibilità,
`cerca_eventi` se il server ha già un tool che legge gli eventi. Esercita credenziale, permesso e
restrizione senza lasciare traccia. Un tool di prova che scrivesse lascerebbe un impegno in agenda
a ogni applicazione.

### Quando l'agente parla con chi non è il titolare della casella

Un agente sul calendario di Mario usato **da Mario** e lo stesso agente in una chat con **clienti
o sconosciuti** sono due progetti diversi, anche con lo stesso manifest:

- **Niente contenuto degli eventi.** Il tool restituisce solo libero/occupato (`getSchedule`), mai
  oggetto, luogo o partecipanti: basta un prompt ben scritto da un estraneo perché l'agente gli
  legga le riunioni con altri clienti.
- **Niente scrittura senza difese.** Un tool che crea eventi, aperto a chiunque, è un modo per
  riempire il calendario di prenotazioni false. Se serve prenotare, la prima risposta è Bookings;
  un tool di scrittura si aggiunge solo con limiti di frequenza e conferma, e dicendo chi li gestisce.
- **Dati personali.** Raccogliere nome, email e azienda di esterni chiede un'informativa e un tempo
  di conservazione: va scritto nella consegna, non scoperto dopo.

Un esempio completo — sei tool fra posta e calendario, con i prerequisiti scritti in testa — è nel
manifest di Studio Polis.

## Quando la fonte non deve solo essere letta, ma far *partire* qualcosa

Capita spesso, e non solo con la posta: arriva un documento, cambia una riga in un gestionale, si
apre un ticket — e da lì deve partire un processo. La forma è sempre la stessa, e sta tutta dentro
il tenant:

```yaml
connections:
  - key: fonte
    name: fonte-cliente
    provider: webhook
    baseUrl: https://graph.microsoft.com/v1.0        # o qualunque altra API HTTP
    auth:
      kind: OAuth2ClientCredentials
      tokenUrl: https://login.microsoftonline.com/<tenant>/oauth2/v2.0/token
      clientId: Blueprints:Secrets:<TAG>:fonte-client-id
      clientSecret: Blueprints:Secrets:<TAG>:fonte-client-secret
      scope: https://graph.microsoft.com/.default

mcpServers:
  - key: fonte
    kind: builder
    name: Fonte-MCP
    connection: fonte
    tools:
      - name: leggi_novita
        method: GET
        path: /users/protocollo@studio.it/mailFolders/inbox/messages
        description: Messaggi non letti arrivati nella casella di protocollo.
        parameters:
          da: Data e ora ISO 8601 da cui guardare
        required: [da]
        query:
          $filter: "isRead eq false and receivedDateTime ge {{da}}"

agents:
  - key: lettore
    name: Lettore protocollo
    mcp: [fonte]
    systemMessage: |
      ...cosa estrarre da ogni messaggio, e cosa NON dedurre...

agentTasks:
  - key: sorveglia
    name: Sorveglianza protocollo
    agent: lettore
    prompt: Elenca le novità dall'ultimo giro, una per riga.
    trigger: scheduled
    schedule: { cron: "*/5 * * * *", timeZone: Europe/Rome }
    executionPolicy: { maxDailyExecutions: 400 }   # 288 giri al giorno; il default è 100 e ferma il task a metà giornata (BP029)
    outputActions:
      - type: webhook
        url: processes.presa-in-carico.webhook    # il planner mette indirizzo e chiave
```

Cinque pezzi, tutti entità del tenant: nessuna Logic App, nessun resource group, niente che il
rollback non sappia smontare. E il `processes.<chiave>.webhook` non è una comodità di scrittura —
la chiave di un webhook si vede **una volta sola** e non è più recuperabile, quindi è il planner a
metterla, e non passa da nessuna parte dove qualcuno debba copiarla.

### Quando è la chat a far partire il processo

L'altro verso dello stesso ponte: l'utente **dice** all'agente cosa è successo — un avvocato che
detta al telefono uscendo dal tribunale — e l'agente apre la pratica. In chat non c'è un agent task
né una output action: c'è un **tool** che fa la POST al webhook del processo. La chiave del webhook
nasce all'apply e si vede una sola volta, quindi la connessione non la dichiara: dichiara il
processo, e l'apply la riempie dopo aver creato il webhook.

```yaml
connections:
  - key: pratiche
    name: pratiche-webhook
    provider: webhook
    process: presa-in-carico          # niente baseUrl, niente auth: li mette l'apply (BP045 se ci sono)

mcpServers:
  - key: pratiche
    kind: builder
    name: Pratiche
    connection: pratiche
    tools:
      - name: apri_pratica
        method: POST
        path: /
        description: Apre una pratica dal testo dettato o incollato. Chiamalo UNA volta per avviso, dopo aver riletto all'utente cosa hai capito.
        parameters:
          testo: Il testo integrale, come è arrivato, senza riassumerlo
          fonte: chat
        required: [testo, fonte]
        body: |
          {"testoAvviso": "{{testo}}", "fonte": "{{fonte}}"}
    # nessun testTool: prima del webhook la connessione non ha ancora un indirizzo

agents:
  - key: assistente
    name: Assistente agenda
    mcp: [pratiche]
    systemMessage: |
      ...rileggi all'utente ciò che hai capito, e SOLO al suo sì chiami apri_pratica...
```

Tre cose da rispettare, e il validatore le controlla dove può:

- **l'agente della chat non è l'agente dei passi automatici del processo**. La connessione si
  completa dopo il webhook, il webhook dopo il processo, il processo dopo i suoi agent task: se
  l'agente con `apri_pratica` fosse anche quello di un passo `Automated`, il grafo delle dipendenze
  sarebbe circolare. Due agenti, stesso schema di estrazione nel system message;
- **il corpo della POST è il `caseData` iniziale**: le chiavi devono essere quelle del modulo di
  avvio del processo (`testoAvviso`, `fonte`…), le stesse che manda l'agent task;
- **il tool va chiamato una volta per avviso e dopo una conferma**: un modello che «per sicurezza»
  chiama due volte apre due pratiche. Si scrive nel system message e si collauda con un caso che lo
  provoca.

**Il limite, detto prima**: è polling. Fra l'evento e l'avvio del processo passa al più l'intervallo
del cron. Per una casella di protocollo «entro cinque minuti» di norma va bene; se il caso pretende
la reazione immediata serve l'ingresso push, che vuole una Logic App e un'autorizzazione umana — ed
è l'unica cosa che il blueprint non crea.

## La checklist, in cinque passi

1. Creare la **connessione** HTTP Webhook, annotando quanto path è già dentro il `baseUrl`.
2. Generare il **MCP con MCP Buddy** e ridurre il `pathTemplate` alla sola parte rimanente.
3. **Un solo tool per fonte**, con input tipizzati e output JSON non normalizzato.
4. **Agente Base** con il MCP in conoscenza, temperature 0.1–0.2, e un prompt che dichiara il
   perimetro della fonte e come si comporta sui gap.
5. **Validare su cinque casi reali più un caso negativo**, guardando soprattutto il negativo.
