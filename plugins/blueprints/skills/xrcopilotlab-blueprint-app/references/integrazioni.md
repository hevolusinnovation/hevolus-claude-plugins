# Integrazioni: come un'app usa un blueprint (passo 2)

Verificato sul codice il 21 e il 25/10/2026. Se una riga qui non torna con il codice, vince il codice:
correggere questo file.

## Come gira un'app di App Builder

- **Nel sandbox** (sessione ACA, `EgressDisabled`) il container non ha rete né credenziali. Il BFF
  Express del template chiama `localhost:9000`; il runner accoda, l'AgentHost preleva la richiesta
  (long-poll su `/_runner/relay/next`), sostituisce `{companyId}` con il tenant della sessione, la
  autorizza e la esegue verso APIM con la chiave dell'ambiente.
- **Dopo l'export** il relay non c'è: il BFF chiama APIM con la chiave e il `companyId` del proprio
  `.env`. Lo stesso codice, due ambienti: è il lavoro di `server/xrcopilot.ts`, file protetto.
- **Il browser non chiama mai XRCopilot.** Ogni dato passa da una rotta `/api/*` del BFF.
- **Nessun webhook raggiunge un'app nel sandbox**: il preview è dietro l'edge con un cookie di
  sessione firmato. Gli esiti si leggono **interrogando** (polling), sempre.

### Limiti del relay

| Limite | Valore | Dove | Conseguenza per l'app |
|---|---|---|---|
| Durata di una chiamata | 60 s | `sandbox/runner/index.mjs` (`RELAY_TIMEOUT_MS`) | ciò che può durare di più si avvia e si interroga (start-and-poll) |
| Corpo della richiesta | 16 MB | stesso file | file grandi: no |
| Risposta | bufferizzata | `relay.mjs` | niente SSE, niente streaming della chat |
| Metodi | `DELETE`, `PUT`, `PATCH` vietati | `relay.mjs` (`DENIED_METHODS`) | — |
| Percorsi | vietati se contengono `delete`, `purge`, `/save`, `remove` | `relay.mjs` (`DENIED_PATH_FRAGMENTS`) | un file caricato con un nome così fallisce: usare nomi neutri |
| Tenant | il `companyId` deve essere un segmento del percorso, ed essere quello della sessione | `relay.mjs` | le rotte senza `companyId` (i webhook `hooks/*`) oggi non passano |

**Oggi è una deny-list, non un'allow-list (P1).** Un'app nel sandbox potrebbe chiamare operazioni
amministrative che non contengono le parole vietate (pubblicare una versione di processo, importare,
rigenerare la chiave di un webhook). Il brief lo vieta esplicitamente, e la creazione da CLI su tenant
di clienti aspetta P1.

## I sei modi

| | Modo | Come | Nel sandbox | Pubblicata |
|---|---|---|---|---|
| **A** | Chat incorporata | iframe sull'`embed` di un agente o di un orchestratore | solo se il dominio del preview è fra i `domains` dell'embed (P4: oggi no) | sì, con il dominio del sito in `domains` |
| **B** | Chat propria | BFF → `chatAsync`, oppure `startChatAsync` + `getConversationHistoryAsync` | sì; oltre i 60 s solo la versione asincrona | sì |
| **C** | Agente come servizio | BFF → una chiamata a un endpoint dedicato, che restituisce un valore; per un valore tipizzato, un orchestratore con output strutturato | sì, start-and-poll | sì |
| **D** | Procedura su un orchestratore | `startOrchestrationExecutionAsync` → `getOrchestrationStatusAsync` → `resumeOrchestrationExecutionAsync` dopo una pausa umana | sì, con polling | sì |
| **E** | Pratica in un processo BPM | `POST hooks/process/{hookId}` con il modulo di avvio come corpo → 202 con `instanceId`; i compiti umani nell'Hub; l'esito con `GET process-instances/{companyId}/{instanceId}` | **avvio no** finché non c'è P2; la lettura dello stato sì | sì, con la chiave del webhook nel `.env` del BFF |
| **F** | Lavoro asincrono di un agent task | `POST hooks/{hookId}` → l'agent task gira → `outputActions` di tipo webhook verso l'app | avvio no (P2), esito no (nessun webhook entra) | sì |

### E attraverso D: il processo lo apre l'agente

Un processo che il manifest collega a una **connessione `process:`** con un server MCP `kind: builder`
(regola 6 di `blueprints.md`) lo può aprire **un agente**, dopo il sì della persona in chat. L'app non
chiama il webhook: avvia l'orchestratore (D), e il passo con quell'agente apre la pratica. Indirizzo e
chiave del webhook li ha messi l'apply nella connessione, sulla piattaforma.

Conseguenza: **questi processi si aprono già nel sandbox**, senza P2. In SANITA v7 sono `richiamata-cup`
(dal passo `richiamata` di `accoglienza-cup`, strumento `apri_richiamata`) e `percorso-tutela` (dal
passo `tutela` di `copilot-cup`, strumento `apri_tutela`). `disdetta-riallocazione` invece non ha una
connessione: dall'app si apre solo con il webhook (E), quindi solo a progetto esportato.

Nella mappa si scrive «E via D» e si preferisce questa strada quando c'è: la decisione di aprire la
pratica resta all'agente, con le sue regole, e l'app non tiene nessuna chiave nemmeno da esportata.
Quando invece i campi del modulo di avvio li compila la persona in un form, serve E diretto.

### Rotte verificate

