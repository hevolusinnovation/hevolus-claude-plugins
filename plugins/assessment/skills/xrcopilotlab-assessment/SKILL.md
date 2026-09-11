---
name: xrcopilotlab-assessment
description: >
  Assessment tecnico di proposte di progetto (tipicamente proposte Hevolus) per tradurle in
  una soluzione di agenti orchestrati sulla piattaforma XRCopilotLab, con analisi di fattibilità
  e dossier finale. Usa SEMPRE questa skill quando l'utente carica o cita una
  proposta/offerta/documento di progetto AI e chiede di "valutarla", "capire come implementarla",
  "tradurla in architettura/soluzione", "fare l'assessment", "stimare la fattibilità", o mapparla
  su agenti/MCP/XRCopilotLab — anche se non nomina esplicitamente XRCopilotLab. Copre: estrazione
  di scenari e obiettivi dalla proposta, progettazione dell'orchestrazione di agenti XRCopilotLab
  (ogni agente con bozza di system prompt e, per convenzione, un solo MCP collegato), progettazione
  dei processi BPM quando lo scenario è un procedimento con passaggi umani, discovery di fattibilità
  delle fonti dati con criteri GO/CONDIZIONALE/NO-GO, e generazione del dossier tecnico in Markdown
  e Word, scritto in modo da poter essere tradotto in un blueprint di provisioning. NON usare per redigere la proposta commerciale o l'offerta economica: questa skill
  produce la valutazione tecnica, non il pricing.
---

# XRCopilotLab Assessment

Traduci una proposta di progetto in una **soluzione concreta di agenti orchestrati su
XRCopilotLab** e valutane la fattibilità tecnica. L'output è un **dossier tecnico** che un
ingegnere porta all'incontro con il cliente e passa a chi prepara la quotazione.

Prima di iniziare leggi `references/xrcopilotlab-platform.md`: contiene i vincoli della
piattaforma e la filosofia del prodotto. Sbagliarli è l'errore più comune.

## Filosofia del prodotto (non tradirla nel dossier)

XRCopilotLab è un **servizio chiavi in mano**: l'utente finale del cliente **chatta e basta**.
Tutto il lavoro di prompt engineering, orchestrazione e integrazione lo facciamo noi in fase di
progettazione e resta **sotto il cofano** della piattaforma. Il cliente non scrive prompt, non
configura pipeline, non vede la meccanica interna: apre una chat (o un widget sul suo sito) e
ottiene il risultato.

Il dossier deve riflettere questa promessa. Descrivi **cosa risolve** la soluzione e **come è
composta in termini di agenti**, non l'ingegneria interna della piattaforma.

**Con una sola eccezione: il modulo «Processi» (BPM).** Quando lo scenario è un procedimento con
passaggi umani, il cliente non chatta e basta — le persone ricevono compiti, compilano moduli e
sorvegliano le istanze. Quel modulo è **prodotto visibile**, con pagine proprie, e nel dossier si
nomina e si descrive. Resta sotto il cofano solo l'ingegneria che lo alimenta.

## Linguaggio: cosa NON scrivere

Questa skill esiste anche per evitare derive di linguaggio viste in passato. Nel dossier:

- **Non nominare framework o tecnologie interne** (es. il framework di orchestrazione sottostante,
  librerie di agenti, "data layer", nomi di servizi cloud specifici). Sono dietro il cofano e non
  interessano né al cliente né al reparto sales. Parla di **agenti XRCopilotLab** e, dove serve,
  di **MCP server** verso le fonti dati — nient'altro a livello di piattaforma.
- **Non inventare prodotti o canali che non esistono** (es. livelli di "chat/canali" di terze
  parti). Il canale è XRCopilotLab: chat sulla piattaforma o widget embed sul sito del cliente.
- **Non usare metafore da pitch** ("ribaltiamo l'approccio", "oggetto-dato vivo", "per onde",
  "additivo e per onde", "livelli di maturità"). Scrivi in modo tecnico, piano e concreto.
- **La "skill" non è qualcosa che il cliente opera.** Per l'utente finale l'esperienza è sempre e
  solo "chatto e ottengo il risultato": non descrivere le skill come funzioni che il cliente usa o
  configura. La skill è però una **scelta di packaging tecnico** che tu, come ingegnere, puoi
  raccomandare nel dossier (vedi "Quando proporre una skill dedicata" in Fase 2). Il **framework di
  orchestrazione sottostante resta sotto il cofano**: non serve nominarlo.
