---
name: xrcopilotlab-blueprint-guide
description: Scrive la guida per il cliente di un blueprint XRCopilotLab in stile story slides — una slide per idea, titolo che dice il messaggio, note per chi presenta — da cui nascono la pagina web e il deck per i sales. NON tecnica: il flusso come una storia, dove lavora l'AI e dove decidono le persone, domande di esempio con le risposte possibili, come si crea e si aggiorna un ambiente scritto in un manifest, con grafici semplici. NON riporta i risultati dei test. Parte da manifest, suite (solo per gli esempi) e dossier di assessment; non esegue test né tocca il tenant. Usa quando l'utente chiede di "scrivere la guida per il cliente", "spiegare il blueprint al cliente", "una guida non tecnica", "la guida allo scenario", "una pagina da mostrare al cliente", "le slide per i sales" o "raccontare come funziona". NON usare per le domande di prova né per il collaudo (xrcopilotlab-blueprint-test), né per scrivere o applicare il manifest (xrcopilotlab-blueprint).
---

# xrcopilotlab-blueprint-guide

Porta un blueprint da «funziona, e sappiamo come» a «il cliente capisce che cosa ha, come si usa e
come è fatto». Il lettore è **chi usa il servizio e chi lo compra**: un responsabile d'ufficio, un
avvocato, un direttore, quasi mai un tecnico. Se una frase gli chiede di sapere che cos'è un
orchestratore, un topic o un server MCP, la frase è sbagliata.

La guida racconta come funziona l'ambiente descritto nel manifest, e nient'altro:

1. **che cosa fa per lui**, in una frase;
2. **il flusso**, come una storia con un disegno;
3. **dove lavora l'intelligenza artificiale e dove decidono le persone** — la domanda che ogni
   cliente fa, anche quando non la dice;
4. **che cosa può chiedere, e che cosa gli viene risposto** — esempi di domande con una risposta
   possibile;
5. **come è fatto il suo ambiente**: un progetto scritto (il manifest), e che cosa gli conviene.

**La guida è scritta come story slides** (§2.0): una slide per idea, il titolo che dice il
messaggio, le note per chi presenta. Dalla stessa sorgente nascono la pagina web per il cliente e il
deck per i sales, che deve poterla presentare così com'è.

**La guida non parla di collaudo.** Niente esiti, numeri di domande superate, percentuali, grafici
dei risultati, difetti trovati e corretti, «provato con la posta vera». Al cliente interessa come
funziona il suo ambiente, non come l'abbiamo verificato: quello resta nei documenti di
[`xrcopilotlab-blueprint-test`](../xrcopilotlab-blueprint-test/SKILL.md) e nelle domande di prova.

## Chi fa che cosa

| Chi | Fa | Non fa |
|---|---|---|
| [`xrcopilotlab-blueprint`](../xrcopilotlab-blueprint/SKILL.md) | scrive e applica il manifest | spiegarlo al cliente |
| [`xrcopilotlab-blueprint-test`](../xrcopilotlab-blueprint-test/SKILL.md) | collauda, giudica, segnala, scrive **le domande di prova** (`demo-domande-<scenario>.md`) | la guida |
| **Questa skill** | scrive **la guida** (`guida-<scenario>.md`) e la sua **pagina web** | eseguire test, riportarne gli esiti, toccare il tenant, aprire issue |

La guida **legge** il manifest. Dalla suite e dalle domande di prova prende solo **gli esempi**:
che cosa si chiede e che cosa ci si deve aspettare, mai se la prova è passata.

## Se all'apertura compare che il plugin è indietro

Una riga come «c'è il plugin blueprints 2.19.0, questo è il 2.18.0: skill o CLI nuove…» arriva
all'inizio della sessione da un hook del plugin. **Dilla all'utente a parole**, una riga, con i due
comandi (`/plugin marketplace update hevolus`, `/plugin update blueprints@hevolus`) e il riavvio
della sessione: la guida si scrive meglio con le skill aggiornate. Non puoi aggiornare tu, e non è
urgente: se l'utente è a metà di una guida, si finisce e si aggiorna dopo.

