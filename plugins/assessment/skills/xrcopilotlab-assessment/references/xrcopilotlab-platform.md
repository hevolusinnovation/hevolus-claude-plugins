# Piattaforma XRCopilotLab — vincoli e filosofia per un assessment corretto

Rispettare questi punti è ciò che distingue un assessment utile da uno sbagliato.

**Verificato sul codice l'11 settembre 2026**, su `xrcopilotlab-webapp-dotnet` alla v3.2.0 più il
lavoro sui blueprint. Quando un'affermazione qui contraddice un assessment precedente, vale questa.

> **La regola che rende utile questo documento: non promettere al cliente ciò che qui non è elencato
> come esistente.** Un assessment che dà per fatto un componente che non c'è produce un piano con
> una voce a zero giorni che ne vale quindici, e l'errore si scopre in implementazione, a preventivo
> firmato. Quando una cosa serve e non c'è, si scrive che va costruita e si stima: è
> un'informazione utile per il cliente, non una debolezza da nascondere.

## Filosofia: servizio chiavi in mano, l'utente chatta e basta

XRCopilotLab consegna al cliente un servizio pronto: l'utente finale **apre una chat** (sulla
piattaforma o tramite widget embed sul suo sito) e ottiene il risultato. Tutto il lavoro di
prompt engineering, orchestrazione e integrazione è fatto da noi in progettazione e resta
**sotto il cofano**. Il cliente non scrive prompt e non vede la meccanica interna.

Conseguenza per il dossier: descrivi **cosa risolve** la soluzione e **come è composta in termini
di agenti orchestrati**, mai l'ingegneria interna della piattaforma.

## Cosa NON nominare (sta sotto il cofano o non esiste)

- Il **framework di orchestrazione interno** con cui costruiamo le capacità di XRCopilotLab è un
  dettaglio implementativo: non va citato nel dossier. Non nominare librerie di agenti, "data
  layer", nomi di servizi cloud specifici.
- Una **"skill"** è un **pacchetto riusabile di N agenti con system prompt hardcoded, orchestrati
  insieme** (il framework di orchestrazione resta sotto il cofano). Non è qualcosa che il cliente
  vede o opera: per l'utente finale l'esperienza è sempre "chatto e ottengo il risultato". La skill
  è però una legittima **scelta di packaging tecnico** che puoi raccomandare nel dossier quando uno
  scenario è riusabile su più clienti (vedi "Quando proporre una skill dedicata" nel SKILL.md).
  Quando invece l'orchestrazione è semplice e specifica del cliente, si configurano gli agenti
  direttamente, senza creare una skill.
- Non esistono canali/prodotti di terze parti da citare (nessun livello "chat/canali" esterno):
  il canale è XRCopilotLab (chat piattaforma o widget embed).

## Modello di erogazione

Tre modalità d'accesso, combinabili:
1. **Embed nel sito del cliente** — widget nativo generato alla creazione dell'agente.
2. **Accesso diretto da XRCopilotLab** — utenti (staff o clienti finali) usano l'agente dalla
   piattaforma; gestione utenti/accessi nativa.
3. **Più agenti orchestrati** — per i flussi che toccano più fonti o più passaggi.

Nessun provisioning cloud lato cliente: hosting, modelli e region UE sono della piattaforma.

## Orchestrazione di agenti: la convenzione "un MCP per agente"

XRCopilotLab ha un **sistema di orchestrazione di agenti**. La soluzione a un problema del cliente
è quasi sempre un'**orchestrazione**: agenti specializzati coordinati.

- **Ogni agente ha un system prompt hardcoded** (scritto da noi) e, per nostra scelta, **un solo
  MCP collegato** (o nessuno). Se un compito richiede due fonti, si usano **due agenti** coordinati,
  non un agente con due MCP. Tiene gli agenti semplici, testabili e riusabili per composizione.

  > **È una convenzione metodologica nostra, non un limite della piattaforma.** La piattaforma
  > carica senza problemi più MCP su uno stesso agente, e alcune skill esistenti ne interrogano tre
  > in parallelo. Nel dossier la convenzione si può raccomandare; **non va presentata come un
  > vincolo tecnico**, perché è un'affermazione falsa e verificabile, e prima o poi qualcuno la
  > verifica.