- **Niente pricing né linguaggio di vendita.** È un documento tecnico.
- **Resta nel tuo ruolo tecnico: nessuna affermazione commerciale.** Non scrivere che qualcosa è
  "a pagamento", "da contabilizzare" o "incluso nell'offerta": sono decisioni fuori dalle competenze
  di chi redige la valutazione tecnica. Quando un componente esula dallo scenario base, marcalo come
  **"implementazione opzionale / fuori dal perimetro base"**, indica l'**effort tecnico** e i
  prerequisiti, e **rimanda la valutazione economica a chi cura l'offerta** (es. "componente
  opzionale; quantificazione a cura del referente commerciale").

## Le 5 fasi

Procedi in ordine. Se la proposta è un PDF estrai il testo (`pdfplumber` o lo strumento PDF
disponibile); se .docx converti con `pandoc`.

### Fase 1 — Estrai scenari e obiettivi

Ricostruisci **cosa il cliente vuole ottenere**, non come è scritto. Per ogni scenario individua
gli **obiettivi di progetto** e gli **output attesi** (le cose concrete che il cliente riceve),
citando il testo della proposta. Produci una tabella per scenario:
`Obiettivo di progetto | Descrizione (dal testo) | Note`.

### Fase 2 — Progetta l'orchestrazione di agenti XRCopilotLab

XRCopilotLab ha un **sistema di orchestrazione di agenti**. Per ogni problema/scenario del
cliente progetta una **orchestrazione**: uno o più **agenti XRCopilotLab** coordinati, dove

- **ogni agente ha una bozza di system prompt** (ruolo, cosa fa, cosa NON fa, formato risposta) —
  hardcoded, scritta da noi, invisibile all'utente. Nella bozza **non indicare l'MCP collegato**:
  l'MCP è un'impostazione dell'agente sulla piattaforma, non testo del prompt;
- **ogni agente ha un solo MCP server collegato** (o nessuno), configurato a parte sull'agente.
  Se un agente avrebbe bisogno di due fonti, spezzalo in due agenti coordinati dall'orchestratore:
  tiene gli agenti semplici e riusabili. È una **convenzione metodologica nostra, non un limite
  della piattaforma** — raccomandala pure nel dossier, ma non scrivere che più MCP su un agente
  «non si possono collegare»: è falso e verificabile;
- **l'Orchestratore** di XRCopilotLab coordina gli altri quando il flusso tocca più fonti
  (distribuisce il lavoro, riconcilia i risultati, gestisce l'eventuale passaggio all'operatore
  umano). **L'Orchestratore NON ha un system message**: è un componente di coordinamento della
  piattaforma, non un agente con prompt. Non scrivere quindi una bozza di prompt per
  l'Orchestratore; descrivi solo il flusso di coordinamento tra gli agenti.

**Prima di disegnare gli agenti, scegli il modello di erogazione.** XRCopilotLab ne ha due, e
sceglierne uno per abitudine è l'errore di progettazione più caro:

- se il cliente descrive **una domanda e una risposta** — «l'utente chiede e ottiene» — è **chat +
  orchestrazione di agenti**, ed è il caso di gran parte degli scenari;
- se descrive **chi fa cosa e in che ordine** — passaggi, approvazioni, moduli da compilare, stati
  da sorvegliare per giorni — è un **processo BPM** (modulo «Processi»), e il dossier lo progetta
  come tale: attività, corsie su ruoli aziendali, modalità di ogni passo (umano / AI-assistito /
  automatico), campi dei moduli, gateway e condizioni.

I due modelli convivono: un passo automatico di un processo è eseguito da un **agent task**, cioè
da un agente o da un orchestratore. Quando proponi un BPM verifica **sempre** due cose, prima di
scrivere la stima: che il tenant abbia la **licenza `XRCopilotLab.Process`**, e che lo scenario non
poggi su qualcosa che il BPM **non fa** — timer e scadenze che agiscono da sole, join dopo un fork
parallelo, allegati letti dagli agenti, file generati che rientrano nel flusso, avvio schedulato,
registro immutabile. L'elenco completo è in `references/xrcopilotlab-platform.md`, sezione «BPM —
cosa NON fa»: ognuno di quei punti è già stato promesso per sbaglio almeno una volta.

