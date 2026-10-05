# Guida completa alla CLI `xrcopilotlab-bp`

Ogni comando, ogni opzione, cosa scrive e dove, cosa chiede prima di farlo e con che numero esce.

Normalmente non la usi a mano: la lanciano le skill del plugin mentre lavorate insieme. Questa guida
serve quando vuoi capire che cosa sta succedendo, quando un comando si ferma e vuoi sapere perché, o
quando ti serve lanciarne uno da solo. Il percorso per chi comincia è nel
[manuale](manuale.md); qui c'è il dettaglio.

Tutto quello che segue è ricavato dal codice della CLI, non dalla memoria di chi l'ha scritta. Se un
comando si comporta in modo diverso da come è scritto qui, ha ragione il comando: segnalalo al team.

> **Le versioni in questa guida.** Il plugin porta la CLI **2.17.0**, e tutto ciò che qui è descritto
> c'è. Con una CLI più vecchia può mancare qualcosa: il [§ 11](#11-le-versioni-cosa-cè-nella-2170) elenca cosa è arrivato con la
> 2.17.0 e con la 2.16.0. Per sapere quale versione hai davvero: `xrcopilotlab-bp version`.

---

## Indice

1. [Che cos'è, e come arriva sul tuo computer](#1-che-cosè-e-come-arriva-sul-tuo-computer)
2. [Prima di cominciare: identità e ruoli](#2-prima-di-cominciare-identità-e-ruoli)
3. [Ambienti e tenant](#3-ambienti-e-tenant)
4. [Come si scrive un comando](#4-come-si-scrive-un-comando)
5. [Il giro tipico, con un esempio completo](#5-il-giro-tipico-con-un-esempio-completo)
6. [Riferimento dei comandi](#6-riferimento-dei-comandi)
7. [Codici di uscita](#7-codici-di-uscita)
8. [Codici dei rilievi `BPxxx`](#8-codici-dei-rilievi-bpxxx)
9. [Quando qualcosa non va](#9-quando-qualcosa-non-va)
10. [Dove finisce ciò che la CLI scrive](#10-dove-finisce-ciò-che-la-cli-scrive)
11. [Le versioni: cosa c'è nella 2.17.0](#11-le-versioni-cosa-cè-nella-2170)

Elenco dei comandi, per saltare subito dove serve:

| Famiglia | Comandi |
|---|---|
| Scrivere e controllare il file | [`validate`](#validate) · [`suggest`](#suggest) · [`external`](#external) |
| Segreti | [`secrets set`](#secrets-set) · [`secrets check`](#secrets-check) |
| Archivio delle versioni | [`push`](#push) · [`pull`](#pull) · [`export`](#export) · [`promote`](#promote) · [`catalog`](#catalog-list--publish--install) |
| Applicare e smontare | [`plan`](#plan) · [`apply`](#apply) · [`pipeline`](#pipeline) · [`status`](#status) · [`rollback`](#rollback) · [`delete`](#delete) |
| Collaudo | [`test init`](#test-init) · [`test validate`](#test-validate) · [`test run`](#test-run) · [`test push`](#test-push) · [`test reports`](#test-reports) |
| Un blueprint già applicato | [`schedule`](#schedule-list--pause--resume--logs) · [`mcp`](#mcp-check--orphans--publish--test) · [`connections`](#connections-list--refresh) · [`instances`](#instances-list--show--cancel) · [`knowledge`](#knowledge-list--reingest) |
| La CLI stessa | [`environments`](#environments) · [`version`](#version) · [`update`](#update) · [`help`](#help) |

---

## 1. Che cos'è, e come arriva sul tuo computer

`xrcopilotlab-bp` è il programma che trasforma un **manifest** — un file YAML che descrive topic,
ruoli, agenti, processi, orchestratori, connessioni, server MCP e agent task — in un ambiente
XRCopilotLab configurato. Fa da riga di comando quello che altrimenti si farebbe a mano
nell'interfaccia, e tiene un archivio di ogni versione del file e di ogni esecuzione.

È pensata per **l'AI Team di Hevolus**, che configura XRCopilotLab a valle di un assessment. Non è uno
strumento da dare al cliente: lui entra nel prodotto, ma non ha (e non deve avere) l'accesso ad
Azure che la CLI richiede — vedi il [§ 2](#2-prima-di-cominciare-identità-e-ruoli).

### Chi la installa: il plugin

Non la installi tu. Nel plugin c'è un **avviatore** (`bin/xrcopilotlab-bp` su macOS e Linux,
`bin/xrcopilotlab-bp.cmd` e `.ps1` su Windows) che, a ogni comando, cerca la CLI in quest'ordine e
si ferma al primo posto in cui la trova:

| Ordine | Dove | Quando vince |
|---|---|---|
| 1 | la variabile `XRCOPILOTLAB_BP_BIN` | sempre, se è impostata: serve a provare una build fatta a mano |
| 2 | lo strumento globale `~/.dotnet/tools/xrcopilotlab-bp` | **solo se la sua versione non è più vecchia** di quella che il plugin chiede; altrimenti lo ignora e lo dice |
| 3 | la copia già scaricata, in `${CLAUDE_PLUGIN_DATA}/bin/` (fuori da Claude Code: `~/.xrcopilotlab-bp/cache/bin/`) | se esiste il file `xrcopilotlab-bp-<versione>-<piattaforma>` |
| 4 | l'allegato della release `bp-v<versione>` | la prima volta: lo scarica (~52 MB) prima dal catalogo dei plugin, poi dal repository di prodotto come riserva |

La **versione** la decide il file `plugins/blueprints/bin/version.txt`, che oggi dice `2.17.0`: la
release cercata è quindi `bp-v2.17.0`. Il download passa da `gh` se sei autenticato, altrimenti da
un token in `GH_TOKEN` o `GITHUB_TOKEN`. Dopo il download l'avviatore **confronta l'impronta
SHA-256** con quella pubblicata accanto al binario, e se non corrisponde non lo esegue.

Se il download non riesce l'avviatore esce con **70** e dice quale delle tre cause è: non sei
autenticato su GitHub (`gh auth login`), il tuo account non legge il catalogo (va chiesto l'accesso),
oppure la release non ha il binario per la tua piattaforma (fatti passare il file e indicalo con
`XRCOPILOTLAB_BP_BIN`).

Le piattaforme pubblicate sono sei: `osx-arm64`, `osx-x64`, `win-x64`, `win-arm64`, `linux-x64`,
`linux-arm64`. Il binario è autonomo: non serve installare .NET.

### Che versione sto usando

```bash
xrcopilotlab-bp version            # numero, percorso del binario, piattaforma, origine
xrcopilotlab-bp version --verbose  # anche il runtime .NET
xrcopilotlab-bp --version          # solo il numero (anche -v), comodo in uno script
```

La riga **origine** dice da quale strada viene il binario: strumento globale, cache del plugin,
scaricato dalla release, indicato con `XRCOPILOTLAB_BP_BIN`, build locale, o copia installata a mano.
È la prima cosa da guardare quando un comando del manuale «non esiste».

### Aggiornare

Con il plugin, **aggiornare la CLI vuol dire aggiornare il plugin**: binario e skill vanno insieme.

```
/plugin marketplace update hevolus
/plugin update blueprints@hevolus
```

Quando esce una CLI più recente, al comando successivo l'avviatore scrive una riga sola, per esempio
`c'è la 2.18.0, il plugin chiede la 2.17.0. Aggiornalo con '/plugin update blueprints@hevolus'`. Il
controllo gira in secondo piano al massimo una volta al giorno e non può far fallire un comando.

Una copia **installata a mano** (senza plugin) si aggiorna con [`update`](#update).

---

## 2. Prima di cominciare: identità e ruoli

### Con quale account gira

La CLI non parla con Claude, parla con **Azure**. Serve un'identità nel tenant aziendale
**`hevolus.it`** (Entra ID), perché App Configuration, Key Vault, Cosmos e lo storage vivono nella
sottoscrizione di Hevolus. L'account con cui usi Claude non c'entra.

E **non è l'account con cui entri in XRCopilotLab**. Il prodotto usa un'altra directory, Azure AD
B2C (`xrcopilotlab.b2clogin.com`, email registrata o accesso con Google). Le due non si incontrano:

| | Chi **usa** XRCopilotLab | Chi **esegue** la CLI |
|---|---|---|
| Directory | Azure AD B2C (`xrcopilotlab.onmicrosoft.com`) | Entra ID aziendale (`hevolus.it`) |
| Identità | email registrata, o account Google | account `hevolus.it` |
| Serve a | chat, interfaccia, processi, compiti | leggere App Configuration e Key Vault, comandare l'API |

Due conseguenze pratiche:

- essere amministratore di un tenant XRCopilotLab **non** dà accesso alla CLI, e avere i ruoli Azure
  **non** fa entrare nel prodotto;
- gli indirizzi che scrivi nel manifest (membri dei ruoli, owner dei processi, destinatari delle
  approvazioni) sono **utenti del prodotto**, cercati nella directory B2C del tenant. Un collega con
  un ottimo account `hevolus.it` che non è mai entrato nel prodotto non è un membro valido: il piano
  si ferma con `BP062`.

### L'accesso: una volta per macchina

La CLI cerca prima una credenziale già presente sulla macchina — variabili d'ambiente, identità
gestita, Visual Studio, `az login` — e **solo se non trova niente, e solo in un terminale vero**,
apre il browser per farti accedere. Il token resta in cache (nome `xrcopilotlab-bp`): l'accesso si
fa una volta per macchina, non una per comando.

Quando la CLI la lancia un assistente, il terminale **non** c'è (ingresso e uscita sono rediretti) e
il browser non si apre: il primo accesso lo deve fare la persona, dal proprio terminale, con
`az login` oppure con un qualsiasi comando della CLI (`xrcopilotlab-bp environments`). Da lì in poi il
token vale anche per i comandi lanciati dall'assistente.

### I ruoli Azure, comando per comando

I ruoli si danno **sull'ambiente** (l'App Configuration e il Key Vault di staging, o di
produzione). Non servono ruoli su Cosmos, sullo storage o sull'API: le loro chiavi sono riferimenti a
Key Vault dentro App Configuration, e la CLI le risolve da lì.

| Per fare | Ruoli sulla tua utenza |
|---|---|
| `validate`, `external`, `test init`, `test validate`, `catalog publish --check`, `version`, `help` | **nessuno** — non toccano la rete |
| `suggest` | nessuno per la proposta; con i ruoli di lettura elenca anche i nomi dei modelli a catalogo |
| `environments` | *App Configuration Data Reader* (legge solo i nomi delle chiavi, mai i valori) |
| tutti gli altri comandi: `push`, `pull`, `plan`, `apply`, `status`, `rollback`, `delete`, `promote`, `test run`, `schedule`, `mcp`, `connections`, `instances`, `knowledge`, `secrets check`, … | **App Configuration Data Reader** e **Key Vault Secrets User** |
| in più, `secrets set` | **App Configuration Data Owner** e **Key Vault Secrets Officer** |
| in più, `apply` e `pipeline` di un manifest con una connessione `process:` (verso il webhook di un processo) | gli stessi due: l'apply salva in Key Vault la chiave del webhook appena creato, come farebbe `secrets set` |
| `update` | nessun ruolo Azure: serve `gh` autenticato su GitHub |

Non puoi darteli da solo: si chiedono a chi amministra la sottoscrizione, dicendo **quale ambiente**.
La richiesta già scritta e chi abilita chi: [§ L'accesso ad Azure](../../../docs/accesso-azure.md).
Il comando che ti dice dove puoi lavorare davvero, prima di cominciare, è
[`environments`](#environments).

---

## 3. Ambienti e tenant

Ogni comando che tocca la rete deve sapere **dove** lavorare: in quale ambiente (`--env`) e su quale
tenant (`--company`). Prima di scrivere qualcosa, la CLI lo annuncia sempre in una riga — e in
produzione in un riquadro rosso.

### `--env`: l'ambiente

Gli ambienti sono **dentro il binario**: non c'è niente da configurare.

| `--env` | Etichetta nel banner | App Configuration | Key Vault (per `secrets set`) | Tenant predefinito |
|---|---|---|---|---|
| `staging` | Staging | `appcs-xrcopilotlab-staging-01` | `kv-xrcopilotlab-stg-01` | `4da69cbc-d935-4050-f410-08d8392ca08f` |
| `prod` | PRODUZIONE | `appcs-xrcopilotlab-prod-01` | `kv-xrcopilotlab-prod-01` | nessuno: il tenant si sceglie sempre |

`preview` non esiste più (tolto il 22/09/2026): era un secondo nome della produzione, senza una
propria App Configuration. Se lo trovi citato, quella pagina è vecchia.

**Senza `--env`** la CLI cerca, risalendo dalla cartella corrente, il file
`src/XRCopilotLab/XRCopilotLab.Api/local.settings.json` di un clone del repository di prodotto, e ne
usa `AppConfigurationEndpoint`: è l'ambiente di **sviluppo**. Fuori da un clone — il caso normale per
chi usa il plugin — non c'è niente da cui dedurlo, e la CLI si ferma **prima** di collegarsi a
qualunque cosa con «Non è detto su quale ambiente lavorare. Indicarlo con --env» (uscita 1). Un
`--env` esplicito vince sempre sul `local.settings.json`.

Un `--env` che non è né `staging`, né `prod`, né il nome di un profilo scritto a mano viene rifiutato
con l'elenco dei nomi validi (uscita 1).

### `--company`: il tenant

Il tenant non si scrive a mano, si **sceglie per nome**. La CLI chiede a XRCopilotLab a quali tenant
appartieni tu — la stessa cosa che fa l'interfaccia dopo il login — e ti propone quelli:

```
  Per quale tenant, in Staging?

   1. Confindustria Como
   2. Studio Polis
   3. Hevolus Innovation

  Numero (1-3), oppure vuoto per annullare:
```

Le regole, nell'ordine in cui la CLI le applica:

1. **Da dove viene il tenant.** Dal più esplicito al più implicito: `--company` sulla riga di
   comando; poi `tenant.companyId` del manifest, ma **solo** per i comandi che leggono un file
   (`push`, `pipeline`, `secrets check`); poi il `companyId` di un profilo scritto a mano; per ultimo
   il tenant predefinito dell'ambiente, che c'è solo su staging. `plan`, `apply` e gli altri comandi
   che partono da un tag **non** leggono il manifest per scegliere il tenant.
2. **Su staging** senza `--company` si lavora sul tenant di prova
   (`4da69cbc-d935-4050-f410-08d8392ca08f`), e il comando lo dice: «Tenant non indicato: si usa quello
   predefinito di Staging».
3. **Se il tenant non è indicato** e l'elenco ne contiene uno solo, lo prende senza chiedere; se ne
   contiene più d'uno, chiede.
4. **Se non c'è un terminale** (la CLI lanciata da un assistente o da uno script) l'elenco viene
   stampato **con gli identificativi** e il comando si ferma con **6**: scegliere un tenant al posto di
   qualcuno non è una decisione automatica. Si ripete con `--company <id>` dopo che una persona ha
   scelto.
5. **In produzione** un tenant che non è fra i tuoi viene rifiutato con **3**, anche scritto a mano
   con `--company`. Viene rifiutato anche quando non si riesce a sapere chi sei: in produzione non
   poterlo stabilire è una ragione per fermarsi. Se dovresti esserci, non è un ruolo Azure che manca:
   chiedi di essere aggiunto a quel tenant **nel prodotto**.
6. **Fuori produzione**, un tenant indicato a mano che non è nel tuo elenco viene accettato con un
   avviso; se l'elenco non si riesce a leggere, la CLI ripiega su quello dell'ambiente (uguale per
   tutti) e lo dice.

> Il tenant `default` è la partizione del catalogo dei modelli,
> non un tenant: ogni comando lo rifiuta con 1 (vedi [`catalog`](#catalog-list--publish--install)).

### I profili scritti a mano

Servono **solo** per un ambiente che non è fra quelli incorporati, o per scavalcare un singolo valore.
Stanno in `~/.xrcopilotlab-bp/profiles.json` (percorso cambiabile con `XRCOPILOTLAB_BP_PROFILES`) e si
scelgono con lo stesso `--env <nome>`. Il file accetta commenti e virgole finali.

```jsonc
{
  "profiles": {
    "collaudo": {
      "appConfigurationEndpoint": "https://appcs-xrcopilotlab-staging-01.azconfig.io",
      "appConfigurationLabel": "api",
      "companyId": "4da69cbc-d935-4050-f410-08d8392ca08f",
      "actor": "nome.cognome@hevolus.it",
      "keyVaultUri": "https://kv-xrcopilotlab-stg-01.vault.azure.net/",

      // Solo per passare dalla gestione API (APIM) invece che dalla rotta interna:
      "apiUrl": "https://<gateway>/api/lab/",
      "apiKey": "env:XRCOPILOTLAB_BP_APIKEY",
      "apiVersion": "staging",

      // Solo per scavalcare ciò che c'è in App Configuration:
      "cosmos":  { "endpoint": "…", "key": "env:XRCOPILOTLAB_BP_COSMOS_KEY", "database": "…", "container": "blueprints" },
      "storage": { "connectionString": "env:XRCOPILOTLAB_BP_STORAGE", "container": "blueprints" },

      // Solo per usare il local.settings.json di un clone che non sta sopra la cartella corrente:
      "localSettingsPath": "/percorso/di/local.settings.json"
    }
  }
}
```

| Campo | A cosa serve | Se manca |
|---|---|---|
| `appConfigurationEndpoint` | l'App Configuration da cui si ricava tutto il resto | si prende dal `localSettingsPath`; se non c'è nemmeno quello, il comando si ferma |
| `appConfigurationLabel` | un'etichetta in più da leggere, dopo `api-ao`, `api` e quella vuota (lo stesso ordine dell'API). Serve anche a `secrets set`, che scrive il riferimento con questa etichetta | si leggono solo le tre etichette standard |
| `companyId` | il tenant da usare quando non è indicato altrove | vale il predefinito dell'ambiente, o la scelta da elenco |
| `actor` | il nome registrato come autore delle entità create e come **approvatore** nei run | il nome utente del sistema operativo |
| `keyVaultUri` | dove `secrets set` scrive il valore | quello dell'ambiente riconosciuto dall'endpoint (staging o prod); altrimenti `secrets set` si ferma |
| `apiUrl` + `apiKey` | passare dal gateway APIM con la chiave di sottoscrizione | si usa la **rotta interna** verso la Function App (`InternalApi:BaseUrl` e `InternalApi:FunctionKey` da App Configuration, header `x-functions-key`), che non richiede niente |
| `apiVersion` | il parametro `api-version` delle chiamate al gateway | la chiave `Environment` di App Configuration, altrimenti `staging` |
| `cosmos.endpoint`, `.key`, `.database`, `.container` | l'archivio dei blueprint in Cosmos | `Cosmos:Endpoint`, `Cosmos:PrimaryKey`, `Cosmos:DatabaseName`, `Cosmos:BlueprintsContainerName` da App Configuration; container `blueprints` |
| `storage.connectionString`, `.container` | lo storage dei manifest e dei file | `Storage:ConnectionString` o `StorageConnectionString` da App Configuration; container `blueprints` |
| `localSettingsPath` | il `local.settings.json` da cui leggere l'endpoint | cercato risalendo dalla cartella corrente, ma **solo** se non è stato passato `--env` |

Ogni valore si può scrivere direttamente o nella forma **`env:NOME`**, che lo legge dalla variabile
d'ambiente `NOME`: è la forma da usare per qualunque credenziale, così il file non ne contiene. Una
variabile citata e non impostata ferma il comando.

Tre cose che conviene sapere:

- **Un profilo con lo stesso nome di un ambiente incorporato lo sostituisce per intero**, non lo
  completa: un profilo `staging` senza `appConfigurationEndpoint` non sa più dove andare.
- **L'ambiente si riconosce dall'endpoint, non dal nome del profilo.** Un profilo chiamato
  «collaudo» ma puntato all'App Configuration di produzione viene annunciato come PRODUZIONE, ne
  eredita il Key Vault e le regole sui tenant. Il banner non può mentire.
- **Il Key Vault non si deduce dal nome.** Nella sottoscrizione esistono sia
  `kv-xrcopilotlab-staging` sia `kv-xrcopilotlab-stg-01`, e quello in uso è il secondo: scrivere nel
  primo non dà errori, semplicemente nessuno legge il segreto.

`environments` elenca i profili scritti a mano ma **non** li prova.

### Le variabili d'ambiente

| Variabile | Effetto |
|---|---|
| `XRCOPILOTLAB_BP_PROFILES` | percorso del file dei profili, al posto di `~/.xrcopilotlab-bp/profiles.json` |
| `XRCOPILOTLAB_BP_DEBUG` | con un valore qualsiasi, stampa la traccia completa degli errori imprevisti; in `environments`, il motivo vero di un «non raggiungibile» |
| `NO_COLOR` | con un valore qualsiasi, niente colori. Il colore si spegne comunque quando l'uscita non va a un terminale |
| `XRCOPILOTLAB_BP_BIN` | letta dall'avviatore del plugin: il binario da eseguire al posto di quello scaricato |
| `CLAUDE_PLUGIN_DATA` | impostata da Claude Code: dove l'avviatore tiene la cache del binario e delle note sulle versioni |
| `GH_TOKEN`, `GITHUB_TOKEN` | lette dall'avviatore: un token per scaricare la CLI quando `gh` non c'è |

---

## 4. Come si scrive un comando

```
xrcopilotlab-bp <comando> [<sottocomando>] [argomenti] [opzioni]
```

- **Il sottocomando viene subito dopo il comando**: `schedule list --tag X`, non
  `schedule --tag X list`. I comandi con sottocomando sono `secrets`, `test`, `schedule`, `mcp`,
  `connections`, `instances`, `knowledge` e `catalog`.
- **Opzioni con un valore**: `--tag COMO` oppure `--tag=COMO`, è lo stesso. Un valore che comincia
  con `--` non si può passare nella prima forma: usa la seconda.
- **Interruttori senza valore**: `--yes`, `--overwrite`, `--graph`, `--no-graph`, `--watch`,
  `--running`, `--remove`, `--full`, `--check`, `--with-entities`, `--with-files`, `--skip-external`,
  `--pending`, `--keep-people` e `--documents-reviewed`. Non si mangiano mai l'argomento che li segue: `push --overwrite file.yml`
  funziona.
- **Nomi delle opzioni senza distinzione fra maiuscole e minuscole.** I **tag** invece sono sempre in
  maiuscolo (`^[A-Z0-9]{2,20}$`).

> **Attenzione alle opzioni scritte male.** Solo `test` rifiuta un'opzione che non conosce (uscita 1,
> con l'elenco di quelle ammesse e, per `--profile`, il suggerimento «ora --env»); `suggest` la
> ignora con un avviso. **Tutti gli altri comandi la ignorano in silenzio.** Un `--compnay` scritto
> per `--company`, su staging, fa lavorare sul tenant di prova senza che niente lo segnali — tranne la
> riga del banner. Leggila sempre.

### Chi chiede conferma, e come

Nessun comando crea o cancella qualcosa sul tenant senza un sì. Ma il sì si dà in modi diversi, e la
differenza conta quando la CLI la lancia un assistente (niente terminale):

| Comando | Con un terminale | Senza terminale | Come si approva |
|---|---|---|---|
| `apply`, `pipeline` | mostra il piano e chiede `[s/N]` | si ferma con **6** | `--yes`, che resta registrato nel run con nome e ora |
| `rollback` | chiede `[s/N]` | **non fa niente ed esce con 0** («Annullato.») | `--yes` |
| `delete` | chiede di **scrivere il tag** | si ferma con **6** | `--confirm <TAG>`; `--yes` **non vale** |
| `promote` | chiede solo se la destinazione è la produzione | verso la produzione si ferma con **6**; altrove copia | `--yes` |
| `catalog publish`, `catalog install` | chiede sempre | in produzione si ferma con **6**; altrove procede | `--yes` |
| `knowledge reingest` | chiede `[s/N]` | si ferma con **6** | `--yes` |
| `instances cancel` | stampa l'elenco e si ferma con **6** — non chiede | idem | `--yes` |
| `mcp orphans --remove` | stampa l'elenco e si ferma con **6** — non chiede | idem | `--yes` |
| `schedule pause`/`resume`, `mcp publish`, `connections refresh`, `secrets set` | nessuna conferma: sono reversibili o sostituiscono un valore | idem | — |

Al terminale si risponde `s`, `si`, `sì` o `y`; qualunque altra cosa è un no.

**`--yes` non è una scorciatoia.** È la forma scritta di un'approvazione data da una persona che ha
letto il piano, e in `apply` finisce nel run insieme a chi l'ha dichiarata e a quando. Va usato dopo
quel sì, non per saltare la domanda.

### Aiuto

`xrcopilotlab-bp help` stampa l'elenco dei comandi e delle opzioni della versione che hai, ed esce con
0. Anche `--help` e `-h` lo stampano; `--help` da solo esce con 1, perché non è un comando.

---

## 5. Il giro tipico, con un esempio completo

L'ordine in cui si usano i comandi, dal file al tenant e ritorno:

```
validate → suggest → secrets check / secrets set → push → plan → apply → status → test run
                                                                     ↘ rollback / delete
e, fra archivi: pull · promote · export · catalog
```

| Passo | Comando | Cosa fa | Tocca il tenant? |
|---|---|---|---|
| 1 | `validate` | controlla il file, offline | no |
| 2 | `suggest` | propone come dividere i documenti e che modello dare agli agenti | no |
| 3 | `secrets check`, `secrets set` | dice quali segreti mancano; li salva in Key Vault | no (Key Vault e App Configuration sì) |
| 4 | `push` | registra la versione nell'archivio | no |
| 5 | `plan` | mostra cosa verrebbe creato, cosa manca, cosa si scontra | no, legge soltanto |
| 6 | `apply` | esegue il piano, dopo il sì | **sì** |
| 7 | `status` | l'esito, l'approvazione, l'inventario | no |
| 8 | `test run` | collauda agenti, orchestratori e processi | **sì**: apre conversazioni e istanze vere |
| — | `rollback`, `delete` | smonta ciò che un run ha creato; cancella l'archivio | **sì** |

`pipeline` fa i passi 1, 3 (solo la verifica), 4, 5 e 6 in un colpo.

### Esempio: il blueprint di Studio Polis, da zero a collaudato, su staging

Il file è `blueprints/studiopolis-agenda.yml`, tag `STUDIOPOLIS`. Lo si lancia dalla cartella del
progetto, perché i percorsi dei documenti nel manifest sono relativi al file.

**1. Il file è giusto?**

```bash
xrcopilotlab-bp validate blueprints/studiopolis-agenda.yml --graph
```

Stampa i rilievi (`!` avviso, `✗` errore), il numero di operazioni previste e il disegno dei
processi. Con errori esce **2**: si corregge e si rilancia. Il disegno va letto davvero: è il momento
in cui ci si accorge del caso che manca.

**2. Quali credenziali servono?**

```bash
xrcopilotlab-bp secrets check blueprints/studiopolis-agenda.yml --env staging
```

Per ogni riferimento del manifest dice `presente` o `assente`, e per quelli assenti stampa il comando
già scritto. Esce **3** se ne manca almeno uno.

**3. Salvare quelli che mancano** — il valore si digita, senza eco:

```bash
xrcopilotlab-bp secrets set --env staging --tag STUDIOPOLIS graph-client-id
xrcopilotlab-bp secrets set --env staging --tag STUDIOPOLIS graph-client-secret
```

Nel manifest questi segreti sono citati come `Blueprints:Secrets:STUDIOPOLIS:graph-client-id` e
`Blueprints:Secrets:STUDIOPOLIS:graph-client-secret`. Il valore vero non compare mai nel file, a video
o in una conversazione.

**4. Registrare la versione**

```bash
xrcopilotlab-bp push blueprints/studiopolis-agenda.yml --env staging
```

Scrive il testo del file e i documenti di knowledge nell'archivio di staging e stampa identificativo,
versione e impronta. Una versione già pubblicata non si riscrive: si alza `version:` nel file.

**5. Vedere il piano**

```bash
xrcopilotlab-bp plan --env staging --tag STUDIOPOLIS
```

L'elenco numerato delle operazioni, con i nomi già prefissati (`BP-STUDIOPOLIS-…`), il grafo dei
processi, gli avvisi e gli errori. Esce **0** se è applicabile, **3** se no. Se sul tenant c'è già una
versione applicata, si apre con «Aggiornamento della vN applicata» ed elenca solo ciò che cambia.

**6. Applicare** — dopo aver letto il piano:

```bash
xrcopilotlab-bp apply --env staging --tag STUDIOPOLIS
```

Ristampa il piano e chiede `Applicare N operazioni sul tenant …? [s/N]`. Da un assistente si ripete
con `--yes` solo dopo il sì di una persona. Alla fine stampa l'esito, i profili messi in
indicizzazione, le prove dei tool MCP, e — **una volta sola** — indirizzo e chiave dei webhook creati.

**7. Controllare**

```bash
xrcopilotlab-bp status --env staging                       # blueprint e ultime esecuzioni
xrcopilotlab-bp status --env staging --run 6cec85b3d6bb    # un run: chi ha approvato, cosa ha creato
```

**8. Collaudare**

```bash
xrcopilotlab-bp test validate blueprints/tests/studiopolis-agenda.tests.yml
xrcopilotlab-bp test run      blueprints/tests/studiopolis-agenda.tests.yml --env staging
```

Il report va in `blueprints/tests/reports/studiopolis/<data-ora>/`. Esce **7** se almeno un caso non
passa.

**9. Se la variante non va bene** — smontare quello che il run ha creato, oppure buttare via tutto:

```bash
xrcopilotlab-bp rollback --env staging --run 6cec85b3d6bb
xrcopilotlab-bp delete   --env staging --tag STUDIOPOLIS --confirm STUDIOPOLIS --with-entities
```

**10. Portarlo in produzione** — i passi, con le due cose che possono fermarti, sono in
[§ Da staging a produzione](../../../docs/da-staging-a-produzione.md). In breve: `promote` copia la
versione nell'archivio di produzione, poi `plan` e `apply` su `--env prod`, con la loro approvazione.

---

## 6. Riferimento dei comandi

Per ogni comando: a cosa serve, come si scrive, tutte le opzioni che il codice accetta, cosa fa passo
per passo, cosa scrive e dove, cosa chiede prima, con che numeri esce, esempi ed errori comuni.

**Le due opzioni di quasi tutti i comandi** non vengono ripetute nelle tabelle se non hanno un
comportamento particolare:

| Opzione | Valore | Significato |
|---|---|---|
| `--env <nome>` | `staging`, `prod` o un profilo | l'ambiente ([§ 3](#--env-lambiente)) |
| `--company <id>` | identificativo del tenant | il tenant ([§ 3](#--company-il-tenant)); senza, si sceglie da un elenco |

I comandi che lavorano su un blueprint **già applicato** (`schedule`, `mcp`, `connections`,
`instances`, `knowledge`) prendono gli identificativi delle entità dall'**inventario dell'ultimo run
completato** del tag, e accettano `--run <runId>` per sceglierne un altro. Se il tag non ha un run
completato sul tenant escono con **3**.

---

### `validate`

Controlla un manifest **senza toccare la rete**: struttura, chiavi doppie, riferimenti fra sezioni,
file di knowledge sul disco, grafo di ogni processo e di ogni orchestratore. Le regole del grafo sono
quelle del server, non una copia: ciò che passa qui passa anche lì.

```
xrcopilotlab-bp validate <file.yml> [--graph]
```

| Argomento / opzione | Valore | Default | Significato |
|---|---|---|---|
| `<file.yml>` | percorso | obbligatorio | il manifest |
| `--graph` | — | spento | stampa anche il disegno dei processi (attività, gateway, flussi) come lo stamperebbe `plan` |

**Cosa fa.** Legge il file, stampa blueprint, versione e tag, poi ogni rilievo con il suo codice
(`BP0xx`, [§ 8](#8-codici-dei-rilievi-bpxxx)) e il punto del file a cui si riferisce. Se non ci sono
errori calcola il piano **senza** lo stato del tenant — quindi senza collisioni — e dice quante
operazioni comporterebbe.

**Scrive:** niente. **Chiede:** niente. **Ruoli:** nessuno, funziona senza credenziali.

**Esce:** 0 valido (anche con avvisi) · 2 almeno un errore, oppure YAML illeggibile · 1 file che non
esiste.

```bash
xrcopilotlab-bp validate blueprints/test-agenda.yml
xrcopilotlab-bp validate blueprints/studiopolis-agenda.yml --graph
```

**Errori comuni.** `BP014` (nome già prefissato): nel file i nomi si scrivono senza `BP-<TAG>-`, lo
aggiunge il planner. `BP027` (file di knowledge non trovato): il percorso è relativo alla cartella del
manifest. `BP015` è solo un avviso: l'agente non dichiara `model` e nascerà sul modello predefinito.

---

### `suggest`

Propone come dividere i documenti fra i **profili di knowledge** — uno per agente — e quale **fascia
di modello** dare a ciascun agente. Stampa la sezione YAML da incollare nel manifest, dopo averla
decisa.

```
xrcopilotlab-bp suggest <file.yml> [--files <cartella>] [--env <nome>]
```

| Argomento / opzione | Valore | Default | Significato |
|---|---|---|---|
| `<file.yml>` | percorso | obbligatorio | il manifest, da cui legge gli agenti e il loro lavoro |
| `--files <cartella>` | percorso, relativo alla cartella del manifest se non è assoluto | i file già dichiarati in `knowledge` | i documenti da ripartire (i file che cominciano con `.` sono esclusi) |
| `--env <nome>` | ambiente | nessuno | legge il **catalogo dei modelli** per proporre i nomi, oltre alla fascia |

Qualunque altra opzione viene ignorata con un avviso.

**Cosa fa.** Per ogni documento stampa i fatti del nome; poi i **profili proposti, uno per agente**,
con i file assegnati dove il nome lo giustifica; poi i file **da assegnare a mano**; poi le note sui
vincoli (file che il selettore non saprà distinguere). Segue il blocco `knowledge:` da incollare, con
i file non assegnati come commenti, e i collegamenti `agents[<chiave>].knowledge`. Infine, per ogni
agente, il modello dichiarato, la fascia proposta, la ragione e i **segnali** su cui si basa (legge
documenti? chiama strumenti? riceve l'output di un altro passo?), e — con `--env` — i nomi a catalogo
in quella fascia.

**Scrive:** niente, né sul tenant né sul file. **Chiede:** niente.

**Esce:** 0 · 1 cartella inesistente · 2 manifest illeggibile. Se il catalogo non si legge (niente
`--env`, niente ruoli, rete) non fallisce: avvisa e propone la sola fascia.

```bash
xrcopilotlab-bp suggest blueprints/finlogic-bilancio-aggregato.yml --files test-data
xrcopilotlab-bp suggest blueprints/finlogic-bilancio-aggregato.yml --env staging   # critica la partizione esistente, con i nomi dei modelli
```

**Da sapere.** La fascia si ricava da segnali del manifest, non dal lavoro vero dell'agente: un
passo senza documenti né strumenti può essere il più difficile della catena. È una proposta da
confermare. Il perché del «un profilo per agente»: [manuale § 4-bis](manuale.md#4-bis-se-il-cliente-ha-dei-documenti).

---

### `secrets set`

Salva il valore di un segreto in **Key Vault** e ne registra il riferimento in **App Configuration**.
Il manifest cita solo il nome.

```
xrcopilotlab-bp secrets set --tag <TAG> <nome> [--from-env <VARIABILE>] [--env <nome>] [--company <id>]
```

| Argomento / opzione | Valore | Default | Significato |
|---|---|---|---|
| `<nome>` | nome logico del segreto | obbligatorio | per esempio `graph-client-secret`, `webhook-avvisi` |
| `--tag <TAG>` | tag del blueprint | obbligatorio | il blueprint a cui il segreto appartiene |
| `--from-env <VARIABILE>` | nome di una variabile d'ambiente | nessuno | legge il valore da quella variabile invece di chiederlo: per gli usi senza terminale |
| `--env <nome>` | ambiente | sviluppo, se sei in un clone | dove scrivere |
| `--company <id>` | tenant | scelto da elenco | il tenant a cui il segreto appartiene |

**Cosa fa.**

1. Chiede `Valore per Blueprints:Secrets:<TAG>:<nome>:` e lo legge **senza eco** (con l'ingresso
   rediretto, lo legge da lì). Un valore vuoto ferma il comando.
2. Scrive il valore in Key Vault — il vault dell'ambiente: `kv-xrcopilotlab-stg-01` o
   `kv-xrcopilotlab-prod-01`, oppure il `keyVaultUri` di un profilo.
3. Crea in App Configuration la chiave `Blueprints:Secrets:<companyId>:<TAG>:<nome>` (vedi sotto) come
   **riferimento** a quel segreto (non come valore), con l'etichetta del profilo se c'è.
4. Aggiorna la chiave **`Sentinel`**: le API ricaricano la configurazione — riferimenti compresi —
   solo quando cambia, entro cinque minuti. Un'API avviata in locale va invece riavviata.

> **I segreti sono del tenant.** Il comando chiede anche il tenant (con le regole del
> [§ 3](#--company-il-tenant)) e la chiave scritta in App Configuration è `Blueprints:Secrets:<companyId>:<TAG>:<nome>`. Il manifest continua a scrivere
> `Blueprints:Secrets:<TAG>:<nome>`: il tenant lo aggiunge la CLI. Serve perché due tenant che
> installano lo stesso modello con lo stesso tag non si sovrascrivano le credenziali. In lettura si
> cerca prima la chiave del tenant, poi quella senza tenant dei blueprint applicati prima della
> regola, che quindi continuano a funzionare. Un riferimento che nel manifest porta già il tenant è
> un errore (`BP103`).

**Scrive:** Key Vault e App Configuration dell'ambiente. Niente sul tenant, niente nell'archivio.
**Chiede:** solo il valore. **Ruoli:** *App Configuration Data Owner* e *Key Vault Secrets Officer*,
oltre a quelli di lettura.

**Esce:** 0 · 1 tag o nome mancanti, valore vuoto, variabile di `--from-env` non impostata, Key Vault
o App Configuration non scrivibili (il messaggio nomina il ruolo che manca), ambiente senza Key Vault
noto.

```bash
xrcopilotlab-bp secrets set --env staging --tag STUDIOPOLIS graph-client-secret
TOKEN_COMO=… xrcopilotlab-bp secrets set --env staging --tag COMO osm-token --from-env TOKEN_COMO
```

**Da sapere.**

- **Le connessioni già create non cambiano da sole.** Portano il valore che il segreto aveva quando
  il blueprint è stato applicato. Dopo un `secrets set` su un blueprint già applicato:
  [`connections refresh`](#connections-list--refresh), poi `mcp test`.
- **Se hai scambiato due valori**, quello giusto è ancora in Key Vault fra le versioni precedenti del
  segreto: non serve generarne uno nuovo.
- Il segreto del webhook di un processo, che l'apply lascia in Key Vault, si chiama
  `webhook-<chiave-del-processo>`.

---

### `secrets check`

Elenca i segreti che il manifest cita e dice quali mancano nell'ambiente.

```
xrcopilotlab-bp secrets check <file.yml> [--env <nome>] [--company <id>]
```

| Argomento / opzione | Valore | Default | Significato |
|---|---|---|---|
| `<file.yml>` | percorso | obbligatorio | il manifest |
| `--env`, `--company` | | | l'ambiente; il tenant (usato per cercare la chiave del tenant; qui si prende da `--company`, dal manifest, dal profilo o dal predefinito, **senza** elenco) |

**Cosa fa.** Raccoglie ogni riferimento `Blueprints:Secrets:…` del manifest, lo cerca fra le chiavi
di App Configuration, stampa `presente` o `assente` per ciascuno e, per gli assenti, il comando
`secrets set` già scritto. Non legge i valori.

**Scrive:** niente. **Esce:** 0 tutti presenti (o nessuno citato) · 3 almeno uno assente · 2 manifest
illeggibile.

```bash
xrcopilotlab-bp secrets check blueprints/studiopolis-agenda.yml --env staging
```

---

### `push`

Registra una **versione** del manifest nell'archivio dell'ambiente. Da qui in poi è applicabile da
chiunque, anche da un'altra macchina.

```
xrcopilotlab-bp push <file.yml> [--overwrite] [--env <nome>] [--company <id>]
```

| Argomento / opzione | Valore | Default | Significato |
|---|---|---|---|
| `<file.yml>` | percorso | obbligatorio | il manifest |
| `--overwrite` | — | spento | riscrive una versione già pubblicata. Serve per iterare; non ci sono altri limiti nel codice, quindi va usato sapendo che la versione precedente con quel numero sparisce |
| `--company <id>` | tenant | `tenant.companyId` del manifest, poi il profilo, poi predefinito o elenco | di quale tenant è l'archivio |

**Cosa fa.**

1. Valida il manifest come `validate`: con errori si ferma (2) e non scrive niente.
2. Annuncia ambiente e tenant.
3. Rifiuta una versione già pubblicata («Le versioni sono immutabili»), salvo `--overwrite`.
4. Scrive il **testo YAML così com'è**, commenti compresi, nello storage:
   `blueprints/<companyId>/<blueprint>/v<n>/manifest.yaml`.
5. Scrive il **manifest interpretato** nel container Cosmos `blueprints` (partizione = tenant), con
   tag, versione, impronta SHA-256 e percorso del blob.
6. Archivia accanto, in `files/`, i **documenti di knowledge** dichiarati nel manifest e trovati sul
   disco (e quelli di `agents[].files`): è ciò che permette a un collega di
   applicare la stessa versione senza avere la tua cartella.
7. Stampa identificativo, versione, tag, tenant, blob, SHA-256, quanti file ha archiviato e il
   comando `plan` da lanciare dopo.

**Scrive:** l'archivio (storage e Cosmos). **Niente sul tenant.** **Chiede:** niente.

**Esce:** 0 · 2 manifest non valido · 1 versione già pubblicata senza `--overwrite`, file inesistente.

```bash
xrcopilotlab-bp push blueprints/studiopolis-agenda.yml --env staging
xrcopilotlab-bp push blueprints/como-conoscenza-associati.yml --env staging --company <id-como>
```

**Da sapere.** `plan` e `apply` lavorano sulla versione **archiviata**, non sul file che hai sul
disco: una modifica al file non conta finché non fai un `push` con un numero di versione nuovo.

---

### `pull`

Riscrive su disco il manifest di una versione pubblicata, **com'era stato scritto**. Serve a
recuperare un file che non hai e a confrontare due ambienti con un `diff`.

```
xrcopilotlab-bp pull --tag <TAG> [--version <n>] [--out <file> | <file>] [--with-files] [--overwrite] [--env] [--company]
```

| Argomento / opzione | Valore | Default | Significato |
|---|---|---|---|
| `--tag <TAG>` | tag | obbligatorio | il blueprint |
| `--version <n>` | intero | la più recente | quale versione |
| `--out <file>` o primo argomento | percorso | `<blueprint>-v<n>.yml` nella cartella corrente | dove scriverlo; le cartelle mancanti si creano |
| `--with-files` | — | spento | scarica anche la knowledge archiviata con la versione, in `files/` accanto al manifest |
| `--overwrite` | — | spento | riscrive un file locale che esiste già |

**Cosa fa.** Trova la versione nell'archivio del tenant, scarica il testo e lo scrive. Stampa tag,
file, SHA-256 e, se la versione è arrivata lì da un'altra parte, da dove e quando («copiato da…»).
Con `--with-files` avvisa che i percorsi nel manifest sono quelli della macchina che fece il push, e
vanno riadattati prima di ripubblicare.

**Scrive:** solo file locali. **Esce:** 0 · 1 tag o versione che non esistono, file già presente,
`--version` non numerico.

```bash
xrcopilotlab-bp pull --env staging --tag COMO --out /tmp/como-staging.yml
xrcopilotlab-bp pull --env prod    --tag COMO --out /tmp/como-prod.yml
diff /tmp/como-staging.yml /tmp/como-prod.yml
```

---

### `export`

La direzione opposta di `apply`: scrive come manifest qualcosa che **esiste sul tenant**. Sul tenant
fa solo letture. Due forme.

#### `export <orchestratore>` — un orchestratore

```
xrcopilotlab-bp export <orchestratore> [--tag <TAG>] [--out <file>] [--overwrite] [--env] [--company]
```

| Argomento / opzione | Valore | Default | Significato |
|---|---|---|---|
| `<orchestratore>` | id o nome esatto | obbligatorio | l'orchestratore da esportare. Se due hanno lo stesso nome, va dato l'id |
| `--tag <TAG>` | tag | quello del nome, se è `BP-<TAG>-…` | il tag del manifest che nasce; obbligatorio per un orchestratore fatto a mano |
| `--out <file>` | percorso | `<blueprint>.yml` nella cartella corrente | dove scriverlo |
| `--overwrite` | — | spento | riscrive un file che esiste già |

Porta con sé gli agenti che gli step usano, il loro topic e i loro profili. Toglie il prefisso
`BP-<TAG>-` da nomi e chiavi (lo rimette il planner al push). **Non esce niente che appartenga alla
company d'origine**: credenziali delle action, destinatari delle approvazioni, connessioni, server
MCP ed endpoint AI restano fuori, e ogni omissione è un avviso. Il file si scrive comunque, poi si
valida.

**Esce:** 0 valido · 2 scritto ma con errori da completare (il caso tipico è un'approvazione senza
destinatari, `BP091`) · 1 orchestratore non trovato, nome ambiguo, tag non valido, file già presente.

```bash
xrcopilotlab-bp export "BP-COMO-Arricchimento report associato" --env staging --out export/como-arricchimento.yml
```

#### `export --scope …` — un tenant intero o una sua parte

```
xrcopilotlab-bp export --scope <ambito> [<oggetto>] --tag <TAG> [--out <cartella>] [--keep-people] [--overwrite] [--env] [--company]
```

| Argomento / opzione | Valore | Default | Significato |
|---|---|---|---|
| `--scope <ambito>` | `orchestrator`, `topic`, `blueprint`, `tenant` | — | cosa leggere; la sua presenza sceglie questa forma |
| `<oggetto>` | id o nome; per `blueprint` il tag | — | da dove partire (non serve con `tenant`) |
| `--tag <TAG>` | tag | per `--scope blueprint`, l'oggetto stesso | il tag del manifest che nasce |
| `--out <cartella>` | percorso | `export-<tag>` | la cartella dei tre file |
| `--keep-people` | — | spento | lascia gli indirizzi veri di membri, owner e destinatari invece dei segnaposto |
| `--overwrite` | — | spento | riscrive una cartella che contiene già un manifest |

| Ambito | Da dove parte |
|---|---|
| `orchestrator <id\|nome>` | l'orchestratore, nel topic dei suoi agenti |
| `topic <id\|nome>` | agenti, profili e agent task del topic, e gli orchestratori fatti solo dei suoi agenti |
| `blueprint <TAG>` | ciò che l'ultimo run completato del blueprint ha creato, con le chiavi del manifest originale |
| `tenant` | tutto; possibile solo se il tenant ha **un topic solo** |

Scrive nella cartella `manifest.yml` (il manifest), `export-report.md` (ciò che il manifest non
porta e va completato) e `secrets.txt` (i riferimenti ai segreti, con il comando `secrets set` già
scritto). Ciò da cui le entità dipendono entra da sé, e il rapporto dice chi l'ha fatto entrare.
**Nessun valore segreto esce**: le credenziali diventano riferimenti, le chiavi generate dalla
piattaforma si rigenerano all'import. Le persone escono come `persona-N@segnaposto.invalid`, salvo
`--keep-people`.

**Esce:** 0 · 2 scritto ma con errori · 1 ambito sconosciuto, tag mancante o non valido, ambito
impossibile da rispettare (un orchestratore con agenti in più topic, un tenant con più topic),
cartella già usata.

```bash
xrcopilotlab-bp export --scope blueprint STUDIOPOLIS --env staging
xrcopilotlab-bp export --scope topic "Agenda di Studio" --tag LEGAL --env staging --out export-legal
```

---

### `promote`

Copia una versione pubblicata **da un archivio a un altro**: da staging a produzione, dalla
produzione a staging per riprodurre un caso, o da un cliente a un altro nello stesso ambiente.

```
xrcopilotlab-bp promote --tag <TAG> [--version <n>] [--from-env <e>] [--to-env <e>] [--from-company <id>] [--to-company <id>] [--overwrite] [--yes]
```

| Opzione | Valore | Default | Significato |
|---|---|---|---|
| `--tag <TAG>` | tag | obbligatorio | il blueprint, nell'archivio d'origine |
| `--version <n>` | intero | la più recente all'origine | quale versione copiare |
| `--from-env <e>` | ambiente | quello di `--env` | l'ambiente d'origine |
| `--to-env <e>` | ambiente | lo stesso dell'origine | l'ambiente di destinazione |
| `--from-company <id>` | tenant | `--company`, poi profilo o predefinito, poi elenco | il tenant d'origine |
| `--to-company <id>` | tenant | profilo o predefinito dell'ambiente di destinazione, poi elenco | il tenant di destinazione |
| `--env`, `--company` | | | alias di `--from-env` e `--from-company` |
| `--overwrite` | — | spento | sostituisce una versione che alla destinazione esiste con un contenuto diverso |
| `--yes` | — | spento | approva la copia verso la produzione |

**Cosa fa.**

1. Annuncia **origine e destinazione**, ciascuna con il suo banner, prima di leggere qualcosa. Il
   tenant di destinazione passa dagli stessi controlli di ogni altro comando: in produzione, solo i
   tuoi (altrimenti 3).
2. Se origine e destinazione sono lo stesso archivio e lo stesso tenant, si ferma: non c'è niente da
   copiare (1).
3. Confronta le impronte: se alla destinazione la versione **non c'è**, copia; se c'è **identica**,
   non scrive niente ed esce 0 (la copia è ripetibile); se c'è **diversa**, si ferma (1), salvo
   `--overwrite`.
4. Elenca i segreti che la destinazione non ha, con il comando per impostarli: non blocca.
5. Verso la **produzione** chiede conferma; senza terminale serve `--yes` (altrimenti 6).
6. Copia il testo **byte per byte** (lo SHA-256 resta lo stesso: è la prova che in produzione gira
   ciò che è stato collaudato) e i documenti archiviati con la versione. Registra da dove arriva.

**Non viaggiano**: i run, gli inventari, le approvazioni, i `.bpmn` esportati dall'apply, i valori
dei segreti. **Sul tenant di destinazione non viene creato niente**: dopo servono `plan` e `apply`. Il
`tenant.companyId` scritto nel manifest non viene corretto: comanda `--company` al momento del
`plan`.

**Esce:** 0 copiato o già identico · 1 stesso indirizzo, versione diversa senza `--overwrite` · 3
tenant rifiutato in produzione · 6 produzione senza approvazione.

```bash
# staging → produzione (i companyId dei due ambienti sono diversi: sono directory diverse)
xrcopilotlab-bp promote --tag STUDIOPOLIS --version 30 \
    --from-env staging --to-env prod --to-company <id-prod>

# produzione → staging, per riprodurre un caso
xrcopilotlab-bp promote --tag STUDIOPOLIS --from-env prod --from-company <id-prod> --to-env staging

# da un cliente a un altro, nello stesso ambiente
xrcopilotlab-bp promote --env staging --tag LEGAL --from-company <cliente-A> --to-company <cliente-B>
```

---

### `catalog list | publish | install`

Il **catalogo** dei blueprint pronti, curati da Hevolus e installabili da qualunque tenant. Vive
nello stesso archivio, nella partizione `default`, che non è un tenant: nessun altro comando ci lavora.

#### `catalog list`

```
xrcopilotlab-bp catalog list [--company <id>] [--env <nome>]
```

| Opzione | Default | Significato |
|---|---|---|
| `--company <id>` | nessuno | dice anche che cosa ha installato quel tenant, e se nel catalogo c'è una versione più nuova |

Stampa l'ultima versione di ogni modello, con tag, data, descrizione e cosa crea (agenti, processi,
orchestratori…). Scrive niente. Esce 0.

#### `catalog publish`

```
xrcopilotlab-bp catalog publish <modello.yml> [--documents-reviewed] [--check] [--overwrite] [--yes] [--env <nome>]
```

| Argomento / opzione | Default | Significato |
|---|---|---|
| `<modello.yml>` | obbligatorio | il manifest del modello |
| `--documents-reviewed` | spento | dichiara di aver rivisto l'origine dei documenti di knowledge del modello: senza, un modello con documenti è rifiutato (`BP104`) |
| `--check` | spento | fa solo il controllo, **senza rete e senza scrivere**: il modo di provare una bozza |
| `--overwrite` | spento | riscrive una versione già nel catalogo |
| `--yes` | spento | approva la pubblicazione |

Controlla che il file sia davvero un **modello** — nessun tenant (`BP100`), nessuna persona o email
(`BP101`), ruoli citati esistenti (`BP102`), segreti senza tenant (`BP103`), documenti rivisti
(`BP104`) — e che, installato per finta, sia un manifest valido. Poi chiede conferma e scrive nel
catalogo, con chi l'ha pubblicato e chi ha rivisto i documenti. **È riservato a Hevolus**: scrive
nella partizione che ogni tenant legge.

**Esce:** 0 · 2 non è un modello · 6 senza approvazione (al terminale: risposta no; senza terminale:
solo in produzione).

#### `catalog install`

```
xrcopilotlab-bp catalog install <modello> [--version <n>] [--tag <TAG>] [--topic <nome> | --existing-topic <nome>] [--members "<ruolo>=<email>,…;…"] [--yes] [--overwrite] [--env] [--company]
```

| Argomento / opzione | Default | Significato |
|---|---|---|
| `<modello>` | obbligatorio | l'identificativo del modello (da `catalog list`) |
| `--version <n>` | l'ultima | quale versione del modello |
| `--tag <TAG>` | quello del modello, o dell'installazione precedente | il tag con cui installarlo; non può essere già di un altro blueprint del tenant (3) |
| `--topic <nome>` | quello del modello, o dell'installazione precedente | il topic da creare |
| `--existing-topic <nome>` | — | un topic già presente da riusare, al posto di `--topic` |
| `--members "…"` | quelli dell'installazione precedente | le persone di ogni ruolo: `referente=a@studio.it,b@studio.it;segreteria=c@studio.it` |
| `--yes` | spento | approva la copia **e** salta le domande sulle persone al terminale |
| `--overwrite` | spento | riscrive una versione già presente nell'archivio del tenant |

Al terminale, per ogni ruolo rimasto senza persone, chiede le email; un ruolo a cui il modello
indirizza dei passi non può restare vuoto (`BP105`). Una seconda installazione dello stesso modello
riparte dalle scelte della prima: è così che si **aggiorna**. Copia la versione nell'archivio del
tenant (con un'intestazione che dice da dove viene), elenca le credenziali da impostare con
`secrets set` e il `plan` da lanciare dopo. **Sul tenant non crea niente.**

**Esce:** 0 · 1 modello o versione che non esistono, `--members` scritto male · 2 scelte non valide ·
3 tag già usato · 6 senza approvazione.

```bash
xrcopilotlab-bp catalog list    --env staging --company 4da69cbc-d935-4050-f410-08d8392ca08f
xrcopilotlab-bp catalog publish blueprints/catalogo/legal-agenda.yml --check
xrcopilotlab-bp catalog install legal-agenda --env staging --tag LEGAL \
    --members "referente=avvocato@esempio.it;segreteria=segreteria@esempio.it"
```

---

### `plan`

Mostra cosa verrebbe creato, cosa manca e cosa si scontra, **senza modificare niente**. Il piano che
vedi è lo stesso oggetto che `apply` esegue, con i nomi già prefissati.

```
xrcopilotlab-bp plan --tag <TAG> [--version <n>] [--no-graph] [--env] [--company]
```

| Opzione | Valore | Default | Significato |
|---|---|---|---|
| `--tag <TAG>` | tag | obbligatorio | il blueprint pubblicato |
| `--version <n>` | intero | la più recente | quale versione |
| `--no-graph` | — | spento | non stampa il disegno dei processi |

**Cosa fa.**

1. Trova la versione nell'archivio del tenant (se non c'è: «Pubblicarlo con push», 1).
2. **Preflight**: legge dal tenant i nomi occupati, le skill a catalogo, gli utenti, i modelli, gli
   endpoint AI, i topic, i segreti presenti — e i server MCP del catalogo per
   `kind: existing`.
3. Se sul tenant c'è un **run completato dello stesso blueprint**, il piano diventa un
   **aggiornamento** (vedi [`apply`](#una-versione-nuova-sopra-una-già-applicata)): le entità di
   quel run non sono collisioni.
4. Stampa titolo, tenant, le operazioni numerate (in un aggiornamento: «Aggiornamento della vN
   applicata», le entità che restano come sono e, per ciascuna modifica, cosa cambia), il grafo dei
   processi, gli **avvisi** e gli **errori**.

**Scrive:** niente. **Chiede:** niente.

**Esce:** 0 applicabile · 3 bloccato (collisioni `BP060`, skill `BP061`, utenti `BP062`, segreti
`BP063`, topic `BP064`, modelli `BP065`, endpoint `BP066`, modifiche impossibili sul posto `BP067`,
server MCP esistenti non trovati `BP069`) · 1 tag o versione inesistenti.

```bash
xrcopilotlab-bp plan --env staging --tag STUDIOPOLIS
xrcopilotlab-bp plan --env prod --tag COMO --company <id-prod> --no-graph
```

---

### `apply`

Esegue il piano sul tenant, **dopo l'approvazione**, registrando in un **run** tutto ciò che crea.

```
xrcopilotlab-bp apply --tag <TAG> [--version <n>] [--resume <runId>] [--yes] [--no-graph] [--env] [--company]
```

| Opzione | Valore | Default | Significato |
|---|---|---|---|
| `--tag <TAG>` | tag | obbligatorio | il blueprint pubblicato |
| `--version <n>` | intero | la più recente | quale versione |
| `--resume <runId>` | id di un run | nessuno | riprende un run interrotto: ciò che è già in inventario non è una collisione e non si rifà |
| `--yes` | — | spento | l'approvazione, data da una persona che ha letto il piano |
| `--no-graph` | — | spento | non stampa il disegno dei processi |

**Cosa fa, passo per passo.**

1. Annuncia ambiente e tenant (in produzione con il riquadro rosso).
2. Carica la versione archiviata; con `--resume` carica il run da riprendere, altrimenti ne prepara
   uno nuovo (identificativo di 12 caratteri).
3. Costruisce e **stampa il piano**, come `plan`. Se è bloccato si ferma con 3; se è un aggiornamento
   che non ha niente da fare, lo dice ed esce con 0 senza creare un run.
4. **Chiede l'approvazione**: `Applicare N operazioni sul tenant …? [s/N]`. Senza terminale e senza
   `--yes` si ferma con 6; con una risposta no, si ferma con 6 e non crea niente.
5. Registra nel run **chi ha approvato, quando e come** (a video o con `--yes`). Chi ha approvato è il
   `actor`: il campo del profilo, altrimenti il nome utente del sistema operativo.
6. Esegue le operazioni una per una, stampando `[i/N] descrizione — esito`. Ogni entità creata entra
   **subito** nell'inventario: se qualcosa si ferma a metà, ciò che era stato creato è registrato ed
   è smontabile.
7. Alla fine stampa: quante entità ha creato (o, in un aggiornamento, quante create e quante
   aggiornate, con le modifiche); i **profili messi in indicizzazione** («l'indicizzazione prosegue
   dopo la fine di questo comando»); le **prove dei tool MCP** (un tool che non risponde non ferma
   l'apply, ma va letto); i riferimenti non risolti nei processi; i diagrammi archiviati; e i
   **webhook creati** con indirizzo, `hookId` e chiave — **mostrati una volta sola**.

**Se si ferma a metà:** il run resta `Failed` con l'errore e l'inventario di ciò che è stato creato,
e il comando stampa le due strade: `--resume <runId>` oppure `rollback --run <runId>`.

**Scrive:** il tenant (topic, profili e documenti, ruoli e membri, agenti con skill e server MCP,
connessioni, server MCP, orchestratori, agent task con le loro schedulazioni e uscite, processi
pubblicati con webhook); l'archivio (il run, con inventario e approvazione; i `.bpmn` esportati); Key
Vault e App Configuration per la chiave del webhook di un processo, quando una connessione `process:`
la usa (segreto `webhook-<processo>`): per questo, in quel caso, l'apply vuole anche i ruoli di
scrittura di `secrets set`.

**Esce:** 0 · 3 piano bloccato, o run registrato da una CLI più recente in uno stato sconosciuto · 4
esecuzione fallita a metà · 6 approvazione mancante · 1 tag, versione o run inesistenti.

```bash
xrcopilotlab-bp apply --env staging --tag STUDIOPOLIS
xrcopilotlab-bp apply --env staging --tag STUDIOPOLIS --yes                       # dopo il sì di una persona
xrcopilotlab-bp apply --env staging --tag STUDIOPOLIS --yes --resume 790b20470820 # riprende un run interrotto
```

#### Una versione nuova sopra una già applicata

Dalla CLI 2.15.0, se sul tenant c'è un **run completato** dello stesso blueprint, `plan` e `apply`
portano la versione nuova **sopra** quella applicata (#1126), dopo la stessa approvazione:

- **si crea** ciò che la versione nuova aggiunge: agenti, skill assegnate, server MCP, step;
- **si aggiorna sul posto** ciò che il blueprint ha creato ed è cambiato, confrontandolo con il
  **tenant** (non con il file precedente): degli agenti istruzioni, descrizione, temperatura e
  modello; degli orchestratori step, flussi, passaggi di dati e messaggio di benvenuto (id e link di
  chat restano gli stessi); degli agent task prompt e descrizione (pianificazione e
  uscite restano come sono);
- **resta com'è** tutto il resto, e il piano dice quante entità sono: i profili non si
  reindicizzano, i processi BPM non si aggiornano sul posto;
- **non si cancella niente**: ciò che la versione nuova non dichiara più è un avviso **`BP068`** e
  resta sul tenant; ciò che non si può fare sul posto — un'entità dell'inventario che sul tenant non
  c'è più, file nuovi su un profilo già indicizzato — ferma il piano con **`BP067`**.

Un nome occupato da qualcosa che il blueprint **non** ha creato resta una collisione (`BP060`), anche
se si chiama `BP-<TAG>-…`: il confine è l'inventario, non il prefisso.

All'esecuzione le entità del run di partenza **passano al run nuovo**, che da lì è quello da
riprendere, collaudare o smontare; il run di partenza resta come storico, nello stato `Superseded`.

---

### `pipeline`

Tutte le fasi in fila, da un file a un blueprint applicato.

```
xrcopilotlab-bp pipeline <file.yml> [--overwrite] [--yes] [--no-graph] [--resume <runId>] [--skip-external] [--env] [--company]
```

| Argomento / opzione | Default | Significato |
|---|---|---|
| `<file.yml>` | obbligatorio | il manifest |
| `--overwrite` | spento | passato al push: riscrive la versione se è già pubblicata |
| `--yes` | spento | approva il piano |
| `--no-graph` | spento | non stampa il grafo |
| `--resume <runId>` | nessuno | riprende un run interrotto |
| `--skip-external` | spento | salta la sesta fase |
| `--company <id>` | come `push`: il manifest conta | il tenant |

**Le sei fasi.** 1 **validazione** (errori → 2); 2 **segreti** (ne manca uno → 3, con i comandi
`secrets set`); 3 **push**; 4 **piano** con la richiesta di approvazione (bloccato → 3, non approvato
→ 6); 5 **apply**; 6 **risorse esterne**: niente, se il manifest non ne dichiara o si ottengono in
forma nativa; se c'è un ingresso push (`ingress.kind: logicapp`), il run passa in «passo manuale» e
il comando rimanda a `external`.

**Esce:** come le fasi. **Attenzione:** la fase 3 è un `push`, quindi una versione già pubblicata
ferma la pipeline con 1 — si alza `version:` o si usa `--overwrite`. A differenza di `apply`, il piano
della pipeline usa i documenti della cartella locale.

```bash
xrcopilotlab-bp pipeline blueprints/test-agenda.yml --env staging
xrcopilotlab-bp pipeline blueprints/test-agenda.yml --env staging --yes --skip-external
```

---

### `status`

L'elenco dei blueprint e delle esecuzioni, oppure il dettaglio di un'esecuzione.

```
xrcopilotlab-bp status [--run <runId>] [--watch] [--env] [--company]
```

| Opzione | Default | Significato |
|---|---|---|
| `--run <runId>` | nessuno | il dettaglio di quel run |
| `--watch` | spento | con `--run`: rilegge ogni 3 secondi finché il run non è concluso |

**Senza `--run`**: i blueprint pubblicati sul tenant (tag, identificativo, versione, data) e le ultime
20 esecuzioni (id, tag, versione, stato, data, numero di entità).

**Con `--run`**: stato; chi l'ha avviato e quando; chi l'ha **approvato**, quando e come (a video o con
`--yes`) — o l'avviso che il run non registra alcuna approvazione; l'errore; le fasi; l'inventario
(tipo, nome, azione: `Created`, `Adopted`, `Retained`).

Gli stati di un run: `Pending`, `Running`, `Completed`, `Failed`, `AwaitingManualStep`, `RolledBack`,
`Superseded`. Un run in uno stato che la tua CLI non conosce compare come «sconosciuto»: l'ha scritto
una versione più recente, e va aggiornata la CLI prima di riprenderlo o smontarlo.

**Scrive:** niente. **Esce:** 0 · con `--run`: 4 se il run è fallito, 5 se è fermo su un passo
manuale · 1 run inesistente.

```bash
xrcopilotlab-bp status --env staging
xrcopilotlab-bp status --env staging --run 790b20470820 --watch
```

---

### `environments`

Su quali ambienti **la tua utenza** può lavorare davvero, prima di cominciare.

```
xrcopilotlab-bp environments [--env <nome>]
```

| Opzione | Default | Significato |
|---|---|---|
| `--env <nome>` | tutti | prova un ambiente solo (solo `staging` o `prod`: i profili non si provano) |

Per ogni ambiente prova a leggere i **nomi** delle chiavi della sua App Configuration con la tua
credenziale — lo stesso permesso che serve a tutto il resto — e dice uno di quattro esiti:

| Esito | Vuol dire | Cosa fai |
|---|---|---|
| **accessibile** | la lettura è riuscita | lavori; per staging aggiunge che senza `--company` si usa il tenant di prova, per la produzione che si lavora solo sui tuoi tenant |
| **manca il ruolo 'App Configuration Data Reader'** | sei autenticato, ma senza il ruolo | lo chiedi a chi amministra la sottoscrizione |
| **nessun accesso ad Azure su questa macchina** | nessuna credenziale | fai l'accesso una volta, da un terminale |
| **non raggiungibile adesso** | rete, DNS, endpoint | riprovi; non è un permesso (il motivo vero con `XRCOPILOTLAB_BP_DEBUG=1`) |

Elenca anche i profili scritti a mano, senza provarli. Non tocca Key Vault e non legge valori.
**Non** dice quali tenant vedrai dentro un ambiente: quello lo decide la tua appartenenza ai tenant
nel prodotto.

**Esce:** 0 almeno un ambiente accessibile · 3 nessuno · 1 nome sconosciuto.

```bash
xrcopilotlab-bp environments
xrcopilotlab-bp environments --env prod
```

---

### `rollback`

Smonta ciò che un run ha creato, leggendo l'inventario **a ritroso**.

```
xrcopilotlab-bp rollback --run <runId> [--yes] [--env] [--company]
```

| Opzione | Default | Significato |
|---|---|---|
| `--run <runId>` | obbligatorio | il run da smontare |
| `--yes` | spento | conferma senza chiedere |

**Cosa fa.** Si ferma se il run l'ha scritto una CLI più recente (3), o se è `Superseded`: in quel
caso le entità sono passate a un run successivo, e il comando dice quale smontare (3). Altrimenti
elenca le entità che il run ha **creato** (quelle adottate perché già presenti non sono sue e restano),
chiede `Procedere con la rimozione? [s/N]`, e le rimuove. Un fallimento su un'entità non ferma le
altre; il run viene salvato con l'inventario aggiornato. Dalla fine di settembre 2026 toglie anche la
pubblicazione dei server MCP dal catalogo, prima del server.

**Attenzione: senza terminale e senza `--yes` non fa niente ed esce con 0** («Annullato.»). Un
assistente deve leggere l'uscita, non solo il numero.

**Scrive:** il tenant (rimozioni) e il run. **Esce:** 0 completato o annullato · 4 rollback parziale ·
3 run superato o di una CLI più recente · 1 run inesistente.

```bash
xrcopilotlab-bp rollback --env staging --run 790b20470820
```

---

### `delete`

Cancella un blueprint dall'**archivio**: le versioni del manifest in Cosmos, i file nello storage (i
`.bpmn` esportati compresi) e i run che lo riguardano. Cancellando il blueprint intero toglie anche le
sue suite e i suoi report di collaudo, e il piano li elenca. Con `--with-entities` smonta **prima** il
tenant.

```
xrcopilotlab-bp delete --tag <TAG> --confirm <TAG> [--version <n>] [--with-entities] [--blueprint <id>] [--env] [--company]
```

| Opzione | Default | Significato |
|---|---|---|
| `--tag <TAG>` | obbligatorio, salvo `--blueprint` | il blueprint da cancellare |
| `--blueprint <id>` | nessuno | l'identificativo del blueprint, quando due condividono il tag |
| `--confirm <TAG>` | nessuno | la conferma: si scrive **il tag** del blueprint. `--yes` non vale |
| `--version <n>` | tutte | cancella una versione sola, con i suoi run |
| `--with-entities` | spento | rimuove dal tenant le entità ancora vive, poi cancella l'archivio |

**Cosa fa.**

1. Si ferma prima di toccare qualcosa se un run è di una CLI più recente (3).
2. Stampa il piano della cancellazione: versioni, run (con quante entità hanno ancora sul tenant),
   entità da rimuovere, rilievi.
3. Se trova **entità vive** e manca `--with-entities`, si ferma con **3** (`BP080`) e indica le due
   strade: `rollback --run <runId>` prima, oppure `--with-entities`. Si ferma anche su un run ancora
   in corso (`BP081`) o su una versione che non esiste (`BP082`).
4. Stampa un **riquadro rosso** con ciò che sparisce e la riga che conta: non esiste un annulla.
5. Chiede di **scrivere il tag** (`tag>`), oppure lo prende da `--confirm`. Un tag diverso ferma tutto:
   è il caso per cui la regola esiste — il comando di un altro blueprint riusato con una modifica sola.
6. Con `--with-entities`: **prima il tenant, poi l'archivio**. Se un'entità non si rimuove, esce con 4
   e lascia l'archivio dov'è, con l'inventario aggiornato a ciò che resta.

**Scrive:** il tenant (con `--with-entities`) e l'archivio. **Esce:** 0 cancellato o niente da
cancellare · 3 bloccato · 4 smontaggio parziale · 6 conferma mancante o sbagliata · 1 tag o
blueprint inesistenti.

```bash
xrcopilotlab-bp delete --env staging --tag STUDIOPOLIS2 --confirm STUDIOPOLIS2                  # solo l'archivio
xrcopilotlab-bp delete --env staging --tag STUDIOPOLIS2 --confirm STUDIOPOLIS2 --with-entities  # anche il tenant
xrcopilotlab-bp delete --env staging --tag STUDIOPOLIS2 --confirm STUDIOPOLIS2 --version 2      # una versione sola
```

---

### `external`

Dice che cosa resta da fare **fuori** dalla piattaforma per un manifest che dichiara `external` — e
quasi sempre la risposta è «niente».

```
xrcopilotlab-bp external <file.yml>
```

Nessuna opzione, nessuna rete. Stampa casella, accesso, ingresso e gruppo di risorse dichiarati, poi
i rilievi della sezione (`BP050`–`BP052`: `BP052` indica la forma nativa da usare al posto di
`external`).

- Senza `external`, o con un ingresso che la piattaforma sa fare da sé (connessione + server MCP +
  agent task schedulato verso il webhook di un processo): lo dice ed esce **0** (o **2** se la sezione
  ha errori).
- Con un ingresso **push** (`ingress.kind: logicapp`, reagire nell'istante in cui arriva la posta):
  elenca i passi manuali — creare la Logic App, autorizzare il connettore Office 365 accedendo alla
  casella, aggiungere la chiamata al webhook — ed esce **5**.

```bash
xrcopilotlab-bp external blueprints/studiopolis-agenda.yml
```

---

### `test init`

Scrive lo **scheletro della suite di collaudo** a partire dal manifest.

```
xrcopilotlab-bp test init <file.yml> [--out <file>] [--overwrite]
```

| Argomento / opzione | Default | Significato |
|---|---|---|
| `<file.yml>` | obbligatorio | il manifest |
| `--out <file>` | `tests/<nome>.tests.yml` accanto al manifest | dove scrivere |
| `--overwrite` | spento | riscrive una suite esistente (una suite scritta non si sovrascrive con uno scheletro) |

Crea un caso positivo e uno negativo per agente, uno per orchestratore e uno per processo, con le
attese già deducibili dal manifest; le domande e le risposte attese da scrivere sono segnate `TODO`.
Nessuna rete. **Esce:** 0 · 1 file già presente · 2 manifest illeggibile.

```bash
xrcopilotlab-bp test init blueprints/studiopolis-agenda.yml    # → blueprints/tests/studiopolis-agenda.tests.yml
```

---

### `test validate`

Verifica una suite **senza rete**: struttura, segnaposto, contraddizioni, e — con il manifest — i
riferimenti a entità, skill, file, attività e campi del modulo di avvio.

```
xrcopilotlab-bp test validate <suite.yml> [--manifest <file.yml>]
```

| Argomento / opzione | Default | Significato |
|---|---|---|
| `<suite.yml>` | obbligatorio | la suite |
| `--manifest <file.yml>` | quello accanto alla cartella della suite (`tests/x.tests.yml` → `x.yml`) | il manifest contro cui verificare i riferimenti; senza, i riferimenti non si verificano e il comando lo dice |

I rilievi hanno codici `BT0xx` (tra cui `BT023`, per `expect.pausesAt`). **Esce:** 0 ·
2 errori.

```bash
xrcopilotlab-bp test validate blueprints/tests/studiopolis-agenda.tests.yml
```

---

### `test run`

Esegue la suite **sul tenant** e scrive il report.

```
xrcopilotlab-bp test run <suite.yml> [--tag <TAG>] [--only <k1,k2>] [--run <runId>] [--version <n>] [--out <cartella>] [--env] [--company]
```

| Argomento / opzione | Default | Significato |
|---|---|---|
| `<suite.yml>` | obbligatorio | la suite |
| `--tag <TAG>` | il `tag` della suite | il blueprint da collaudare |
| `--only <k1,k2>` | tutti i casi | i casi da eseguire: un valore combacia con la **chiave** del caso, con uno dei suoi **tag** o con il suo **target** (l'entità) |
| `--run <runId>` | l'ultimo run completato del tag | da quale inventario prendere le entità |
| `--version <n>` | la più recente | quale versione pubblicata usare per verificare i riferimenti |
| `--out <cartella>` | `blueprints/tests/reports/<tag>/<aaaammgg-hhmmss>/`, **relativa alla cartella da cui lanci il comando** | dove scrivere il report |

Solo `test` rifiuta le opzioni che non conosce: un `--profile` al posto di `--env` ferma il comando
invece di collaudare l'ambiente sbagliato.

**Cosa fa.** Verifica i soli casi selezionati contro il manifest pubblicato (con errori: 2). Trova le
entità dall'inventario del run; se il tag non ha un run completato ma il manifest è pubblicato, le
cerca per nome qualificato `BP-<TAG>-…`. Esegue i casi uno per uno, stampando esito, durata, i
controlli non passati e il **componente sospetto** (knowledge graph, skill, orchestrazione, processo,
webapp, manifest, ambiente). I casi esclusi da `--only` compaiono nel report come saltati. Alla fine:
`passati/totale · falliti · in errore · saltati`, e l'avviso sui casi con risposta attesa in prosa,
che resta da giudicare.

**Scrive:** sul tenant, **attività vere**: ogni domanda apre una conversazione, un caso su un processo
avvia un'istanza, e consuma token del tenant. Sul disco `report.json` (tutto, con le evidenze) e
`report.md` (da leggere). La cartella dei report contiene risposte e id del tenant: non va committata.
Il report va anche **nell'archivio del tenant**, accanto a quelli lanciati dalla chat dei blueprint, e
la CLI ne stampa il `reportId` per [`test reports --compare`](#test-reports). Se l'archivio non si
può scrivere lo dice e va avanti: il report su disco c'è già.

**Esce:** 0 tutti passati · **7** almeno un caso fallito o in errore · 2 suite non valida · 3 nessun
run e nessun manifest pubblicato, o run indicato inesistente.

```bash
xrcopilotlab-bp test run blueprints/tests/studiopolis-agenda.tests.yml --env staging
xrcopilotlab-bp test run blueprints/tests/studiopolis-agenda.tests.yml --env staging --only agenda,process
```

**Da sapere.** Le istanze lasciate da un collaudo si ripuliscono con
[`instances cancel`](#instances-list--show--cancel). Il formato della suite, gli esiti e i codici
`BT0xx`: [il riferimento del collaudo](../skills/xrcopilotlab-blueprint-test/references/testing.md).
Su un tenant di un cliente la suite non si lancia di propria iniziativa.

---

### `test push`

Porta una suite **nell'archivio del tenant**, accanto al manifest del suo tag. Serve perché la chat
dei blueprint della webapp legga una suite scritta nel repository.

```
xrcopilotlab-bp test push <suite.yml> [--tag <TAG>] [--env] [--company]
```

| Argomento / opzione | Default | Significato |
|---|---|---|
| `<suite.yml>` | obbligatorio | la suite |
| `--tag <TAG>` | il `tag` della suite | il blueprint accanto a cui archiviarla |

Verifica la suite contro il manifest pubblicato: una suite con errori non entra. Un testo identico
all'ultima versione non crea una versione nuova, e il comando lo dice.

**Scrive:** solo l'archivio dei blueprint, mai le entità del tenant. **Esce:** 0 · 2 suite non valida ·
3 il tenant non ha un manifest pubblicato con quel tag.

```bash
xrcopilotlab-bp test push blueprints/tests/studiopolis-agenda.tests.yml --env staging
```

---

### `test reports`

Elenca i **report archiviati** di un tag, quelli lanciati da terminale e quelli lanciati dalla chat.
Con `--compare` confronta un report con il precedente della stessa suite.

```
xrcopilotlab-bp test reports --tag <TAG> [--compare <reportId>] [--env] [--company]
```

| Opzione | Default | Significato |
|---|---|---|
| `--tag <TAG>` | obbligatorio | il blueprint |
| `--compare <reportId>` | nessuno | confronta quel report, caso per caso, con il precedente della stessa suite |

Senza `--compare` mostra gli ultimi 30 report: id, data, canale (`cli` o chat), stato, passati sul
totale, suite e versione, chi l'ha lanciato e se è stato giudicato. Con `--compare` scrive, per ogni
caso, se è **migliorato**, **peggiorato** o **invariato**. Avvisa quando le due esecuzioni non hanno
usato lo stesso testo della suite, e segna i casi in cui le risposte a un orchestratore sono state
date a mano. È il modo di verificare una correzione o un aggiornamento della libreria.

**Scrive:** niente. **Esce:** 0 · 1 report non trovato nell'archivio del tag.

```bash
xrcopilotlab-bp test reports --tag STUDIOPOLIS --env staging
xrcopilotlab-bp test reports --tag STUDIOPOLIS --env staging --compare 0123456789ab
```

---

### `schedule list | pause | resume | logs`

Le **schedulazioni** degli agent task creati dal blueprint. Servono quando una fonte non è pronta —
una casella che nessuno controlla, credenziali da correggere — e un task che gira ogni pochi minuti
produce un errore a ogni giro (e, se l'esito va a un processo, un caso nuovo a ogni giro).

```
xrcopilotlab-bp schedule list --tag <TAG> [--run <runId>] [--env] [--company]
xrcopilotlab-bp schedule pause  <task> --tag <TAG> [--run <runId>] [--env] [--company]
xrcopilotlab-bp schedule resume <task> --tag <TAG> [--run <runId>] [--env] [--company]
xrcopilotlab-bp schedule logs   <task> --tag <TAG> [--last <n>] [--run <runId>] [--env] [--company]
```

| Argomento / opzione | Default | Significato |
|---|---|---|
| `<task>` | obbligatorio per `pause`, `resume`, `logs` | la chiave del manifest (`agentTasks[].key`), il nome, o il nome qualificato `BP-<TAG>-…` |
| `--tag <TAG>` | obbligatorio | il blueprint |
| `--run <runId>` | l'ultimo run completato | da quale inventario prendere i task |
| `--last <n>` | 10 (fra 1 e 100) | in `logs`, quante esecuzioni mostrare |

- **`list`** — per ogni task schedulato: stato (attivo / in pausa), espressione cron, fuso, prossima
  esecuzione.
- **`pause`** / **`resume`** — mette in pausa o riprende. È **idempotente**: la CLI legge prima lo
  stato e cambia solo se serve (`pause` su un task già in pausa non lo riaccende). Non tocca il
  manifest né l'inventario: il cron resta, e `resume` riprende dall'orario successivo.
- **`logs`** — la **quota giornaliera** del task (dichiarata con `executionPolicy`, altrimenti il
  default della piattaforma, 100), la stima dei giri al giorno del cron (con l'avviso se la supera,
  `BP029`), e le ultime esecuzioni con esito, durata ed estratto dell'output o dell'errore. Se lo
  scheduler avanza ma l'ultima esecuzione registrata è ferma da più di un'ora e mezza, su un task che
  gira più di 24 volte al giorno, lo dice: i giri in mezzo sono stati **saltati** (quota esaurita o
  worker fermo). Le esecuzioni saltate per quota non lasciano altra traccia.

**Scrive:** solo `pause`/`resume`, lo stato della schedulazione sul tenant. **Chiede:** niente.
**Esce:** 0 · 4 lo stato non è cambiato · 3 nessun run completato, task sparito dal tenant · 1 task
non trovato (l'errore elenca quelli presenti), `--last` fuori intervallo.

```bash
xrcopilotlab-bp schedule list                        --tag STUDIOPOLIS --env staging
xrcopilotlab-bp schedule pause  sorveglianza-posta   --tag STUDIOPOLIS --env staging
xrcopilotlab-bp schedule logs   sorveglianza-posta   --tag STUDIOPOLIS --env staging --last 30
```

---

### `mcp check | orphans | publish | test`

I **server MCP** che il blueprint ha creato, visti da dove li vede un agente in chat. Un server vive in
tre posti: la **definizione** nel Builder, la **pubblicazione** nel catalogo del tenant (la riga che
l'agente carica) e i **collegamenti** agente → catalogo. Se ne manca uno, l'agente risponde «non ho
accesso allo strumento» senza nessun errore.

```
xrcopilotlab-bp mcp check --tag <TAG> [--run <runId>] [--env] [--company]
xrcopilotlab-bp mcp orphans --tag <TAG> [--remove [--yes]] [--env] [--company]
xrcopilotlab-bp mcp publish <server> --tag <TAG> [--run <runId>] [--env] [--company]
xrcopilotlab-bp mcp test <server> --tag <TAG> [--tool <nome>] [--args <json>] [--full] [--run <runId>] [--env] [--company]
```

| Argomento / opzione | Sottocomando | Default | Significato |
|---|---|---|---|
| `<server>` | `publish`, `test` | obbligatorio | la chiave del manifest (`mcpServers[].key`), il nome, o `BP-<TAG>-…` |
| `--tag <TAG>` | tutti | obbligatorio | il blueprint |
| `--run <runId>` | `check`, `publish`, `test` | l'ultimo run completato | da quale inventario |
| `--remove` | `orphans` | spento | cancella le voci orfane che nessun agente carica |
| `--yes` | `orphans` | spento | con `--remove`, la conferma |
| `--tool <nome>` | `test` | il `testTool` del manifest | quale strumento esercitare |
| `--args <json>` | `test` | i `testArguments` del manifest, altrimenti `{}` | gli argomenti, in JSON |
| `--full` | `test` | spento | la risposta intera, invece che troncata a 1.200 caratteri |

- **`check`** — per ogni server del run: la definizione nel Builder (quanti tool, se attiva); il
  catalogo, letto dal gateway come lo legge la chat (quanti tool, o «non raggiungibile»); e, per ogni
  agente collegato in inventario, se in chat lo carica davvero. Esce **0** se tutto coincide, **4**
  altrimenti, con il suggerimento di `mcp publish`.
- **`orphans`** — il caso opposto: voci del catalogo con il prefisso `BP-<TAG>-` il cui server **non
  esiste più** nel Builder (lasciate dai rollback di prima di fine settembre 2026), e quali agenti le
  caricano, in **tutti** i topic. Non serve un run. Senza `--remove` elenca soltanto (0). Con
  `--remove` cancella solo le orfane che nessun agente carica; senza `--yes` si ferma con **6**; se i
  collegamenti di qualche agente non si sono letti, non cancella niente (**3**).
- **`publish`** — ripubblica il server nel catalogo con lo stesso id, così i collegamenti tornano a
  risolversi. **Ruota la chiave del gateway**: quella precedente smette di valere. Esce 4 se il server
  non è pubblicabile o se l'id pubblicato non è quello che i collegamenti citano (in quel caso la
  strada è rifare `apply`).
- **`test`** — esercita uno strumento e stampa la **risposta grezza** del sistema esterno (per esempio
  l'errore `AADSTS…` di Microsoft Entra), senza passare dal modello. È l'evidenza che manca quando
  l'agente dice «errore di autorizzazione». Esce 0 con una risposta, 4 se lo strumento risponde con un
  errore.

**Scrive:** `publish` (catalogo MCP del tenant), `orphans --remove --yes` (cancella voci del catalogo);
`test` esegue lo strumento, che di norma — il `testTool` — è in sola lettura, ma con `--tool` puoi
chiamarne uno che scrive: scegli con attenzione.

```bash
xrcopilotlab-bp mcp check           --tag STUDIOPOLIS --env staging
xrcopilotlab-bp mcp publish m365    --tag STUDIOPOLIS --env staging
xrcopilotlab-bp mcp test    m365    --tag STUDIOPOLIS --env staging
xrcopilotlab-bp mcp test    m365    --tag STUDIOPOLIS --env staging --tool posta_in_arrivo --args '{"da":"2026-09-24T20:30:00Z"}' --full
xrcopilotlab-bp mcp orphans         --tag STUDIOPOLIS --env staging --remove --yes
```

> Un server dichiarato `kind: existing` (#1194) non è creato dal blueprint: è un
> server già nel catalogo del tenant, che il blueprint collega agli agenti. Il preflight lo cerca per
> `mcpId` o per nome, e se non lo trova — o il nome non basta — il piano si ferma con **`BP069`**.

---

### `connections list | refresh`

Le **connessioni** che il blueprint ha creato, e il loro riallineamento ai segreti correnti.

```
xrcopilotlab-bp connections list --tag <TAG> [--run <runId>] [--env] [--company]
xrcopilotlab-bp connections refresh [<connessione>] --tag <TAG> [--run <runId>] [--env] [--company]
```

| Argomento / opzione | Default | Significato |
|---|---|---|
| `<connessione>` | tutte | in `refresh`, la chiave del manifest, il nome o `BP-<TAG>-…` |
| `--tag <TAG>` | obbligatorio | il blueprint |
| `--run <runId>` | l'ultimo run completato | da quale inventario |

Una connessione porta i segreti **risolti** al momento dell'apply. Correggere un segreto con
`secrets set` corregge App Configuration, **non** la connessione.

- **`list`** — per ogni connessione: chiave, nome, provider, indirizzo base e tipo di autenticazione;
  per quelle verso un processo (`process:`), il webhook e il segreto `webhook-<processo>`.
- **`refresh`** — ricostruisce configurazione e busta di autenticazione dal manifest pubblicato e dai
  segreti **come sono ora**, con la stessa costruzione dell'apply, e aggiorna la connessione **senza
  cambiarne l'id**: server MCP e agenti non se ne accorgono, e l'effetto è immediato. Una connessione
  verso un processo prende l'indirizzo dal webhook com'è oggi sul tenant e la chiave dal segreto
  `webhook-<processo>`: se il webhook è stato rigenerato dall'interfaccia, prima `secrets set` con la
  chiave nuova, poi `refresh`.

**Scrive:** `refresh` aggiorna le connessioni sul tenant. **Chiede:** niente. **Esce:** 0 · 4 almeno
una non riallineata · 3 nessun run completato · 1 connessione non trovata, segreto mancante.

```bash
xrcopilotlab-bp connections list          --tag STUDIOPOLIS --env staging
xrcopilotlab-bp connections refresh       --tag STUDIOPOLIS --env staging   # tutte
xrcopilotlab-bp connections refresh graph --tag STUDIOPOLIS --env staging   # una sola
```

Dopo il `refresh`, la verifica è `mcp test <server>`.

---

### `instances list | show | cancel`

Le **istanze** dei processi creati dal blueprint, viste dal motore: dove sta ogni pratica, senza
aprire l'interfaccia.

```
xrcopilotlab-bp instances list --tag <TAG> [--running] [--last <n>] [--run <runId>] [--env] [--company]
xrcopilotlab-bp instances show <id> --tag <TAG> [--run <runId>] [--env] [--company]
xrcopilotlab-bp instances cancel <id> --tag <TAG> [--yes] [--run <runId>] [--env] [--company]
xrcopilotlab-bp instances cancel --tag <TAG> --running [--since <data>] [--contains <testo>] [--process <nome>] [--yes] [--run] [--env] [--company]
```

| Argomento / opzione | Sottocomando | Default | Significato |
|---|---|---|---|
| `<id>` | `show`, `cancel` | — | l'id dell'istanza, anche solo l'inizio (come lo stampa `list`) |
| `--tag <TAG>` | tutti | obbligatorio | il blueprint |
| `--run <runId>` | tutti | l'ultimo run completato | da quale inventario prendere i processi |
| `--running` | `list`, `cancel` | spento | solo le istanze in corso; in `cancel` senza id è **obbligatorio** |
| `--last <n>` | `list` | 20 (fra 1 e 500) | quante istanze per processo, le più recenti |
| `--since <data>` | `cancel` in blocco | — | solo quelle avviate da quella data o data e ora, in UTC (`2026-09-24`, `2026-09-24T18:00`) |
| `--contains <testo>` | `cancel` in blocco | — | solo quelle il cui testo (dell'avviso o della riga di designazione) lo contiene |
| `--process <nome>` | `cancel` in blocco | — | solo i processi con quel nome (anche parziale) o quella chiave |
| `--yes` | `cancel` | spento | la conferma |

- **`list`** — per ogni processo: quante istanze; per ciascuna avvio, id (8 caratteri), stato, **nodo
  e stato del token** (`verifica:waiting`, `assegna:waiting` = aspetta una persona), fonte, tipo, un
  estratto del testo, e l'errore se c'è.
- **`show`** — stato, avvio, token; gli **eventi** in ordine; i **compiti** con chi li ha presi; i
  **dati del caso**. Se l'ultimo evento è un `AgentTaskDispatched` fermo da più di due minuti, lo dice:
  è un difetto noto (issue #1000), e rimanda a `schedule logs`.
- **`cancel`** — annulla un'istanza, o in blocco le istanze **in corso** che passano i filtri (serve
  almeno uno fra `--since`, `--contains`, `--process`). Solo istanze dei processi del blueprint: l'id
  di un'istanza di un processo fatto a mano viene rifiutato (3). Stampa sempre l'elenco; **senza
  `--yes` si ferma con 6**, anche al terminale. L'annullamento passa dall'API, che registra chi l'ha
  chiesto, e il motore lo esegue in coda.

**Scrive:** solo `cancel`. **Esce:** 0 · 3 istanza non del blueprint, nessun run · 4 alcune non
annullate · 6 `cancel` senza `--yes` · 1 filtri mancanti, data non valida, prefisso ambiguo.

```bash
xrcopilotlab-bp instances list   --tag STUDIOPOLIS --env staging --running
xrcopilotlab-bp instances show   5fcbbcc6 --tag STUDIOPOLIS --env staging
xrcopilotlab-bp instances cancel --tag STUDIOPOLIS --env staging --running --contains "Collaudo"          # prima l'elenco
xrcopilotlab-bp instances cancel --tag STUDIOPOLIS --env staging --running --contains "Collaudo" --yes    # poi, dopo averlo letto
```

---

### `knowledge list | reingest`

I **profili di knowledge** che il blueprint ha creato, lo stato di indicizzazione dei loro file, e la
richiesta di reindicizzarli — quando la libreria della knowledge cambia il modo di leggere un file e
ciò che era già indicizzato va rifatto.

```
xrcopilotlab-bp knowledge list [<profilo>] --tag <TAG> [--run <runId>] [--env] [--company]
xrcopilotlab-bp knowledge reingest <profilo> --tag <TAG> [--only <file1,file2>] [--pending] [--yes] [--run <runId>] [--env] [--company]
```

| Argomento / opzione | Sottocomando | Default | Significato |
|---|---|---|---|
| `<profilo>` | `list` facoltativo, `reingest` obbligatorio | tutti | la chiave del manifest o il nome del profilo |
| `--tag <TAG>` | tutti | obbligatorio | il blueprint |
| `--run <runId>` | tutti | l'ultimo run completato | da quale inventario |
| `--only <file,…>` | `reingest` | tutti i file del profilo | solo questi file (nome con o senza percorso), separati da virgola |
| `--pending` | `reingest` | spento | solo i file che non risultano indicizzati (`completed`): la ripresa di una reindicizzazione rimasta a metà |
| `--yes` | `reingest` | spento | la conferma |

- **`list`** — per ogni profilo: quanti file e quanti per stato di indicizzazione, con gli id di
  profilo e topic.
- **`reingest`** — **non indicizza da sé**: per ogni file chiede alla piattaforma la stessa cosa del
  pulsante dell'interfaccia, che lo toglie dal grafo e lo rimette in coda. Lo esegue il worker
  dell'ambiente, con la **sua** libreria — così nel database non finiscono dati prodotti da una
  versione diversa da quella in esercizio. Finché un file non è rifatto, **manca dalle risposte**
  degli agenti che usano il profilo. Chiede conferma (senza terminale serve `--yes`, altrimenti 6);
  stampa l'avanzamento ogni 25 file; se qualcuno viene rifiutato, stampa l'`--only` per ripetere solo
  quelli.

**Scrive:** `reingest` mette in coda le reindicizzazioni. **Esce:** 0 · 4 alcuni file rifiutati · 6
senza conferma · 3 nessun run, profilo sparito · 1 profilo non trovato o ambiguo, nessun file.

```bash
xrcopilotlab-bp knowledge list              --tag COMO --env staging
xrcopilotlab-bp knowledge reingest bilanci  --tag COMO --env staging
xrcopilotlab-bp knowledge reingest bilanci  --tag COMO --env staging --pending --yes
```

---

### `version`

Quale CLI sta girando e da dove viene. Vedi il [§ 1](#che-versione-sto-usando).

```
xrcopilotlab-bp version [--verbose]
xrcopilotlab-bp --version        # oppure -v: solo il numero
```

Nessuna rete. Esce 0.

---

### `update`

Porta all'ultima versione **la copia installata a mano** — l'unica di cui questo comando è padrone.
Per le altre dice che cosa fare e non tocca niente.

```
xrcopilotlab-bp update [--check]
```

| Opzione | Default | Significato |
|---|---|---|
| `--check` | spento | dice cosa farebbe e si ferma: né scarica né sostituisce |

| Da dove viene la copia (lo dice `version`) | Cosa fa `update` |
|---|---|
| copia installata a mano | scarica l'ultima release `bp-v*` per la tua piattaforma, **verifica l'impronta** e la mette al posto di questa |
| cache del plugin | non la tocca: dice di usare `/plugin update blueprints@hevolus`, perché lì binario e skill vanno insieme |
| strumento globale `dotnet tool` | dice di toglierlo (`dotnet tool uninstall --global xrcopilotlab-bp`): quel pacchetto non è pubblicato da nessuna parte |
| build compilata qui | niente: la versione la decide chi compila |

Serve `gh` autenticato su un account che legge il catalogo (o, come riserva, il repository di
prodotto). Senza, dice che non ha potuto sapere qual è l'ultima versione ed esce 0. Il binario
vecchio viene rimosso solo a sostituzione riuscita; se qualcosa va storto, viene rimesso al suo posto.
**Esce:** 0 · 4 download fallito o impronta non corrispondente.

---

### `help`

```
xrcopilotlab-bp help
```

L'elenco dei comandi e delle opzioni **della versione che hai installata**, con il percorso del file
dei profili. È il riferimento più affidabile quando questa guida e il tuo binario non coincidono.

---

## 7. Codici di uscita

Distinti perché uno script — o una skill di Claude — possa reagire senza interpretare i messaggi.

| Codice | Vuol dire | Cosa fai |
|---|---|---|
| `0` | Fatto. Attenzione: anche `rollback` annullato e `update` senza `gh` escono 0 | leggi l'ultima riga per esserne sicuro |
| `1` | Uso sbagliato: argomento o opzione obbligatoria mancante, file o tag che non esistono, ambiente non indicato o sconosciuto, versione già pubblicata, configurazione incompleta | leggi il messaggio: dice quale |
| `2` | Il manifest (o la suite, o il modello) non è valido | correggi i rilievi `✗` e rilancia `validate` |
| `3` | Bloccato: il piano ha errori (collisioni, skill, utenti, segreti, modelli mancanti), segreti mancanti in `secrets check`, nessun ambiente accessibile, tenant rifiutato in produzione, nessun run completato del tag, entità ancora vive in `delete`, run registrato da una CLI più recente | risolvi la causa elencata; per il tenant in produzione chiedi di essere aggiunto al tenant nel prodotto; per il run più recente aggiorna la CLI |
| `4` | Un'esecuzione è fallita a metà: `apply`, `rollback` o `delete` parziali, `mcp check` con rilievi, uno strumento MCP che risponde errore, connessioni non riallineate, istanze non annullate, file rifiutati, `status` di un run fallito | leggi l'errore; per `apply`, `--resume <runId>` oppure `rollback --run <runId>` |
| `5` | Fermo su un passo manuale: `external` con ingresso push, `status` di un run in quello stato | fai i passi che il comando elenca |
| `6` | Manca una decisione umana: piano non approvato, tenant non scelto senza terminale, conferma di `delete` mancante o sbagliata, `promote`/`catalog` verso la produzione senza `--yes`, `instances cancel`, `mcp orphans --remove` o `knowledge reingest` senza `--yes` | fai leggere l'uscita a una persona; solo dopo il suo sì, ripeti con `--yes`, `--company <id>` o `--confirm <TAG>` |
| `7` | `test run` è arrivato in fondo e almeno un caso non è passato | leggi il report: non è un errore della CLI, è l'esito del collaudo |
| `70` | Errore imprevisto — oppure, dall'avviatore del plugin, il download della CLI non è riuscito | rilancia con `XRCOPILOTLAB_BP_DEBUG=1` e manda la traccia al team; per il download, i tre casi del [§ 1](#chi-la-installa-il-plugin) |

Ctrl+C interrompe il lavoro in corso lasciando che il comando chiuda il run in modo pulito, ed esce
con 4 («Interrotto»).

---

## 8. Codici dei rilievi `BPxxx`

Ogni rilievo di `validate`, `suggest`, `plan`, `apply`, `delete` e `catalog` porta un codice
**stabile**: il messaggio si può riscrivere, il codice no. La **gravità non sta nel codice** ma nel
punto in cui nasce: lo stesso codice può essere errore in un caso e avviso in un altro (`BP091`,
`BP093`, `BP095`). Un errore (`✗`) ferma; un avviso (`!`) no, ma quasi sempre indica qualcosa che
risponderà male o non verrà applicato.

| Codice | Vuol dire |
|---|---|
| **Intestazione** | |
| `BP001` | Il tag manca o non rispetta `^[A-Z0-9]{2,20}$` |
| `BP002` | L'identificativo del blueprint manca o non è uno slug valido |
| `BP003` | La versione del manifest non è valida |
| `BP004` | Manca il tenant o il suo `companyId` |
| `BP005` | Il manifest non crea niente |
| `BP006` | `extends` è dichiarato ma non ancora applicato |
| `BP007` | Il topic è indicato in più modi insieme |
| **Struttura delle sezioni** | |
| `BP010` | Una voce non ha la chiave |
| `BP011` | Due voci della stessa sezione hanno la stessa chiave |
| `BP012` | Una voce non ha il nome |
| `BP013` | Due voci producono lo stesso nome |
| `BP014` | Il nome porta già il prefisso `BP-<TAG>-`: nel file va scritto senza |
| `BP015` | Avviso: l'agente non dichiara `model` e nascerà sul modello predefinito |
| `BP016` | Una descrizione è più lunga di quanto il database accetti: l'apply si fermerebbe sul tenant |
| `BP017` | Lo stesso nome di file è dichiarato con due tipi o due percorsi fra `agents[].files` e `knowledge[].files`: il secondo caricamento sovrascriverebbe il primo. Dai al file dell'agente un `name` suo |
| **Riferimenti fra sezioni** | |
| `BP020` | Un riferimento punta a una chiave che non esiste |
| `BP021` | Un agent task deve puntare a un agente **oppure** a un orchestratore |
| `BP022` | Un processo si descrive con `spec` **oppure** con `bpmnFile` |
| `BP023` | Il file BPMN indicato non esiste |
| `BP024` | Il trigger dell'agent task non è fra quelli ammessi |
| `BP025` | Manca un campo richiesto dal trigger (per esempio il cron) |
| `BP026` | Un'uscita dell'agent task è incompleta o di tipo ignoto |
| `BP027` | Un file di knowledge non c'è sul disco o ha un formato rifiutato |
| `BP028` | La divisione dei file fra i profili risponderà male (profilo condiviso, multi-file su un passo alimentato, profilo che nessuno interroga) |
| `BP029` | Il cron produce più esecuzioni al giorno della quota: il task si ferma a metà giornata senza errore |
| **Processi** | |
| `BP030` | La specifica del processo non supera il validatore della piattaforma |
| `BP031` | Il processo cita un ruolo che il manifest non crea |
| `BP032` | Il processo cita un agent task che il manifest non crea |
| `BP033` | Il processo cita un sotto-processo che il manifest non crea |
| **Connessioni e MCP** | |
| `BP040` | Tipo di autenticazione non supportato |
| `BP041` | Manca un campo richiesto dall'autenticazione |
| `BP042` | Modalità del server MCP non valida |
| `BP043` | Manca un campo richiesto dalla modalità del server MCP |
| `BP044` | Il tool di test non esiste fra i tool del server |
| `BP045` | Una connessione `process:` cita un processo inesistente o senza webhook, o porta anche `baseUrl`/`auth` |
| `BP046` | `promptMode` non valido, o dichiarato su un server senza `systemPrompt` |
| **Risorse esterne** | |
| `BP050` | La sezione `external` è incompleta o incoerente |
| `BP051` | L'ingresso non punta a un webhook di processo esistente |
| `BP052` | Ciò che è in `external` si fa in forma nativa: scritto lì non verrebbe applicato |
| **Preflight (leggono il tenant)** | |
| `BP060` | Un nome è già occupato da un'entità che il blueprint non ha creato: il piano non parte |
| `BP061` | La skill citata non è nel catalogo del tenant |
| `BP062` | L'utente citato non esiste nel tenant (è un utente del prodotto, non un'identità Azure) |
| `BP063` | Il segreto citato non esiste in App Configuration |
| `BP064` | Il topic da riusare non esiste |
| `BP065` | Il modello citato non è nel catalogo del tenant |
| `BP066` | L'endpoint AI citato non esiste fra quelli della company |
| `BP067` | In un aggiornamento, una modifica non si può fare sul posto (entità sparita dal tenant, file nuovi su un profilo già indicizzato) |
| `BP068` | Avviso: un'entità del blueprint che la versione nuova non dichiara più; resta sul tenant |
| `BP069` | Un server MCP `kind: existing` non è nel catalogo del tenant, o il nome non basta a trovarlo |
| `BP070` | Sezione dichiarata ma non ancora applicata |
| **Cancellazione** | |
| `BP080` | Il blueprint ha ancora entità vive sul tenant: l'archivio non si cancella |
| `BP081` | Un run è ancora in corso |
| `BP082` | La versione indicata non è pubblicata su questo tenant |
| **Orchestratori** | |
| `BP090` | Tipo di step non valido |
| `BP091` | Manca un campo richiesto dallo step, o ce n'è uno che non gli appartiene |
| `BP092` | Il grafo dell'orchestratore non supera il validatore della piattaforma |
| `BP093` | Il cablaggio dei dati fra i passi non torna: gli agenti si parlerebbero solo attraverso il testo |
| `BP094` | Lo step di avvio non serve: il planner lo toglie |
| `BP095` | L'ingresso dell'orchestrazione non è uno solo |
| **Catalogo dei modelli** | |
| `BP100` | Il modello nomina un tenant |
| `BP101` | Il modello contiene un indirizzo email |
| `BP102` | `role:<chiave>` nomina un ruolo che il modello non dichiara |
| `BP103` | Un riferimento a un segreto porta già un tenant |
| `BP104` | Il modello porta documenti e nessuno ne ha dichiarato rivista l'origine |
| `BP105` | All'installazione, un ruolo a cui il modello indirizza dei passi è rimasto senza persone |

I codici del collaudo (`BT0xx`) sono nel
[riferimento del collaudo](../skills/xrcopilotlab-blueprint-test/references/testing.md). Il significato
di ogni campo del manifest: [riferimento del manifest](../skills/xrcopilotlab-blueprint/references/manifest-reference.md).

---

## 9. Quando qualcosa non va

### «Non è detto su quale ambiente lavorare»

Manca `--env`, e non sei dentro un clone del repository di prodotto. Aggiungi `--env staging` o
`--env prod`. La CLI si ferma **prima** di collegarsi a qualunque cosa, quindi non è successo niente.

### «Non hai accesso a Staging (…)» / «Serve il ruolo 'App Configuration Data Reader'»

Ti manca il ruolo di lettura su quell'ambiente — oppure stai lavorando sull'ambiente sbagliato.
`xrcopilotlab-bp environments` dice dove puoi lavorare. Il ruolo va chiesto a chi amministra la
sottoscrizione: [§ L'accesso ad Azure](../../../docs/accesso-azure.md).

### «Key Vault non scrivibile» / «App Configuration non scrivibile»

Succede solo con `secrets set`: servono anche *Key Vault Secrets Officer* e *App Configuration Data
Owner*. Il messaggio nomina il ruolo e la risorsa.

### Nessun browser si apre, e l'autenticazione fallisce

Il comando l'ha lanciato un assistente: senza un terminale vero il browser non si apre, di proposito.
Fai tu il primo accesso, dal tuo terminale: `az login`, oppure `xrcopilotlab-bp environments`. Da lì
il token resta in cache anche per i comandi dell'assistente.

### «Nessun terminale a cui chiedere quale tenant» (uscita 6)

La CLI ha stampato l'elenco dei tuoi tenant, con gli identificativi, e si è fermata: scegli tu, e
ripeti con `--company <id>`. Su staging non succede: senza `--company` vale il tenant di prova.

### «Il tenant … non è fra quelli su cui si può intervenire in PRODUZIONE» (uscita 3)

In produzione si lavora solo sui tenant a cui **appartieni nel prodotto**, gli stessi che vedi
nell'interfaccia. Non è un ruolo Azure che manca: chiedi di essere aggiunto a quel tenant. Lo stesso
messaggio compare se la CLI non riesce a sapere chi sei: verifica l'accesso con `environments` e che
la tua utenza esista nel prodotto.

### «Non ho accesso allo strumento» in chat, oppure un 404 senza spiegazione

Due cose diverse.

- **L'agente non carica il server MCP**: `mcp check --tag <TAG>` dice se manca la definizione, la
  riga del catalogo o il collegamento; `mcp publish <server>` ricrea la riga del catalogo.
- **Un 404 da ogni chiamata all'API**, su un profilo scritto a mano con `apiUrl` e `apiKey`: il
  gateway APIM vuole il parametro `api-version`, e senza non trova l'API e risponde 404 invece di un
  errore che lo dica. Aggiungi `apiVersion` al profilo (`staging`, `prod`…), oppure togli `apiUrl` e
  `apiKey` e lascia che la CLI usi la rotta interna, che non ne ha bisogno. Gli ambienti incorporati
  usano la rotta interna: lì il problema non si presenta.

### «Errore di autorizzazione» da un agente, anche dopo aver corretto il segreto

La connessione porta ancora il valore vecchio. `connections refresh --tag <TAG>`, poi
`mcp test <server> --tag <TAG>` per vedere la risposta vera del sistema esterno.

### Il piano si ferma dicendo che un nome esiste già (`BP060`)

Il blueprint **non sovrascrive** ciò che non ha creato lui. Tre strade: cambiare il nome nel file,
cambiare il tag, oppure rimuovere l'entità che c'è già. Se l'entità l'ha creata una versione
precedente dello stesso blueprint e il piano la considera comunque una collisione, il run di quella
versione non è `Completed`: guarda `status`.

### Un comando del manuale «non esiste», o un'opzione non fa niente

Due cause possibili:

- **Stai usando una CLI diversa da quella del plugin.** `xrcopilotlab-bp version` ti dice numero e
  origine. Una copia indicata con `XRCOPILOTLAB_BP_BIN` vince sempre; uno strumento globale
  `dotnet tool` vince se non è più vecchio del plugin. Toglilo con
  `dotnet tool uninstall --global xrcopilotlab-bp`.
- **La funzione è arrivata dopo la tua versione.** Controlla con `xrcopilotlab-bp version` quale hai e con
  `xrcopilotlab-bp help` quali comandi ha: il [§ 11](#11-le-versioni-cosa-cè-nella-2160) dice cosa è arrivato con la 2.16.0.

E ricorda che quasi tutti i comandi **ignorano in silenzio** un'opzione scritta male ([§ 4](#4-come-si-scrive-un-comando)).

### «c'è la 2.x, il plugin chiede la 2.16.0»

È l'avviso dell'avviatore: c'è una CLI più recente. `/plugin marketplace update hevolus`, poi
`/plugin update blueprints@hevolus`, poi riavvia la sessione. Non è urgente: ciò che stai usando
funziona. Si fa fra un lavoro e l'altro, non a metà di un `apply`.

### «Il run … è stato registrato da una versione più recente della CLI»

Un collega con una CLI più nuova ha scritto quel run. Lo puoi leggere (`status`), non riprendere né
smontare: aggiorna prima la CLI.

### «per scaricare la CLI serve l'accesso a GitHub» / l'avviatore esce con 70

Vedi il [§ 1](#chi-la-installa-il-plugin): `gh auth login`, oppure chiedi l'accesso al catalogo,
oppure fatti passare il binario e indicalo con `XRCOPILOTLAB_BP_BIN`.

### L'apply si è fermato a metà

Ciò che era stato creato è nell'inventario del run. Due strade, che il comando stesso stampa:

```bash
xrcopilotlab-bp apply    --env staging --tag <TAG> --yes --resume <runId>
xrcopilotlab-bp rollback --env staging --run <runId>
```

### Un'attività programmata sbaglia a ogni giro, o non gira

`schedule pause <task>` finché la fonte non è sistemata, poi `schedule resume`. Se sembra non girare,
`schedule logs <task>` mostra la quota e le ultime esecuzioni.

---

## 10. Dove finisce ciò che la CLI scrive

| Dove | Che cosa | Chi lo scrive |
|---|---|---|
| **Archivio — storage**, container `blueprints` | `blueprints/<companyId>/<blueprint>/v<n>/manifest.yaml` (il testo com'è stato scritto), `files/…` (i documenti di knowledge), i `.bpmn` esportati | `push`, `pipeline`, `promote`, `catalog`, `apply` |
| **Archivio — Cosmos**, container `blueprints`, partizione = tenant | il manifest interpretato di ogni versione, con impronta e provenienza; i **run** con inventario, fasi e approvazione | `push`, `promote`, `catalog`, `apply`, `pipeline`, `rollback`, `delete` |
| **Il tenant XRCopilotLab** | topic, profili e documenti, ruoli e membri, agenti, skill assegnate, connessioni, server MCP e loro pubblicazione, orchestratori, agent task, processi e webhook | `apply`, `pipeline`, `rollback`, `delete --with-entities`, e gli interventi puntuali di `schedule`, `mcp`, `connections`, `instances`, `knowledge`; `test run` apre conversazioni e istanze |
| **Key Vault** dell'ambiente | i valori dei segreti | `secrets set`, e `apply` per la chiave dei webhook |
| **App Configuration** dell'ambiente | i riferimenti ai segreti (`Blueprints:Secrets:…`) e la chiave `Sentinel` | `secrets set` |
| **Il tuo disco** | manifest scaricati o esportati, suite di collaudo, report | `pull`, `export`, `test init`, `test run` |

Il manifest non contiene mai il valore di un segreto: solo il suo nome, nella forma
`Blueprints:Secrets:<TAG>:<nome>`. La chiave vera in App Configuration porta anche il tenant:
`Blueprints:Secrets:<companyId>:<TAG>:<nome>` (quelle dei blueprint applicati prima della regola
restano valide in lettura).

---

## 11. Le versioni: cosa c'è nella 2.17.0

La CLI del plugin è la **2.17.0** (release `bp-v2.17.0`, 05/10/2026). Tutto ciò che questa guida
descrive è lì.

### Cosa è arrivato con la 2.17.0, rispetto alla 2.16.0

| Novità | Dove se ne parla |
|---|---|
| `processes[].spec.activities[].interactive`: un'attività `performer: AiAssisted` crea subito il compito, e chi lo prende lavora con l'agente in chat accanto al form. Il piano la segna «in chat» | [manifest](../skills/xrcopilotlab-blueprint/references/manifest-reference.md) |
| `test push`: una suite nell'archivio del tenant, perché la chat dei blueprint la legga (#1210) | [`test push`](#test-push) |
| `test reports` e `--compare`: i report archiviati, da terminale e dalla chat, e il confronto con il precedente della stessa suite (#1210) | [`test reports`](#test-reports) |
| `test run` archivia anche il report e ne stampa il `reportId` | [`test run`](#test-run) |
| `delete` del blueprint intero toglie anche suite e report di collaudo | [`delete`](#delete) |

### Cosa è arrivato con la 2.16.0, rispetto alla 2.15.1

| Novità | Dove se ne parla |
|---|---|
| `export <orchestratore>`: un orchestratore del tenant scritto come manifest (#580) | [`export`](#export) |
| `export --scope orchestrator \| topic \| blueprint \| tenant`, con `--keep-people`: un tenant intero o una sua parte in un manifest, con rapporto e segreti (#1173) | [`export`](#export) |
| `catalog list`, `catalog publish` (con `--check` e `--documents-reviewed`), `catalog install` (con `--tag`, `--topic`, `--existing-topic`, `--members`), e i rilievi `BP100`–`BP105` (#1185) | [`catalog`](#catalog-list--publish--install) |
| I segreti appartengono al tenant: `secrets set` chiede il tenant e scrive `Blueprints:Secrets:<companyId>:<TAG>:<nome>`; `secrets check`, `pipeline`, `promote` e l'apply leggono prima quella chiave e poi quella vecchia; il rilievo `BP103` | [`secrets set`](#secrets-set) |
| Il tenant `default` (la partizione del catalogo) è rifiutato da ogni comando | [§ 3](#--company-il-tenant) |
| `knowledge list` e `knowledge reingest`, con `--only` e `--pending` | [`knowledge`](#knowledge-list--reingest) |
| `mcpServers` con `kind: existing`: collegare agli agenti un server MCP già nel catalogo del tenant (#1194), e il rilievo `BP069` | [`mcp`](#mcp-check--orphans--publish--test), [§ 8](#8-codici-dei-rilievi-bpxxx) |
| `agents[].files`: collegare un foglio direttamente a un agente, per la skill spreadsheet; `push` li archivia con la versione, e il rilievo `BP017` | [`push`](#push), [§ 8](#8-codici-dei-rilievi-bpxxx) |
| Collaudo: `expect.pausesAt`, per gli orchestratori conversazionali che chiudono ogni giro con una domanda, e il rilievo `BT023` | [`test validate`](#test-validate) |
| Orchestratori: un gruppo parallelo porta sul tenant il suo `inputMapping` e i suoi metadati | — |

Con una CLI più vecchia (`xrcopilotlab-bp version`) queste cose non ci sono: si aggiorna con
`/plugin update blueprints@hevolus`, o con [`update`](#update) per una copia installata a mano.
