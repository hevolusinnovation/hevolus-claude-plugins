# `xrcopilotlab-bp` — riferimento dei comandi

Panoramica e concetti: [`README.md`](README.md). Formato del file: [`manifest-reference.md`](manifest-reference.md).

```
xrcopilotlab-bp <comando> [argomenti] [opzioni]
```

## Configurazione: quasi nulla

Dentro un clone del repository **non serve configurare niente**. La CLI legge
`src/XRCopilotLab/XRCopilotLab.Api/local.settings.json`, che uno sviluppatore ha già impostato per
far girare l'API in locale, ne prende `AppConfigurationEndpoint`, e da Azure App Configuration
ricava tutto il resto: Cosmos, storage e le coordinate con cui raggiungere l'API. Le etichette si
leggono nello stesso ordine dell'API (`api-ao`, `api`, etichetta nulla), quindi la CLI vede
esattamente i valori che vede l'API.

```bash
xrcopilotlab-bp status --company <guid>
```

Serve un accesso ad Azure e, sull'utenza corrente, i ruoli *App Configuration Data Reader* e
*Key Vault Secrets User*. L'accesso si prende dove già c'è — variabili d'ambiente, identità
gestita, Visual Studio, `az login` — e **solo se non c'è nulla, e solo in un terminale**, la CLI
apre il browser per farlo fare. Il token resta in cache fra le esecuzioni: l'accesso si fa una
volta per macchina, non una per comando. Chi ha già fatto `az login` non nota differenza, perché
quella strada viene provata prima.

I ruoli servono perché: diverse voci dello store — fra cui la
chiave di Cosmos — non sono valori ma **riferimenti a Key Vault**, che la CLI risolve al volo per
le sole chiavi che le servono.

### Come raggiunge l'API

Due strade, scelte in quest'ordine:

1. **Rotta interna** (default): `InternalApi:BaseUrl` e `InternalApi:FunctionKey` da App
   Configuration, con l'header `x-functions-key`. È la stessa strada che percorrono
   `.Api.AsyncOperations` e `.SandboxEdge` per le loro chiamate interne, e non richiede alcuna
   configurazione aggiuntiva.
2. **Gestione API**: quando un profilo dichiara `apiUrl` e `apiKey`, si passa dal gateway con la
   chiave di sottoscrizione e il parametro `api-version`. Senza quel parametro APIM non risolve
   l'API e risponde 404, con un errore che non dice perché.

## Ambiente e tenant: si scelgono per nome

Gli ambienti sono **dentro il binario** — `staging`, `preview`, `prod` — e si scelgono con
`--env`. Nessun file da scrivere, nessuno da scaricare:

```bash
xrcopilotlab-bp plan --env prod --tag COMO
```

Senza `--env`, dentro un clone, vale l'ambiente del `local.settings.json`. Un `--env` esplicito
vince sempre su quello: chiederne uno e ritrovarsi altrove sarebbe il peggiore dei difetti.

**Il tenant non si scrive, si sceglie.** Quando `--company` non c'è, la CLI elenca i tenant
dell'ambiente per nome e chiede quale:

```
  Per quale tenant, in Staging?

   1. Confindustria Como
   2. Studio Polis
   3. Hevolus Innovation

  Numero (1-3), oppure vuoto per annullare: 1
```

`--company <guid>` continua a valere per gli script e per chi lo sa già. Se il tenant è uno solo,
viene preso senza chiedere. Se non c'è un terminale — la CLI eseguita da un assistente, o in una
pipeline — l'elenco viene stampato e l'esecuzione si ferma con **6**: scegliere un tenant al posto
di qualcuno non è una decisione da prendere in automatico.

### In produzione si lavora solo sul tenant di Hevolus

L'elenco lo filtra il **server**, non la CLI: in produzione l'API restituisce i soli tenant il cui
nome contiene «hevolus», e gli ambienti dei clienti non escono mai dal server. Una CLI più vecchia,
o una chiamata fatta a mano, vedrebbero la stessa cosa.

Il controllo vale anche per `--company` scritto a mano: in produzione un tenant fuori elenco viene
rifiutato con **3**, e lo è anche quando l'elenco non è leggibile — non poter verificare non è una
ragione per procedere.