La **gradualità delle modalità** è l'argomento più forte da portare al cliente prudente: si parte
con il passo in modalità umana, si osserva, si promuove ad AI-assistito e infine ad automatico,
**senza ridisegnare il processo**. Mettila nel dossier come piano di adozione, non come nota
tecnica.

**Caso ricorrente — agente che risponde su documenti.** Se un obiettivo è un assistente che
risponde su manuali, circolari, schede o qualsiasi corpus documentale, la soluzione è **un agente
XRCopilotLab collegato al RAG/knowledge graph nativo, SENZA alcun MCP**. In particolare non
proporre mai un "MCP file-server" o un MCP documentale: non serve. I documenti si **caricano
manualmente** nella knowledge del tenant (attività operativa: procedura di caricamento, metadati,
formazione). L'**unico** caso che introduce un componente a parte è la **sincronizzazione
automatica tra le cartelle/CMS del cliente e il RAG di XRCopilotLab**: è un'**implementazione
opzionale aggiuntiva** (richiede un MCP/connettore di ingestion verso la fonte). Presentala come
componente **fuori dal perimetro base**, con l'effort tecnico e i prerequisiti (API di lettura
sulla fonte), e lascia a chi cura l'offerta l'eventuale valutazione economica — senza usare termini
di prezzo. Distingui due versioni: **base** (upload manuale dei documenti nella knowledge, nessun
componente aggiuntivo) e **opzionale** (sync automatica, componente extra).

Formulazione — evita di assumerti decisioni commerciali:
- Da evitare: "...è una feature dedicata a pagamento, da contabilizzare separatamente."
- Suggerita: "...i documenti vengono caricati manualmente nel knowledge graph nativo (Graph RAG,
  con citazioni e guardrail inclusi). La sincronizzazione automatica tra le cartelle/CMS del
  cliente e il knowledge graph è un'implementazione opzionale aggiuntiva (fuori dal perimetro
  base), da attivare solo se richiesta; la relativa valutazione è a cura del referente commerciale."

Prima di progettare, **verifica cosa la piattaforma fa già nativamente** (vedi il reference:
knowledge graph con citazioni/guardrail/tracking, dashboard analytics, widget di embed,
scheduling, gestione utenti/accessi). Ciò che è nativo **non è un agente né un MCP da costruire**:
si configura o si arricchisce. Segnalarlo come sviluppo è l'errore più costoso.

Gli **MCP server** vanno costruiti solo per le **fonti dati** del cliente; in XRCopilotLab si
configurano con **solo URL + credenziali** (nessuna logica di dominio dentro l'MCP). Quando la
fonte è proprietaria di un vendor (es. il CRM), l'MCP è **verticale e riusabile** per ogni cliente
con lo stesso sistema (`salesforce-mcp`, `dynamics365-mcp`, ...), a parità di contratto di tool.

**Quando proporre una skill dedicata (riusabile) invece di configurare gli agenti direttamente.**
Una *skill* di XRCopilotLab è un **pacchetto riusabile di N agenti con system prompt hardcoded,
orchestrati insieme** (il framework di orchestrazione resta sotto il cofano). È l'opzione giusta
quando conviene impacchettare uno scenario una volta e riusarlo, invece di ricablare agenti su
misura per ogni cliente. Nel dossier, valuta e raccomanda una skill dedicata quando ricorrono
questi segnali:

- lo **scenario è ricorrente** e si ripresenterà su altri clienti con lo stesso pattern di problema
  (es. "enrichment + matching per associazioni di categoria", "assistente ricambi per produttori");
- coinvolge **più agenti con logica non banale** che vale la pena definire e testare una sola volta;
- serve **coerenza e manutenzione centralizzata**: un miglioramento alla skill vale per tutti i
  clienti che la usano (versionamento);
- il comportamento è **stabile e ben definito**, quindi l'investimento di packaging si ripaga.

Al contrario, **configura gli agenti direttamente** sulla piattaforma (orchestratore + agenti, ognuno
≤1 MCP, senza creare una skill) quando l'orchestrazione è **semplice, specifica del cliente e poco
riusabile**. In ogni caso l'esperienza per l'utente finale non cambia: chatta e basta.

Quando raccomandi una skill dedicata, indica: il **nome** proposto, gli **agenti interni** che la
compongono (con le bozze di prompt e l'eventuale MCP di ciascuno, max 1), e **perché è riusabile**
(quali altri clienti/scenari la riuserebbero). Resta una raccomandazione tecnica di packaging: non
è qualcosa che il cliente vede o opera.

Per ogni scenario produci:
1. la tabella `Obiettivo → come è risolto` (agenti coinvolti + eventuale MCP, e cosa è nativo);
2. l'elenco degli **agenti** con, per ciascuno, la **bozza di system prompt** (senza citare l'MCP)
   e, come **metadato a parte**, l'**MCP collegato (max 1) o "nessuno"**. L'Orchestratore compare
   solo nello schema di coordinamento, senza prompt;
3. lo schema di orchestrazione (chi coordina chi), come diagramma ```mermaid``` se aiuta;
4. **se lo scenario è un procedimento**, il disegno del processo BPM: le attività in ordine, per
   ognuna la **modalità** (umano / AI-assistito / automatico), il **ruolo aziendale** della corsia,
   i **campi del modulo** e le **condizioni** dei gateway; più come parte l'istanza (manuale o
   webhook). È il capitolo che si traduce in un blueprint (vedi Fase 5): se resta vago, la
   configurazione va reinventata da chi la esegue.

