---
name: xrcopilotlab-blueprint-demo
description: Scrive il brief per l'agenzia di marketing da un blueprint XRCopilotLab (manifest) o da un dossier di assessment - gli scenari di processo vendibili, compresi quelli già realizzati, in lingua da sales e senza tecnicismi, pubblicati come artifact «DEMO-» con il PDF. Per ogni scenario - per chi, il problema, com'è dopo, come funziona, dove decide la persona, il messaggio, i fatti citabili, che cosa non dire, e lo stato (realizzato / pronto da installare / si configura). Anonimizza i clienti e scarta ciò che richiede sviluppo; non scrive post né immagini. Usa quando l'utente chiede "il brief per l'agenzia", "gli scenari per i sales", "cosa possiamo vendere da questo blueprint o assessment", "materiale di marketing da un blueprint", "marketing brief", "sales scenarios". NON per la guida di un cliente (xrcopilotlab-blueprint-guide), l'assessment (xrcopilotlab-assessment) o il manifest (xrcopilotlab-blueprint).
---

# xrcopilotlab-blueprint-demo

Le altre skill dei blueprint vanno **dal cliente al blueprint**: si valuta la proposta, si scrive il
manifest, lo si collauda, si spiega a quel cliente. Questa fa la strada opposta, **dal blueprint al
mercato**: prende uno scenario costruito per qualcuno e ne ricava gli scenari che si possono
proporre ad altri.

Il lettore non è il cliente. È un'**agenzia di marketing**, che non conosce la piattaforma e deve
produrre tutto il materiale (post, visual, landing, brochure) partendo da un documento solo. Quel
documento è il brief che scrive questa skill, e ha tre requisiti:

1. **Si capisce senza sapere niente di tecnologia.** Nessuna parola nostra: vedi
   [`references/linguaggio-sales.md`](references/linguaggio-sales.md).
2. **Non espone nessun cliente.** Il brief esce da Hevolus verso un terzo, e da lì verso il pubblico:
   vedi [`references/riservatezza.md`](references/riservatezza.md).
3. **Non promette niente che non esista.** Ciò che l'agenzia legge, lo scrive come vero. Ogni scenario
   ha uno stato verificato, e ciò che richiede sviluppo non entra: vedi
   [`references/scenari.md`](references/scenari.md).

## Chi fa che cosa

| Chi | Fa | Non fa |
|---|---|---|
| `xrcopilotlab-assessment` (plugin) | valuta una proposta e scrive il dossier tecnico | il materiale di vendita |
| [`xrcopilotlab-blueprint`](../xrcopilotlab-blueprint/SKILL.md) | scrive e applica il manifest | — |
| [`xrcopilotlab-blueprint-guide`](../xrcopilotlab-blueprint-guide/SKILL.md) | la guida e il deck **per un cliente**, sulla sua demo | il materiale per il mercato |
| **Questa skill** | il **brief per l'agenzia**: scenari vendibili, anonimi, in lingua da sales | post, immagini, testi finali; toccare il tenant; scrivere manifest |

È una skill **di sola lettura**: legge file e, se serve, archivio e catalogo con la CLI. Non esegue
script, non avvia l'API locale, non applica niente. Funziona anche su Claude Desktop, dove la CLI non
c'è: lì le fonti sono i file che l'utente allega.

## Se il plugin è indietro

Se all'apertura della sessione compare l'avviso del plugin blueprints («c'è il plugin 2.x, questo è
il 2.y»), dillo all'utente in una riga, con i due comandi (`/plugin marketplace update hevolus`,
`/plugin update blueprints@hevolus`) e il riavvio. Non è urgente: si finisce il brief e si aggiorna
dopo.

## 0. Se `$ARGS` è vuoto

Orientare e fermarsi. In poche righe:

