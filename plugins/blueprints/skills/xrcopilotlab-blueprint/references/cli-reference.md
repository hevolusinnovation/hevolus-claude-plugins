# `xrcopilotlab-bp` — riferimento dei comandi

Panoramica e concetti: [`manuale.md`](../../../docs/manuale.md). Formato del file: [`manifest-reference.md`](manifest-reference.md).

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

Gli ambienti sono **dentro il binario** — `staging` e `prod` — e si scelgono con
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

**Su `staging` la domanda non viene posta**: c'è un ambiente di prova e non ce n'è un secondo
plausibile, quindi senza `--company` si lavora su quello, e il comando lo dice — «Tenant non
indicato: si usa quello predefinito di Staging» — prima del banner. La precedenza resta dal più
esplicito al più implicito: `--company`, poi `tenant.companyId` del manifest, poi il `companyId`
del profilo, e solo alla fine il default dell'ambiente. Nessun altro ambiente ne ha uno, e la
produzione non deve averlo: lì «quale tenant» è la domanda giusta.

### In produzione si lavora sui tenant a cui appartieni

**Dalla 2.13.0** (issue #1114) l'elenco è quello della **persona**: la CLI chiede alla piattaforma
l'utente con le sue company — la stessa domanda che l'interfaccia fa dopo il login — e offre
quelli. Due colleghi con diritti diversi vedono elenchi diversi, come nell'interfaccia.

Prima l'elenco era dell'**ambiente**: una chiave di configurazione uguale per tutti, che in
produzione lasciava passare i soli tenant il cui nome contiene «hevolus». Il difetto non era la
severità ma la grana: quella chiave è una sottostringa sola, quindi poteva aprire *tutti* i clienti
o sostituire quello corrente, mai aggiungerne uno.

Il controllo vale anche per `--company` scritto a mano: in produzione un tenant fuori dal tuo
elenco viene rifiutato con **3**, e lo è pure quando l'identità non si riesce a stabilire — non
sapere chi sei non è una ragione per mostrarti di più. Fuori produzione, in quel caso, si ripiega
sull'elenco dell'ambiente dicendolo.

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
`prod` **non va scritto**: lo portano gli ambienti incorporati. Resta da indicare a mano solo per un
endpoint non riconosciuto.

⚠️ Se lo si scrive, va preso dai riferimenti a Key Vault **già presenti** nell'App Configuration di
quell'ambiente — non dedotto dal nome. Nella sottoscrizione esistono sia `kv-xrcopilotlab-staging`
sia `kv-xrcopilotlab-stg-01`: il nome più ovvio è quello sbagliato, e scriverci un segreto non dà
nessun errore — semplicemente nessuno lo legge.

Percorso del file sovrascrivibile con `XRCOPILOTLAB_BP_PROFILES`.

## Opzioni comuni

| Opzione | Significato |
|---|---|
| `--env <nome>` | Ambiente: `staging` o `prod`, o un profilo scritto a mano. Senza, vale lo sviluppo (il `local.settings.json` del clone). |
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
| `--compare <reportId>` | In `test reports`, confronta quel report con il precedente della stessa suite. |

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

## `secrets set --company <tenant> --tag <TAG> <nome>`

Salva un segreto in Key Vault e ne registra il riferimento in App Configuration. Il manifest lo cita
come `Blueprints:Secrets:<TAG>:<nome>`; la chiave vera porta anche il **tenant** —
`Blueprints:Secrets:<companyId>:<TAG>:<nome>` — perché un segreto appartiene a un tenant, e due
tenant che installano lo stesso modello del catalogo con lo stesso tag non devono scriversi addosso
(#1185).

```bash
xrcopilotlab-bp secrets set --company <tenant> --tag STUDIOPOLIS graph-client-secret
# Valore per Blueprints:Secrets:STUDIOPOLIS:graph-client-secret: ●●●●●●●●
```

Quando legge un segreto, la CLI cerca prima la chiave del tenant, poi quella senza tenant dei
blueprint applicati prima della regola: questi continuano a funzionare senza riapplicarli. Un
segreto impostato di nuovo va nella chiave del tenant, che da lì in poi vince.

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

## `pull --tag <TAG> [--version <n>] [--out <file>] [--with-files]`

Riscrive su disco il manifest di una versione pubblicata, **com'era stato scritto** — commenti
compresi: il `push` archivia il testo, non solo il modello interpretato.

Serve a due cose. La prima è recuperare: fino a qui una versione pubblicata era raggiungibile solo
dal file di chi l'aveva pubblicata, e chi usa la CLI dal plugin quel file non ce l'ha. La seconda è
confrontare: `pull` di due ambienti e un `diff` dicono, senza interpretazioni, se stanno davvero
eseguendo lo stesso blueprint.

Senza `--out` il file prende il nome `<blueprint>-v<n>.yml` nella cartella corrente; un file che
esiste già non viene sovrascritto senza `--overwrite`. Con `--with-files` scende anche la knowledge
archiviata con la versione, in una cartella `files/` accanto al manifest — con l'avvertenza che i
percorsi scritti nel manifest sono quelli della macchina che fece il push, e vanno riadattati prima
di ripubblicare da quel file.

Se la versione è arrivata lì per copia, stampa anche da dove.

## `export <orchestratore> [--tag <TAG>] [--out <file>]`

La direzione opposta di `apply`: scrive come manifest un orchestratore che **esiste sul tenant**,
indicato per id o per nome, con gli agenti che i suoi step usano, il loro topic e i loro profili di
knowledge (#580). Sul tenant fa solo letture.

Il manifest lo costruisce lo stesso esportatore dell'export dall'editor dell'orchestratore, quindi
vale la stessa regola: **non esce niente che appartenga alla company d'origine**. Credenziali delle
action (auth, header e query string dei webhook, qualunque chiave che nomini una credenziale),
destinatari delle approvazioni, connessioni, server MCP ed endpoint AI assegnati agli agenti
restano fuori, e ogni omissione è un avviso stampato. Anche uno script JavaScript oltre 8 KB viene
segnalato: può contenere dati della company.

Il tag viene dal nome, se l'orchestratore l'ha creato un blueprint (`BP-<TAG>-…`); altrimenti si
indica con `--tag`. Con il tag, i nomi e le chiavi che portano il prefisso `BP-<TAG>-` lo perdono,
perché lo rimette il planner al `push`: senza, un blueprint esportato e ripubblicato diventerebbe
`BP-TAG-BP-TAG-…`. Un nome senza quel prefisso non è del blueprint e resta com'è.

Senza `--out` il file prende il nome `<blueprint>.yml` nella cartella corrente; un file che esiste
già non viene sovrascritto senza `--overwrite`. Il file si scrive comunque, e poi si valida: con
errori bloccanti esce **2** e li stampa. Il caso tipico è un'approvazione, che vuole i destinatari
(`BP091`) — il file è un punto di partenza da rivedere, non un blueprint pronto.

Due adattamenti che l'esportatore fa, e dice:

- un orchestratore che **torna al suo primo step** (una conversazione) non avrebbe ingresso per il
  manifest, che parte dall'unico step senza flussi entranti: l'ingresso viene duplicato in
  `<step>-entry`, e i cicli restano sull'originale;
- uno step con output strutturato che sul tenant **ha perso lo schema** riceve uno schema
  ricostruito dalle chiavi del suo `outputMapping`, da controllare.

## `export --scope <ambito> [<oggetto>] --tag <TAG> [--out <cartella>] [--keep-people] [--overwrite]`

La lettura di un **tenant intero, o di una sua parte**, in un manifest (#1173). Sul tenant fa solo
letture. Scrive una cartella con tre file:

| File | Che cosa contiene |
|---|---|
| `manifest.yml` | il manifest, già validato |
| `export-report.md` | il rapporto: ciò che il manifest non porta e che va completato prima di applicarlo |
| `secrets.txt` | i riferimenti ai segreti, uno per riga, con il comando `secrets set` già scritto |

**L'ambito si dichiara prima di leggere**, e non si allarga in silenzio:

| Ambito | Da dove parte |
|---|---|
| `orchestrator <id\|nome>` | l'orchestratore, nel topic dei suoi agenti |
| `topic <id\|nome>` | agenti, profili e agent task del topic, e gli orchestratori fatti solo dei suoi agenti |
| `blueprint <TAG>` | ciò che l'inventario dell'ultimo run completato dice creato dal blueprint; il tag del manifest è quello, e le **chiavi** sono quelle del manifest originale |
| `tenant` | tutto: possibile solo se il tenant ha **un topic solo**, perché un manifest ne descrive uno |

Ciò da cui le entità dell'ambito dipendono entra da sé — i profili e i server MCP di un agente, la
connessione di un server MCP, il processo che un agent task avvia, i ruoli e gli agent task di un
processo, gli agenti di un orchestratore — e il rapporto dice chi l'ha fatto entrare. Un ambito che
non si può rispettare (un orchestratore con agenti in topic diversi, un tenant con più topic) esce
**1** con il motivo.

**Il manifest è un modello, non una fotocopia.** I nomi escono senza `BP-<TAG>-`, che l'apply rimette;
le chiavi sono slug dei nomi, o quelle dell'inventario con `--scope blueprint`; i riferimenti fra
sezioni passano per le chiavi, mai per gli id del tenant. Un'entità fatta a mano, senza prefisso,
all'apply lo riceve: riapplicare l'export sullo stesso tenant ne creerebbe una copia, e collegare le
chiavi a entità che esistono già è un passo che ancora non c'è.

**Nessun valore segreto esce.** L'API restituisce alcune credenziali in chiaro — le chiavi degli
endpoint AI di un agente, gli header di un'uscita webhook — e l'export le ferma:

- l'autenticazione di una connessione diventa riferimenti `Blueprints:Secrets:<TAG>:<chiave>-…`; dei
  suoi campi l'API restituisce **solo il tipo**, quindi `tokenUrl`, `scope`, nome utente e nome
  dell'header restano da completare, e il rapporto lo dice;
- un header con un nome da credenziale (`Authorization`, `*key*`, `*token*`…) diventa un riferimento;
- le chiavi che la piattaforma genera — webhook dei processi, chiavi sviluppatore — si **rigenerano**
  all'import: un'uscita verso il webhook di un processo diventa `processes.<chiave>.webhook`, una
  connessione verso un processo diventa `process: <chiave>`.

**I dati personali** — membri dei ruoli, owner dei processi, destinatari delle email — escono come
segnaposto `persona-N@segnaposto.invalid`, perché il manifest può finire a un altro cliente. Con
`--keep-people` restano gli indirizzi: per promuovere sullo stesso cliente. Il rapporto elenca ogni
campo in entrambi i casi.

**Ciò che il manifest non sa dire** è elencato entità per entità, mai perso in silenzio: i documenti
dei profili (non vengono scaricati), le impostazioni dell'agente senza un campo nel manifest, la
politica di approvazione e l'avvio da webhook di un agent task, alcuni campi delle uscite, la
disposizione del diagramma dei processi, le variabili dei server MCP (già sostituite nei template), le
opzioni dei provider di connessione diversi dal webhook.

Senza `--out` la cartella è `export-<tag>`; se contiene già un manifest non si sovrascrive senza
`--overwrite`. Dopo aver scritto i file il comando valida: con errori bloccanti esce **2**.

Provato su staging con `--scope blueprint STUDIOPOLIS` contro `blueprints/studiopolis-agenda.yml`:
stesse chiavi in tutte le sezioni; ruoli, agenti, agent task e processi identici, a meno dei dati
personali; le differenze che restano sono quelle che il rapporto dichiara.

## `promote --tag <TAG> [--version <n>] [--from-env <e>] [--to-env <e>] [--from-company <guid>] [--to-company <guid>]`

Copia una versione pubblicata **da un archivio a un altro**.

Una voce d'archivio ha quattro coordinate — **ambiente**, **tenant**, blueprint e versione — e
questo comando ne cambia una o due. Per questo lo stesso comando serve a portare in produzione ciò
che è stato collaudato su staging *e* a riusare su un secondo cliente un blueprint scritto per il
primo: è la stessa copia, su un asse diverso. Nessuna direzione è privilegiata — la produzione può
essere l'origine tanto quanto la destinazione.

```bash
# staging → prod, stesso cliente (i companyId restano diversi: sono directory diverse)
xrcopilotlab-bp promote --tag STUDIOPOLIS --version 29 \
    --from-env staging --from-company <guid-staging> \
    --to-env   prod    --to-company   <guid-prod>

# prod → staging, per riprodurre un caso
xrcopilotlab-bp promote --tag STUDIOPOLIS --from-env prod --to-env staging --to-company <guid>

# tenant → tenant, nello stesso ambiente
xrcopilotlab-bp promote --tag STUDIOPOLIS --from-company <cliente-A> --to-company <cliente-B>
```

`--to-env` assente vuol dire stesso ambiente dell'origine; `--from-env` assente vuol dire quello di
`--env`. Se origine e destinazione finiscono per coincidere, il comando si ferma: non c'è niente da
copiare.

**Il testo non viene mai riscritto.** Il manifest arriva a destinazione byte per byte, quindi lo
SHA-256 resta lo stesso ed è la prova che in produzione gira ciò che è stato collaudato. Il
`tenant.companyId` scritto dentro il manifest non viene corretto: a comandare è `--company` al
momento del `plan`.

Tre esiti, dal confronto delle impronte:

| Alla destinazione | Esito |
|---|---|
| non c'è | copia |
| c'è, stesso SHA-256 | **non scrive niente**, esce `0` — la copia è ripetibile, anche da uno script |
| c'è, SHA-256 diverso | **si ferma** (`1`): due testi sotto lo stesso numero di versione. Si alza `version:`, oppure `--overwrite` |

Viaggiano gli **ingressi** della versione: il manifest e la knowledge archiviata con il push. Non
viaggiano le **uscite** — i `.bpmn` esportati dall'apply — che sono il verbale di un'esecuzione
avvenuta in quell'ambiente; né i run, gli inventari e le approvazioni, che appartengono a dove sono
successi; né i **valori** dei segreti, che nel manifest sono solo nomi. Quelli che la destinazione
non ha vengono elencati prima di scrivere, ma non bloccano: la copia in archivio è inerte, e il
`plan` si ferma comunque.

**Sul tenant di destinazione non viene creato niente.** Dopo la copia servono ancora `plan` e
`apply`, con la loro approvazione: copiare è ripetibile, creare entità no. E se la destinazione è
la produzione, la copia stessa chiede conferma — senza terminale si ferma con `6` e serve `--yes`.

Il tenant di destinazione passa dallo stesso filtro di tutti gli altri comandi: in produzione un
tenant che l'API non elenca viene rifiutato con `3`, perché l'archivio non diventi la porta di
servizio di quella protezione.

## `catalog list` · `catalog publish <modello.yml>` · `catalog install <modello>`

Il **catalogo** dei blueprint pronti, curati da Hevolus e installabili da qualunque tenant (#1185).
Vive nello stesso archivio dei tenant, nella partizione `default`; perché e come si scrive un
modello: [`catalogo.md`](catalogo.md).

```bash
xrcopilotlab-bp catalog list --env staging [--company <tenant>]
xrcopilotlab-bp catalog publish blueprints/catalogo/legal-agenda.yml --env staging [--documents-reviewed]
xrcopilotlab-bp catalog install legal-agenda --env staging --company <tenant> \
    [--version <n>] [--tag <TAG>] [--topic <nome> | --existing-topic <nome>] \
    [--members "referente=a@studio.it,b@studio.it;segreteria=c@studio.it"]
```

- **`list`** — l'ultima versione di ogni modello, con che cosa crea. Con `--company`, anche che
  cosa ha installato quel tenant e se nel catalogo c'è una versione più nuova.
- **`publish`** — controlla che il file sia un **modello** (`BP100`–`BP104`: nessun tenant, nessuna
  persona né email, segreti senza tenant, documenti rivisti) e che, installato per finta, sia un
  manifest valido; poi lo scrive nel catalogo. In produzione chiede conferma. Con `--check` si ferma
  al controllo, senza rete e senza scrivere: è il modo di provare una bozza. È riservato a Hevolus:
  scrive nella partizione che ogni tenant legge.
- **`install`** — copia una versione del modello nell'archivio del tenant con le scelte di chi
  installa: tag (default quello del modello), topic, persone di ogni ruolo. Le persone si danno con
  `--members` o, al terminale, rispondendo a una domanda per ruolo; un ruolo a cui il modello
  indirizza dei passi non può restare vuoto (`BP105`). Una seconda installazione dello stesso modello
  riparte dalle scelte della prima: è così che si **aggiorna** — la versione nuova arriva con lo
  stesso tag e il piano la applica sul posto (#1126).

Come `promote`, **`install` non crea niente sul tenant**: dopo servono `secrets set` per le
credenziali che il comando elenca, poi `plan` e `apply` con la loro approvazione. Il tag scelto non
può essere già di un altro blueprint del tenant. La copia ricorda da dove viene (`promotedFrom`
con `catalogVersion`), ed è da lì che `catalog list --company` sa dire se c'è di più nuovo.

`default` non è un tenant: ogni altro comando lo rifiuta con `1`.

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

### Una versione nuova su un blueprint già applicato (#1126)

Se sul tenant c'è già un run **completato** dello stesso blueprint, `plan` e `apply` non si fermano
sulle entità che quel run ha creato: le riconoscono come del blueprint e portano sopra la versione
nuova.

- **Si crea** ciò che la versione nuova aggiunge: agenti, skill assegnate, server MCP, step.
- **Si aggiorna sul posto** ciò che il blueprint possiede ed è cambiato, confrontandolo con il
  **tenant** — non con il manifest precedente, perché fra una versione e l'altra le cose possono
  essere state ritoccate a mano:
  - gli **agenti**: istruzioni, descrizione, temperatura, modello. Identità, knowledge e strumenti
    restano quelli che hanno;
  - gli **orchestratori**: step, flussi, ciò che ogni step passa al successivo, messaggio di
    benvenuto. L'id e l'endpoint di chat — quindi i link già dati — restano gli stessi, e gli step
    che c'erano già tengono la loro posizione nel designer;
  - gli **agent task**: prompt e descrizione. Schedulazione, uscite (webhook compreso) e politica di
    esecuzione restano quelle che hanno. Fino al 24/09/2026 un prompt cambiato veniva **ignorato in
    silenzio** — né nel piano né fermato da `BP067` — e la v32 di Studio Polis ne avrebbe portato sul
    tenant solo metà.
- **Resta com'è** tutto il resto, e il piano lo dice: «N entità del blueprint restano come sono».
  I profili di knowledge esistenti **non si riattivano** (riaccoderebbe l'indicizzazione di tutti i
  file) e i processi BPM non si aggiornano sul posto.
- **Non si cancella niente.** Ciò che la versione nuova non dichiara più è segnalato (`BP068`) e
  resta. Ciò che non si può fare sul posto ferma il piano (`BP067`).

Un nome occupato da un'entità che il blueprint **non** ha creato resta una collisione (`BP060`),
come prima.

```
Piano · como-conoscenza-associati v19 · tag COMO
  Aggiornamento della v14 applicata (run c4ae6a4d25d1): si crea ciò che manca e si aggiorna ciò che è cambiato.
  571 entità del blueprint restano come sono.

   1. Crea l'agente «BP-COMO-AgenteSede»
   2. Crea l'agente «BP-COMO-AgenteMappa» con 1 skill
   3. Assegna la skill «osm» all'agente «BP-COMO-AgenteMappa»
   4. Aggiorna l'agente «BP-COMO-AgenteResume»: istruzioni
   5. Aggiorna l'orchestratore «BP-COMO-Arricchimento report associato»: 9 modifiche
```

L'approvazione è la stessa di un'applicazione da zero. Se il tenant è già come la versione lo vuole,
il piano non ha operazioni, non chiede niente e il comando esce `0`.

All'esecuzione le entità del run di partenza **passano al run nuovo**, che da lì in avanti è quello
da riprendere, collaudare o smontare; il run di partenza resta come storico, nello stato
`Superseded`, e `rollback` su di lui rimanda al run nuovo. Il run nuovo registra anche che cosa ha
aggiornato e com'era prima (`status --run <runId>`).

## `status [--run <runId>] [--watch]`

Senza `--run`, elenca i blueprint pubblicati sul tenant e le ultime esecuzioni. Con `--run`, mostra
stato, fasi e inventario di quel run. `--watch` attende la conclusione.

## `environments [--env <nome>]`

Su quali ambienti l'utenza corrente può davvero lavorare.

Gli ambienti stanno **dentro il binario** e sono gli stessi per chiunque — `staging` e `prod`. I permessi no: sono ruoli di Azure sulla tua utenza, e fino a qui la differenza si scopriva
al primo comando, come errore di autorizzazione a lavoro già cominciato. Chi non è tecnico, davanti
a quell'errore, non sa nemmeno se il problema sia suo, dell'ambiente o del manifest.

Il comando prova a leggere l'App Configuration di ogni ambiente con la credenziale corrente, ed è
lo stesso permesso che serve a tutto il resto: quello che risponde qui è esattamente quello che
risponderà al primo comando vero. Non è una stima.

```
$ xrcopilotlab-bp environments

Ambienti
  La prova legge le chiavi di App Configuration con la tua utenza Azure: nessun segreto, niente scritture.

✓ staging   Staging     accessibile
    senza --company si lavora sul tenant di prova di questo ambiente
! prod      PRODUZIONE  manca il ruolo 'App Configuration Data Reader' sulla tua utenza
```

Quattro esiti, e distinguerli conta perché mandano da persone diverse:

| Esito | Cosa vuol dire | Cosa si fa |
|---|---|---|
| **accessibile** | la lettura è riuscita | si lavora |
| **manca il ruolo** | sei autenticato, ma l'utenza non legge quell'App Configuration | si chiede il ruolo a chi amministra la sottoscrizione ([`manuale.md`](../../../docs/manuale.md)) |
| **nessun accesso ad Azure** | nessuna credenziale sulla macchina | l'accesso si fa **una volta**, da un terminale |
| **non raggiungibile** | rete, DNS, endpoint | si riprova; non è un problema di permessi |

La prova chiede solo i **nomi** delle chiavi, mai i valori: non tocca Key Vault e non le passa
davanti nessun segreto. Con `--env <nome>` si prova un ambiente solo. Se nessuno è utilizzabile
esce **3**, così uno script — o la skill — se ne accorge senza leggere il testo.

I **profili scritti a mano** non vengono provati, solo elencati: puntano dove ha deciso chi li ha
scritti, e darli per buoni significherebbe affermare qualcosa che non è stato verificato.

Quello che questo comando **non** dice è quali *tenant* vedrai dentro un ambiente: quell'elenco lo
filtra il server sulla chiave `Companies:ListingFilter`, ed è uguale per tutti — in produzione, il
solo tenant di Hevolus. Il permesso personale riguarda l'ambiente, non il tenant.

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

## `test init` · `test validate` · `test run` · `test push` · `test reports`

Il collaudo di un blueprint **applicato**: una suite di domande per gli agenti, input per gli
orchestratori e dati di avvio per i processi, con le attese; l'esecuzione sul tenant; un report
con risposte, log e — per ogni fallimento — il componente da cui cominciare a guardare.

```bash
xrcopilotlab-bp test init     blueprints/test-agenda.yml                       # → blueprints/tests/test-agenda.tests.yml
xrcopilotlab-bp test validate blueprints/tests/test-agenda.tests.yml           # trova il manifest da solo
xrcopilotlab-bp test run      blueprints/tests/test-agenda.tests.yml --env staging --company <guid>
xrcopilotlab-bp test run      blueprints/tests/test-agenda.tests.yml --env staging --only agent,process
xrcopilotlab-bp test push     blueprints/tests/test-agenda.tests.yml --env staging --company <guid>
xrcopilotlab-bp test reports  --tag TEST --env staging --company <guid>
xrcopilotlab-bp test reports  --tag TEST --compare 0123456789ab --env staging --company <guid>
```

`init` non sovrascrive una suite esistente (`--overwrite`, o `--out`); `validate` accetta
`--manifest`; `run` accetta `--tag`, `--run <runId>`, `--only <chiavi,tag,entità>`, `--out
<cartella>`. Le entità si risolvono dall'inventario dell'ultimo run completato del tag. Il report
va in `blueprints/tests/reports/<tag>/<data>/` (ignorata da git) e nell'archivio del tenant, dove
lo trovano anche la chat dei blueprint e `test reports`. `push` porta una suite nell'archivio,
accanto al manifest del suo tag; `reports` elenca i report archiviati e, con `--compare <id>`,
confronta quel report caso per caso con il precedente della stessa suite.

Esce `0` se tutti i casi passano, **`7`** se almeno uno non passa, `2` se la suite non è valida,
`3` se il tag non ha un run sul tenant. Formato della suite, esiti, sospetti e codici `BT0xx`:
[`testing.md`](../../xrcopilotlab-blueprint-test/references/testing.md).

## `schedule list` · `schedule pause <task>` · `schedule resume <task>` · `schedule logs <task>`

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

`schedule logs <task> [--last <n>]` mostra ciò che lo scheduler da solo non dice: la **quota
giornaliera** del task (dichiarata con `executionPolicy`, o il default 100), la stima dei giri al
giorno del cron, e le ultime `n` esecuzioni (10 di default) con esito, durata e un estratto
dell'output o dell'errore.

```
Esecuzioni · BP-STUDIOPOLIS-Sorveglianza posta
  quota      2000 esecuzioni al giorno (UTC)
  cron       attivo   * * * * * (Europe/Rome) · prossima 2026-09-15 13:58 UTC · circa 1440 giri al giorno
  ultime 6 esecuzioni (6 oggi, fra quelle mostrate):
  2026-09-15 13:57:00 UTC  Completed     8.0s  NESSUN AVVISO
  …
```

Le esecuzioni **saltate per quota non lasciano traccia** qui: si riconoscono perché la `prossima`
dello scheduler avanza mentre l'ultima esecuzione registrata resta ferma, e il comando lo segnala
quando la distanza supera l'ora e mezza su un task che gira più di 24 volte al giorno. Il 15/09/2026
questo era l'unico segnale, e stava in un log di Application Insights.

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

Una connessione con `process:` (verso il webhook di un processo del blueprint) si ricostruisce da
altre due fonti: l'indirizzo dal webhook com'è sul tenant, la chiave dal segreto
`Blueprints:Secrets:<TAG>:webhook-<chiave>` che l'apply ha lasciato in Key Vault. Se il webhook è
stato rigenerato dall'interfaccia, prima `secrets set <TAG> webhook-<chiave>` con la nuova chiave,
poi `refresh`.

Emerso il **2026-09-14**: i due segreti Graph di Studio Polis erano scambiati fin dall'11/09
(`graph-client-id` conteneva il secret, `graph-client-secret` l'id). Correggerli in App
Configuration non è bastato — la connessione aveva i valori dell'apply — e `mcp test` continuava a
mostrare `AADSTS700016`. Il valore giusto è stato recuperato dalla **versione precedente** del
segreto in Key Vault, senza ruotare nulla.

## `knowledge list [<profilo>]` · `knowledge reingest <profilo>`

I profili di knowledge che il blueprint ha creato, lo stato di indicizzazione dei loro file, e la
richiesta di **reindicizzarli**: servono quando la libreria della knowledge graph cambia il modo di
leggere un file, e ciò che era già indicizzato va rifatto.

```bash
xrcopilotlab-bp knowledge list                        --tag COMO --env staging --company <guid>
xrcopilotlab-bp knowledge reingest bilanci            --tag COMO --env staging --company <guid>
xrcopilotlab-bp knowledge reingest bilanci --only "00020970133_GLASSFER SRL_2019.xlsx" --tag COMO --env staging --company <guid>
```

`reingest` **non indicizza da sé**: per ogni file chiede alla piattaforma la stessa cosa del pulsante
dell'interfaccia (`POST knowledgegraph/reingest`), che toglie il file dal grafo e lo rimette in coda.
Lo esegue il worker di AsyncOperations che legge quella coda, con la **sua** libreria: su `--env
staging` quello di staging, su `--env locale` quello avviato sulla macchina (vedi sotto). Finché il
worker non ha rifatto un file, quel file manca dalle risposte degli agenti che usano il profilo.
Prima di partire mostra quanti file e chiede conferma; senza terminale serve `--yes`. L'avanzamento
si legge con `knowledge list`. Con `--pending` chiede solo i file che non risultano `completed`: è
la ripresa di una reindicizzazione rimasta a metà (un worker fermato, messaggi finiti in dead letter),
senza rifare i file già a posto.

Perché non indicizza da sé: una CLI con la propria libreria metterebbe nel database dati prodotti da
una versione che non è quella in esercizio — chi legge con la X, chi ha scritto con la Y — e nessuno
se ne accorgerebbe. Passando dalla piattaforma, i dati li scrive sempre il worker dell'ambiente.

**Con Api e AsyncOperations in locale.** Il `local.settings.json` punta App Configuration di
**staging** (database, Cosmos, storage: i dati sono quelli di staging) ma il Service Bus di **dev**
(`sb-xrcopilotlab-dev-swedencentral`), e le variabili d'ambiente vincono su App Configuration. Le code
locali sono quindi separate da quelle di staging: una reindicizzazione chiesta con `--env locale` la
esegue l'AsyncOperations della macchina, con la libreria locale, e scrive nei dati di staging. Il
Durable usa Azurite con un task hub suo (`XRCopilotLabLocalHub`). Due cautele:

- AsyncOperations in locale va avviato **solo con le funzioni che servono** (`func host start
  --functions …`): i timer, come lo scheduler degli agent task, leggono il database di staging e
  rieseguirebbero in locale i lavori programmati di staging, in doppio.
- Il namespace di dev è condiviso: un collega con il suo AsyncOperations acceso nello stesso momento
  prende una parte dei messaggi.

Emerso il **2026-09-27**: la libreria 3.10.2 salva per intero il conto economico dei 548 bilanci di
Confindustria Como, che la 3.10.1 riduceva a una riga, e il worker di staging era ancora sulla 3.10.1.

## `instances list` · `instances show <id>` · `instances cancel`

Le istanze dei processi creati dal blueprint, viste dal motore. Durante un collaudo con ingressi
veri — una mail passa, la Sorveglianza la consegna al webhook — è il modo per sapere dove sta il
token senza aprire l'interfaccia, e per distinguere «manca il passo di una persona» da «l'agent
task è partito e non è tornato» (issue #1000).

```bash
xrcopilotlab-bp instances list --tag STUDIOPOLIS --env staging --company <guid> --running   # solo in corso
xrcopilotlab-bp instances show 5fcbbcc6 --tag STUDIOPOLIS --env staging --company <guid>     # anche un prefisso dell'id
```

`list` stampa per ogni istanza: avvio, id, stato, **nodo e stato del token** (`assegna:waiting` è
un compito umano aperto su «assegna»), fonte e tipo dal caseData, un estratto del testo.
`show` stampa gli eventi in ordine, i compiti con chi li ha presi, e i dati del caso; se l'ultimo
evento è `AgentTaskDispatched` da più di due minuti lo dice, con il rimando a `schedule logs`.

Emerso il **2026-09-16**: «non vedo l'evento sul calendario» — l'istanza stava su `assegna:waiting`,
cioè il referente aveva verificato ma non assegnato, e la Registrazione (che scrive) parte dopo
l'assegnazione. Senza il comando, l'unica risposta era «apri l'istanza e dimmi l'ultimo evento».

### `instances cancel` — annullare le istanze lasciate da un collaudo

```bash
xrcopilotlab-bp instances cancel 5fcbbcc6 --tag STUDIOPOLIS --env staging --yes                   # una, anche per prefisso
xrcopilotlab-bp instances cancel --tag STUDIOPOLIS --env staging --running --since 2026-09-24      # in blocco: prima l'elenco
xrcopilotlab-bp instances cancel --tag STUDIOPOLIS --env staging --running --contains "Collaudo" --yes
```

Annulla solo istanze dei processi del blueprint, risolti dall'inventario del run: l'id di un'istanza
di un processo fatto a mano viene rifiutato (**3**). In blocco vuole `--running` e almeno un filtro —
`--since` (data o data e ora, UTC), `--contains` (sul testo dell'avviso o della riga di designazione),
`--process` (nome o chiave) — e senza `--yes` stampa l'elenco e si ferma (**6**): non c'è un annulla.
L'annullamento passa dall'API, che registra `InstanceCancelledByUser` con chi l'ha chiesto, e il motore
lo esegue in coda. Emerso il **2026-09-24**: un collaudo di Studio Polis aveva lasciato una quarantina
di istanze ferme ai compiti del referente, chiudibili solo a mano una per una.

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
xrcopilotlab-bp mcp test    m365    --tool posta_in_arrivo --args '{"da":"2026-09-24T20:30:00Z"}' --full --tag STUDIOPOLIS   # la risposta intera, non troncata a 1200 caratteri
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

### `mcp orphans [--remove --yes]` — le voci del catalogo rimaste senza server

Il caso opposto: la riga del catalogo c'è, il server nel Builder no. Nell'interfaccia compare come
un server MCP **che non si collega**, perché punta al gateway di un server cancellato.

```bash
xrcopilotlab-bp mcp orphans --tag STUDIOPOLIS --env staging                  # sola lettura
xrcopilotlab-bp mcp orphans --tag STUDIOPOLIS --env staging --remove --yes   # cancella le orfane non usate
```

Elenca le voci del catalogo con il prefisso `BP-<TAG>-`, dice per ciascuna se il server esiste e
quali agenti la caricano — in **tutti** i topic del tenant, non solo in quello del blueprint. Non
serve un run: le orfane sono proprio quelle che nessun run elenca più. `--remove --yes` cancella
solo le orfane che **nessun agente** carica; se i collegamenti di un agente non si leggono, non
cancella niente (**3**). Senza `--yes` si ferma con **6**.

Emerso il **2026-09-24**: fino a quel giorno `rollback` lasciava la pubblicazione nel catalogo,
convinto che se ne andasse col server. L'API cancella solo la definizione, e dopo una trentina di
versioni di Studio Polis il catalogo era pieno di voci morte. Ora `rollback` la toglie prima del
server; `orphans` serve per quelle lasciate dai rollback precedenti.

## `update [--check]`

Porta all'ultima versione **la copia di cui questo comando è padrone**, che è una sola: quella
installata a mano. Per le altre dice cosa fare, e non tocca niente.

| Provenienza (la dice `version`) | Cosa fa `update` |
|---|---|
| **copia installata a mano** | scarica l'ultima release per la propria piattaforma, **verifica l'impronta SHA-256** e la mette al posto di questa |
| **cache del plugin** | non la tocca: lì la versione è appuntata **insieme alle skill**, ed è ciò che evita che una guida citi un comando che il binario non ha. Dice di usare `/plugin update blueprints@hevolus` |
| **strumento globale `dotnet tool`** | dice di toglierlo: quel pacchetto non è pubblicato su nessun feed, quindi «aggiornalo» sarebbe un consiglio impossibile |
| **build compilata qui** | niente: la versione la decidi tu, ricompilando |

Con `--check` dice cosa farebbe e si ferma: né scarica né sostituisce.

Scarica con `gh`, come fa l'avviatore del plugin — il catalogo è privato, e lì una credenziale per
leggerlo c'è già; se la release non è ancora rispecchiata prova il repository di prodotto. Senza
`gh` autenticato il comando non inventa niente: dice che non ha potuto sapere qual è l'ultima
versione e si ferma.

**La sostituzione è l'unico momento in cui si può controllare cosa si sta per eseguire**, quindi
l'impronta si verifica prima di rendere eseguibile il file. Il binario precedente viene spostato
accanto e rimosso solo a sostituzione riuscita: se qualcosa va storto a metà, viene rimesso al suo
posto — restare senza comando sarebbe il modo peggiore di fallire un aggiornamento. Su Windows un
eseguibile in esecuzione non si può sovrascrivere, ma si può rinominare, ed è per questo che
funziona anche lì.

## `version`

Quale CLI sta girando, e da dove viene.

```bash
xrcopilotlab-bp version
xrcopilotlab-bp version --verbose   # anche il runtime
xrcopilotlab-bp --version           # solo il numero
```

Stampa numero, percorso del binario, piattaforma (RID) e **origine**: variabile
`XRCOPILOTLAB_BP_BIN`, strumento globale `.dotnet/tools`, cache del plugin o allegato della release.

Serve perché gli avviatori del plugin cercano la CLI in quattro posti e si fermano al primo: su una
macchina dove qualcuno ha installato lo strumento globale mesi fa, quello continua a vincere anche
dopo un aggiornamento del plugin. Il sintomo è un comando che «non esiste» pur essendo nel manuale —
misurato il **21/09/2026**, strumento globale 1.1.1 contro la 2.11.2 del plugin. La prima domanda da
fare a chi segnala qualcosa di inspiegabile è l'uscita di questo comando.

## Prerequisiti sul tenant

- Licenza **`XRCopilotLab.Process`** attiva, altrimenti i processi non sono utilizzabili.
- Container Cosmos `blueprints` con partition key `/companyId`
  (vedi `XRCopilotLab.Data/Scripts/Migrations/Cosmos/`).
- Le skill citate dagli agenti già presenti nel catalogo: il blueprint non le crea.
- Gli utenti citati come membri di ruolo o owner già presenti nel tenant.
