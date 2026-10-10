---
name: xrcopilotlab-blueprints-report
description: Elenca i blueprint del catalogo di Hevolus (il «market place» dei modelli installabili da qualunque tenant) e li descrive come un manuale in linguaggio semplice, come la guida (xrcopilotlab-blueprint-guide) — a che cosa serve ognuno, per chi, che cosa crea, e soprattutto i processi BPM raccontati in modo discorsivo (come partono, dove decide una persona, che cosa si ottiene). Il manuale contiene anche le istruzioni per installare il plugin su Claude Code e Claude Desktop (/plugin …) e per importare il manifest di un blueprint in un tenant qualsiasi facendo eseguire a Claude tutte le fasi — installazione dal catalogo, segreti, piano, approvazione, apply, collaudo con xrcopilotlab-blueprint-test, rollback. Si pubblica come artifact con design Hevolus ed esporta in PDF. Usa per «il manuale dei blueprint», «cosa c'è nel catalogo», «il report dei blueprint del marketplace», «presenta i blueprint ai clienti/sales». NON scrive né applica un manifest (xrcopilotlab-blueprint), non collauda (-blueprint-test), non scrive la guida di un cliente (-blueprint-guide), non tocca nessun tenant.
---

# xrcopilotlab-blueprints-report

Dal **catalogo dei blueprint** a un **manuale** che un Sales, un AI Specialist o un amministratore di
tenant può leggere senza conoscere il prodotto: che cosa c'è, a che cosa serve, come funzionano i
processi, e che cosa fare — passo per passo, facendolo eseguire a Claude — per averlo sul proprio tenant.

È la skill «vetrina» della famiglia: le altre **fanno** (scrivere, applicare, collaudare), questa
**racconta ciò che c'è** e **spiega come prenderlo**.

| Chi | Fa | Non fa |
|---|---|---|
| **Questa skill** | legge il catalogo, racconta ogni modello come un manuale, pubblica l'artifact con l'export PDF | installare, applicare, collaudare, toccare un tenant |
| [`xrcopilotlab-blueprint`](../xrcopilotlab-blueprint/SKILL.md) | scrive e applica un manifest | raccontarlo |
| [`xrcopilotlab-blueprint-test`](../xrcopilotlab-blueprint-test/SKILL.md) | collauda un blueprint applicato | — |
| [`xrcopilotlab-blueprint-guide`](../xrcopilotlab-blueprint-guide/SKILL.md) | la guida **di un cliente**, con la demo | un elenco di modelli |
| [`xrcopilotlab-blueprint-bpm-flow`](../xrcopilotlab-blueprint-bpm-flow/SKILL.md) | i flussi di **un** blueprint, disegnati, da rivedere col cliente | il manuale del catalogo |

Input: `$ARGS` — l'ambiente (`staging` / `prod`) ed eventualmente i modelli da includere. Niente = tutti
i modelli dell'ambiente che l'utente indica.

## Se compare che il plugin è indietro

Una riga come «c'è il plugin blueprints 2.x, questo è il 2.y…» arriva da un hook all'apertura della
sessione. **Dilla all'utente a parole**, una riga, con i due comandi (`/plugin marketplace update hevolus`,
`/plugin update blueprints@hevolus`) e il riavvio: non puoi aggiornare tu, e non è urgente.

## 0. Se `$ARGS` è vuoto