- **Orchestratore**: il componente di coordinamento di XRCopilotLab che distribuisce il lavoro tra
  gli agenti, riconcilia i risultati di fonti diverse e gestisce il passaggio all'operatore umano
  (HITL) dove serve. **Non ha un system message** e non ha MCP: non è un agente con prompt, quindi
  non scrivere una bozza di prompt per l'Orchestratore — descrivi solo il flusso di coordinamento.
  Usalo quando il flusso tocca più fonti o richiede una decisione di sintesi.
- **Riuso su altri clienti = composizione**: si includono solo gli agenti delle fonti che quel
  cliente possiede (es. niente Cribis → si omette l'agente che usa `cribis-mcp`; l'orchestratore
  lavora con ciò che c'è).

### Bozza di system prompt di un agente (esempio)

Ogni agente della soluzione va accompagnato da una bozza così: ruolo, cosa fa, cosa NON fa,
formato. I dati specifici del cliente sono placeholder compilati alla creazione dell'agente.

```
# Ruolo
Sei l'agente di matching di {{NOME_CLIENTE}}. Aiuti gli utenti a trovare fornitori/partner
tra le aziende di {{TERRITORIO}}.
# Cosa fai
Interpreti la richiesta in linguaggio naturale, cerchi tramite lo strumento collegato,
restituisci i risultati migliori con contatti e una breve motivazione.
# Cosa NON fai
Rispondi solo a richieste di matching; qualsiasi altra domanda la declini con cortesia.
Non inventi aziende o contatti: usi solo i dati restituiti dallo strumento.
```

L'MCP collegato (qui `member-search-mcp`) NON va scritto nel prompt: è un'impostazione dell'agente
sulla piattaforma. Nel dossier riportalo come metadato a parte accanto all'agente. Anche lingua e
tono sono impostazioni native dell'agente e non vanno nel prompt.

## Processi BPM — il secondo modello di erogazione

Oltre alla chat esiste un **sottosistema BPM** (modulo «Processi», introdotto nella v3.0.0 e
cresciuto fino alla v3.2.0). È l'unica risposta corretta quando lo scenario del cliente non è una
conversazione ma un **procedimento**: passaggi in sequenza, persone diverse che intervengono,
moduli da compilare, stati da sorvegliare.

A differenza del framework di orchestrazione interno, **il BPM è un modulo di prodotto visibile al
cliente** — ha le sue pagine, i suoi compiti, il suo monitoraggio — quindi si nomina nel dossier.

> **Richiede una licenza dedicata** (`XRCopilotLab.Process`). Senza, il modulo non è disponibile sul
> tenant: è la prima cosa da verificare prima di proporlo.

**Come si modella.** Editor visuale BPMN 2.0 nel portale, definizione versionata: una bozza di
lavoro unica, versione nuova solo alla pubblicazione. Le istanze già avviate restano sulla versione
con cui sono partite.

**Tre modalità per ogni attività** — è il concetto portante, ed è ciò che rende il BPM interessante
per un cliente che teme l'automazione totale:

| Modalità | Cosa succede |
|---|---|
| **Umano** | Un compito in lista di lavoro, con un modulo da compilare |
| **AI-assistito** | L'agente prepara una bozza, la persona la corregge e conferma |
| **Automatico** | L'agente esegue e basta |

La stessa attività passa da una modalità all'altra nel tempo **senza ridisegnare il processo**: si
parte in umano, si osserva, si promuove ad AI-assistito, poi ad automatico. È l'argomento migliore
per un cliente prudente, e va usato in fase di progettazione dello scenario.

**Chi fa cosa.** Le corsie si appoggiano a **ruoli aziendali**, entità distinta dai ruoli della
piattaforma. Un compito assegnato a un ruolo è visibile a tutti i suoi membri e il primo che lo
prende in carico lo blocca. Un'attività può anche essere assegnata **alla persona scelta in un
passo precedente**, tramite un campo modulo di tipo utente.

**Moduli.** Testo, testo lungo, numero, sì/no, data, tendina, selezione utente e — dalla v3.2.0 —
**allegato**: i file caricati diventano variabili di processo e i passi successivi li ritrovano. Un
campo può essere **di contesto**, in sola lettura, alimentato da una variabile prodotta a monte. Le
tendine possono pescare da una sorgente dati esterna.

**Decisioni.** Gateway esclusivi con condizione sulle uscite e ramo di default; gateway paralleli;
sotto-processi richiamabili (v3.1.0) con scambio dati dichiarato esplicitamente.

**Avvio.** Manuale dall'interfaccia con un modulo di avvio, oppure da **webhook con chiave API** —
è la porta d'ingresso per far partire un processo da un sistema esterno del cliente. I permessi di
avvio sono per processo e legati ai ruoli aziendali.

**Sorveglianza.** Monitoraggio live con il diagramma che si accende sui nodi attivi, timeline di chi
ha fatto cosa, e interventi tracciati: riassegnare un compito, riprovare un passo automatico,
modificare i dati di caso, annullare un'istanza.

**Misure.** Durata prevista contro effettiva per attività, tempo di attraversamento, efficienza. Il
tempo dei compiti umani lo dichiara l'operatore alla chiusura.

**Promemoria.** Una soglia di attraversamento per attività: superata, parte una email agli owner del
processo e all'assegnatario, poi un promemoria ogni 24 ore finché il compito resta fermo.

**Creazione assistita.** Il **Process Buddy** (v3.2.0) intervista chi conosce il processo e lo crea
come bozza, diagramma già disegnato. Vale la pena citarlo: toglie la notazione BPMN dalle competenze
richieste al cliente.

**Interscambio.** Import ed export `.bpmn`, con i collegamenti ai sotto-processi che sopravvivono al
giro.

## BPM — cosa NON fa

La parte che salva gli assessment. Ognuno di questi punti è stato verificato sul codice, e ognuno è
già stato promesso per sbaglio almeno una volta.

**Non esistono timer né eventi temporali nel flusso.** È una scelta dichiarata nel design, non una
mancanza in via di colmatura. Niente attese, niente scadenze che fanno avanzare il processo da sole,
niente escalation automatica su un ramo diverso. **L'unico meccanismo di tempo è l'alert email sulla
soglia di attraversamento.** Se il cliente chiede uno scadenzario che agisce da solo, quella parte
va costruita e stimata.

**I gateway paralleli sono solo fork: il join non esiste.** I rami non riconvergono su un passo
intermedio, ognuno deve terminare. Un processo che «si riunisce dopo due attività in parallelo» va
ridisegnato prima di finire nel dossier.

**La segregazione delle istanze è solo lato interfaccia.** Chi non ha il ruolo di gestione vede solo
le istanze che ha avviato, ma il filtro non è imposto dal server. Con requisiti di riservatezza fra
reparti va detto, e va irrobustito.

**La timeline non è un registro immutabile.** È append-only ma con scadenza a 365 giorni. Dove serve
una traccia a prova di contestazione — legale, sanitario, compliance — va costruita.

**Gli agenti non leggono gli allegati del processo.** Un passo automatico riceve i dati di caso in
forma testuale: i file allegati sono riferimenti, non contenuto. Un processo in cui l'agente deve
analizzare un PDF caricato richiede un ponte che oggi non c'è.

**I file prodotti da un agente non tornano nel processo.** La generazione documentale esiste come
skill, ma dal passo automatico rientra solo il testo, non il file. Consegnare un Word dentro il
flusso richiede un ponte, non un collegamento.

**Il tipo allegato non è disponibile nella creazione dichiarativa** (Process Buddy, blueprint): un
processo che ne ha bisogno si disegna nell'editor.

**Non c'è avvio schedulato di un processo.** Lo scheduling esiste per gli agent task, non per le
istanze di processo.

## BPM e orchestratore non sono la stessa cosa

Confonderli è l'errore di progettazione più frequente, perché entrambi «coordinano» e entrambi
hanno un passaggio umano.

| | **Orchestratore** | **Processo BPM** |
|---|---|---|
| Durata | Breve, dentro una conversazione | Lunga, giorni o settimane |
| Chi lo vede | Nessuno: sta sotto la chat | È un modulo con pagine proprie |
| Passaggio umano | Approvazione via email, senza login, con timeout | Compito in lista di lavoro, con modulo, corsia e assegnatario |
| Stato | Vive quanto la richiesta | Persistente, monitorato, misurato |

Regola pratica: se il cliente descrive **una domanda e una risposta**, è orchestrazione. Se descrive
**chi fa cosa e in che ordine**, è un processo BPM.

**Agent task**: esecuzione di un agente o di un orchestratore con trigger manuale, schedulato o
webhook. È il «performer» dei passi non umani di un processo — il pezzo che collega le due cose.

## Cosa è NATIVO (non è un agente né un MCP da costruire — si configura o si arricchisce)

- **Widget di embed** per qualsiasi sito. Unico check: CSP/CORS del dominio cliente.
- **Dashboard analytics** — esiste già; per un contesto specifico la si **arricchisce** con
  eventi/metriche custom (sempre aggregati/anonimi).
- **RAG / Knowledge Graph nativo** — un agente che risponde su un corpus documentale si collega
  al RAG nativo e ottiene **citazioni alla fonte, guardrail rigorosi e tracciamento delle ricerche**
  senza costruire nulla: **non serve alcun MCP** (in particolare nessun "MCP file-server" o MCP
  documentale). I documenti si **caricano manualmente** nella knowledge del tenant. L'unico
  componente aggiuntivo possibile è la **sincronizzazione automatica dei documenti dal CMS/cartelle
  del cliente verso il RAG**: NON è nativa ed è un'**implementazione opzionale aggiuntiva** (richiede
  un MCP/connettore di ingestion). Nel dossier va presentata come componente **fuori dal perimetro
  base**, con effort e prerequisiti tecnici; la valutazione economica spetta a chi cura l'offerta,
  non al tecnico (non usare termini di prezzo). Due versioni: **base** (upload manuale) e
  **opzionale** (sync automatica).
