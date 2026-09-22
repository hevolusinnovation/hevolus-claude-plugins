# Le guide per il cliente: dalla suite alla prova in sala

Il collaudo produce due cose che restano nel repository — la suite e il giudizio — e nessuna delle
due si può mettere davanti a un cliente: la suite è YAML con regex, il giudizio parla di componenti e
issue. Ciò che il cliente riceve sono **due documenti**, scritti dalla suite e dal giudizio, che
raccontano la stessa prova in un'altra lingua:

| Documento | A cosa serve | Quando si scrive |
|---|---|---|
| **Le domande di prova** — `demo-domande-<scenario>.md` | Il copione della sessione con il cliente: cosa incollare in chat, cosa aspettarsi, cosa riconoscere come sbagliato, cosa dimostra ogni domanda | Appena la suite è scritta e validata (§1 della skill): serve a **concordare** le domande con l'utente prima di eseguirle, e si aggiorna dopo ogni collaudo |
| **La guida allo scenario** — `guida-<scenario>.md` | Cos'è stato costruito, spiegato a chi non conosce la piattaforma (il cliente) e a chi conosce lo standard (un esperto BPM): concetti, diagramma, passi, cosa risolve, cosa non fa | Al collaudo finale, quando il manifest è stabile; solo per gli scenari con un processo o un'orchestrazione |

Gli esempi da imitare: `hevolus-assessment/customers/studiopolis/demo-domande-agenda.md` e
`guida-bpm-agenda.md`; `customers/confindustria-como/demo-domande.md`;
`customers/finlogic/demo-domande-orchestratore.md`.

## Dove vanno

Nella cartella del cliente nel repository dell'assessment (`../hevolus-assessment/customers/<cliente>/`),
accanto al README dell'assessment: è lì che vivono i documenti che il cliente vede, ed è un
repository diverso da quello del prodotto per una ragione — contengono nomi, casi e giudizi del
cliente. Se quella cartella non esiste, chiedere all'utente dove metterli; **non** in
`blueprints/` del repository di prodotto.

## Le domande di prova: la traduzione inversa della suite

La skill sa già tradurre un documento di domande in una suite (tabella al §1). Questa è la
direzione opposta, e vale campo per campo:

| Nella suite | Nel documento |
|---|---|
| `message` | La domanda, in un blocco di codice, **identica**: è ciò che il cliente incolla |
| `expect.answer` | «**Atteso:**», in prosa, con i valori concreti (date, numeri, nomi) |
| `expect.wrongAnswers[].means`, `notContains` | «**Risposte sbagliate da riconoscere:**» — una riga ciascuna, nella lingua del cliente (non «suspect: KnowledgeGraph» ma «ha inventato un orario») |
| `purpose`, `notes` | «**Cosa dimostra:**» — il perché la domanda esiste, legato a una criticità o a una regola dell'agente |
| `tags` | La sezione: un capitolo per agente (o per orchestratore, o per il processo); i casi `negative` restano nel capitolo, i casi `limite` vanno in una sezione «da discutere con il cliente», non «da mostrare» |
| `kind: process` + `caseData` | La prova del flusso: i dati del modulo di avvio come li compila il referente, e **cosa deve comparire e a chi** (il compito, l'evento in calendario) |
| `tags: [m365, m365-dati, …]` (fonte esterna) | Una sezione a parte, «quando la fonte è operativa», con i **dati di prova da preparare** (eventi, mail) scritti per esteso |
| casi di scrittura fuori dal tenant | Una sezione «solo con un sì esplicito», con cosa resta da cancellare dopo |
| chiavi dei casi (`key`) | In coda a ogni titolo, in `codice`: così un fallimento in sala si ritrova nella suite |

Struttura che ha retto tre volte (Studio Polis, Como, FinLogic):

0. **Come funziona lo scenario, e cosa ne consegue per la prova** — le tre o quattro cose che
   spiegano il comportamento (una conversazione nuova per domanda; chi legge la domanda in una
   catena; «non indicato» è una risposta giusta; la fonte simulata finché non c'è quella vera).
1. **Dove e come** — istanza, topic, nomi degli agenti, tempi di risposta, avvertenza sui dati
   inventati da anonimizzare.
2..n. **Un capitolo per agente / orchestratore / processo**, nell'ordine in cui il cliente li
   incontrerebbe; dentro, le domande in un ordine che costruisce (prima il caso pieno, poi
   l'incompleto, poi il fuori compito, poi il trabocchetto).
- **Ciò che è fuori perimetro** — cosa il cliente potrebbe chiedere e la risposta onesta di oggi
  (i termini processuali per Studio Polis, la fase 2 per Como).
- **Scheda di valutazione** — domanda · corretta? · cosa manca · *lo Studio l'avrebbe ricontrollata?*
  L'ultima colonna è quella che conta: una risposta sbagliata che nessuno ricontrollerebbe pesa
  più di dieci giuste.
- **Per chi conduce la sessione (interno, non da mostrare)** — lo stato reale del tenant, i
  difetti aperti con il numero di issue, cosa non dire come funzionante, dove sta il giudizio.

In testa, sempre, una **tabella di stato** per parte dello scenario (✅ pronta · 🟡 da correggere
prima di mostrarla · ⛔ da non mostrare come funzionante · ⏳ attende una fonte · 🔁 in attesa di
verifica da uno sviluppatore, quindi da non mostrare come funzionante), ricavata
dall'**ultimo giudizio**: è la prima cosa che l'utente guarda prima di entrare in sala.

## La guida allo scenario

Per gli scenari con un processo BPM o un'orchestrazione. Tre letture nello stesso documento,
perché lo stesso file va in mano a tre persone diverse:

Il documento nasce in Markdown e si consegna anche come **pagina web** (sotto).

| Sezioni | Per chi | Cosa contiene |
|---|---|---|
| Concetti | chi deve spiegarlo senza essere esperto | Cos'è BPM/BPMN in parole semplici; i **sei simboli** che bastano (start, task umano/automatico, gateway, flusso, corsia, end); definizione/istanza/token/compito |
| Il processo | il cliente | Il diagramma (Mermaid, generato dal grafo di `validate --graph`: rettangoli = compiti umani, parallelogrammi = agenti, rombi = decisioni), come entra una pratica, la tabella **passo per passo** (tipo, chi, cosa succede, soglia) |
| Cosa risolve | il cliente | Le criticità **che il cliente stesso ha censito** → il meccanismo che le risolve. È il loro elenco, non il nostro: si prende dall'assessment |
| Gli agenti | il cliente | Compito e **cosa non fa**, per ciascuno; ciò che è fuori perimetro per scelta e perché |
| Collaudato e mancante | il cliente | Dal giudizio: cosa è stato provato (e come: dal vivo, simulato, a secco), cosa manca e perché, i difetti aperti con il numero |
| Vocabolario | l'esperto | La tabella piattaforma ↔ BPMN 2.0 (da `bpm.md`), il file `.bpmn` esportato e come aprirlo |
| Le domande dell'esperto | l'esperto | Le domande probabili con risposte oneste: cosa il motore non fa, come si gestiscono i timeout senza timer, i cicli, versioning, chi garantisce che l'agente non scriva a caso |
| Glossario | tutti | Blueprint, topic, ruolo, agent task, orchestratore, server MCP, istanza, compito, soglia, webhook |

## La pagina web (artifact): fa parte della consegna

Ogni guida allo scenario — e, se l'utente lo vuole, anche le domande di prova — si pubblica come
**artifact**: una pagina privata su claude.ai, con un link da proiettare o condividere, che il
cliente apre senza clonare niente. Non è un extra: il Markdown è la sorgente, la pagina è ciò che
si mostra.

Come si costruisce, nell'ordine:

1. **Prima il Markdown**, completo e mostrato all'utente. La pagina non aggiunge contenuto: lo
   impagina.
2. **Caricare la skill `artifact-design`** prima di scrivere l'HTML — è obbligatorio, e decide
   trattamento, palette, tipografia. Per queste guide il trattamento è quello di un documento di
   riferimento curato, non una landing page: indice fisso a sinistra su schermi larghi, testo a
   ~68 caratteri, tabelle in contenitori scorrevoli, entrambi i temi (chiaro e scuro). Nessun
   dato del tenant nel titolo o nella descrizione.
3. **Il diagramma del processo** va in un blocco `<pre class="mermaid">`: gli artifact lo rendono
   da soli, senza libreria. Colorare i nodi per ruolo con `classDef` — compiti umani, passi
   automatici, decisioni, eventi — e mettere una legenda sotto.
4. **Titolo** = il nome dello scenario (es. «Agenda di Studio Polis»), non un'etichetta generica;
   la spiegazione va nella `description` del publish. Favicon coerente con il dominio (⚖️ per uno
   studio legale) e **stabile** fra le ripubblicazioni.
5. **Pubblicare con `Artifact`** dalla cartella di lavoro della sessione, poi **aprire subito la
   pagina nel browser dell'utente** — è un passo obbligatorio, non una cortesia. Prima strada: gli
   strumenti **Claude in Chrome** (`tabs_context_mcp`, poi `navigate` sull'URL), che aprono la pagina
   nella sessione Chrome dove l'utente è già loggato, con l'organizzazione giusta. Se l'estensione
   non è connessa: `open <url>` su macOS, `xdg-open` su Linux, `start` su Windows. Non lasciare
   all'utente solo il link da copiare: così la vede mentre è ancora nella
   sessione, e se compare «Page not found» il problema dell'organizzazione emerge adesso, non in
   sala. Dire anche come si riapre dopo: `ctrl+]` riapre l'ultimo artifact della sessione,
   `/artifacts` li elenca (`o` apre, `c` copia il link). Ripubblicare lo **stesso percorso**
   aggiorna la stessa pagina: non cambiare nome al file fra una versione e l'altra, altrimenti
   nasce un artifact nuovo.
6. **Copia locale** accanto al Markdown (`guida-<scenario>.html`): lo stesso HTML avvolto in un
   documento completo, con Mermaid caricato da cdnjs per il diagramma. Si apre con un doppio clic,
   senza account: è la rete di sicurezza per la sala, dove il login può non esserci.

**L'organizzazione conta.** Un artifact appartiene all'account **e all'organizzazione** con cui la
CLI è autenticata in quel momento; chi lo apre da un'altra organizzazione vede «Page not found»
con il pulsante «Switch organization». Prima di pubblicare per un cliente Hevolus, verificare con
`/status` che la sessione sia nell'organizzazione Hevolus; se non lo è, dire all'utente di fare
`/login` scegliendo quella, e pubblicare dopo. Un artifact pubblicato nell'organizzazione sbagliata
non si sposta: si ripubblica.

**Cosa non pubblicare.** La pagina contiene solo ciò che il cliente può vedere: nessun id di
istanze, run, webhook o chiavi, nessun triage per componente, nessun nome di file interno oltre a
quelli dei documenti consegnati. La sezione «per chi conduce» delle domande di prova resta nel
Markdown e **non entra nella pagina** destinata al cliente — se serve una pagina anche per chi
conduce, è un secondo artifact.

## Le regole, che valgono per entrambi

- **Niente che identifichi il tenant**: nessun id di istanza, run, webhook, chiave, indirizzo di
  API. Nel documento interno per chi conduce, al massimo il numero di issue e il nome del report.
- **Nomi, numeri di ruolo, date degli esempi sono inventati**, e il documento lo dice. Se il
  cliente porta casi veri, si anonimizzano prima di incollarli.
- **Lo stato è quello dell'ultimo giudizio**, non quello sperato: una parte «collaudata a secco» si
  scrive così; una parte mai provata dal vivo si scrive «attende la fonte». Mai «funziona» per
  qualcosa che ha passato solo la simulazione.
- **Una risposta sbagliata riconosciuta in sala è una riga nuova** nei `wrongAnswers` della suite
  e nel documento: i due file crescono insieme, e il documento cita i `key` proprio per questo.
- **Il documento non contiene il triage**: componente, repository, log e versioni stanno nel
  giudizio. Al cliente si dice *cosa* non funziona e *quando* sarà corretto, non *dove* nel codice.
- **Mostrarli all'utente prima di darli per finiti**, come la suite: le domande sono quelle che
  il cliente farà davvero, e l'unico che sa quali sono è chi conosce il cliente.