Riusa il pattern e gli esempi di bozza prompt in `references/xrcopilotlab-platform.md`.

### Fase 3 — Discovery di fattibilità

Nessun MCP si stima a occhio. Per ogni MCP/fonte dati genera: **domande** al cliente,
**verifiche tecniche** concrete (endpoint, auth, permessi, rate limit), un **test di fattibilità**
eseguibile (una read reale, e una write in sandbox dove serve) e i **criteri di esito**:

- 🟢 GO — fattibile e verificabile ora
- 🟡 CONDIZIONALE — fattibile con vincoli o fallback (indica quale)
- 🔴 NO-GO — non fattibile con l'accesso attuale (indica il fallback)

Per le fonti italiane ricorrenti (Registro Imprese/InfoCamere, Cribis/CRIF) usa
`references/data-sources-italy.md` (vie di accesso già verificate). Per fonti nuove, cerca il
developer portal ufficiale e verifica se l'auth è machine-to-machine (API key/OAuth) o interattiva
(SPID/CIE/login umano): è il discrimine principale di fattibilità per un MCP.

Chiudi la discovery **in prosa**, un breve paragrafo per componente (prerequisito, test proposto,
esito 🟢/🟡/🔴 con il fallback), e una **scheda di rilevazione** come elenco puntato di domande —
non come tabellone. Una tabella qui va bene solo se resta a 2-3 colonne con celle di poche parole
(es. `Componente | Esito | Fallback`); se le celle diventano frasi, passa alla prosa.

### Fase 3-bis — Raccogli i punti in sospeso (obbligatorio)

Mentre svolgi le fasi 1-3, **annota ogni cosa che la documentazione del sales non chiarisce** e
che non puoi risolvere tecnicamente da solo. Questi punti NON vanno "risolti" inventando ipotesi:
vanno raccolti in un **capitolo dedicato del dossier** e riportati come domande aperte da chiudere.

Cosa registrare come punto in sospeso:
- **Fonti dati non definite** — un obiettivo richiede dati ma la proposta non dice da quale sistema
  provengono, o cita una fonte senza specificarne accesso/formato.
- **Parametri di origine/lettura ignota** — valori o campi menzionati (es. una soglia, uno stato,
  una categoria) di cui non si capisce dove sono memorizzati né come vengono letti/valorizzati.