Provisionare in produzione l'ambiente di un cliente **non si fa da riga di comando**: si fa
dall'interfaccia. Non è un permesso che manca, è una scelta.

Prima di ogni comando che scrive, la CLI annuncia dove sta per lavorare. L'ambiente è riconosciuto
dall'**endpoint** di App Configuration a cui si è effettivamente collegati, non dal nome del
profilo: un profilo chiamato «collaudo» ma puntato alla produzione viene annunciato come
produzione.

## Profili: quando servono ancora

Ora quasi mai. Servono per un ambiente che non è fra quelli noti, o per sovrascrivere un singolo
valore. Stanno in `~/.xrcopilotlab-bp/profiles.json`, si selezionano con lo stesso `--env <nome>`, e
un profilo con lo stesso nome di un ambiente noto vince su quello.

```jsonc
{
  "profiles": {
    "staging": {
      // Tutto è facoltativo: ciò che si omette viene dedotto come sopra.
      "localSettingsPath": "/percorso/di/local.settings.json",
      "appConfigurationEndpoint": "https://appcs-xrcopilotlab-staging-01.azconfig.io",
      "companyId": "11111111-1111-1111-1111-111111111111",
      "actor": "nome.cognome@hevolus.it",

      // Solo per passare dalla gestione API invece che dalla rotta interna:
      "apiUrl": "https://apim-hipexr-prod-italynorth.azure-api.net/api/lab/",
      "apiKey": "env:XRCOPILOTLAB_BP_APIKEY",
      "apiVersion": "staging",

      // Solo per scavalcare ciò che c'è in App Configuration:
      "cosmos":  { "endpoint": "...", "key": "env:...", "database": "...", "container": "blueprints" },
      "storage": { "connectionString": "env:XRCOPILOTLAB_BP_STORAGE", "container": "blueprints" },
      "keyVaultUri": "https://kv-xrcopilotlab-stg-01.vault.azure.net/"
    }
  }
}
```

Ogni valore può essere scritto direttamente oppure nella forma **`env:NOME`**, che legge una
variabile d'ambiente: è la forma da preferire per tutto ciò che è una credenziale, così il file non
ne contiene nessuna.

`keyVaultUri` serve solo a `secrets set`, che deve sapere dove scrivere il valore. Per `staging` e
`preview` **non va scritto**: lo portano gli ambienti incorporati. Resta da indicare a mano solo per
`prod` e per un endpoint non riconosciuto.

⚠️ Se lo si scrive, va preso dai riferimenti a Key Vault **già presenti** nell'App Configuration di
quell'ambiente — non dedotto dal nome. Nella sottoscrizione esistono sia `kv-xrcopilotlab-staging`
sia `kv-xrcopilotlab-stg-01`: il nome più ovvio è quello sbagliato, e scriverci un segreto non dà
nessun errore — semplicemente nessuno lo legge.

Percorso del file sovrascrivibile con `XRCOPILOTLAB_BP_PROFILES`.

## Opzioni comuni

| Opzione | Significato |
|---|---|
| `--env <nome>` | Ambiente: `staging`, `preview`, `prod`, o un profilo scritto a mano. Senza, vale lo sviluppo (il `local.settings.json` del clone). |
| `--company <guid>` | Tenant. Senza, lo si sceglie per nome da un elenco. |
| `--tag <TAG>` | Blueprint su cui operare, per i comandi che partono da uno già pubblicato. |
| `--version <n>` | Versione del manifest. Senza, si usa la più recente. |
| `--yes` | Non chiede conferma. |
| `--no-graph` | Non stampa il grafo dei processi. |
| `--overwrite` | Consente di riscrivere una versione già pubblicata. Solo per iterare in sviluppo. |
| `--resume <runId>` | Riprende un run interrotto invece di crearne uno nuovo. |
| `--skip-external` | Salta la fase esterna nella pipeline. |
| `--blueprint <id>` | Blueprint su cui operare, quando due condividono il tag. |
| `--with-entities` | In `delete`, smonta dal tenant le entità ancora vive prima di cancellare l'archivio. |
| `--confirm <TAG>` | Conferma forte di `delete`: si scrive il tag del blueprint. `--yes` non vale. |
| `--watch` | In `status`, attende la conclusione del run. |
| `--files <cartella>` | In `suggest`, i documenti da ripartire. Senza, quelli già dichiarati nel manifest. |
| `--manifest <file>` | In `test validate`, il manifest contro cui verificare i riferimenti. Senza, quello accanto alla suite. |
| `--only <k1,k2>` | In `test run`, i casi da eseguire: chiavi, tag o entità. |
| `--out <percorso>` | In `test init` il file da scrivere; in `test run` la cartella del report. |

