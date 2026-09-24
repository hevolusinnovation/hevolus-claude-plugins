---
name: xrcopilotlab-blueprint-guide
description: Scrive la guida per il cliente di un blueprint XRCopilotLab applicato — un documento NON tecnico, per chi non conosce la piattaforma, che racconta il flusso come una storia, spiega dove lavora l'intelligenza artificiale e dove decidono le persone, come è stato collaudato (e con che esito), perché un ambiente descritto in un manifest conviene (si vede prima di farlo, si ripete, si aggiorna senza rifarlo), con grafici semplici; e la pubblica come pagina web da proiettare. Parte da manifest, ultimo giudizio, suite e dossier di assessment; non esegue test né tocca il tenant. Usa quando l'utente chiede di "scrivere la guida per il cliente", "spiegare il blueprint al cliente", "una guida non tecnica", "la guida allo scenario", "una pagina da mostrare al cliente" o "raccontare come funziona". NON usare per le domande di prova né per il collaudo (quello è xrcopilotlab-blueprint-test), né per scrivere o applicare il manifest (xrcopilotlab-blueprint).
---

# xrcopilotlab-blueprint-guide

Porta un blueprint da «funziona, e sappiamo come» a «il cliente capisce che cosa ha, perché gli
conviene, e che cosa aspettarsi». Il lettore è **chi usa il servizio e chi lo compra**: un
responsabile d'ufficio, un avvocato, un direttore, quasi mai un tecnico. Se una frase gli chiede di
sapere che cos'è un orchestratore, un topic o un server MCP, la frase è sbagliata.

La guida racconta cinque cose, e nient'altro:

1. **che cosa fa per lui**, in una frase;
2. **il flusso**, come una storia con un disegno;
3. **dove lavora l'intelligenza artificiale e dove decidono le persone** — la domanda che ogni
   cliente fa, anche quando non la dice;
4. **come lo abbiamo provato**, con l'esito vero;
5. **perché un ambiente descritto in un progetto** (il manifest) **gli conviene**.

## Chi fa che cosa

| Chi | Fa | Non fa |
|---|---|---|
| [`xrcopilotlab-blueprint`](../xrcopilotlab-blueprint/SKILL.md) | scrive e applica il manifest | spiegarlo al cliente |
| [`xrcopilotlab-blueprint-test`](../xrcopilotlab-blueprint-test/SKILL.md) | collauda, giudica, segnala, scrive **le domande di prova** (`demo-domande-<scenario>.md`) | la guida |
| **Questa skill** | scrive **la guida** (`guida-<scenario>.md`) e la sua **pagina web** | eseguire test, toccare il tenant, aprire issue |

La guida **legge** quello che le altre due hanno prodotto. Se l'ultimo collaudo è vecchio o manca,
non lo si rifà da qui: si dice all'utente che lo stato non è aggiornato e si propone
`xrcopilotlab-blueprint-test`. Una guida con uno stato inventato è peggio di nessuna guida.

## 0. Se `$ARGS` è vuoto

Orientare e fermarsi: a cosa serve, quali guide esistono già
(`../hevolus-assessment/customers/*/guida-*.md`), quali blueprint hanno un collaudo recente
(`blueprints/tests/reports/<tag>/`). Poi la domanda: per quale cliente e quale scenario.

## 1. Raccogliere le fonti

| Fonte | Dove | Che cosa se ne prende |
|---|---|---|
| Il manifest | `blueprints/<nome>.yml` | il flusso: i passi, chi li fa, cosa passa da uno all'altro; gli agenti e il loro «cosa non fai»; le versioni e il loro perché (i blocchi di commento `vN`) |
| L'ultimo giudizio | `blueprints/tests/reports/<tag>/<data>/giudizio.md` | l'esito: quante domande, quante giuste, che cosa non va ancora e quando sarà corretto |
| La suite | `blueprints/tests/<nome>.tests.yml` | due o tre domande vere da citare come esempio, e le risposte sbagliate che il collaudo riconosce |
| Le domande di prova | `../hevolus-assessment/customers/<cliente>/demo-domande-*.md` | la tabella di stato (✅ 🟡 ⛔ ⏳), da riportare in forma semplice |
| Il dossier di assessment | `../hevolus-assessment/customers/<cliente>/README.md` | **le criticità che il cliente ha detto con parole sue**: sono loro, non le nostre, a dire che cosa risolve |
| Il manifest archiviato | `xrcopilotlab-bp pull --tag <TAG>` | se il repository non c'è: la versione applicata, da cui ricostruire il flusso |

Se il repository dell'assessment non c'è, chiedere all'utente dove mettere la guida. **Mai** in
`blueprints/` del repository di prodotto: contiene nomi e casi del cliente.

