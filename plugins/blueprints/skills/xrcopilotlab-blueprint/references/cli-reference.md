# `xrcopilotlab-bp` — riferimento dei comandi

Panoramica e concetti: [`manuale.md`](../../../docs/manuale.md). Formato del file: [`manifest-reference.md`](manifest-reference.md).

```
xrcopilotlab-bp <comando> [argomenti] [opzioni]
```

## Configurazione: `login` e basta

La CLI lavora **con l'account della persona**, mai con ruoli Azure (#1333, chiusa con la fase 5, #1772):

```bash
xrcopilotlab-bp login --env staging      # si apre il browser: un clic con l'account aziendale hevolus.it
xrcopilotlab-bp status                   # da qui in poi ogni comando parla con l'API con il tuo token
```

Non c'è niente da configurare: gli ambienti (`staging`, `prod`), l'indirizzo dell'API e l'app Entra
della CLI stanno **nel binario**. La sessione resta nel portachiavi del sistema e si rinnova da sola
finché non si fa `logout`. Nessun ruolo su App Configuration, Key Vault, Cosmos o storage: la CLI
non li legge più. Tutto passa dalle rotte `cli/*` dell'API, che legge archivio, segreti e tenant con
la **propria** identità e autorizza **per tenant** la persona del token.

Per provare contro un'API avviata in locale: `XRCOPILOTLAB_BP_API_URL=http://localhost:7071/api`
(il token resta quello dell'ambiente scelto con `--env`).

### Chi può fare che cosa

| Chi | Che cosa |
|---|---|
| utente di un tenant | legge: `status`, `plan`, `pull`, `catalog list`, `files ls`, `test reports`… |
| **amministratore** del tenant | scrive su quel tenant: `push`, `apply`, `rollback`, `delete`, `secrets set`, `test run`, `knowledge`, `mcp`… |
| **operatore di piattaforma** | tutto, su ogni tenant anche senza esserne utente, più il catalogo e l'archivio intero (`catalog publish`/`prune`, `copies`, `usage`, `access`). È il **super-amministratore del prodotto**: lo assegna il prodotto, non l'appartenenza a `hevolus.it`, e l'API registra ogni accesso con quel ruolo |

In produzione le scritture possono essere riservate a un elenco di persone
(`CliAccess:WriteAllowListEnforced`): vale anche per gli operatori.

## Ambiente e tenant: si scelgono per nome

Gli ambienti sono **dentro il binario** — `staging` (default) e `prod` — e si scelgono con `--env`:

```bash
xrcopilotlab-bp plan --env prod --tag COMO --company <guid>
```

**Il tenant è uno dei tuoi.** `--company <guid>` se è fra quelli a cui appartieni; senza, su
`staging` vale il tenant di prova dell'ambiente, altrove l'unico che hai. Con più tenant e nessuna
scelta il comando li elenca e si ferma: scegliere un tenant al posto di qualcuno non è una decisione da
prendere in automatico. Un tenant che non è fra i tuoi è rifiutato (403), e il rifiuto non dice se il
tenant esista. Un operatore di piattaforma indica sempre il tenant con `--company`.

Prima di ogni comando la CLI annuncia ambiente, tenant e con quale identità sta lavorando.

Provisionare in produzione l'ambiente di un cliente **non si fa da riga di comando**: si fa
dall'interfaccia. Non è un permesso che manca, è una scelta.

## Opzioni comuni

| Opzione | Significato |
|---|---|
| `--env <nome>` | Ambiente: `staging` (default) o `prod`. |
| `--company <guid>` | Tenant, fra quelli a cui appartieni. Senza, il tenant di prova di staging o l'unico che hai. |
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
| `--modules <k1,k2>` | In `plan`, `apply` e `pipeline`, i moduli da installare; le dipendenze si aggiungono da sole. Vedi [Moduli](#moduli-installazione-parziale-e-incrementale). |
| `--module <k>` | In `rollback`, smonta solo quel modulo. |
| `--only <k1,k2>` | In `test run`, i casi da eseguire: chiavi, tag, entità o moduli. |
| `--out <percorso>` | In `test init` il file da scrivere; in `test run` la cartella del report. |
| `--compare <reportId>` | In `test reports`, confronta quel report con il precedente della stessa suite. |
| `--report <reportId>` | In `test judge`, il report che si giudica. |
| `--file <giudizio.json>` | In `test judge`, i verdetti caso per caso. |
| `--summary <giudizio.md>` | In `test judge`, il riepilogo in Markdown: diagnosi, costo, attese da correggere. |

Variabili d'ambiente: `XRCOPILOTLAB_BP_API_URL` (l'indirizzo dell'API al posto di quello dell'ambiente), `XRCOPILOTLAB_BP_DEBUG`
(traccia completa degli errori), `NO_COLOR` (output senza colore).

## Codici di uscita

Distinti perché uno script — o la skill di Claude — possa reagire senza interpretare i messaggi.

| Codice | Significato |
|---|---|
| `0` | Tutto a posto |
| `1` | Uso sbagliato: argomenti o configurazione mancanti |
| `2` | Il manifest non è valido |
| `3` | Il piano non è applicabile: collisioni o dipendenze mancanti — oppure, in produzione, il tenant indicato non è fra quelli ammessi |
| `4` | Una fase è fallita durante l'esecuzione |
| `5` | La pipeline è ferma su un passo manuale |
| `6` | Manca una decisione umana: il piano non è stato approvato, o il tenant non è stato scelto |
| `7` | La suite di collaudo è stata eseguita e almeno un caso non è passato (`test run`) |
| `8` | Serve l'accesso: non c'è una sessione valida o l'API non ti riconosce (`login`, `whoami`) |
| `70` | Errore imprevisto |

---

## `validate <file.yml>`

Verifica il manifest **senza toccare la rete**: struttura, chiavi duplicate, riferimenti fra
sezioni, e il grafo di ogni processo. Le regole del grafo non sono riscritte nella CLI: si delega
allo stesso validatore che gira sul server, quindi ciò che passa qui passa anche lì.

```bash
xrcopilotlab-bp validate docs/blueprints/esempi/test-agenda.yml
xrcopilotlab-bp validate docs/blueprints/esempi/test-agenda.yml --graph   # stampa anche il disegno
```

Non richiede `--env` né credenziali: gira ovunque, anche in una pipeline di verifica.

## `suggest <file.yml> [--files <cartella>]`

Propone come ripartire i documenti fra i profili di knowledge e quale **fascia** di modello dare a
ciascun agente. Non scrive niente: né sul tenant né sul manifest, e stampa la sezione YAML da
incollare dopo averla decisa.

```bash
xrcopilotlab-bp suggest ~/.xrcopilotlab/blueprints/FINLOGIC/finlogic-bilancio-aggregato.yml --files test-data
xrcopilotlab-bp suggest ~/.xrcopilotlab/blueprints/FINLOGIC/finlogic-bilancio-aggregato.yml --env staging
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

La proposta è un **punto di partenza da accorpare**: la forma di un manifest è un profilo per dominio,
condiviso dagli agenti che lavorano sugli stessi documenti, perché ogni profilo attivo consuma una
licenza (vedi [`manifest-reference.md`](manifest-reference.md#come-si-dividono-i-file-fra-i-profili)).

Quello che invece calcola in modo esatto sono i vincoli: quali file il selettore non riuscirà a
distinguere, e quali, dentro il profilo in cui finiscono, non hanno parole proprie — e verranno
quindi esclusi appena una domanda nomina uno degli altri.

La proposta di modello viaggia sempre con i **segnali** da cui è nata (legge documenti? chiama
strumenti? riceve l'output di un altro passo?), perché sono indizi del carico e non il carico: un
agente senza documenti né strumenti può essere il passo più difficile della catena. I nomi che non
dichiarano la fascia — un `codex`, un `fast-non-reasoning`, le famiglie non GPT — non vengono
proposti per esclusione.

## `secrets set --company <tenant> --tag <TAG> <nome>`

Salva un segreto **nella piattaforma** (#1798): l'API lo cifra, come fa con le credenziali delle
connessioni, e lo conserva per tenant e tag. Il manifest lo cita come `Blueprints:Secrets:<TAG>:<nome>`;
la riga porta anche il **tenant**, perché un segreto appartiene a un tenant, e due tenant che
installano lo stesso modello del catalogo con lo stesso tag non devono scriversi addosso (#1185).
Niente Key Vault, niente App Configuration: fino al 03/11/2026 il valore stava lì, e chi lo scriveva
aveva bisogno di due ruoli Azure.

Il valore va all'API (`POST cli/{companyId}/secrets`, #1518): basta essere amministratore del tenant, nessun ruolo
Azure. La risposta porta il riferimento, mai il valore. Un blueprint bloccato lo aggiorna solo un suo owner. Allo stesso
modo `secrets check` chiede all'API solo se ogni segreto c'è (`POST cli/{companyId}/secrets/check`).

```bash
xrcopilotlab-bp secrets set --company <tenant> --tag STUDIOPOLIS graph-client-secret
# Valore per Blueprints:Secrets:STUDIOPOLIS:graph-client-secret: ●●●●●●●●
```

Il valore si digita **senza eco**, non compare a video, non entra nel manifest e non finisce nei
log. Per gli usi non interattivi: `--from-env NOME_VARIABILE`.

Vale **da subito**: il prossimo `plan` lo vede, e l'apply lo dà alla connessione che lo cita. Le
**connessioni** già create non cambiano da sole: `connections refresh --tag <TAG>` (sotto). I
segreti di un tag se ne vanno con `delete` del blueprint; `rollback` li lascia, per l'apply successivo.

**`secrets set` non è obbligatorio** (#1234): un segreto non impostato non ferma il piano
(`BP063` è un avviso). La connessione nasce senza credenziali, la prova del tool che la usa si salta,
e chi amministra il tenant le inserisce dopo l'apply dalla UI, in **Amministrazione › Connessioni**
(matita sulla connessione › Autenticazione › «Set / update credentials» › Salva). `secrets set` serve
a chi vuole precaricarle: allora l'apply le scrive da sé. **La chat dei blueprint non chiede mai il
valore di un segreto**: spiega alla persona dove inserirlo.

## `secrets check <file.yml>`

Elenca i segreti che il manifest cita e dice quali mancano, stampando i comandi per crearli. Esce
con `0` anche se ne manca qualcuno: le connessioni che li citano nasceranno senza credenziali, da
inserire dalla UI (#1234).

## `push <file.yml>`

Registra una versione del manifest: il testo YAML nello storage, il manifest interpretato in
Cosmos. Stampa identificativo, versione, percorso del blob e impronta SHA-256.

> **Con il token utente** (`login`, #1770): manifest e file viaggiano nella richiesta e scrive l'API; vedi [«Senza ruoli Azure»](#senza-ruoli-azure-come-lavora-la-cli-1333-1772).

Una versione pubblicata è **immutabile**: ripubblicare la stessa viene rifiutato. Si alza `version:`
nel manifest, oppure — solo per iterare in sviluppo — si usa `--overwrite`.

**Fuori dalla produzione restano le ultime due versioni (#1596).** Su staging e sugli altri ambienti di
sviluppo, dopo ogni `push` l'archivio del tenant tiene la versione appena scritta e quella prima: le più
vecchie escono con i loro file di knowledge e i loro run, e il comando lo dice. Una versione che ha ancora
entità installate sul tenant resta, qualunque numero abbia: il suo run è l'unica cosa che sa come
smontarle. Suite, report e documenti del blueprint non si toccano. In produzione le versioni restano
tutte. La stessa regola vale per `pipeline`, `promote` verso un ambiente non di produzione, `catalog
install` e i manifest scritti dalla chat; per ciò che era in archivio prima della regola c'è
[`prune`](#prune---tag-tag---keep-n---confirm-tagarchivio).

**Accesso (#1518).** Se la versione in vigore dichiara `access`, valgono i suoi owner: chi non è fra loro non
cambia `access` (`BP124`) e non porta una versione nuova di un blueprint bloccato (`BP125`). Chi toglie sé stesso
dagli owner riceve `BP126` e ripete con `--release-ownership` per confermare. Allo stesso modo `apply` di un
blueprint bloccato è solo per un owner, e `promote`, `catalog install`, `export` e `catalog publish` di un
blueprint bloccato li fa solo un suo owner (`BP123`).

**App del blueprint (#1566).** Se il manifest ha una sezione `apps`, `push` controlla i sorgenti di ogni app
prima di scrivere (`BP161`: niente che somigli a una credenziale, niente `.env`, nessuna chiamata a XRCopilot
dal codice del browser; `BP162` avvisa degli id scritti nel codice) e poi li archivia con la versione, sotto
`apps/<chiave>/`, senza `node_modules`, `dist` e cache. Lo stesso fanno `validate` (solo il controllo) e
`catalog publish`.

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


Con `--with-files` arrivano anche i file della versione, dove il manifest li dichiara (#1732): la knowledge nei suoi `path` (relativi alla cartella del manifest) e i sorgenti di ogni app nella sua `source`. La cartella si valida e si ripubblica così com'è. Un file di knowledge il cui percorso non si può usare — assoluto, fuori dalla cartella, o dichiarato due volte con percorsi diversi — finisce in `files/`, e il comando lo dice. Vale anche per `catalog pull --with-files`.

## `files ls` · `files put <file>` · `files get <percorso>` · `files rm <percorso>` · `files open <percorso>` · `files share <percorso>` · `files consolidate`

Tutto ciò che un blueprint produce o richiede, oltre al manifest, sta nell'archivio nel cloud accanto
a lui: suite di collaudo, report, guide, bozze e allegati (#1212). Il repository non è la fonte di
verità di questi file, e non serve una PR per aggiungerne o cambiarne uno.

```
blueprints/<tenant>/<blueprint>/
  v<n>/manifest.yaml                manifest   (lo scrive solo `push`, immutabile)
  v<n>/files/…                      knowledge  (`push`)
  tests/<nome>.v<k>.tests.yml       suite      versionata per nome, con il suo documento (`test push`, `files put --kind suite`)
  reports/<aaaammgg-hhmmss>/…       report     per data del collaudo: report.json, report.md, giudizio.md…
  docs/…  draft/…  attachments/…
```

Un posto solo per specie, da terminale e dalla chat. Fino al 06/10/2026 le suite caricate con
`files put` stavano in `v<n>/tests/` e il JSON dei report indicizzati in `test-reports/<reportId>/`:
si leggono ancora, e `files consolidate` li porta nei posti di oggi.

| Comando | Fa |
|---|---|
| `files ls --tag <TAG> [--kind <specie>]` | Elenca ogni file del blueprint: specie, percorso, dimensione, data, impronta (SHA-256) e autore |
| `files put <file> --tag <TAG> --kind <suite\|report\|doc\|draft\|attachment> [--name <nome>] [--version <n>] [--stamp <aaaammgg-hhmmss>]` | Archivia un file. Una suite diventa una versione nuova fra le suite del tag, come con `test push` ma senza la verifica contro il manifest; un report va sotto il timbro (default: adesso). Con una **cartella** archivia tutti i file con un solo accesso all'ambiente, ciascuno con il suo percorso relativo: per i report la prima sottocartella è il timbro (`20261006-141450/report.md`), a meno di `--stamp`. I file identici a quelli già archiviati si saltano, quelli nascosti anche |
| `files get <percorso> --tag <TAG> [--out <cartella>\|<file>] [--overwrite]` | Scarica un file, col percorso che mostra `files ls`. `--out` è la cartella di lavoro (il file va in `<cartella>/<TAG>/<percorso>`); se invece è il nome di un file (ha un'estensione e non è una cartella che esiste), il file va esattamente lì (#1734). Si scaricano anche i file nascosti che il push ha archiviato, come `.env.example` di un'app (#1733) |
| `files get --all --tag <TAG> [--kind <specie>] [--out <cartella>]` | Scarica tutto, o una specie |
| `files rm <percorso> --tag <TAG> [--yes]` | Toglie **un solo** file. Solo suite, report, guide, bozze e allegati: il manifest, la knowledge e ciò che un apply ha prodotto fanno parte di una versione, e si tolgono con `delete --version`. Chiede `[s/N]`; senza terminale si ferma con **6** finché non c'è `--yes`. Non si annulla |
| `files open <percorso> --tag <TAG>` | Scarica il file (sempre una copia fresca) e lo apre con l'applicazione predefinita; senza terminale stampa solo il percorso |
| `files share <percorso> --tag <TAG> [--expires <30m\|12h\|7d>]` | Produce un link di **sola lettura** a quel file, a scadenza (default 24 h, massimo 7 giorni) |
| `files consolidate --tag <TAG> [--yes]` | Porta nei posti di oggi suite (`v<n>/tests/` → `tests/`) e report (`test-reports/` → `reports/<timbro>/`, con `report.md` e il documento aggiornato). Senza `--yes` dice soltanto che cosa farebbe; si può ripetere |

- **Cartella locale.** Senza `--out`, `get` scrive in `<cartella temporanea del sistema>/xrcopilotlab-bp/workspace/<TAG>/…`,
  o dove indica la variabile `XRCOPILOTLAB_BP_WORKSPACE`. Sta **fuori dal repository** ed è un appoggio:
  la sede del blueprint è l'archivio del tenant, e una copia su disco non va né committata né tenuta. Una suite ci arriva senza versione (`tests/<nome>.tests.yml`, accanto al manifest)
  e, con `--all`, solo nella versione più recente.
- **Sovrascrivere.** Suite, guide, bozze e allegati si riscrivono; un report ha il suo timbro e di
  norma non si tocca. Il manifest non passa di qui.
- **Segreti.** Prima di archiviare un file di testo se ne cerca il contenuto per ciò che somiglia a
  una credenziale (chiavi di storage, password in una connection string, chiavi private, JWT, firme
  SAS, valori in chiaro per campi da segreto). Se ne trova, il comando si ferma con la riga e la regola
  — mai il valore — ed esce con codice 1. Un riferimento `Blueprints:Secrets:<TAG>:<nome>` passa.
- **Link condivisibili.** Il link vale per un solo file e non permette di cambiare niente, ma vale per
  *chiunque lo abbia* fino alla scadenza: va mandato solo a chi deve vedere il file. Si firma con la
  chiave dell'account se la connection string dell'ambiente la porta, altrimenti con la tua identità,
  e allora serve il ruolo *Storage Blob Delegator* sull'account (se manca, il comando lo dice). Ogni
  link prodotto lascia una traccia nell'archivio — chi, quale file, fino a quando — **senza** l'indirizzo.
- **Cancellazione.** `delete` dell'intero blueprint toglie anche questi file; `delete --version` non
  tocca quelli senza versione.

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
letture, e le fa la **piattaforma** (job accodato dall'API, #1772): la CLI aspetta e scarica. Scrive una cartella con tre file:

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
| `tenant` | tutto. Il primo topic per nome diventa quello di `tenant`, gli altri vanno in `topics` (quello degli agenti rapidi si riusa per id); un topic in cui l'ambito non lascia niente non entra |

Ciò da cui le entità dell'ambito dipendono entra da sé — i profili e i server MCP di un agente, la
connessione di un server MCP, il processo che un agent task avvia, i ruoli e gli agent task di un
processo, gli agenti di un orchestratore — e il rapporto dice chi l'ha fatto entrare. Un ambito che
non si può rispettare (un orchestratore con agenti in topic diversi) esce
**1** con il motivo.

**Il manifest è un modello, non una fotocopia.** I nomi escono senza `BP-<TAG>-`, che l'apply rimette;
le chiavi sono slug dei nomi, o quelle dell'inventario con `--scope blueprint`; i riferimenti fra
sezioni passano per le chiavi, mai per gli id del tenant. Un'entità fatta a mano, senza prefisso,
all'apply lo riceve: riapplicare l'export sullo stesso tenant ne creerebbe una copia, e collegare le
chiavi a entità che esistono già è un passo che ancora non c'è.

**Nessun valore segreto esce.** Le chiavi degli endpoint AI e le credenziali dei server MCP l'API
non le restituisce più (#1052: arrivano mascherate); altre credenziali — gli header di un'uscita
webhook — sì, e l'export le ferma:

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

Provato su staging con `--scope blueprint STUDIOPOLIS` contro il manifest di `STUDIOPOLIS` (`pull --tag STUDIOPOLIS`):
stesse chiavi in tutte le sezioni; ruoli, agenti, agent task e processi identici, a meno dei dati
personali; le differenze che restano sono quelle che il rapporto dichiara.

**Blueprint bloccati (#1518).** L'export di un orchestratore, di un topic o del tenant intero si rifiuta (`BP123`)
se porta con sé entità create da un blueprint bloccato applicato sul tenant, e chi esporta non è un suo owner: sarebbe
una copia per un'altra strada. Contano solo le entità create dal blueprint, non quelle che ha adottato (un topic
esistente). Vale anche per l'export di un orchestratore dalla CLI con il token; dall'editor della webapp, che non
conosce gli owner, l'export di quelle entità non si fa.

## `access migrate --owners <email,…> [--all | --catalog | --company <tenant>] [--apply] [--yes]`

> **Operatore di piattaforma** (#1772): questo comando passa dalle rotte `cli/platform/*`, riservate al super-amministratore del prodotto; con più ambienti serve un `login` per ciascuno. L'API registra ogni accesso.

La migrazione una tantum di `access` (#1518): alle versioni archiviate prima che esistesse dà scope e owner,
**nei soli campi d'accesso del documento d'archivio** — il manifest e la sua impronta non cambiano.

| Dove sta la versione | Scope |
|---|---|
| catalogo (`--catalog`), su staging o in produzione | `public` |
| un tenant di staging, copie comprese | `staging` |
| un tenant di produzione, copie comprese | `tenant` |

Con `--all` passa ogni archivio dell'ambiente che ha almeno una versione, catalogo compreso, in un comando solo: è
la forma da usare per migrare un ambiente intero. Lo scope lo decide l'archivio in cui sta la versione, qualunque cosa
dichiari il manifest: le versioni senza scope o con uno scope diverso si correggono, con i loro owner (quelli della
versione, poi quelli del manifest, poi `--owners`). Da #1518 ogni scrittura — `push`, chat, `promote`, installazione —
scrive già lo scope del posto, quindi la migrazione serve solo per l'archivio di prima. Senza `--apply` mostra solo
l'elenco; in produzione scrivere chiede anche `--yes`. `--owners` è obbligatorio: una versione con accesso ha almeno
un owner (`BP121`).

**Collegamento al catalogo.** Nello stesso giro `access migrate` segna (`catalogModel`) le versioni di un tenant che hanno
lo stesso identificativo di un modello del catalogo dell'ambiente: ne derivano, o il modello è nato da loro. È una
marcatura: un'installazione dal catalogo la dice `promotedFrom`, come prima.

**Solo tenant vivi.** Una partizione dell'archivio non sparisce quando il suo tenant viene tolto: prima di migrarla il
comando chiede all'API se il tenant esiste ancora (`GET companies/{companyId}/existence`), e salta con un avviso le
partizioni orfane e quelle che non ha potuto verificare (un'API senza l'endpoint, un database che non risponde). Le
partizioni orfane si vedono e si cancellano con `access orphans`.

## `access retag --tag <VECCHIO> --to <NUOVO> --company <tenant> [--blueprint <id>] [--apply] [--yes]`

> **Operatore di piattaforma** (#1772): questo comando passa dalle rotte `cli/platform/*`, riservate al super-amministratore del prodotto; con più ambienti serve un `login` per ciascuno. L'API registra ogni accesso.

Cambia il tag delle versioni archiviate di un blueprint (#1518): la riga `tag:` e i riferimenti
`Blueprints:Secrets:<TAG>:` nel testo del manifest, il documento d'archivio e l'impronta; il tag di prima resta in
`previousTags`. Solo l'archivio, quindi si rifiuta se il tag vecchio ha **entità vive** sul tenant (i loro nomi
`BP-<TAG>-…` e i segreti portano il tag): lì il tag si cambia con una versione nuova e un nuovo apply, dopo il rollback.
Si rifiuta anche se il tag nuovo è di un altro blueprint del tenant; quello dello stesso blueprint va bene (due tag per
un blueprint si riuniscono così). I segreti già impostati per il tag vecchio non si spostano: si rifanno con
`secrets set`. Senza `--apply` mostra solo l'elenco; in produzione scrivere chiede anche `--yes`.

Come `migrate`, si rifiuta (`3`) se il tenant non esiste più o se non si è potuto verificare.

## `access orphans [--env <e>] [--delete <GUID> --confirm <GUID>]`

> **Operatore di piattaforma** (#1772): questo comando passa dalle rotte `cli/platform/*`, riservate al super-amministratore del prodotto; con più ambienti serve un `login` per ciascuno. L'API registra ogni accesso.

Le partizioni dell'archivio e il tenant a cui appartengono (#1518): **tenant vivo**, **orfana** (il tenant non esiste
più), **non verificata** o catalogo, con quanti blueprint e documenti contiene ognuna. Senza `--delete` legge e basta.

Un tenant esiste se lo trova **almeno una** di tre prove: la vista dei prodotti di HevoHub, la riga di configurazione
in XRCopilotLab, gli agenti con quel `CompanyId`. «Orfana» vuol dire che non lo trova nessuna, e si sbaglia per
prudenza: un tenant senza licenze ma con agenti è vivo. Il GUID tutto a zeri è sempre orfano (`BP131`: è un
segnaposto, e da #1518 il validatore lo rifiuta prima del `push`).

`--delete <GUID>` cancella **tutta** la partizione — versioni, run, collaudi, link, eventi di copia e i file sotto
`blueprints/<GUID>/` — solo se:

- l'API conferma **adesso** che il tenant non esiste (una risposta mancata non vale come «non esiste»);
- `--confirm` ripete il GUID esatto;
- la partizione non contiene documenti che la cancellazione non sa togliere, come i backup di un tenant, i cui file
  vivono in altri container.

Le entità che i run avevano creato non si smontano: il tenant non c'è più, e con lui di norma i suoi dati.

```bash
xrcopilotlab-bp access orphans --env prod
xrcopilotlab-bp access orphans --env prod --delete 0bace645-… --confirm 0bace645-…
```

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

**Le app di demo si scelgono verso la produzione (#1566).** Le app si creano solo in produzione (`BP169` altrove),
quindi una copia verso un altro ambiente le porta tutte senza chiedere. Verso la produzione, se il manifest ha app
`kind: demo`, `promote` le elenca e chiede «Quali app di demo copio?», con risposta proposta **tutte**; `--demo-apps all|none|<chiave,chiave>` risponde
da riga di comando, e senza terminale e senza l'opzione il comando si ferma con **6** — la scelta è di chi
copia. Il manifest arriva identico comunque (lo SHA è la prova): la risposta decide quali sorgenti viaggiano,
e la copia registra le app lasciate all'origine (`demoAppsLeftOut`). Le app `kind: product` viaggiano sempre.

Viaggiano gli **ingressi** della versione: il manifest, la knowledge e i sorgenti delle app archiviati con il push. Non
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

**Ogni copia è firmata e registrata** (#1516). Oltre a `promotedFrom` sul documento, la copia lascia
un evento nella partizione della destinazione: chi l'ha fatta, da dove a dove (ambiente, tenant con
il nome della company), quando, per quale strada e da quale **origine prima** — una copia di una
copia porta l'origine della prima. La firma è l'email del token con cui la CLI parla con
l'API, e la mette l'API: `firmata nome.cognome@hevolus.it`. L'evento non si riscrive e `delete`
non lo porta via: è la misura di quanto il blueprint si usa (`copies`).

## `copies [--tag <TAG>] [--env <e>|all] [--since <aaaa-mm-gg>] [--top <n>] [--json]`

> **Operatore di piattaforma** (#1772): questo comando passa dalle rotte `cli/platform/*`, riservate al super-amministratore del prodotto; con più ambienti serve un `login` per ciascuno. L'API registra ogni accesso.

**Quali blueprint si usano di più**: la classifica delle copie fra tenant e ambienti (#1516). Legge
e basta, da tutte le partizioni di ogni ambiente — per questo è un comando dello **staff**: dice dove
sono finite le copie di un cliente, che è un'informazione degli altri clienti. La chat dei blueprint
non lo esegue, e nessuna pagina della webapp lo mostra.

```bash
xrcopilotlab-bp copies                         # tutti gli ambienti noti, classifica intera
xrcopilotlab-bp copies --env prod --top 10     # solo produzione, i primi dieci
xrcopilotlab-bp copies --tag FINBANK           # ogni copia di un blueprint, con firma e destinazione
xrcopilotlab-bp copies --since 2026-10-01 --json
```

| Colonna | Che cosa conta |
|---|---|
| applicate | copie con un `apply` completato sulla destinazione — è **l'ordine** della classifica: una copia mai applicata non è un uso |
| copie | tutte le copie, anche due della stessa versione sullo stesso tenant |
| tenant | destinazioni distinte (ambiente e tenant: lo stesso cliente su staging e produzione conta due) |
| ultima copia | data, firma (`*` = non verificata) e destinazione |

Le copie si raggruppano per **blueprint d'origine**: staging → produzione → catalogo → tenant dei
clienti è una riga sola, anche se il modello del catalogo, pubblicato da un file, è un'origine nuova
(lo slug resta lo stesso). `--tag` accetta lo slug o il tag che la copia ha sulla destinazione. Le
copie fatte prima del #1516 si contano da `promotedFrom`, senza scrivere niente sui tenant: firmate
con ciò che c'era (di norma il nome del computer) e applicate se un run completato le segue.

Senza `--env` si leggono tutti gli ambienti noti; uno illeggibile non ferma gli altri, ma la
classifica lo dichiara. `--since` restringe le copie, non i run.

## `usage [--tag <TAG>] [--env <e>|all] [--out <file>] [--json]`

> **Operatore di piattaforma** (#1772): questo comando passa dalle rotte `cli/platform/*`, riservate al super-amministratore del prodotto; con più ambienti serve un `login` per ciascuno. L'API registra ogni accesso.

**Dove vive ogni blueprint** (#1665). `copies` conta solo ciò che è passato da `promote` o dal
catalogo; un blueprint pubblicato e applicato direttamente sul tenant del cliente non lascia una copia,
ma lascia un run. `usage` conta le **installazioni** — un blueprint su un tenant di un ambiente con un
run completato — e mette accanto le copie. Legge e basta, da tutte le partizioni, come `copies`: è un
comando dello **staff**, la chat non lo esegue e nessuna pagina della webapp lo mostra.

```bash
xrcopilotlab-bp usage                          # tutti gli ambienti, un blueprint per riga
xrcopilotlab-bp usage --tag FINBANK            # le installazioni di un blueprint, tenant per tenant
xrcopilotlab-bp usage --out uso.json           # il riepilogo in JSON (lo usa il marketplace interno)
```

| Colonna | Che cosa conta |
|---|---|
| vive | installazioni con un run completato oggi — è **l'ordine** |
| dirette | installazioni vive senza una copia e che non sono l'origine di una copia |
| copie · applicate | come in `copies` |
| tenant | tenant distinti (ambiente e tenant) con un'installazione viva |

Un'installazione è di tre tipi: **copia** (il tenant ha ricevuto una copia), **origine** (il tenant da
cui una copia è partita) o **diretta**. È **disinstallata** quando non ha più un run completato ma ha la
prova di esserlo stata: un run superato da un aggiornamento, o una copia timbrata come applicata. Un
rollback di un apply fallito ha lo stesso stato di quello di un apply riuscito, quindi un'installazione
diretta di una sola versione, poi smontata, non si conta: il numero delle disinstallate è un minimo.

Il nome del tenant viene dall'evento di copia o dall'elenco dei tenant dell'ambiente (`GET companies`,
letto dall'API per l'operatore di piattaforma che chiede: `GET cli/platform/usage?names=true`). In produzione quell'elenco è filtrato
(`Companies:ListingFilter`) perché non pubblichi la lista dei clienti: per i tenant con un blueprint che
l'elenco non nomina, il nome si chiede uno alla volta a `GET companies/{id}/existence`, come fa
`access orphans` — solo per loro, non per enumerare l'ambiente. Un tenant senza nome nemmeno in HevoHub
resta senza, e si conta in `totals.unnamedTenants`. Il JSON porta gli id dei tenant: chi lo pubblica altrove li toglie prima.

## `audit [--tag <TAG>] [--idle <giorni>] [--archive-only] [--json] [--out <file>]` · `audit keep` · `audit release`

Che cosa, fra i blueprint di un tenant, è **fermo**, **doppio** o **mai usato** (#1766), con i segnali che lo
dicono: la lettura unica da cui parte la pulizia di staging, al posto di decine di `status`, `usage`,
`test reports`, `instances list` e `schedule list` per tag. Legge e basta.

```bash
xrcopilotlab-bp audit --env staging --company <guid>                 # tutti i blueprint del tenant, un giudizio per riga
xrcopilotlab-bp audit --env staging --company <guid> --idle 45       # fermo = oltre 45 giorni senza attività (default 30)
xrcopilotlab-bp audit --env staging --company <guid> --archive-only  # senza leggere istanze e schedulazioni sul tenant
xrcopilotlab-bp audit --env staging --company <guid> --json          # il riepilogo intero, per la skill che pulisce
xrcopilotlab-bp audit keep --tag PERONISOP --reason "demo del 15/11" --env staging --company <guid>
xrcopilotlab-bp audit release --tag PERONISOP --env staging --company <guid>
```

Per ogni blueprint: i tag, le versioni, quella installata, i giorni dall'**ultima attività nell'archivio**
(versione, run, suite o report: l'archivio non vede le conversazioni, quindi «fermo» è un giudizio
sull'archivio, e ogni riga dice da quale segnale viene), se è un modello del catalogo, suite e report,
e — salvo `--archive-only` — le istanze in corso dei suoi processi e le schedulazioni attive dei suoi
agent task. I giudizi, nell'ordine in cui si stampano:

| Giudizio | Quando | Che cosa si fa |
|---|---|---|
| `keep` (tieni) | tenuto apposta con `audit keep`, o modello del catalogo | niente: non si propone mai |
| `active` (attivo) | installato, attività recente, niente che lo segnali | niente |
| `review` (guarda) | installato e recente, ma il nome dice prova: `test`, `prova`, `demo`, una data | si chiede a chi l'ha fatto |
| `duplicate` (doppio) | lo stesso tag su più nomi, una famiglia di almeno tre con lo stesso primo segmento (`peroni-*`), una variante nel nome (`-rag`, `-mcp`, `-multi`) | se ne tiene una: `rollback` e `delete` per le altre |
| `idle` (fermo) | installato e senza attività da oltre la soglia | `rollback --run`, e `delete --tag` se l'archivio non serve |
| `unused` (non usato) | nell'archivio senza un'installazione: mai applicato, o smontato | `delete --tag` |

Fra i motivi compaiono anche i **run da chiudere** (completati senza più niente da smontare: `rollback --run` li
chiude), le versioni vecchie trattenute da run installati, e le istanze in corso: un blueprint con istanze
aperte si smonta dopo `instances cancel`. Il giudizio è una proposta: a decidere è chi legge, e a eseguire
restano `rollback` e `delete`, con le loro conferme.

**`audit keep`** segna un blueprint come tenuto apposta, con il motivo scritto (`--reason`): l'audit lo mostra
con quel motivo e non lo propone, così la stessa domanda non torna a ogni pulizia. È un documento `keep` nella
partizione del tenant; **`audit release`** lo toglie, e `delete --tag` lo porta via con l'archivio.

## `catalog list` · `catalog publish <modello.yml>` · `catalog install <modello>` · `catalog prune`

Il **catalogo** dei blueprint pronti, curati da Hevolus e installabili da qualunque tenant (#1185).
Vive nello stesso archivio dei tenant, nella partizione `default`; perché e come si scrive un
modello: [`catalogo.md`](catalogo.md). `list`, `pull` e `install` li fa ogni utente sul proprio tenant;
`publish` e `prune` passano da `cli/platform/catalog/*` e sono dell'**operatore di piattaforma** (#1772):
la CLI mostra l'anteprima (ritenzione, versioni che escono) e chiede, l'API riapplica la regola e scrive.

```bash
xrcopilotlab-bp catalog list --env staging [--company <tenant>]
xrcopilotlab-bp catalog pull legal-agenda --env staging --out <file> [--version <n>] [--with-files]
xrcopilotlab-bp catalog publish ~/.xrcopilotlab/blueprints/LEGAL/legal-agenda.yml --env staging [--documents-reviewed]
xrcopilotlab-bp catalog install legal-agenda --env staging --company <tenant> \
    [--version <n>] [--tag <TAG>] [--prefix "<testo>" | --no-prefix] \
    [--topic <nome> | --existing-topic <nome>] \
    [--members "referente=a@studio.it,b@studio.it;segreteria=c@studio.it"] \
    [--replace "segnaposto@esempio.invalid=utente@studio.it;capo@hevolus.it=altro@studio.it"]
xrcopilotlab-bp catalog prune [<modello>] --env prod [--confirm <modello>|catalogo]
```

- **`install`** — senza `--tag`, il tag della copia è quello del modello seguito dal codice del nome
  del tenant (`LEGAL` su «Pippo SRL» → `LEGALPIPPOSRL`); un aggiornamento tiene il tag già installato.
  Se il nome non si ricava (`BP109`), il comando si ferma e chiede `--tag`.
- **`list`** — l'ultima versione di ogni modello, con che cosa crea. Con `--company`, anche che
  cosa ha installato quel tenant e se nel catalogo c'è una versione più nuova.
- **`pull`** — riscrive su disco un modello del catalogo (sola lettura), per rivederlo o correggerlo
  e ripubblicarlo con una versione nuova. `pull` normale non lo raggiunge: il catalogo non è un tenant.
- **`publish`** — controlla che il file sia un **modello** (`BP100`–`BP104`: nessun tenant, nessuna
  persona né email, segreti senza tenant, documenti rivisti) e che, installato per finta, sia un
  manifest valido; poi lo scrive nel catalogo. In produzione chiede conferma. Con `--check` si ferma
  al controllo, senza rete e senza scrivere: è il modo di provare una bozza. È riservato a Hevolus:
  scrive nella partizione che ogni tenant legge. **Nel catalogo un modello ha una versione sola** (#1595):
  pubblicarne una toglie dal catalogo tutte le altre di quel modello — la domanda di conferma le elenca —,
  e una versione più vecchia di quella già pubblicata si rifiuta, perché resterebbe lei e uscirebbe quella che
  funziona. Le versioni escono solo dopo che la nuova è scritta.
- **`prune`** — riporta a una versione per modello il catalogo pubblicato prima della regola: elenca, per
  ogni modello, la versione che resta (la più alta) e quelle che escono, poi le toglie. Non si annulla,
  quindi la conferma è quella di `delete`: si scrive il nome del modello (o `catalogo`, senza modello), al
  terminale o con `--confirm`; `--yes` non vale. Le copie già installate sui tenant non cambiano: vivono
  nella partizione del tenant.
- **`install`** — copia una versione del modello nell'archivio del tenant con le scelte di chi
  installa: tag (default quello del modello), prefisso dei nomi, topic, persone di ogni ruolo.
  Il **prefisso** si sceglie con `--prefix "Studio · "` (le entità si chiamano «Studio · Agenda») o
  `--no-prefix` (si chiamano come nel modello); senza, resta quello del modello — di norma
  `BP-<TAG>-` — o quello dell'installazione precedente. Diventa `naming.prefix` del manifest
  installato: vedi [manifest-reference.md](manifest-reference.md#naming-come-si-chiamano-le-entità). Le persone si danno con
  `--members` o, al terminale, rispondendo a una domanda per ruolo; un ruolo a cui il modello
  indirizza dei passi non può restare vuoto (`BP105`). Una seconda installazione dello stesso modello
  riparte dalle scelte della prima: è così che si **aggiorna** — la versione nuova arriva con lo
  stesso tag e il piano la applica sul posto (#1126).

  **Persone che nel tenant non ci sono.** Il blueprint le persone le aggiunge ai ruoli, non le crea,
  e un modello del catalogo non ne nomina di vere: può però portare indirizzi **segnaposto** (di
  esempio, `…@esempio.invalid`, o di Hevolus, `…@hevolus.it`) in owner, destinatari e testi. `install`
  **si ferma e chiede con quale utente del tenant sostituire ciascuno**: al terminale con una domanda
  per indirizzo, altrimenti esce con `BP108` e l'elenco, e chi guida la CLI lo chiede a chi installa e
  ripete con `--replace`. Lo stesso per i membri dei ruoli e per i sostituti che non sono utenti del
  tenant: `install` legge gli utenti, e per ognuno che manca elenca quelli che ci sono (exit **3**,
  oppure la domanda al terminale). Mai scegliere un utente al posto di chi installa.

Come `promote`, **`install` non crea niente sul tenant**: dopo servono `plan` e `apply` con la loro
approvazione; le credenziali che il comando elenca si precaricano con `secrets set`, oppure si
inseriscono dalla UI dopo l'apply. Il tag scelto non
può essere già di un altro blueprint del tenant. La copia ricorda da dove viene (`promotedFrom`
con `catalogVersion`), ed è da lì che `catalog list --company` sa dire se c'è di più nuovo.
Come ogni copia, l'installazione è firmata e contata da `copies` (#1516), anche quando la fa la
webapp: lì la firma è l'utente che ha approvato.

`default` non è un tenant: ogni altro comando lo rifiuta con `1`.


**App di demo (#1566).** In produzione `catalog install` chiede quali app di demo del modello portare nel tenant, con
risposta proposta **tutte** (`--demo-apps all|none|<chiave,chiave>`; senza terminale e senza l'opzione si ferma
con **6**). Le app lasciate fuori escono dal manifest installato e i loro sorgenti restano nel catalogo; un
aggiornamento chiede di nuovo. Fuori produzione le porta tutte senza chiedere (non si creano comunque). L'installazione dalla webapp le porta tutte. `catalog publish` controlla i
sorgenti come `push` e rifiuta un'app con `origin.company` o `origin.projectId` (`BP164`).
## `plan --tag <TAG> [--version <n>] [--modules <k1,k2>]`

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

## `apply --tag <TAG> [--version <n>] [--modules <k1,k2>] [--governance yes|no] [--apps all|none|<k1,k2>] [--resume <runId>]`

Stampa il piano, **ne chiede l'approvazione** e solo dopo esegue. In un terminale la domanda si
risponde; dove non c'è un terminale — uno script, un assistente che esegue comandi — non c'è nessuno
a cui chiedere, quindi l'esecuzione si ferma con codice `6` e serve `--yes`. Quel flag è la forma
scritta di un'approvazione data altrove, e finisce nel run insieme a chi l'ha dichiarata e a quando:
`status --run <runId>` la mostra.

> **Con il token utente** (`login`, #1770): il piano lo esegue la piattaforma e la CLI segue il run; vedi
> [«Senza ruoli Azure»](#senza-ruoli-azure-come-lavora-la-cli-1333-1772).

Ogni entità creata finisce **subito** in inventario, non alla fine: se una chiamata fallisce a metà,
ciò che è stato creato è già registrato ed è quindi smontabile.

Al termine stampa i riferimenti non risolti nei processi, i diagrammi archiviati e — una sola volta,
perché l'API non li mostra due volte — url, `hookId` e chiave dei webhook creati.

Con `--resume` riparte da un run esistente: le operazioni già in inventario vengono saltate.

**Governance e app sono facoltative (31/10/2026).** L'apply crea il blueprint senza le policy di `governance` e
senza le app di `apps`. Alla fine, la prima volta che il blueprint arriva sul tenant (anche da una copia), chiede per
ciascuna se installarla; ciò che si sceglie ha il suo piano e la sua approvazione, come un apply. Senza un terminale
le risposte si danno con `--governance yes|no` e `--apps all|none|<chiavi>`; senza né terminale né flag l'apply
finisce lo stesso, e stampa il comando `extras` da lanciare dopo averlo chiesto a una persona. La scelta resta nel
run e passa da un run al successivo:

- un aggiornamento tiene allineata la governance accettata, e non tocca quella rifiutata;
- un'app si installa **una volta sola**: da lì la si aggiorna in App Builder, e nessun aggiornamento del blueprint
  la riscrive. Un aggiornamento propone, alla fine, solo le app che la versione aggiunge;
- ciò che è stato rifiutato non si ripropone: si installa a richiesta con `extras`.

Un run nato prima della scelta conta come «installato» per ciò che ha in inventario: la governance e le app che
aveva creato restano del blueprint, e un aggiornamento le tratta come accettate.

### Una versione nuova su un blueprint già applicato (#1126)

Se sul tenant c'è già un run **completato** dello stesso blueprint, `plan` e `apply` non si fermano
sulle entità che quel run ha creato: le riconoscono come del blueprint e portano sopra la versione
nuova.

- **Si crea** ciò che la versione nuova aggiunge: agenti, skill assegnate, server MCP, step.
- **Una connessione `process:` spostata su un processo nuovo si ricabla**: indirizzo e chiave del webhook nuovo
  vanno nella connessione e la chiave fra i segreti del tenant. Fino al 18/10/2026 il cablaggio si saltava perché la
  connessione esisteva già, e la chiave — mostrata una volta sola — non si salvava (HEVBPMKT v12).
- **Si aggiorna sul posto** ciò che il blueprint possiede ed è cambiato, confrontandolo con il
  **tenant** — non con il manifest precedente, perché fra una versione e l'altra le cose possono
  essere state ritoccate a mano:
  - gli **agenti**: istruzioni, descrizione, temperatura, modello, **tipo e impostazioni di risposta** dichiarati
    (#1612: «tipo smart → base», «verbosità Concise → Verbose»… — un campo non dichiarato resta com'è) e i
    **profili di knowledge** collegati (#1526):
    si collegano quelli dichiarati che mancano e si scollegano quelli del blueprint che la versione non dichiara
    più; un profilo collegato a mano, fuori dal blueprint, resta. Fino al 18/10/2026 i profili non si
    confrontavano: HEVBPMKT v7 creava il profilo nuovo e la guida restava sul vecchio. Identità e strumenti
    restano quelli che hanno;
  - le **skill** di un agente (#1565): una skill che il blueprint ha assegnato e che la versione nuova non dichiara
    più si **toglie** (operazione `RemoveAgentSkill`, «Toglie la skill «x» dall'agente «y»» nel piano) ed esce
    dall'inventario del run. Il confine è l'inventario: una skill aggiunta a mano resta, e un agente che la
    versione nuova non dichiara affatto non si tocca (lo segnala `BP068`). Fino al 21/10/2026 un aggiornamento
    aggiungeva skill ma non ne toglieva: la `spreadsheet` di STUDIOPOLIS v64 si poteva togliere solo dalla UI;
  - gli **orchestratori**: step, flussi, ciò che ogni step passa al successivo, messaggio di
    benvenuto. L'id e l'endpoint di chat — quindi i link già dati — restano gli stessi, e gli step
    che c'erano già tengono la loro posizione nel designer;
  - gli **agent task**: prompt, descrizione e, per ogni uscita email, destinatari e oggetto.
    Schedulazione, webhook e politica di esecuzione restano quelli che hanno; un'uscita email in più
    o in meno ferma il piano (`BP067`). Fino al 24/09/2026 un prompt cambiato veniva **ignorato in
    silenzio** — né nel piano né fermato da `BP067` — e la v32 di Studio Polis ne avrebbe portato sul
    tenant solo metà; fino al 06/10/2026 lo stesso valeva per i destinatari delle email (#1286);
  - gli **owner dei processi**: il piano dice chi entra («+») e chi esce («−»). Del processo cambiano
    solo gli owner.
- **Resta com'è** tutto il resto, e il piano lo dice: «N entità del blueprint restano come sono».
  I profili di knowledge esistenti **non si riattivano** (riaccoderebbe l'indicizzazione di tutti i
  file) e i processi BPM non si aggiornano sul posto, owner a parte.
  I **file nuovi** di un profilo esistente invece si aggiungono (#1518): si caricano nel topic, si collegano al
  profilo uno per uno senza riscrivere gli altri e si indicizzano solo loro (operazione `AddKnowledgeFiles`).
- **Non si cancella niente.** Ciò che la versione nuova non dichiara più è segnalato (`BP068`) e
  resta. Ciò che non si può fare sul posto ferma il piano (`BP067`).
  Dal 12/10/2026 vale anche per la **definizione di un processo**: i processi non si riscrivono sul posto (si
  aggiornano solo gli owner), e se passi, bivi o flussi sono cambiati rispetto alla versione applicata il piano
  si ferma con `BP067` e dice quali. Prima il cambio veniva ignorato in silenzio, mentre i prompt di agenti e
  agent task cambiavano. Si smonta il blueprint (`rollback`) e si riapplica, oppure si modifica il processo dall'interfaccia.
  Dal 03/11/2026 vale anche per il **tipo di un profilo di knowledge** (#1790): se la versione nuova dichiara
  `knowledgeGraph` diverso da come il profilo è sul tenant (knowledge graph o indice di ricerca), il piano si ferma
  con `BP067`. Prima il profilo restava com'era e gli agenti venivano ricollegati a quello di prima senza che il
  piano lo dicesse. Si smonta il blueprint e si riapplica, oppure si dà al profilo un nome nuovo nel manifest:
  l'aggiornamento ne crea uno nuovo del tipo nuovo, e quello di prima resta (`BP068`).

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

### Moduli: installazione parziale e incrementale

Un blueprint che dichiara `modules` ([`manifest-reference.md`](manifest-reference.md#modules-scenari-installabili-separatamente))
si installa per intero, in parte o un modulo alla volta. Il modulo implicito `core` — ciò che nessun
modulo elenca — si installa sempre.

| Comando | Che cosa installa |
|---|---|
| `apply --tag T` alla prima installazione | tutto |
| `apply --tag T --modules civile` | `core` e `civile` |
| `apply --tag T --modules penale` | `core`, `penale` e le sue dipendenze (`civile`), che il piano mostra: «civile (richiesto da penale)» |
| `apply --tag T --modules penale` su un tenant che ha già `civile` | solo le entità di `penale` che mancano: quelle di `core` e `civile` sono del blueprint, non collisioni |
| `apply --tag T` su un tenant che ha già una parte | i moduli già installati, alla versione nuova; gli altri restano fuori e il piano li elenca come «Non installati» |

L'ultima riga è voluta: una versione nuova non installa di nascosto moduli che nessuno ha scelto (e che
consumerebbero licenza). Si aggiungono con `--modules`.

Un'installazione incrementale **non toglie** niente: ai moduli chiesti si aggiungono sempre quelli già
installati. Un modulo si toglie solo con `rollback --module`. Le collisioni con entità estranee restano
errori (`BP060`); le entità dei moduli che il piano non installa non si confrontano col tenant.

Il run registra i moduli installati (`modules`); `status` li mostra. Un run ripreso con `--resume` finisce
i moduli con cui è partito, e `--modules` insieme a `--resume` è rifiutato.

```
Piano · studio v3 · tag STUDIO
  Moduli: core, civile (già installato), penale
  Non installati: tributario — si aggiungono con --modules <chiave>.
  Aggiornamento della v3 applicata (run 8f2c…): si crea ciò che manca e si aggiorna ciò che è cambiato.
```

Una CLI precedente ai moduli ignora la sezione `modules` e installa tutto; se riscrive un run, i moduli
che vi erano registrati si perdono e il run torna a valere «tutti». Con i manifest a moduli serve la CLI
che li conosce.

**Ruoli nel tenant (#1518).** Prima dell'approvazione `plan` e `apply` leggono i tuoi ruoli della webapp nel tenant
di destinazione e confrontano ogni operazione con il ruolo che la webapp chiede per farla a mano (`BP128`): i ruoli
mancanti si vedono come avvisi nel piano, e `apply` non parte finché ne manca uno — meglio fermarsi prima che a metà,
quando l'API rifiuterebbe. L'amministratore del tenant passa ogni controllo.

**App del blueprint (#1566).** Un'app scelta alla fine dell'apply (o con `extras`) diventa in App Builder un
progetto con il prefisso (il nome è `title`), e come snapshot i sorgenti archiviati con la versione sotto
`apps/<chiave>/`. Non apre una sessione né consuma il budget del mese. Il progetto va in inventario (`App`), e
`rollback` e `delete` lo tolgono, snapshot compreso; con una sessione aperta su quel progetto si fermano e chiedono
di chiuderla prima. Con App Builder spento sul tenant l'app non si crea (`BP165`, avviso).

**Solo in produzione.** App Builder apre le sessioni solo in produzione, quindi fuori di lì le app non si propongono
né si creano (`BP169`, una riga per app): sezione `apps` e sorgenti restano nell'archivio e viaggiano con la copia.
Quali app di demo portare si sceglie alla copia verso la produzione (`promote`, `catalog install`); quali installare,
alla fine dell'apply in produzione. Un'app di demo lasciata all'origine da `promote --demo-apps` è nel manifest ma
non nell'archivio: non si crea, e l'apply lo dice.

**Un'app già creata non si riscrive.** Fino al 31/10/2026 un aggiornamento riscriveva lo snapshot di un'app non
toccata in App Builder (`UpdateApp`, con `--replace-apps` per quelle modificate). Non lo fa più: il piano la elenca
fra ciò che resta com'è, e chi vuole cambiarla lo fa in App Builder. I codici `BP166`–`BP168` sono ritirati.

## `extras --tag <TAG> [--governance yes|no] [--apps all|none|<k1,k2>] [--yes]`

Le parti facoltative di un blueprint **già applicato**: le policy di governance e le app. È la stessa domanda con cui
finisce `apply`, fatta dopo — per rispondere quando l'apply è girato senza un terminale, o per installare ciò che era
stato rifiutato.

- Senza flag chiede ciò che non è mai stato deciso; se non c'è niente, lo dice e ricorda i flag.
- Con i flag sceglie fra tutto ciò che si può ancora installare, rifiutato compreso: `--apps all` installa ogni app
  non ancora creata, `--apps none` le rifiuta, un elenco installa quelle e rifiuta le altre.
- Ciò che si installa passa dal piano delle sole parti facoltative e dalla sua approvazione (`--yes` dove non c'è un
  terminale), in un run nuovo che prende in carico le entità del precedente. Un rifiuto non tocca il tenant: si
  registra nel run in vigore.

Lavora sulla versione che il run in vigore ha applicato, non sull'ultima pubblicata. Anche questo passa dall'API con il
token (#1772): ciò che resta da decidere lo dice `GET cli/{companyId}/blueprints/{tag}/extras`, un rifiuto si registra con
`…/extras/decline`, e ciò che si installa è un piano con le parti facoltative nel corpo di `plan` e di `apply`, che la
piattaforma esegue come ogni altro apply.

## `status [--run <runId>] [--watch]`

Senza `--run`, elenca i blueprint pubblicati sul tenant, quelli **installati** — per ognuno l'ultimo run
completato, con versione e moduli (`tutti` per un blueprint senza moduli o un run precedente ai moduli) — e
le ultime esecuzioni. Con `--run`, mostra stato, moduli, fasi e inventario di quel run. `--watch` attende la
conclusione.

```
Installati (2)
  STUDIO         studio                           v3   moduli: core, civile, penale  (run 8f2c41a07b1e)
  LEGAL          legal                            v1   moduli: tutti  (run 9b03989a730b)
```

## `environments [--env <nome>]`

Su quali ambienti hai già una sessione, e chi sei lì. Per ogni ambiente del binario (`staging`, `prod`) la
CLI chiede all'API chi è la persona del token: quanti tenant, e se è un operatore di piattaforma. Un ambiente
senza sessione dice di fare `login --env <nome>`. Nessun segreto, niente scritture, nessun ruolo Azure (#1772).

```
$ xrcopilotlab-bp environments

Ambienti
  La prova chiede all'API chi sei: nessun segreto, niente scritture.

✓ staging   Staging     3 tenant · operatore di piattaforma
    senza --company si lavora sul tenant di prova di questo ambiente
! prod      PRODUZIONE  senza sessione: xrcopilotlab-bp login --env prod
```

Se nessun ambiente è utilizzabile esce **8**, così uno script — o la skill — se ne accorge senza leggere il testo.
Quali *tenant* vedrai dentro un ambiente lo dice `whoami`: sono quelli a cui appartieni nel prodotto.

## `rollback --run <runId> [--module <k>]`

Smonta ciò che il run ha creato, leggendo l'inventario **a ritroso**. Rimuove solo le voci con
azione `Created`: un'entità adottata perché già presente non è nostra e resta dov'è.

> **Con il token utente** (`login`, #1770): smonta la piattaforma e la CLI segue il run; vedi [«Senza ruoli Azure»](#senza-ruoli-azure-come-lavora-la-cli-1333-1772).

Con `--module <k>` smonta solo le entità di quel modulo, ricavate dal manifest della versione applicata;
il run resta completato con gli altri moduli. È rifiutato (`BP138`) se un altro modulo installato dipende
da `k` — si smonta prima quello —, e (`BP137`) per `core`, per un modulo che non esiste o che il run non ha
installato. Se una rimozione fallisce, il modulo resta fra gli installati e il comando si ripete.

Un fallimento su una singola entità non ferma il resto: è meglio un rollback completato saltando
ciò che non si riesce a togliere, che uno lasciato a metà. Le entità non rimosse vengono elencate.

La pubblicazione di una versione non ha operazione inversa: sparisce insieme al processo.

**Il rollback è la disinstallazione, non la cancellazione.** Il manifest con le sue versioni, i file
di knowledge archiviati con la versione, suite, report e documenti restano nell'archivio: il
blueprint si riapplica quando si vuole, con `apply`, e il piano riparte da zero — non è un
aggiornamento, perché il run smontato non è più `Completed`. I file caricati nel topic non si
cancellano uno per uno (sono documenti del cliente), ma se il topic era del blueprint se ne vanno
con lui e l'inventario lo registra. Se un run smontato da una CLI precedente è rimasto
«completato» con i soli file di un topic che non c'è più, ripetere `rollback --run` lo chiude: il
comando verifica il topic sul tenant e toglie le voci rimaste.

Lo stesso vale per ogni voce rimasta **senza il padre** (#1766): la versione pubblicata di un processo che non
c'è più, la schedulazione di un task tolto. Non hanno un'operazione inversa propria, e tenevano il run
«completato» con il blueprint fra gli installati (PERONIPROC, 02/11/2026). `rollback --run` verifica sul
tenant che il padre sia sparito e le toglie dall'inventario; `audit` le segnala come «run da chiudere».

## `undeclared --tag <TAG> [--version <n>] [--remove] [--confirm <TAG>]`

Elenca le entità che il blueprint ha creato e che l'**ultima versione dell'archivio** (o quella di `--version`, non più
vecchia di quella applicata) **non dichiara più** (#1702): sono quelle
dell'avviso `BP068`, che un aggiornamento lascia sul tenant. Con `--remove` le toglie dal tenant e dall'inventario
del run, con lo stesso codice del rollback.

- **Contro l'ultima versione, non contro quella del run**: una versione che toglie soltanto non ha niente da applicare,
  l'`apply` non registra un run nuovo e il run resta alla versione di prima. Si fa `push`, poi `undeclared`.
- **Solo ciò che il blueprint ha creato**: il confine è l'inventario del run completato del tag, come per
  `rollback`. Un'entità fatta a mano, anche con il prefisso del blueprint, non compare.
- **Anche i topic in più** (`topics`): un topic che la versione non dichiara esce con i file caricati dentro di lui.
- **Né per chiave né per nome**: un'entità esce solo se la versione non la dichiara in nessuno dei due modi. Una
  chiave rinominata con lo stesso nome, o un nome cambiato sulla stessa chiave, è la stessa entità e resta.
- **Con ciò che la accompagna**: skill, server MCP, file ed endpoint di un agente; pianificazione e uscite di un
  agent task; versione, ruoli di avvio e webhook di un processo; pubblicazione di un server MCP.
- **La conferma è quella di `delete`**: si scrive il tag, al terminale o con `--confirm <TAG>`; `--yes` non vale e
  senza terminale il comando esce **6**. Sotto lease il run si rilegge: se l'elenco è cambiato nel frattempo non si
  toglie niente (**3**).
- Le istanze già chiuse di un processo tolto e i file caricati nel topic restano. Se una rimozione fallisce il
  comando esce **4**: l'inventario elenca ciò che resta, e si ripete.

Il caso tipico è un processo da ridisegnare: un aggiornamento non riscrive un processo (`BP067`), quindi la versione
nuova ne dichiara uno con un'altra chiave e un altro nome; dopo l'`apply`, `undeclared --remove` toglie il vecchio.

## `prune [--tag <TAG>] [--keep <n>] [--confirm <TAG|archivio>]`

Applica una volta la regola delle ultime due versioni (#1596) ai blueprint già nell'archivio di un tenant
**fuori dalla produzione**: per ogni blueprint elenca le versioni che restano, quelle che restano perché
ancora installate, e quelle che escono con i loro run; poi chiede la conferma. Da `push` in poi la regola
vale da sola: `prune` serve per ciò che c'era prima, e per un `--keep` diverso da due.

Il cancello è quello di `delete`: si scrive il **tag** quando si pulisce un blueprint solo, la parola
`archivio` quando si puliscono tutti, al terminale o con `--confirm`; `--yes` non vale. Senza terminale il
comando stampa l'elenco ed esce **6**. In produzione si rifiuta (**3**): lì le versioni restano tutte.

Ciò che esce non si rilegge più (`pull --version`) e non si riapplica. Suite, report, documenti e il
registro delle copie restano: raccontano il tag, non una versione.

## `delete --tag <TAG> --confirm <TAG> [--version <n>] [--with-entities]`

Toglie un blueprint dall'**archivio**: le versioni del manifest in Cosmos, i file nello storage —
il `.bpmn` esportato compreso — e i run che lo riguardano. Con `--version` si cancella una versione
sola, con i suoi run; senza, l'intero blueprint. `--blueprint <id>` serve quando due blueprint
condividono il tag.

> **Con il token utente** (`login`, #1770): cancella l'API, solo l'archivio; `--with-entities` non c'è, prima `rollback --run`. Vedi [«Senza ruoli Azure»](#senza-ruoli-azure-come-lavora-la-cli-1333-1772).

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
2. **secrets** — verifica le chiavi citate; se ne manca una avvisa che la connessione nascerà senza
   credenziali (da inserire dalla UI) e stampa i comandi per precaricarle, ma non si ferma;
3. **push** — registra la versione;
4. **plan** — stampa il piano e chiede conferma, salvo `--yes`;
5. **apply** — esegue;
6. **external** — ciò che resta fuori dalla piattaforma, se c'è.

L'ordine non è arbitrario: la fase esterna viene **dopo** l'applicazione perché l'ingresso della
posta deve puntare a un webhook che prima non esisteva.

```bash
xrcopilotlab-bp pipeline docs/blueprints/esempi/test-agenda.yml --company <guid>
xrcopilotlab-bp pipeline docs/blueprints/esempi/test-agenda.yml --yes --skip-external
xrcopilotlab-bp pipeline docs/blueprints/esempi/test-agenda.yml --resume a1b2c3d4e5f6
```

## `test init` · `test validate` · `test run` · `test push` · `test reports` · `test report` · `test judge` · `test prune`

Il collaudo di un blueprint **applicato**: una suite di domande per gli agenti, input per gli
orchestratori e dati di avvio per i processi, con le attese; l'esecuzione sul tenant; un report
con risposte, log e — per ogni fallimento — il componente da cui cominciare a guardare.

```bash
xrcopilotlab-bp test init     docs/blueprints/esempi/test-agenda.yml                       # → docs/blueprints/esempi/test-agenda.tests.yml
xrcopilotlab-bp test validate docs/blueprints/esempi/test-agenda.tests.yml           # trova il manifest da solo
xrcopilotlab-bp test run      docs/blueprints/esempi/test-agenda.tests.yml --env staging --company <guid>
xrcopilotlab-bp test run      docs/blueprints/esempi/test-agenda.tests.yml --env staging --only agent,process
xrcopilotlab-bp test push     docs/blueprints/esempi/test-agenda.tests.yml --env staging --company <guid>
xrcopilotlab-bp test reports  --tag TEST --env staging --company <guid>
xrcopilotlab-bp test reports  --tag TEST --compare 0123456789ab --env staging --company <guid>
```

`init` non sovrascrive una suite esistente (`--overwrite`, o `--out`); `validate` accetta
`--manifest`; `run` accetta `--tag`, `--run <runId>`, `--only <chiavi,tag,entità,moduli>`, `--out
<cartella>`. Le entità si risolvono dall'inventario dell'ultimo run completato del tag. Il report
va nella cartella locale, `<temporanea>/xrcopilotlab-bp/workspace/<TAG>/reports/<aaaammgg-hhmmss>/` — mai
nel repository: contiene risposte e id del tenant — e nell'archivio del tenant, dove lo trovano
anche la chat dei blueprint e `test reports`. `push` porta una suite nell'archivio, accanto al
manifest del suo tag; `reports` elenca i report archiviati e, con `--compare <id>`, confronta quel
report caso per caso con il precedente della stessa suite (e avvisa se i due giri sono andati ad API
diverse: il report registra l'host dell'API, perché un'API locale con i dati di staging ha la stessa
etichetta «Staging» di quella vera).

Se il tenant non ha ancora la suite, `run` la archivia da sé prima di salvare il report: è il caso
del tenant di un cliente, dove il blueprint arriva con il manifest dopo essere stato collaudato su
staging. Suite, report e giudizio nascono lì al primo collaudo; non si copiano prima.

Nell'archivio il report sta sotto `reports/<aaaammgg-hhmmss>/` — `report.json`, `report.md` e,
dopo `test judge`, `giudizio.md` — con il documento d'indice che punta lì: lo stesso posto per un
collaudo dal terminale e per uno dalla chat. `--no-archive` lo salta.
Un report che sembra contenere credenziali non parte (il comando lo dice e il file resta su disco), e se
l'archiviazione non riesce il collaudo resta valido.

La suite può venire dall'archivio invece che da un file:

```bash
xrcopilotlab-bp test push agenda.tests.yml --tag AGENDA                    # una volta
xrcopilotlab-bp test run --from-archive --tag AGENDA --env staging          # l'unica suite del tag, nell'ultima versione
xrcopilotlab-bp test run --from-archive --tag AGENDA --suite flusso         # se il tag ne ha più d'una
xrcopilotlab-bp test report --tag AGENDA                                    # scarica l'ultimo report archiviato
```

`--from-archive` scarica la suite nella cartella di lavoro (vedi `files`) e da lì è una suite come le
altre: i file che i casi citano con un percorso relativo si cercano accanto a lei. Si prende l'ultima
versione della suite; `--version` sceglie la versione del manifest da collaudare. `test report` accetta
`--stamp <aaaammgg-hhmmss>` per un collaudo preciso, `--out <cartella>` e `--overwrite`.

Il giudizio di chi legge il report si archivia accanto al report con `judge`:

```bash
xrcopilotlab-bp test judge --tag STUDIOPOLIS --report 0123456789ab --file giudizio.json --summary giudizio.md --env staging --company <guid>
```

`giudizio.json` porta i verdetti caso per caso, con i valori per nome:

```json
{ "items": [ { "caseKey": "riconciliatore-quattro-sezioni", "verdict": "Partial",
               "reason": "Sezione 2 vuota: il doppione senza avviso sta solo fra i doppioni",
               "suspect": { "component": "Manifest", "confidence": "High", "status": "Confirmed" },
               "decision": "Rerun" } ] }
```

I verdetti finiscono nel documento del report — dove li usano `test reports --compare` (il verdetto
vince sull'esito meccanico) e la chat dei blueprint — e il riepilogo anche come
`reports/<timbro>/giudizio.md`. Un caso che il report non ha ferma il comando, come un testo che
sembra contenere una credenziale; un giudizio già registrato — magari dalla chat — si sostituisce
solo con `--overwrite`.

Esce `0` se tutti i casi passano, **`7`** se almeno uno non passa, `2` se la suite non è valida,
`3` se il tag non ha un run sul tenant. Formato della suite, esiti, sospetti e codici `BT0xx`:
[`testing.md`](../../xrcopilotlab-blueprint-test/references/testing.md).

### `test prune` — togliere i report vecchi di un tag

```bash
xrcopilotlab-bp test prune --tag STUDIOPOLIS --env staging --company <guid>                 # restano gli ultimi 5 di ogni suite
xrcopilotlab-bp test prune --tag STUDIOPOLIS --keep 10 --before 2026-10-01 --env staging    # escono solo i più vecchi del 1° ottobre
xrcopilotlab-bp test prune --tag STUDIOPOLIS --confirm STUDIOPOLIS --env staging            # senza terminale: il tag scritto
```

Un tenant di staging aveva 600 report il 02/11/2026, e `files rm` li toglieva uno per uno (#1766). Restano
sempre gli ultimi `--keep` di **ogni suite** (default 5), i report **giudicati** (il giudizio è il lavoro di
una persona, e `--compare` parte da lì) e quelli ancora in corso; con `--before` escono solo i più vecchi di
quella data. Con un report se ne va la sua cartella (`reports/<timbro>/`: evidenze, markdown, giudizio). La
decisione è `TestReportRetention`, pura; il cancello è quello di `delete`: si scrive il tag, mai `--yes`.

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
qualificato dal prefisso del blueprint (`BP-<TAG>-…`, o il suo `naming.prefix`), e si risolve dall'inventario dell'ultimo run completato del tag (`--run`
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

Una connessione porta i segreti **risolti** al momento dell'apply: il manifest li cita per nome, il
runtime li legge dall'API e ne scrive il valore nella connessione. Correggere un segreto con
`secrets set` corregge il segreto, **non** la connessione, che continua a presentarsi al sistema
esterno con il valore vecchio — e l'agente dice «errore di autorizzazione» anche dopo la correzione.

```bash
xrcopilotlab-bp connections list            --tag STUDIOPOLIS --env staging --company <guid>
xrcopilotlab-bp connections refresh         --tag STUDIOPOLIS --env staging --company <guid>   # tutte
xrcopilotlab-bp connections refresh graph   --tag STUDIOPOLIS --env staging --company <guid>   # una sola
```

`refresh` ricostruisce configurazione e busta di autenticazione dal manifest pubblicato e dai
segreti **come sono ora**, con la stessa costruzione dell'apply, e aggiorna la connessione sul
tenant senza cambiarne l'id: server MCP e agenti che la usano non se ne accorgono. L'effetto è
immediato, perché le API leggono la connessione a ogni chiamata. Verifica: `mcp test`. Se i segreti
di una connessione non sono impostati, `refresh` ne riallinea solo la configurazione e lascia le
credenziali che ha: quelle inserite dalla UI non si cancellano.

Una connessione con `process:` (verso il webhook di un processo del blueprint) si ricostruisce da
altre due fonti: l'indirizzo dal webhook com'è sul tenant, la chiave dal segreto
`Blueprints:Secrets:<TAG>:webhook-<chiave>` che l'apply ha lasciato fra i segreti del tenant. Se il
webhook è stato rigenerato dall'interfaccia, prima `secrets set <TAG> webhook-<chiave>` con la nuova
chiave, poi `refresh`.

Emerso il **2026-09-14**: i due segreti Graph di Studio Polis erano scambiati fin dall'11/09
(`graph-client-id` conteneva il secret, `graph-client-secret` l'id). Correggerli non è bastato — la
connessione aveva i valori dell'apply — e `mcp test` continuava a mostrare `AADSTS700016`. Un segreto
sovrascritto non ha versioni precedenti (#1798): il valore giusto si riprende da chi lo possiede.

## `knowledge list [<profilo>]` · `knowledge reingest <profilo>` · `knowledge rm <profilo>`

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

**`knowledge add <profilo> <file…> --tag <TAG> [--replace] [--yes]`** (#1518) aggiunge file dal disco a un profilo
già indicizzato, senza una nuova versione del manifest: li carica nel topic, li collega al profilo uno per uno senza
riscrivere gli altri e fa indicizzare solo loro (a grafo lo mette in coda il server, vettoriale chiede la
reindicizzazione del file). Un file che il profilo ha già si rifiuta, a meno di **`--replace`** (#1525): il contenuto
nuovo va nel topic al posto del vecchio, con lo stesso nome, e il file si reindicizza, che toglie dal grafo il
contenuto vecchio. È l'unico modo di aggiornare un documento: il piano confronta i file per nome e non vede un
contenuto cambiato, e `knowledge reingest --only` rilegge il contenuto che c'è. Chiede un sì come l'apply. Per tenere il manifest allineato, aggiungere gli stessi file a `knowledge[].files` alla versione dopo:
il piano li riconoscerà come già presenti.


**`knowledge rm <profilo> --tag <TAG> [--confirm <TAG>]`** (#1567) toglie dal tenant **un solo** profilo che il
blueprint ha creato, e lo toglie dall'inventario del run. Serve per un profilo che una versione nuova non dichiara
più: l'aggiornamento lo scollega dagli agenti ma lo lascia sul tenant (`BP068`), e `rollback` smonterebbe il run
intero. Sparisce il profilo con il suo indice; i file restano nel topic.

```bash
xrcopilotlab-bp knowledge rm storico-civile --tag STUDIOPOLIS --env staging --company <guid>
```

- Rifiuta (exit **3**) un profilo **adottato** — c'era già sul tenant, non è del blueprint — e un profilo ancora
  collegato a un agente del topic: prima si scollega, con un aggiornamento che non lo dichiara più o dalla UI.
- La conferma è quella di `delete`: si scrive il **tag** del blueprint al terminale, o si passa `--confirm <TAG>`.
  `--yes` non vale. Senza terminale e senza `--confirm` si ferma con **6**.
- Un profilo già tolto a mano dal tenant si toglie solo dall'inventario, senza errore.

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

## `mcp check` · `mcp publish <server>` · `mcp test <server> [--tool] [--args]` · `mcp authorize <server>`

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

### `mcp authorize <server>` — l'accesso a Google di un server nativo, o le credenziali di una PEC

Su un server nativo **PEC** (`service: pec`, #1751) il comando non apre nessun browser: se la riga di credenziali è
nata senza la password (segreto non impostato all'apply), la legge ora dal segreto del manifest e riscrive gli header
`X-Pec-User` / `X-Pec-Password`; se c'è già, lo dice ed esce **0**. Senza il segreto esce **3** con i passi per
l'amministratore (UI: Interoperabilità › MCP Servers › Autenticazione «Mailbox (IMAP/SMTP)»). Il resto di questa sezione riguarda Google.


Un server `kind: native` (vedi il manifest) è la copia, per il tenant, di un server nativo Google, con
l'app OAuth del cliente. L'apply lo crea ma **non lo autorizza**: il consenso lo dà una persona con il
suo account Google.

```bash
xrcopilotlab-bp mcp authorize calendario --tag STUDIOPOLIS --env staging          # stampa il link e attende
xrcopilotlab-bp mcp authorize calendario --no-wait --tag STUDIOPOLIS              # stampa il link e basta
```

Il comando: completa la riga OAuth con client id e secret del cliente se l'apply l'aveva lasciata
vuota (segreti non ancora impostati); chiede alla piattaforma il link di consenso Google per quel
servizio; lo stampa, e **attende fino a 5 minuti** che l'autorizzazione risulti registrata. La CLI non
vede mai password né token. Se il server è già autorizzato lo dice ed esce **0**.

Esce **0** a consenso registrato; **4** se Google lo rifiuta o l'API non risponde; **5** se il consenso
non arriva entro 5 minuti (il link resta valido: si completa e si ripete il comando); **3** se i segreti
dell'app Google non sono impostati (`secrets set`). Non lancia il browser: si apre il link a mano, con
l'account Google da collegare.

Prima del link il comando stampa l'**URI di reindirizzamento** dell'ambiente
(`<OAuthCallbackBaseUrl>/auth/google/callback`, letto dall'App Configuration), che l'app Google del
cliente deve avere fra gli «URI di reindirizzamento autorizzati»; con i segreti mancanti (exit **3**)
stampa anche i passi nella Google Cloud Console. Gli stessi passi li riporta il piano, con l'avviso
`BP112`, per ogni server nativo che crea. Due errori ricorrenti (14/10/2026): `redirect_uri_mismatch`
sulla pagina di Google è l'URI mancante nell'app; «McpOauthId could not be extracted from state» è
l'URI di reindirizzamento aperto a mano, o il link cliccato nel terminale e spezzato al carattere `|`
dello `state`. Il link si copia intero e si incolla nel browser.

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

Elenca le voci del catalogo con il prefisso del blueprint (`BP-<TAG>-`, o il `naming.prefix`
dell'ultima versione), dice per ciascuna se il server esiste e
quali agenti la caricano — in **tutti** i topic del tenant, non solo in quello del blueprint. Non
serve un run: le orfane sono proprio quelle che nessun run elenca più. `--remove --yes` cancella
solo le orfane che **nessun agente** carica; se i collegamenti di un agente non si leggono, non
cancella niente (**3**). Senza `--yes` si ferma con **6**. Un blueprint **senza prefisso**
(`naming.prefix: ""`) non si può cercare per nome — ogni voce del tenant sembrerebbe sua — e il
comando si rifiuta (**1**): le sue voci si controllano dall'interfaccia.

Emerso il **2026-09-24**: fino a quel giorno `rollback` lasciava la pubblicazione nel catalogo,
convinto che se ne andasse col server. L'API cancella solo la definizione, e dopo una trentina di
versioni di Studio Polis il catalogo era pieno di voci morte. Ora `rollback` la toglie prima del
server; `orphans` serve per quelle lasciate dai rollback precedenti.

## `voice list` · `voice say "<testo>" --out <file.mp3>` · `voice say --lines <righe.json> --out-dir <cartella>`

La **voce neurale** della piattaforma, per chi scrive una narrazione (lo storyboard di un video, la
voce di una demo) e non ha — né deve avere — un ruolo sulla risorsa Azure Speech o la sua chiave. Il
comando chiama l'endpoint `common/speech`, lo stesso che usano gli avatar, con l'accesso che ha già
ogni altro comando: nessuna chiave passa dalla macchina di chi lo lancia.

```bash
xrcopilotlab-bp voice list --env staging
xrcopilotlab-bp voice say "Un'udienza persa non si recupera." --out scena-1.mp3 --env staging
xrcopilotlab-bp voice say --lines righe.json --out-dir audio --env staging
```

| Opzione | Significato |
|---|---|
| `--out <file.mp3>` | Dove scrivere l'audio di una battuta |
| `--lines <righe.json>` + `--out-dir <cartella>` | Un elenco `[{"name":"scena-1","text":"…"}]`: un MP3 per riga, nominato come `name`. Una sessione per tutte le battute di un video |
| `--voice <nome>` | La voce (es. `it-IT-DiegoNeural`). Senza, quella che la piattaforma ha scelto per la lingua (`Speech:AzureSpeech:VoiceByLang:<lingua>`); `voice list` elenca le disponibili |
| `--language <codice>` | `it` (default) o un'altra lingua supportata |
| `--env <nome>` | L'ambiente, come per ogni comando. Senza, vale lo sviluppo |

Cose da sapere:

- **Formato**: MP3 mono 16 kHz, 32 kbit/s. Adatto a una voce guida e a un video; per una traccia da
  consegnare a una produzione si riascolta e, se serve, si registra una voce umana.
- **Il testo non viene stampato né registrato**: è la narrazione di un cliente. Il comando scrive solo
  i nomi dei file e le dimensioni.
- **Caratteri speciali**: l'endpoint compone l'SSML con il testo così com'è, quindi il comando
  sostituisce `&`, `<` e `>` prima di inviarlo.
- **Nessun audio restituito** (uscita **4**) vuol dire voce o lingua non valide, oppure che la chiave
  Speech del server non è configurata su quell'ambiente.
- Non serve `--company`: la sintesi non è dei tenant.

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

Scarica come fa l'avviatore del plugin — il catalogo è pubblico, quindi senza account e senza `gh`;
`gh` resta come riserva, e se la release non è ancora rispecchiata prova il repository di prodotto.
Se GitHub non risponde il comando non inventa niente: dice che non ha potuto sapere qual è l'ultima
versione e si ferma.

**La sostituzione è l'unico momento in cui si può controllare cosa si sta per eseguire**, quindi
l'impronta si verifica prima di rendere eseguibile il file. Il binario precedente viene spostato
accanto e rimosso solo a sostituzione riuscita: se qualcosa va storto a metà, viene rimesso al suo
posto — restare senza comando sarebbe il modo peggiore di fallire un aggiornamento. Su Windows un
eseguibile in esecuzione non si può sovrascrivere, ma si può rinominare, ed è per questo che
funziona anche lì.

## `report-problem --kind <access|defect|feature> --env <nome> --message <testo>`

Segnala al team ciò che la skill non sa risolvere: un **ruolo Azure che manca** (`access`) o un
**difetto della webapp o della libreria** (`defect`), o una **funzionalità che il blueprint chiede e il manifest o la piattaforma non hanno** (`feature`). La segnalazione è **una mail all'AI Team**, ai
destinatari di `SupportReport:NotifyEmails`: chi risponde risponde a chi ha segnalato. Non apre processi né
attività sul tenant.

```bash
xrcopilotlab-bp report-problem --kind access --env staging --tag MARKETING --manifest-version 16 \
    --command "plan --tag MARKETING" --message "Non hai accesso a appcs-xrcopilotlab-staging-01."
```

| Opzione | Significato |
|---|---|
| `--kind` | `access` (manca un ruolo o un accesso) · `defect` (qualcosa non funziona; default) · `feature` (il blueprint richiede ciò che il manifest non sa esprimere) |
| `--env` | L'ambiente su cui è successo. Obbligatorio |
| `--message` | Che cosa è successo, con il messaggio d'errore. Ripulito da ciò che somiglia a un segreto, massimo 3000 caratteri |
| `--command` | Il comando che era in corso, senza argomenti sensibili |
| `--tag` · `--manifest-version` · `--manifest` | Il blueprint a cui si riferisce: tag, versione pubblicata, nome del file (non il percorso) |

**Funziona anche senza alcun ruolo Azure**, ed è per questo che non passa da App Configuration: conosce l'indirizzo della rotta `support/report` della Function App dell'ambiente e prova chi
sei con il token della sessione di `login`, senza chiavi (#1772).
Chi segnala lo ricava il server dal token: il client non lo scrive. La mail porta chi, ambiente,
manifest (tag, versione, file), comando, versione della CLI e il messaggio.

**Se la segnalazione non parte** — nessun accesso Azure, rotta non disponibile su quell'ambiente, nessun
destinatario configurato (503), mail non spedita (502), limite orario — il comando esce con `4` e **stampa il
testo** (oggetto e corpo) con gli indirizzi dell'AI Team a cui mandarlo a mano. La segnalazione non si perde.

**Dalla chat** la stessa segnalazione parte dal pannello «Segnalazione al team di XRCopilotLab», dopo il
clic su «Invia al team» (verbo `report-problem`). **Non passa dalla rotta**: la Web, che ha già verificato che
la persona sia un amministratore del tenant con la licenza dei blueprint, manda la mail da sé con l'ACS
della piattaforma (`SupportMailer`: stringa `AgentTaskOutput:EmailConnectionString`, la stessa dell'Api; mittente
fisso `donotreply@xrcopilot.ai`; destinatari `SupportReport:NotifyEmails`, la stessa chiave dell'Api). Così
può segnalare anche chi non ha un account `@hevolus.it`, e non c'è nessun'altra identità da ammettere. Il team
riceve la mail, con la persona e il tenant nel testo.

**Se un apply fallisce per un limite di XRCopilotLab** la segnalazione parte da sola, senza chiederla: succede
quando una fase si ferma durante l'esecuzione (codice di uscita 4, `PlatformGapReport.ShouldReport`). Non scatta
per un piano bloccato da collisioni o licenza, un manifest non valido, un accesso mancante o una cancellazione:
lì non c'è niente da sistemare in XRCopilotLab. Porta tag e versione del manifest, ambiente, quante entità
erano già create, il run e l'errore ripulito da ciò che somiglia a un segreto; mai il manifest, i prompt o i dati
del tenant. Dal terminale usa la rotta con l'account `@hevolus.it` e si spegne con
`XRCOPILOTLAB_BP_NO_REPORT=1`; dalla chat è la mail della Web, sempre attiva (nessuna chiave di
configurazione). Il messaggio d'errore dice che è stata segnalata.

Limiti: solo account `@hevolus.it` del tenant per il terminale, sei segnalazioni all'ora per persona,
destinatari fissi nella configurazione dell'Api (`SupportReport:NotifyEmails`: il chiamante non sceglie a chi
arriva). Il tenant Entra ha il default di `hevolus.it`.

Fino al 18/10/2026 il piano aggiungeva a ogni manifest il ruolo e il processo «Assistenza XRCopilotLab», dove la
segnalazione diventava un'attività: sono stati tolti, e il codice `BP106` è ritirato.

## `login [--env <nome>] [--b2c]` — l'accesso con il proprio account (#1333)

Ci si identifica con l'account aziendale `hevolus.it` (Entra) e l'API riceve il **token della persona**: è
l'unica strada della CLI (fase 5, #1772). Nessun ruolo Azure, nessuna chiave, nessuna variabile da impostare:
l'app Entra della CLI (client pubblico, senza segreto) è nel binario. **Per ora solo per lo staff Hevolus**; B2C e
i clienti arriveranno dopo.

```bash
xrcopilotlab-bp login  --env staging [--b2c]     # si apre il browser; poi mostra chi sei e i tuoi tenant
xrcopilotlab-bp whoami --env staging [--b2c]     # lo stesso, dalla sessione già in cache
xrcopilotlab-bp logout --env staging [--b2c]     # toglie il token dalla cache
```

| Opzione | Significato |
|---|---|
| `--env` | L'ambiente (default `staging`) |
| `--b2c` | Accesso con l'identità di XRCopilotLab (B2C, anche Google) invece dell'account aziendale `hevolus.it`. **Non ancora attivo**: per ora l'accesso è solo dello staff Hevolus, e l'API accetta solo Entra |

- **Il browser è obbligatorio**: B2C non ha il device code. Si apre quello di sistema; se non si apre,
  l'indirizzo è stampato e lo si apre a mano. Lanciato da un assistente, il browser si apre sulla macchina della
  persona: è lei a completare l'accesso.
- **La sessione** sta nel portachiavi del sistema (Keychain, DPAPI, libsecret); dove non c'è, in un file con i
  permessi ristretti, e il comando lo dice. Si rinnova da sola finché la persona non fa `logout`.
- **Configurazione e codici di uscita**: vedi `whoami`, qui sotto.

---

### Senza ruoli Azure: come lavora la CLI (#1333, #1772)

Ogni comando passa dalle rotte `cli/{companyId}/...` dell'API, che legge e scrive con la sua identità e
**autorizza per tenant** — chi non è utente del tenant riceve 403, che non dice se il tenant esista. Lo stesso
codice del runtime che gira per la chat gira per la CLI: il piano che si vede è lo stesso. Le operazioni sull'archivio
intero e sul catalogo passano da `cli/platform/*`, riservate all'operatore di piattaforma. Qui sotto, comando per
comando, che cosa fa l'API.

- **Tenant**: `--company` se è fra i tuoi; altrimenti il predefinito dell'ambiente (non in produzione); altrimenti
  l'unico che hai. Se ne hai più d'uno e non ne indichi uno, il comando li elenca e si ferma.
- **`apply` funziona con l'identità** (#1770, fase 3): il piano arriva dall'API con la sua impronta, lo approvi a video
  come sempre, l'API lo accoda e **la piattaforma lo esegue** con la propria identità (lo stesso worker delle
  installazioni dal catalogo); la CLI segue il run e stampa ogni entità creata, e chiudere il terminale non lo ferma.
  Chi approva lo registra l'API dal token; serve essere **amministratore** del tenant (403 altrimenti), e un 409 dice che
  il piano è cambiato, che il tenant ha già un run in corso o che il piano non si applica. `--resume` e `--modules`
  valgono come sempre (`--replace-apps` è ritirato: un'app si installa una volta sola, poi vive in App Builder).
- **`rollback` funziona con l'identità** (#1770): l'elenco delle entità si vede e si conferma come sempre, l'API lo accoda
  e la piattaforma smonta; la CLI segue il run (ogni entità che sparisce dall'inventario, e la fase `rollback` del run,
  che dice in coda · in corso · completato · fallito). Vale anche `--module`. Amministratori; 409 se l'elenco è
  cambiato, se il run è stato superato o se un rollback dello stesso run è già in corso.
- **`delete` funziona con l'identità** (#1770), per il solo archivio: il piano arriva dall'API, si conferma scrivendo il
  tag, e l'API cancella versioni, run, file e collaudi con la propria identità. **`--with-entities` non c'è su questa
  strada**: prima `rollback --run <runId>` per ogni run con entità vive, poi `delete`.
- **`push` funziona con l'identità** (#1770): il manifest si valida in locale come sempre, poi manifest e file dichiarati
  (knowledge dei profili e degli agenti, sorgenti delle app) viaggiano in una richiesta e **scrive l'API**, che rivalida il
  manifest, applica le regole degli owner (#1518) e archivia solo i file ai percorsi che il manifest implica. Tetto di
  25 MB per richiesta: file più pesanti si caricano dal topic dopo l'apply. Vale `--overwrite`; la ritenzione di staging
  (#1596) si applica da sola. Il tenant è `--company`, altrimenti `tenant.companyId` del manifest.
- **`pipeline` funziona con l'identità** (#1770): validazione in locale, segreti verificati dall'API, push all'API,
  piano e apply come sopra (eseguito dalla piattaforma, la CLI segue il run). Il passo «risorse esterne» resta un
  avviso: con un ingresso `logicapp` la fase `external` del run non si scrive da questa strada.
- **`undeclared` funziona con l'identità** (#1770): l'elenco si calcola dal run e dal manifest letti dall'API; con
  `--remove` si conferma scrivendo il tag (anche l'API lo ricontrolla), l'API accoda e la piattaforma toglie; la CLI
  segue il run come per il rollback.
- **In produzione scrive solo chi è nell'elenco** (#1770): oltre a essere amministratore del tenant, l'email deve stare in
  `CliAccess:WriteAllowList` dell'API di quell'ambiente (`CliAccess:WriteAllowListEnforced: true`); un 403 lo dice con
  parole sue. Il controllo è del server, e un elenco spento (staging) non cambia niente.
- **`catalog install` funziona con l'identità** (#1770): modello e installazione precedente arrivano dalle rotte di
  lettura, le scelte (tag, topic, persone, sostituzioni, app di demo) e la conferma restano a video, e l'API copia il
  modello nell'archivio del tenant con i suoi file, firmando la copia con l'identità del token. Chi non è utente del
  tenant lo dice l'API (409): si ripete con `--members` / `--replace`.
- **`pull --with-files` e `promote` funzionano con l'identità** (#1771): i file di una versione (knowledge e sorgenti
  delle app) si scaricano dall'API; `promote` vuole due sessioni (`login --env <origine>` e `login --env <destinazione>`),
  legge dalla prima e pubblica sulla seconda con i metadati della copia, che l'API firma con l'identità del token.
- **`files ls`, `files put` (guide, bozze, allegati, report), `files get`, `files rm`, `files open` funzionano con l'identità**
  (#1771): l'API elenca, scrive (con lo stesso scanner dei segreti e le stesse regole dei percorsi) e toglie. `files put`
  di una suite passa dall'archivio dei collaudi (validata contro il manifest, come `test push`); **`files share`** firma il
  link con l'identità dell'API e ne registra la traccia prima di darlo; **`files consolidate`** sposta suite e report dai
  posti di prima.
- **`connections list` e `connections refresh` funzionano con l'identità** (#1771): il riallineamento è un'operazione
  della piattaforma (`PlatformOperations`) che esegue l'API, che legge i segreti con i propri ruoli e riporta l'esito
  connessione per connessione. Nessun segreto viaggia nella
  risposta: solo «riallineata» o il motivo per cui non lo è.
- **`mcp check`, `mcp test`, `mcp publish`, `mcp authorize` e `mcp orphans` funzionano con l'identità** (#1771):
  definizione, tool del catalogo e collegamenti degli agenti arrivano da rotte `cli/*`; l'autorizzazione Google parte
  dall'API (che completa la riga OAuth con i segreti dell'app del cliente, se la riga è nata vuota) e la CLI segue lo
  stato ogni tre secondi. `mcp orphans --remove` chiede all'API, che **riscansiona prima di cancellare** e toglie solo le
  voci senza server e senza agenti: una lista mandata dalla CLI non basta.
- **`knowledge list`, `knowledge add`, `knowledge reingest` e `knowledge rm` funzionano con l'identità** (#1771): i file
  di `add` viaggiano nella richiesta (stesso tetto di 25 MB di `push`); `rm` manda il tag scritto dalla persona e l'API
  lo confronta di nuovo prima di togliere il profilo, sotto lease, con le stesse regole di blocco
  (`KnowledgeProfileRemoval`, ora nella libreria).
- **`instances` (list, show, cancel) e `schedule` (list, logs, on/off) funzionano con l'identità** (#1771): le
  istanze di processo e le pianificazioni degli agent task passano da rotte `cli/*` che l'API esegue con la propria
  identità; chi annulla un'istanza è l'email del token.
- **`test push`, `test reports`, `test report`, `test judge` e `test run` funzionano con l'identità** (#1771): suite e
  report passano dalle rotte `cli/*` con le stesse regole (validazione contro il manifest, scanner dei segreti, giudizio
  sostituibile solo con `--overwrite`). **`test run` lo esegue la piattaforma**: una suite da file si archivia prima sul
  tenant, l'API crea il report con l'approvazione della persona e lo accoda, la CLI lo segue caso per caso. Gli allegati
  dei casi `flow` viaggiano con la richiesta (#1772, stesso tetto di 25 MB) e la piattaforma li legge dall'archivio del
  report. `--no-archive` e `--out` non valgono: il report è nell'archivio, `test report` lo scarica.
- **Il tag dev'essere di questo tenant** (`CLI003`, lo stesso rilievo `WEB003` della chat): con il token è l'API a leggere
  i segreti, e un segreto mancante nella chiave del tenant si cerca nella chiave senza tenant dei blueprint applicati prima
  del #1185, indicizzata solo per tag. `push`, `plan`, `apply`, `catalog install`, `connections refresh` e `mcp authorize`
  si fermano (409) con un tag già usato da un altro tenant dell'ambiente.
- **`knowledge add` e `knowledge reingest` vanno a gruppi di 50 file per richiesta**: una rotta HTTP resta corta, la CLI
  pagina da sé e mostra l'avanzamento.
- **`catalog list`, `catalog pull` e `catalog install` funzionano con l'identità** (#1771): il catalogo si legge dalle rotte
  `cli/{tenant}/catalog/…` del tenant della persona (ogni tenant lo può leggere).
- **`catalog publish`, `catalog prune`, `copies`, `usage`, `access migrate/retag/orphans`** passano da `cli/platform/*`
  (#1772): solo un operatore di piattaforma (super-amministratore del prodotto), e l'API registra ogni accesso. La CLI
  mostra l'anteprima e chiede la conferma; la regola (ritenzione del catalogo, partizione orfana, tag valido) la riapplica
  l'API prima di scrivere.
- **`prune`** (#1596) legge il piano da `GET cli/{companyId}/blueprints/retention` e toglie con `POST …/prune`, con il tag
  scritto dalla persona; in produzione l'API si rifiuta. **`voice`** e **`suggest`** chiedono voci, sintesi e modelli
  all'API (`cli/{companyId}/voices|speech|models`): la chiave Speech resta sul server.
- **`export <orchestratore>`** funziona con l'identità, ma l'API lo concede solo agli **amministratori** del tenant: è una
  copia della configurazione (prompt, agenti, profili), non un elenco. **`export --scope …`** legge un tenant intero,
  quindi è un **job** (#1772): `POST cli/{companyId}/exports` lo accoda, AsyncOperations lo esegue con lo stesso
  esportatore e scrive manifest, rapporto ed elenco dei segreti nell'archivio del tenant
  (`blueprints/{companyId}/exports/{exportId}/`); la CLI aspetta fino a 15 minuti e scarica i tre file nella cartella.
- **`report-problem`** firma con il token della sessione di `login`: niente `az login`.

---

## `logout [--env <nome>] [--b2c]`

Toglie dalla cache il token dell'ambiente e della directory indicati. Senza sessione non fa niente e lo dice.

---

## `whoami [--env <nome>] [--b2c]`

- **`whoami`** chiama `GET cli/me` sull'API dell'ambiente: dice chi sei per il prodotto e, per ogni tenant dove
  sei utente, se sei amministratore (può scrivere) o solo utente (sola lettura). **Non crea mai un utente**: un
  token valido non basta per esserlo, e chi non lo è vede «nessun tenant».
- **Configurazione**: l'authority B2C (con la user flow) e il tenant Entra di `hevolus.it` sono già i default di
  staging, letti dall'App Configuration della webapp: non sono segreti. Mancano le app registration **pubbliche**
  della CLI, in preparazione: finché non esistono si passano da variabile d'ambiente (predefinito, Entra: `XRCOPILOTLAB_BP_ENTRA_CLIENT_ID` e `_SCOPE`; con `--b2c`: `XRCOPILOTLAB_BP_B2C_CLIENT_ID` e `_SCOPE`), e il comando dice
  quali mancano. `XRCOPILOTLAB_BP_B2C_AUTHORITY` (forma `https://<host>.b2clogin.com/tfp/<tenant>.onmicrosoft.com/<policy>`)
  e `XRCOPILOTLAB_BP_ENTRA_TENANT` sostituiscono i default; `XRCOPILOTLAB_BP_API_URL` punta a un'API diversa da quella
  dell'ambiente. Nessun valore è un segreto.
- **Codici di uscita**: `8` se non c'è una sessione, il token non è accettato o la persona non è un utente;
  `3` se l'API dell'ambiente è chiusa (`CliAccess:Closed`, o una build precedente senza emittenti: risponde 503). Senza
  configurazione l'API accetta lo staff `hevolus.it` da sé, con gli stessi identificativi del binario.

---

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
