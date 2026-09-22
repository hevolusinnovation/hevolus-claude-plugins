# Regole del grafo BPM — cosa il validatore accetta

Riassunto operativo di ciò che `ProcessSpecValidator` verifica sul server. Serve a scrivere una
`spec` corretta **al primo colpo**, invece di scoprirne i limiti sbagliando.

> Fonte: `src/XRCopilotLab/XRCopilotLab.Core/Services/Process/ProcessSpecValidator.cs`. Se un giorno
> le due cose divergessero, vince il codice: `xrcopilotlab-bp validate` lo esegue davvero.

## Intestazione

- `version` deve valere **1**. Nessun'altra versione è supportata.
- `name` è obbligatorio.

## Id

- Ogni attività, gateway e flusso ha bisogno di un id **valido come NCName**:
  `^[A-Za-z_][A-Za-z0-9_-]*$` — lettere, cifre, `_` e `-`, senza iniziare con una cifra.
- Attività e gateway condividono **lo stesso spazio dei nomi**: un'attività e un gateway non possono
  chiamarsi allo stesso modo.
- I flussi hanno uno spazio dei nomi separato, e **il loro id si può omettere**: lo genera la CLI in
  modo deterministico da sorgente e destinazione. Ometterlo è la scelta preferibile, tiene leggibile
  la parte più importante del file.

## Topologia

- Esattamente **uno** `Start`. Non zero, non due.
- **Almeno un** `End`.
- Lo `Start` non può avere frecce entranti; un `End` non può averne di uscenti.
- Ogni nodo deve essere **raggiungibile dallo Start**. Un nodo scollegato è un errore, non un
  avviso.
- Sorgente e destinazione di ogni freccia devono esistere.

## Cosa può portare ciascun tipo di attività

| Tipo | Ammette | Vietato |
|---|---|---|
| `Start` | solo `name` e `form` | performer, roleName, agentTaskName, calledProcessName, mapping |
| `End` | solo `name` | tutto il resto, form compreso |
| `Task` | dipende dal performer, vedi sotto | `calledProcessName` |
| `CallActivity` | `calledProcessName`, `inputMapping`, `outputMapping` | form, performer, roleName, agentTaskName, outputVariable |

## Performer di un `Task`

`performer` è **obbligatorio** su ogni `Task`.

| Performer | Richiede | Ammette | Vieta |
|---|---|---|---|
| `HumanOnly` | `roleName` **oppure** `assignmentExpression` | `form` | `outputVariable` |
| `AiAssisted` | `agentTaskName` **e** (`roleName` oppure `assignmentExpression`) | `form`, `outputVariable` | — |
| `Automated` | `agentTaskName` | `outputVariable` | `form`, `roleName`, `assignmentExpression` |

Il motivo del divieto su `Automated`: un'attività automatica non genera un work item, quindi un
modulo non avrebbe nessuno che lo compili e una corsia non avrebbe nessuno a cui assegnare.

## Gateway

**Esclusivo** (`Exclusive`):

- almeno **2** rami uscenti;
- **esattamente uno** senza condizione: è il ramo di default. Né zero né due.

**Parallelo** (`Parallel`):

- almeno **2** rami uscenti;
- i rami **non possono portare condizioni**;
- i rami **non possono riconvergere** su un nodo intermedio: il motore è solo fork, non fa join, e
  due rami che si ritrovassero sullo stesso passo lo eseguirebbero due volte. Ogni ramo deve
  terminare su un `End` — convergere sull'`End` è invece la norma.

Se serve che due strade si ricongiungano prima della fine, la forma corretta non è il parallelo:
è un gateway **esclusivo**, dove passa un ramo solo.

## Condizioni

```yaml
condition: { var: confermato, op: eq, value: true }
```

- `var` è obbligatorio e deve essere **la `key` di un campo form oppure un `outputVariable`**
  dichiarato da qualche parte nella stessa spec. Una variabile inventata è un errore.
