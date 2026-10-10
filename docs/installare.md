# Installare

Questa pagina è per chi deve **usare** gli strumenti, non per chi li sviluppa. Non serve saper
programmare, non serve clonare niente e non serve scrivere comandi in un terminale.

Un'eccezione sola, e conviene saperla adesso: il **primo accesso ad Azure** — una volta sola, su
quella macchina — va fatto da un terminale vero, e Claude non può farlo al posto tuo. Il perché e
come si fa: [§ L'accesso ad Azure](accesso-azure.md). Riguarda solo i blueprint; l'assessment no.
Per la delivery Atlas c'è in più uno script da lanciare una volta, che collega il CMS a Claude:
[§ Il server MCP «atlas»](#il-server-mcp-atlas--per-la-delivery-atlas).

> C'è anche in forma di **pagina da aprire**, con i comandi da copiare con un clic e la richiesta
> dei ruoli Azure già scritta: [`sito/index.html`](../sito/index.html). È la forma da girare a un
> collega che non ha questo repository — si apre con un doppio clic, non ha bisogno di niente.

## Un'app sola, due schede

Sia l'assessment sia i blueprint si usano dall'**app Claude** installata sul computer, senza mai
aprire un terminale e senza clonare nessun repository. L'app ha due schede, e la differenza fra
loro è tutto ciò che serve capire:

| Scheda | Cos'è | Cosa ci gira |
|---|---|---|
| **Chat** | la conversazione: ci si caricano documenti | il plugin *assessment* |
| **Code** | la stessa app, ma qui Claude può **eseguire comandi** sul tuo computer | il plugin *blueprints* |

«Claude Code» in queste pagine vuol dire quella scheda. Chi sviluppa la usa da terminale, ma non è
obbligatorio e per te non cambia niente: si installa l'app e si clicca **Code**.

- **macOS** — [installer universale (.dmg)](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect)
- **Windows** — [installer x64](https://claude.ai/api/desktop/win32/x64/setup/latest/redirect) ·
  [installer ARM64](https://claude.ai/api/desktop/win32/arm64/setup/latest/redirect)

Installa, accedi, e la scheda **Code** è lì in alto.

## Qual è il tuo caso

| Quello che devi fare | Dove | Vai a |
|---|---|---|
| Ho la proposta di un cliente e devo capire come si realizza su XRCopilotLab | app Claude, scheda **Chat**, plugin *assessment* | [§ Claude Desktop](#claude-desktop--il-plugin-assessment) |
| Devo configurare l'ambiente di un cliente, o collaudarne uno già configurato | app Claude, scheda **Code**, plugin *blueprints* | [§ Claude Code](#claude-code--il-plugin-blueprints) |
| Devo aprire la delivery Atlas di un cliente nel CMS | lo script `setup-atlas-mcp`, una volta per postazione | [§ Il server MCP «atlas»](#il-server-mcp-atlas--per-la-delivery-atlas) |
| Voglio una di queste skill sull'altra app, o senza plugin | una **skill** singola, su Desktop o su Code | [§ Una skill da sola](#una-skill-da-sola-su-desktop-o-su-code) |

Le prime due righe sono la strada **consigliata**, non l'unica: sono i due plugin, e ogni
plugin è confezionato per una superficie sola. Le **skill** che i plugin contengono si installano
invece su **Claude Desktop oppure Claude Code**, quella che usi — cambia cosa puoi farci.

## Le cinque skill, e su quale app si installano

| Skill | Su **Claude Desktop** | Su **Claude Code** |
|---|---|---|
| `xrcopilotlab-assessment` | il plugin `Xrcopilotlab-….zip` — **la strada consigliata** | la skill da sola, scompattata fra le proprie ([§ Una skill da sola](#una-skill-da-sola-su-desktop-o-su-code)) |
| `xrcopilotlab-delivery-atlas` | il plugin `Xrcopilotlab-….zip`, con il server MCP «atlas» configurato dallo script ([§ Il server MCP «atlas»](#il-server-mcp-atlas--per-la-delivery-atlas)) — **la strada consigliata** | la skill da sola, con il server registrato dallo stesso script |
| `xrcopilotlab-blueprint` | la skill da sola: scrive e spiega un manifest, **non lo applica** | il plugin `blueprints@hevolus` — **la strada consigliata** |
| `xrcopilotlab-blueprint-test` | la skill da sola: prepara le domande di collaudo, **non le esegue** | il plugin `blueprints@hevolus` — **la strada consigliata** |
| `xrcopilotlab-blueprint-guide` | la skill da sola: scrive la guida per il cliente a story slides e la pagina web — **funziona anche qui**, perché non esegue comandi | il plugin `blueprints@hevolus` |
| `xrcopilotlab-blueprint-demo` | la skill da sola: scrive il brief per l'agenzia e lo pubblica — **funziona anche qui**, ma senza il PDF, che vuole un terminale | il plugin `blueprints@hevolus` |
| `xrcopilotlab-blueprint-storyboard` | la skill da sola: scrive lo storyboard e lo pubblica — **funziona anche qui**, ma senza l'audio guida, che vuole un terminale con `say` e `ffmpeg` | il plugin `blueprints@hevolus` |
| `xrcopilotlab-blueprint-bpm-flow` | la skill da sola: disegna i flussi di un manifest e li pubblica come artifact — **funziona anche qui**; il PDF si esporta dalla pagina aperta in claude.ai | il plugin `blueprints` |
| `xrcopilotlab-blueprints-report` | la skill da sola: legge il catalogo e pubblica il manuale dei modelli — **funziona anche qui** per la lettura e la scrittura; il PDF si esporta dalla pagina aperta in claude.ai; installare i modelli e collaudarli vuole la scheda Code | il plugin `blueprints@hevolus` |
| `xrcopilotlab-blueprint-version` | la skill da sola: scrive la mail delle novità fra due versioni — **funziona anche qui**, ma `novita.sh` vuole un terminale con `git` e `gh`: da Desktop si incollano le novità a mano | il plugin `blueprints@hevolus` |
| `xrcopilotlab-blueprint-howto` | la skill da sola: pubblica la guida d'uso del percorso — **funziona anche qui** | il plugin `blueprints@hevolus` |

Una regola sola governa tutta la tabella, e non è una preferenza: **applicare e collaudare passano
da `xrcopilotlab-bp`**, cioè da un comando, e i comandi girano solo nella scheda **Code**. Nella
Chat non è questione di permessi: non c'è proprio niente che possa eseguirli. Tutto il resto — fare
l'assessment, scrivere un manifest, preparare una suite di collaudo, capire un errore — funziona di
qua e di là.

Da notare, perché è la cosa che si teme di più e non c'è: **la CLI non la installi tu**. Il plugin
*blueprints* se la scarica da solo al primo uso, dentro l'app, e ne verifica l'impronta. Niente
terminale, niente .NET, niente clone del repository di prodotto.

Perché i due plugin sono confezionati uno per superficie:
[§ Claude Code o Claude Desktop](code-o-desktop.md).

## Claude Desktop — il plugin *assessment*

### 1. Scarica il pacchetto

Apri la pagina dei pacchetti pronti:

**https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/latest**

Sotto **Assets**, scarica il file che comincia per `Xrcopilotlab-` e finisce per `.zip` — per
esempio `Xrcopilotlab-0.2.0.zip`.

> **Non aprire lo zip e non estrarlo.** Va caricato così com'è: se lo estrai e ricomprimi, il
> pacchetto cambia forma e il caricamento fallisce.

### 2. Caricalo

1. vai su **[claude.ai/customize/plugins](https://claude.ai/customize/plugins)**;
2. scegli **Carica plugin** e seleziona lo zip appena scaricato;
3. controlla l'anteprima — deve dire **XRCopilotLab Assessment** — e conferma.

### 3. Usalo

Apri una chat su Claude Desktop, **carica la proposta** (PDF o Word) e scrivi una frase qualsiasi
fra queste:

- «fammi l'assessment di questa proposta»
- «come la implementiamo su XRCopilotLab?»
- «è fattibile la parte sui documenti del cliente?»

Non serve nominare la skill: si attiva da sola. Cosa portare in chat, cosa produce e in che ordine
lavora: **[il manuale](../plugins/assessment/docs/manuale.md)**.

### Quando esce una versione nuova

Torna alla pagina delle release, scarica lo zip nuovo e ricaricalo allo stesso modo: sostituisce il
precedente. Non ci sono aggiornamenti automatici, quindi se qualcuno ti dice «è cambiato», il modo
di prenderlo è questo.

### Se qualcosa non va

| Cosa vedi | Cosa è successo |
|---|---|
| La pagina delle release dà **404** | Il repository è privato: ti serve l'accesso. Chiedi a chi mantiene il catalogo di aggiungerti all'organizzazione `hevolusinnovation` su GitHub — oppure di mandarti direttamente lo zip |
| **«All files must be inside the top-level folder»** | Hai caricato il pacchetto sbagliato nel posto sbagliato: quello che comincia per `Xrcopilotlab-` va su *Carica plugin*, i file `xrcopilotlab-*.zip` vanno nella libreria delle **skill**. Vedi [§ Una skill da sola](#una-skill-da-sola-su-desktop-o-su-code) |
| Il plugin c'è ma la skill non si attiva | Carica il documento **prima** di chiedere, e dì cosa vuoi («fai l'assessment»). Se serve, nominala: «usa la skill xrcopilotlab-assessment su questo documento» |
| Hai estratto lo zip e ora non si carica | Riscarica il file originale dalla pagina delle release e caricalo senza aprirlo |

## Il server MCP «atlas» — per la delivery Atlas

La skill `xrcopilotlab-delivery-atlas` scrive nel CMS [delivery.hevolus.it](https://delivery.hevolus.it)
attraverso il server MCP «atlas». Senza, arriva fino all'anteprima delle scritture e si ferma. Il
server si configura **una volta per postazione**, con uno script che fa tutto da solo: sta in
[`mcp/atlas/`](../mcp/atlas/) di questo repository, in due versioni equivalenti.

Prima serve il **token Atlas**: è personale, lo chiedi a chi amministra il CMS. Non va scritto in
una chat, in un documento né in un repository — lo script lo chiede e non lo mostra.

**macOS / Linux**

```bash
chmod +x setup-atlas-mcp.sh
./setup-atlas-mcp.sh
```

**Windows**

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-atlas-mcp.ps1
```

Cosa fa, in ordine:

1. controlla che ci siano Claude Code e Node.js (a Claude Desktop serve `npx mcp-remote`);
2. chiede il token e verifica che il server lo accetti;
3. registra `atlas` in **Claude Code** a livello utente, sostituendo una registrazione precedente;
4. aggiunge `atlas` alla configurazione di **Claude Desktop**, dopo averne fatto una copia di
   sicurezza e senza toccare gli altri server;
5. se trova un `SKILL.md` accanto allo script, installa la skill `atlas` dell'orchestratore in
   `~/.claude/skills/atlas/` — è quella per la gestione quotidiana della delivery.

Poi: in Claude Code apri una sessione nuova e digita `/mcp` — `atlas` deve risultare connesso; in
Claude Desktop chiudi l'app del tutto, riaprila e prova con «elenca i clienti».

| Opzione (bash / PowerShell) | A cosa serve |
|---|---|
| `--solo-code` / `-SoloCode` | configura solo Claude Code |
| `--solo-desktop` / `-SoloDesktop` | configura solo Claude Desktop |
| `--skill <file>` / `-Skill <file>` | installa la skill `atlas` da un `SKILL.md` che sta altrove |
| `--desktop-config <file>` / `-DesktopConfig <file>` | il file di configurazione di Claude Desktop, se non è nel posto solito |
| `--url <url>` / `-Url <url>` | un server diverso da quello di produzione |
| `--no-test` / `-NoTest` | salta la verifica del token |

Il token si può passare anche con la variabile d'ambiente `ATLAS_TOKEN`. Resta salvato in chiaro nei
file di configurazione di Claude: su macOS e Linux lo script li rende leggibili solo dal tuo utente.

| Cosa vedi | Cosa è successo |
|---|---|
| «Il server ha rifiutato il token (HTTP 401/403)» | Il token è sbagliato o scaduto: fattene dare uno nuovo e rilancia |
| «Server non raggiungibile» | Rete, VPN o proxy: lo script configura comunque, verifica poi con `/mcp` |
| «Node.js/npx non trovati» | Installa [Node.js LTS](https://nodejs.org) e rilancia: serve a Claude Desktop |
| Su Desktop gli strumenti non compaiono | L'app va chiusa **del tutto** (non solo la finestra) e riaperta |

## Claude Code — il plugin *blueprints*

**Non serve clonare nessun repository di prodotto**, non serve .NET e non serve compilare niente:
il plugin porta le skill e si procura da solo lo strumento a riga di comando.

### Cosa deve esserci sulla macchina

| | Perché | Come si verifica |
|---|---|---|
| **L'app Claude, scheda Code** | è lì che gira il plugin | [installer per macOS e Windows](#unapp-sola-due-schede) — poi accedi e clicca **Code** |
| **`git`** | registrare il catalogo è un clone di questo repository | chiedi a Claude, nella scheda Code: «`git --version` funziona?» |
| **I ruoli Azure** | la CLI legge App Configuration e Key Vault dell'ambiente | [§ L'accesso ad Azure](accesso-azure.md) |

> **Nessun account GitHub.** Questo catalogo è pubblico: registrarlo e scaricare la CLI, che sta
> fra gli allegati delle sue release, non richiedono né un accesso all'organizzazione né `gh`.
> L'avviatore scarica con un semplice `curl` (o `Invoke-WebRequest` su Windows) e verifica l'impronta
> SHA-256. Serve solo che il computer raggiunga `github.com`.

### Le due righe

Si scrivono **dentro l'app**, nella casella dei messaggi della scheda Code — non in un terminale.
Sono comandi di Claude, non del computer:

```
/plugin marketplace add hevolusinnovation/hevolus-claude-plugins
/plugin install blueprints@hevolus
```

La prima registra il catalogo di Hevolus e si dà una volta sola; la seconda installa il plugin. Da
lì in poi, per vedere cosa hai installato o per aggiungere altro, c'è anche la strada a pulsanti:
**+** accanto alla casella dei messaggi → **Plugins**. La registrazione del catalogo, però, passa
per forza dalla prima riga: un catalogo privato dal pannello non si aggiunge.

Nessuno zip da scaricare: il catalogo è il repository, e lo strumento a riga di comando che il
plugin usa se lo scarica da solo al primo utilizzo — una cinquantina di megabyte, una volta per
versione, con l'impronta SHA-256 verificata prima di eseguirlo.

L'avviatore sa chiedere sei binari — **macOS** (Apple Silicon e Intel), **Windows** (x64 e ARM) e
**Linux** (x64 e ARM) — ma li porta la release che li pubblica: l'ultima,
[`bp-v2.15.1`](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/tag/bp-v2.15.1),
ne ha quattro, e Windows ARM e Linux ARM arrivano con la prossima. Su quelle due macchine, per ora,
si usa il binario x64 in emulazione.

### Aggiornare

**La versione della CLI la decide il plugin**: `version.txt` dice quale usare, e skill e binario si
muovono insieme — è ciò che evita che una guida citi un comando che la tua copia non ha. Quindi si
aggiorna il plugin:

```
/plugin update blueprints@hevolus
```

Non devi controllare tu: quando esce una CLI più recente di quella richiesta, al comando successivo
compare una riga che lo dice. Il controllo gira in secondo piano e non può far fallire niente.

Dalla versione **2.19.0** del plugin c'è anche un avviso per le **skill**: all'apertura di una
sessione, se nel catalogo c'è una versione più recente del plugin, compare una riga con i due
comandi — `/plugin marketplace update hevolus` e `/plugin update blueprints@hevolus` — e l'invito a
riavviare la sessione, perché le skill si caricano all'apertura. Viene da un hook del plugin, che
legge la stessa cache della CLI. La versione installata si legge in `/plugin`.

Una copia installata **a mano** si aggiorna con `xrcopilotlab-bp update`: scarica l'ultima
versione, ne verifica l'impronta e la sostituisce (`--check` dice cosa farebbe e si ferma). Sulla
copia del plugin lo stesso comando non tocca niente e rimanda a `/plugin update`, perché lì binario
e skill vanno insieme. Uno strumento globale `dotnet tool` non è aggiornabile e va tolto con
`dotnet tool uninstall --global xrcopilotlab-bp`.

### Fuori da un clone, l'ambiente si dice sempre

Chi ha il repository di prodotto ha anche un `local.settings.json` da cui la CLI deduce dove
lavorare. Tu no: quindi ogni comando che tocca la rete vuole **`--env staging`** o
`--env prod`. Non c'è un valore predefinito, e non è una dimenticanza: scegliere per conto proprio
l'ambiente su cui si crea roba è esattamente ciò che non deve succedere. Alla skill basta dirlo a
parole («su staging»).

Poi basta chiedere, in una cartella di lavoro qualsiasi:

- «crea un blueprint per lo studio legale Polis»
- «applica `blueprints/studiopolis-agenda.yml` su staging»
- «collauda il blueprint STUDIOPOLIS»

> **Prima di provare, leggi [§ L'accesso ad Azure](accesso-azure.md).** Il plugin parla con le
> risorse Azure di Hevolus, e senza i permessi giusti si ferma al primo comando. Non è qualcosa che
> si aggira riprovando, e l'account con cui usi Claude non c'entra.

Cosa fanno le quattro skill del plugin `blueprints`, con che frasi si attivano e cosa producono:
**[§ Le skill](le-skill.md)** e **[il manuale](../plugins/blueprints/docs/manuale.md)**.

### Se qualcosa non va

| Cosa vedi | Cosa è successo |
|---|---|
| `/plugin marketplace add` non riesce | Il catalogo è pubblico, quindi non è un problema di permessi: controlla che `git` sia installato e che il computer raggiunga `github.com` (rete aziendale, proxy, VPN). Se hai un vecchio accesso configurato, prova con l'indirizzo completo: `/plugin marketplace add https://github.com/hevolusinnovation/hevolus-claude-plugins.git` |
| «non sono riuscito a scaricare …» al primo comando | Il computer non raggiunge `github.com` (rete aziendale, proxy, VPN), oppure la release non ha il binario per la tua piattaforma. Il messaggio dice quale; nel primo caso si riprova da un'altra rete, nel secondo si chiede una release aggiornata |
| «la release non contiene l'allegato …» | Stai su una versione pubblicata prima del mirror, oppure su una piattaforma senza binario. Chiedi al team una release aggiornata, o fatti passare il binario e indicalo con `XRCOPILOTLAB_BP_BIN` |
| «Non è detto su quale ambiente lavorare» | Manca `--env`: fuori da un clone non c'è un ambiente predefinito. Dillo a parole («su staging») |
| Un comando «non esiste» anche se il manuale lo cita | Sulla macchina c'è un `xrcopilotlab-bp` installato a mano, che l'avviatore preferisce alla copia del plugin — e può essere vecchio di mesi. `xrcopilotlab-bp version` dice quale sta girando e da dove; poi `dotnet tool uninstall --global xrcopilotlab-bp` |
| Errori su App Configuration o Key Vault | Mancano i ruoli Azure: [§ L'accesso ad Azure](accesso-azure.md) |

## Solo lo strumento a riga di comando, sul proprio PC

**Se usi l'app, salta questa sezione**: il plugin scarica `xrcopilotlab-bp` da sé, dentro l'app, e
non devi installare niente. Serve a tre casi diversi — chi vuole la CLI in un terminale senza
passare da Claude, chi deve **fissare una versione precisa**, e chi lavora su una macchina che al
primo avvio non può raggiungere GitHub.

I binari stanno fra gli allegati della release
[`bp-v2.15.1`](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/tag/bp-v2.15.1).
Accanto a ciascuno c'è un file `.sha256` che contiene **solo l'impronta**: si confronta, non si dà
in pasto a `shasum -c`.

| Il tuo PC | Allegato da scaricare |
|---|---|
| macOS Apple Silicon (M1/M2/M3/M4) | `xrcopilotlab-bp-osx-arm64` |
| macOS Intel | `xrcopilotlab-bp-osx-x64` |
| Windows x64 | `xrcopilotlab-bp-win-x64.exe` |
| Linux x64 | `xrcopilotlab-bp-linux-x64` |

Non c'è niente da installare: è **un file solo**, autosufficiente. Non serve .NET.

### macOS

```bash
gh release download bp-v2.15.1 --repo hevolusinnovation/hevolus-claude-plugins \
    --pattern 'xrcopilotlab-bp-osx-arm64*' --dir ~/Downloads

# L'impronta si confronta prima di eseguire ciò che si è appena scaricato.
[ "$(shasum -a 256 ~/Downloads/xrcopilotlab-bp-osx-arm64 | awk '{print $1}')" \
  = "$(tr -d '\r\n' < ~/Downloads/xrcopilotlab-bp-osx-arm64.sha256)" ] \
  && echo "impronta ok" || echo "NON eseguirlo"

mkdir -p ~/.local/bin
mv ~/Downloads/xrcopilotlab-bp-osx-arm64 ~/.local/bin/xrcopilotlab-bp
chmod +x ~/.local/bin/xrcopilotlab-bp
```

Se il file l'hai preso **dal browser** invece che con `gh`, macOS lo mette in quarantena e al primo
avvio dice che «non è possibile verificare lo sviluppatore». Si toglie l'attributo una volta sola,
**dopo** aver verificato l'impronta qui sopra:

```bash
xattr -d com.apple.quarantine ~/.local/bin/xrcopilotlab-bp
```

Perché il comando si trovi in ogni terminale nuovo, `~/.local/bin` deve stare nel `PATH`
(`echo $PATH`); se non c'è, si aggiunge al proprio `~/.zshrc`:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

### Windows (PowerShell)

```powershell
gh release download bp-v2.15.1 --repo hevolusinnovation/hevolus-claude-plugins `
    --pattern 'xrcopilotlab-bp-win-x64.exe*' --dir $HOME\Downloads

$atteso   = (Get-Content $HOME\Downloads\xrcopilotlab-bp-win-x64.exe.sha256).Trim()
$ottenuto = (Get-FileHash $HOME\Downloads\xrcopilotlab-bp-win-x64.exe -Algorithm SHA256).Hash.ToLower()
if ($atteso -eq $ottenuto) { "impronta ok" } else { "NON eseguirlo" }

New-Item -ItemType Directory -Force "$HOME\bin" | Out-Null
Move-Item $HOME\Downloads\xrcopilotlab-bp-win-x64.exe "$HOME\bin\xrcopilotlab-bp.exe"
Unblock-File "$HOME\bin\xrcopilotlab-bp.exe"     # toglie il marchio «scaricato da internet»

[Environment]::SetEnvironmentVariable(
    "Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";$HOME\bin", "User")
```

L'ultima riga mette `$HOME\bin` nel `PATH` dell'utente: vale dalle finestre aperte **dopo**.

### Linux

Come macOS, con l'allegato `xrcopilotlab-bp-linux-x64` e `sha256sum` al posto di `shasum -a 256`.
Niente quarantena da togliere.

### Ha funzionato?

```bash
xrcopilotlab-bp --help
```

L'elenco che stampa è anche la risposta alla domanda «questa versione cosa sa fare»: se un comando
citato da una guida non compare lì, il binario è più vecchio della guida — si riscarica da una
release più recente. Fuori da un clone del repository di prodotto ogni comando che tocca la rete
vuole `--env staging` o `--env prod`, e prima serve
[l'accesso ad Azure](accesso-azure.md).

> **Se hai anche il plugin, attenzione a una cosa.** Un `xrcopilotlab-bp` installato a mano viene
> preferito dall'avviatore a quello del plugin, e resta fermo alla versione che hai scaricato: è la
> causa numero uno del «questo comando non esiste» mesi dopo. `xrcopilotlab-bp version` dice quale
> sta girando e da dove.

## Una skill da sola, su Desktop o su Code

Ogni skill si può installare **senza il suo plugin**, e su tutte e due le app. Serve a due casi:
avere l'assessment dentro Claude Code, o avere le skill dei blueprint su Desktop per scrivere e
capire un manifest senza aprire un terminale.

Il punto di partenza è lo stesso: dalla
[pagina delle release](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/latest)
scarica il file con il nome della skill — `xrcopilotlab-assessment.zip`,
`xrcopilotlab-blueprint.zip`, `xrcopilotlab-blueprint-test.zip`, `xrcopilotlab-blueprint-guide.zip`,
`xrcopilotlab-blueprint-demo.zip`, `xrcopilotlab-blueprint-storyboard.zip`, `xrcopilotlab-blueprint-bpm-flow.zip`, `xrcopilotlab-blueprints-report.zip`, `xrcopilotlab-blueprint-version.zip`, `xrcopilotlab-blueprint-howto.zip`.

### Su Claude Desktop (e claude.ai)

Vai in **Impostazioni → Capacità → Skill** e carica lo zip. Vale per entrambi: la libreria delle
skill è quella dell'account, non dell'app.

### Su Claude Code

Le skill personali stanno in una cartella: basta scompattare lo zip lì dentro, e ogni sessione le
vede.

```bash
mkdir -p ~/.claude/skills
unzip -o ~/Downloads/xrcopilotlab-assessment.zip -d ~/.claude/skills
```

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
Expand-Archive -Force $HOME\Downloads\xrcopilotlab-assessment.zip -DestinationPath "$HOME\.claude\skills"
```

Lo zip contiene **una sola cartella di primo livello** con il nome della skill, quindi finisce al
posto giusto senza spostare niente. Per averla solo in un progetto invece che ovunque, la stessa
cartella va in `.claude/skills/` di quel progetto.

> Se hai già il plugin `blueprints` installato, **non** scompattare anche le sue skill qui: avresti
> due copie della stessa skill, una delle quali non si aggiorna più.

### Due cose da sapere

I due pacchetti **non** sono intercambiabili: quello del plugin (`Xrcopilotlab-….zip`) e quello
della skill (`xrcopilotlab-….zip`) hanno una forma interna diversa, e scambiarli è l'errore che
capita per primo. La differenza, per chi mantiene: [§ Manutenzione](manutenzione.md#caricare-una-skill-singola-su-claudeai--non-è-lo-stesso-pacchetto-del-plugin).

E le skill dei blueprint, installate da sole **su Desktop**, sanno spiegare e scrivere un
manifest ma non possono applicarlo né collaudarlo: quello richiede `xrcopilotlab-bp`, che vuole un
terminale. Su Claude Code invece funzionano per intero, a patto di avere la CLI —
[§ Solo lo strumento a riga di comando](#solo-lo-strumento-a-riga-di-comando-sul-proprio-pc).

## A chi chiedere

Se ti blocchi, scrivi a chi mantiene il catalogo (AI Team) dicendo **cosa stavi facendo** e
**copiando il messaggio d'errore per intero**: quasi tutti gli errori di queste pagine dicono
esattamente cosa manca, ma solo se arrivano interi.
