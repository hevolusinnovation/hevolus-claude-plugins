# La pagina web della guida

La guida si consegna anche come **artifact**: una pagina privata su claude.ai, con un link da
proiettare o condividere, che il cliente apre senza clonare niente. Non è un extra: il Markdown è
la sorgente, la pagina è ciò che si mostra. Il deck per i sales nasce dalla stessa sorgente, con il
tipo Slides (SKILL §4): la pagina e il deck hanno le **stesse slide, nello stesso ordine**.

## Come si costruisce, nell'ordine

1. **Prima il Markdown**, completo e mostrato all'utente. La pagina non aggiunge contenuto: lo
   impagina.
2. **Caricare la skill `artifact-design`** prima di scrivere l'HTML — è obbligatorio, e decide
   trattamento, palette, tipografia. Per queste guide il trattamento è quello di **una storia a
   slide che si scorre**, non di un documento né di una landing page:
   - **una slide del Markdown = un riquadro della pagina**, alto quanto lo schermo su un monitor
     (`min-height` vicino a `100svh`, con `scroll-snap-type: y proximity` sul contenitore) e alto
     quanto il suo contenuto su un telefono, dove lo snap si spegne;
   - **il titolo della slide è la cosa più grande del riquadro**, il corpo sotto, centrato nella
     verticale; un disegno o uno scambio domanda/risposta occupa il riquadro da solo;
   - in un angolo, discreti, **l'atto e il numero** («La storia · 4 / 18»), e una barra di
     avanzamento sottile in alto; frecce ↑ ↓ e PagSu/PagGiù per passare da una slide all'altra
     (`prefers-reduced-motion` toglie lo scorrimento animato);
   - **l'approfondimento si vede sempre**, sotto il corpo, in un riquadro più sommesso con la sua
     etichetta: è ciò che fa della pagina una guida e non un deck muto. Il riquadro della slide si
     allunga quanto serve; le note per ruolo (Sales, AI Specialist, Da soli) non compaiono mai;
   - **le slide di demo si riconoscono a colpo d'occhio**: un fondo diverso, l'etichetta «Demo D2» al
     posto dell'atto, i punti da guardare come una lista numerata. Chi legge la pagina dopo la
     sessione sa che lì c'è stata una prova dal vivo, e che cosa ha mostrato;
   - tabelle in contenitori scorrevoli, tema chiaro e scuro, e nessun dato del tenant nel titolo o
     nella descrizione.
3. **Il flusso** — l'unico disegno — la pagina lo disegna dall'elenco del Markdown: un riquadro per
   passo, colorato per chi lo fa, con la legenda di una riga sotto ([`grafici.md`](grafici.md)).
   HTML e CSS della pagina, **mai** un blocco Mermaid: se non viene trasformato, il cliente vede il
   codice.
4. **La slide «dove lavora l'AI»** merita un trattamento visivo proprio: le tre colonne (AI ·
   persone · regole fisse) come tre riquadri affiancati con i colori dei disegni, così il lettore
   riconosce lo stesso codice in tutta la pagina.
5. **Gli esempi di domande e risposte** si impaginano come una conversazione: la domanda in un
   fumetto a destra (chi chiede), la risposta possibile in un fumetto a sinistra (l'assistente,
   con il viola dell'AI), una per slide. Sulla prima slide dell'atto, visibile, la riga «le parole
   cambiano da una volta all'altra, il contenuto no». Nessuna spunta, nessun «superata».
6. **Titolo** = il nome dello scenario nella lingua del cliente («Conoscenza degli associati»),
   non un'etichetta generica; la spiegazione va nella `description` del publish. Icona coerente con
   il dominio e **stabile** fra le ripubblicazioni.
7. **Pubblicare con `Artifact`** dalla cartella di lavoro della sessione, **con la sorgente fra i
   `files`** — `{"guida.md": "<percorso nello scratchpad>"}` per la pagina del cliente,
   `{"guida-tecnica.md": …}` per quella interna — così chi viene dopo la rilegge con
   `action: "read"`, `path: "guida.md"` senza bisogno di un repository. Poi **aprire subito la
   pagina nel browser dell'utente** — è un passo obbligatorio. Prima strada: gli strumenti **Claude
   in Chrome** (`tabs_context_mcp`, poi `navigate` sull'URL), che la aprono nella sessione Chrome
   dove l'utente è già loggato. Se l'estensione non è connessa: `open <url>` su macOS, `xdg-open` su
   Linux, `start` su Windows. Così se compare «Page not found» il problema dell'organizzazione emerge
   adesso, non in sala. Dire anche come si riapre: `ctrl+]` riapre l'ultimo artifact della sessione,
   `/artifacts` li elenca.
8. **Aggiornare, non ricreare.** Nella stessa sessione basta ripubblicare lo stesso percorso; in una
   sessione nuova si trova l'artifact con `action: "list"`, lo si legge (`action: "read"`, con
   `path` per la sorgente) e si ripubblica passando il suo `url`. Un publish senza `url` crea un
   artifact nuovo, e il link già dato al cliente resta vecchio.
9. **Copia per la sala**: lo stesso HTML avvolto in un documento completo, senza librerie esterne,
   che si apre con un doppio clic e senza account — la rete di sicurezza dove il login può non
   esserci. Si offre all'utente come file da scaricare (o si salva dove dice lui, di norma la
   cartella Download); nel repository dell'assessment, se c'è, accanto al Markdown. **Aprirla e
   guardarla** prima di consegnarla.

## L'organizzazione conta

Un artifact appartiene all'account **e all'organizzazione** con cui la sessione è autenticata;
chi lo apre da un'altra organizzazione vede «Page not found». Prima di pubblicare per un cliente
Hevolus, verificare con `/status` che la sessione sia nell'organizzazione Hevolus; se non lo è,
dire all'utente di fare `/login` scegliendo quella, e pubblicare dopo. Un artifact pubblicato
nell'organizzazione sbagliata non si sposta: si ripubblica.

## Che cosa non va nella pagina

Solo ciò che il cliente può vedere: nessun risultato di collaudo, nessun id di istanze, run, webhook o chiavi, nessun triage per
componente, nessun nome di file interno, nessun codice di rilievo. La parte «per chi conduce la
sessione» delle domande di prova **non** entra: se serve una pagina anche per chi conduce, è un
secondo artifact, separato. Le note per ruolo vanno solo nel deck, in coda alla nota del relatore.

## La pagina interna della guida tecnica

Un **artifact separato** da quello del cliente, con un nome che lo dica («Agenda di Studio Polis —
demo (interna)»), con `guida-tecnica.md` fra i `files`, mai condiviso con il cliente. Trattamento da documento di lavoro, non da slide: in alto la
scheda (§0) e l'indice delle demo; ogni demo in una sezione che si apre e si chiude, con i passi come
lista numerata, i blocchi da copiare con un pulsante «Copia», «Deve comparire» evidenziato, la tabella
«Se va storto» sempre visibile. Si legge anche sul telefono, che è dove l'AI Specialist la guarda
mentre lo schermo grande mostra la demo. Stessa copia per la sala, offerta come file da scaricare.