Variabili d'ambiente: `XRCOPILOTLAB_BP_PROFILES` (percorso dei profili), `XRCOPILOTLAB_BP_DEBUG`
(traccia completa degli errori), `NO_COLOR` (output senza colore).

## Codici di uscita

Distinti perché uno script — o la skill di Claude — possa reagire senza interpretare i messaggi.

| Codice | Significato |
|---|---|
| `0` | Tutto a posto |
| `1` | Uso sbagliato: argomenti o configurazione mancanti |
| `2` | Il manifest non è valido |
| `3` | Il piano non è applicabile: collisioni, segreti o dipendenze mancanti — oppure, in produzione, il tenant indicato non è fra quelli ammessi |
| `4` | Una fase è fallita durante l'esecuzione |
| `5` | La pipeline è ferma su un passo manuale |
| `6` | Manca una decisione umana: il piano non è stato approvato, o il tenant non è stato scelto |
| `7` | La suite di collaudo è stata eseguita e almeno un caso non è passato (`test run`) |
| `70` | Errore imprevisto |

---

## `validate <file.yml>`

Verifica il manifest **senza toccare la rete**: struttura, chiavi duplicate, riferimenti fra
sezioni, e il grafo di ogni processo. Le regole del grafo non sono riscritte nella CLI: si delega
allo stesso validatore che gira sul server, quindi ciò che passa qui passa anche lì.

```bash
xrcopilotlab-bp validate blueprints/test-agenda.yml
xrcopilotlab-bp validate blueprints/test-agenda.yml --graph   # stampa anche il disegno
```

Non richiede `--env` né credenziali: gira ovunque, anche in una pipeline di verifica.

## `suggest <file.yml> [--files <cartella>]`

Propone come ripartire i documenti fra i profili di knowledge e quale **fascia** di modello dare a
ciascun agente. Non scrive niente: né sul tenant né sul manifest, e stampa la sezione YAML da
incollare dopo averla decisa.

```bash
xrcopilotlab-bp suggest blueprints/finlogic-bilancio-aggregato.yml --files test-data
xrcopilotlab-bp suggest blueprints/finlogic-bilancio-aggregato.yml --env staging
```

`--files` indica la cartella dei documenti da ripartire. Senza, si usano i file che il manifest già
dichiara — ed è così che si fa criticare una partizione esistente.

L'unica cosa che tocca la rete è il **catalogo dei modelli**, e non è un requisito: senza `--env`, o
se la lettura fallisce, la proposta indica la fascia e non i nomi fra cui scegliere.

**Perché propone un profilo per agente e non un raggruppamento dei file.** Dai soli nomi il
raggruppamento è ambiguo, e l'ambiguità non è innocua. Su due libri giornale e due file di mapping
per due società, le parole condivise formano due dimensioni incrociate: `{libro, giornale}` tiene
insieme i due giornali, `{socialware}` tiene insieme giornale e mapping della stessa società.
«Per tipo» e «per società» sono entrambe letture legittime dei nomi, e sono partizioni diverse.
Quale sia giusta lo decide il lavoro degli agenti — se un passo a valle riceve già il giornale nel
messaggio, il giornale non deve stare fra i suoi file — e questo i nomi non lo sanno. Quindi i file
vengono assegnati dove il nome lo giustifica e dichiarati **non assegnati** dove non lo giustifica:
una casella vuota costa meno di un'assegnazione inventata.

