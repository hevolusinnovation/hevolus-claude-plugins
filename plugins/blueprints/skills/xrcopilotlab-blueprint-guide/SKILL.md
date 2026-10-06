---
name: xrcopilotlab-blueprint-guide
description: Scrive le due guide di un blueprint XRCopilotLab applicato, agganciate agli stessi punti di demo. (1) La guida per il cliente, a story slides in linguaggio semplice — titolo-messaggio, corpo, approfondimento, slide di demo, note per Sales e AI Specialist — da cui nascono la pagina web e il deck: è il canovaccio della sessione. (2) La guida tecnica per l'AI Specialist: il flusso in agenti, processi e collegamenti, e per ogni demo preparazione, passi, cosa deve comparire, piano B e pulizia. Si consegnano come due artifact, con la sorgente Markdown dentro. Quella per il cliente non riporta i risultati dei test; la tecnica li usa per dire che cosa è sicuro mostrare. Non esegue test né tocca il tenant. Usa quando l'utente chiede di "scrivere la guida per il cliente", "la guida tecnica della demo", "preparare la demo dal cliente", "le slide per i sales". NON per le domande di prova né per il collaudo (xrcopilotlab-blueprint-test), né per scrivere o applicare il manifest (xrcopilotlab-blueprint).
---

# xrcopilotlab-blueprint-guide

Porta un blueprint da «funziona, e sappiamo come» a «il cliente capisce che cosa ha, come si usa e
come è fatto» — e lo fa **durante una demo dal vivo**, che è il punto difficile: spiegare in modo
semplice un processo complesso mentre lo si mostra funzionare.

Le demo dal cliente le conducono **due persone** — un **Sales** e un **AI Specialist** — oppure,
a volte, il solo AI Specialist. Per questo le guide sono **due**, con due lettori, agganciate agli
stessi punti di demo:

| | La guida per il cliente | La guida tecnica |
|---|---|---|
| Dove vive | **artifact** «<Scenario> — guida», con la sorgente `guida.md` | **artifact** «<Scenario> — demo (interna)», con la sorgente `guida-tecnica.md` |
| Lettore | il cliente, e chi presenta | l'AI Specialist, prima e durante la demo |
| Forma | story slides a tre livelli (§2), con le **slide di demo** | un documento per demo, con gli stessi codici `D1`, `D2`… (§3) |
| Linguaggio | il suo: «pratica», «udienza», «assistente» | il nostro: agenti, agent task, processi, server MCP |
| Serve a | **canovaccio** della sessione: la storia che si racconta, e dove ci si ferma a mostrare | **eseguire** la demo: che cosa preparare, che cosa cliccare, che cosa deve comparire, come spiegarlo se chiedono, che cosa fare se va storto |
| Si condivide | la pagina e il deck, **con il cliente** | con chi conduce la demo, **mai** con il cliente |
| Collaudo | **mai**: niente esiti, niente difetti | sì: che cosa è sicuro mostrare dal vivo e che cosa è fragile |

**Il filo è la guida per il cliente.** La tecnica non racconta una storia sua: segue le stesse slide,
e a ogni slide di demo dice all'AI Specialist come portarla sullo schermo.

**La guida per il cliente non parla di collaudo.** Niente esiti, numeri di domande superate,
percentuali, grafici dei risultati, difetti trovati e corretti, «provato con la posta vera». Al
cliente interessa come funziona il suo ambiente, non come l'abbiamo verificato. La guida tecnica sì:
chi fa la demo deve sapere che cosa regge e che cosa no.

## Dove vivono le guide: due artifact, non un repository

Chi usa questa skill spesso **non ha repository**: un Sales, un AI Specialist che lavora dal plugin.
Per questo il risultato sono **due artifact** su claude.ai, non due file:

| Artifact | Titolo | Pagina | Sorgente pubblicata con la pagina |
|---|---|---|---|
| Per il cliente | «<Scenario> — guida» (es. «Conoscenza degli associati — guida») | story slides che si scorrono (§5) | `guida.md` |
| Interno | «<Scenario> — demo (interna)» | documento di lavoro per l'AI Specialist | `guida-tecnica.md` |

- **La sorgente sta dentro l'artifact.** Il Markdown si scrive nella cartella di lavoro della sessione
  (lo scratchpad) e si pubblica insieme alla pagina come file di supporto (`files`). Chi riprende la
  guida in un'altra sessione, o un collega, non cerca un file: trova l'artifact con
  `Artifact` `action: "list"`, legge la sorgente con `action: "read"` e `path: "guida.md"`, la
  modifica e ripubblica **allo stesso `url`** — il link già dato al cliente non cambia.
- **Due artifact separati, sempre.** Quello interno contiene nomi dei componenti, stato del collaudo e
  fragilità: non è una sezione nascosta della pagina per il cliente, perché chi riceve un link vede
  tutto ciò che il link contiene.