| Rotta | Che cosa | Note |
|---|---|---|
| `POST hooks/process/{hookId}` | avvia un'istanza di processo | anonima, `X-Api-Key` = chiave del webhook; il corpo JSON diventa i dati iniziali del caso; risponde 202 con `instanceId`; l'avvio è tracciato come `webhook:{hookId}`, senza dichiarare chi è l'utente |
| `GET process-instances/{companyId}/{instanceId}` | stato dell'istanza | passa dal relay |
| `GET orchestrations/{executionId}/status` | stato di un'esecuzione | l'SDK: `getOrchestrationStatusAsync` |
| `process-webhooks/{companyId}/{processId}` | amministrazione del webhook, compresa la rigenerazione della chiave | **mai da un'app** |

L'SDK JS pubblico (`xrcopilotlab.client.public.js` ≥ 2.4.0) ha `chatAsync`, `startChatAsync`,
`getConversationHistoryAsync`, `startOrchestrationExecutionAsync`, `resumeOrchestrationExecutionAsync`,
`getOrchestrationStatusAsync`. **Non** ha metodi per i webhook dei processi né per le istanze: il kit li
chiama con `fetch` dal BFF.

### Trappole trovate costruendo la demo di SANITA (26/10/2026)

- **La ripresa di un'esecuzione in pausa non passa dal relay così com'è.** L'SDK chiama
  `POST orchestrations/resume/{interactionId}` senza tenant, e il relay nega ogni richiesta che non lo
  nomina. Il BFF la chiama con `fetch` aggiungendo `?companyId={companyId}` in query, come l'SDK fa già
  per lo stato: il relay accetta il tenant in query. Vale per ogni orchestratore con
  `allowAgentInteraction: true` (in SANITA il passo `tutela` di `copilot-cup`).
- **Una pausa non si legge dallo stato.** In pausa `orchestrations/{id}/status` non porta né `result` né
  `orchestrationState`: la domanda arriva solo come evento `userInteractionRequired` nello stream
  `orchestrations/{id}/stream?companyId=…` (nel `payload`: `interactionId`, `orchestrationState`, `message`),
  che resta aperto finché l'esecuzione è in pausa. A progetto esportato il BFF legge lo stream e si stacca
  appena trova l'evento. **Nel sandbox non funziona**: il relay bufferizza la risposta e lo stream supera i
  60 s. Quindi oggi un orchestratore che fa una domanda (`allowAgentInteraction: true`) da un'app nel
  sandbox si avvia ma non si riprende: nella mappa si scrive «D con pausa: solo esportata».
- **`finalContext` nello stato arriva serializzato male** (`{"valueKind":3}` al posto del valore): non
  leggerci le variabili tipizzate, cercarle nel testo dei passi o nell'output finale.
- **Gli id hanno il nome del tipo**: `orchestratorId` negli orchestratori, `processId` nei processi, non
  `id`. Con `id` la ricerca per nome trova niente e non fallisce.
- `GET processes/{companyId}` (per trovare un processo per nome) e `GET process-instances/{companyId}?processId=…`
  non sono nell'SDK: il BFF li chiama con `fetch`. **Non verificato** che siano pubblicati sull'API pubblica
  di APIM: provato sull'Api locale.

**Non ancora verificato**: se le rotte `hooks/*` sono pubblicate su APIM in ogni ambiente. Prima di
promettere il modo E a progetto esportato, provarlo.

## Regole fisse, per ogni modo

- **Nessuna chiamata lunga tiene aperta una richiesta dell'app**: oltre i 60 s si avvia e si
  interroga. Le risposte degli agenti con strumenti MCP superano spesso il minuto (STUDIOPOLIS, FINBANK).
- **Ogni richiamata ha il suo polling di riserva**, scelto da configurazione: nel sandbox c'è solo il
  polling.
- **Nessun segreto nell'app**: la chiave di un webhook vive nel `.env` del progetto esportato (solo il
  nome nel `README.md`: `.env.example` è protetto), mai nel client, mai nel brief.
- **I processi BPM entrano dal webhook del processo (E)**, non completando compiti per conto di una
  persona. I compiti umani li fa chi ne ha il ruolo, nell'Hub, con la propria identità.
- **Nessuna operazione amministrativa**: pubblicare, importare, rigenerare chiavi, riassegnare.

## Come si sceglie il modo di un'entità

| Entità nel manifest | Modo di norma | Quando un altro |
|---|---|---|
| Agente con `embed` | A | B se l'app deve mostrare la chat con il proprio aspetto, o leggerne le risposte |
| Agente senza `embed`, rivolto a persone | B | A dopo aver aggiunto `embed` (proposta di modifica, passo 3) |
| Agente che restituisce un valore (classifica, estrae, arricchisce) | C | — |
| Orchestratore | D | A se ha `embed` e basta la chat; C se restituisce un valore tipizzato |
| Processo con webhook | E | «E via D» se un agente di un orchestratore lo apre con una connessione `process:` |
| Processo senza webhook | nessuno | proposta di modifica: aggiungere il webhook |
| Agent task con webhook in ingresso | F | — |
| Agent task schedulato, senza ingresso | nessuno | non va nella mappa |

## Che cosa manca, di solito

| Mancanza | Si vede da | Proposta |
|---|---|---|
| `embed` su un agente o un orchestratore | il manifest | aggiungere `embed` con i domini del sito (modo A) |
| Webhook di un processo | `processes.<k>.webhook` assente | aggiungerlo (modo E) |
| Esito di un processo verso l'app | nessuno step `action` webhook alla fine | uno step `action` verso `/api/callbacks/*`, a progetto pubblicato; fino ad allora polling |
| Endpoint di chat dedicato per il modo C | l'agente ha un solo endpoint, quello delle persone | un secondo elemento in `chatEndpoints` |
| P1, P2, P4 | la piattaforma | non si risolvono dal manifest: si dice nella mappa che cosa resta simulato |
