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

Due cose da sapere scrivendo i tool:

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

### I quattro passi che il blueprint NON può fare

Procedura completa, con i comandi e chi serve per ciascun passo:
[`microsoft365-setup.md`](microsoft365-setup.md).


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
    outputActions:
      - type: webhook
        url: processes.presa-in-carico.webhook    # il planner mette indirizzo e chiave
```

Cinque pezzi, tutti entità del tenant: nessuna Logic App, nessun resource group, niente che il
rollback non sappia smontare. E il `processes.<chiave>.webhook` non è una comodità di scrittura —
la chiave di un webhook si vede **una volta sola** e non è più recuperabile, quindi è il planner a
metterla, e non passa da nessuna parte dove qualcuno debba copiarla.

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