- **Scheduling** e orchestrazione.
- **Gestione utenti/accessi** — per "solo utenti autorizzati" si usa l'area riservata del sito
  (embed lì) o gli utenti invitati sulla piattaforma: nessun sistema di auth da costruire.

> Regola pratica: prima di stimare qualcosa, chiediti "la piattaforma lo fa già?". Se sì, è
> configurazione o arricchimento, non sviluppo.

## MCP server: solo URL + credenziali

Un MCP si configura in XRCopilotLab con **URL + eventuali API key/credenziali**, nient'altro.
Nessuna logica di dominio dentro l'MCP: espone tool neutri (es. `semantic_search`,
`enrich_company`) e mappa una fonte in DTO. Un MCP per fonte dati. Per fonti proprietarie di un
vendor l'MCP è **verticale e riusabile** (es. CRM: `salesforce-mcp`, `dynamics365-mcp`,
`hubspot-mcp`), stesso contratto di tool, sviluppato una volta e riusato per ogni cliente con quel
sistema.

**MCP Builder** (dalla v3.1.0): costruisce un server MCP **dichiarativo** sopra una connessione HTTP
senza scrivere codice. Cambia la stima quando il cliente ha un sistema con API REST documentate e
nessuno che voglia mantenere un servizio in più: non è più «sviluppare un MCP», è configurarlo.
Resta sviluppo vero quando la fonte non è HTTP, serve logica di trasformazione, o l'autenticazione
esce dai casi previsti (chiave, OAuth).