- **Privati alla nascita.** Condividerli è una scelta dell'utente, dalla pagina: il cliente riceve solo
  il primo.
- **Il repository dell'assessment è facoltativo.** Se c'è (`../hevolus-assessment/customers/<cliente>/`)
  e l'utente lo vuole, si salva anche lì una copia dei due Markdown (`guida-<scenario>.md`,
  `guida-tecnica-<scenario>.md`); il commit solo se lo chiede. La copia non sostituisce l'artifact:
  il riferimento resta l'artifact.
- **Mai** nel repository di prodotto: contiene nomi e casi del cliente. Se serve averla accanto al
  blueprint, va nel suo archivio con `xrcopilotlab-bp files put <file> --kind doc --tag <TAG>`.

## Chi fa che cosa

| Chi | Fa | Non fa |
|---|---|---|
| [`xrcopilotlab-blueprint`](../xrcopilotlab-blueprint/SKILL.md) | scrive e applica il manifest | spiegarlo al cliente |
| [`xrcopilotlab-blueprint-test`](../xrcopilotlab-blueprint-test/SKILL.md) | collauda, giudica, segnala, scrive **le domande di prova** (l'artifact «<Scenario> — domande di prova») | la guida |
| **Questa skill** | scrive **le due guide** e le pubblica come **due artifact** (la pagina per il cliente, la pagina interna), più il deck della prima se richiesto | eseguire test, toccare il tenant, aprire issue |
| [`xrcopilotlab-blueprint-demo`](../xrcopilotlab-blueprint-demo/SKILL.md) | il **brief per l'agenzia di marketing**: gli scenari vendibili ad altri clienti, anonimi | la guida di un cliente |

Le guide **leggono**: il manifest, le suite, le domande di prova, i materiali della demo. Non
eseguono niente: se per la demo serve un dato che nella casella o nel tenant non c'è, la guida
tecnica lo scrive fra le cose da preparare, e lo prepara una persona (o `xrcopilotlab-blueprint-test`).

## Se all'apertura compare che il plugin è indietro

Una riga come «c'è il plugin blueprints 2.19.0, questo è il 2.18.0: skill o CLI nuove…» arriva
all'inizio della sessione da un hook del plugin. **Dilla all'utente a parole**, una riga, con i due
comandi (`/plugin marketplace update hevolus`, `/plugin update blueprints@hevolus`) e il riavvio
della sessione: la guida si scrive meglio con le skill aggiornate. Non puoi aggiornare tu, e non è
urgente: se l'utente è a metà di una guida, si finisce e si aggiorna dopo.

## 0. Se `$ARGS` è vuoto

Orientare e fermarsi: a cosa servono le due guide, quali esistono già (`Artifact`
`action: "list"`: i titoli «… — guida» e «… — demo (interna)»; e, se c'è il repository,
`../hevolus-assessment/customers/*/guida-*.md`), quali blueprint ci sono (non stanno nel repository: `xrcopilotlab-bp status` sull'ambiente, oppure
si chiede il tag e si scarica il manifest con `xrcopilotlab-bp pull --tag <TAG>`). Poi
le domande: per quale cliente e quale scenario, e se la sessione la conducono in due o l'AI
Specialist da solo.

## 1. Raccogliere le fonti

| Fonte | Dove | Per il cliente | Per la tecnica |
|---|---|---|---|
| Il manifest | `xrcopilotlab-bp pull --tag <TAG>` (dall'archivio del tenant), o la cartella di lavoro `~/.xrcopilotlab/blueprints/<TAG>/` | il flusso: i passi, chi li fa, cosa passa da uno all'altro; il «cosa non fai» degli agenti; i compiti e i loro tempi; i lavori programmati; le versioni (i blocchi `vN`); ciò che è fuori perimetro | tutto questo **con i nomi veri**: agenti, agent task e il loro cron, processi e passi, orchestratori, server MCP e i loro tool, ruoli |
| La suite | `~/.xrcopilotlab/blueprints/<TAG>/tests/<nome>.tests.yml`, o dall'archivio con `files get` (`files ls --tag <TAG>` per il percorso) | **solo esempi**: la domanda e ciò che la risposta deve contenere | gli input pronti da usare in demo, le risposte sbagliate da riconoscere al volo |
| Le domande di prova | l'artifact «<Scenario> — domande di prova» (`path: "demo-domande.md"`), o `../hevolus-assessment/customers/<cliente>/demo-domande-*.md` | **solo esempi**, nella lingua del cliente; la tabella di stato **non** si riporta | la tabella di stato: che cosa è pronto, che cosa no |
| I materiali della demo | `demo-materiali-*.md`, `demo-workflow-*.md`, una guida per chi conduce già scritta | — | le mail da inviare, i dettati da incollare, i percorsi da fare a mano nei processi |
| L'ultimo giudizio | `giudizio.md` dell'ultimo report: `xrcopilotlab-bp test report --tag <TAG>` lo scarica in `~/.xrcopilotlab/blueprints/<TAG>/reports/<aaaammgg-hhmmss>/` | **mai** | che cosa è sicuro mostrare dal vivo, che cosa è fragile, lo stato lasciato sul tenant |
| Il dossier di assessment | `../hevolus-assessment/customers/<cliente>/README.md` | **le criticità dette dal cliente con parole sue** | le domande tecniche che il cliente ha già fatto |
| Le guide già pubblicate | `Artifact` `action: "read"`, `path: "guida.md"` / `"guida-tecnica.md"` | la versione da cui ripartire | idem |

**Senza repository** il manifest si prende con `pull`, e il resto lo fornisce l'utente: le domande di
prova sono un artifact (lo stato del collaudo è nella loro tabella in testa), l'ultimo giudizio lo ha
chi ha fatto il collaudo, il dossier chi ha fatto l'assessment. Si
chiede una volta, elencando che cosa manca; se una fonte non arriva si scrive lo stesso, e lo si
dichiara: nella guida tecnica la scheda dice «non collaudato» invece di «sicuro», e gli esempi del
cliente vengono dalle istruzioni degli agenti invece che dalla suite.

## 2. La guida per il cliente

La sorgente è `guida.md`, pubblicata con l'artifact per il cliente. Se esiste una guida per il
cliente in una forma precedente — un artifact, o un file nel repository dell'assessment — si riscrive
in questa forma, togliendo ciò che riguarda il collaudo; se era già un artifact, si ripubblica allo
stesso `url`.
Se esiste una guida scritta per **chi conduce la demo** (per esempio `guida-bpm-agenda.md` di Studio
Polis, `guida-demo-bilancio-aggregato.md` di FinLogic), è la **fonte** della guida tecnica (§3): la
si riprende lì, e il vecchio file non si aggiorna più.

### 2.0 Il formato: story slides a tre livelli

La guida si scrive **come una sequenza di slide**, non come un documento: da quella stessa sorgente
nascono la pagina web per il cliente e **il deck per i sales**, senza riscrivere niente. Ma resta
**una guida**: chi la apre da solo, senza nessuno che la presenti, deve capire tutto. Per questo ogni
slide ha tre livelli, e ciascuno ha un lettore diverso:

| Livello | Che cosa porta | Chi lo vede |
|---|---|---|
| **Titolo** | il messaggio, in una frase con un verbo | tutti |
| **Corpo** | ciò che serve per capire la slide: fino a **90 parole** | tutti: è la slide del deck |
| **Approfondimento** | il perché, il come, l'esempio, il caso limite: da **50 a 150 parole**, scritte per il cliente | la guida lo mostra sotto la slide; nel deck diventa la nota del relatore |
| *Note per chi presenta*, per ruolo | **Sales** — il filo, la domanda alla sala, il passaggio di parola; **AI Specialist** — il dettaglio tecnico da tenere pronto, il rimando alla demo; **Da soli** — come condensare le due parti quando c'è il solo AI Specialist. Tutte facoltative, brevi | **solo** il deck, in coda alla nota |

```markdown
---

<!-- slide: giornata-pec · atto: la storia -->
## Lunedì, 15:05: arriva una PEC, e la pratica è già pronta

La casella dell'agenda si legge ogni minuto, e la PEC si apre fino al messaggio della cancelleria
che contiene. La referente trova la proposta già compilata:

- autorità, sezione e giudice
- parti e numero di ruolo
- data e ora dell'udienza

Li controlla sul testo originale, sceglie il professionista, e l'impegno entra nel calendario comune.

> **Approfondimento.** Una PEC di cancelleria porta spesso quattro date: quella della busta, quella
> del provvedimento, l'udienza differita e la nuova udienza. La proposta ne sceglie una sola, e il
> testo originale resta accanto: la referente verifica, non ricopia. Se la data del modulo e quella
> del testo non coincidono, l'impegno non si scrive: vede i due valori e decide lei.

> **Sales.** Chiedere quante PEC al giorno arrivano oggi in casella; poi passare la parola: «ve la
> facciamo vedere».

> **AI Specialist.** Se chiedono come si legge la busta: il tool scompone l'allegato `.eml`. Poi
> slide `demo-D2`.
```

Le regole della slide:

- **Il titolo è il messaggio**, una frase intera con un verbo: «La referente decide, l'assistente
  propone», non «Ruoli». Letti di fila, **i soli titoli raccontano la storia**: è la prova da fare
  prima di consegnare (elencare gli `##` e leggerli come un paragrafo).
- **Un'idea per slide.** Se servono due «e poi», sono due slide.
- **Il corpo si capisce senza l'approfondimento.** Fino a 90 parole: una o due frasi, più **uno** fra
  un elenco di quattro punti al massimo, una tabella di cinque righe, un disegno, uno scambio
  domanda/risposta. Una slide con una frase sola è una slide povera: dice il messaggio, ma non lo
  spiega.
- **L'approfondimento è per il cliente, non per chi presenta.** Parla a «voi», con un esempio
  concreto o il caso limite: che cosa succede se il dato manca, se due date non tornano, se la
  persona non risponde. Nessuna indicazione di regia («far notare», «chiedere alla sala»): quella va
  nelle note per chi presenta. Si scrive in `> **Approfondimento.**`, e c'è su ogni slide di
  contenuto; copertina e divisoria ne fanno a meno.
- **Le note per chi presenta sono per ruolo**: `> **Sales.**`, `> **AI Specialist.**`,
  `> **Da soli.**`. Facoltative e brevi; nella pagina per il cliente non si vedono mai. Il **Sales**
  tiene il filo della storia e la sala; l'**AI Specialist** entra quando serve il dettaglio o la
  demo; **Da soli** dice che cosa tagliare o dire in altro modo quando l'AI Specialist fa tutte e due
  le parti (di solito: meno domande alla sala, la demo annunciata con una frase).
- **Il termine tecnico non entra nemmeno nelle note del Sales.** Nelle note dell'AI Specialist sì,
  perché sono per lui: il nome dell'agente, del passo, del tool, e il rimando alla demo.
- **Il commento `<!-- slide: … · atto: … -->`** dà a ogni slide un nome stabile e l'atto a cui
  appartiene: serve a riordinare, a tagliare una versione breve e a ritrovare la slide quando si
  aggiorna.
- **`---` separa le slide**, e nient'altro sta fra due separatori.

### 2.1 Gli atti, in quest'ordine

Da 14 a 22 slide di contenuto, **più 3–5 slide di demo** (§2.6) messe dove la storia ha appena
promesso qualcosa. I titoli delle slide sono esempi: si scrivono nella lingua del cliente.

| Atto | Slide | Che cosa racconta | Da dove |
|---|---|---|---|
| **Apertura** | 1–2 | La copertina (nome dello scenario, per chi) e **la frase**: che cosa fa per lui, con il suo lessico. «Chiedete di un associato e in due minuti avete la sua scheda, con la mappa della sede.» | manifest, descrizione |
| **Il problema** | 1–2 | Le criticità del cliente **con le sue parole**, citate: è la slide che fa annuire la sala | dossier di assessment |
| **La storia** | 4–6 | Una giornata tipo, **un momento per slide** (un'ora, una persona, ciò che vede), poi **il disegno** del flusso in una slide sua | manifest |
| **Chi fa che cosa** | 2–3 | Le tre colonne AI · persone · regole fisse in una slide; **ciò che l'AI non fa** in un'altra | manifest (istruzioni degli agenti, compiti delle persone, passi automatici) |
| **Provatelo voi** | 3–5 | **Una domanda di esempio per slide**, con una risposta possibile | suite, domande di prova, istruzioni degli agenti |
| **Che cosa cambia** | 1–2 | Per ogni criticità della slide «Il problema», che cosa cambia: la stessa lista, ripresa | dossier di assessment |
| **Come è fatto** | 2–3 | Il progetto scritto: il ciclo in una slide, i vantaggi in una, le versioni in una | manifest (versioni), CLI |
| **Chiusura** | 1–2 | Che cosa non fa e che cosa serve da voi per partire; **il prossimo passo** («ci indicate le due caselle, e il vostro ambiente si crea in un giorno») | manifest (note, segnaposto, `TODO`) |
| *Appendice* | a piacere | Dopo una slide divisoria «Per chi vuole i dettagli»: il glossario, e come è costruito per il tecnico del cliente (permessi, credenziali, quanti assistenti e compiti). Si mostra solo se chiesto | manifest |

**La versione breve** per un primo incontro commerciale è un taglio, non un altro file: apertura,
problema, due slide di storia con il disegno, una di «chi fa che cosa», un esempio, chiusura. Le
slide da tenere si dicono con i loro nomi nel messaggio all'utente.

### 2.2 La storia

Non «il sistema riceve la richiesta e la instrada»: **«Lunedì mattina Paola, dell'ufficio
associati, deve chiamare un'azienda che non conosce. Scrive in chat il nome…»**. Una persona, un
caso, un'ora del giorno, e ciò che vede sullo schermo passo per passo — **un momento per slide**, con
l'ora nel titolo o in testa al corpo («Venerdì, 9:40»), così la sequenza si legge come un racconto. I passi che nel manifest sono
tecnici (una riduzione del profilo, uno switch) nella storia non compaiono, oppure compaiono per ciò
che producono («se l'indirizzo c'è, sotto compare la mappa»).

Il **flusso** ha una slide sua, alla fine della storia, ed è **l'unico disegno della guida**: segue
la storia, non il grafo del motore, al massimo otto passi. Nel Markdown si scrive come elenco numerato
con chi fa ogni passo; la pagina e il deck lo disegnano. Niente Mermaid, niente riquadri con dentro
frasi: [`references/grafici.md`](references/grafici.md).

### 2.3 Chi fa che cosa

Sono le slide che il cliente guarda due volte. **Una slide** per le tre colonne, sempre le stesse,
con due o tre voci ciascuna (le altre vanno nell'approfondimento):

| L'AI | Le persone | Regole fisse |
|---|---|---|
| legge, cerca, confronta, riassume, propone | decidono, approvano, correggono | fanno sempre la stessa cosa, senza interpretare |
| *es.* legge la scheda dell'associato e compone il report | *es.* decide se chiamare l'azienda; approva la pratica | *es.* verifica la partita IVA sul registro europeo; mette il punto sulla mappa |

Poi, **in una slide sua**, **che cosa l'AI non fa** — qui, e solo qui, fino a cinque punti brevi —, preso dai «cosa NON fai» delle istruzioni degli agenti e detto in
positivo per il cliente: non inventa un dato che non trova — lo dice; non dà giudizi sull'azienda;
non scrive nei vostri sistemi; non manda niente a nessuno senza che una persona abbia detto sì. È qui
che si spiegano anche i **dati mancanti**: «quando un dato non c'è, la scheda lo scrive, invece di
riempire il buco».

### 2.4 Provatelo voi: domande ed esempi di risposta

Il cliente capisce un assistente vedendolo rispondere. Da tre a cinque esempi, **uno per slide**,
scelti perché coprono i **modi diversi** di usarlo, non perché sono i più facili:

| Tipo di esempio | Perché c'è | Quanti |
|---|---|---|
| **La domanda di tutti i giorni** | è ciò che farà il novanta per cento delle volte | uno o due |
| **La domanda scritta male** — di fretta, con abbreviazioni, senza verbo | fa vedere che non serve una formula | uno |
| **Il dato che manca** | la risposta dice «non indicato» invece di inventarlo | uno |
| **La domanda fuori compito** | la risposta dice che cosa l'assistente non fa, e che cosa fa invece | uno |
| **La conferma prima di agire**, se lo scenario scrive qualcosa | l'assistente rilegge e aspetta il sì | uno |

Se i tipi utili sono più di cinque, quelli in più diventano l'approfondimento di una slide vicina, non slide
nuove. Per ciascuna slide:

- **il titolo** dice che cosa si vede: «Un rinvio scritto di fretta diventa una pratica completa»;
- **chi la fa e dove**, in mezza riga («la referente, in chat, dopo la riunione»);
- **la domanda**, come la scriverebbe lui — dalla suite o dalle domande di prova, riportata al suo
  lessico e con nomi inventati;
- **una risposta possibile**, scritta per esteso come comparirebbe sullo schermo: costruita dalle
  attese della suite e dal formato che le istruzioni dell'agente prescrivono, **accorciata** a ciò
  che il cliente deve vedere;
- **nell'approfondimento**, che cosa notare nella risposta e perché («la data è scritta per esteso;
  il numero di ruolo c'è perché era nel testo»), e che cosa succede dopo il sì.

Lo scambio domanda/risposta **è** il corpo della slide, con al più la riga di chi chiede.

Due regole che non si derogano:

1. **Una risposta possibile non promette ciò che il manifest non fa.** Ogni dato che vi compare deve
   poter venire dalle fonti che quell'agente ha davvero; ogni azione deve essere fra quelle che ha.
   Se la risposta nomina una mappa, nel manifest c'è la mappa.
2. **Si dice che è un esempio.** Una riga sulla prima slide dell'atto: «le parole cambiano da una volta
   all'altra, il contenuto no». Nessun esito, nessun «è stata provata».

### 2.5 Come è fatto il vostro ambiente

Il manifest, per il cliente, è **il progetto del suo ambiente**: un documento che dice che cosa c'è
e come si comporta. È l'atto che risponde a «ma come funziona, dietro?», e si spiega in tre
slide.

**Che cosa contiene** (può stare nell'approfondimento della slide del ciclo, o in una slide sua), in un elenco che il cliente riconosce: gli assistenti con il loro compito, i
percorsi delle pratiche con i compiti delle persone e i loro tempi, i lavori programmati (con
l'orario), i collegamenti ai suoi servizi. Con i numeri veri, presi dal manifest: «quattordici
assistenti, quattro percorsi di pratica, tre lavori programmati».

**Come nasce e come cambia** — una slide, con il ciclo come **elenco numerato**: si scrive il
progetto → vi mostriamo l'elenco di ciò che verrà creato o cambiato → il vostro sì → l'ambiente viene
creato → una correzione diventa una versione nuova, che tocca solo ciò che cambia.

**Che cosa gli conviene** — una slide con i **cinque** vantaggi che contano per quel cliente, detti
come vantaggi suoi e non come funzioni della CLI; gli altri nell'approfondimento:

| Vantaggio | Come si dice al cliente |
|---|---|
| Si vede prima di farlo | «Prima di toccare il vostro ambiente vi mostriamo l'elenco di ciò che cambierà, e si procede solo dopo il vostro sì» |
| È ripetibile | «Lo stesso ambiente si ricrea uguale, per un'altra sede o in produzione, senza rifarlo a mano» |
| Si migliora senza rifarlo | «Una correzione tocca solo ciò che cambia: il resto resta com'è, e nessuno si accorge dell'aggiornamento se non per il miglioramento» |
| Ha una storia | «Ogni versione ha un numero e un perché: sapete sempre che cosa è cambiato e quando» |
| Non contiene segreti | «Le password dei vostri servizi non stanno nel progetto: stanno in una cassaforte, e il progetto le cita per nome» |
| Non tocca ciò che non è suo | «Se nel vostro ambiente c'è già qualcosa con lo stesso nome, il progetto si ferma invece di sovrascriverlo» |
| Si toglie per intero | «Se decidete di non usarlo, si smonta tutto ciò che è stato creato, senza lasciare pezzi» |

Le **versioni** chiudono l'atto, in una slide sua, come **tabella** data → che cosa è cambiato: cinque o sei tappe prese dai blocchi
`vN` in testa al manifest, ciascuna con una riga di **che cosa è cambiato per il cliente** — «le PEC
si aprono fino al messaggio che contengono», «la riunione del venerdì si detta in chat». Il perché
di una versione si dice come **cosa che il cliente ci ha chiesto o mostrato**, mai come prova fallita
o difetto trovato.

### 2.6 Le slide di demo

Il punto difficile di una sessione è il passaggio dalla spiegazione alla prova: se la demo arriva
senza preavviso il cliente guarda lo schermo senza sapere che cosa cercare, e se la spiegazione dura
troppo si perde prima di vedere qualcosa. Le **slide di demo** tengono insieme le due cose: la slide
dice **che cosa state per vedere e che cosa notare**, poi si mostra, poi si torna alle slide.

```markdown
---

<!-- slide: demo-D2 · atto: la storia · demo: D2 -->
## Vediamolo: una PEC diventa una pratica, e la pratica un impegno in calendario

Adesso mandiamo una PEC di prova alla casella dell'agenda. In un paio di minuti:

- la mail viene presa in carico, e chi scrive riceve la conferma
- la referente trova la proposta già compilata, con il testo originale accanto
- dopo il suo sì, l'udienza compare nel calendario comune

> **Approfondimento.** Guardate che cosa succede quando un dato manca: la proposta lo scrive
> «non indicato», e la referente lo completa. Nessun passaggio arriva in calendario senza che una
> persona l'abbia visto.

> **Sales.** «Adesso ve lo facciamo vedere»: annunciare le tre cose, poi passare la parola.

> **AI Specialist.** Guida tecnica §D2. Mail M5 già pronta in bozza.

> **Da soli.** Annunciare le tre cose mentre si invia la mail: il tempo di attesa è quello.
```

Le regole:

- **Da tre a cinque demo**, numerate `D1`, `D2`… nell'ordine in cui compaiono. Il codice è lo stesso
  nella guida tecnica: è il gancio fra le due. Il commento della slide lo porta: `demo: D2`.
- **Si mette dove la storia ha appena promesso qualcosa**: dopo la slide della PEC, la demo della PEC.
  Mai due demo di fila, mai una demo prima che il cliente sappia che cosa aspettarsi.
- **Il titolo comincia con «Vediamolo:»** e dice il risultato, non l'azione tecnica: «una PEC
  diventa una pratica», non «invio del messaggio alla casella».
- **Il corpo elenca che cosa guardare**, da due a quattro punti, nell'ordine in cui compariranno. È
  la lista che il cliente tiene a mente mentre guarda.
- **L'approfondimento dice che cosa notare** — il dettaglio che fa capire il resto — ed è per chi
  legge la guida dopo, senza la demo.
- **Le note dell'AI Specialist rimandano alla guida tecnica** (`§D2`), e dicono che cosa deve essere
  già pronto. Il passo per passo non sta qui.
- **Ogni demo ha un piano B** nella guida tecnica. Se la demo salta, la slide si legge comunque: è
  per questo che il corpo dice che cosa si sarebbe visto.
- **Le domande di prova dell'atto «Provatelo voi» possono diventare demo**: la slide dell'esempio
  resta, la demo la esegue dal vivo. In quel caso la slide di esempio porta `demo: Dn` nel commento,
  e non si aggiunge una slide di demo a parte.

## 3. La guida tecnica per l'AI Specialist

La sorgente è `guida-tecnica.md`, pubblicata con l'artifact interno. È un
**documento**, non slide, ed è **interno**: il cliente non lo vede mai. La struttura completa, con
un esempio per sezione, è in [`references/guida-tecnica.md`](references/guida-tecnica.md). In breve:

| # | Sezione | Che cosa contiene |
|---|---|---|
| 0 | **Scheda** | scenario, versione del manifest, ambiente della demo (tenant, casella, topic, per nome), chi conduce, durata; che cosa è **sicuro** mostrare dal vivo e che cosa è **fragile**, dall'ultimo giudizio |
| 1 | **Il flusso, in tecnico** | la mappa dei componenti in tabelle — agenti, agent task con il loro orario, processi e passi, orchestratori, server MCP e tool —, senza disegni; e **il ponte**: per ogni parola della guida per il cliente, il componente che c'è dietro («la referente verifica» → passo `verifica` del processo, ruolo *Referente agenda civile*) |
| 2 | **La scaletta** | la tabella della sessione: slide per slide, chi parla (Sales, AI Specialist), dove cadono le demo, i tempi; e la **scaletta da soli** |
| 3 | **Preparazione** | il giorno prima e l'ora prima: dati da mettere in casella o sul tenant, compiti da avere già aperti, schede del browser, account, il piano B pronto |
| 4 | **Le demo `D1`…`Dn`** | per ognuna: la slide in cui cade; che cosa deve capire il cliente; che cosa preparare; **i passi**, con che cosa dice il Sales mentre l'AI Specialist esegue; **che cosa deve comparire**; **sotto il cofano** (il meccanismo, per chi chiede); **se va storto** (sintomo → che cosa fare, piano B); pulizia |
| 5 | **Domande tecniche** | le domande che un tecnico del cliente fa, con la risposta vera: permessi, dati, dove girano i modelli, che cosa succede se… |
| 6 | **Limiti e cose da non mostrare** | ciò che non c'è, ciò che è fragile dal vivo, e come dirlo senza girarci intorno |
| 7 | **Dopo la demo** | pulizia del tenant e della casella, che cosa lasciare al cliente (il link alla guida, le domande di prova) |

Le regole che contano:

- **Segue la guida per il cliente, non la rifà.** Le demo hanno gli stessi codici, le slide si
  citano per nome (`giornata-pec`). Se la storia cambia, cambia prima la guida per il cliente.
- **Il linguaggio è tecnico, e preciso**: nomi veri di agenti, passi, tool, ruoli, come stanno sul
  tenant (`BP-<TAG>-…`). Ma **nessun segreto**: né chiavi, né token, né indirizzi con credenziali;
  gli id di istanze e run solo se servono a ritrovare qualcosa durante la demo.
- **Ogni demo si può fare in due modi**: dal vivo e con il piano B (un input simulato incollato in
  chat, un compito già completato, uno screenshot). Il piano B è scritto, non improvvisato.
- **«Che cosa deve comparire» è verificabile**: una frase, un campo, un evento in calendario — ciò che
  l'AI Specialist controlla con gli occhi prima di dire «ecco».
- **I tempi sono veri**: quanto ci mette la casella (il giro dei task schedulati), quanto un agente,
  quanto un passo del processo. È l'informazione che serve per riempire l'attesa.
- **Lo stato del collaudo si usa**, e si cita con la data del giudizio: «fragile dal vivo — due volte
  su tre al 24/09». Non per il cliente: per decidere che cosa mostrare.

## 4. Le regole di scrittura

Per la **guida per il cliente** — il dettaglio, con il vocabolario e gli esempi prima/dopo, in
[`references/linguaggio.md`](references/linguaggio.md). Il vocabolario dello stesso file, letto al
contrario, è il **ponte** della guida tecnica (§3, sezione 1):

- **Frasi corte, parole sue.** Il lessico del cliente, non il nostro: «associato», «pratica»,
  «udienza», non «entità», «istanza», «record».
- **Nessun termine tecnico senza una spiegazione nella stessa frase**, e i più tecnici non
  compaiono affatto: orchestratore, topic, profilo, MCP, token, gateway, inventario, run.
- **Nessun dato del tenant**: id di istanze, run, webhook, chiavi, indirizzi di API, nomi di file
  interni. Nessun codice `BPxxx`, nessun nome di componente o di repository.
- **Nessun risultato di collaudo**: né numeri, né esiti, né difetti, né «provato con…». Nemmeno
  come rassicurazione.
- **Niente triage**: al cliente si dice *che cosa* il suo ambiente non fa, non *dove* nel codice.
- **Titoli che raccontano**: ogni `##` è una frase con un verbo, e i titoli letti di fila fanno la
  storia. «Ruoli», «Vantaggi», «Esempi» sono etichette, non titoli.
- **Ciò che non sta nel corpo va nell'approfondimento**, non si perde: la guida si legge anche senza
  chi la presenta.
- **Onestà sul perimetro**: ciò che è fuori dal manifest si scrive nell'atto di chiusura, non si tace; e
  una risposta di esempio non mostra capacità che il manifest non ha.
- **I nomi degli esempi** sono veri solo se il cliente li ha consegnati per la prova; altrimenti
  inventati, e il documento lo dice.

## 5. Mostrarle, poi pubblicarle

1. **Il Markdown all'utente**, prima di tutto, con **l'elenco dei titoli** letti di fila in cima al
   messaggio: se non raccontano la storia da soli, la guida non è pronta. Chi conosce il cliente sa
   se la storia è quella giusta, se gli esempi sono quelli che farà davvero e se una frase suonerà
   male: è lui a dare il sì.
2. **L'artifact per il cliente** — la pagina da proiettare o condividere, con `guida.md` fra i
   `files`. Come si costruisce, l'organizzazione da verificare prima e l'apertura nel browser:
   [`references/pagina-web.md`](references/pagina-web.md). La copia HTML per la sala, da aprire senza
   account, si offre come file da scaricare, non si lascia nello scratchpad.
3. **Il deck**, se l'utente lo chiede: si parte con `Artifact` `action: "quickstart"`,
   `intent: "slides"`, e si usa il tipo Slides che indica (si scarica come .pptx o PDF). La
   corrispondenza è uno a uno, senza riscrivere: una slide del Markdown è una slide del deck, il
   titolo resta il titolo, il corpo il corpo; la nota del relatore è l'approfondimento seguito dalle
   note per ruolo (Sales, AI Specialist, Da soli); le slide di demo hanno un aspetto loro, riconoscibile
   a colpo d'occhio; il flusso si disegna con i colori di
   [`references/grafici.md`](references/grafici.md). L'appendice resta
   in coda, dopo la divisoria. Se l'utente chiede la versione breve, si usano i nomi delle slide del
   taglio (§2.1).
4. **L'artifact interno**: prima il Markdown all'utente, poi la pagina — un artifact separato,
   privato, da non condividere con il cliente — con `guida-tecnica.md` fra i `files`. Stesso
   contratto della pagina per il cliente
   ([`references/pagina-web.md`](references/pagina-web.md)), trattamento da documento di lavoro: indice
   delle demo, ogni demo apribile, i passi come elenco da spuntare con la vista.
5. **Nel messaggio finale**, i due link, ciascuno con chi lo deve ricevere («questo al cliente»,
   «questo solo a chi conduce»), e come si ritrovano (`/artifacts`, o la galleria su claude.ai).
6. **La copia nel repository dell'assessment**, solo se c'è e l'utente la vuole; il commit solo se lo
   chiede.

## 6. Quando aggiornarle

Si aggiorna **l'artifact**, non se ne crea uno nuovo: si legge la sorgente dall'artifact
(`action: "read"`, `path`), si modifica, si ripubblica allo stesso `url` insieme alla pagina. Se la
guida esiste anche nel repository, la copia si riallinea dopo.

A ogni versione del manifest che cambia il flusso, ciò che un assistente sa fare o ciò che il
cliente noterebbe. Si aggiornano, per nome, le slide degli esempi che ne sono toccati, quelle della
chiusura e la slide delle versioni; la storia resta finché il flusso non cambia. Se c'è il deck, si
aggiorna lo stesso deck, non se ne fa uno nuovo. Un collaudo da solo non è una
ragione per aggiornare la guida per il cliente; lo è per la **guida tecnica**, che cambia la scheda
(sicuro / fragile), il piano B delle demo toccate e i limiti. Se cambia un passo della demo, cambia
anche la slide di demo, se ciò che il cliente vedrà è diverso.

## Cosa non fare

- Non riportare risultati di test nella guida per il cliente, in nessuna sezione e in nessun grafico.
- Non mettere la guida tecnica, né un suo pezzo, nella pagina o nel deck per il cliente.
- Non scrivere una demo senza piano B, né una slide di demo che non dica che cosa guardare.
- Non lasciare una slide di contenuto senza approfondimento, né un corpo di una frase sola: la guida
  deve reggersi da sola.
- Non mettere indicazioni di regia nell'approfondimento: vanno nelle note per ruolo.
- Non copiare il grafo del motore nel disegno: il cliente non deve vedere uno switch.
- Non usare Mermaid, né riquadri o linee del tempo che ripetono in forma di disegno ciò che una lista
  dice già: si scrive la lista.
- Non scrivere una risposta di esempio che il manifest non può produrre, né promettere ciò che è
  fuori perimetro.
- Non mettere nella pagina web la parte interna per chi conduce la sessione, né alcun dato del tenant.
- Non pubblicare la pagina senza aver caricato `artifact-design` e verificato l'organizzazione.
- Non mettere le due guide nello stesso artifact, né la tecnica in una parte nascosta della pagina per
  il cliente.
- Non pubblicare una pagina senza la sua sorgente Markdown: senza, chi viene dopo non la può
  aggiornare.
- Non ripubblicare a un `url` nuovo una guida che esiste già: il link del cliente resterebbe vecchio.
- Non dare per scontato che l'utente abbia un repository, né fare commit nel repository
  dell'assessment di propria iniziativa.
