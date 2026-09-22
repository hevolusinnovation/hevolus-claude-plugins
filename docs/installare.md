# Installare

Questa pagina è per chi deve **usare** gli strumenti, non per chi li sviluppa. Non serve saper
programmare, non serve clonare niente e non serve aprire un terminale.

> C'è anche in forma di **pagina da aprire**, con i comandi da copiare con un clic e la richiesta
> dei ruoli Azure già scritta: [`sito/index.html`](../sito/index.html). È la forma da girare a un
> collega che non ha questo repository — si apre con un doppio clic, non ha bisogno di niente.

## Qual è il tuo caso

| Quello che devi fare | Lo strumento | Vai a |
|---|---|---|
| Ho la proposta di un cliente e devo capire come si realizza su XRCopilotLab | **Claude Desktop**, plugin *assessment* | [§ Claude Desktop](#claude-desktop--il-plugin-assessment) |
| Devo configurare l'ambiente di un cliente, o collaudarne uno già configurato | **Claude Code**, plugin *blueprints* | [§ Claude Code](#claude-code--il-plugin-blueprints) |
| Voglio una sola skill dentro le mie chat, senza plugin | una **skill** singola | [§ Una skill da sola](#una-skill-da-sola) |

Sono due strumenti diversi e non si sostituiscono: l'assessment si fa in chat con il documento del
cliente sotto mano, il provisioning si fa da Claude Code perché lì lo strumento può parlare con il
tenant. Perché la divisione è questa: [§ Claude Code o Claude Desktop](code-o-desktop.md).

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
| **«All files must be inside the top-level folder»** | Hai caricato il pacchetto sbagliato nel posto sbagliato: quello che comincia per `Xrcopilotlab-` va su *Carica plugin*, i file `xrcopilotlab-*.zip` vanno nella libreria delle **skill**. Vedi [§ Una skill da sola](#una-skill-da-sola) |
| Il plugin c'è ma la skill non si attiva | Carica il documento **prima** di chiedere, e dì cosa vuoi («fai l'assessment»). Se serve, nominala: «usa la skill xrcopilotlab-assessment su questo documento» |
| Hai estratto lo zip e ora non si carica | Riscarica il file originale dalla pagina delle release e caricalo senza aprirlo |

## Claude Code — il plugin *blueprints*

**Non serve clonare nessun repository di prodotto**, non serve .NET e non serve compilare niente:
il plugin porta le skill e si procura da solo lo strumento a riga di comando.

### Cosa deve esserci sulla macchina

| | Perché | Come si verifica |
|---|---|---|
| **Claude Code** | è lì che gira il plugin | lo stai usando; altrimenti [code.claude.com](https://code.claude.com) |
| **`git`** | registrare il catalogo è un clone di questo repository | `git --version` |
| **Un accesso GitHub a `hevolusinnovation`** | questo catalogo è privato: serve a installare il plugin **e** a scaricare la CLI, che vive fra i suoi allegati | `gh auth status` (installa GitHub CLI se manca: `brew install gh` / `winget install GitHub.cli`, poi `gh auth login`) |
| **I ruoli Azure** | la CLI legge App Configuration e Key Vault dell'ambiente | [§ L'accesso ad Azure](accesso-azure.md) |

> **Un accesso solo, non due.** Il binario della CLI nasce nel repository di prodotto, ma i suoi
> allegati vengono rispecchiati qui a ogni release: l'avviatore guarda **prima** in questo catalogo,
> e solo come riserva nel prodotto. Quindi chi può installare il plugin può anche scaricare la CLI.
>
> Vale dalla prima release rispecchiata in poi. Se stai usando una versione più vecchia e il primo
> comando risponde `404`, non è «la release non esiste»: è «non hai accesso al repository di
> prodotto». Chiedi al team di pubblicare una release aggiornata, invece di riprovare.

### Le due righe

```
/plugin marketplace add hevolusinnovation/hevolus-claude-plugins
/plugin install blueprints@hevolus
```

Nessuno zip da scaricare: il catalogo è il repository, e lo strumento a riga di comando che il
plugin usa se lo scarica da solo al primo utilizzo — una cinquantina di megabyte, una volta per
versione, con l'impronta SHA-256 verificata prima di eseguirlo.

L'avviatore sa chiedere sei binari — **macOS** (Apple Silicon e Intel), **Windows** (x64 e ARM) e
**Linux** (x64 e ARM) — ma li porta la release che li pubblica: l'ultima,
[`bp-v2.11.2`](https://github.com/hevolusinnovation/xrcopilotlab-webapp-dotnet/releases/tag/bp-v2.11.2),
ne ha quattro, e Windows ARM e Linux ARM arrivano con la prossima. Su quelle due macchine, per ora,
si usa il binario x64 in emulazione.

### Fuori da un clone, l'ambiente si dice sempre

Chi ha il repository di prodotto ha anche un `local.settings.json` da cui la CLI deduce dove
lavorare. Tu no: quindi ogni comando che tocca la rete vuole **`--env staging`**, `--env preview` o
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

Cosa fanno le due skill, con che frasi si attivano e cosa producono:
**[§ Le skill](le-skill.md)** e **[il manuale](../plugins/blueprints/docs/manuale.md)**.

### Se qualcosa non va

| Cosa vedi | Cosa è successo |
|---|---|
| `/plugin marketplace add` dà **404** o chiede credenziali | Non hai accesso a questo repository, o `git` sulla macchina non è autenticato su GitHub. `gh auth login`, e se resta 404 chiedi di essere aggiunto all'organizzazione |
| «per scaricare la CLI serve l'accesso a GitHub» | `gh` non c'è o non sei autenticato: `gh auth login` |
| «non sono riuscito a scaricare …» al primo comando | Il messaggio elenca le tre cause possibili e il rimedio di ciascuna. La più frequente: sei autenticato su GitHub, ma con un account che non legge il catalogo. Non si risolve riprovando |
| «la release non contiene l'allegato …» | Stai su una versione pubblicata prima del mirror, oppure su una piattaforma senza binario. Chiedi al team una release aggiornata, o fatti passare il binario e indicalo con `XRCOPILOTLAB_BP_BIN` |
| «Non è detto su quale ambiente lavorare» | Manca `--env`: fuori da un clone non c'è un ambiente predefinito. Dillo a parole («su staging») |
| Un comando «non esiste» anche se il manuale lo cita | Sulla macchina c'è un `xrcopilotlab-bp` installato a mano, che l'avviatore preferisce alla copia del plugin — e può essere vecchio di mesi. `xrcopilotlab-bp version` dice quale sta girando e da dove; poi `dotnet tool uninstall --global xrcopilotlab-bp` |
| Errori su App Configuration o Key Vault | Mancano i ruoli Azure: [§ L'accesso ad Azure](accesso-azure.md) |

## Solo lo strumento a riga di comando, sul proprio PC

Chi usa Claude Code non deve fare niente di tutto questo: il plugin scarica `xrcopilotlab-bp` da
sé. Questa strada serve a tre casi — chi vuole la CLI in un terminale senza Claude Code, chi deve
**fissare una versione precisa**, e chi lavora su una macchina che al primo avvio non può
raggiungere GitHub.

I binari stanno fra gli allegati della release
[`bp-v2.11.2`](https://github.com/hevolusinnovation/xrcopilotlab-webapp-dotnet/releases/tag/bp-v2.11.2).
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
gh release download bp-v2.11.2 --repo hevolusinnovation/xrcopilotlab-webapp-dotnet \
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
gh release download bp-v2.11.2 --repo hevolusinnovation/xrcopilotlab-webapp-dotnet `
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
vuole `--env staging`, `--env preview` o `--env prod`, e prima serve
[l'accesso ad Azure](accesso-azure.md).

> **Se hai anche il plugin, attenzione a una cosa.** Un `xrcopilotlab-bp` installato a mano viene
> preferito dall'avviatore a quello del plugin, e resta fermo alla versione che hai scaricato: è la
> causa numero uno del «questo comando non esiste» mesi dopo. `xrcopilotlab-bp version` dice quale
> sta girando e da dove.

## Una skill da sola

Una skill si può aggiungere alle proprie chat **senza plugin**: serve a chi lavora in chat su
claude.ai e non usa né Claude Desktop né Claude Code.

1. dalla stessa [pagina delle release](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/latest),
   scarica il file con il nome della skill — `xrcopilotlab-assessment.zip`,
   `xrcopilotlab-blueprint.zip`, `xrcopilotlab-blueprint-test.zip`;
2. su claude.ai vai in **Impostazioni → Capacità → Skill** e caricalo lì.

I due pacchetti **non** sono intercambiabili: quello del plugin (`Xrcopilotlab-….zip`) e quello
della skill (`xrcopilotlab-….zip`) hanno una forma interna diversa, e scambiarli è l'errore che
capita per primo. La differenza, per chi mantiene: [§ Manutenzione](manutenzione.md#caricare-una-skill-singola-su-claudeai--non-è-lo-stesso-pacchetto-del-plugin).

Attenzione a una cosa: le due skill dei blueprint, caricate da sole, sanno **spiegare e scrivere**
un manifest, ma non possono applicarlo — applicare richiede lo strumento a riga di comando, che
esiste solo dentro Claude Code.

## A chi chiedere

Se ti blocchi, scrivi a chi mantiene il catalogo (AI Team) dicendo **cosa stavi facendo** e
**copiando il messaggio d'errore per intero**: quasi tutti gli errori di queste pagine dicono
esattamente cosa manca, ma solo se arrivano interi.