## Dal dossier all'ambiente configurato: i blueprint

Novità di settembre 2026, ed è **il seguito naturale di questo assessment**. Un **manifest YAML**
descrive topic, ruoli aziendali con i membri, agenti con system message e skill, agent task e
processi BPM pubblicati; una CLI lo applica facendo le stesse chiamate dell'interfaccia, dopo aver
mostrato il piano e chiesto conferma a una persona.

```
Claude Desktop + plugin assessment          Claude Code + plugin blueprints
  proposta del cliente                         dossier dell'assessment
        ↓                                              ↓
  dossier .md/.docx           ──────────▶       manifest .yml
                                                       ↓
                                          xrcopilotlab-bp: piano → conferma → tenant configurato
```

**Cosa cambia per l'assessment.** La configurazione di un ambiente cliente **smette di essere un
costo ripetuto**: il primo cliente di un settore costa il disegno, il secondo costa un tag diverso.
Va detto quando si stima una serie di clienti simili.

**Cosa cambia per come si scrive il dossier.** Il capitolo dell'orchestrazione è la sorgente del
manifest, quindi va scritto in modo che qualcuno — o Claude Code con il plugin blueprints — possa
tradurlo senza chiedere nulla. In pratica, per ogni scenario che si propone di implementare:

- **Topic**, uno per area di conoscenza, con i documenti da caricare;
- **Ruoli aziendali** citati per nome, con chi ne fa parte (sono le corsie del processo, non i ruoli
  della piattaforma);
