# Scrivere le domande di collaudo

Una domanda di collaudo vale se, quando fallisce, dice **che cosa** si è rotto. Una domanda
generica («parlami dell'azienda») fallisce in modi che non insegnano niente. Ogni caso nasce da
una riga del manifest: una regola del system message, un file del profilo, una skill dichiarata,
un campo del modulo, un ramo del processo.

## Il metodo: dal manifest al caso

Per ogni agente, leggere il system message e segnare tre cose:

1. **Che cosa deve fare** — il compito. Da qui il caso positivo: un input che lo esercita per
   intero, con una risposta attesa scritta in prosa (`expect.answer`) e i frammenti che
   devono esserci (`contains`).
2. **Che cosa non deve fare** — le regole negative («non calcolare termini», «non dedurre»,
   «scrivi "non indicato"»). Da qui i casi negativi: un input che *invita* a violarle, con
   `notContains` sulla violazione e `contains` sulla forma corretta di delimitare.
3. **Da dove prende le informazioni** — la knowledge (profili, file), le skill, un server MCP.
   Da qui le attese sulle evidenze: `knowledge.files`, `skills`, `noSkills`.

Un agente ben collaudato ha di norma **da tre a cinque casi**: uno positivo pieno, uno con un
input incompleto, uno o due negativi sulle regole che contano, uno sul perimetro (una domanda
che non gli compete).

## Numeri e risposte sbagliate note

Quando l'atteso è un numero — un saldo, un conteggio, un totale — non si scrive in `contains`:
il modello lo formatta come vuole (`5.995`, `5995`, `5 995`) e il confronto testuale fallisce a
caso. Si scrive in `numbers`, con l'etichetta, il valore e la tolleranza del documento:

```yaml
numbers:
  - { label: righe di chiusura, value: 334 }
  - { label: saldo 810000025, value: -495233.91, tolerance: 0.5 }
  - { label: stipendi, text: "157.735,34", tolerance: 0.5 }     # come nel documento del cliente
```

Il segno conta (un ricavo è negativo nel giornale); la tolleranza vale in valore assoluto; senza
tolleranza il confronto è esatto al centesimo.

Le **risposte sbagliate già viste** valgono più di un `notContains`, perché portano la diagnosi.
Ogni «se va storta», «numero sbagliato da saper riconoscere» o «risposta che non regge» dei
documenti di demo diventa un `wrongAnswers`:

```yaml
wrongAnswers:
  - { number: 5,          means: "il campione del recupero canonico, non la popolazione", suspect: KnowledgeGraph }
  - { number: 8131,       means: "testate più righe: i totali del file, non il calcolo filtrato" }
  - { contains: "10000001", means: "criterio per conto: vietato dal prompt" }
  - { pattern: "0,00.*0,00.*0,00", means: "ha incluso le chiusure: il calcolo non ha visto il filtro", suspect: KnowledgeGraph }
```

Se una compare, il caso fallisce e il report riporta `means`; `suspect`, quando lo si sa, diventa
il sospetto del triage. Quando in un collaudo riconosci una risposta sbagliata nuova, la aggiungi
qui con la sua spiegazione: è la memoria del collaudo.

Tre regole per le domande su dati tabellari, imparate su FinLogic:

- **Un numero si chiede come aggregazione sui dati, mai come racconto del lavoro dell'agente.**
  «Quante righe hanno *Chiusura conti* nelle osservazioni» → 334. «Quante ne hai riconosciute»
  → 5, il campione che il recupero gli ha mostrato: preciso, plausibile e sbagliato.
- **Un criterio si chiede a parte**, in un'altra domanda: messo insieme al numero, la prima metà
  trascina la seconda nel racconto.
- **Le regole di dominio vanno nella domanda** («escludendo le righe con Chiusura conti»): il
  calcolo non legge il system message, anche se il prompt la contiene già.

E una sulla conversazione: **una domanda, una conversazione**. La CLI ne apre una per caso; non
usare `conversation:` per domande indipendenti, perché un messaggio che arriva entro un'ora da
un'esecuzione conclusa viene preso per un commento e riceve una risposta di cortesia senza dati.

## Agenti con knowledge

La cosa da sapere: dentro un profilo le sorgenti si selezionano confrontando le parole della
domanda con il **nome del file** (regola `BP028` del validatore, e
`CanonicalRetriever.SelectSourcesForQuestion` nella libreria). Quindi le domande vanno scritte
in tre forme, apposta:

| Forma | Esempio | Che cosa verifica |
|---|---|---|
| **Nomina il file** | «Nel *Regolamento interno* quali sono gli orari di apertura?» | che il file nominato sia consultato: `knowledge.files: [Regolamento interno]` e gli altri no: `knowledge.notFiles` |
| **Non nomina nessun file** | «Quali sono gli orari di apertura?» | che il retrieval trovi la risposta senza aiuto: `knowledge.used: true` + `contains` |
| **Nomina un file che non c'entra** | «Nel *Listino 2026* quali sono gli orari?» | che l'agente non inventi: `contains: ["non"]` o la formula di delimitazione del prompt |

Per un **file tabellare** (Excel, CSV, PDF con tabelle) aggiungere: una domanda su un record
per **identificativo** (codice, numero di transazione), una per **denominazione** (con e senza
la forma giuridica: «Monvania» e «MONVANIA SRL»), una **aggregata** («qual è il totale della
colonna X», «quante righe») — sono i tre percorsi distinti della libreria (identifier, free-text,
analytic), e si rompono separatamente. Una domanda con un nome **sbagliato di poco**
(«Monviana») deve produrre un suggerimento, non il record.

Per una **catena orchestrata** in cui il messaggio di un passo contiene l'output del passo
precedente, ricordare che la selezione per nome non discrimina più: il caso sull'orchestratore
va con `knowledge.files` sul solo passo che deve leggere.

## Agenti con skill

Per ogni skill dichiarata in `skills:` un caso che **deve** farla scattare (`skills: [id]`) e
un caso che **non deve** (`noSkills: true`), scritto in modo che un selettore troppo generoso
la scelga lo stesso — un saluto, una domanda di chiarimento, una richiesta che assomiglia al
dominio della skill ma non lo è. Il log dice com'è andata (`SkillExecution` con
`Result=Completed|NoMatch|ValidationFailed` e `MatchedSkills`): è l'evidenza che il triage usa.

