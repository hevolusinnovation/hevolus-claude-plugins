---
name: xrcopilotlab-blueprint-storyboard
description: Scrive lo storyboard di un video breve (default 80 s) da un blueprint XRCopilotLab (manifest) o da un dossier di assessment - tavole da 6 riquadri con numero di scena, titolo, tempi, battuta della voce, descrizione visiva, scritte «a schermo», camera e schizzo a mano libera, con il codice colore viola = AI e azzurro = decisione umana. Mostra sempre la parte basilare della piattaforma (un profilo di knowledge assegnato a un assistente; un assistente creato con le sue skill) e racconta il processo del manifest. Scrive anche la narrazione e genera la voce neurale della piattaforma (`xrcopilotlab-bp voice`, senza chiavi Azure) per verificare i tempi. Pubblicato come artifact con la sorgente Markdown e l'audio. Usa quando l'utente chiede "lo storyboard", "il video del blueprint", "le tavole del video", "la voce fuori campo", "storyboard del manifest". NON per la guida del cliente (xrcopilotlab-blueprint-guide), il collaudo (xrcopilotlab-blueprint-test) o il manifest (xrcopilotlab-blueprint).
---

# xrcopilotlab-blueprint-storyboard

Porta un blueprint da «esiste, e sappiamo come funziona» a «lo si può raccontare in un video di
80 secondi». Il prodotto è lo **storyboard**: le tavole che un'agenzia, un illustratore o un
generatore di video prendono per realizzare il video, con la **voce** già scritta e un audio di
prova per misurarne i tempi.

È la **terza uscita della famiglia `blueprint-demo`**: il brief dice *che cosa si vende*, lo
storyboard dice *come lo si racconta in video*. Ne eredita fonti, riservatezza e stato provato
([`../xrcopilotlab-blueprint-demo/references/`](../xrcopilotlab-blueprint-demo/references/)); la
skill `xrcopilotlab-blueprint-demo` la propone come ultimo passo, dopo il brief.

**Sola lettura sul tenant**: legge il manifest (file, oppure `xrcopilotlab-bp pull --tag <TAG>`),
non applica niente, non lancia test, non scrive nel repository.

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

## 5-bis. Il video: l'animatic

Lo storyboard da solo non si «guarda»: dai fotogrammi e dalla voce si monta un **animatic**, un video
vero (MP4, 1280×720) in cui ogni scena resta a schermo per i suoi secondi, con lo schizzo, il titolo
e la battuta come sottotitolo, e sotto la traccia guida. Pesa circa 1 MB per 80 secondi. Procedura in
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
- Non assumere l'ambiente: se l'utente non lo dice, lo si chiede (staging predefinito).
- Non chiedere all'utente chiavi o ruoli Azure per la voce: c'è `xrcopilotlab-bp voice`.
- Non pubblicare audio o tavole in un repository: contengono lo scenario di un cliente.
- Non lasciare le scene della parte basilare fuori «per brevità»: sono il motivo per cui questa
  skill esiste.
