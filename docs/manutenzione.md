# Manutenzione del catalogo

**Per chi mantiene questo repository.** Chi usa i plugin non ha bisogno di leggerla.

## Struttura del repository

```
superfici.json                                     DOVE gira ciascun plugin: la dichiarazione da cui discende il resto
.claude-plugin/marketplace.json                    il catalogo di Claude Code: solo i plugin «code»
tools/                                             la logica degli script, in Python: gira uguale ovunque
verifica-superfici.sh / .ps1                       controlla che superfici.json, i manifest e il catalogo concordino
sync-from-source.sh / .ps1                         riallinea le skill al repository di prodotto
build-desktop-plugin.sh / .ps1                     lo zip del plugin Desktop
build-skill-zip.sh / .ps1                          lo zip di una skill singola per claude.ai
.github/workflows/controlli.yml                    i controlli, a ogni push e pull request
.github/workflows/pacchetti.yml                    costruisce i pacchetti e li allega a una release
docs/                                              la documentazione, divisa per lettore
plugins/blueprints/
├── .claude-plugin/plugin.json                     identità e versione del plugin
├── skills/xrcopilotlab-blueprint/SKILL.md         scrivere e applicare un manifest, con i suoi references/
├── skills/xrcopilotlab-blueprint-test/SKILL.md    collaudare un blueprint applicato, con i suoi references/
├── bin/                                           gli avviatori: finiscono nel PATH quando il plugin è attivo
└── docs/manuale.md                                il manuale per chi lo usa
plugins/assessment/
├── .claude-plugin/plugin.json
├── skills/xrcopilotlab-assessment/SKILL.md        la proposta → il dossier tecnico
│   ├── references/                                vincoli di piattaforma, struttura del dossier, fonti dati
│   ├── scripts/md_to_docx_template.py             il generatore Word
│   └── assets/template.docx                       il template Office
└── docs/manuale.md
```

Un plugin può portare più skill: `blueprints` ne ha due, che si passano il lavoro — la prima crea,
la seconda verifica. Le cartelle `skills/`, `bin/`, `agents/` e `hooks/` stanno alla radice del
plugin, **non** dentro `.claude-plugin/`.

Il file da guardare per primo è **`superfici.json`**: dice dove gira ciascun plugin, e da lì
discendono il catalogo, il pacchetto da costruire e cosa il plugin può contenere. La regola per
intero, con le tre domande per decidere dove va una skill nuova:
[§ Claude Code o Claude Desktop](code-o-desktop.md).

## Gli script: uno per due sistemi

Ogni script esiste in due file con lo stesso nome, `.sh` e `.ps1`, ma **non** sono due
implementazioni: sono due avviatori di dieci righe sopra lo stesso programma Python in `tools/`.

| Su macOS e Linux | Su Windows |
|---|---|
| `./verifica-superfici.sh` | `.\verifica-superfici.ps1` |
| `./sync-from-source.sh ../xrcopilotlab-webapp-dotnet` | `.\sync-from-source.ps1 ..\xrcopilotlab-webapp-dotnet` |
| `./build-desktop-plugin.sh` | `.\build-desktop-plugin.ps1` |
| `./build-skill-zip.sh --all` | `.\build-skill-zip.ps1 --all` |

Serve **Python 3** e nient'altro: niente `zip`, niente `bash`, niente WSL — gli archivi li scrive
Python, che su Windows lo si prende dal Microsoft Store. L'avviatore cerca `py`, `python3` e
`python` in quest'ordine e dice cosa manca se non trova niente.

La ragione per cui la logica non è duplicata in PowerShell è la stessa per cui le skill non si
modificano a mano qui: due copie della stessa cosa divergono, e la seconda smette di essere vera
senza che nessuno se ne accorga. Gli avviatori si possono permettere di essere due perché non
contengono decisioni.

