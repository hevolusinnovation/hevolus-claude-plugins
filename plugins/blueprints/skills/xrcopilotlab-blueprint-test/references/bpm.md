# BPM per chi collauda: cosa sapere prima di giudicare un caso di processo

Un caso `kind: process` non è una chat: è un'istanza che percorre un grafo, con un motore che
decide dove va il token. Per scrivere le attese giuste e per attribuire un fallimento serve capire
il modello di esecuzione, non solo il risultato. Questa pagina dà il minimo di BPM (Business Process
Management) e di BPMN 2.0 che serve, tradotto nel motore di XRCopilotLab, e poi le domande da farsi
sistematicamente su ogni processo di un manifest.

## Il modello di esecuzione, in sei concetti

| Concetto | In BPMN | Nel motore | Cosa conta per il collaudo |
|---|---|---|---|
| **Definizione / istanza** | process / process instance | il processo pubblicato (versione numerata) / l'istanza avviata con un `caseData` | Un'istanza resta sulla versione con cui è partita: un caso scritto per la v7 contro un'istanza v6 fallisce sul grafo, non sul motore |
| **Token** | token | il segnaposto che indica su quale nodo sta l'istanza (`inst.Tokens`, con `StartedAt`) | Gli eventi dell'istanza (`InstanceStarted`, `ActivityCompleted`, `WorkItemCreated`…) sono la traccia del token: si legge la sequenza, non lo stato finale |
| **Attività** | User Task / Service Task / Call Activity | `Task` con `performer: HumanOnly` (crea un **work item**) · `Automated` (esegue un **agent task**, nessun work item) · `AiAssisted` · `CallActivity` (richiama un processo pubblicato) | Un passo `Automated` non si ferma mai su una persona: se l'istanza è ferma lì, è l'agent task che non è tornato |
| **Gateway** | Exclusive (XOR) / Parallel (AND) | `Exclusive`: **un** ramo, condizione sui flussi in uscita, il flusso senza condizione è il default · `Parallel`: solo **fork**, il join non esiste (il validatore lo vieta) | La condizione `{var, op, value}` confronta **per stringa** con `eq/neq` (case-insensitive) e per numero con `gt/lt/gte/lte`; `exists` = non null. Un valore che arriva come `"true"` o `true` è uguale per `eq`, ma uno spazio o un a capo in più no |
| **Corsia** | Lane | `roleName` = ruolo aziendale; `assignmentExpression` = il work item va alla **persona** il cui id sta in quella variabile del caso | Il caso di collaudo deve girare per conto di un membro del ruolo di avvio (`defaults.userId` con l'email), altrimenti 403 |
| **Eventi** | Start / End Event; Message Start (≈ webhook); Timer (≈ non c'è) | `Start` porta il modulo di avvio (i campi diventano `caseData`); `End` chiude; `webhook` avvia un'istanza dall'esterno | Non esistono eventi intermedi, di bordo, timer: un timeout è una **soglia** (`maxLeadTimeMinutes`) che fa mandare un'email agli owner, non un ramo alternativo |

Due cose del motore che non sono BPMN e che i casi devono sapere:

- **`caseData` è un dizionario piatto** che attraversa tutto il processo. I campi del modulo di
  avvio, gli `outputVariable` dei passi automatici e i campi dei moduli umani vivono nello stesso
  spazio dei nomi: un campo con lo stesso `key` in due moduli è **lo stesso** dato (è voluto: così
  `dataUdienza` verificato al passo 3 arriva al passo 8).
- **Un modulo con `context: true`** mostra un dato in sola lettura: non lo scrive, e quindi un
  caso non può aspettarsi che quel passo lo modifichi.

## Che cosa il collaudo può e non può vedere

La CLI **non completa mai un work item**: sarebbe firmare un modulo al posto di una persona. Un
caso di processo arriva quindi fino al **primo compito umano** (o allo stato atteso, o al timeout)
e lì si ferma, lasciando l'istanza aperta. Conseguenze:

- si collauda **l'ingresso di ogni ramo**, non il ramo: un'istanza per ogni combinazione del modulo
  di avvio che porta a un percorso diverso (materia, un campo che decide un gateway prima del primo
  compito);
- un gateway che sta **dopo** un compito umano (come «Estremi completi?» dopo la verifica) non si
  può esercitare dalla CLI: si prova a mano dall'interfaccia, e il caso lo dice nelle `notes`;
- i passi automatici **prima** del primo compito umano si vedono per intero: `AgentTaskDispatched` →
  `ActivityCompleted`, con l'output nel `caseData` (`process.caseData.<outputVariable>`).

## Le domande da farsi su ogni processo del manifest

Prima di scrivere i casi, leggere il grafo (`xrcopilotlab-bp validate <manifest> --graph`) e
rispondere a queste. Ogni «sì» è un caso; ogni «non so» è una nota per l'utente.

1. **Da dove entra?** Modulo di avvio a mano, webhook, o entrambi. Se entra da un agent task
   schedulato: **quanti giri al giorno fa, e qual è la sua quota** (`executionPolicy.maxDailyExecutions`,
   default 100)? Oltre la quota la piattaforma salta i giri in silenzio, e l'ingresso smette di
   funzionare a metà giornata senza che nessun caso lo veda — il 15/09/2026 la mail di prova è
   rimasta in casella per questo. Il validatore lo segnala con `BP029`. Se c'è un webhook alimentato da
   un agent task schedulato, **cosa manda quando non ha trovato niente?** Le output action non hanno
   condizioni: il webhook parte a ogni esecuzione riuscita. Serve un gateway subito dopo lo Start
   che chiuda l'istanza vuota — e un caso che lo verifichi (`status: Completed`, nessun work item).
2. **Qual è il primo compito umano, e chi lo riceve?** Ruolo o persona. È il `waitingAt` del caso
   base, e il `defaults.userId` deve poterlo avviare.
3. **Quali passi automatici stanno prima?** Per ciascuno: l'agente ha un server MCP? (issue #1000:
   un agent task su un agente con MCP può non completare mai — l'istanza resta a
   `AgentTaskDispatched`). Ha una soglia? Senza, un blocco è silenzioso.
4. **Quali gateway ci sono, e su quale variabile decidono?** Per ciascuno: la variabile è scritta da
   un modulo (bool, select) o da un agente (testo libero)? Una condizione `eq` su un testo scritto
   da un agente è fragile: un caso deve provare il valore esatto e uno con spazi o maiuscole diverse.
   Il flusso di default esiste? Se tutti i flussi in uscita hanno una condizione e nessuna è vera,
   il token muore lì.
5. **Ci sono cicli?** (chiarimenti → verifica). Un ciclo senza limite è legittimo se ogni giro ha una
   soglia; va detto all'utente, non segnalato.
6. **I due rami di un XOR arrivano allo stesso End?** Un ramo che non arriva a un End lascia
   l'istanza `Running` per sempre: il validatore lo segnala, ma un manifest vecchio può averlo.
7. **Le soglie sono coerenti?** Un passo umano con soglia più corta della durata di lavoro reale
   produce avvisi a raffica; un passo automatico senza soglia produce silenzio. Il worker delle
   soglie gira ogni 5 minuti e manda promemoria ripetuti agli **owner**: chi sono, e vogliono
   riceverli?
8. **Cosa scrive davvero fuori dal tenant?** Un passo automatico con un agente che ha strumenti di
   scrittura (calendario, posta) lascia tracce vere: quel caso non va nella suite di regressione, va
   in una suite a parte con un sì esplicito, e nel frattempo si collauda **a secco** (l'agente dice
   quale chiamata farebbe, senza farla).

## Leggere gli eventi di un'istanza

La sequenza attesa per «avvio → passo automatico → primo compito» è:

```
InstanceStarted → AgentTaskDispatched(estrai) → ActivityCompleted(estrai) → WorkItemCreated(verifica)
```

| Ciò che si vede | Cosa vuol dire | Dove guardare |
|---|---|---|
| Si ferma a `InstanceStarted` | Il primo nodo dopo lo Start non è stato raggiunto: gateway senza flusso valido, o comando di avvio non consumato | grafo; `Api.AsyncOperations` (worker del motore) |
| `InstanceStarted → InstanceCompleted`, nessun work item | L'istanza ha preso un ramo che chiude subito (il filtro «NESSUN AVVISO») | è l'esito atteso del caso negativo, non un difetto |
| Si ferma a `AgentTaskDispatched` | L'agent task è partito e non è mai tornato — né completato né fallito (anche un fallimento farebbe avanzare il token) | l'agente ha MCP? (#1000); `Api.AsyncOperations` consuma la coda? un'AsyncOperations **locale** sta leggendo le code dell'ambiente condiviso? |
| `ActivityCompleted` ma il work item è su un'altra attività | Il gateway ha preso un altro ramo | il **tipo e il valore** della variabile nel `caseData` (`"true"` vs `true`, spazi, maiuscole) contro la condizione |
| Istanza `Faulted` | Errore esplicito del motore o dell'agent task | `ErrorMessage` dell'istanza |
| Work item creato, poi `LeadTimeAlert`/email dopo la soglia | Funziona come previsto | è la prova delle soglie: si vede solo aspettando |

## Il BPMN esportato

A ogni `apply` la CLI archivia `<processo>.bpmn` accanto al manifest: BPMN 2.0 XML con
`startEvent`, `endEvent`, `userTask`/`serviceTask`, `callActivity`, `exclusiveGateway`/
`parallelGateway`, `sequenceFlow` con le condizioni, e le informazioni del motore (ruolo, agent
task, soglie, moduli) come attributi di estensione. Si apre in bpmn.io o Camunda Modeler. È il
modo più rapido per **far leggere il processo a chi non ha il manifest** — un esperto BPM, il
cliente — e per confrontare ciò che il tenant ha davvero con ciò che il manifest dice.

## Che cosa il motore non fa (per non segnalarlo come bug)

Eventi intermedi (timer, messaggio, segnale), eventi di bordo, gateway inclusivo, join parallelo,
sotto-processi ad hoc, compensazione, transazioni, escalation automatica allo scadere di una
soglia. Sono scelte del motore, non difetti: un manifest che ne avesse bisogno va ridisegnato con
ciò che c'è (una soglia + un owner al posto di un timer; un gateway subito dopo lo Start al posto di
una condizione sul webhook), e il collaudo lo verifica così.
