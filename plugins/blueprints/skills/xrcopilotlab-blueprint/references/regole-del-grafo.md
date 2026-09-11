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

Tipi ammessi: `text`, `textarea`, `number`, `bool`, `date`, `select`, `user`.

- `key` obbligatoria e **unica dentro lo stesso modulo**.
- un campo `select` richiede `options` **oppure** `optionsTargetName`.
- `context: true` rende il campo di sola lettura, alimentato da una variabile prodotta a monte: si
  usa per mostrare all'operatore l'esito di un passo precedente.

**Il tipo allegato non è ammesso** nella specifica dichiarativa. Un processo che deve raccogliere
file si disegna nel designer e si importa con `bpmnFile`.

## Cosa il validatore NON verifica

I nomi di ruoli, agent task, categorie e sotto-processi non vengono risolti qui: li risolve il
server al momento della creazione, e se non li trova lascia l'elemento scollegato con un avviso.

Il validatore della CLI aggiunge però un controllo in più, che il server non fa: verifica che
`roleName`, `agentTaskName` e `calledProcessName` citino qualcosa che **il manifest stesso crea**
(codici `BP031`, `BP032`, `BP033`). È lì che si accorge di un refuso prima che diventi
un'attività senza corsia.