Se l'agente **non** ha skill, un solo `noSkills: true` su un caso qualsiasi basta: verifica che
il routing non ne inventi.

## Agenti su un server MCP

Le domande vanno scritte sulla **finestra** e sul **caso vuoto**: «elenca gli impegni dal 1 al 3
gennaio 2030» deve dare la riga «nessun impegno» che il prompt prescrive, senza commenti. Sono
casi che dipendono da una connessione esterna: metterli sotto un tag (`m365`, `vies`) e dirlo
in testa alla suite, così si lanciano con `--only` solo dove la connessione c'è.

Se la fonte **non è pronta**, si collauda la logica con le letture simulate: il contenuto che
darebbe lo strumento incollato nel messaggio, nella forma vera (la busta di una PEC, il JSON di
Graph con gli orari in UTC), con l'istruzione di non chiamare gli strumenti e il tag `simulata`.
Le domande che rendono: il messaggio da riconoscere fra rumore (newsletter, fattura), il messaggio
informale senza dati («la Verdi/Beta è slittata al 16/10, stessa ora»), due elementi nello stesso
giro, la risposta dell'API in una forma che il modello deve convertire.

Un caso che chiede all'agente di **scrivere** (creare un evento, mandare una mail) non si mette
in una suite che gira da sola: lascia tracce fuori dal tenant.

## Orchestratori

Un caso per orchestratore, con l'input nella forma che il primo passo si aspetta e `steps:` sui
passi agente che devono completare. Timeout generoso (`600`): due letture in parallelo più un
confronto stanno nei minuti. La risposta attesa descrive l'output dell'**ultimo** passo.

Se l'orchestratore ha un passo di approvazione umana, il caso si fermerà in `paused` ed uscirà
in errore: non si può collaudare da solo, e la suite lo deve dire nelle note.

## Processi

Il caso base è **dall'avvio al primo compito umano**: `caseData` con i campi del modulo di
avvio, `events` con la sequenza attesa (`InstanceStarted → ActivityCompleted → WorkItemCreated`),
`completed` con le attività automatiche, `waitingAt` con l'attività umana, `caseData` con un
frammento dell'output dell'agent task (la variabile di `outputVariable`).

I **rami** non si collaudano da qui: servirebbe completare il compito umano, e questo la CLI non
lo fa — sarebbe firmare un modulo al posto di una persona. Si collauda **l'ingresso di ogni
ramo**: un'istanza per ogni combinazione del modulo di avvio che porta a un percorso diverso
(materia penale/civile, un campo che decide un gateway).

Il `caseData` passa per YAML 1.2: `true` è booleano, `"true"` è stringa, e il motore confronta
per tipo. Un gateway che non scatta è quasi sempre questo.

## Le attese: quali usare e quando

| Attesa | Quando | Attenzione |
|---|---|---|
| `answer` | sempre: è ciò che tu giudichi | non è verificata dalla CLI |
| `contains` | un dato che **deve** esserci, in forma stabile (un numero, un nome) | non su frasi intere: il modello le riformula |
| `notContains` | una violazione che riconosci da una parola («scadenza», «giorni prima») | scegliere parole che compaiono **solo** nella violazione |
| `matches` | un formato (una riga «DATA — x — y») | regex con `(?i)`; testarla prima |
| `language` | ogni agente con `language:` nel manifest | l'API riporta `it`, `en`… |
| `maxSeconds` | un budget di tempo che ha senso per il cliente | non stringere troppo: staging è lento |
| `knowledge.used/files/notFiles` | ogni agente con profili | il nome si confronta per **contenimento**, senza maiuscole |
| `skills` / `noSkills` | ogni agente con skill, e uno `noSkills` per gli altri | — |
| `steps` | orchestratori | chiave o nome del passo |
| `process.*` | processi | `waitingAt` è l'`id` dell'attività, non il nome |

`noError` vale `true` per default: non serve scriverlo, serve **toglierlo** (`noError: false`)
solo per un caso che si aspetta un errore.

## Quello che non si scrive

- Domande la cui risposta cambia nel tempo («che giorno è», «gli impegni di oggi»): fissare date
  assolute, meglio se lontane e vuote (gennaio 2030).
- Dati personali veri nelle domande: nomi, indirizzi, codici fiscali. La suite è nel repository.
- Segreti, mai, in nessun campo.
- Domande che dipendono da una conversazione precedente senza `conversation:` multi-turno.