- `op` fra: `eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `exists`.
- `value` è obbligatorio per tutti gli operatori **tranne** `exists`.
- **Il tipo del valore conta.** `value: true` è un booleano, `value: "true"` una stringa,
  `value: 30` un numero, e il motore confronta per tipo. Un booleano fra virgolette non farebbe mai
  scattare il ramo. Vale il core schema di YAML 1.2, quindi `no`, `yes`, `on` e `off` restano
  **stringhe**.

## Campi di un modulo

Tipi ammessi: `text`, `textarea`, `number`, `bool`, `date`, `select`, `user`, `file`.

- `key` obbligatoria e **unica dentro lo stesso modulo**.
- un campo `select` richiede `options` **oppure** `optionsTargetName`.
- `context: true` rende il campo di sola lettura, alimentato da una variabile prodotta a monte: si
  usa per mostrare all'operatore l'esito di un passo precedente.

### `file` — l'allegato

Chi svolge l'attività carica uno o più documenti, che diventano variabili del processo come gli
altri dati: gli step successivi li ritrovano fra i dati a monte (`context: true`) e li scaricano.
`required: true` impedisce di completare l'attività senza almeno un file.

Due vincoli, entrambi verificati dal validatore:

- **mai sullo `Start`.** Un allegato appartiene all'istanza e all'attività in cui è stato caricato,
  e il form di avvio gira prima che l'istanza esista — l'interfaccia lo dice già a chi compila
  («si può allegare quando l'attività è in corso»), quindi il campo nascerebbe inutilizzabile. Un
  documento da raccogliere all'avvio si chiede nella prima attività umana.
- **in una condizione solo `op: exists`.** Il valore è la lista dei file, non uno scalare: `eq` non
  darebbe errore, semplicemente non sarebbe mai vero e il ramo non scatterebbe mai.

## Cosa il validatore NON verifica

I nomi di ruoli, agent task, categorie e sotto-processi non vengono risolti qui: li risolve il
server al momento della creazione, e se non li trova lascia l'elemento scollegato con un avviso.

Il validatore della CLI aggiunge però un controllo in più, che il server non fa: verifica che
`roleName`, `agentTaskName` e `calledProcessName` citino qualcosa che **il manifest stesso crea**
(codici `BP031`, `BP032`, `BP033`). È lì che si accorge di un refuso prima che diventi
un'attività senza corsia.


## Il cablaggio fra i passi — il grafo giusto non basta

Un orchestratore può avere il grafo perfetto e **non trasportare comunque nessun dato**. È successo
il 2026-09-12 sullo scenario FinLogic: tre agenti in catena, l'orchestrazione arrivava in fondo con
stato `Completed`, e l'ultimo agente rispondeva «Confermo quanto riportato» — perché i passi si
erano passati **il testo della chat**, non i numeri. Niente lo segnalava.

Tre campi, e vanno insieme:

| Campo | A che serve | Se manca |
|---|---|---|
| `outputMapping` | La **chiave** dà il nome alla variabile che i passi a valle citano con `{{variabile}}`. Il valore è solo una descrizione | Il risultato del passo **non entra nel contesto**: nessuno a valle può consumarlo |
| `inputMapping` | Dichiara le variabili che il passo legge. La **chiave** è il nome della variabile prodotta a monte | Il motore rifiuta un `userMessageTemplate` senza di esso (`TEMPLATE_WITHOUT_INPUT`) |
| `userMessageTemplate` | Il messaggio per l'agente, con i segnaposto | Senza template il passo riceve **il messaggio dell'utente** |

**Il primo passo non ha template, ed è deliberato.** Non esiste un segnaposto per la domanda
dell'utente: `context.Data` nasce **vuoto**, `context.UserMessage` è una proprietà a parte, e
`OrchestrationTemplating.Render` sostituisce una variabile mancante con **stringa vuota**, senza
avvisare. Un `{{input}}` sul primo passo gli consegna quindi un messaggio vuoto. Si lascia il passo
senza template — il motore gli passa la domanda dell'utente — e gli si mette solo l'`outputMapping`.

**Conseguenza da tenere a mente**: dal secondo passo in poi la domanda originale **non è più
visibile**. Se al terzo agente serve il perimetro che l'utente ha chiesto, deve viaggiare **dentro**
il testo che il passo precedente produce: lo si chiede nel system message del primo agente.

### `allowAgentInteraction: false` sulle catene lineari

Il default è `true`, e significa che **se l'agente chiude con «se vuoi, posso…» l'orchestrazione si
ferma** in `PausedForUserInteraction`. In una pipeline è quasi sempre sbagliato: è bastata una
cortesia dell'agente di normalizzazione per non far partire i due passi successivi, due volte di
fila. Su una catena lineare va messo `false` su ogni passo agent.

### Il validatore ora lo controlla

`validate` delega al validatore della piattaforma (`OrchestrationValidator`), come già faceva per il
grafo e per la specifica di processo — le regole stanno in un posto solo. I rilievi arrivano come
**BP093** con il codice del motore:

- `TEMPLATE_WITHOUT_INPUT` — template senza `inputMapping`
- `MISSING_OUTPUT_VAR` — passo cablato che non pubblica il proprio risultato
- `UNPRODUCIBLE_VAR` — un `{{segnaposto}}` che nessun passo a monte produce
- `LEGACY_MODE` — nessun input dichiarato: **corretto** sul primo passo, sospetto sugli altri