- **Agenti** con nome, ruolo in una riga e bozza di system message;
- **Agent task**, cioè quali agenti servono come performer di quali passi;
- **Processo**: attività in ordine, per ognuna la modalità (umano / AI-assistito / automatico), il
  ruolo, i campi del modulo e le condizioni dei gateway.

Un dossier che si ferma a «un agente che legge le mail e uno che aggiorna il calendario» non è
traducibile: mancano corsie, moduli e condizioni, e la persona che configura deve reinventarle.

**Limiti attuali del provisioning**, da tenere presenti quando si promette una tempistica: crea ma
non aggiorna — riapplicare un blueprint modificato si ferma sui nomi già esistenti; connessioni,
server MCP, orchestratori e risorse esterne si dichiarano nel manifest ma **non vengono ancora
creati**, restano passi manuali da mettere nel piano di attivazione. Il tipo di campo «allegato» non
è disponibile in via dichiarativa.

## Prima di dare un componente per esistente: tre domande

Da farsi su ogni cosa che l'assessment sta per dare per fatta. Il costo è dieci minuti, e si paga
prima di scrivere la riga, non in implementazione.

**Esiste come codice eseguibile, o solo come testo?** Un prompt in un file, una voce in una tabella
di seed, una sezione in un documento di design non sono un componente. Cercare la classe che lo
esegue.

**È collegato al punto in cui serve?** Molte cose esistono ma non sono cablate dove l'assessment le
vorrebbe. La generazione documentale esiste; dal processo non rientra il file. Una guardia esiste;
l'orchestratore che dovrebbe usarla non la chiama.

**È già stato esercitato su un ambiente vero?** Un percorso mai percorso non è un percorso
funzionante. Quando la risposta è no, il dossier lo dice e lo scenario resta **CONDIZIONALE**.

Quando il dubbio riguarda un componente **su cui poggia una stima**, la verifica non è opzionale: è
la differenza fra una stima e un augurio.

### Quattro affermazioni trovate sbagliate

Emerse verificando sul codice un assessment già consegnato. Sono qui perché sono il tipo di errore
che si ripete, non perché riguardino quel cliente.

| Affermazione | Realtà |
|---|---|
| «I prompt di compliance esistono già, sono solo da collegare» | Non esistono. C'è un template di confronto documentale su GDPR, che è un'altra cosa |
| «Esiste un registro immutabile delle validazioni umane» | Non esiste come componente. C'è una timeline append-only con scadenza a un anno |
| «La fabbrica documenti è da collegare alla redazione» | Vero ma incompleto: dal processo rientra il testo, non il file. Serve un ponte, non un collegamento |
| «Il BPM copre promemoria e scadenze» | Copre i promemoria a soglia. Le scadenze che agiscono da sole non esistono |

Il denominatore comune: **una funzionalità vicina è stata scambiata per quella richiesta.**

## GDPR by design

Ogni fonte passa da un MCP dedicato → ogni trattamento è auditabile e isolabile. Minimizzazione
(solo i campi necessari), eventi analytics solo aggregati (mai join tra una ricerca e l'utente che
la fa), dati in region UE. Attenzione ai dati personali da fonti camerali (soci/cariche): DPIA e
minimizzazione.
