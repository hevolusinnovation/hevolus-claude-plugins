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
     allunga quanto serve; *Per chi presenta* non compare mai;
   - tabelle in contenitori scorrevoli, tema chiaro e scuro, e nessun dato del tenant nel titolo o
     nella descrizione.
3. **I disegni** vanno in blocchi `<pre class="mermaid">`: gli artifact li rendono da soli, senza
   libreria. Colori e modelli sono quelli di [`grafici.md`](grafici.md), con la legenda di una riga
   sotto ciascuno.
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
7. **Pubblicare con `Artifact`** dalla cartella di lavoro della sessione, poi **aprire subito la
   pagina nel browser dell'utente** — è un passo obbligatorio. Prima strada: gli strumenti **Claude
   in Chrome** (`tabs_context_mcp`, poi `navigate` sull'URL), che la aprono nella sessione Chrome
   dove l'utente è già loggato. Se l'estensione non è connessa: `open <url>` su macOS, `xdg-open` su
   Linux, `start` su Windows. Così se compare «Page not found» il problema dell'organizzazione emerge
   adesso, non in sala. Dire anche come si riapre: `ctrl+]` riapre l'ultimo artifact della sessione,
   `/artifacts` li elenca.
8. **Ripubblicare lo stesso percorso** aggiorna la stessa pagina: non cambiare nome al file fra una
   versione e l'altra, altrimenti nasce un artifact nuovo e il link già dato al cliente resta vecchio.
9. **Copia locale** accanto al Markdown (`guida-<scenario>.html`): lo stesso HTML avvolto in un
   documento completo, con Mermaid caricato da cdnjs per i disegni. Si apre con un doppio clic,
   senza account: è la rete di sicurezza per la sala, dove il login può non esserci. **Aprirla e
   guardarla** prima di consegnarla: un errore di sintassi Mermaid mostra il codice al posto del
   disegno.

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
secondo artifact, separato. *Per chi presenta* va solo nel deck per i sales, in coda alla nota del
relatore.
