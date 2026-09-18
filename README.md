# Plugin Claude di Hevolus

Gli strumenti interni dell'AI Team, in un posto solo: portano una proposta di cliente fino a un
ambiente XRCopilotLab configurato e collaudato.

**Se devi solo usarli, la pagina da leggere è una: [§ Installare](docs/installare.md).** Non serve
clonare questo repository, non serve un terminale e non serve saper programmare.

## Cosa c'è dentro

| Plugin | Dove gira | Come si installa | Cosa fa |
|---|---|---|---|
| **assessment** | Claude Desktop | scaricando uno [zip](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/latest) | Traduce la proposta di un cliente nella soluzione XRCopilotLab: scenari, agenti orchestrati o processo BPM, fattibilità delle fonti dati, dossier tecnico in Markdown e Word |
| **blueprints** | Claude Code | `/plugin install blueprints@hevolus` | Configura un ambiente da un file — topic, knowledge, ruoli, agenti, agent task, processi BPM — mostrando il piano prima di creare; e lo **collauda** una volta applicato |

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
                                 issue (dopo un sì) · guide per il cliente
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

Prima di usare `blueprints` serve l'accesso alle risorse Azure di Hevolus: è il punto contro cui si
sbatte per primo, e si sistema una volta sola — [§ L'accesso ad Azure](docs/accesso-azure.md).

I passi per intero, con cosa fare quando qualcosa non va: [§ Installare](docs/installare.md).

## Dove trovi il resto

| Se vuoi | Leggi |
|---|---|
| Installare e cominciare a usarli | [§ Installare](docs/installare.md) |
| Capire perché il plugin non ti fa entrare, e cosa chiedere a chi | [§ L'accesso ad Azure](docs/accesso-azure.md) |
| Sapere cosa fa ciascuna skill, con che frasi si attiva e cosa produce | [§ Le skill](docs/le-skill.md) |
| Il manuale passo passo di un plugin | [assessment](plugins/assessment/docs/manuale.md) · [blueprints](plugins/blueprints/docs/manuale.md) |
| Capire perché una cosa sta su Desktop e un'altra su Code | [§ Claude Code o Claude Desktop](docs/code-o-desktop.md) |
| Le skill che si ottengono clonando il repository di prodotto | [§ Le skill di sviluppo](docs/skill-di-sviluppo.md) |
| Modificare, sincronizzare o pubblicare qualcosa di questo repository | [§ Manutenzione](docs/manutenzione.md) |

## Le tre skill

Un plugin è un contenitore: il lavoro lo fanno le **skill**, cioè le istruzioni che Claude carica
quando la richiesta le riguarda. Di solito non serve nominarle — si attivano da sole.

| Skill | Plugin | Si attiva quando | Produce |
|---|---|---|---|
| `xrcopilotlab-assessment` | assessment | si carica una proposta e si chiede di «valutarla», «fare l'assessment», «tradurla in soluzione» | il dossier tecnico `.md` e `.docx`, con il capitolo per il provisioning |
| `xrcopilotlab-blueprint` | blueprints | «crea un blueprint», «configura il cliente da zero», «applica il manifest» | il manifest `.yml`, il piano, il tenant configurato |
| `xrcopilotlab-blueprint-test` | blueprints | «collauda il blueprint», «scrivi le domande di test», «vedi se funziona» | la suite `.tests.yml`, il report, il giudizio, le bozze di issue, le guide per il cliente |

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

I pacchetti non vanno costruiti a mano per distribuirli: li costruisce la CI e li allega a una
release, che è da dove i colleghi li scaricano. Il resto — sincronizzazione dalle sorgenti, versioni
della CLI, come si pubblica, come si aggiunge una skill — è in [§ Manutenzione](docs/manutenzione.md).
