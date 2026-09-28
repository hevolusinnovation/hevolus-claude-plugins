# Le domande di prova per il cliente: dalla suite alla prova in sala

Il collaudo produce due cose che restano nel repository — la suite e il giudizio — e nessuna delle
due si può mettere davanti a un cliente: la suite è YAML con regex, il giudizio parla di componenti e
issue. Ciò che il cliente riceve sono **due documenti**, che raccontano la stessa prova in un'altra lingua;
questa skill scrive il primo:

| Documento | A cosa serve | Quando si scrive |
|---|---|---|
| **Le domande di prova** — artifact «<Scenario> — domande di prova», sorgente `demo-domande.md` | Il copione della sessione con il cliente: cosa incollare in chat, cosa aspettarsi, cosa riconoscere come sbagliato, cosa dimostra ogni domanda | Appena la suite è scritta e validata (§1 della skill): serve a **concordare** le domande con l'utente prima di eseguirle, e si aggiorna dopo ogni collaudo |
| **La guida allo scenario** — artifact «<Scenario> — guida», più «<Scenario> — demo (interna)» | Il racconto non tecnico dello scenario, con la sua pagina web | La scrive [`xrcopilotlab-blueprint-guide`](../../xrcopilotlab-blueprint-guide/SKILL.md), non questa skill |

Gli esempi da imitare, nel repository dell'assessment per chi ce l'ha: `customers/studiopolis/demo-domande-agenda.md`;
`customers/confindustria-como/demo-domande.md`;
`customers/finlogic/demo-domande-orchestratore.md`.

## Dove vanno: un artifact

Chi usa le domande di prova — il Sales, l'AI Specialist, spesso dal plugin — di norma **non ha il
repository dell'assessment**. Quindi vivono in un **artifact** su claude.ai:

- **Titolo** «<Scenario> — domande di prova» (es. «Conoscenza degli associati — domande di prova»),
  icona stabile fra le ripubblicazioni.
- **La sorgente dentro**: il Markdown si scrive nello scratchpad della sessione e si pubblica fra i
  `files` della pagina come `demo-domande.md`. Una sessione dopo lo ritrova con `Artifact`
  `action: "list"`, lo legge con `action: "read"`, `path: "demo-domande.md"`, e ripubblica **allo
  stesso `url`**: il link dato a chi conduce non cambia.
- **È un artifact interno**: contiene la tabella di stato e la sezione per chi conduce. Si condivide
  con chi fa la sessione, non con il cliente. Se il cliente vuole provare da sé, si ricava a parte una
  versione senza la tabella di stato e senza la sezione interna, e la decide l'utente.
- **La pagina**: prima caricare `artifact-design`; trattamento da documento di lavoro — la tabella di
  stato in alto, un capitolo per agente o orchestratore apribile, le domande in blocchi con un
  pulsante «Copia». Prima di pubblicare, l'organizzazione Hevolus (`/status`); dopo, aprirla nel
  browser dell'utente, come per la guida ([`pagina-web.md` di blueprint-guide](../../xrcopilotlab-blueprint-guide/references/pagina-web.md)).
- **È la fonte dello stato per la guida tecnica**: `xrcopilotlab-blueprint-guide` legge da qui la
  tabella di stato quando il giudizio, che vive nel repository di prodotto, non è a portata.
- **Il repository dell'assessment è facoltativo**: se c'è e l'utente lo vuole, se ne salva una copia
  in `customers/<cliente>/demo-domande-<scenario>.md`; commit solo su richiesta. **Mai** in
  `blueprints/` del repository di prodotto: contiene nomi e casi del cliente.

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

## La guida allo scenario e la sua pagina web: un'altra skill

Il racconto dello scenario per il cliente — il flusso come una storia, dove lavora l'AI e dove
decidono le persone, domande di esempio con le risposte possibili, come è fatto il suo ambiente, con
disegni semplici e la pagina web da proiettare — lo scrive [`xrcopilotlab-blueprint-guide`](../../xrcopilotlab-blueprint-guide/SKILL.md).
Dalle domande di prova prende solo gli esempi: la tabella di stato e gli esiti del collaudo **non**
entrano nella guida.

## Le regole

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
