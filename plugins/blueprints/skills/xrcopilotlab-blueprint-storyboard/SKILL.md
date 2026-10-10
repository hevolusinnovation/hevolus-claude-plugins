---
name: xrcopilotlab-blueprint-storyboard
description: Da un blueprint XRCopilotLab (manifest) produce, di default, TRE VIDEO NARRATI dell'applicazione vera (staging o prod): come si crea da zero (topic, conoscenza, assistenti, orchestratore, processo BPM disegnato a mano), come si usa il risultato già creato, e il processo in funzione ruolo per ruolo con un'istanza vera. Voce neurale italiana della piattaforma (`xrcopilotlab-bp voice`, senza chiavi Azure), senza sottotitoli, pagina con download e tempo di creazione. Poi crea nel tenant del manifest un agente video con i video generati (topic Guide; saltabile solo se non consegnabili). Su richiesta scrive lo storyboard a tavole. Chiede ambiente e sì prima di registrare: la creazione e il video 3 scrivono sul tenant. Usa per "il video del blueprint", "il video di come si crea", "lo storyboard", "la voce fuori campo". NON per la guida del cliente (xrcopilotlab-blueprint-guide), il collaudo (-blueprint-test) o il manifest (xrcopilotlab-blueprint).
---

# xrcopilotlab-blueprint-storyboard

