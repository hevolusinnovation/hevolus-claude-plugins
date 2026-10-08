# La notazione: dal manifest al simbolo

Il disegno segue BPMN dove BPMN ha un simbolo, e si ferma lì dove il motore di XRCopilotLab ha
meno concetti. Non è un modellatore: non c'è eventi intermedi, né sottoprocessi espansi, né
compensazioni, perché il motore non li ha.

## Processo BPM (`processes[].spec`)

| Nel manifest | Nel disegno |
|---|---|
| `type: Start` | cerchio sottile, con il nome sotto |
| `type: End` | cerchio spesso, con il nome sotto. Un processo può avere più `End`: ogni uscita ha il suo |
| `type: Task`, `performer: HumanOnly` | riquadro **blu**, icona di persona. Corsia = `roleName` |
| `type: Task`, `performer: AiAssisted` | riquadro **viola**, icona di persona con una scintilla. Corsia = `roleName`. L'agente lavora, la persona verifica o completa |
| `type: Task`, `performer: Automated` | riquadro **verde**, icona di ingranaggio. Corsia «Automatico (agenti)» |
| `type: CallActivity` | riquadro bianco con bordo spesso e «+» in basso: chiama un altro processo |
| gateway `Exclusive` | rombo con **×**: passa un ramo solo, quello la cui condizione è vera, altrimenti quello senza condizione |
| gateway `Parallel` | rombo con **+**: parte ogni ramo |
| `flows[].condition` | etichetta sulla freccia: `variabile = valore` (con `eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `exists`) |
| `flows[].label` | etichetta sulla freccia, se c'è, **al posto** della condizione |
| un ciclo (freccia verso un passo già percorso) | freccia **tratteggiata**, che scende sotto le corsie e risale al passo, con «ritorno» |

### Le corsie

Una corsia per ruolo: quella che il manifest scrive in `roleName`. Le attività con
`assignmentExpression` e senza ruolo stanno in «Assegnato per regola»; quelle senza né l'uno né l'altra
in «Senza ruolo» (che è un difetto del manifest). Le attività automatiche stanno sempre **in fondo**,
in «Automatico (agenti)». Inizio, fine e bivi prendono la corsia del passo che li precede: un bivio dopo
una verifica del referente sta nella corsia del referente.

L'inizio sta nella corsia del primo ruolo di `starterRoles`, se il processo lo dichiara.

### Il pannello di dettaglio

Al clic su un passo la pagina mostra: il tipo, il ruolo o la regola di assegnazione, l'**agent task**
(e l'agente dietro), i tempi attesi e massimi, la variabile che il passo produce, il modulo (campi, tipi,
obbligatori, sola lettura) e, per i bivi, le uscite con le condizioni. Le frecce che entrano e escono dal
passo si colorano di arancione.

## Orchestratore (`orchestrators[].steps` e `flows`)

Gli orchestratori non hanno corsie per ruolo: c'è una sola corsia, «Orchestrazione».

| Step | Nel disegno |
|---|---|
| `agent` | riquadro viola, «Agente · <nome>» |
| `parallelGroup` | riquadro viola «In parallelo», con i nomi degli agenti elencati dentro |
| `handoffGroup` | riquadro viola «In staffetta», con gli agenti |
| `userQuestion` | riquadro blu «Domanda all'utente» |
| `humanApproval` | riquadro blu «Approvazione umana»; due uscite, `approved` e `rejected` |
| `action`, `sendMessage` | riquadro verde |
| `condition`, `switch` | rombo con ×, uscite con `sì`/`no` o con la `label` del caso |
| `terminate` | cerchio spesso |
| `start` | **non disegnato**: l'ingresso è il primo step a cui nessuna freccia arriva (BP094) |

## La panoramica: come si ricava «quando parte»

Un processo non dichiara da sé quando parte: lo dicono le cose che lo raggiungono. La pagina le cerca nel
manifest e le mette in una tabella e in un diagramma, **una corsia per tipo di avvio**.

| Avvio | Dove lo trova | Come lo dice |
|---|---|---|
| **Da solo, a orario** | un agent task con `trigger: scheduled` il cui `outputActions` ha un `webhook` verso `processes.<chiave>.webhook` | «gira ogni ora, a ora piena (ora di Roma) e, quando trova qualcosa da fare, avvia questo processo» + il tetto `maxDailyExecutions` |
| **Dalla chat** | una connessione con `process: <chiave>` → un server MCP che la usa → un agente che usa quel server | «l'assistente X lo avvia quando l'utente glielo chiede». **Gli agenti che sono anche l'agente di un'attività schedulata non contano come chat**: girano da soli |
| **A mano** | `starterRoles` del processo | «si può avviare a mano: Referente…» |
| **Da un altro processo** | una `CallActivity` il cui `calledProcessName` è il nome del processo | «parte da un altro processo: X» |
| **Da un sistema esterno** | `webhook.enabled`, **solo se è l'unico avvio**: negli altri casi il webhook è il canale tecnico che usano la schedulazione e la chat | «si avvia da un sistema esterno» |

I **cron** si traducono in italiano: `0 * * * *` è «ogni ora, a ora piena», `30 18 * * 1-5` è «dal lunedì al
venerdì alle 18:30», `0 17 * * 5` è «ogni venerdì alle 17:00». I cron con giorno del mese o mese (`15 * 1 * *`)
non si traducono: la pagina li mostra com'è scritto («schedulazione «…»»), e l'utente lo sa leggere o lo chiede.

### I tempi

| Che cosa | Come si calcola |
|---|---|
| **Lavoro stimato** | somma di `expectedDurationMinutes` lungo il percorso **più lungo**, senza i giri di ritorno |
| **Tempo massimo** | somma di `maxLeadTimeMinutes` (per gli orchestratori `timeoutSeconds`) lungo il percorso più lungo |
| **Passi senza tempo** | non pesano nel conto, e la pagina dice quanti sono su quanti |

Sono **tempi di lavoro dichiarati**, non attese: fra un passo e l'altro una persona può metterci di più
o di meno. Il «tempo massimo» è il limite oltre il quale il motore avvisa, non una promessa al cliente.

## Il passo per passo

Per ogni passo, in ordine di colonna e di corsia, una frase: «chi lo fa» (la persona, il sistema da solo, un
agente che prepara e una persona che controlla), il tempo dichiarato, e dove si va dopo («si va al passo 7»,
«si torna al passo 6»). Dopo un bivio si dice per ogni uscita **quando** scatta: le uscite verso lo stesso
passo si raggruppano («se «udienza» o «scadenza», si va al passo 17»). I numeri sono quelli dei cerchi
sul disegno, e restano uguali nel PDF.

## Cosa il disegno non mostra

- **I tempi di attesa reali**: solo `expectedDurationMinutes` e `maxLeadTimeMinutes` del manifest.
- **I dati che viaggiano fra i passi** oltre al nome della variabile prodotta: per i template e i
  segnaposto si legge il manifest.
- **Le soglie, le scadenze e le notifiche** dei work item: sono configurazione del motore, non del grafo.
- **Se il processo funziona**: il disegno è la forma dichiarata, non l'esito di un'esecuzione. Per quello
  c'è `xrcopilotlab-bp instances show <id>` e la skill `xrcopilotlab-blueprint-test`.

## Limiti del layout

Il disegno è automatico. Ogni passo sta in una colonna (la lunghezza del cammino più lungo dall'inizio) e
in una corsia (il ruolo). Le frecce sono spezzate ad angolo retto e **non evitano sempre** i riquadri
che incontrano: succede quando un ramo salta più colonne. Se un incrocio rende ambigua la lettura,
si seleziona il passo: le sue frecce si colorano. Il layout non è un impegno: un manifest identico
produce sempre lo stesso disegno, ma una modifica può spostare molti passi.
