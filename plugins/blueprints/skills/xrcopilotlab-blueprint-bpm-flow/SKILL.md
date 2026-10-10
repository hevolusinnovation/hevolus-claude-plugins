---
name: xrcopilotlab-blueprint-bpm-flow
description: Legge il manifest di un blueprint XRCopilotLab (da file o dall'archivio di un tenant) e ne ricava un documento di lavoro per ragionare del processo insieme al cliente: per ogni processo BPM una scheda sintetica (scopo, in breve, quando si usa, come parte, che cosa arriva e che cosa si ottiene, chi partecipa, dove decide una persona, che cosa fa il sistema da solo, quanto dura), il diagramma BPMN a corsie in vista sintetica o completa, il passo per passo, i punti «da decidere insieme» (D1, D2… segnati sul disegno) e gli spazi per le note. Si esporta in PDF e in Word (.docx, modificabile) con le note scritte dentro. Pubblicato come artifact. Usa per «il flow chart del blueprint», «il documento dei processi da rivedere col cliente», «la scheda del processo», «il diagramma BPMN», «la mappa dei processi». NON scrive né applica il manifest (xrcopilotlab-blueprint), non collauda (-blueprint-test), non scrive la guida/demo del cliente (-blueprint-guide), non tocca il tenant.
---

# xrcopilotlab-blueprint-bpm-flow

Dal manifest a un **documento di lavoro da rivedere insieme al cliente**. Il manifest descrive i processi
in YAML: giusto per la macchina, illeggibile per chi deve dire «sì, è così che lavoriamo» o «no, qui manca
un passaggio». Questa skill produce un artifact con **una scheda per processo**: poche righe che dicono a che
cosa serve e chi fa che cosa, il diagramma nello stile BPMN che chi lo conosce riconosce al volo, e lo spazio
per scrivere ciò che il cliente risponde. I flussi ci sono tutti, ma sono **il supporto** della conversazione,
non il documento: chi lo legge deve capire il processo prima di guardare il disegno.

È una specie di **modello (template) del processo** da compilare insieme: la parte calcolata dal manifest
resta ferma, la parte «da decidere» e le note si riempiono durante l'incontro, e l'esito si porta via in
**PDF** (da stampare e annotare a penna) o in **Word** (da modificare).

## Come si legge una scheda (e perché è fatta così)

La notazione è quella di BPMN 2.0
([Wikipedia](https://it.wikipedia.org/wiki/Business_Process_Model_and_Notation)): eventi come cerchi
(inizio sottile, fine spesso), attività come rettangoli arrotondati, **bivi** come rombi (× una strada sola,
+ tutte insieme), frecce piene per l'ordine, corsie per chi fa che cosa, sottoprocesso compresso con il «+».
Wikipedia indica anche la regola di leggibilità che qui si applica: **livelli di dettaglio** e **simboli
sempre gli stessi**. Per questo ogni scheda ha due viste dello stesso processo:

| Vista | Che cosa mostra | A chi serve |
|---|---|---|
| **Sintetica** (predefinita) | le serie di passi automatici consecutivi sono **un solo passo compresso** («Il sistema lavora da solo», con il «+» del sottoprocesso); restano visibili le persone, i controlli, i bivi | la conversazione col cliente |
| **Completa** | ogni passo del manifest | chi configura, e chi vuole il dettaglio |

| Dove, in ordine di pagina | Che cosa dice | Da dove viene |
|---|---|---|
| **Scopo** (una frase) | a che cosa serve il processo | **lo scrivi tu** (§3) |
| **In breve** e **Quando si usa** | il racconto in pochi paragrafi, e quando sì e quando no | **lo scrivi tu** (§3) |
| **La scheda**: come parte · che cosa arriva · che cosa si ottiene · chi partecipa · dove decide una persona · che cosa fa il sistema da solo · quanto dura | il «canvas» del processo | calcolata dal manifest; «arriva» e «si ottiene» (e, se serve, «dove decide una persona») li scrivi tu |
| **Diagramma** | corsie per ruolo, attività, bivi, cicli; al clic il dettaglio; i pallini ambra **D1, D2…** segnano i punti da discutere | calcolato dal manifest |
| **Passo per passo** | una frase per cerchio e bivio, con i numeri del disegno | **lo scrivi tu** (§3) |
| **Da decidere insieme** | le domande da porre al cliente, con un campo per la risposta; poi **Note della sessione** | **le scrivi tu**; le risposte le scrive chi conduce, nella pagina |
| **Panoramica** (prima scheda, solo se richiesta) | chi o che cosa avvia ogni processo | diagramma calcolato; testo scritto da te |
| **Dettagli tecnici, per chi configura** (sezione chiusa, in fondo, **non esportata**) | come parte, tempi, passo per passo completo, tabelle, settimana tipo | calcolato dal manifest |

Il **PDF** (A4 orizzontale, tre pagine per processo) ha: la scheda; il diagramma intero, ad alta risoluzione
e con la legenda; il passo per passo, le domande con la risposta (o con le **righe vuote per scrivere a
penna**) e le note. Il **Word** (.docx, A4 orizzontale) ha le stesse sezioni con le caselle delle note da
riempire o da correggere: è la forma comoda quando il cliente rimanda il documento con le sue osservazioni.
Le note scritte nella pagina finiscono in tutti e due.

Non tocca il tenant e non scrive niente nel repository: legge, disegna, pubblica.

| Chi | Fa | Non fa |
|---|---|---|
| **Tu** | scegli il manifest, estrai i blocchi che servono, assembli la pagina, pubblichi l'artifact, controlli che il disegno corrisponda al manifest | non riscrivi il layout a mano, non inventi passi che il manifest non ha |
| **La pagina** | interpreta lo YAML incorporato e disegna: corsie, nodi, frecce, cicli, dettaglio al clic, tema chiaro e scuro | non chiama nessun servizio, non legge nient'altro che il manifest incorporato |
| **L'utente** | dice di quale blueprint e di quale ambiente, decide con chi condividere l'artifact | — |

Input: `$ARGS` — il percorso di un manifest, oppure il tag di un blueprint (con l'ambiente), oppure niente.

Riferimenti:

| Quando | Documento |
|---|---|
| Come ogni elemento del manifest diventa un simbolo, e come si legge il disegno | [`references/notazione.md`](references/notazione.md) |
| Se la CLI non c'è | la skill `xrcopilotlab-blueprint`, `references/installazione.md` |
| Regole del grafo (cosa il validatore accetta) | la skill `xrcopilotlab-blueprint`, `references/regole-del-grafo.md` |

## 0. Se `$ARGS` è vuoto

Orientare e fermarsi: a cosa serve (il flusso dei processi e degli orchestratori di un blueprint,
disegnato), che cosa serve (un manifest: un file, o la CLI `xrcopilotlab-bp` con un'utenza `hevolus.it`
per scaricarlo dall'archivio), che cosa si ottiene (un artifact privato con una scheda per flusso).
Se i blueprint che l'utente può leggere sono pochi, elencarli con `xrcopilotlab-bp status --env <ambiente>`
**solo** dopo che ha indicato l'ambiente. Poi la domanda: quale blueprint, e da quale ambiente.

## 1. Procurarsi il manifest

Tre casi, in quest'ordine:

1. **L'utente indica un file** (un percorso locale): si usa quello, dicendo che potrebbe non essere l'ultima versione dell'archivio.
2. **L'utente indica un tag e un ambiente**: si scarica la versione pubblicata, in sola lettura:

   ```bash
   xrcopilotlab-bp pull --tag <TAG> --env <ambiente> [--company <guid>] [--version <n>] --out <scratch>/<TAG>.yml
   ```

   Senza `--version` arriva l'ultima. Dire all'utente **quale versione** si disegna.
3. **L'utente indica solo il nome** (o niente): si chiede il tag e l'ambiente e si procede
   come al punto 2: su disco non c'è una cartella dei blueprint da cercare.

**Lo stesso tag può avere versioni diverse in ambienti diversi** — staging e produzione si numerano per
conto proprio e contengono manifest che differiscono almeno nel tenant e nei referenti. Se l'utente non
dice quale, **chiedere** o disegnare quello che sta nel suo lavoro e dichiararlo nel risultato. Mai
scegliere in silenzio.

Su produzione `pull` è una lettura: nessuna conferma da chiedere, ma l'ambiente e il tenant vanno
nominati nella risposta, come per ogni comando della CLI.

## 2. Estrarre solo ciò che serve

Il manifest intero contiene i system message degli agenti, i destinatari delle email, i membri dei ruoli,
gli id del tenant. Nella pagina **non devono finire**. Lo script `assets/estrai-blocchi.sh` tiene
`blueprint`, `tag`, `version`, `businessRoles`, `agentTasks`, `processes`, `orchestrators` e, di `agents`,
`connections` e `mcpServers`, solo i campi che li **collegano** fra loro (`key`, `name`, `mcp`, `process`,
`connection`: servono a capire quale agente avvia quale processo dalla chat); scarta le righe di solo
commento e ogni riga che contiene un indirizzo email.

```bash
S=<cartella di lavoro della sessione>
sh <percorso della skill>/assets/estrai-blocchi.sh <manifest.yml> > $S/blocchi.yml
grep -c '@' $S/blocchi.yml        # deve dare 0
grep -c 'baseUrl\|systemMessage' $S/blocchi.yml   # deve dare 0
```

Lo script è uno `sh` con `awk`: gira su macOS e su Linux; lo lancia **Claude**, non l'utente. Se la
postazione non ha `sh` (Windows senza WSL), copiare a mano i blocchi, tenendo le stesse regole.

Controllare che nel risultato ci siano `processes` e/o `orchestrators`: un blueprint senza nessuno dei
due non ha niente da disegnare, e va detto all'utente invece di pubblicare una pagina vuota.

## 3. Scrivere il testo per il cliente

La pagina calcola da sola il diagramma e le righe tecniche della scheda. **Non sa raccontare il processo né
sa che cosa chiedere al cliente**: quello lo scrivi tu, in un file `spiegazioni.yml`, per chi **non conosce il
prodotto**. Il linguaggio è quello della guida: vocabolario in
[`xrcopilotlab-blueprint-guide/references/linguaggio.md`](../xrcopilotlab-blueprint-guide/references/linguaggio.md)
(«assistente», non «agente»; «la pratica», non «istanza»; «se… allora…», non «gateway»).

```yaml
panoramica: |-
  Facoltativa (solo con includi: [panoramica]): due o tre paragrafi su che cosa fa il blueprint e che cosa fa partire i processi.
flussi:
  "Titolo esatto del processo":              # come compare nella scheda
    scopo: "Una frase sola: a che cosa serve, per chi."
    in_breve: |-
      Due o tre paragrafi brevi, separati da una riga vuota: che cosa arriva, che cosa fa l'assistente,
      dove la persona controlla o decide, come finisce (rinvio, correzione, chiarimento).
    quando: >-
      Una o due frasi: quando si usa, e quando NON va usato.
    ingresso: "Che cosa arriva: una PEC, un avviso, un dettato in chat."
    risultato: "Che cosa si ottiene: un impegno nel calendario comune, la pratica chiusa."
    controlli:                              # facoltativo: sostituisce l'elenco calcolato di «Dove decide una persona»
      - "Il referente controlla la proposta sul testo originale."
    passi:                                  # una frase per ogni cerchio e bivio, per id del manifest
      start: "Arriva una comunicazione in casella."
      verifica: "Il referente controlla la proposta sul testo originale."
    discutere:                              # le domande da fare al cliente: D1, D2…
      - passo: verifica                     # facoltativo: l'id del passo, e D1 compare sul disegno
        domanda: "Il referente è sempre la stessa persona, o cambia secondo l'autorità?"
      - domanda: "Quante comunicazioni arrivano in media in un giorno?"   # senza passo: domanda generale
includi: []                                 # facoltativo: [panoramica, orchestratori]
```

(`storia` e `sintesi` al posto di `in_breve` funzionano ancora.) **Di default la pagina spiega solo i processi
BPM**: niente Panoramica né orchestratori, a meno che `includi` li nomini.

Come scriverlo:

- **Sintetico.** `scopo` una frase; `in_breve` al massimo tre paragrafi e ~90 parole in tutto; `passi` una
  riga a passo. Il documento serve a ragionare insieme, non a sostituire il manifest.
- **Racconto, non elenco**, nell'ordine in cui le cose succedono. I numeri stanno nel disegno.
- **Linguaggio del cliente.** Niente «agent task», «agente», «gateway», «webhook», «token», «cron», nomi di
  variabili, minuti. Si dice «un assistente», «il sistema», «la persona verifica», «ogni ora».
- **Dove decide una persona, dirlo**: nulla va in calendario o verso un professionista senza che un referente
  abbia controllato.
- **Le domande di `discutere` sono per il cliente**: una decisione o un dato che solo lui sa (chi è il
  referente, quali eccezioni esistono, quanti casi al giorno, che cosa manca). 3–6 per processo, una cosa per
  domanda, mai una domanda a cui il manifest già risponde. Per i processi che il manifest lascia aperti
  (ruolo mancante, tempi non dichiarati, ramo senza condizione) la domanda è proprio quella.
- **Gli orari sono quelli del manifest.** Le durate in minuti non si scrivono. Se qualcosa non è dichiarato,
  non si stima; mai inventare un passo, un ruolo o un orario.
- **Leggi il grafo prima di scrivere**: processi con lo stesso nome e il suffisso civile/penale possono avere
  passi diversi. Mai scrivere «uguale a…» senza aver confrontato gli id. Un percorso uguale si racconta una
  volta; nell'altra scheda una riga dice in che cosa differisce.
- **Gli id in `passi` e `discutere.passo`** sono quelli del manifest. Nella vista sintetica un id che sta in
  una serie compressa si somma al passo compresso: va bene scriverli lo stesso, la pagina li unisce.

Se l'utente ha fretta il file si può omettere (`-` al posto del percorso): la pagina funziona lo stesso, ma
senza testi restano scheda calcolata e diagramma. Va detto, e che i testi si possono aggiungere dopo.

## 4. Assemblare la pagina

`assets/bpm-viewer.html` è il modello: la pagina, lo stile e il disegnatore. `assets/assembla.sh` lo
riempie con il manifest estratto e con le spiegazioni:

```bash
sh <percorso della skill>/assets/assembla.sh $S/blocchi.yml $S/spiegazioni.yml "<Nome dello scenario>" > $S/flussi-bpm.html
# senza spiegazioni: sh .../assembla.sh $S/blocchi.yml - "<Nome dello scenario>" > $S/flussi-bpm.html
```

`<Nome dello scenario>` è il nome che l'utente dà al cliente o allo scenario («Studio Polis», «Agenda di
studio»): **due o tre parole**, perché il titolo dell'artifact diventa «Flussi BPM <Scenario>». Non il
tag in maiuscolo, a meno che sia l'unico nome.

La pagina carica `js-yaml` e `jsPDF` da cdnjs e `docx` (il Word) da jsDelivr, tutti con l'impronta di integrità: non c'è niente da installare.
Non modificare il modello nella cartella della skill per un caso particolare: se serve un ritocco
generale, si corregge lì e vale per tutti.

## 5. Controllare prima di pubblicare

Il disegno è deterministico, ma il manifest può avere cose che il disegno mostra male. Prima di
pubblicare, **una** verifica:

- se la sessione offre una **anteprima** dell'artifact o un browser, guardare la scheda, la vista sintetica **e** quella completa, i pallini D1… sui passi giusti, e una scheda con
  un processo lungo: corsie nell'ordine giusto, nessun riquadro sovrapposto, le frecce dei bivi con la loro
  condizione, **e gli orari della settimana tipo uguali a quelli del manifest**;
- altrimenti, riletta a parole: «N processi, M orchestratori, il primo ha K passi e J bivi» e confrontare
  col manifest.

Cose da guardare, e a chi rimandarle:

| Se vedi | Significa | Che fare |
|---|---|---|
| Una corsia «Senza ruolo» | un'attività umana senza `roleName` né `assignmentExpression` | è un difetto del manifest: `xrcopilotlab-bp validate <file> --graph`, poi dirlo all'utente |
| Una corsia «Assegnato per regola» | l'attività si assegna con un'espressione (per esempio il professionista scelto dal referente) | è normale: il ruolo si decide a runtime |
| Una freccia tratteggiata «ritorno» | un ciclo (per esempio i chiarimenti che riportano alla verifica) | è normale |
| Un bivio con una sola uscita, o senza etichette | un ramo senza condizione né etichetta | si legge dal pannello; se è un errore, `validate --graph` lo segnala |
| Nella Panoramica un processo senza nessun avvio, o «Il manifest non dice come parte» | nessuna attività schedulata, connessione o ruolo di avvio lo raggiunge | è un fatto del manifest: dirlo all'utente, perché un processo che nessuno avvia è quasi sempre una dimenticanza |
| Nella Panoramica un'attività schedulata che non avvia niente | manda solo una email, o scrive in casella | è normale (briefing, riepiloghi): compare nei dettagli tecnici (tabella e settimana tipo), non nel diagramma |
| «Tempi: il manifest non li dichiara» | nessun passo ha `expectedDurationMinutes` né `maxLeadTimeMinutes` | chi lavora ai processi non può prometterli al cliente: dirlo |
| Frecce lunghe che attraversano riquadri | il layout è automatico e non evita sempre gli incroci | non è un difetto del manifest: si legge dal pannello di dettaglio, e si può ingrandire con «+» |

Non rifare il layout a mano e non «sistemare» il disegno modificando il manifest per farlo venire meglio.

## 6. Pubblicare

Come ogni artifact della famiglia: **privato**, titolo stabile, stesso `url` agli aggiornamenti.

- **Prima di pubblicare** controllare l'organizzazione con `/status`, come per le altre guide, e che non
  esista già un «Flussi BPM <Scenario>» (`Artifact` `action: "list"`): se c'è, si aggiorna **allo stesso
  `url`**, con la stessa icona, e il link dato a chi conduce non cambia.
- `file_path`: la pagina assemblata; `icon`: `flowchart` alla prima pubblicazione; `description`: una
  riga — «Processi e orchestratori del blueprint <Scenario> disegnati come diagrammi BPMN a corsie.»
  con la versione disegnata.
- **`capabilities: {downloads: true}`**, sempre, e a ogni ripubblicazione (omettere il campo mantiene quello
  già dichiarato, ma alla prima volta è necessario). È ciò che permette ai pulsanti **PDF** e **Word**
  («di questo flusso» e «di tutti») di offrire il file a chi guarda; senza, i pulsanti restano spenti. Le pagine
  pubblicate non possono né stampare né scaricare da sole: il file si genera nel browser e chi guarda deve
  confermare il salvataggio. Nome: `flussi-bpm-<scenario>[-<processo>].pdf` o `.docx`.
- **Le note** che chi conduce scrive nella pagina restano **solo nel suo browser** (e nei file esportati): non
  le vede nessun altro e non tornano a Claude. Dirlo all'utente: il verbale dell'incontro è il PDF o il Word.
- PDF e Word **non funzionano dall'anteprima locale del file**: serve la pagina aperta in claude.ai. Dirlo se l'utente
  prova a esportarli da altrove: la pagina lo scrive sotto i pulsanti.
- **Dopo la pubblicazione, aprirlo** (`Artifact` `action: "open"`, o Claude in Chrome): è la regola di
  tutti gli artifact delle skill blueprint.
- **Privato alla nascita.** La pagina è scritta per il cliente, ma la sezione «Dettagli tecnici» mostra ruoli, agent task e variabili: si condivide il **PDF o il Word** (che non la contengono), o la pagina solo dopo un sì dell'utente. Non sostituisce la guida (`xrcopilotlab-blueprint-guide`): quella racconta il blueprint e la demo, questo documento serve a **rivedere i processi** insieme.

## 7. Chiudere

Riportare all'utente, in poche righe: **il link**, **che versione e da che ambiente** è stato disegnato,
quanti flussi (processi e orchestratori), e ciò che il disegno ha rivelato che merita attenzione — un
processo che nessuno avvia, tempi non dichiarati, un ciclo, un bivio senza condizione, una corsia senza
ruolo, un passo senza uscita. Non ripetere il contenuto dei diagrammi. Dire anche se i **testi** (scopo, in breve, passi, domande da decidere) sono stati scritti da te o mancano, quali domande hai messo in `discutere`, e che PDF e Word si esportano dai pulsanti in alto a destra.

Se l'utente modifica il manifest, la regola è la stessa: si rifà il giro (§1-§6) e si ripubblica allo
stesso `url`. Il diagramma non si aggiorna da solo.

## Cosa non fare

- Non usare gergo nei testi (agent task, agente, webhook, variabili, minuti): li legge il cliente.
- Non riempire `discutere` di domande retoriche o a cui il manifest risponde: sono le cose che solo il cliente sa.
- Non allungare la scheda: se un processo ha bisogno di mezza pagina di `in_breve`, il racconto va accorciato, non il formato allargato.
- Non pubblicare il manifest intero nella pagina: system message, email e id del tenant restano fuori
  (§2). Se `estrai-blocchi.sh` non si può usare, estrarre a mano con lo stesso criterio.
- Non disegnare a mano un diagramma diverso da quello che la pagina produce, né aggiungere passi che il
  manifest non ha per «completare» il flusso.
- Non modificare il manifest, e non applicarlo, per far venire meglio il disegno.
- Non scegliere in silenzio la versione o l'ambiente: un blueprint ha spesso versioni diverse in ambienti
  diversi (§1).
- Non condividere l'artifact col cliente senza un sì dell'utente: è la mappa tecnica, non la guida.
- Non scrivere nel racconto tempi, orari o passi che il manifest non dichiara: la pagina mostra i numeri veri, e un racconto che dice altro li smentisce davanti al cliente.
- Non offrire un pulsante «Stampa» o un link di download a mano: le pagine pubblicate non li eseguono. PDF e Word passano dalla capacità `downloads`, e solo da lì.
- Non usare questa skill per collaudare, né per dire se un processo «funziona»: il disegno mostra come è
  scritto, non come gira. Per quello, `xrcopilotlab-blueprint-test`.