- a che cosa serve il brief e chi lo legge (l'agenzia, non il cliente);
- le **fonti disponibili**: i manifest nell'archivio del tenant di collaudo di staging
  (`xrcopilotlab-bp pull --tag <TAG>`), i modelli del catalogo (`xrcopilotlab-bp catalog list`), i
  dossier in `../hevolus-assessment/customers/*/`;
- gli scenari **già realizzati**, dal registro [`references/scenari-esistenti.md`](references/scenari-esistenti.md);
- le domande: da quale fonte si parte, e se c'è un settore o una funzione su cui l'agenzia deve
  concentrarsi (per esempio «studi professionali», «uffici acquisti»).

Poi aspettare la risposta.

## 1. Leggere la fonte

Una fonte è un **manifest** oppure un **dossier di assessment**; se ci sono entrambi, meglio: il
manifest dice che cosa esiste, il dossier dice con quali parole il cliente ha descritto il problema.
Come si legge ciascuna, e che cosa se ne ricava: [`references/fonti.md`](references/fonti.md).

Il risultato è il **modello dello scenario d'origine**, scritto per te e non per l'agenzia: il
problema, il flusso, chi fa ogni passo, i **mattoni** usati, i limiti dichiarati, i fatti citabili.

## 2. Costruire l'elenco degli scenari

Tre gruppi, in quest'ordine:

1. **Lo scenario d'origine**, anonimizzato. Se la fonte è solo un assessment non c'è: si parte
   dagli scenari del dossier che superano la prova, anche ridotti alla parte che la supera.
2. **Gli scenari derivati**, lungo tre assi — stesso flusso in un altro settore, altro processo nello
   stesso settore, stessa capacità in un'altra funzione aziendale. Da tre a sei in tutto: meglio
   pochi e solidi che molti e vaghi.
3. **Gli scenari già realizzati**, dal registro: tutti quelli con stato valido, non solo quelli della
   stessa famiglia. L'agenzia deve vedere l'intero portafoglio.

Ogni scenario ha uno **stato**, e lo stato si prova, non si stima:
[`references/scenari.md`](references/scenari.md) dice come, con l'elenco dei mattoni e dei limiti
noti. Uno scenario derivato che ha bisogno di un mattone che nessuno scenario realizzato usa **non
entra nel brief**: lo si elenca all'utente nel messaggio finale, come «richiede sviluppo».

## 3. Scrivere le schede

La struttura del brief, i campi di ogni scheda e le lunghezze: [`references/brief.md`](references/brief.md).
Le parole: [`references/linguaggio-sales.md`](references/linguaggio-sales.md). Due regole che non
si derogano:

- **Nessun numero senza fonte.** Si usano i fatti di funzionamento che il manifest o la guida
  dicono (i tempi misurati, ogni quanto gira un controllo); i risultati di un cliente solo se
  autorizzati, e scritti come tali.
- **«Da non dire» è obbligatorio** su ogni scheda. Sono i limiti veri dello scenario, detti nella
  forma in cui l'agenzia rischierebbe di scriverli («legge anche gli allegati PDF»). È il campo che
  protegge il sales davanti al cliente.

## 4. I due controlli prima di pubblicare

Entrambi **bloccanti**: se uno fallisce si corregge e si ripete, non si pubblica «con riserva».

1. **Riservatezza** — l'elenco in [`references/riservatezza.md`](references/riservatezza.md): nessun
   nome di cliente, persona, dominio, tag, città che identifichi, dato reale.
2. **Linguaggio** — nessuna parola della lista nera in
   [`references/linguaggio-sales.md`](references/linguaggio-sales.md). Si cerca nel testo del brief
   (con `grep -niwE` sul file, o rileggendo se non c'è una shell), e ogni occorrenza si riscrive.

## 5. Pubblicare

1. Caricare la skill **`artifact-design`** (obbligatorio prima di scrivere l'HTML).
2. Partire dal modello [`references/brief-template.html`](references/brief-template.html): stessa
   struttura, stessa palette per tutti i brief, così l'agenzia riconosce il formato da un brief
   all'altro. Il titolo (`<title>` e `<h1>`) porta sempre il prefisso **`DEMO-`**:
   «DEMO-Agenda e scadenze».
3. Salvare in `../hevolus-assessment/marketing/brief-<famiglia>.html` se quel repository c'è,
   altrimenti nella cartella di lavoro della sessione. **Stesso percorso a ogni aggiornamento**: un
   nome nuovo crea un artifact nuovo, e il link già dato all'agenzia resta vecchio.
4. **Il PDF, nella cartella che sceglie l'utente.** Il brief esiste sempre anche in PDF: è il
   formato che si manda all'agenzia. **Prima di generarlo chiedi all'utente in quale cartella
   salvarlo** (`AskUserQuestion`), proponendo come prima scelta la cartella della fonte — quella del
   dossier o del manifest da cui è nato il brief — e come seconda `../hevolus-assessment/marketing/`.
   Non scegliere tu la cartella e non salvare il PDF da nessun'altra parte, nemmeno «per comodità»:
   può essere una cartella condivisa con il cliente, e decide l'utente. La risposta vale per tutti i
   brief della sessione; alla prima pubblicazione di una sessione nuova si chiede di nuovo. Il nome
   è `brief-<famiglia>.pdf`. Si genera dall'HTML con Chrome senza interfaccia (il modello ha già lo
   stile di stampa: niente filtri, schede intere):
   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
     --no-pdf-header-footer --virtual-time-budget=5000 \
     --print-to-pdf="<cartella scelta>/brief-<famiglia>.pdf" "file://<percorso dell'html>"
   ```
   Su Windows è `chrome.exe` o `msedge.exe` con le stesse opzioni. Aprire il PDF e guardarlo una
   volta. Dove non c'è una shell (Claude Desktop) il PDF non si genera: si pubblica senza e lo si
   dice, suggerendo di rifarlo da Claude Code.
5. Prima di pubblicare, `/status`: la sessione deve essere nell'organizzazione **Hevolus**.
6. Pubblicare con `Artifact` (privato), icona `megaphone`, con il PDF fra i file e la capacità di
   download: `files: {"brief-<famiglia>.pdf": "<percorso del pdf>"}`,
   `capabilities: {downloads: true}`. Il PDF allegato deve stare sotto la cartella di lavoro o nella
   cartella di lavoro della sessione: se la cartella scelta dall'utente è altrove, copialo prima lì
   (la copia serve solo alla pubblicazione; quella dell'utente resta dov'è). Il pulsante «Scarica il PDF» della pagina lo offre al lettore;
   nella copia HTML locale lo stesso pulsante diventa un link a `brief-<famiglia>.pdf` accanto
   all'HTML, quindi funziona solo se l'utente ha scelto la stessa cartella. Poi **aprirlo subito** nel
   browser dell'utente (Claude in Chrome, oppure `open <url>`). Ogni volta che il brief cambia si
   rigenera anche il PDF e si ripubblicano entrambi.
7. Dire all'utente come arriva all'agenzia, che è **fuori dall'organizzazione** e con un link privato
   vede «Page not found»: o attiva lui la condivisione pubblica dell'artifact, o manda il PDF dalla
   cartella scelta al punto 4. Non attivarla tu.

## 6. Il messaggio finale all'utente

Breve: il link, **dove è stato salvato il PDF**, quanti scenari per stato, e **che cosa è rimasto fuori e perché** — gli scenari che
richiedono sviluppo, i dati che servirebbe autorizzare. Se hai trovato un limite che il registro
dei mattoni non conosceva, proponi di aggiornare
[`references/scenari-esistenti.md`](references/scenari-esistenti.md).

## Cosa non fare

- Non scrivere post, slogan, hashtag, immagini o prompt per immagini: sono il lavoro dell'agenzia.
- Non mettere nel brief il nome di un cliente, nemmeno «per contesto», senza un'autorizzazione
  scritta all'uso come referenza.
- Non dare a uno scenario uno stato più alto di quello che le fonti dimostrano; non inventare
  percentuali, risparmi di tempo o numeri di clienti.
- Non riportare esiti di collaudo, difetti, issue, versioni del manifest o nomi di componenti.
- Non promettere integrazioni «con qualunque gestionale»: si nomina solo ciò che un mattone copre.
- Non pubblicare senza aver caricato `artifact-design` e verificato l'organizzazione.