> Se PowerShell rifiuta di eseguire lo script («l'esecuzione di script è disabilitata»), la strada
> è `powershell -ExecutionPolicy Bypass -File .\verifica-superfici.ps1`, come fa già
> `bin/xrcopilotlab-bp.cmd`. Non serve cambiare le impostazioni della macchina.

## Per chi mantiene il catalogo

### Il plugin blueprints

**Le due skill e i loro riferimenti vivono nel repository di prodotto**
[`xrcopilotlab-webapp-dotnet`](https://github.com/hevolusinnovation/xrcopilotlab-webapp-dotnet),
perché è lì che stanno le regole che descrivono. Qui ce n'è una copia, che si rifà con:

```bash
./sync-from-source.sh ../xrcopilotlab-webapp-dotnet
```

| Nel repository di prodotto | Nel plugin |
|---|---|
| `.claude/skills/xrcopilotlab-blueprint/` | `plugins/blueprints/skills/xrcopilotlab-blueprint/` |
| `docs/blueprints/manifest-reference.md`, `cli-reference.md` | `…/xrcopilotlab-blueprint/references/` |
| `XRCopilotLab.BluePrints/Schema/blueprint.v1.schema.json` | `…/xrcopilotlab-blueprint/references/` |
| `blueprints/studiopolis-agenda.yml`, `test-agenda.yml` | `…/references/esempio-agenda.yml`, `esempio-minimo.yml` |
| `.claude/skills/xrcopilotlab-blueprint-test/` | `plugins/blueprints/skills/xrcopilotlab-blueprint-test/` |
| `docs/blueprints/testing.md` | `…/xrcopilotlab-blueprint-test/references/testing.md` |
| `blueprints/tests/studiopolis-agenda.tests.yml` | `…/references/esempio-suite-agenda.tests.yml` |

Lo script controlla anche **i file che nessuno sincronizza**: se in `skills/` compare qualcosa che
non è in `COPIE`, lo elenca ed esce con errore. È il modo in cui un file copiato a mano — che
resterebbe fermo per sempre — si fa notare subito.

Lo script copia le skill, i riferimenti, lo schema e gli esempi, e riscrive i percorsi dei link
perché puntino ai file che viaggiano con il plugin — nel repository di prodotto la skill punta a
`docs/` e a `blueprints/`, che chi installa il plugin non ha. **Un riferimento nuovo in una skill va
aggiunto allo script**: se non compare fra i `cp`, la copia nel plugin non esiste e la skill punta a
un file che non c'è. **Non modificare quei file a mano**: la prossima sincronizzazione li
sovrascriverebbe, e la modifica sparirebbe senza che nessuno se ne accorga. Si cambia la sorgente,
poi si sincronizza.

### La CLI non sta qui

`bin/` contiene solo due avviatori, uno per sistema. Il binario vero — una cinquantina di megabyte
— sta fra gli allegati di una release del repository di prodotto, e viene scaricato al primo uso
dentro `${CLAUDE_PLUGIN_DATA}`.

Tenerlo qui vorrebbe dire farlo clonare a tutto il team anche solo per leggere la skill: Claude
Code clona questo repository su ogni macchina dove il catalogo è registrato.

L'avviatore cerca la CLI in quest'ordine, e si ferma al primo che trova:

1. `XRCOPILOTLAB_BP_BIN`, se qualcuno l'ha impostata a mano;
2. lo strumento globale `.dotnet/tools/xrcopilotlab-bp`, per chi sviluppa sul prodotto;
3. la copia già scaricata in cache;
4. l'allegato della release, che scarica e verifica con l'impronta SHA-256.

### Pubblicare una versione nuova della CLI

I binari li costruisce il workflow `blueprints-cli-release.yml` **nel repository di prodotto**,
dove sta il codice. Quattro piattaforme da un solo runner, perché la pubblicazione autonoma di
.NET non ha bisogno della macchina di destinazione.

```bash
# nel repository xrcopilotlab-webapp-dotnet
git tag bp-v1.1.2 && git push origin bp-v1.1.2
```

Poi qui si allinea il numero, che è quello che l'avviatore cerca:

```bash
echo "1.1.2" > plugins/blueprints/bin/version.txt
```

E si alza la versione del plugin in `plugins/blueprints/.claude-plugin/plugin.json` e nella voce
corrispondente di `.claude-plugin/marketplace.json`.

> I tre numeri devono coincidere: il tag della release, `version.txt` e la versione del plugin. Se
> divergono, l'avviatore cerca un allegato che non esiste e lo dice solo a chi prova a usarlo.

### Caricare una skill singola su claude.ai — non è lo stesso pacchetto del plugin

Una skill si può caricare **da sola** nella libreria skill di claude.ai, senza passare da un plugin:
è la strada per darla a chi lavora in chat e non usa Claude Code. Ma il pacchetto è **un altro**, e
scambiarli è l'errore che si fa per primo:

| | Pacchetto **plugin** (`build-desktop-plugin.sh`) | Pacchetto **skill** (`build-skill-zip.sh`) |
|---|---|---|
| Dove si carica | claude.ai/customize/plugins | claude.ai → Impostazioni → Capacità → Skill |
| Radice dell'archivio | `.claude-plugin/`, `skills/`, `README.md` | **una sola cartella**, che è la skill |
| Dove sta `SKILL.md` | `skills/<nome>/SKILL.md` | `<nome>/SKILL.md` |

Caricare il pacchetto del plugin nell'uploader delle skill dà **«All files must be inside the
top-level folder»**: l'uploader vuole una sola cartella di primo livello e trova tre voci alla
radice. Lo zip nella forma giusta lo costruisce:

```bash
./build-skill-zip.sh plugins/blueprints/skills/xrcopilotlab-blueprint-test   # una skill
./build-skill-zip.sh --all                                                   # tutte → dist/skills/
```

Lo script copia la cartella della skill dentro uno stage, toglie i `.DS_Store` e **verifica
l'archivio prima di consegnarlo**: ogni voce dentro `<nome>/`, e `SKILL.md` alla sua radice.

**Gli errori successivi arrivano dal frontmatter**, e l'uploader li segnala dopo il caricamento con
un messaggio che non dice quale regola è saltata. Sono tre, e due si violano senza accorgersene:

| Regola | Cosa la viola |
|---|---|
| `description` al massimo **1.024 caratteri** | Una descrizione ricca di frasi di attivazione: in questo repository due erano oltre, la skill di collaudo stava a 1.488 |
| `name` e `description` **senza tag XML** | Un segnaposto come `<nome>` dentro un percorso d'esempio — `blueprints/tests/<nome>.tests.yml` — viene letto come un tag e fa rifiutare la skill |
| `name` al massimo 64 caratteri, solo minuscole, numeri e trattini, e senza le parole riservate «anthropic» e «claude» | Un nome con maiuscole, con uno spazio, o che nomina l'azienda o il modello |

`build-skill-zip.sh` le controlla **prima** di produrre l'archivio e si ferma dicendo quale non
torna, così l'errore si vede qui invece che sul browser dopo il caricamento.

La descrizione si corregge **nella sorgente** — nel repository di prodotto per le due skill dei
blueprint, qui per l'assessment — tenendo tutte le frasi che la fanno attivare: è il testo con cui
Claude sceglie la skill fra tutte quelle installate, quindi si tolgono i dettagli del funzionamento,
non i casi d'uso. Un percorso d'esempio con un segnaposto si riscrive nominando la cartella
(`blueprints/tests/`) invece del file: nel **corpo** della skill i segnaposto restano, il divieto
vale solo per i due campi del frontmatter.

### Il plugin assessment: sorgente qui, distribuzione su Claude Desktop

Non è elencato in `.claude-plugin/marketplace.json` di proposito: il catalogo serve a Claude Code, e
da lì l'assessment non si usa. Lo dichiara `superfici.json`, e `./verifica-superfici.sh` se ne
accorge se un giorno qualcuno ce lo aggiunge.

La skill vive in `plugins/assessment/`, con la stessa forma degli altri plugin, e — a differenza
delle due dei blueprint — **non ha una sorgente altrove**: si modifica qui.

Dopo ogni modifica va **alzata la versione** in `plugins/assessment/.claude-plugin/plugin.json`: è
l'unico segnale che chi l'ha già installato vede, perché su Desktop non ci sono aggiornamenti
automatici. Poi si pubblica una release, e chi lo usa riscarica lo zip.

## Pubblicare una release

**È così che i pacchetti arrivano ai colleghi.** Nessuno deve clonare il repository né eseguire uno
script per installare qualcosa: i pacchetti li costruisce la CI e li allega a una release, e da lì
si scaricano con un clic.

Dalla scheda **Actions** del repository → workflow **Pacchetti** → **Run workflow**. Oppure, se
preferisci partire da un tag:

```bash
git tag v1.11.3 && git push origin v1.11.3
```

Il workflow verifica le superfici, costruisce lo zip del plugin Desktop e quelli delle tre skill,
scrive le note — cosa scaricare, dove si carica, le versioni dentro — e li allega alla release. Se
la release esiste già, sostituisce gli allegati invece di crearne una seconda.

Il tag, se non lo passi, è `v<versione di marketplace.json>`. Quindi: **prima si alzano le
versioni**, poi si pubblica.

| Cosa alzare | Quando |
|---|---|
| `plugins/<nome>/.claude-plugin/plugin.json` | a ogni modifica del plugin |
| la voce in `.claude-plugin/marketplace.json` | per i plugin `code`, con lo stesso numero di `plugin.json` |
| `version` di `.claude-plugin/marketplace.json` | quando cambia qualcosa che vale per il catalogo: è il numero che diventa il tag |

Il link che si dà a un collega è sempre lo stesso, e punta all'ultima:
`https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/latest`.

Il repository è **privato**: chi scarica dev'essere nell'organizzazione `hevolusinnovation` su
GitHub. A chi non c'è si manda lo zip per altra via — ma vale la pena aggiungerlo, perché è l'unico
modo perché veda da solo le versioni nuove.

### I controlli automatici

`.github/workflows/controlli.yml` gira a ogni push e a ogni pull request, e fa tre cose: verifica la
separazione Code / Desktop — compreso che **ogni link relativo dentro una skill punti a un file che
il plugin ha davvero** — costruisce gli zip di tutte le skill, il che significa **validarne il
frontmatter** con le stesse regole dell'uploader di claude.ai, e costruisce il pacchetto Desktop.

Serve a spostare gli errori: una `description` troppo lunga o un `<segnaposto>` nel frontmatter si
vedono qui, in trenta secondi, invece che sul browser di un collega dopo un caricamento fallito.

## Aggiungere un plugin nuovo

Una cartella sotto `plugins/`, con dentro `.claude-plugin/plugin.json` e almeno una skill (vedi
[§ Struttura del repository](#struttura-del-repository) per dove va ciascuna cosa), e poi:

1. la voce in **`superfici.json`**, che dice dove gira — è il passo che decide tutto il resto;
2. se gira su Claude Code, la voce in `.claude-plugin/marketplace.json`, con la **stessa versione**
   di `plugin.json`; se gira su Desktop, **niente catalogo** e un `nomeNelPacchetto`;
3. `./verifica-superfici.sh`, che dice cosa manca prima che lo dica a qualcun altro.

Come si decide la superficie, e cosa un plugin può contenere in ciascuna:
[§ Claude Code o Claude Desktop](code-o-desktop.md).

## Aggiungere una skill a un plugin esistente

È la strada che ha seguito `xrcopilotlab-blueprint-test`, e vale la pena ripercorrerla perché i
passi si dimenticano tutti tranne il primo:

1. si scrive la skill **nel repository di prodotto**, sotto `.claude/skills/<nome>/`, con i suoi
   `references/`;
2. si aggiungono i `cp` a `sync-from-source.sh` — la skill **e ogni riferimento**, compresi quelli
   che nel repository stanno altrove (`docs/`, `blueprints/`) e qui devono viaggiare con lei;
3. se la skill punta a un percorso che nel plugin non esiste, si aggiunge la riscrittura del link
   nello stesso script (c'è già un blocco Python per ciascuna skill);
4. si sincronizza, si committa la copia, e si aggiorna la `description` del plugin in
   `plugin.json` e in `marketplace.json`: è il testo che si legge nel catalogo prima di installare;
5. si alza la versione del plugin nei due file, che devono restare uguali;
6. si aggiunge la skill alla tabella di [§ Le skill](le-skill.md) e alla riga del plugin in
   [§ Cosa c'è dentro](../README.md#cosa-cè-dentro) del README, e alla tabella «Cosa contiene» del README
   del plugin;
7. si pubblica una release, perché è da lì che i pacchetti arrivano ai colleghi
   ([§ Pubblicare una release](#pubblicare-una-release)).

Il passo che salta più spesso è il secondo: una skill sincronizzata senza i suoi riferimenti si
installa, si attiva, e poi si ferma su un file che chi l'ha installata non ha.
