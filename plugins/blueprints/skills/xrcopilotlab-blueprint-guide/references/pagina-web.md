# La pagina web della guida

La guida si consegna anche come **artifact**: una pagina privata su claude.ai, con un link da
proiettare o condividere, che il cliente apre senza clonare niente. Non è un extra: il Markdown è
la sorgente, la pagina è ciò che si mostra.

## Come si costruisce, nell'ordine

1. **Prima il Markdown**, completo e mostrato all'utente. La pagina non aggiunge contenuto: lo
   impagina.
2. **Caricare la skill `artifact-design`** prima di scrivere l'HTML — è obbligatorio, e decide
   trattamento, palette, tipografia. Per queste guide il trattamento è quello di un documento
   curato da leggere, non una landing page: indice fisso a sinistra su schermi larghi, testo a
   circa 68 caratteri per riga, tabelle in contenitori scorrevoli, tema chiaro e scuro. Nessun dato
   del tenant nel titolo o nella descrizione.
3. **I disegni** vanno in blocchi `<pre class="mermaid">`: gli artifact li rendono da soli, senza
   libreria. Colori e modelli sono quelli di [`grafici.md`](grafici.md), con la legenda di una riga
   sotto ciascuno.
4. **La sezione «dove lavora l'AI»** merita un trattamento visivo proprio: le tre colonne (AI ·
   persone · regole fisse) come tre riquadri affiancati con i colori dei disegni, così il lettore
   riconosce lo stesso codice in tutta la pagina.
5. **Titolo** = il nome dello scenario nella lingua del cliente («Conoscenza degli associati»),
   non un'etichetta generica; la spiegazione va nella `description` del publish. Icona coerente con
   il dominio e **stabile** fra le ripubblicazioni.
6. **Pubblicare con `Artifact`** dalla cartella di lavoro della sessione, poi **aprire subito la
   pagina nel browser dell'utente** — è un passo obbligatorio. Prima strada: gli strumenti **Claude
   in Chrome** (`tabs_context_mcp`, poi `navigate` sull'URL), che la aprono nella sessione Chrome
   dove l'utente è già loggato. Se l'estensione non è connessa: `open <url>` su macOS, `xdg-open` su
   Linux, `start` su Windows. Così se compare «Page not found» il problema dell'organizzazione emerge
   adesso, non in sala. Dire anche come si riapre: `ctrl+]` riapre l'ultimo artifact della sessione,
   `/artifacts` li elenca.
7. **Ripubblicare lo stesso percorso** aggiorna la stessa pagina: non cambiare nome al file fra una
   versione e l'altra, altrimenti nasce un artifact nuovo e il link già dato al cliente resta vecchio.
8. **Copia locale** accanto al Markdown (`guida-<scenario>.html`): lo stesso HTML avvolto in un
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

Solo ciò che il cliente può vedere: nessun id di istanze, run, webhook o chiavi, nessun triage per
componente, nessun nome di file interno, nessun codice di rilievo. La parte «per chi conduce la
sessione» delle domande di prova **non** entra: se serve una pagina anche per chi conduce, è un
secondo artifact, separato.
