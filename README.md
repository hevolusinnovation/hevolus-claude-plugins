# Plugin Claude di Hevolus

Gli strumenti interni dell'AI Team, in un posto solo. Quelli per **Claude Code** si installano dal
catalogo — si aggiunge una volta sola, e da lì si prende quello che serve:

```
/plugin marketplace add hevolusinnovation/hevolus-claude-plugins
/plugin install blueprints@hevolus
```

**L'assessment non passa dal catalogo**, perché non gira su Claude Code: sta su **Claude Desktop**,
dove la proposta del cliente si carica e si legge in chat. Si installa caricando un pacchetto su
[claude.ai/customize/plugins](https://claude.ai/customize/plugins); il pacchetto lo costruisce
`./build-desktop-plugin.sh` da questo repository, dove la skill vive insieme all'altra così che le
due restino allineate.

## Cosa c'è dentro

| Plugin | Dove gira | Cosa fa | Manuale |
|---|---|---|---|
| **blueprints** | Claude Code | Configura un ambiente XRCopilotLab da un file: topic, ruoli, agenti, agent task, processi BPM. Mostra il piano e chiede conferma prima di creare | [manuale.md](plugins/blueprints/docs/manuale.md) |
| **assessment** | Claude Desktop | Traduce una proposta di progetto nella soluzione XRCopilotLab: scenari, agenti orchestrati o processo BPM, fattibilità delle fonti dati, dossier tecnico in Markdown e Word | [manuale.md](plugins/assessment/docs/manuale.md) |

I due plugin sono i due tempi dello stesso lavoro, su due strumenti diversi: l'assessment si fa in
chat su Claude Desktop, dove la proposta del cliente si carica e si legge; il provisioning si fa da
Claude Code, dove la CLI può parlare con il tenant.

```
Claude Desktop · plugin assessment          Claude Code · plugin blueprints
  proposta del cliente                        dossier dell'assessment
        ↓                                             ↓
  dossier .md/.docx        ──────────▶          manifest .yml
                                                      ↓
                                       piano → conferma → tenant configurato
```

Chi usa un plugin **non ha bisogno di clonare i repository di prodotto**, né di essere uno
sviluppatore: gli strumenti che servono arrivano da soli al primo utilizzo.

## Struttura del repository

```
.claude-plugin/marketplace.json      il catalogo: cosa contiene, dove sta ciascun plugin
plugins/<nome>/
├── .claude-plugin/plugin.json       identità e versione del plugin
├── skills/<nome>/SKILL.md           cosa Claude deve fare, con i suoi references/
├── bin/                             gli avviatori: finiscono nel PATH quando il plugin è attivo
└── docs/manuale.md                  il manuale per chi lo usa
```

## Per chi mantiene il catalogo

### Il plugin blueprints

La skill e i suoi riferimenti **vivono nel repository di prodotto**
[`xrcopilotlab-webapp-dotnet`](https://github.com/hevolusinnovation/xrcopilotlab-webapp-dotnet),
perché è lì che stanno le regole che descrivono. Qui ce n'è una copia, che si rifà con:

```bash
./sync-from-source.sh ../xrcopilotlab-webapp-dotnet
```

Lo script copia la skill, i riferimenti, lo schema e gli esempi, e riscrive i percorsi dei link
perché puntino ai file che viaggiano con il plugin. **Non modificare quei file a mano**: la
prossima sincronizzazione li sovrascriverebbe, e la modifica sparirebbe senza che nessuno se ne
accorga. Si cambia la sorgente, poi si sincronizza.

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
git tag bp-v1.0.1 && git push origin bp-v1.0.1
```

Poi qui si allinea il numero, che è quello che l'avviatore cerca:

```bash
echo "1.0.1" > plugins/blueprints/bin/version.txt
```

E si alza la versione del plugin in `plugins/blueprints/.claude-plugin/plugin.json` e nella voce
corrispondente di `.claude-plugin/marketplace.json`.

> I tre numeri devono coincidere: il tag della release, `version.txt` e la versione del plugin. Se
> divergono, l'avviatore cerca un allegato che non esiste e lo dice solo a chi prova a usarlo.

### Il plugin assessment: sorgente qui, distribuzione su Claude Desktop

Non è elencato in `.claude-plugin/marketplace.json` di proposito: il catalogo serve a Claude Code, e
da lì l'assessment non si usa.

La skill vive in `plugins/assessment/`, con la stessa forma degli altri plugin. Il pacchetto che i
colleghi caricano su Claude Desktop lo produce:

```bash
./build-desktop-plugin.sh                       # → dist/Xrcopilotlab-<versione>.zip
./build-desktop-plugin.sh ~/OneDrive/Assessments  # o dove serve consegnarlo
```

Lo script prende la versione da `plugins/assessment/.claude-plugin/plugin.json`, rinomina il plugin
in `xrcopilotlab` (il nome con cui appare nell'app) e usa `docs/manuale.md` come README del
pacchetto. Alzare la versione **prima** di ricostruire lo zip: è l'unico modo in cui chi l'ha già
installato vede che è cambiato.

### Aggiungere un plugin nuovo

Una cartella sotto `plugins/`, con dentro `.claude-plugin/plugin.json` e almeno una skill, più una
voce in `.claude-plugin/marketplace.json`. Le cartelle `skills/`, `bin/`, `agents/` e `hooks/`
vanno alla radice del plugin, **non** dentro `.claude-plugin/`.