Orientare e fermarsi: a che cosa serve (un manuale dei blueprint del catalogo, con PDF), che cosa serve (la
CLI `xrcopilotlab-bp` del plugin *blueprints* e un'utenza `hevolus.it` per **leggere** il catalogo), che
cosa si ottiene (un artifact privato). Poi la domanda: **quale ambiente** (staging, prod) — il catalogo
di ciascuno è diverso — e se vuole tutti i modelli o alcuni.

## 1. Procurarsi i dati

### 1.1 L'elenco dei modelli — una lettura

```bash
xrcopilotlab-bp catalog list --env <ambiente>
```

Restituisce, per ogni modello, **l'ultima versione**: nome, versione, tag, data, descrizione e che cosa
crea (agenti, orchestratori, profili di conoscenza…). Su **produzione** è una lettura: nessuna conferma,
ma l'ambiente va nominato nella risposta. Se il catalogo è vuoto, dirlo e fermarsi: il manuale di un
catalogo vuoto non serve. (Al 10/10/2026: staging aveva un modello, `legal-suite`; produzione nessuno.
**Non fidarsi di questa riga**: l'elenco si rilegge ogni volta.)

**Gli ambienti hanno cataloghi diversi.** Se l'utente non dice quale, **chiedere**; mai scegliere in
silenzio. Il manuale riporta l'ambiente e la data di lettura.

### 1.2 Il manifest di ogni modello — dove leggerlo

Per i processi serve il **manifest**, non solo la riga del catalogo. **Nessun comando legge il manifest
di un modello direttamente dalla partizione `default`** (`default` non è un tenant: ogni altro comando lo
rifiuta). Tre strade, **in quest'ordine**, e la terza solo con un sì:

1. **Il file del modello**, se l'utente lo ha (chi lo ha pubblicato). Si usa quello, dicendo che potrebbe
   non essere l'ultima versione del catalogo.
2. **La copia su un tenant dove è già installato** o da cui è nato (il tag del modello): sola lettura,
   `xrcopilotlab-bp pull --tag <TAG> --env <ambiente> --company <guid> --out <scratch>/<TAG>.yml`.
   Dire **quale versione** si legge e se coincide con quella del catalogo.
3. **Installarlo su un tenant di collaudo** (`catalog install`), solo per leggerlo. Scrive **nell'archivio
   del tenant** (non crea entità), ma lascia una copia: **chiedere prima**, su un tenant di collaudo di
   staging e mai su un tenant di un cliente. Poi `pull`, e la copia resta lì finché l'utente non dice altro.

Se nessuna strada è praticabile, il modello si descrive **solo con la riga del catalogo** e il manuale lo
dichiara («i processi non sono descritti: manifest non letto»). Mai inventare un processo.

Prima di scrivere, **estrarre solo ciò che serve** con lo script della skill gemella:

```bash
S=<scratch>
sh <skills>/xrcopilotlab-blueprint-bpm-flow/assets/estrai-blocchi.sh $S/<TAG>.yml > $S/<TAG>.blocchi.yml
grep -c '@' $S/<TAG>.blocchi.yml                       # deve dare 0
grep -c 'baseUrl\|systemMessage' $S/<TAG>.blocchi.yml  # deve dare 0
```

Il manifest intero contiene system message, destinatari delle email, id del tenant: nel manuale **non
devono finire**.

### 1.3 Le risorse di ogni modello: gli artifact già fatti

Ogni capitolo chiude con «Per saperne di più»: i link agli artifact che le altre skill dei blueprint hanno già
pubblicato per quel modello. Il manuale non li rifà e non li riassume: li indica.

| Cosa si cerca | Prodotto da | `tipo` | Titolo tipico |
|---|---|---|---|
| I video che spiegano | `xrcopilotlab-blueprint-storyboard` | `video` | «Video <Scenario>», «<Scenario> video» |
| La guida e il deck | `xrcopilotlab-blueprint-guide` | `guida`, `presentazione` | «<Scenario> — guida», «<Scenario> — deck» |
| La guida tecnica per chi fa la demo | `xrcopilotlab-blueprint-guide` | `guida` (**interno**) | «<Scenario> — demo (interna)» |
| La spiegazione dei processi BPM | `xrcopilotlab-blueprint-bpm-flow` | `processi` | «Flussi BPM <Scenario>» |
| Le domande di prova | `xrcopilotlab-blueprint-test` | `domande` | «<Scenario> — domande di prova» |
| Il brief per l'agenzia | `xrcopilotlab-blueprint-demo` | `brief` | «DEMO-<Scenario>» |

Come si trovano, senza indovinare:

1. `Artifact` `action: "list"` (limite 200) e si **propone** la corrispondenza modello → artifact. Il titolo non porta il
   tag: l'abbinamento si fa dal nome dello scenario e **si mostra all'utente**, che lo conferma o lo corregge.
2. Per ogni artifact dubbio si legge la pagina (`action: "read"`) prima di linkarla: un titolo come «tecnica» non basta.
3. **Si classifica a chi è rivolto** (`a_chi`). Vale `interno` per tutto ciò che è «(interna)», per i video che portano
   l'avviso «solo uso interno» (nomi di altri clienti non oscurati) e per i brief; vale `cliente` solo se l'artifact è
   scritto per il cliente **e** l'utente lo conferma. Nel dubbio, `interno`.
4. **Un artifact di un cliente non entra nel manuale di un modello**: «Studio Polis», «Conoscenza degli associati» e simili
   appartengono a un blueprint di un tenant, non al catalogo. Si linkano solo gli artifact dello scenario del modello.
5. Se per un modello non c'è niente, la sezione non compare e il messaggio finale dice **che cosa manca** (per esempio «nessun
   video»): è l'elenco delle skill da lanciare.
6. Si tiene un solo link per tipo: fra due versioni dello stesso titolo vale quella aggiornata più di recente, e la duplicata
   si cita all'utente.

I link funzionano solo per chi può aprire l'artifact di destinazione: il manuale **non cambia la condivisione** di nessuno
e lo dice nel messaggio finale. L'indirizzo compare per intero accanto al titolo perché il PDF non ha link cliccabili.

## 2. Scrivere il manuale

La sorgente è `manuale.json`, nella cartella di lavoro della sessione (lo scratchpad). Lo schema è in
[`references/schema.md`](references/schema.md); l'impaginazione la fa la pagina. **Il testo lo scrivi tu**,
con le regole della guida: vocabolario in
[`xrcopilotlab-blueprint-guide/references/linguaggio.md`](../xrcopilotlab-blueprint-guide/references/linguaggio.md)
(«assistente», non «agente»; «la pratica», non «istanza»; «se… allora…», non «gateway»).

### 2.1 Il filo del manuale

| # | Sezione | Che cosa dice |
|---|---|---|
| 1 | **Che cos'è il catalogo** | una pagina: i modelli sono blueprint pronti, curati da Hevolus, installabili da qualunque tenant; l'amministratore sceglie solo ciò che il modello lascia aperto (prefisso, topic, persone di ogni ruolo, credenziali) |
| 2 | **I modelli in una tabella** | nome, a che cosa serve, per chi, che cosa crea (numeri), versione |
| 3 | **Un capitolo per modello** | vedi sotto (§2.2) |
| 4 | **Installare il plugin** | Claude Code e Claude Desktop, con i comandi `/plugin …` (§3) — **testo standard già nella pagina** |
| 5 | **Portare un modello sul vostro tenant** | le fasi, eseguite da Claude (§4) — **testo standard già nella pagina** |
| 6 | **Glossario** | cinque o sei parole che il lettore incontrerà |

### 2.2 Il capitolo di un modello

In quest'ordine, **ogni parte breve**:

1. **In una frase** — che cosa fa per chi lo usa, con il suo lessico.
2. **Per chi è** — il ruolo (lo studio, l'ufficio, il reparto) e il problema che risolve.
3. **Che cosa contiene** — i numeri veri presi dal catalogo/manifest («nove assistenti, due percorsi di
   lavoro, un archivio di conoscenza»), poi un elenco degli assistenti con **una riga di compito ciascuno**.
4. **I processi BPM, raccontati.** È il cuore del capitolo e va scritto **in modo discorsivo**, come
   `xrcopilotlab-blueprint-bpm-flow` e la guida: per ogni processo due o tre paragrafi brevi, nell'ordine
   in cui le cose succedono —
   - *come parte* (una PEC, un dettato in chat, un orario, la richiesta di un assistente),
   - *che cosa fa il sistema da solo* e *dove decide una persona* (nulla va avanti senza un controllo, se così è nel manifest),
   - *come finisce* (la pratica chiusa, l'impegno in calendario, un rinvio, una correzione),
   - e una riga **«Chi partecipa»** con i ruoli.
   Se il manifest non è stato letto (§1.2) questa parte **non si scrive**: si dice perché.
5. **Che cosa serve per usarlo** — i ruoli che vogliono persone, le credenziali (per nome, mai il valore), i
   server esterni che il modello cita, e la **licenza** del tenant (agenti, profili di conoscenza).
6. **Che cosa non fa** — i confini, presi dal «cosa NON fai» degli assistenti e dal perimetro.
7. **Per saperne di più** — i link agli artifact del §1.3 (`risorse`), ciascuno con una riga su che cosa si trova.

**Regole di scrittura** (stesse della guida): frasi corte; nessun termine tecnico senza spiegazione
(orchestratore, topic, MCP, token, gateway, webhook, `BPxxx` non compaiono nel racconto); nessun dato del
tenant (id, indirizzi, chiavi); nessun esito di collaudo; **onestà sul perimetro**: ciò che il manifest non
fa non si promette; orari e tempi solo se dichiarati dal manifest, mai stimati.

### 2.3 Dopo aver scritto

Mostrare **all'utente** l'elenco dei titoli dei capitoli e, per ogni modello, l'«In una frase» e i titoli
dei processi, prima di pubblicare: è lui che conosce il cliente a cui lo mostrerà.

## 3. Il paragrafo «Installare il plugin»

Va nel manuale **sempre**. La pagina lo contiene già (`assets/report-viewer.html`, costante `PLUGIN_STD`): non si riscrive nel `manuale.json`. Se `docs/installare.md` è cambiato, si corregge **il modello**, una volta per tutti (o si passa `plugin` nel JSON per un caso solo). Contenuti (la fonte aggiornata è `docs/installare.md` del repository
`hevolus-claude-plugins`: se i comandi cambiano, il manuale si riscrive da lì).

**Chi esegue i comandi.** Applicare e collaudare passano dalla CLI `xrcopilotlab-bp`, che gira **solo dove
Claude può eseguire comandi**: la scheda **Code** dell'app Claude, o Claude Code da terminale. La **Chat**
di Claude Desktop non esegue comandi: lì si scrive e si legge, non si applica.

**Claude Code** (scheda *Code* dell'app, o terminale). Nella sessione si scrivono, una volta:

```
/plugin marketplace add hevolusinnovation/hevolus-claude-plugins
/plugin install blueprints@hevolus
```

poi si **riavvia la sessione** (le skill si caricano all'apertura). Per aggiornare, quando compare l'avviso
«c'è il plugin blueprints x.y.z…»:

```
/plugin marketplace update hevolus
/plugin update blueprints@hevolus
```

e di nuovo il riavvio. La CLI **non si installa a mano**: il plugin la scarica al primo uso e ne verifica
l'impronta. Serve l'accesso al repository `hevolusinnovation/hevolus-claude-plugins` (privato) e, per i
comandi che toccano il tenant, l'accesso con l'utenza `hevolus.it` (`xrcopilotlab-bp login`, una volta per
ambiente, da un terminale vero).

**Claude Desktop** (scheda *Chat*). Il plugin dell'*assessment* si carica come zip: dalla pagina delle release
di `hevolusinnovation/hevolus-claude-plugins` si scarica il file `Xrcopilotlab-….zip` **senza aprirlo**, poi
**claude.ai/customize/plugins → Carica plugin**. Le **skill dei blueprint** si possono usare anche in Chat
come skill singole (scrivere un manifest, il manuale, la guida), ma **senza eseguire** `apply` e collaudo: per
quelli si passa alla scheda **Code** con il plugin `blueprints@hevolus`.

L'app Claude si scarica dalle pagine ufficiali (macOS `.dmg` universale, Windows x64/ARM64): la scheda
**Code** è in alto. Verificare l'URL e i nomi dei file su `docs/installare.md` prima di pubblicarli.

## 4. Il paragrafo «Portare un modello sul vostro tenant»

Anche questo è già nella pagina (costante `FASI`; override con `importare`). Descrive come **Claude esegue** il percorso, in qualunque tenant. L'utente non scrive comandi: dice a
Claude, in italiano, «installa il modello `<nome>` sul tenant `<…>`» e Claude segue le fasi **fermandosi a
ogni cancello**. Le fasi, nell'ordine in cui compaiono nel manuale:

| Fase | Che cosa fa Claude | Cancello |
|---|---|---|
| **0 · Prima di cominciare** | verifica plugin e accesso; chiede **ambiente e tenant**; controlla che il tenant abbia la licenza (`XRCopilotLab.Agent`, profili, topic) | il tenant lo sceglie l'utente; in produzione solo tenant a cui appartiene |
| **1 · Scelte** | chiede ciò che il modello lascia aperto: **tag**, **topic** (nuovo o esistente), **persone di ogni ruolo** | un ruolo a cui il modello indirizza dei passi non può restare vuoto |
| **2 · Installazione** | `xrcopilotlab-bp catalog install <modello> --env … --company … [--tag] [--topic \| --existing-topic] [--members "ruolo=a@x.it,b@x.it"]` — copia nell'archivio del tenant, **non crea niente** | — |
| **3 · Credenziali** | elenca le credenziali per nome; si precaricano con `secrets set` (valore dato dall'utente nel terminale) **oppure si inseriscono dopo dalla UI**, Amministrazione › Connessioni. Claude **non chiede mai il valore** in chat | un segreto mancante non ferma il piano (`BP063` è un avviso) |
| **4 · Piano** | `xrcopilotlab-bp plan --tag <TAG> --env … --company …`: mostra che cosa verrebbe creato, che cosa collide, la licenza | nulla è ancora stato toccato |
| **5 · Approvazione** | l'utente legge il piano e dice **sì** | **senza un sì esplicito Claude non va avanti**; `--yes` si usa solo dopo il sì. Una collisione di nome ferma tutto (`BP060`): non si sovrascrive |
| **6 · Applicazione** | `xrcopilotlab-bp apply --tag <TAG> …`: crea topic, ruoli, assistenti, compiti, processi, orchestratori | l'inventario del run registra ciò che è stato creato |
| **7 · Collaudo** | con [`xrcopilotlab-blueprint-test`](../xrcopilotlab-blueprint-test/SKILL.md): parte dalla suite nell'archivio o ne scrive una (`test init`), `test validate`, **`test run`** (consuma token e lascia conversazioni e istanze visibili), giudica le risposte, attribuisce ogni difetto a un componente, propone le issue **solo dopo un sì** | prima di lanciare, ambiente, tenant e numero di casi, e un sì; sul tenant di un cliente non di propria iniziativa |
| **8 · Consegna** | riporta versione, run, esito del collaudo e ciò che resta a mano (credenziali, persone, una casella) | — |
| **9 · Se serve tornare indietro** | `rollback --run <runId>` smonta ciò che il run ha creato; `delete` toglie anche l'archivio | si ferma finché le entità sono vive; `delete` chiede di **scrivere il tag**, `--yes` non vale |

**Aggiornare** un modello già installato: `catalog install` di nuovo (riparte dalle scelte precedenti), poi
`plan` e `apply`: la versione nuova crea ciò che manca e aggiorna **sul posto** ciò che il blueprint ha
creato, senza cancellare mai.

Il paragrafo dice anche **che cosa Claude non fa**: non applica senza il sì, non scrive segreti, non
sovrascrive entità che non sono del blueprint, non apre issue senza un sì, non collauda un tenant di cliente
di propria iniziativa.

## 5. Assemblare e controllare

```bash
sh <percorso della skill>/assets/assembla.sh $S/manuale.json > $S/manuale-blueprint.html
```

Lo script legge `manuale.json`, ne verifica la forma (deve essere JSON valido) e lo incorpora nel modello
`assets/report-viewer.html`. Prima di pubblicare, **una** verifica:

- `grep -c '@' $S/manuale.json` — controllare a mano ogni risultato: gli indirizzi dei domini d'esempio
  vanno bene, quelli veri no;
- se la sessione offre un browser o l'anteprima: guardare la copertina, un capitolo con i processi, la
  tabella dei modelli, il tema scuro e un telefono (nessuno scroll orizzontale);
- altrimenti riletta a parole: «N modelli, il primo ha K processi» contro il catalogo.

## 6. Pubblicare

Come ogni artifact della famiglia: **privato**, titolo stabile, stesso `url` agli aggiornamenti.

- **Prima**: caricare la skill `artifact-design` (obbligatorio) e `artifact-capabilities` (per `downloads`);
  verificare l'organizzazione con `/status` (un artifact nell'organizzazione sbagliata dà «Page not found» e
  non si sposta); cercare con `Artifact` `action: "list"` un «Catalogo blueprint Hevolus» già
  esistente: se c'è, si aggiorna **allo stesso `url`**.
- `file_path`: la pagina assemblata; **`files`**: `{"manuale.json": "<scratchpad>/manuale.json"}`, così chi
  riprende il manuale legge la sorgente con `action: "read"` e `path: "manuale.json"`; `icon`: `book` alla
  prima pubblicazione; `description`: una riga con l'ambiente e il numero di modelli.
- **`capabilities: {downloads: true}`** — sempre. È ciò che permette al pulsante **Scarica PDF** di offrire
  il file; senza, il pulsante resta spento. Le pagine pubblicate non possono né stampare né scaricare da
  sole. Il PDF **non funziona dall'anteprima locale**: serve la pagina aperta in claude.ai.
- **Dopo la pubblicazione, aprirlo** (`Artifact` `action: "open"`, o Claude in Chrome): è la regola di tutti
  gli artifact delle skill blueprint.
- **Privato alla nascita.** Condividerlo è una scelta dell'utente.

## 7. Chiudere

Riportare, in poche righe: **il link**, **l'ambiente e la data** di lettura del catalogo, **quanti modelli**
e di quali versioni, per quali modelli i **processi sono descritti** e per quali no (e perché), e che il PDF
si scarica dal pulsante in alto a destra. Aggiungere le **risorse** trovate per modello, quelle **interne**, e ciò che manca
(video, guida, flussi) con la skill che lo produce. Non ripetere il contenuto del manuale.

Il manuale **invecchia**: quando il catalogo cambia (un modello nuovo, una versione) si rifà il giro dal §1 e
si ripubblica allo stesso `url`.

## Cosa non fare

- Non scegliere in silenzio l'ambiente: i cataloghi di staging e produzione sono diversi.
- Non inventare un modello, un processo, un passo o un orario che catalogo e manifest non hanno.
- Non linkare un artifact interno come se fosse per il cliente, né uno di un cliente nel capitolo di un modello: `a_chi` si decide con l'utente (§1.3).
- Non mettere nel manuale system message, indirizzi email, id del tenant, chiavi, indirizzi con credenziali.
- Non installare un modello su un tenant — nemmeno «per leggerlo» — senza un sì, e mai su quello di un cliente.
- Non eseguire `apply`, `rollback`, `delete` o `test run` da questa skill: il manuale li **descrive**; li
  esegue la skill del loro mestiere, con i loro cancelli.
- Non scrivere i comandi del §3 a memoria se `docs/installare.md` dice altro: si rilegge.
- Non offrire un pulsante «Stampa» o un link di download a mano: il PDF passa da `downloads`, e solo da lì.
- Non pubblicare senza la sorgente `manuale.json` fra i `files`, né a un `url` nuovo un manuale che esiste già.
