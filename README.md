# Plugin Claude di Hevolus

Gli strumenti interni dell'AI Team, in un posto solo: portano una proposta di cliente fino a un
ambiente XRCopilotLab configurato e collaudato.

## Ti serve solo usarli? Parti da qui

| Quello che devi fare | Dove si fa | Cosa fare adesso |
|---|---|---|
| Capire come si realizza la proposta di un cliente | **Claude Desktop** | scarica `Xrcopilotlab-….zip` dalle [release](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/latest) e caricalo su [claude.ai/customize/plugins](https://claude.ai/customize/plugins) |
| Configurare o collaudare l'ambiente di un cliente | **app Claude, scheda Code** — niente terminale, niente clone | le [due righe](#installare-in-breve) qui sotto, scritte nella casella dei messaggi — ma prima [l'accesso ad Azure](docs/accesso-azure.md), che è il punto contro cui si sbatte per primo |
| Portare un blueprint collaudato **da staging a produzione** | **app Claude, scheda Code** | i passi, con le due cose che possono fermarti: [§ Da staging a produzione](docs/da-staging-a-produzione.md) |
| Avere `xrcopilotlab-bp` sul proprio PC, senza Claude Code | **terminale** | scarica il binario dalla release [`bp-v2.15.0`](https://github.com/hevolusinnovation/xrcopilotlab-webapp-dotnet/releases/tag/bp-v2.15.0) — i passi per macOS e Windows: [§ Solo lo strumento a riga di comando](docs/installare.md#solo-lo-strumento-a-riga-di-comando-sul-proprio-pc) |
| Avere una di queste skill sull'altra app — l'assessment in Claude Code, i blueprint su Desktop — o senza plugin | **Claude Desktop o Claude Code** | scarica `xrcopilotlab-….zip` dalle stesse release: su Desktop si carica in *Impostazioni → Capacità → Skill*, su Code si scompatta in `~/.claude/skills/`. I passi: [§ Una skill da sola](docs/installare.md#una-skill-da-sola-su-desktop-o-su-code) — da Desktop si scrive, non si applica |

**Da girare a un collega che non ha questo repository:** [`sito/index.html`](sito/index.html) — la
stessa cosa in una pagina sola, che si apre con un doppio clic, con i comandi da copiare, la
richiesta dei ruoli Azure già scritta e cosa fare quando qualcosa non va. È un file: si manda, si
mette su una cartella condivisa, o si pubblica dove si vuole.

I passi per intero, in forma di documento: [§ Installare](docs/installare.md).

## I pacchetti pronti

Tutti sulla **[pagina delle release](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/latest)**, sotto *Assets*. Sono cinque e non sono intercambiabili:

| File | Cos'è | Dove si carica |
|---|---|---|
| `Xrcopilotlab-….zip` | il **plugin** per Claude Desktop (assessment) | [claude.ai/customize/plugins](https://claude.ai/customize/plugins) → **Carica plugin** |
| `xrcopilotlab-assessment.zip` | la **skill** dell'assessment, da sola | *Impostazioni → Capacità → Skill*, oppure scompattata in `~/.claude/skills/` per Claude Code |
| `xrcopilotlab-blueprint.zip` | la **skill** che scrive e applica un blueprint | idem |
| `xrcopilotlab-blueprint-test.zip` | la **skill** che collauda un blueprint applicato | idem |
| `xrcopilotlab-blueprint-guide.zip` | la **skill** che scrive la guida non tecnica per il cliente | idem |

Il **plugin `blueprints` per Claude Code non si scarica**: si installa con le [due righe](#installare-in-breve) e porta con sé le sue tre skill e lo strumento a riga di comando. Gli zip delle skill servono a chi le vuole **senza** il plugin — in chat, o su un'altra app. La differenza fra i due formati è reale: scambiarli dà l'errore «All files must be inside the top-level folder».

## Cosa c'è dentro

| Plugin | Dove gira | Come si installa | Cosa fa |
|---|---|---|---|
| **assessment** | Claude Desktop | scaricando uno [zip](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/latest) | Traduce la proposta di un cliente nella soluzione XRCopilotLab: scenari, agenti orchestrati o processo BPM, fattibilità delle fonti dati, dossier tecnico in Markdown e Word |
| **blueprints** | Claude Code | `/plugin install blueprints@hevolus` | Configura un ambiente da un file — topic, knowledge, ruoli, agenti, agent task, processi BPM — mostrando il piano prima di creare; lo **collauda** una volta applicato, e lo **racconta al cliente** in una guida non tecnica |

I due sono i tempi dello stesso lavoro su due strumenti diversi, e la divisione non è arbitraria:
l'assessment si fa in chat, dove la proposta del cliente si carica e si legge; il provisioning si fa
da Claude Code, perché lì lo strumento a riga di comando può parlare con il tenant.

```
Claude Desktop · plugin assessment          Claude Code · plugin blueprints
  proposta del cliente                        dossier dell'assessment
        ↓                                             ↓
  dossier .md/.docx        ──────────▶          manifest .yml
                                                      ↓
                                        documenti → profili, modello per agente
                                                      ↓
                                       piano → conferma → tenant configurato
                                                      ↓
                                    suite di collaudo → report → giudizio
                                                      ↓
                                 issue (dopo un sì) · domande di prova
                                                      ↓
                         guida per il cliente, non tecnica · pagina web
```

## Installare, in breve

**Claude Desktop** — scarica `Xrcopilotlab-….zip` dalla
[pagina delle release](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/latest)
e caricalo su [claude.ai/customize/plugins](https://claude.ai/customize/plugins), senza aprirlo.

**Claude Code** — dentro Claude Code:

```
/plugin marketplace add hevolusinnovation/hevolus-claude-plugins
/plugin install blueprints@hevolus
```

Non serve clonare il repository di prodotto, non serve .NET e non serve compilare niente: il plugin
porta le skill e scarica da sé lo strumento a riga di comando al primo uso, dalle release di questo
stesso catalogo. Servono `git` e un accesso GitHub a `hevolusinnovation`: **uno solo**, quello che
serviva comunque per installare.

Prima di usare `blueprints` serve l'accesso alle risorse Azure di Hevolus: è il punto contro cui si
sbatte per primo, non si aggira riprovando, e si sistema una volta sola —
[§ L'accesso ad Azure](docs/accesso-azure.md).

**Solo la riga di comando, senza Claude Code?** Il binario si scarica dalla release e non si
installa niente — è un file solo, senza .NET:
[§ Solo lo strumento a riga di comando](docs/installare.md#solo-lo-strumento-a-riga-di-comando-sul-proprio-pc),
con i passi per macOS e per Windows.

Cosa fare quando qualcosa non va: [§ Installare](docs/installare.md#se-qualcosa-non-va).

## Aggiornare

Il modo dipende da come l'hai installata, e non si mescolano: una skill presa in due modi diversi
dà due copie, e una delle due resta indietro.

| Come l'hai installata | Come si aggiorna |
|---|---|
| Plugin **blueprints** su Claude Code | dentro Claude Code: `/plugin update blueprints@hevolus` — skill e strumento a riga di comando si muovono **insieme**, il binario nuovo si riscarica da sé al comando successivo |
| Plugin **assessment** su Claude Desktop | scarica lo zip `Xrcopilotlab-….zip` nuovo dalle [release](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/latest) e ricaricalo su [claude.ai/customize/plugins](https://claude.ai/customize/plugins): sostituisce il precedente. Qui non c'è aggiornamento automatico |
| Una **skill da sola** su Desktop | scarica lo zip `xrcopilotlab-….zip` nuovo e ricaricalo in *Impostazioni → Capacità → Skill* |
| Una **skill da sola** su Claude Code | togli la cartella vecchia e scompatta lo zip nuovo al suo posto — così non restano file che la versione nuova non ha più (sotto) |
| Solo lo **strumento a riga di comando** | `xrcopilotlab-bp update` — scarica, verifica l'impronta, sostituisce; con `--check` dice cosa farebbe e si ferma |

Per una skill da sola su Claude Code, per esempio `xrcopilotlab-blueprint`:

```bash
rm -rf ~/.claude/skills/xrcopilotlab-blueprint
unzip -o ~/Downloads/xrcopilotlab-blueprint.zip -d ~/.claude/skills
```

```powershell
Remove-Item -Recurse -Force "$HOME\.claude\skills\xrcopilotlab-blueprint" -ErrorAction SilentlyContinue
Expand-Archive -Force $HOME\Downloads\xrcopilotlab-blueprint.zip -DestinationPath "$HOME\.claude\skills"
```

**Quando esce una CLI più recente** di quella che il plugin chiede, al comando successivo compare una
riga che lo dice, con il comando da digitare. `/plugin update` è un comando del client: Claude non
può lanciarlo al posto tuo.

**Le novità delle sole skill non hanno un avviso.** Una skill nuova o aggiornata, senza una CLI
nuova, arriva quando il plugin si aggiorna — da sé all'avvio di Claude Code, se l'aggiornamento
automatico del catalogo funziona, oppure a mano:

```
/plugin marketplace update hevolus
/plugin update blueprints@hevolus
```

Poi si riavvia la sessione, perché le skill si caricano all'avvio. Per sapere se ce l'hai:
`/plugin` mostra la versione installata, da confrontare con la [release più recente](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/latest)
— che dice anche che cosa è cambiato. Chi pubblica una versione con skill nuove lo **annuncia al
team**: è l'unico modo in cui chi non riavvia lo scopre.

I dettagli, compreso il vecchio strumento globale `dotnet tool` da togliere:
[§ Aggiornare](docs/installare.md#aggiornare) e il [manuale di blueprints](plugins/blueprints/docs/manuale.md#8-aggiornare-e-disinstallare).

## Dove trovi il resto

| Se vuoi | Leggi |
|---|---|
| Installare e cominciare a usarli | [§ Installare](docs/installare.md) |
| Aggiornare un plugin, una skill o lo strumento a riga di comando | [§ Aggiornare](#aggiornare) |
| Portare un blueprint da staging a produzione, passo per passo | [§ Da staging a produzione](docs/da-staging-a-produzione.md) |
| Avere lo strumento a riga di comando sul proprio PC, senza plugin | [§ Solo lo strumento a riga di comando](docs/installare.md#solo-lo-strumento-a-riga-di-comando-sul-proprio-pc) |
| Capire perché il plugin non ti fa entrare, e cosa chiedere a chi | [§ L'accesso ad Azure](docs/accesso-azure.md) |
| Sapere cosa fa ciascuna skill, con che frasi si attiva e cosa produce | [§ Le skill](docs/le-skill.md) |
| Il manuale passo passo di un plugin | [assessment](plugins/assessment/docs/manuale.md) · [blueprints](plugins/blueprints/docs/manuale.md) |
| Capire perché una cosa sta su Desktop e un'altra su Code | [§ Claude Code o Claude Desktop](docs/code-o-desktop.md) |
| Le skill che si ottengono clonando il repository di prodotto | [§ Le skill di sviluppo](docs/skill-di-sviluppo.md) |
| Modificare, sincronizzare o pubblicare qualcosa di questo repository | [§ Manutenzione](docs/manutenzione.md) |

## Le quattro skill

Un plugin è un contenitore: il lavoro lo fanno le **skill**, cioè le istruzioni che Claude carica
quando la richiesta le riguarda. Di solito non serve nominarle — si attivano da sole.

| Skill | Plugin | Si attiva quando | Produce |
|---|---|---|---|
| `xrcopilotlab-assessment` | assessment | si carica una proposta e si chiede di «valutarla», «fare l'assessment», «tradurla in soluzione» | il dossier tecnico `.md` e `.docx`, con il capitolo per il provisioning |
| `xrcopilotlab-blueprint` | blueprints | «crea un blueprint», «configura il cliente da zero», «applica il manifest» | il manifest `.yml`, il piano, il tenant configurato |
| `xrcopilotlab-blueprint-test` | blueprints | «collauda il blueprint», «scrivi le domande di test», «vedi se funziona» | la suite `.tests.yml`, il report, il giudizio, le bozze di issue, le domande di prova per il cliente |
| `xrcopilotlab-blueprint-guide` | blueprints | «scrivi la guida per il cliente», «spiega il blueprint al cliente», «una guida non tecnica» | la guida non tecnica `guida-<scenario>.md`, con i disegni, e la sua pagina web |

Il dettaglio di ciascuna, con esempi di manifest, di suite e di cosa **non** fanno:
[§ Le skill](docs/le-skill.md).

## Per chi mantiene

```bash
./verifica-superfici.sh                # la separazione Code / Desktop tiene?
./sync-from-source.sh ../xrcopilotlab-webapp-dotnet   # riallinea le skill alla sorgente
./build-desktop-plugin.sh              # lo zip per Claude Desktop
./build-skill-zip.sh --all             # gli zip delle singole skill
```

Su Windows gli stessi quattro, con il gemello `.ps1` (`.\verifica-superfici.ps1`): sono avviatori
sopra un solo programma Python in `tools/`, quindi si comportano uguale. Serve Python 3 e nient'altro.

La pagina `sito/index.html` non si costruisce: è un file statico che si modifica a mano, senza
dipendenze e senza numeri di versione dentro — i pacchetti li nomina, ma li fa scaricare dalle
release, così non può invecchiare.

I pacchetti non vanno costruiti a mano per distribuirli: li costruisce la CI e li allega a una
release, che è da dove i colleghi li scaricano. Il resto — sincronizzazione dalle sorgenti, versioni
della CLI, come si pubblica, come si aggiunge una skill — è in [§ Manutenzione](docs/manutenzione.md).