Quello che invece calcola in modo esatto sono i vincoli: quali file il selettore non riuscirà a
distinguere, e quali, dentro il profilo in cui finiscono, non hanno parole proprie — e verranno
quindi esclusi appena una domanda nomina uno degli altri.

La proposta di modello viaggia sempre con i **segnali** da cui è nata (legge documenti? chiama
strumenti? riceve l'output di un altro passo?), perché sono indizi del carico e non il carico: un
agente senza documenti né strumenti può essere il passo più difficile della catena. I nomi che non
dichiarano la fascia — un `codex`, un `fast-non-reasoning`, le famiglie non GPT — non vengono
proposti per esclusione.

## `secrets set --tag <TAG> <nome>`

Salva un segreto in Key Vault e ne registra il riferimento in App Configuration come
`Blueprints:Secrets:<TAG>:<nome>`.

```bash
xrcopilotlab-bp secrets set --tag STUDIOPOLIS graph-client-secret
# Valore per Blueprints:Secrets:STUDIOPOLIS:graph-client-secret: ●●●●●●●●
```

Il valore si digita **senza eco**, non compare a video, non entra nel manifest e non finisce nei
log. Per gli usi non interattivi: `--from-env NOME_VARIABILE`.

Il comando aggiorna anche la chiave **`Sentinel`** di App Configuration: le API ricaricano la
configurazione — riferimenti a Key Vault compresi — solo quando quella chiave cambia, ogni cinque
minuti. Senza, un segreto corretto resterebbe quello vecchio in ogni Function App fino al riavvio,
e l'unico sintomo sarebbe un agente che dice «errore di autorizzazione». Un'istanza **locale**
dell'API va comunque riavviata: legge App Configuration all'avvio. E le **connessioni** già create
non cambiano da sole: `connections refresh --tag <TAG>` (sotto).

Servono i ruoli *Key Vault Secrets Officer* e *App Configuration Data Owner* sull'utenza corrente.

## `secrets check <file.yml>`

Elenca i segreti che il manifest cita e dice quali mancano, stampando i comandi per crearli. Esce
con `3` se ne manca almeno uno.

## `push <file.yml>`

Registra una versione del manifest: il testo YAML nello storage, il manifest interpretato in
Cosmos. Stampa identificativo, versione, percorso del blob e impronta SHA-256.

Una versione pubblicata è **immutabile**: ripubblicare la stessa viene rifiutato. Si alza `version:`
nel manifest, oppure — solo per iterare in sviluppo — si usa `--overwrite`.

## `plan --tag <TAG> [--version <n>]`

Mostra cosa verrebbe creato, cosa manca e cosa collide, **senza modificare nulla**. Legge lo stato
del tenant: nomi già occupati, skill a catalogo, utenti, segreti presenti.

Il piano che si vede è lo stesso oggetto che `apply` esegue, non un riepilogo approssimato: le
operazioni sono quelle, con i nomi già qualificati.

```
   1. Crea il topic «BP-TEST-Agenda di Studio»
   2. Crea il ruolo aziendale «BP-TEST-Referente agenda»
   ...
  esito → registra se confermato eq true
  esito → estrai (da rifare)

✓ Nessun errore: il piano è applicabile.
```

Esce con `0` se applicabile, `3` altrimenti.

## `apply --tag <TAG> [--version <n>] [--resume <runId>]`

Stampa il piano, **ne chiede l'approvazione** e solo dopo esegue. In un terminale la domanda si
risponde; dove non c'è un terminale — uno script, un assistente che esegue comandi — non c'è nessuno
a cui chiedere, quindi l'esecuzione si ferma con codice `6` e serve `--yes`. Quel flag è la forma
scritta di un'approvazione data altrove, e finisce nel run insieme a chi l'ha dichiarata e a quando:
`status --run <runId>` la mostra.

Ogni entità creata finisce **subito** in inventario, non alla fine: se una chiamata fallisce a metà,
ciò che è stato creato è già registrato ed è quindi smontabile.

Al termine stampa i riferimenti non risolti nei processi, i diagrammi archiviati e — una sola volta,
perché l'API non li mostra due volte — url, `hookId` e chiave dei webhook creati.

Con `--resume` riparte da un run esistente: le operazioni già in inventario vengono saltate.

## `status [--run <runId>] [--watch]`

Senza `--run`, elenca i blueprint pubblicati sul tenant e le ultime esecuzioni. Con `--run`, mostra
stato, fasi e inventario di quel run. `--watch` attende la conclusione.

## `rollback --run <runId>`

Smonta ciò che il run ha creato, leggendo l'inventario **a ritroso**. Rimuove solo le voci con
azione `Created`: un'entità adottata perché già presente non è nostra e resta dov'è.

Un fallimento su una singola entità non ferma il resto: è meglio un rollback completato saltando
ciò che non si riesce a togliere, che uno lasciato a metà. Le entità non rimosse vengono elencate.

La pubblicazione di una versione non ha operazione inversa: sparisce insieme al processo.

## `delete --tag <TAG> --confirm <TAG> [--version <n>] [--with-entities]`

Toglie un blueprint dall'**archivio**: le versioni del manifest in Cosmos, i file nello storage —
il `.bpmn` esportato compreso — e i run che lo riguardano. Con `--version` si cancella una versione
sola, con i suoi run; senza, l'intero blueprint. `--blueprint <id>` serve quando due blueprint
condividono il tag.

**Cancellare l'archivio e smontare il tenant sono due cose diverse**, e il comando le tiene
separate. Finché le entità create vivono, l'inventario del run è l'unica cosa che sa come si
chiamano e dove stanno: se il piano ne trova, si ferma con **3** e indica le due strade —
`rollback --run <runId>` prima, oppure `--with-entities` per farlo qui.

Con `--with-entities` l'ordine non è negoziabile: **prima il tenant, poi l'archivio**. Se qualche
entità non si riesce a rimuovere, il comando esce **4** lasciando l'archivio dov'è e l'inventario
aggiornato con ciò che resta — così si può riprovare. L'ordine inverso lascerebbe agenti e processi
orfani, riconducibili a un blueprint solo a memoria.

**La conferma è più dura di quella di `apply`, e `--yes` non vale.** Il comando stampa un avviso
riquadrato con ciò che sparisce, poi chiede di **scrivere il tag** del blueprint: al terminale lo si
digita, altrove lo si passa come `--confirm <TAG>`. Un tag diverso da quello del blueprint in
cancellazione ferma tutto — è il caso che la regola esiste per intercettare, il comando di un altro
blueprint riusato con una modifica sola.

La ragione è che `apply` ha una marcia indietro e `delete` no: spariscono le versioni, gli artefatti
e l'inventario, cioè proprio le informazioni con cui si rimedierebbe. Un «s» si batte per riflesso e
`--yes` si copia da un comando all'altro; il tag no, perché non si può dare senza aver letto cosa si
sta cancellando. Senza conferma il comando esce **6** e non tocca niente.

```bash
xrcopilotlab-bp delete --tag TEST --confirm TEST --company <guid>                  # solo l'archivio
xrcopilotlab-bp delete --tag TEST --confirm TEST --company <guid> --with-entities  # anche il tenant
xrcopilotlab-bp delete --tag TEST --confirm TEST --version 2 --company <guid>      # una versione sola
```

## `external <file.yml>`

Dice cosa resta da fare fuori dalla piattaforma — e cosa non serve più.

Quasi tutto ciò che un tempo richiedeva questa fase si ottiene ora in modo nativo: una connessione
verso la fonte, un server MCP che la interroga, un agent task schedulato che consegna l'esito al
webhook di un processo. In quel caso il comando lo dice ed esce **0**: non c'è niente da creare.

Resta l'ingresso **push** (`ingress.kind: logicapp`), che vuole una Logic App con il connettore
Office 365 e un'autorizzazione che una persona deve dare. Lì il comando elenca i passi manuali ed
esce **5**.

## `pipeline <file.yml>`

Percorre tutte le fasi in sequenza:

1. **validate** — offline;
2. **secrets** — verifica le chiavi citate, e si ferma stampando i comandi se ne manca una;
3. **push** — registra la versione;
4. **plan** — stampa il piano e chiede conferma, salvo `--yes`;
5. **apply** — esegue;
6. **external** — ciò che resta fuori dalla piattaforma, se c'è.

L'ordine non è arbitrario: la fase esterna viene **dopo** l'applicazione perché l'ingresso della
posta deve puntare a un webhook che prima non esisteva.

```bash
xrcopilotlab-bp pipeline blueprints/test-agenda.yml --company <guid>
xrcopilotlab-bp pipeline blueprints/test-agenda.yml --yes --skip-external
xrcopilotlab-bp pipeline blueprints/test-agenda.yml --resume a1b2c3d4e5f6
```

## `test init <file.yml>` · `test validate <suite.yml>` · `test run <suite.yml>`

Il collaudo di un blueprint **applicato**: una suite di domande per gli agenti, input per gli
orchestratori e dati di avvio per i processi, con le attese; l'esecuzione sul tenant; un report
con risposte, log e — per ogni fallimento — il componente da cui cominciare a guardare.

```bash
xrcopilotlab-bp test init     blueprints/test-agenda.yml                       # → blueprints/tests/test-agenda.tests.yml
xrcopilotlab-bp test validate blueprints/tests/test-agenda.tests.yml           # trova il manifest da solo
xrcopilotlab-bp test run      blueprints/tests/test-agenda.tests.yml --env staging --company <guid>
xrcopilotlab-bp test run      blueprints/tests/test-agenda.tests.yml --env staging --only agent,process
```

`init` non sovrascrive una suite esistente (`--overwrite`, o `--out`); `validate` accetta
`--manifest`; `run` accetta `--tag`, `--run <runId>`, `--only <chiavi,tag,entità>`, `--out
<cartella>`. Le entità si risolvono dall'inventario dell'ultimo run completato del tag. Il report
va in `blueprints/tests/reports/<tag>/<data>/` (ignorata da git).

Esce `0` se tutti i casi passano, **`7`** se almeno uno non passa, `2` se la suite non è valida,
`3` se il tag non ha un run sul tenant. Formato della suite, esiti, sospetti e codici `BT0xx`:
[`testing.md`](testing.md).

## `schedule list` · `schedule pause <task>` · `schedule resume <task>`

Le schedulazioni degli agent task creati da un blueprint. Servono quando il blueprint è applicato
ma una sua fonte non è pronta — una casella che nessuno controlla, credenziali da correggere: un
task ogni cinque minuti su una fonte rotta produce un esito d'errore a ogni giro, e se l'esito va a
un webhook apre un caso a ogni giro.

```bash
xrcopilotlab-bp schedule list                        --tag STUDIOPOLIS --env staging --company <guid>
xrcopilotlab-bp schedule pause  sorveglianza-posta   --tag STUDIOPOLIS --env staging --company <guid>
xrcopilotlab-bp schedule resume sorveglianza-posta   --tag STUDIOPOLIS --env staging --company <guid>
```

Il task si indica con la **chiave del manifest** (`agentTasks[].key`), con il nome o con il nome
qualificato `BP-<TAG>-…`, e si risolve dall'inventario dell'ultimo run completato del tag (`--run`
per sceglierne un altro). La pausa non tocca il manifest né l'inventario: l'espressione cron resta,
e `resume` riprende da lì ricalcolando la prossima esecuzione.

Il comando è **idempotente**: l'API espone solo un'inversione dello stato, quindi la CLI legge prima
lo stato e inverte solo se serve. `pause` su un task già in pausa non lo riaccende. Nessuna
approvazione: non crea né rimuove niente, e l'inverso è un comando.

**Quando usarlo:** se `apply` riporta un avviso nella sezione «Prove dei tool MCP», i task schedulati
sugli agenti di quel server lavorano su una fonte che non risponde. Si mettono in pausa subito, si
corregge la fonte (`secrets set`, permessi, policy), e si riprendono.

- Implementa: `Commands/ScheduleCommand.cs`.

## `connections list` · `connections refresh [<connessione>]`

Una connessione porta i segreti **risolti** al momento dell'apply: il manifest li cita per nome, la
CLI li legge da App Configuration e ne scrive il valore nella connessione. Correggere un segreto con
`secrets set` corregge App Configuration, **non** la connessione, che continua a presentarsi al
sistema esterno con il valore vecchio — e l'agente dice «errore di autorizzazione» anche dopo la
correzione.

```bash
xrcopilotlab-bp connections list            --tag STUDIOPOLIS --env staging --company <guid>
xrcopilotlab-bp connections refresh         --tag STUDIOPOLIS --env staging --company <guid>   # tutte
xrcopilotlab-bp connections refresh graph   --tag STUDIOPOLIS --env staging --company <guid>   # una sola
```

`refresh` ricostruisce configurazione e busta di autenticazione dal manifest pubblicato e dai
segreti **come sono ora**, con la stessa costruzione dell'apply, e aggiorna la connessione sul
tenant senza cambiarne l'id: server MCP e agenti che la usano non se ne accorgono. L'effetto è
immediato, perché le API leggono la connessione a ogni chiamata. Verifica: `mcp test`.

Emerso il **2026-09-14**: i due segreti Graph di Studio Polis erano scambiati fin dall'11/09
(`graph-client-id` conteneva il secret, `graph-client-secret` l'id). Correggerli in App
Configuration non è bastato — la connessione aveva i valori dell'apply — e `mcp test` continuava a
mostrare `AADSTS700016`. Il valore giusto è stato recuperato dalla **versione precedente** del
segreto in Key Vault, senza ruotare nulla.

## `mcp check` · `mcp publish <server>` · `mcp test <server> [--tool] [--args]`

Un server MCP applicato da blueprint vive in tre posti: la **definizione** nel Builder, la
**pubblicazione** nel catalogo del tenant (la riga che l'agente carica in chat, con lo stesso id del
server) e i **collegamenti** agente → catalogo. Se il catalogo perde la riga, i collegamenti restano e
l'agente risponde «non ho accesso allo strumento» senza nessun errore: nel log della chat manca
soltanto il passo `McpLoadTools`.

```bash
xrcopilotlab-bp mcp check           --tag STUDIOPOLIS --env staging --company <guid>   # definizione, catalogo, collegamenti
xrcopilotlab-bp mcp publish m365    --tag STUDIOPOLIS --env staging --company <guid>   # ricrea la riga del catalogo
xrcopilotlab-bp mcp test    m365    --tag STUDIOPOLIS --env staging --company <guid>   # esercita il testTool e mostra la risposta grezza
xrcopilotlab-bp mcp test    m365    --tool cerca_eventi --args '{"inizio":"2020-01-01T00:00:00Z","fine":"2020-01-02T00:00:00Z"}' --tag STUDIOPOLIS
```

`check` legge il catalogo come lo legge la chat (elenco dei tool via gateway) e, per ogni agente
collegato in inventario, chiede all'API cosa carica davvero per quell'agente. Esce **4** se qualcosa
non coincide. `publish` ripubblica il server con lo stesso id, così i collegamenti tornano a
risolversi; **ruota la chiave del gateway**, per costruzione dell'API. `test` è l'evidenza che manca
quando l'agente dice «errore di autorizzazione» e il log dice solo `ok: true`: stampa la risposta
del sistema di terze parti — per esempio l'`AADSTS…` di Entra — senza passare dal modello. Senza
`--tool` usa il `testTool` del manifest, in sola lettura.

Emerso il **2026-09-14**: sul tenant di Studio Polis la riga del catalogo del server Microsoft 365
era sparita fra due collaudi, con i quattro collegamenti ancora in piedi; la causa non è stata
trovata (telemetria di staging non interrogabile), la riparazione è stata `mcp publish`.

## Prerequisiti sul tenant

- Licenza **`XRCopilotLab.Process`** attiva, altrimenti i processi non sono utilizzabili.
- Container Cosmos `blueprints` con partition key `/companyId`
  (vedi `XRCopilotLab.Data/Scripts/Migrations/Cosmos/`).
- Le skill citate dagli agenti già presenti nel catalogo: il blueprint non le crea.
- Gli utenti citati come membri di ruolo o owner già presenti nel tenant.
