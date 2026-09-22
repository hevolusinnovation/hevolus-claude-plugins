---
name: xrcopilotlab-blueprint-test
description: Collauda un blueprint XRCopilotLab applicato su un tenant. Scrive le domande di test per agenti, orchestratori e processi (o parte da una suite in `blueprints/tests/`), le esegue con `xrcopilotlab-bp test run` raccogliendo risposte e log (pipeline, knowledge, skill, eventi dell'istanza), giudica le risposte, attribuisce ogni fallimento a un componente (knowledge graph, skill, motore BPM, webapp, manifest), propone le issue aprendole solo dopo un sì, e scrive le guide per il cliente. Chi non ha i repository per confermare una causa non si ferma: consegna il fallimento a uno sviluppatore, con le evidenze, e prosegue. Usa quando l'utente chiede di "testare un blueprint", "collaudare gli agenti", "scrivere le domande di test", "verificare le risposte e i log", "aprire le issue dei fallimenti", "preparare le domande per il cliente", oppure nomina `test run`, `test init` o una suite `.tests.yml`. NON usare per scrivere o applicare un manifest (quello è xrcopilotlab-blueprint) né per test unitari del codice.
---

# xrcopilotlab-blueprint-test

Porta un blueprint applicato da «esiste sul tenant» a «sappiamo come risponde, e sappiamo di chi è
ogni difetto», e da lì a «il cliente sa cosa provare e cosa aspettarsi». Cinque mosse: scrivere le
domande, eseguirle, giudicare, segnalare, e scrivere le guide per il cliente.

La divisione del lavoro è netta e va rispettata, perché è ciò che rende il collaudo ripetibile:

| Chi | Fa | Non fa |
|---|---|---|
| **La CLI** (`xrcopilotlab-bp test`) | esegue i casi, raccoglie **tutte** le evidenze, verifica le attese meccaniche (frammenti, lingua, tempi, knowledge, skill, eventi), propone un sospetto per fallimento | non giudica se una risposta è *buona* |
| **Tu** (la skill) | scrivi le domande e le risposte attese, giudichi le risposte in prosa, confermi o smentisci il sospetto leggendo il codice, scrivi le segnalazioni | non chiami l'API direttamente, non apri issue senza un sì |
| **L'utente** | decide su quale tenant si esegue, approva le segnalazioni | — |

Input: `$ARGS` — il nome o il tag di un blueprint, il percorso di un manifest o di una suite,
un ambiente (`--env staging`), oppure niente.

Riferimenti, da leggere quando si arriva al passo:

| Passo | Documento |
|---|---|
| Se la CLI non c'è, o `xrcopilotlab-bp` non è un comando | la skill `xrcopilotlab-blueprint`, `references/installazione.md` — il plugin, e l'installazione a mano su macOS e Windows |
| Scrivere le domande | [`references/domande.md`](references/domande.md) — che cosa chiedere a un agente con knowledge, con skill, a un orchestratore, a un processo; i casi negativi; le attese che la CLI verifica |
| Giudicare le risposte | [`references/giudizio.md`](references/giudizio.md) — i quattro criteri (esattezza, nessuna invenzione, completezza, forma), i verdetti pass/parziale/fail, il file `giudizio.md` |
| Attribuire un fallimento | [`references/triage.md`](references/triage.md) — evidenza → componente → repository, e come confermare leggendo il codice |
| Scrivere la segnalazione | [`references/segnalazione.md`](references/segnalazione.md) — il modello per i tre repository e cosa non va scritto |
| Non poter verificare (niente cloni, niente repository) | [`references/consegna-dev.md`](references/consegna-dev.md) — come si consegna un fallimento a chi può guardarlo, e perché i test proseguono |
| Le guide per il cliente | [`references/guida-cliente.md`](references/guida-cliente.md) — le domande di prova (la traduzione inversa della suite) e la guida allo scenario; dove vanno, la struttura che ha retto, le regole |
| Guardare ciò che vede il cliente | [`references/browser.md`](references/browser.md) — quando aprire il browser invece della suite, come si collega Claude a Chrome (anche da Claude Desktop), cosa si riporta |
| Collaudare un processo | [`references/bpm.md`](references/bpm.md) — il modello di esecuzione (token, gateway, work item, soglie) tradotto nel motore, le otto domande da farsi su ogni processo del manifest, come leggere gli eventi di un'istanza, cosa il motore non fa |
| Formato della suite e del report | [`references/testing.md`](references/testing.md) |

## 0. Se `$ARGS` è vuoto, o chiede aiuto

Orientare e fermarsi. In ordine: a cosa serve (collaudare un blueprint applicato, con report e
triage); che cosa serve (la CLI, che si ottiene installando il plugin `blueprints@hevolus` e non
compilando il repository — vedi la skill `xrcopilotlab-blueprint`, `references/installazione.md` —
e lo stesso accesso: un'identità `hevolus.it` e `az login` fatto una volta; vedi la skill `xrcopilotlab-blueprint`, § «Con quale identità gira»);
quali suite esistono già in `blueprints/tests/`; quali blueprint hanno un run sul tenant
(`xrcopilotlab-bp status --env <ambiente> --company <guid>`, **solo** se l'utente ha indicato un
ambiente). Poi la domanda: quale blueprint, su quale ambiente.

Per i comandi non scrivere a memoria: `xrcopilotlab-bp --help`.

## 1. Da dove si parte

Tre situazioni, e la prima cosa da fare è capire in quale si è:

1. **Esiste già `blueprints/tests/<nome>.tests.yml`.** È la regressione del blueprint: si parte da
   lì. Si aggiungono casi solo se il manifest è cambiato o se l'utente porta domande nuove; non
   si riscrive ciò che c'è.
2. **L'utente porta delle domande** — da un assessment, da una demo, da una lamentela del
   cliente. Si traducono in casi, ognuna con la sua risposta attesa, e si aggiungono a una suite
   nuova o esistente. Le domande dell'utente hanno la precedenza su quelle che scriveresti tu:
   sono quelle che il cliente farà davvero.

   Un **set di domande della demo** — nella forma di `demo-domande-orchestratore.md` e
   `demo-domande-per-agente.md` di FinLogic — si traduce campo per campo, e non si perde niente:

   | Nel documento | Nella suite |
   |---|---|
   | La domanda (nel blocco di codice o citata) | `message`, **identica**: la formulazione è stata scelta apposta |
   | «Cosa dimostra» / «Cosa verifica» | `purpose` |
   | «Atteso» / «Risposta attesa», in prosa | `expect.answer` |
   | I numeri dell'atteso, con la tolleranza dichiarata in testa al documento | `expect.numbers` con `label`, `value` (o `text` come nel documento) e `tolerance` |
   | Codici, nomi, diciture che devono comparire | `expect.contains` |
   | «Risposte sbagliate da riconoscere», «Se va storta», «due numeri sbagliati da saper riconoscere» | `expect.wrongAnswers`, ognuna con `means` = la spiegazione del documento e, quando il documento la dà, `suspect` = il componente |
   | «Perché la domanda è cambiata», avvertenze, cosa citare a voce | `notes` |
   | Domande per singolo agente / per la catena | `kind: agent` con `target` = l'agente / `kind: orchestrator` |
   | Sezioni «da non fare in demo», «trabocchetto» | casi con tag `negative`; le «da non fare» non entrano nella suite se il documento dice che il numero sarebbe giusto ma fuorviante |

   Tre regole di quei documenti che valgono per ogni suite: una **conversazione nuova per ogni
   domanda** (la CLI lo fa da sola: mai `conversation:` multi-turno per domande indipendenti);
   un **numero si chiede come aggregazione sui dati**, un criterio a parte — mai «quante ne hai
   riconosciute»; le **regole di dominio vanno nella domanda** («escludendo le righe con Chiusura
   conti»), perché il calcolo non legge il system message. L'esempio tradotto per intero è
   `blueprints/tests/finlogic-bilancio-aggregato.tests.yml`.
3. **Non c'è niente.** Si genera lo scheletro e si scrivono le domande:

   ```bash
   xrcopilotlab-bp test init blueprints/<nome>.yml
   ```

   Per ogni **processo**, prima di scrivere i casi, rispondere alle otto domande di
   [`references/bpm.md`](references/bpm.md): da dove entra, qual è il primo compito umano, quali
   passi automatici stanno prima, su cosa decidono i gateway, i cicli, le soglie, cosa scrive fuori
   dal tenant. Ogni «sì» è un caso.

   Lo scheletro ha un caso positivo e uno negativo per agente, uno per orchestratore, uno per
   processo, con le attese deducibili dal manifest già compilate (file dei profili, skill
   dichiarate, campi del modulo di avvio, prima attività umana). I `TODO` sono le domande e le
   risposte attese: **le scrivi tu**, leggendo il manifest — il system message dice che cosa
   l'agente deve e non deve fare, ed è da lì che nascono i casi. Come, in
   [`references/domande.md`](references/domande.md).

**Se un agente legge una fonte esterna che non è ancora pronta** (una casella di posta, un calendario),
non si aspetta: si collauda la sua logica con le **letture simulate** — il contenuto che darebbe lo
strumento incollato nel messaggio, tag `simulata` — e i casi sulla fonte vera vanno in una suite a
parte, da lanciare quando c'è. I casi che fanno **scrivere** fuori dal tenant stanno in una terza
suite, solo con un sì. Come, in [`references/testing.md`](references/testing.md)
§ «Collaudare un agente su MCP senza la fonte». Esempio completo: le tre suite `studiopolis-agenda*`.

In tutti e tre i casi, prima di eseguire:

```bash
xrcopilotlab-bp test validate blueprints/tests/<nome>.tests.yml
```

Il validatore trova il manifest da solo (`tests/x.tests.yml` → `x.yml`), verifica che ogni caso
punti a un'entità che esiste, che le skill e i file attesi siano dichiarati, che non restino
`TODO`. **I rilievi `BT0xx` sono per chi scrive la suite, cioè per te**: correggere e ripetere,
non girarli all'utente.

Poi **mostrare la suite all'utente** — le domande, non il file — e chiedere se sono quelle
giuste. Il modo giusto di mostrarle è già il documento per il cliente: **le domande di prova**
(`demo-domande-<scenario>.md`, nella cartella del cliente nell'assessment), scritte dalla suite con
la traduzione di [`references/guida-cliente.md`](references/guida-cliente.md). Nasce qui, con una
tabella di stato vuota, e si aggiorna a ogni collaudo. Una domanda scritta bene ma sul problema sbagliato produce un report inutile, e l'unico
che sa quale sia il problema giusto è chi conosce il cliente.

## 2. Eseguire

```bash
xrcopilotlab-bp test run blueprints/tests/<nome>.tests.yml --env <ambiente> --company <guid>
```

Prima di lanciare, **dire su quale ambiente e tenant, e quanti casi**, e attendere il sì. Non è
distruttivo — ogni caso apre una conversazione nuova, avvia un'istanza di processo, lancia
un'esecuzione — ma consuma token del tenant, lascia conversazioni e istanze visibili
nell'interfaccia, e su un tenant di un cliente **non è cosa da fare di propria iniziativa**. In
produzione vale la regola dei blueprint: solo il tenant di Hevolus.

Cose da sapere sull'esecuzione:

- Le entità si risolvono dall'**inventario dell'ultimo run completato** del tag: sono gli id che
  il blueprint ha creato, non una ricerca per nome. Con `--run <runId>` se ne sceglie uno. Se un
  caso esce «non trovato», il tenant ha una versione del manifest che non ha quell'entità: è
  l'informazione giusta, non un difetto — si riporta così.
- `defaults.userId` con l'**email** di un membro del ruolo di avvio: senza, i casi su un processo
  con ruoli di avvio escono 403.
- `--only chiave,tag,entità` esegue una parte. Utile per i casi con il tag `m365` o simili, che
  dipendono da una connessione esterna, e per rilanciare un solo caso dopo una correzione. Un valore
  combacia **anche con il target**: `--only agenda` prende pure i casi simulati sull'agente `agenda`.
- Un caso su **processo** avvia un'istanza vera e la segue finché arriva al compito umano atteso
  (o allo stato atteso, o al timeout). L'istanza resta lì: chi ha il ruolo la vedrà fra i suoi
  compiti. Dirlo all'utente prima, perché è la cosa che sorprende.
- Un caso su **orchestratore** che si ferma in HITL (`paused`) esce in errore: non può
  completare da solo. Non è un fallimento dell'orchestratore.
- Prima di leggere un giro come «locale», verificare che lo sia davvero: durante l'esecuzione il
  processo `xrcopilotlab-bp` deve avere una connessione verso `127.0.0.1:<porta dell'Api>`
  (`lsof -nP -a -p <pid> -iTCP`) e nel console dell'Api devono comparire righe `[KGraph]`. Un
  giro che va sull'ambiente di default risponde «dal frammento» a ogni domanda numerica e somiglia
  a una regressione della libreria: il 13/09/2026 sono state perse due ore così. La CLI ora rifiuta
  le opzioni sconosciute proprio per questo.
- Se un'istanza locale dell'Api è il bersaglio (`--env locale`) e a un certo punto tutte le chiamate
  rispondono 500 in pochi millisecondi, non sono i casi: è l'host che ha smesso di invocare il worker
  (host `Running`, rotte inesistenti 404). Non dipende dal tipo di caso — il 13/09/2026 è successo sia
  durante un caso di processo sia a metà dei casi di chat, dopo 10-15 minuti dall'avvio. I casi
  successivi escono tutti in errore in 0 ms: si ferma il giro, si riavvia l'Api, si rilancia con
  `--only` la parte non eseguita, e si chiede la console del func host per capire perché.
- Un caso di processo fermo a `InstanceStarted → AgentTaskDispatched` vuol dire che l'esecuzione
  dell'agent task non è mai finita (anche un fallimento farebbe avanzare il token): si guarda il
  worker di AsyncOperations, e un'AsyncOperations locale che legge le code dell'ambiente condiviso è
  il primo sospetto.
- Exit code: `0` tutto passato, `7` almeno un caso non passato, `2` suite non valida, `3`
  nessun run del tag sul tenant. Il `7` **non** è un errore della CLI: è l'esito.

Il report finisce in `blueprints/tests/reports/<tag>/<data>/` — `report.md` per leggere,
`report.json` per tutto il resto. La cartella è ignorata da git: contiene risposte e id del tenant.

## 2-bis. Quando la suite non basta: il browser

La suite prova il prodotto **attraverso l'API**. Il cliente non usa l'API: fra la risposta e ciò che
lui vede c'è la chat, il form di avvio di un processo, la coda dei compiti — e quello strato sa
rompersi da solo, lasciando la suite verde.

Quando il caso è di quelli — il benvenuto che non compare all'apertura della chat, il campo allegato
che non si vede nel form, una voce che resta in inglese, un «da noi non funziona» senza altro — si
apre **Chrome con l'estensione Claude in Chrome** e si guarda. Funziona da Claude Code (`/chrome`,
anche nella scheda Code dell'app) e da Claude Desktop, usando la sessione già autenticata di chi
collauda.

Tre cose da non sbagliare, il resto è in [`references/browser.md`](references/browser.md):

1. **prima la suite, poi il browser** — aprirlo per qualcosa che la suite sa già dire è tempo speso
   a guardare una pagina invece che un log;
2. **si guarda, non si cambia**: niente modifiche alla configurazione dalla UI, mai su un tenant di
   un cliente in produzione. Un tenant ritoccato a mano smette di corrispondere al manifest;
3. **l'evidenza si porta via**: GIF, errori di console filtrati, richieste di rete fallite. Sono
   quelle che rendono una issue riproducibile — e vanno guardate prima di allegarle, perché una
   pagina autenticata riprende anche i dati del cliente.

## 3. Giudicare

Il report ha due specie di esito, e vanno trattate in modo diverso.

**I controlli meccanici** (`contains`, `knowledge.files`, `process.waitingAt`…) li ha già
verificati la CLI. Non ridiscuterli: se `contains: "4127/2025"` è fallito, il numero non c'è.

**Il giudizio è tuo, per ogni caso** — non solo per quelli con `expect.answer`. Leggi la
domanda, la risposta, l'attesa, i numeri trovati e le risposte sbagliate riconosciute, e dai un
verdetto: **pass**, **parziale** o **fail**, con il perché in una riga. I quattro criteri, in
ordine — esattezza dei numeri entro tolleranza e con il segno, nessuna invenzione, completezza,
forma — e il modo di applicarli sono in [`references/giudizio.md`](references/giudizio.md). Un
caso può essere `Passed` per la CLI e **fail** per te (i numeri ci sono, ma ha attribuito un
conto «dove gli sembrava giusto»); può essere `Failed` per la CLI e **pass** per te (un
`contains` che il modello ha riformulato legittimamente — e allora si corregge l'attesa).

Il giudizio va in `blueprints/tests/reports/<tag>/<data>/giudizio.md`: una tabella caso · esito
CLI · verdetto · perché, poi i casi da rivedere con atteso, risposta e diagnosi, poi le attese
da correggere nella suite. È la parte che il report non può contenere, ed è quella che l'utente
legge per prima. Una risposta sbagliata che riconosci e che la suite non elenca **va aggiunta ai
`wrongAnswers`** con la sua diagnosi: è così che il set si arricchisce.

Se il blueprint ha agent task **schedulati** su una fonte che il collaudo ha trovato rotta (un avviso
«Prove dei tool MCP», errori di credenziale nelle risposte), proporre all'utente di sospenderli con
`xrcopilotlab-bp schedule pause <chiave> --tag <TAG>` finché la fonte non è corretta: girano lo
stesso, e un esito d'errore mandato a un webhook apre un caso a ogni giro.

Per ogni agent task schedulato che alimenta un processo, prima di giudicare i casi di processo
guardare `xrcopilotlab-bp schedule logs <chiave> --tag <TAG>`: quota giornaliera, ultime
esecuzioni, e l'avviso se lo scheduler avanza mentre le esecuzioni no. Un ingresso che ha esaurito
la quota (100/giorno di default) non produce istanze e non produce errori: senza questo controllo
il collaudo lo attribuirebbe alla posta, al webhook o al motore.

**Quando l'utente prova con ingressi veri** — una mail alla casella, un dettato in chat — la suite
non c'entra e le domande diventano «è passata?», «dove sta la pratica?», «perché il calendario non
si aggiorna?». Si risponde con la CLI, non chiedendo all'utente cosa vede sullo schermo:
`schedule logs <task-di-ingresso>` dice se e quando il messaggio è passato;
`xrcopilotlab-bp instances list --tag <TAG> --running` mostra ogni istanza con il nodo del token;
`instances show <id>` gli eventi, i compiti e i dati del caso. Un token su `verifica:waiting` o
`assegna:waiting` è un compito che aspetta una persona — i passi automatici che scrivono fuori
(calendario) stanno **dopo** l'assegnazione — mentre un `AgentTaskDispatched` fermo da più di due
minuti è la issue #1000, e `show` lo segnala. Se il controllo rivela un dato sbagliato nel caso (una
data spostata di un giorno, un tipo diverso dall'atteso), dirlo prima che il passo successivo lo
usi.

Quando la casella di collaudo è nostra, il giro intero si scrive come caso **`kind: flow`**
(formato in [`testing.md`](references/testing.md)): la suite manda la mail con il
tool del blueprint, aspetta l'istanza, completa i compiti per conto di `defaults.userId`, controlla
il calendario. Va in una suite **a parte** (`<nome>-flusso.tests.yml`), lanciata con un sì
esplicito e nell'ordine del file, perché completa compiti e scrive sul calendario: prima di
proporla dire cosa lascia (istanze chiuse, eventi) e che gli eventi non vengono cancellati.

## 4. Il triage: di chi è ogni fallimento

Per ogni caso non passato (per la CLI o per te) il report porta un **sospetto**: componente,
fiducia, ragione. È un'ipotesi ancorata alle evidenze, non un verdetto, e il tuo lavoro è
**confermarla o smentirla** prima di segnalare. La tabella completa è in
[`references/triage.md`](references/triage.md); la regola di fondo è una:

> Un fallimento si attribuisce a un componente solo quando c'è un'evidenza **di quel componente**
> — un errore che lo nomina, un log che mostra che ha fatto la cosa sbagliata, un passo che
> manca dove doveva esserci. L'assenza di una cosa (nessun chunk, nessuna skill) è un indizio,
> non una prova, e va corroborata leggendo il codice.

I repository sono cloni fratelli di questo — `../xrcopilotlab-knowledge-graph`,
`../xrcopilotlab-agent-framework` — e la webapp è questo. **Leggili.** Se non ci sono — un
commerciale che prova uno scenario ha la CLI del plugin e nient'altro — la verifica è fuori
portata da qui: non ci si ferma e non si tira a indovinare, si consegna a chi può (§4-bis). Un sospetto sulla
knowledge graph con fiducia bassa diventa una segnalazione solo dopo aver guardato, per esempio,
come `CanonicalRetriever` seleziona le sorgenti per quella domanda, o se il profilo era attivo
(`KnowledgeGraphEndpoints`, tabella dei profili). Un sospetto sulle skill si conferma guardando
il selettore in `lib-skills` e l'assegnazione della skill all'agente in SQL. Le versioni che il
tenant consuma stanno in `src/XRCopilotLab/KGraph.props` (`KnowledgeGraphVersion`) e in
`AgentFramework.props` (`AgentFrameworkVersion`): vanno nella segnalazione.

Tre esiti possibili per ogni fallimento:

- **Difetto del manifest** (prompt, partizione della knowledge, attesa scritta male): si corregge
  il file — il manifest o la suite — e si rilancia il caso con `--only`. Non è una issue.
- **Difetto di un componente, confermato**: si scrive la segnalazione (passo 5).
- **Non attribuibile**: si dice così, con le due o tre ipotesi e cosa servirebbe per decidere.
  Meglio un «non so» documentato di una issue nel repository sbagliato.

Non fermarsi al primo caso: fallimenti diversi con la stessa causa sono **una** segnalazione con
più casi a supporto, e un fallimento che si ripete su tutti i casi di un agente è quasi sempre
il manifest.

## 4-bis. Se non puoi verificare: consegna, e vai avanti

Prima di concludere che un fallimento è «non attribuito», chiediti se il problema è che **questa
postazione non può guardare**. Si verifica, non si suppone:

```bash
ls ../xrcopilotlab-knowledge-graph ../xrcopilotlab-agent-framework
ls src/XRCopilotLab
gh repo view hevolusinnovation/xrcopilotlab-webapp-dotnet --json name
```

Se i cloni non ci sono, o non siamo dentro la webapp, o `gh` non raggiunge il repository, allora
confermare il sospetto e aprire la issue sono **fuori portata**, e non per colpa di chi collauda.

In quel caso:

1. **la suite si finisce lo stesso** — tutti i casi, report e giudizio come sempre. Fermarsi al
   primo fallimento lascerebbe il cliente senza verdetto anche sulle parti che funzionano;
2. per ogni fallimento da confermare si prepara una **consegna** a chi può guardarlo — il
   modello, gli allegati e le due cose da non fare sono in
   [`references/consegna-dev.md`](references/consegna-dev.md);
3. la si mostra all'utente e **si chiede se mandarla**, come per le bozze di issue. Il
   destinatario è `giuseppe.zileni@hevolus.it`. Se la sessione non ha uno strumento di posta,
   **dirlo**: il messaggio è pronto, sta lì, va mandato a mano. Mai dare per mandato ciò che non
   è partito;
4. quei casi restano **`🔁 in attesa di verifica`** nel giudizio e nella tabella di stato del
   cliente. Non `✅`, non `⛔`.

Il sospetto della CLI viaggia con la consegna **come sospetto**. Non avere i cloni non promuove
un'ipotesi a diagnosi: la regola del triage — un'assenza è un indizio, non una prova — vale
identica, cambia solo chi la applica.

Una cosa che questa strada ha guadagnato di recente: il manifest della versione provata si
riscarica dall'archivio con `xrcopilotlab-bp pull --tag <TAG>`, anche senza il repository. È
l'allegato senza cui il sospetto «è il prompt» non si può nemmeno valutare.

## 5. Segnalare — solo dopo un sì

Per ogni difetto confermato si prepara una **bozza** in
`blueprints/tests/reports/<tag>/<data>/segnalazioni/<n>-<repo>-<slug>.md`, con il modello in
[`references/segnalazione.md`](references/segnalazione.md). La bozza contiene ciò che serve a
chi la riceve per riprodurre senza il tenant: la domanda, la risposta, i passi del log che
contano, i file consultati, le versioni, l'ambiente, l'id della conversazione o dell'istanza.

Poi si mostrano all'utente le bozze — titolo, repository, una riga di sintesi ciascuna — e si
chiede quali aprire. **Nessuna issue viene aperta senza questo sì**, e un sì vale per le bozze
mostrate, non per quelle che scriverai dopo.

**Le issue si aprono tutte in `hevolusinnovation/xrcopilotlab-webapp-dotnet`**, anche quando la
correzione andrà in una libreria: è lì che il lavoro dell'AI Team viene pianificato (progetto
«AI Team» #5), e le label dicono il componente — `kgraph` per la knowledge graph, `skills` per
l'agent-framework, `blueprints` per il resto — più `bug`. Il repository della libreria si cita nel
corpo come **dove guardare**, non come destinazione. Si apre con la skill
`xrcopilotlab-issue-report`, che scrive la issue problem-only in inglese e la registra nel
progetto: le si passa il problema (comportamento osservato, impatto, come riprodurre con il caso
della suite, comportamento atteso), **non** la bozza tecnica. La bozza tecnica — metodo
sospettato, passi del log, numeri, versioni — resta nel report, e la issue la cita in chiusura
come «Technical evidence: blueprint test report of <data>, case <key>» nella riga ammessa
`> Implementation notes captured for the planning phase.`

Il titolo comincia con il componente — «Knowledge graph: …», «Skills: …», «BPM: …» — e la issue
porta **anche l'inverso**: che cosa dovrebbe succedere, scritto come il caso della suite, così chi
corregge ha già il test di regressione. Se il difetto è di retrieval su un file tabellare, nel
corpo si propone il caso anche per la suite di regressione della libreria
(`AssessmentRegressionTests`, variabile `KG_ASSESSMENT_DATA`, nel clone della knowledge graph).

Dopo l'apertura, riportare i numeri delle issue nel `giudizio.md` accanto ai casi, e — se il
repository lo prevede — la label `semver:patch` con la skill `xrcopilotlab-label-semver`.

## 6. Le guide per il cliente

Al termine di un collaudo — e sempre al collaudo finale, quando il manifest è stabile — si
aggiornano o si scrivono i due documenti di [`references/guida-cliente.md`](references/guida-cliente.md):

- **le domande di prova** (`demo-domande-<scenario>.md`): la tabella di stato in testa presa
  dall'ultimo giudizio (✅ pronta · 🟡 da correggere · ⛔ da non mostrare come funzionante · ⏳ attende
  una fonte), le domande della suite con atteso e risposte sbagliate nella lingua del cliente, la
  scheda di valutazione, e la sezione interna per chi conduce con i difetti aperti e i numeri di issue;
- **la guida allo scenario** (`guida-<scenario>.md`), se c'è un processo o un'orchestrazione: i
  concetti, il diagramma dal grafo, i passi, le criticità del cliente → i meccanismi, gli agenti e
  cosa non fanno, collaudato e mancante, il vocabolario BPMN e le domande dell'esperto — **e la sua
  pagina web** (artifact), che è ciò che si proietta e si condivide: si costruisce dal Markdown dopo
  aver caricato la skill `artifact-design`, con il diagramma in Mermaid, **si apre nel browser
  dell'utente appena pubblicata** — con Claude in Chrome se connesso, altrimenti `open <url>`, e si affianca una copia HTML locale che si apre
  senza account. Prima di pubblicare, verificare che la CLI sia
  nell'organizzazione del cliente (`/status`): un artifact nell'organizzazione sbagliata non si
  apre da quella giusta e non si sposta.

Vanno nella cartella del cliente del repository dell'assessment, senza id del tenant, con lo stato
reale e non quello sperato, e si **mostrano all'utente** prima di darli per finiti. Il triage resta
nel giudizio: al cliente si dice cosa non funziona e quando sarà corretto, non dove nel codice.

## 7. Chiudere

Riportare all'utente, in quest'ordine: quanti casi, quanti passati per la CLI, quanti per il
tuo giudizio; i fallimenti attribuiti, per componente; le segnalazioni aperte con i numeri; i casi
**consegnati a uno sviluppatore** e se il messaggio è partito o è solo pronto; ciò
che è rimasto non attribuito e perché; dove stanno report, giudizio e le guide per il cliente. E
ricordare che la suite in `blueprints/tests/` va **committata**: è la regressione del blueprint, e la prossima versione
della libreria si collauda rilanciandola.

## Cosa non fare

- Non chiamare l'API a mano (`curl`, `.Client`): tutto passa da `xrcopilotlab-bp test`. Se
  manca un'evidenza, si estende la CLI, non si aggira.
- Non eseguire su un ambiente o un tenant che l'utente non ha indicato, e mai `--env prod` su
  un tenant che non sia quello di Hevolus.
- Non aprire issue senza un sì esplicito per quelle bozze, e non aprirle nei repository delle
  librerie: vanno nella webapp, con la label del componente.
- Non attribuire un fallimento a una libreria per esclusione: senza un'evidenza di quel
  componente, è «non attribuito».
- Non trasformare «non posso verificare» in una diagnosi: senza i cloni il sospetto resta un
  sospetto, e si consegna a chi può guardarlo (§4-bis).
- Non dire che una mail è stata mandata se la sessione non aveva uno strumento per mandarla, e
  non mandarla senza averla mostrata.
- Non marcare `✅` un caso consegnato e non ancora verificato: l'esito è `🔁 in attesa di verifica`.
- Non scrivere `TODO` in una domanda per «vedere cosa succede»: il validatore lo blocca, e a
  ragione — manderebbe al tenant la parola «TODO».
- Non scrivere nelle guide per il cliente id di istanze, run, webhook o chiavi, né il triage per
  componente: quello sta nel giudizio. Nella pagina web nemmeno la sezione «per chi conduce».
- Non pubblicare un artifact senza aver caricato `artifact-design` e senza aver verificato
  l'organizzazione della CLI: la pagina nasce nell'organizzazione sbagliata e va rifatta.
- Non dichiarare «collaudato» nelle guide ciò che ha passato solo una simulazione o una prova a
  secco: si scrive come è stato provato.
- Non copiare nella issue della webapp il dettaglio tecnico: la regola problem-only vale anche
  per le issue che nascono da un collaudo.
- Non correggere il manifest e la libreria nello stesso giro: prima si sistema ciò che è del
  manifest e si rilancia; ciò che resta è ciò che si segnala.
