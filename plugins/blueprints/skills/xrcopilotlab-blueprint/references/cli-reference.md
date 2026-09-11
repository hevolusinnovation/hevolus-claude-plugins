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

## Profili: quando servono davvero

Un profilo serve solo per lavorare **fuori** da un clone del repository, per puntare a un ambiente
diverso da quello del `local.settings.json`, o per sovrascrivere un singolo valore. Sta in
`~/.xrcopilotlab-bp/profiles.json`, e si seleziona con `--env <nome>`.

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
      "keyVaultUri": "https://kv-xrcopilotlab-staging.vault.azure.net/"
    }
  }
}
```

Ogni valore può essere scritto direttamente oppure nella forma **`env:NOME`**, che legge una
variabile d'ambiente: è la forma da preferire per tutto ciò che è una credenziale, così il file non
ne contiene nessuna.

`keyVaultUri` serve solo a `secrets set`, che deve sapere dove scrivere il valore.

Percorso del file sovrascrivibile con `XRCOPILOTLAB_BP_PROFILES`.

## Opzioni comuni

| Opzione | Significato |
|---|---|
| `--env <nome>` | Profilo di ambiente. Facoltativa: senza, l'ambiente si deduce dal repository. |
| `--company <guid>` | Tenant, se diverso da quello del manifest o del profilo. |
| `--tag <TAG>` | Blueprint su cui operare, per i comandi che partono da uno già pubblicato. |
| `--version <n>` | Versione del manifest. Senza, si usa la più recente. |
| `--yes` | Non chiede conferma. |
| `--no-graph` | Non stampa il grafo dei processi. |
| `--overwrite` | Consente di riscrivere una versione già pubblicata. Solo per iterare in sviluppo. |
| `--resume <runId>` | Riprende un run interrotto invece di crearne uno nuovo. |
| `--skip-external` | Salta la fase esterna nella pipeline. |
| `--blueprint <id>` | Blueprint su cui operare, quando due condividono il tag. |
| `--with-entities` | In `delete`, smonta dal tenant le entità ancora vive prima di cancellare l'archivio. |
| `--watch` | In `status`, attende la conclusione del run. |

Variabili d'ambiente: `XRCOPILOTLAB_BP_PROFILES` (percorso dei profili), `XRCOPILOTLAB_BP_DEBUG`
(traccia completa degli errori), `NO_COLOR` (output senza colore).

## Codici di uscita

Distinti perché uno script — o la skill di Claude — possa reagire senza interpretare i messaggi.

| Codice | Significato |
|---|---|
| `0` | Tutto a posto |
| `1` | Uso sbagliato: argomenti o configurazione mancanti |
| `2` | Il manifest non è valido |
| `3` | Il piano non è applicabile: collisioni, segreti o dipendenze mancanti |
| `4` | Una fase è fallita durante l'esecuzione |
| `5` | La pipeline è ferma su un passo manuale |
| `6` | Il piano è valido ma nessuno lo ha approvato |
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

## `secrets set --tag <TAG> <nome>`

Salva un segreto in Key Vault e ne registra il riferimento in App Configuration come
`Blueprints:Secrets:<TAG>:<nome>`.

```bash
xrcopilotlab-bp secrets set --tag STUDIOPOLIS graph-client-secret
# Valore per Blueprints:Secrets:STUDIOPOLIS:graph-client-secret: ●●●●●●●●
```

Il valore si digita **senza eco**, non compare a video, non entra nel manifest e non finisce nei
log. Per gli usi non interattivi: `--from-env NOME_VARIABILE`.

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

## `delete --tag <TAG> [--version <n>] [--with-entities]`

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

Come `apply`, mostra cosa sparisce e **chiede conferma**: senza terminale serve `--yes`, altrimenti
esce **6** senza cancellare nulla.

```bash
xrcopilotlab-bp delete --tag TEST --company <guid>                   # solo l'archivio
xrcopilotlab-bp delete --tag TEST --company <guid> --with-entities   # anche il tenant
xrcopilotlab-bp delete --tag TEST --version 2 --company <guid>       # una versione sola
```

## `external <file.yml>`

Risorse fuori dalla piattaforma: casella di posta, ingresso della posta, calendario. **Non ancora
implementato** (milestone 2). Oggi il comando riepiloga cosa il manifest dichiara e quali passi
manuali servono.

## `pipeline <file.yml>`

Percorre tutte le fasi in sequenza:

1. **validate** — offline;
2. **secrets** — verifica le chiavi citate, e si ferma stampando i comandi se ne manca una;
3. **push** — registra la versione;
4. **plan** — stampa il piano e chiede conferma, salvo `--yes`;
5. **apply** — esegue;
6. **external** — le risorse esterne.

L'ordine non è arbitrario: la fase esterna viene **dopo** l'applicazione perché l'ingresso della
posta deve puntare a un webhook che prima non esisteva.

```bash
xrcopilotlab-bp pipeline blueprints/test-agenda.yml --company <guid>
xrcopilotlab-bp pipeline blueprints/test-agenda.yml --yes --skip-external
xrcopilotlab-bp pipeline blueprints/test-agenda.yml --resume a1b2c3d4e5f6
```

## Prerequisiti sul tenant

- Licenza **`XRCopilotLab.Process`** attiva, altrimenti i processi non sono utilizzabili.
- Container Cosmos `blueprints` con partition key `/companyId`
  (vedi `XRCopilotLab.Data/Scripts/Migrations/Cosmos/`).
- Le skill citate dagli agenti già presenti nel catalogo: il blueprint non le crea.
- Gli utenti citati come membri di ruolo o owner già presenti nel tenant.