## 2. Scrivere la guida

Il file è `../hevolus-assessment/customers/<cliente>/guida-<scenario>.md`. Se esiste già — le
guide di Como, FinLogic e Studio Polis sono state scritte prima di questa skill, con una parte per
esperti — **si riscrive nella forma di qui**, tenendo i contenuti che reggono e portando in
appendice ciò che è per chi conosce la materia.

Le sezioni, in quest'ordine. I titoli sono esempi: si scrivono nella lingua del cliente.

| # | Sezione | Che cosa contiene | Da dove |
|---|---|---|---|
| 1 | **In una frase** | Che cosa fa per lui, con il suo lessico. «Chiedete di un associato e in due minuti avete una scheda con quello che sa l'associazione e quello che dice il web, con la mappa della sede.» | manifest, descrizione |
| 2 | **Una giornata tipo** | Il flusso raccontato come una storia, con una persona e un caso veri del suo lavoro (anonimizzati se servono), dall'inizio alla fine. Poi **il disegno** del flusso | manifest |
| 3 | **Dove lavora l'AI, e dove decidete voi** | La tabella dei tre ruoli: ciò che fa l'AI, ciò che decidono le persone, ciò che fanno regole fisse. Poi **ciò che l'AI non fa**, detto chiaro | manifest (system message, passi umani, passi automatici) |
| 4 | **Che cosa risolve** | Le criticità del cliente, con le sue parole, e per ciascuna che cosa cambia | dossier di assessment |
| 5 | **Come lo abbiamo provato** | Il collaudo raccontato: domande vere, risposta attesa scritta prima, risposte sbagliate riconosciute, ripetuto a ogni modifica. **L'esito vero**, con un grafico | giudizio, suite |
| 6 | **Perché un progetto scritto** | I vantaggi del manifest, detti come vantaggi suoi, con il disegno delle versioni | manifest (versioni), CLI |
| 7 | **Che cosa non fa ancora** | I limiti di oggi e quando saranno risolti, senza giri di parole | giudizio, domande di prova |
| 8 | **Le parole che incontrerete** | Un glossario corto, in parole semplici | — |
| — | *Appendice: per chi vuole i dettagli* | Facoltativa: il vocabolario tecnico e le domande di un esperto. Separata, e dichiarata tale | la guida precedente, se c'era |

### 2.1 Una giornata tipo

Non «il sistema riceve la richiesta e la instrada»: **«Lunedì mattina Paola, dell'ufficio
associati, deve chiamare un'azienda che non conosce. Scrive in chat il nome…»**. Una persona, un
caso, un'ora del giorno, e ciò che vede sullo schermo passo per passo. I passi che nel manifest sono
tecnici (una riduzione del profilo, uno switch) nella storia non compaiono, oppure compaiono per ciò
che producono («se l'indirizzo c'è, sotto compare la mappa»).

Il disegno segue la storia, non il grafo del motore: **al massimo otto riquadri**, e ogni riquadro
è qualcosa che il cliente riconosce. Modelli e colori in [`references/grafici.md`](references/grafici.md).

### 2.2 Dove lavora l'AI, e dove decidete voi

È la sezione che il cliente legge due volte. Tre colonne, sempre le stesse:

| L'AI | Le persone | Regole fisse |
|---|---|---|
| legge, cerca, confronta, riassume, propone | decidono, approvano, correggono | fanno sempre la stessa cosa, senza interpretare |
| *es.* legge la scheda dell'associato e compone il report | *es.* decide se chiamare l'azienda; approva la pratica | *es.* verifica la partita IVA sul registro europeo; mette il punto sulla mappa |

Poi **che cosa l'AI non fa**, preso dai «cosa NON fai» dei system message e detto in positivo per
il cliente: non inventa un dato che non trova — lo dice; non dà giudizi sull'azienda; non scrive nei
vostri sistemi; non manda niente a nessuno senza che una persona abbia detto sì. È qui che si
spiegano anche i **gap**: «quando un dato non c'è, la scheda lo scrive, invece di riempire il buco».

### 2.3 Come lo abbiamo provato

Il collaudo, spiegato a chi non ha mai visto una suite:

1. **abbiamo scritto prima le domande e le risposte giuste** — le stesse che farete voi, sulle
   vostre aziende vere;
2. **abbiamo scritto anche le risposte sbagliate da riconoscere** — «l'azienda non esporta»
   quando il gestionale semplicemente non lo dice;
3. **le facciamo girare tutte, in automatico, a ogni modifica**, e confrontiamo le risposte;
4. **una persona legge ogni risposta** e decide se è giusta: la macchina controlla i numeri, il
   giudizio resta umano;
