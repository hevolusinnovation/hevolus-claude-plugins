---
name: xrcopilotlab-blueprint-bpm-flow
description: Legge il manifest di un blueprint XRCopilotLab (da file o dall'archivio di un tenant) e ne disegna i flussi in stile BPMN, in un artifact: una scheda per processo BPM e per orchestratore, con corsie per ruolo, attività (persona, persona + agente, automatica), bivi, condizioni, cicli e dettaglio al clic. Con molti processi la prima scheda è la Panoramica: come parte ciascuno (a orario, dalla chat, a mano, da un altro processo), la settimana tipo e i tempi; ogni scheda ha «Quando parte e quanto dura», una spiegazione in parole semplici, il passo per passo numerato e l'export in PDF. Niente system message, email o id del tenant. Usa per «il flow chart del blueprint», «disegna i processi del manifest», «il diagramma BPMN», «la mappa dei processi». NON scrive né applica il manifest (xrcopilotlab-blueprint), non collauda (-blueprint-test), non scrive la guida del cliente (-blueprint-guide), non tocca il tenant.
---

# xrcopilotlab-blueprint-bpm-flow

Dal manifest al disegno. Un manifest di blueprint descrive i processi in YAML (attività, bivi, frecce)
e gli orchestratori in una lista di step: giusto per la macchina, illeggibile per chi deve capire dove
decide una persona, dove lavora un agente e che cosa succede quando una verifica va male. Questa skill
produce **un artifact con i diagrammi**, uno per flusso, nello stile che chi conosce BPMN riconosce al
volo: corsie per ruolo, cerchi di inizio e fine, riquadri per le attività, rombi per i bivi.

Il disegno da solo non basta quando i processi sono molti: non dice **quando** si usa ciascuno né **quanto
tempo** ci vuole. Per questo la pagina ha tre livelli di lettura, dal più semplice al più tecnico:

| Dove | Che cosa dice | Da dove viene |
|---|---|---|
| **Panoramica** (prima scheda, se i flussi sono più d'uno) | un diagramma di chi o che cosa avvia ogni processo; la tabella «quando si usa e quanto dura»; le attività che girano da sole, con la **settimana tipo** | calcolata dal manifest: schedulazioni (cron, in italiano), `outputActions` verso un processo, connessioni `process:` e gli agenti che le usano, `starterRoles`, `CallActivity` |
| **In parole semplici** e **Quando parte e quanto dura** (in testa a ogni scheda) | una sintesi senza sigle, e l'elenco di come parte e dei tempi | la sintesi la **scrivi tu** (§3); l'elenco è calcolato |
| **Passo per passo** (in fondo a ogni scheda) | ogni passo in una frase, numerato come i cerchi del disegno, con chi lo fa e quanto dura | calcolato dal grafo |

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

1. **L'utente indica un file** (`~/.xrcopilotlab/blueprints/<TAG>/<nome>.yml` o altro): si usa quello.
2. **L'utente indica un tag e un ambiente**: si scarica la versione pubblicata, in sola lettura:

   ```bash
   xrcopilotlab-bp pull --tag <TAG> --env <ambiente> [--company <guid>] [--version <n>] --out <cartella di lavoro>/<TAG>.yml
   ```

   Senza `--version` arriva l'ultima. Dire all'utente **quale versione** si disegna.
3. **L'utente indica solo il nome** (o niente): si cerca `~/.xrcopilotlab/blueprints/<TAG>/` e, se non c'è
   niente, si chiede l'ambiente.

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

## 3. Scrivere le spiegazioni semplici

La pagina calcola da sola tutto ciò che il manifest dichiara: gli orari, i tempi, chi avvia che cosa, il
passo per passo. **Non sa dire a parole il perché**: perché esistono quattro processi, che cosa cambia fra
l'uno e l'altro, in quale momento della giornata di una persona si usa ciascuno. Quello lo scrivi tu, in un
file `spiegazioni.yml`, per chi **non conosce il prodotto** — un cliente, un commerciale, un collega.

```yaml
panoramica: >-
  Tre o sei frasi: quanti processi ci sono e a che cosa serve ciascuno, in che modo e quando partono
  (da soli, dalla chat, a mano), che cosa gira ogni giorno o ogni settimana senza che nessuno faccia niente,
  e dove interviene sempre una persona.
flussi:
  "Titolo esatto del processo o dell'orchestratore":     # come compare nella scheda
    sintesi: >-
      Due o quattro frasi: che cosa succede dal primo all'ultimo passo, in parole di tutti i giorni.
    quando: >-
      Una o due frasi: in quale situazione si usa questo processo e quando NON va usato.
```

Come scriverle:

- **Per chi non sa che cos'è un agent task.** Niente «agent task», «gateway», «webhook», «token», nomi di
  variabili, sigle del manifest. Si dice «un controllo automatico», «un assistente», «una persona verifica».
- **Quando si usa, in una frase che una persona riconosce**: «Si usa per ogni comunicazione che riguarda
  un procedimento civile», non «ha trigger webhook». E, dove serve, **quando non si usa**.
- **Il tempo è quello del manifest.** Gli orari e le durate che scrivi vengono da `schedule.cron`,
  `expectedDurationMinutes`, `maxLeadTimeMinutes`, `timeoutSeconds`: se il manifest non li dichiara si
  scrive «non dichiarato», **non si stima**. La pagina mostra già i numeri: la sintesi dice che cosa
  significano («il referente ha al massimo un giorno per verificare»), non li ripete.
- **Mai inventare un passo, un ruolo o un orario** che nel manifest non c'è. Se qualcosa non è chiaro, si
  scrive «il manifest non lo dice» e si segnala all'utente.
- **Corte.** La sintesi sta in un riquadro: se serve un capitolo, è troppo lunga.

Se l'utente ha fretta, il file si può omettere (`-` al posto del percorso): la pagina funziona lo stesso,
con la Panoramica, i riquadri «Quando parte e quanto dura» e il passo per passo calcolati. Va detto che la
sintesi in parole semplici manca, e che si può aggiungere dopo.

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

La pagina carica da cdnjs `js-yaml` e `jsPDF`, con l'impronta di integrità: non c'è niente da installare.
Non modificare il modello nella cartella della skill per un caso particolare: se serve un ritocco
generale, si corregge lì e vale per tutti.

## 5. Controllare prima di pubblicare

Il disegno è deterministico, ma il manifest può avere cose che il disegno mostra male. Prima di
pubblicare, **una** verifica:

- se la sessione offre una **anteprima** dell'artifact o un browser, guardare la Panoramica e una scheda con
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
| Nella Panoramica un'attività schedulata che non avvia niente | manda solo una email, o scrive in casella | è normale (briefing, riepiloghi): compare nella tabella e nella settimana tipo, non nel diagramma |
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
  già dichiarato, ma alla prima volta è necessario). È ciò che permette ai pulsanti **PDF di questo flusso**
  e **PDF di tutti i flussi** di offrire il file a chi guarda; senza, i pulsanti restano spenti. Le pagine
  pubblicate non possono né stampare né scaricare da sole: il PDF si genera nel browser (diagramma come
  immagine, testo vero, pagine A3 orizzontali) e chi guarda deve confermare il salvataggio. Il file si chiama
  `flussi-bpm-<scenario>.pdf`, o con il nome del flusso se è uno solo.
- Il PDF **non funziona dall'anteprima locale del file**: serve la pagina aperta in claude.ai. Dirlo se l'utente
  prova a esportarlo da altrove: la pagina lo scrive sotto i pulsanti.
- **Dopo la pubblicazione, aprirlo** (`Artifact` `action: "open"`, o Claude in Chrome): è la regola di
  tutti gli artifact delle skill blueprint.
- **È un documento interno** — mostra ruoli, agent task, tempi e variabili. Non si condivide con il
  cliente senza che l'utente lo decida: se serve al cliente, la forma giusta è il disegno semplice della
  guida (`xrcopilotlab-blueprint-guide`), non il BPMN con i nomi delle variabili.

## 7. Chiudere

Riportare all'utente, in poche righe: **il link**, **che versione e da che ambiente** è stato disegnato,
quanti flussi (processi e orchestratori), e ciò che il disegno ha rivelato che merita attenzione — un
processo che nessuno avvia, tempi non dichiarati, un ciclo, un bivio senza condizione, una corsia senza
ruolo, un passo senza uscita. Non ripetere il contenuto dei diagrammi. Dire anche se le **spiegazioni in
parole semplici** sono state scritte da te o mancano, e che il PDF si esporta dai pulsanti in alto a destra.

Se l'utente modifica il manifest, la regola è la stessa: si rifà il giro (§1-§6) e si ripubblica allo
stesso `url`. Il diagramma non si aggiorna da solo.

## Cosa non fare

- Non pubblicare il manifest intero nella pagina: system message, email e id del tenant restano fuori
  (§2). Se `estrai-blocchi.sh` non si può usare, estrarre a mano con lo stesso criterio.
- Non disegnare a mano un diagramma diverso da quello che la pagina produce, né aggiungere passi che il
  manifest non ha per «completare» il flusso.
- Non modificare il manifest, e non applicarlo, per far venire meglio il disegno.
- Non scegliere in silenzio la versione o l'ambiente: un blueprint ha spesso versioni diverse in ambienti
  diversi (§1).
- Non condividere l'artifact col cliente senza un sì dell'utente: è la mappa tecnica, non la guida.
- Non scrivere nelle spiegazioni tempi, orari o passi che il manifest non dichiara: la pagina mostra i numeri veri, e una sintesi che dice altro li smentisce davanti al cliente.
- Non offrire un pulsante «Stampa» o un link di download a mano: le pagine pubblicate non li eseguono. Il PDF passa dalla capacità `downloads`, e solo da lì.
- Non usare questa skill per collaudare, né per dire se un processo «funziona»: il disegno mostra come è
  scritto, non come gira. Per quello, `xrcopilotlab-blueprint-test`.