## 0. Se `$ARGS` è vuoto

Orientare e fermarsi: a cosa serve, quali guide esistono già
(`../hevolus-assessment/customers/*/guida-*.md`), quali manifest ci sono (`blueprints/*.yml`). Poi
la domanda: per quale cliente e quale scenario.

## 1. Raccogliere le fonti

| Fonte | Dove | Che cosa se ne prende |
|---|---|---|
| Il manifest | `blueprints/<nome>.yml` | il flusso: i passi, chi li fa, cosa passa da uno all'altro; gli agenti, le loro istruzioni e il loro «cosa non fai»; i compiti delle persone e i loro tempi; i lavori programmati; le versioni e il loro perché (i blocchi di commento `vN`); ciò che è fuori perimetro (le note in fondo) |
| La suite | `blueprints/tests/<nome>.tests.yml` | **solo esempi**: le domande che una persona farebbe davvero e ciò che la risposta deve contenere (`expect`), da cui scrivere la risposta possibile |
| Le domande di prova | `../hevolus-assessment/customers/<cliente>/demo-domande-*.md` | **solo esempi**: le domande già scritte nella lingua del cliente e il loro «Atteso». La tabella di stato **non** si riporta |
| Il dossier di assessment | `../hevolus-assessment/customers/<cliente>/README.md` | **le criticità che il cliente ha detto con parole sue**: sono loro, non le nostre, a dire che cosa risolve |
| Il manifest archiviato | `xrcopilotlab-bp pull --tag <TAG>` | se il repository non c'è: la versione applicata, da cui ricostruire il flusso |

Il giudizio del collaudo (`blueprints/tests/reports/`) **non** è una fonte della guida.

Se il repository dell'assessment non c'è, chiedere all'utente dove mettere la guida. **Mai** in
`blueprints/` del repository di prodotto: contiene nomi e casi del cliente.

## 2. Scrivere la guida

Il file è `../hevolus-assessment/customers/<cliente>/guida-<scenario>.md`. Se esiste già una guida
scritta per **chi conduce la demo** (per esempio `guida-bpm-agenda.md` di Studio Polis,
`guida-demo-bilancio-aggregato.md` di FinLogic), non si riscrive: quella resta per chi conduce, e la
guida per il cliente è un file a parte. Se esiste una guida per il cliente in una forma precedente,
si riscrive in questa forma, togliendo ciò che riguarda il collaudo.

### 2.0 Il formato: story slides

La guida si scrive **come una sequenza di slide**, non come un documento: da quella stessa sorgente
nascono la pagina web per il cliente e **il deck per i sales**, senza riscrivere niente. Chi vende
deve poter prendere il file e presentarlo slide per slide.

Ogni slide ha sempre la stessa forma:

```markdown
---

<!-- slide: giornata-2 · atto: la storia -->
## Alle 15:05 arriva una PEC, e la pratica è già pronta

La referente trova autorità, parti, numero di ruolo, data e ora già proposti.
Li controlla sul testo originale e sceglie chi ci va.

> **Note per chi presenta:** qui si ferma la sala. Far notare che il testo originale è sempre
> accanto alla proposta: la persona verifica, non ricopia.
```

Le regole della slide:

- **Il titolo è il messaggio**, una frase intera con un verbo: «La referente decide, l'assistente
  propone», non «Ruoli». Letti di fila, **i soli titoli raccontano la storia**: è la prova da fare
  prima di consegnare (elencare gli `##` e leggerli come un paragrafo).
- **Un'idea per slide.** Se servono due «e poi», sono due slide.
- **Il corpo sta in uno schermo**: al massimo 40 parole di testo, **oppure** tre punti, **oppure**
  una tabella di cinque righe, **oppure** un disegno, **oppure** uno scambio domanda/risposta. Mai
  due di queste cose insieme, salvo un disegno con una riga di didascalia.