- **Ambiguità funzionali** — comportamenti descritti in modo vago o interpretabile in più modi.
- **Prerequisiti non verificabili ora** — accessi, credenziali, ambienti sandbox non ancora
  disponibili (collegali all'esito 🟡/🔴 della discovery).
- **Decisioni non tecniche** — scelte che spettano al cliente o al referente commerciale.

Nel dossier riporta i punti in sospeso **come elenco descrittivo**, non come tabella a molte colonne:
per ciascuno un punto elenco con il **titolo in grassetto**, una frase su a quale scenario/componente
si riferisce e perché è aperto, e la **domanda precisa** da porre per chiuderlo. Se un'assunzione è
inevitabile per proseguire, marcala in chiaro come "assunzione da confermare", non come dato certo.

### Fase 4 — Genera il dossier

Assembla tutto nella struttura di `references/dossier-structure.md` e salva un file Markdown. Se il
cliente ha selezionato una cartella salva lì, altrimenti nella cartella di lavoro.

**Testa del file Markdown.** Inizia il file con **solo il titolo** (`# <Titolo del report>`) e una
**breve descrizione testuale** (1-2 frasi) di cosa contiene il documento — niente blocco di metadati
esteso (cliente/data/base/uso): quelle informazioni vivono nel frontespizio del Word. Questa testa
serve a rendere il .md autodescrittivo ed è comunque esclusa dal Word (il generatore parte dalla
prima sezione `## …`). Titolo e sottotitolo del frontespizio si passano allo script via
`--title`/`--subtitle`.

Per la versione **Word**, il metodo predefinito è **iniettare il Markdown nel template Office**
`assets/template.docx` con lo script Python bundlato: eredita gli stili nativi (font **Aptos**,
Heading colorati, Title/Subtitle), riusa il **frontespizio** del template e sostituisce i segnaposto
`[Document title]`, `[Document subtitle]`, `[Year]`. Uso:

```
python scripts/md_to_docx_template.py <input.md> <output.docx> \
  --template assets/template.docx \
  --title "<Titolo>" --subtitle "<Sottotitolo>" --year "<es. Giugno 2026>"
```

Se il cliente ha un proprio template Office, passalo con `--template` al posto di quello bundlato.
Per un output fortemente **branded** (colori/layout su misura) usa invece la skill `docx`.
Lo script gestisce heading, paragrafi, liste, tabelle brevi, blocchi di codice e **immagini**
`![](path.png)`: renderizza prima i diagrammi in PNG (vedi sotto) e referenziali nel Markdown.

**Stile e leggibilità — la prosa prima delle tabelle.** Il report deve essere gradevole e ordinato.
Le tabelle larghe con celle lunghe sono illeggibili in Word: usale con parsimonia. Regole:

- Usa una tabella **solo** per dati davvero tabellari, con **max 3-4 colonne** e **celle di poche
  parole** (es. `Obiettivo | Realizzato da`, `Componente | Esito | Fallback`).
- Se una tabella avrebbe più di 4 colonne, o celle che diventano frasi, **convertila in prosa**:
  un breve paragrafo o un punto elenco per riga, con l'etichetta in grassetto seguita dalla
  descrizione. Vale in particolare per punti in sospeso, discovery/fattibilità, catalogo agenti con
  le bozze di prompt.
- Le **bozze di system prompt** vanno in blocchi di codice, non dentro celle di tabella.
- Preferisci sezioni brevi, sottotitoli chiari, spaziatura ariosa; evita muri di testo e tabelloni.

Verifica sempre l'output (converti in PDF e guarda le pagine) prima di consegnare: se una tabella
sfora il margine o ha celle fitte di testo, riscrivila in prosa.

**Diagrammi — stile mind map, non scatole elementari.** Per la vista d'insieme della soluzione e
per le orchestrazioni usa un layout a **mappa mentale / radiale** che comunichi la gerarchia
"problema → agenti → MCP/fonte" a colpo d'occhio, evitando i banali box-and-arrow ortogonali.
Opzioni: blocco ```mermaid``` di tipo `mindmap` (nodo radice = soluzione/scenario, rami = agenti,
foglie = MCP o "nativo"); oppure, per il Word, un grafo radiale con Graphviz (`twopi` o `neato`)
con nodi arrotondati e una palette sobria coerente. Tieni le etichette brevi e i colori pochi:
un colore per "agente", uno per "MCP", uno per "nativo". **Per il Word esporta ogni diagramma in
PNG** (mmdc per i mermaid, o `dot -Ktwopi`/`neato` per i grafi Graphviz) e referenzialo nel Markdown
come `![](diagrams/nome.png)`: lo script del template lo incorpora automaticamente.

### Fase 5 — Prepara la consegna al provisioning

Il dossier non è la fine della catena. Il flusso di lavoro completo è:

```
Claude Desktop + plugin assessment          Claude Code + plugin blueprints
  proposta del cliente                         dossier dell'assessment
        ↓                                              ↓
  dossier .md/.docx           ──────────▶       manifest .yml
                                                       ↓
                                          xrcopilotlab-bp: piano → conferma → tenant configurato
```

Chi configura l'ambiente parte **da questo documento**, quindi il dossier deve contenere tutto ciò
che serve a scrivere il manifest senza tornare a chiedere. In appendice aggiungi un capitolo
**«Elementi per il provisioning»** con, per ogni scenario che si propone di implementare:

- il **tag** suggerito (il contesto o il cliente in maiuscolo, es. `STUDIOPOLIS`) — tutto ciò che
  il blueprint crea prende il prefisso `BP-<TAG>-`;
- i **topic**, con i documenti da caricare nella knowledge;
- i **ruoli aziendali** con i membri (sono le corsie del processo, distinti dai ruoli della
  piattaforma);
- gli **agenti**: nome, system message, skill del catalogo, topic di riferimento;
- gli **agent task** che fanno da performer ai passi non umani;
- il **processo**: attività, modalità, corsie, moduli, gateway, modalità di avvio;
- i **segreti** necessari, **citati per nome e mai per valore** (es. «la password della casella
  che il processo legge»): nei manifest i segreti si scrivono come riferimento a una chiave di
  configurazione, e il valore non entra mai in un documento né in una conversazione.

Dichiara anche i **passi manuali residui**: connessioni, server MCP, orchestratori e risorse
esterne oggi si dichiarano nel manifest ma **non vengono creati dal provisioning**, e il campo
modulo di tipo allegato va aggiunto dall'editor. Vanno nel piano di attivazione, altrimenti la
tempistica promessa non regge.

## Errori da evitare

- Nominare tecnologie interne o prodotti inesistenti (vedi "Linguaggio"): il cliente vede solo
  agenti XRCopilotLab in chat.
- Marcare come "da sviluppare" ciò che la piattaforma offre già nativo (widget, dashboard,
  knowledge graph con citazioni/guardrail).
- Proporre un "MCP file-server"/MCP documentale per un agente di Q&A sui documenti: il RAG è
  nativo e i documenti si caricano manualmente. La sincronizzazione automatica CMS→RAG è l'unico
  componente extra, da presentare come **implementazione opzionale fuori dal perimetro base** (mai
  come voce "a pagamento": la quantificazione economica non spetta al tecnico).
- Collegare più di un MCP a un singolo agente: se servono due fonti, servono due agenti orchestrati
  (è una nostra convenzione — raccomandala, ma non spacciarla per un limite della piattaforma).
- **Promettere sul BPM cose che il BPM non fa**: timer, scadenze che avanzano il processo da sole,
  escalation automatica, join dopo un fork parallelo, agenti che leggono gli allegati, file generati
  che rientrano nel flusso, avvio schedulato di un'istanza, registro immutabile. Ognuna di queste
  va scritta come componente **da costruire**, con la sua stima.
- **Proporre il modulo Processi senza verificare la licenza** `XRCopilotLab.Process` sul tenant.
- **Confondere l'approvazione umana dell'orchestratore con un passo umano del BPM**: la prima è una
  email con timeout dentro una conversazione, il secondo è un compito in lista di lavoro con corsia,
  modulo e assegnatario.
- Progettare una chat dove il cliente ha descritto un procedimento (o l'opposto): il discrimine è
  «una domanda e una risposta» contro «chi fa cosa e in che ordine».
- Lasciare il capitolo dell'orchestrazione così vago da non essere traducibile in un blueprint —
  senza corsie, moduli e condizioni chi configura l'ambiente deve reinventarli.
- Scrivere il **valore** di un segreto (password, chiave, token) nel dossier: si cita il nome della
  credenziale che servirà, mai il contenuto.
- Diagrammi piatti a scatole quando una mind map comunica meglio la struttura della soluzione.
- Mettere logica di dominio o parametri cliente dentro un MCP: gli MCP prendono solo URL+credenziali.
- Stimare un componente senza un test di fattibilità: senza verifica resta CONDIZIONALE.
- Introdurre pricing o argomentazioni di vendita.
- Colmare con ipotesi inventate ciò che il sales non ha chiarito (fonti/parametri/ambiguità):
  quei punti vanno nel capitolo "Punti in sospeso" come domande aperte, non risolti a indovinare.
