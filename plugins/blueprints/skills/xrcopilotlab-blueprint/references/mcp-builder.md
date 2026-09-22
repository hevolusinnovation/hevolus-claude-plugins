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

«Microsoft» sono due cose diverse, e sbagliarla manda a costruire l'impianto sbagliato:

- **Microsoft 365 aziendale** (una casella su un tenant) → permessi **applicativi**, consenso di un
  amministratore, Application Access Policy. È il caso normale per un cliente;
- **account Microsoft personale** (`@outlook.com`, `@hotmail.com`, `@live.com`) → **non ha un
  tenant**, quindi le credenziali client non funzionano affatto. Serve OAuth **delegato**,
  autorizzato una volta da una persona con il pulsante *Autorizza* della pagina Connections.

E prima ancora: **la casella è davvero su un'API?** IMAP non è HTTP, e un connettore dichiarativo
non lo può raggiungere. Se il cliente ha la posta su un hosting qualunque, la risposta non è questa
pagina — vedi la issue sull'ingresso da una casella qualsiasi.

Chiederlo costa una riga; assumerlo costa la riprogettazione di tutto lo scenario.

### Una app per tutti i clienti, non una per cliente

L'app si crea **multi-tenant** (`--sign-in-audience AzureADMultipleOrgs`) anche quando si comincia
con una casella interna di collaudo: è la stessa app che poi il cliente consentirà sul proprio
tenant. Creata single-tenant, al primo cliente va rifatta.

Il modello cambia anche cosa si chiede al cliente: con il multi-tenant sono un consenso, un
indirizzo e una restrizione — nessun segreto che viaggia fra due aziende.

### I quattro passi che il blueprint NON può fare

Procedura completa, con i comandi, chi serve per ciascun passo e il testo da inoltrare al cliente:
[`references/microsoft365-setup.md`](microsoft365-setup.md).


Il blueprint crea connessione, server, tool e collegamento agli agenti. I permessi no — vivono in
Entra e in Exchange. Vanno **riportati all'utente come passi da fare prima di applicare**, e
verificati nell'interfaccia:

1. **registrazione applicativa** nel tenant del cliente;
2. **permessi applicativi Graph** con consenso amministratore, solo quelli che servono:
   `Mail.Read` per leggere · `Mail.Send` per rispondere, allegati compresi ·
   `Calendars.ReadWrite` per il calendario;
3. ⚠️ **Application Access Policy in Exchange Online**, che limita l'app a quella sola casella:
   ```powershell
   New-ApplicationAccessPolicy -AppId <appId> -PolicyScopeGroupId <casella> -AccessRight RestrictAccess
   ```
   Va fatta **prima** del consenso. Senza, quei permessi leggono e scrivono la posta e il
   calendario di **chiunque** nel tenant. Una sola policy copre posta, calendario e contatti,
   perché vivono tutti in Exchange;
4. i **segreti**, citati per nome nel manifest e impostati con `secrets set` — client id e client
   secret. Il loro valore non si chiede e non si scrive mai.

### Quei quattro passi non sono un blocco unico: verificare chi può fare cosa

È l'errore che costa più tempo, e si evita con due letture. I quattro passi hanno **tre** livelli di
privilegio diversi, e trattarli come una cosa sola manda l'utente a chiedere a un amministratore
cose che potrebbe fare da sé — o peggio, a cercare scorciatoie che non esistono.

```bash
# L'utente può creare registrazioni applicative?
az rest --method GET --url "https://graph.microsoft.com/v1.0/policies/authorizationPolicy" \
  --query "defaultUserRolePermissions.allowedToCreateApps"

# Ha ruoli di directory, cioè può dare il consenso?
az rest --method GET --url "https://graph.microsoft.com/v1.0/me/memberOf" --query "value[].displayName"
```

Con `allowedToCreateApps: true` — che è il default di molti tenant — **il passo 1 lo può fare
l'assistente**, creando l'app con i permessi *richiesti e non concessi*: in quello stato non accede a
niente, e ciò che resta all'amministratore sono due azioni circoscritte invece di «creare tutto».

```bash
az ad app create --display-name "<nome>" --sign-in-audience AzureADMyOrg \
  --required-resource-accesses @permessi.json
az ad sp create --id <appId>     # solo l'oggetto in Enterprise applications: non concede nulla
```

Gli id dei permessi si leggono, non si scrivono a memoria:

```bash
az ad sp show --id 00000003-0000-0000-c000-000000000000 \
  --query "appRoles[?value=='Mail.Read' || value=='Mail.Send' || value=='Calendars.ReadWrite'].[value,id]" -o tsv
```

**Il client secret no.** Va generato dall'utente — dal portale o da `az ad app credential reset` —
perché il valore viene stampato, e stampato dentro la sessione finirebbe nella trascrizione. Chi ha
creato l'app ne è **owner**, quindi può generarlo senza chiedere niente a nessuno: verificarlo con
`az ad app owner list --id <appId>` ed è un'attesa in meno.

Restano all'amministratore, in quest'ordine: **prima** l'Application Access Policy, **poi** il
consenso. E lo stato del consenso si controlla invece di darlo per fatto — zero assegnazioni vuol
dire che l'app non accede ancora a niente, e l'applicazione si fermerebbe sulla prova del tool:

```bash
az rest --method GET \
  --url "https://graph.microsoft.com/v1.0/servicePrincipals(appId='<appId>')/appRoleAssignments" \
  --query "length(value)"
```

**Gli allegati non richiedono permessi sui file**: viaggiano dentro la chiamata di invio, come
contenuto codificato in base64. Chiedere `Files.Read.All` per mandare un allegato significa
chiedere accesso a tutto SharePoint per niente — e quel permesso l'Application Access Policy non lo
restringe.

### Il tool di prova si sceglie in sola lettura

`testTool` viene esercitato durante l'apply. Su Microsoft 365 si punta a una lettura su una finestra
vuota (`cerca_eventi` fra due date del passato): esercita credenziale, permesso e policy senza
lasciare traccia. Un tool di prova che scrivesse lascerebbe un impegno in agenda a ogni
applicazione.

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