5. ciò che non va diventa una segnalazione con una data di correzione.

Poi l'esito, con i numeri veri dell'ultimo giudizio («47 domande: 40 giuste, 7 da correggere, tutte
nello stesso punto») e un grafico semplice. **Lo stato è quello del giudizio, non quello sperato**:
ciò che è stato provato solo con dati simulati si scrive così.

### 2.4 Perché un progetto scritto

Il manifest, per il cliente, è **il progetto del suo ambiente**: un documento che dice che cosa c'è
e come si comporta. Si spiega con i vantaggi che lo riguardano, non con le funzioni della CLI:

| Vantaggio | Come si dice al cliente |
|---|---|
| Si vede prima di farlo | «Prima di toccare il vostro ambiente vi mostriamo l'elenco di ciò che cambierà, e si procede solo dopo il vostro sì» |
| È ripetibile | «Lo stesso ambiente si ricrea uguale, per un'altra sede o in produzione, senza rifarlo a mano» |
| Si migliora senza rifarlo | «Una correzione tocca solo ciò che cambia: il resto resta com'è, e nessuno si accorge dell'aggiornamento se non per il miglioramento» |
| Ha una storia | «Ogni versione ha un numero e un perché: sapete sempre che cosa è cambiato e quando» |
| È collaudato sempre allo stesso modo | «Le stesse domande, a ogni versione: un miglioramento non ne rompe un'altra parte senza che ce ne accorgiamo» |
| Non contiene segreti | «Le password dei vostri servizi non stanno nel progetto: stanno in una cassaforte, e il progetto le cita per nome» |
| Si toglie per intero | «Se decidete di non usarlo, si smonta tutto ciò che è stato creato, senza lasciare pezzi» |

Il disegno delle **versioni** (dalla prima all'ultima, con una riga di perché ciascuna) è il modo
più convincente di mostrarlo: fa vedere quante correzioni ci sono state e che nessuna ha richiesto
di ripartire da zero. Si prende dai blocchi `vN` in testa al manifest, scegliendo le cinque o sei
che il cliente capisce.

## 3. Le regole di scrittura

In sintesi — il dettaglio, con il vocabolario e gli esempi prima/dopo, in
[`references/linguaggio.md`](references/linguaggio.md):

- **Frasi corte, parole sue.** Il lessico del cliente, non il nostro: «associato», «pratica»,
  «udienza», non «entità», «istanza», «record».
- **Nessun termine tecnico senza una spiegazione nella stessa frase**, e i più tecnici non
  compaiono affatto: orchestratore, topic, profilo, MCP, token, gateway, inventario, run.
- **Nessun dato del tenant**: id di istanze, run, webhook, chiavi, indirizzi di API, nomi di file
  interni. Nessun codice `BPxxx`, nessun nome di componente o di repository.
- **Niente triage**: al cliente si dice *che cosa* non funziona e *quando* sarà corretto, non
  *dove* nel codice.
- **Onestà sullo stato**: «provato con dati simulati» non è «funziona»; un limite si scrive nella
  sezione 7, non si tace.
- **I nomi degli esempi** sono veri solo se il cliente li ha consegnati per la prova; altrimenti
  inventati, e il documento lo dice.

## 4. Mostrarla, poi pubblicarla

1. **Il Markdown all'utente**, prima di tutto. Chi conosce il cliente sa se la storia è quella
   giusta e se una frase suonerà male: è lui a dare il sì.
2. **La pagina web** — un artifact privato da proiettare o condividere, più una copia HTML locale
   che si apre senza account. Come si costruisce, l'organizzazione da verificare prima e l'apertura
   nel browser: [`references/pagina-web.md`](references/pagina-web.md).
3. **Il commit** nel repository dell'assessment, solo se l'utente lo chiede.

## 5. Quando aggiornarla

A ogni collaudo che cambia la tabella di stato, e a ogni versione del manifest che cambia il flusso
o che il cliente noterebbe. Si aggiornano la sezione 5 (esito), la 7 (limiti), il disegno delle
versioni; la storia resta finché il flusso non cambia.

## Cosa non fare

- Non scrivere la guida senza un giudizio recente: si propone il collaudo, non si inventa lo stato.
- Non copiare il grafo del motore nel disegno: il cliente non deve vedere uno switch.
- Non promettere ciò che è fuori perimetro, né presentare come pronto ciò che il giudizio segna
  🟡 o ⛔.
- Non mettere nella pagina web la parte interna per chi conduce la sessione, né alcun dato del tenant.
- Non pubblicare la pagina senza aver caricato `artifact-design` e verificato l'organizzazione.
- Non fare commit nel repository dell'assessment di propria iniziativa.