- **Le note per chi presenta** (`> **Note per chi presenta:**`) portano ciò che nel documento
  sarebbe stato un paragrafo: il dettaglio, l'obiezione da prevenire, la domanda da fare alla sala.
  Stanno sotto il corpo, e nella pagina web per il cliente non si vedono.
- **Il commento `<!-- slide: … · atto: … -->`** dà a ogni slide un nome stabile e l'atto a cui
  appartiene: serve a riordinare, a tagliare una versione breve e a ritrovare la slide quando si
  aggiorna.
- **`---` separa le slide**, e nient'altro sta fra due separatori.

### 2.1 Gli atti, in quest'ordine

Da 14 a 22 slide in tutto. I titoli delle slide sono esempi: si scrivono nella lingua del cliente.

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

Il disegno ha **una slide sua**, alla fine della storia, e segue la storia, non il grafo del motore: **al massimo otto riquadri**, e ogni riquadro
è qualcosa che il cliente riconosce. Modelli e colori in [`references/grafici.md`](references/grafici.md).

### 2.3 Chi fa che cosa

Sono le slide che il cliente guarda due volte. **Una slide** per le tre colonne, sempre le stesse,
con due o tre voci ciascuna (le altre vanno nelle note):

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

Se i tipi utili sono più di cinque, quelli in più diventano note di una slide vicina, non slide
nuove. Per ciascuna slide:

- **il titolo** dice che cosa si vede: «Un rinvio scritto di fretta diventa una pratica completa»;
- **chi la fa e dove**, in mezza riga («la referente, in chat, dopo la riunione»);
- **la domanda**, come la scriverebbe lui — dalla suite o dalle domande di prova, riportata al suo
  lessico e con nomi inventati;
- **una risposta possibile**, scritta per esteso come comparirebbe sullo schermo: costruita dalle
  attese della suite e dal formato che le istruzioni dell'agente prescrivono, **accorciata** a ciò
  che il cliente deve vedere;