Porta un blueprint da «esiste, e sappiamo come funziona» a «lo si può guardare in un video». Il prodotto
di default sono **tre video narrati dell'applicazione vera**: come si crea da zero, come si usa, il processo in funzione ruolo per ruolo ([§5-ter](#5-ter-i-tre-video-narrati-prodotto-di-default));
poi la **guida video interrogabile** nel tenant, con un **agente video** che usa i video generati ([§5-quater](#5-quater-la-guida-video-nel-tenant-lagente-video)); su richiesta lo **storyboard** di un video di 80 secondi:  le tavole che un'agenzia, un illustratore o un
generatore di video prendono per realizzare il video, con la **voce** già scritta e un audio di
prova per misurarne i tempi.

È la **terza uscita della famiglia `blueprint-demo`**: il brief dice *che cosa si vende*, lo
storyboard dice *come lo si racconta in video*. Ne eredita fonti, riservatezza e stato provato
([`../xrcopilotlab-blueprint-demo/references/`](../xrcopilotlab-blueprint-demo/references/)); la
skill `xrcopilotlab-blueprint-demo` la propone come ultimo passo, dopo il brief.

**Storyboard e tour del risultato: sola lettura sul tenant** (legge il manifest da file o con
`xrcopilotlab-bp pull --tag <TAG>`, non applica niente, non lancia test, non scrive nel repository).
**La creazione registrata nel video scrive entità di prova sul tenant**: parte solo dopo il sì dell'utente,
su ambiente e company dichiarati, e le entità si cancellano solo con un altro sì.

| Chi | Fa | Non fa |
|---|---|---|
| **Questa skill** | tavole, battute, tempi, schizzi, voce guida di prova, artifact | il video, la musica, la voce finale, i loghi |
| `xrcopilotlab-blueprint-demo` | il brief degli scenari vendibili | lo storyboard |
| `xrcopilotlab-blueprint-guide` | guida e deck per un cliente | il video |
| L'utente | sceglie la fonte, approva il copione, decide se un cliente può comparire | — |

Input: `$ARGS` — un tag o un manifest, un dossier, la durata, il tono; oppure niente.

## Riferimenti

| Passo | Documento |
|---|---|
| Le scene che non possono mancare (knowledge → assistente, assistente + skill) e come si ricavano dal manifest | [`references/base-piattaforma.md`](references/base-piattaforma.md) |
| Animare gli schizzi delle scene `Dn` (clip con voce) | [`references/animazione.md`](references/animazione.md) |
| **Il video narrato di default**: creazione + risultato, voce, montaggio, pagina con download | [`references/video-narrato.md`](references/video-narrato.md) |
| **Terzo video: il processo in funzione, ruolo per ruolo** (istanza vera, un utente per ruolo, piano e sì) | [`references/processo-in-funzione.md`](references/processo-in-funzione.md) |
| **La guida video nel tenant**: topic `BP-<TAG>-Guide` creato dal manifest, video indicizzati, un agente video per manifest che risponde citando il video | [`references/guida-video.md`](references/guida-video.md) |
| Registrare l'applicazione vera (`xrcopilotlab-demo`): panoramica, scene `Dn`, montaggio | [`references/registrazione.md`](references/registrazione.md) |
| Partire dalla guida del cliente: da slide a scena, punti di demo `Dn` | [`references/da-guida.md`](references/da-guida.md) |
| Formato di una tavola, codici scena, tempi, colori | [`references/tavola.md`](references/tavola.md) |
| Scrivere la voce, misurarla, generare l'audio di prova | [`references/narrazione.md`](references/narrazione.md) |
| Disegnare gli schizzi in SVG e scrivere la descrizione di disegno | [`references/schizzi.md`](references/schizzi.md) |
| Modello della pagina | [`references/storyboard-template.html`](references/storyboard-template.html) |
| Fonti, riservatezza, stato provato (della skill gemella) | [`../xrcopilotlab-blueprint-demo/references/fonti.md`](../xrcopilotlab-blueprint-demo/references/fonti.md), [`riservatezza.md`](../xrcopilotlab-blueprint-demo/references/riservatezza.md), [`scenari.md`](../xrcopilotlab-blueprint-demo/references/scenari.md) |
| Vocabolario | [`../xrcopilotlab-blueprint-guide/references/linguaggio.md`](../xrcopilotlab-blueprint-guide/references/linguaggio.md), con l'eccezione qui sotto |

## 0. Se `$ARGS` è vuoto

Orientare e fermarsi: a che cosa serve lo storyboard, le fonti (manifest nell'archivio del tenant di
collaudo, dossier in `../hevolus-assessment/customers/*/`), e le domande del §1. Poi aspettare.

## 1. Il brief dello storyboard

Si chiede, **tutto in una volta**, e si attende la risposta:

1. la **fonte**: tag o file del manifest, eventualmente il dossier, e **l'ambiente** su cui vive il
   blueprint (`staging` o `prod`). **L'ambiente non si dà per scontato**: se l'utente nomina uno
   scenario («Studio Polis») senza dire l'ambiente, **si chiede**, come fa
   [`xrcopilotlab-blueprint`](../xrcopilotlab-blueprint/SKILL.md) — prima si esegue
   `xrcopilotlab-bp environments` per sapere dove l'utenza può lavorare davvero, poi si propone
   **staging come predefinito** e si attende la risposta. L'ambiente scelto vale per tutto: il `pull`
   del manifest (`--env`), la voce (`voice --env`) e, per il video con lo schermo reale, il
   `target_env` del recorder. Se il manifest dichiara un ambiente o un tenant diverso da quello
   scelto, lo si dice e ci si ferma. In produzione si lavora solo sui tenant a cui l'utente appartiene;
2. la **durata** (80 s se non detto). **La lingua è l'italiano, per ora la sola**: tavole, battute,
   scritte «a schermo» e voce guida (`say -v Alice`) sono in italiano, e non si chiede. Se l'utente
   porta un'altra lingua, si dice che per ora non è prevista e si prosegue in italiano;
3. **per chi è**: l'agenzia o il mercato (cliente anonimo, regola di default) oppure un cliente
   specifico che ha **autorizzato** di comparire (lo conferma l'utente, non si deduce);
4. il **tono** (sereno, incalzante) e se c'è una **frase chiave** da far arrivare in fondo;
5. se vuole la **voce guida** di prova (audio).

Nessun marchio o logo a piè di tavola: se l'utente ne vuole uno nel video, lo aggiunge il montaggio.

## 1-bis. Quale manifest è l'ultimo: si controlla sempre l'archivio

**Mai dedurre dallo stato di un solo ambiente, da una copia locale o da quella già letta in sessione.** Lo
stesso tag vive in archivi diversi (`blueprints/<companyId>/<blueprintId>/` nel Blob, indice in Cosmos): uno
per ogni ambiente **e per ogni tenant** su cui è stato pubblicato, e le versioni divergono. Caso reale
(08/10/2026): `STUDIOPOLIS` era alla v37 su staging, ma la v40 stava sul tenant «STUDIO POLIS» in
**produzione**, con persone vere nei ruoli e le caselle del cliente: leggere la v37 ha portato a dire cose
sbagliate su utenti e caselle.

Prima di usare un manifest per qualunque cosa (copione, ruoli, utenti, caselle, piano di registrazione):

1. `xrcopilotlab-bp environments`, poi per **ogni ambiente accessibile** `xrcopilotlab-bp status --env <e>`:
   elenca i tenant. Per ciascun tenant `status --env <e> --company <id>` mostra versioni, date e le
   esecuzioni (quale versione è stata **applicata** e quando).
2. Si sceglie la versione più alta **e** si dice all'utente dove sta (ambiente, tenant, versione, data di
   apply). Se staging e produzione divergono, lo si dice: l'utente decide quale raccontare.
3. `pull --tag <TAG> --env <e> --company <id> [--version <n>]` per leggerla; mai un file locale.
4. Ciò che dipende dall'ambiente si legge da **quella** versione: i membri dei ruoli (`businessRoles[].members`),
   le caselle (`mailbox` dei server MCP), gli indirizzi (`grep` dei `@`). **Un ruolo con persone vere e caselle
   vere significa produzione con effetti veri**: niente registrazione che scrive, niente istanze, senza il sì
   esplicito dell'utente su quel tenant.

## 2. Leggere la fonte e ricavare la storia

**La storia è quella della guida per il cliente** ([`da-guida.md`](references/da-guida.md)): si legge
l'artifact «<Scenario> — guida» e ogni slide `giornata-*`, `flusso`, `ruoli` diventa una scena, con
gli stessi titoli-messaggio e la stessa ora. Solo se la guida non esiste si ricava dal manifest, con
la stessa struttura, e lo si dichiara.

Come in [`fonti.md`](../xrcopilotlab-blueprint-demo/references/fonti.md). Dal manifest si ricava:

- il **processo principale** e chi fa ogni passo (assistente o persona), dove la persona decide;
- gli **assistenti**, con le loro skill e i profili di knowledge che interrogano;
- i **collegamenti** (posta, calendario, registri), i **compiti pianificati**, gli **orchestratori**.

I numeri («quattordici assistenti») si contano dal manifest, non a memoria. Un fatto che il manifest
non dice non entra nella voce.

## 3. Il copione: scene e tempi

La struttura, in quest'ordine:

1. **Il problema** (apertura): una scena che fa sentire il costo di non avere il processo.
2. **La parte basilare, sempre** — [`references/base-piattaforma.md`](references/base-piattaforma.md):
   **come si dà la conoscenza a un assistente** (documenti → profilo → assistente) e **come nasce un
   assistente con le sue skill**. Sono scene obbligatorie, almeno 4 riquadri e circa un quarto della
   durata: senza, il video racconta un risultato senza mostrare che cosa lo produce.
3. **Il processo**: il flusso del manifest, un riquadro per momento, con persone e AI distinte per
   colore.
4. **Le decisioni umane**: dove la persona conferma, con la luce azzurra.
5. **L'esito e la frase chiave**, poi la chiusura.

Ogni sezione del manifest deve avere **almeno un riquadro o un motivo dichiarato** per non
averlo: si tiene una tabella di copertura (§ «Copertura» di `base-piattaforma.md`), che va nella
sezione interna dell'artifact e non nel video.

I tempi: la somma delle durate è **esattamente** la durata richiesta; le scene durano 2–8 s; ogni
battuta rispetta il budget di parole di [`narrazione.md`](references/narrazione.md).

**Si mostra il copione all'utente** — tabella scena · titolo · secondi · battuta, non le tavole — e
si attende un sì: è più economico correggere una riga che ridisegnare sei schizzi.

## 4. Le tavole

Per ogni scena: tutti i campi di [`tavola.md`](references/tavola.md), lo schizzo SVG o, dove non
basta, la descrizione di disegno ([`schizzi.md`](references/schizzi.md)).

**Il linguaggio.** Vale quello della guida per il cliente, con **una eccezione voluta**: nelle scene
della parte basilare compaiono le parole **assistente/agente**, **knowledge** e **skill**, perché
sono ciò che il video insegna. Ognuna si introduce **una volta**, con la sua spiegazione in una
frase («una skill: una capacità in più, come leggere una PEC»), e poi si usa. Restano vietati
manifest, YAML, id, tag, prompt, token, endpoint, nomi di step, versioni.

## 5. La voce

Si scrive la battuta di ogni scena e si genera la voce **neurale della piattaforma** con la CLI:

```bash
xrcopilotlab-bp voice say --lines righe.json --out-dir audio --env <ambiente>
```

(`righe.json` è un elenco `[{"name":"scena-1","text":"…"}]`; l'ambiente è quello scelto al §1.) Usa
l'endpoint `common/speech` con l'accesso che ogni utente della CLI ha già: **nessuna chiave Azure,
nessun ruolo da chiedere**, quindi funziona per chiunque in Hevolus abbia il plugin, non solo per il
team AI. La voce di default è quella che la piattaforma ha scelto per l'italiano; `voice list` mostra
le altre (esistono anche voci HD più naturali), e se l'utente ne vuole una si passa `--voice`.

Se la CLI non ha `voice` (plugin più vecchio) si ripiega sulla voce di sistema (`say`, solo macOS) e
lo si dice: suona molto più artificiale, vedi [`narrazione.md`](references/narrazione.md). Il testo
della narrazione va all'endpoint della piattaforma: lo scenario resta anonimo come in tutto lo
storyboard.

Una voce neurale parla **più lenta** della voce di sistema (circa 1,5 parole al secondo): si misura
ogni battuta e, se è più lunga della scena, **si accorcia il testo** o si ridistribuiscono i secondi
fra scene, mai si accelera la voce. È l'unica voce di questa skill; per un video da consegnare si può
comunque registrare una voce umana dal «Copione della voce».

## 5-ter. I tre video narrati (prodotto di default)

Il prodotto sono **tre video reali** della piattaforma, separati, con voce e senza sottotitoli:
1. **Come si crea il blueprint da zero**, passo passo (topic, conoscenza, assistenti, orchestratore,
   processo disegnato a mano);
2. **Come si usa**: il risultato già creato, usato da chi ci lavora ogni giorno (assistenti, knowledge);
3. **Il processo in funzione, ruolo per ruolo** ([§5-quater-bis](#5-quater-bis-il-processo-in-funzione-ruolo-per-ruolo-il-terzo-video)).

Chiusi i video, il prodotto **non è finito**: c'è il quarto passo, l'**agente video nel tenant del manifest**
([§5-quater](#5-quater-la-guida-video-nel-tenant-lagente-video)).

Si fanno in quest'ordine; il 3 scrive istanze sul tenant e ha il suo piano e il suo sì. Si chiede quali
fare (di default tutti e tre, ciascuno quando le sue condizioni ci sono) e si pubblica una pagina con un
`<video>` per ciascuno, il pulsante di download e il **tempo di creazione**. Procedura in
[`references/video-narrato.md`](references/video-narrato.md); montaggio con `compose-video.py`, un file
per video. Gli schizzi e l'animatic qui sotto restano solo per chi li chiede.

## 5-quater-bis. Il processo in funzione, ruolo per ruolo (il terzo video)

Il terzo video non spiega niente di nuovo sulla costruzione: mostra **un caso che gira davvero**,
dall'arrivo alla chiusura, visto da **ogni ruolo** con la sua istanza, così che il cliente si riconosca.
Si fa per ultimo, dopo il sì sul piano: **avvia un'istanza e fa lavorare gli agenti**
sul tenant. Un utente di prova per ruolo, effetti esterni spenti, caso anonimo. Procedura, controlli e
ciò che manca al banco in [`references/processo-in-funzione.md`](references/processo-in-funzione.md).

## 5-quater. La guida video nel tenant: l'agente video

**Parte del prodotto, non un extra.** Dopo i video la skill crea, **nel tenant del manifest**, un topic
`BP-<TAG>-Guide`, un profilo di knowledge che indicizza gli `.mp4` generati e **un agente video per manifest**
(«Agente video - <Scenario>») che risponde citando il video che spiega. Si aggiunge al manifest come
versione nuova; procedura e frammento in [`references/guida-video.md`](references/guida-video.md).

- **Piano e sì**: scrive sul tenant, quindi si mostra il piano (topic, profilo con N file, agente) e si
  attende il sì prima dell'apply. Il sì sul piano dei video non vale per questo.
- **Si salta solo se i video non sono consegnabili** (nelle liste compaiono nomi di altri clienti o
  dell'utente): lo si **dichiara** nel riepilogo finale con il motivo, e si propone di registrare di nuovo
  su un tenant pulito. Mai saltarlo in silenzio.
- **Licenza**: profilo e agente consumano licenza; se il piano si ferma con `BP071` lo si riferisce,
  non si procede e non si dichiara il lavoro finito.
- **Si chiude solo dopo la prova**: indicizzazione terminata, una domanda per video con risposta nel video
  e una fuori argomento che risponde «non c'è». La consegna riporta nome dell'agente, topic e versione
  del manifest.

## 5-bis. Il video: l'animatic (solo su richiesta)

Lo storyboard da solo non si «guarda»: dai fotogrammi e dalla voce si monta un **animatic**, un video
vero (MP4, 1280×720) in cui ogni scena resta a schermo per i suoi secondi, con lo schizzo a tutto fotogramma e, sotto, la traccia guida. **Nessun sottotitolo**, né nei video
animati né in quelli registrati. Pesa circa 1 MB per 80 secondi. Le scene con un punto di demo `Dn` che il recorder non sa registrare si **animano**
([`references/animazione.md`](references/animazione.md)): un clip per scena, con la sua battuta. Procedura in
[`narrazione.md`](references/narrazione.md) § «L'animatic». Si incorpora in cima all'artifact con
`<video controls>` e si pubblica come file di supporto (`animatic.mp4`).

L'animatic è un **video di lavoro** — schizzi e voce — non il video finale. Il video con lo schermo
reale dell'applicazione si registra con **`xrcopilotlab-demo`**, il banco di registrazione in forma di comando
(come `xrcopilotlab-bp`: il lanciatore sta nel plugin `blueprints` e scarica il pacchetto al primo uso).
Questa skill **assorbe** `xrcopilotlab-demo-video`: la panoramica di un blueprint applicato è
`xrcopilotlab-demo tour`, le scene `Dn` sono `xrcopilotlab-demo record`. Tutto in
[`references/registrazione.md`](references/registrazione.md): prerequisiti (`doctor`), formato del brief e
del piano, uscita (`video.mp4`, `scene-timings.json`, un clip per scena) e montaggio.

Regole che non si derogano: l'**ambiente** è quello scelto al §1 e si passa sempre con `--env`; la
registrazione apre conversazioni e istanze sul tenant, quindi si **chiede il sì** prima di lanciarla; le
credenziali dell'account demo non passano mai dalla skill; una scena senza selettori verificati resta
uno schizzo e lo si dichiara.

## 6. Controlli bloccanti prima di pubblicare

1. **Tempi**: somma delle scene = durata; nessuna battuta oltre la sua scena (durata dell'audio
   misurata, non stimata, se c'è).
2. **Riservatezza**: l'elenco di [`riservatezza.md`](../xrcopilotlab-blueprint-demo/references/riservatezza.md)
   sulle tavole, sulle battute **e sulle scritte negli schizzi** (un calendario con un nome vero è un
   nome vero). Cerca nel file i nomi propri della fonte.
3. **Linguaggio**: nessuna parola vietata fuori dall'eccezione del §4.
4. **Promesse**: nessuna scena fa decidere l'AI al posto di una persona, nessun numero non misurato.
5. **Copertura**: ogni sezione del manifest ha il suo riquadro o il suo «non rappresentata, perché».

Se uno fallisce si corregge e si ripete: non si pubblica «con riserva».

## 7. Pubblicare

1. Caricare **`artifact-design`**. Prima di pubblicare `/status`: organizzazione **Hevolus**.
2. Partire da [`references/storyboard-template.html`](references/storyboard-template.html). Titolo
   `<title>` e `<h1>`: «<Scenario> — storyboard» (senza il prefisso `DEMO-`, che è del brief).
3. Cartella di lavoro della sessione (o `../hevolus-assessment/marketing/` se l'utente la indica).
   **Stesso percorso a ogni versione**: il link dato non cambia.
4. `files`: `storyboard.md` (la sorgente, con battute e descrizioni di disegno) e, se generati,
   `audio/scena-<codice>.mp3`, `audio/narrazione.mp3` e `animatic.mp4`. La pagina li incorpora con `<audio>`. Gli
   audio vanno **solo nell'artifact**, mai in un repository.
5. Privato alla nascita; aprirlo subito nel browser dell'utente, **sempre in una nuova finestra a
   tutto schermo**, mai in una scheda della finestra che sta usando: lo storyboard si guarda una
   tavola alla volta, e una finestra a parte non scompare fra le altre schede. Su macOS:
   ```bash
   open -na "Google Chrome" --args --new-window --start-fullscreen "<url dell'artifact>"
   ```
   (su Windows `chrome.exe --new-window --start-fullscreen "<url>"`). Se si lavora con Claude in
   Chrome: aprire la finestra con il comando qui sopra, oppure creare la scheda e portare la
   finestra alla dimensione dello schermo con `resize_window`; se non riesce, dirlo all'utente e
   proporgli F11/`Ctrl+Cmd+F` invece di lasciare la scheda in un angolo. Vale anche per ogni
   riapertura dopo un giro di feedback. L'agenzia esterna vede «Page not found» con un link
   privato: la condivisione la attiva l'utente, non tu.
6. Il piè di pagina riporta solo **versione · data · giro di feedback**. Una correzione dopo un
   giro di feedback incrementa la versione e **ripubblica allo stesso `url`**.

## 8. Il messaggio finale

Breve: il link, durata e numero di scene, **quali sezioni del manifest non sono rappresentate e
perché**, se l'audio è di servizio, e che cosa serve decidere (un cliente nominato? una scena
troppo densa?). Se esiste il brief di `blueprint-demo` per lo stesso scenario, dire che lo storyboard
ne usa gli stessi stati e limiti.

## Cosa non fare

- Non scrivere la voce senza misurarla contro i secondi della scena.
- Non nominare un cliente, una persona o un'azienda terza senza l'autorizzazione dell'utente
  per quel video; di default lo scenario è anonimo.
- Non aggiungere marchi, loghi o fasce a piè di tavola.
- Non mostrare nel video ciò che il manifest non fa: una scena su una funzione non provata si
  toglie, non si abbellisce.
- Non generare musica. La voce neurale della piattaforma è una voce guida: per un video da consegnare
  si registra una voce umana dal «Copione della voce».
- Non assumere l'ambiente: se l'utente non lo dice, lo si chiede (staging predefinito). E non assumere che
  la versione letta sia l'ultima: si controlla l'archivio di ogni ambiente e tenant (§1-bis).
- Non chiedere all'utente chiavi o ruoli Azure per la voce: c'è `xrcopilotlab-bp voice`.
- Non pubblicare audio o tavole in un repository: contengono lo scenario di un cliente.
- Non avviare un'istanza per il terzo video senza il sì sul piano, né con dati veri o effetti esterni accesi.
- Non consegnare i video senza l'agente video nel tenant del manifest, né saltarlo senza dirlo.
- Non caricare i video nel tenant di un cliente senza la conferma che siano consegnabili, né
  applicare la guida video senza il sì sul piano.
- Non lasciare le scene della parte basilare fuori «per brevità»: sono il motivo per cui questa
  skill esiste.