- **nelle note per chi presenta**, che cosa far notare («la data è scritta per esteso; il numero di
  ruolo c'è perché era nel testo»).

Lo scambio domanda/risposta **è** il corpo della slide: niente altro testo accanto.

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

**Che cosa contiene** (può stare nelle note della slide del ciclo, o in una slide sua), in un elenco che il cliente riconosce: gli assistenti con il loro compito, i
percorsi delle pratiche con i compiti delle persone e i loro tempi, i lavori programmati (con
l'orario), i collegamenti ai suoi servizi. Con i numeri veri, presi dal manifest: «quattordici
assistenti, quattro percorsi di pratica, tre lavori programmati».

**Come nasce e come cambia** — una slide, con il disegno del ciclo di [`references/grafici.md`](references/grafici.md)
§3: si scrive il progetto → vi mostriamo l'elenco di ciò che verrà creato o cambiato → il vostro sì
→ l'ambiente viene creato → una correzione diventa una versione nuova, che tocca solo ciò che
cambia.

**Che cosa gli conviene** — una slide con i **cinque** vantaggi che contano per quel cliente, detti
come vantaggi suoi e non come funzioni della CLI; gli altri nelle note:

| Vantaggio | Come si dice al cliente |
|---|---|
| Si vede prima di farlo | «Prima di toccare il vostro ambiente vi mostriamo l'elenco di ciò che cambierà, e si procede solo dopo il vostro sì» |
| È ripetibile | «Lo stesso ambiente si ricrea uguale, per un'altra sede o in produzione, senza rifarlo a mano» |
| Si migliora senza rifarlo | «Una correzione tocca solo ciò che cambia: il resto resta com'è, e nessuno si accorge dell'aggiornamento se non per il miglioramento» |
| Ha una storia | «Ogni versione ha un numero e un perché: sapete sempre che cosa è cambiato e quando» |
| Non contiene segreti | «Le password dei vostri servizi non stanno nel progetto: stanno in una cassaforte, e il progetto le cita per nome» |
| Non tocca ciò che non è suo | «Se nel vostro ambiente c'è già qualcosa con lo stesso nome, il progetto si ferma invece di sovrascriverlo» |
| Si toglie per intero | «Se decidete di non usarlo, si smonta tutto ciò che è stato creato, senza lasciare pezzi» |

Il disegno delle **versioni** (grafici §4) chiude l'atto, in una slide sua: cinque o sei tappe prese dai blocchi
`vN` in testa al manifest, ciascuna con una riga di **che cosa è cambiato per il cliente** — «le PEC
si aprono fino al messaggio che contengono», «la riunione del venerdì si detta in chat». Il perché
di una versione si dice come **cosa che il cliente ci ha chiesto o mostrato**, mai come prova fallita
o difetto trovato.

## 3. Le regole di scrittura

In sintesi — il dettaglio, con il vocabolario e gli esempi prima/dopo, in
[`references/linguaggio.md`](references/linguaggio.md):

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
- **Ciò che non sta in una slide va nelle note**, non in un paragrafo sotto il corpo.
- **Onestà sul perimetro**: ciò che è fuori dal manifest si scrive nell'atto di chiusura, non si tace; e
  una risposta di esempio non mostra capacità che il manifest non ha.
- **I nomi degli esempi** sono veri solo se il cliente li ha consegnati per la prova; altrimenti
  inventati, e il documento lo dice.

## 4. Mostrarla, poi pubblicarla

1. **Il Markdown all'utente**, prima di tutto, con **l'elenco dei titoli** letti di fila in cima al
   messaggio: se non raccontano la storia da soli, la guida non è pronta. Chi conosce il cliente sa
   se la storia è quella giusta, se gli esempi sono quelli che farà davvero e se una frase suonerà
   male: è lui a dare il sì.
2. **La pagina web** — un artifact privato da proiettare o condividere, più una copia HTML locale
   che si apre senza account. Come si costruisce, l'organizzazione da verificare prima e l'apertura
   nel browser: [`references/pagina-web.md`](references/pagina-web.md).
3. **Il deck per i sales**, se l'utente lo chiede: si parte con `Artifact` `action: "quickstart"`,
   `intent: "slides"`, e si usa il tipo Slides che indica (si scarica come .pptx o PDF). La
   corrispondenza è uno a uno, senza riscrivere: una slide del Markdown è una slide del deck, il
   titolo resta il titolo, il corpo il corpo, le note diventano le note del relatore, i disegni si
   ridisegnano con i colori di [`references/grafici.md`](references/grafici.md). L'appendice resta
   in coda, dopo la divisoria. Se l'utente chiede la versione breve, si usano i nomi delle slide del
   taglio (§2.1).
4. **Il commit** nel repository dell'assessment, solo se l'utente lo chiede.

## 5. Quando aggiornarla

A ogni versione del manifest che cambia il flusso, ciò che un assistente sa fare o ciò che il
cliente noterebbe. Si aggiornano, per nome, le slide degli esempi che ne sono toccati, quelle della
chiusura e la slide delle versioni; la storia resta finché il flusso non cambia. Se c'è il deck, si
aggiorna lo stesso deck, non se ne fa uno nuovo. Un collaudo da solo non è una
ragione per aggiornarla.

## Cosa non fare

- Non riportare risultati di test, in nessuna sezione e in nessun grafico.
- Non scrivere paragrafi: una slide che richiede di scorrere sono due slide, o una slide con le note.
- Non copiare il grafo del motore nel disegno: il cliente non deve vedere uno switch.
- Non scrivere una risposta di esempio che il manifest non può produrre, né promettere ciò che è
  fuori perimetro.
- Non mettere nella pagina web la parte interna per chi conduce la sessione, né alcun dato del tenant.
- Non pubblicare la pagina senza aver caricato `artifact-design` e verificato l'organizzazione.
- Non fare commit nel repository dell'assessment di propria iniziativa.
