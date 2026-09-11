---
name: xrcopilotlab-blueprint
description: Genera un manifest YAML di blueprint XRCopilotLab (topic, ruoli aziendali, agenti con system message e skill, agent task, processi BPM pubblicati con webhook) e lo applica a un tenant con la CLI `xrcopilotlab-bp`, fermandosi a mostrare il piano prima di creare qualcosa. Usa quando l'utente chiede di "creare un blueprint", "configurare un cliente o un contesto da zero", "generare lo YAML del blueprint", "provisionare agenti e processi", "applicare un blueprint", "creare un processo BPM da riga di comando", oppure nomina `xrcopilotlab-bp`. Usa anche quando chiede orientamento sui blueprint — "come funziona", "cosa posso fare", "help", "quali ambienti ci sono", "quali blueprint esistono" — o invoca la skill senza argomenti: in quel caso risponde con le informazioni e si ferma, senza iniziare un'intervista. NON usare per modificare un singolo agente o processo già esistente: per quello si va dalla UI.
---

# xrcopilotlab-blueprint

Porta l'utente da «vorrei un ambiente così» a un blueprint applicato su un tenant.

Il lavoro è in due metà: **scrivere il manifest** e **applicarlo**. La seconda passa sempre dalla
CLI, mai da chiamate dirette all'API, e si ferma a chiedere il permesso prima di toccare il tenant.

Input: `$ARGS` — la descrizione del contesto da configurare, il percorso di un manifest già scritto
da rivedere o applicare, oppure **niente**.

## 0. Se `$ARGS` è vuoto, o chiede aiuto

`help`, `aiuto`, `?`, «cosa sai fare», «come funziona» — e anche l'invocazione senza argomenti — non
sono l'inizio di un'intervista: sono una richiesta di orientamento. Rispondere, e **fermarsi lì**.
Chi arriva così non ha ancora deciso cosa fare, e partire a chiedere «di che cliente si tratta?» lo
costringe a una conversazione che non aveva chiesto.

Cosa riportare, in quest'ordine:

1. **A cosa serve**: descrivere un ambiente in un file e crearlo su un tenant — topic, agenti,
   connessioni, server MCP, orchestratori, agent task, processi BPM — mostrando il piano e
   chiedendo conferma prima di toccare qualcosa.
2. **Cosa serve per poterlo usare**, in due righe: un accesso `hevolus.it` — non c'entra l'account
   con cui si usa Claude — e, la prima volta su quella macchina, un accesso ad Azure che si fa dal
   proprio terminale. Dettagli in [§ Con quale identità gira](#con-quale-identità-gira--da-chiarire-al-primo-comando-che-fallisce-o-prima):
   vale la pena dirlo qui, perché è il punto contro cui si sbatte prima di riuscire a fare qualsiasi
   altra cosa.
3. **Su cosa si può lavorare adesso.** Gli ambienti sono `staging`, `preview`, `prod`; senza `--env`
   vale lo sviluppo, cioè il `local.settings.json` del clone. Dire che in produzione si lavora solo
   sul tenant di Hevolus, e perché.
4. **I blueprint che esistono già**, se c'è una cartella `blueprints/`: elencare i file con tag e
   versione. È la risposta più utile, perché quasi sempre chi chiede aiuto vuole ripartire da uno.
5. **Cosa c'è già sul tenant**, se l'utente ha indicato un ambiente: `xrcopilotlab-bp status` lo
   dice in una riga per blueprint. Non lanciarlo di propria iniziativa su un ambiente non indicato.
6. **I tre percorsi possibili**, come domanda finale: partire da un dossier di assessment, fare
   l'intervista da zero, oppure rivedere o applicare un manifest che esiste.

Per l'elenco dei comandi e delle opzioni **non scrivere a memoria**: eseguire `xrcopilotlab-bp
--help` e riportarne l'esito. È l'unica versione che non può essere in ritardo rispetto al binario
installato, che potrebbe non essere l'ultimo.

Se la domanda è puntuale — «come si scrive un gateway», «che vuol dire BP060», «come si cancella un
blueprint» — rispondere a quella e basta, pescando dal riferimento giusto qui sotto, senza recitare
tutto l'orientamento.

## Cosa leggere prima

| Quando | Documento |
|---|---|
| Sempre, prima di scrivere lo YAML | [`references/regole-del-grafo.md`](references/regole-del-grafo.md) — cosa il validatore accetta |
| Quando parti da zero e devi intervistare | [`references/intervista.md`](references/intervista.md) — l'ordine delle domande e come tradurre le risposte |
| Quando serve una fonte esterna che non è ancora collegata | [`references/mcp-builder.md`](references/mcp-builder.md) — il ciclo connessione → MCP → agente, verificato su VIES |
| Quando l'ambiente ha dei documenti — sempre, se c'è un topic | [`references/knowledge.md`](references/knowledge.md) — topic, profili, agenti: i tre livelli e la sequenza |
| Per il significato di un campo | [`references/manifest-reference.md`](references/manifest-reference.md) |
| Per un comando o un codice di uscita | [`references/cli-reference.md`](references/cli-reference.md) |
| Manuale d'uso del plugin | [`../../docs/manuale.md`](../../docs/manuale.md) |

Lo schema è in [`references/blueprint.v1.schema.json`](references/blueprint.v1.schema.json).
Due esempi commentati: [`references/esempio-agenda.yml`](references/esempio-agenda.yml) (scenario reale)
e [`references/esempio-minimo.yml`](references/esempio-minimo.yml) (il giro più corto).

## Con quale identità gira — da chiarire al primo comando che fallisce, o prima

Domanda che arriva sempre, e la risposta breve è: **l'account con cui si usa Claude non c'entra
niente.** La CLI non parla con Claude, parla con **Azure**. Personale o aziendale, il piano non
cambia di una riga.

Quello che serve è un'identità **nel tenant `hevolus.it`**, perché App Configuration, Key Vault,
Cosmos e lo storage vivono nella sottoscrizione di Hevolus. Un account Microsoft personale non può
funzionare: non è una questione di permessi mancanti, è che quelle risorse non sono sue.

### E non è l'account con cui si entra in XRCopilotLab

Questa è la confusione da sciogliere per prima, perché l'utente ha ragione a sentirsi già dentro.
XRCopilotLab si usa con un'identità **Azure AD B2C** — la pagina di accesso è
`xrcopilotlab.b2clogin.com`, con email e password registrate sul momento oppure **Login with
Google**. È una directory **diversa** da quella aziendale, e le due non si incontrano mai.

| | Chi **usa** XRCopilotLab | Chi **esegue** la CLI |
|---|---|---|
| Directory | Azure AD B2C (`xrcopilotlab.onmicrosoft.com`) | Entra ID aziendale (`hevolus.it`) |
| Identità | email registrata, o account Google | account `hevolus.it` |
| Serve a | chat, UI, processi, work item | leggere App Configuration e Key Vault, comandare l'API |
| Conta qui? | **no** | sì, è l'unica che conta |

Quindi non è solo che il *ruolo* dentro il prodotto non conta: **non conta nemmeno l'account**. Chi
amministra un tenant XRCopilotLab con un'identità B2C non ha, per ciò stesso, alcun accesso alla
CLI — e chi ha i ruoli Azure non entra, per ciò stesso, nel prodotto.

Conseguenza pratica: **questo strumento è per l'AI Team di Hevolus**, che configura XRCopilotLab a
valle di un assessment. Non è uno strumento da mettere in mano al cliente, che sul prodotto entra
ma sulla CLI no.

### Gli indirizzi nel manifest sono utenti del prodotto, non identità Azure

Vale quando scrivi `businessRoles[].members`, `processes[].owners` e i `recipients` di un passo
`humanApproval`. Il preflight li confronta con gli utenti **del tenant XRCopilotLab**
(`Api.Users.GetUsersAsync`), cioè con la directory B2C:

- un `mario@gmail.com` registrato con Google è un membro di ruolo **valido**;
- un collega con un ottimo account `hevolus.it` che non è mai entrato nel prodotto **non lo è**, e
  il piano si ferma con «l'utente non esiste nel tenant».

Il blueprint aggiunge le persone ai ruoli, non le crea. Quindi, prima di scrivere un indirizzo nel
manifest, la domanda non è «ha un account Hevolus?» ma «**è già un utente di quel tenant?**».

Attenzione a un caso che nasconde la distinzione: quando la stessa persona ha entrambe le cose —
identità Azure per lanciare la CLI e utente del prodotto per ricevere i compiti — la mail è la
stessa stringa in due panni diversi, e sembra che ci sia un solo account. Non c'è.

I ruoli sono due, più due solo per chi imposta segreti:

| Per fare | Ruoli sull'ambiente |
|---|---|
| `validate` | nessuno — non tocca la rete |
| `push`, `plan`, `apply`, `status`, `rollback`, `delete` | **App Configuration Data Reader** e **Key Vault Secrets User** |
| in più, `secrets set` | **App Configuration Data Owner** e **Key Vault Secrets Officer** |

Tutto passa da lì: la chiave di Cosmos e la stringa dello storage sono riferimenti a Key Vault
dentro App Configuration, quindi non servono ruoli su Cosmos, sullo storage o sull'API.

Si verificano così, senza indovinare:

```bash
az account show --query "{tenant:tenantId, utente:user.name}" -o tsv
az role assignment list --assignee <id-utente> --scope <id-della-risorsa> --include-inherited \
  --query "[].roleDefinitionName" -o tsv
```

### `az login` non è obbligatorio, ma il primo accesso sì — e non lo puoi fare tu

`BlueprintCredential` prova in quest'ordine: prima tutto ciò che è **già** configurato sulla
macchina (variabili d'ambiente, identità gestita, Visual Studio, Azure CLI), e **solo in fondo**
apre il browser, con un token che resta in cache fra le esecuzioni. Chi ha già fatto `az login` non
nota differenza; chi non ha Azure CLI installata non deve installarla.

C'è però una condizione che cambia tutto quando la skill gira dentro un assistente: **il ramo del
browser esiste solo con un terminale vero.** `ConsoleOutput.IsInteractive` è falso appena
ingresso o uscita sono rediretti — cioè sempre, quando il comando lo lancia l'assistente. È una
scelta voluta (meglio fallire dicendo cosa manca che restare appesi a una pagina che nessuno apre),
ma la conseguenza è precisa:

> **Il primo accesso lo deve fare la persona, nel proprio terminale. Non è eseguibile nel flusso.**

Quindi, davanti a un errore di autenticazione, non riprovare e non cercare scorciatoie: far
lanciare all'utente **uno** di questi, una volta per macchina —

```
az login
```

— oppure, se non ha Azure CLI, un qualsiasi comando della CLI dal **suo** terminale (`xrcopilotlab-bp
status`): si apre il browser, e da lì in poi il token in cache vale anche per i comandi che lanci tu.

### Se l'utente non è tecnico

È il caso per cui esiste il plugin, e conviene dirgli tre cose e non di più:

1. serve l'accesso Hevolus, quello con cui entra nella posta aziendale;
2. la prima volta si apre una pagina del browser: è normale, è l'accesso ad Azure, e succede una
   volta sola su quella macchina;
3. se compare un errore che parla di ruoli o di permessi, non è qualcosa che può risolvere da sé —
   va chiesto a chi amministra la sottoscrizione, riportando **il nome della risorsa** e **il ruolo**
   che il messaggio nomina.

Non fargli installare Azure CLI, non fargli scrivere un profilo, non fargli maneggiare una chiave:
niente di tutto ciò è necessario, e ognuna di quelle strade ha un modo di finire male che lui non
può riconoscere.

## 1. Capire il processo

Se l'utente ha già un manifest, saltare al punto 2.

**Se porta un dossier di assessment** — il documento prodotto su Claude Desktop dalla skill
`xrcopilotlab-assessment` — la fonte è quello, non un'intervista da capo. Il capitolo **«Elementi
per il provisioning»** contiene già tag, topic, ruoli aziendali con i membri, agenti con il system
message, agent task e il disegno del processo; il capitolo del processo contiene attività, modalità,
corsie, moduli e condizioni. Leggili, traducili, e **chiedi solo ciò che manca davvero**: fare
ripetere all'utente cose che ha già scritto è il modo più veloce per perderne la fiducia.

Due cose vanno comunque verificate, perché il dossier non può saperle: che i **nomi non siano già
occupati** sul tenant (lo dice il preflight del piano) e che i **valori dei segreti** siano stati
impostati con `secrets set` — nel dossier c'è solo il loro nome, ed è giusto così.

Se il dossier promette qualcosa che il motore non fa — un timer, un ricongiungimento dopo un fork,
un allegato in un processo dichiarativo — dirlo subito: è meglio scoprirlo qui che a piano rifiutato.

Altrimenti condurre l'intervista seguendo [`references/intervista.md`](references/intervista.md):
una domanda per volta, senza chiedere ciò che si può dedurre e senza inventare ciò che non è stato
detto.

Se quello che descrivono non regge le regole del motore — un bivio senza ramo di default, due rami
paralleli che si ricongiungono, un passo automatico con un modulo da compilare — dirlo subito e
proporre la forma corretta. Scrivere uno YAML che il validatore rifiuterà fa perdere un giro a
entrambi.

## 2. Scrivere il manifest

Il file va in `blueprints/<tag-minuscolo>-<slug>.yml` dentro il progetto dell'utente; se quella
cartella non esiste, si crea.

Sei errori che si fanno se non si sta attenti:

1. **I nomi si scrivono senza prefisso.** Il planner antepone `BP-<TAG>-`. Scriverlo a mano produce
   `BP-TEST-BP-TEST-…` ed è un errore segnalato.
2. **Nella `spec` i riferimenti sono nomi, non chiavi.** `roleName: Referente agenda`, non
   `roleName: referente`. Devono coincidere con il `name` dichiarato in `businessRoles` e
   `agentTasks`.
3. **Il tipo dei valori conta.** `value: true` è booleano, `value: "true"` è stringa, e il motore
   confronta per tipo.
4. **Un gateway esclusivo vuole esattamente un ramo senza condizione.**
5. **`categoryName` non si prefissa**: appartiene al catalogo del tenant.
6. **Mai un segreto nel file.** Solo il nome di una chiave `Blueprints:Secrets:<TAG>:<nome>`.
7. **Il topic si indica in un modo solo.** `topic` ne crea uno nuovo; `existingTopic` (per nome,
   come compare nella UI) o `topicId` ne riusano uno esistente. Se l'utente vuole aggiungere agenti
   a un topic che ha già, è `existingTopic`: chiediglielo invece di crearne uno nuovo con un nome
   simile.
8. **Il topic non è il RAG.** Il topic è il repository dei file; il **profilo** è ciò che li
   indicizza e che si collega all'agente. Un agente su un topic pieno di file ma senza profilo non
   vede niente. I profili si dichiarano in `knowledge:` e sono **knowledge graph per default**; il
   tipo dei file **non si scrive** se non lo chiede l'utente. Prima di scrivere quella sezione:
   [`references/knowledge.md`](references/knowledge.md).

L'id dei flussi lasciarlo fuori: lo genera la CLI, e il file resta leggibile.

### Quando serve una fonte esterna che non è ancora collegata

Un agente che deve leggere da un sistema esterno ha bisogno di un **server MCP**, e la domanda da
farsi è una sola: quella fonte è **HTTP interrogabile**?

Se sì, non si scrive un servizio: si costruisce con **MCP Builder**, e il manifest lo **dichiara** —
una `connections` con provider, baseUrl e autenticazione, e un `mcpServers` con `kind: builder` e i
tool, che sono già `{nome, metodo, path}`. **La CLI lo crea**: connessione, server, prova di un tool
e pubblicazione, più il collegamento all'agente. Le autenticazioni coprono `None`, `Bearer`,
`Basic`, `CustomHeaders` e `OAuth2ClientCredentials` — quindi anche Microsoft Graph, e con esso una
casella o un calendario.

Se no — la fonte non è HTTP, richiede logica di trasformazione, o custodisce un token per ogni
entità autorizzata come LinkedIn — il server va scritto, e **non è dichiarabile**: `kind: external`
pretende l'URL di un server già ospitato, e inventarlo metterebbe nel manifest un dato falso. Si
annota nella `description` dell'agente che lo userà e finisce fra i passi manuali del piano di
attivazione.

**Microsoft 365 — posta, calendario, contatti, file — ha una forma sola, e va proposta senza
farsela chiedere**: connessione a Graph con `OAuth2ClientCredentials`, server `builder` con i soli
tool che servono, e l'identità per-utente (la casella) in `variables` e **mai** fra i parametri del
tool — altrimenti è il modello a decidere di chi legge la posta, su un permesso che vale per tutto
il tenant. I quattro passi che il blueprint non può fare — registrazione applicativa, consenso
amministratore, **Application Access Policy** che limita l'app a quella casella, segreti con
`secrets set` — si riportano all'utente prima di applicare, perché li confermi nell'interfaccia.

Procedura completa, la scelta di un tool di prova in sola lettura, l'errore del path duplicato che
costa un 404 e le regole di prompt sui gap: [`references/mcp-builder.md`](references/mcp-builder.md).

## 3. Validare

```bash
xrcopilotlab-bp validate blueprints/<file>.yml --graph
```

Se ci sono errori, correggerli e ripetere. **Non chiedere all'utente di interpretare i codici**: i
rilievi sono per chi scrive il file, e chi scrive il file sei tu.

Quando è pulito, mostrare all'utente il **grafo stampato** e chiedere conferma che il percorso sia
quello che intendeva. È il momento giusto per accorgersi di un ramo mancante: dopo, correggerlo
costa una versione nuova.

## 4. Segreti, se il manifest ne cita

Il valore di un segreto **non si chiede e non si maneggia**. Stampare all'utente il comando da
lanciare, dicendogli di darlo **nel suo terminale**:

```
xrcopilotlab-bp secrets set --env staging --tag STUDIOPOLIS graph-client-secret
```

**Questo è l'unico comando che non va proposto con il prefisso `!`**, ed è una differenza che
costa: il `!` lo esegue dentro la sessione, quindi l'interazione finisce nella trascrizione — cioè
esattamente il posto in cui un segreto non deve passare. Il comando chiede il valore con una
lettura mascherata: va data dove la maschera serve a qualcosa.

Per un valore che l'utente ha già altrove c'è **`--from-env NOME_VARIABILE`**, che lo legge da una
variabile d'ambiente invece che dal prompt.

Poi verificare con `xrcopilotlab-bp secrets check blueprints/<file>.yml --env <ambiente>`.
`--env` non è un dettaglio: senza, la verifica può guardare un ambiente diverso da quello in cui il
piano andrà a cercare la chiave, e si finisce a rifare due volte la stessa cosa.

Se `secrets set` risponde che non sa in quale Key Vault scrivere, **non indovinare il vault dal
nome**: si prende da quelli a cui puntano i riferimenti già presenti nell'App Configuration di
quell'ambiente. Vault dal nome plausibile ma inutilizzati esistono davvero, e scriverci un segreto
non dà nessun errore — semplicemente nessuno lo legge.

## 5. Piano, e approvazione umana

```bash
xrcopilotlab-bp push blueprints/<file>.yml
xrcopilotlab-bp plan --tag <TAG> --company <guid>
```

Dentro il repository, senza `--env`, si lavora sull'ambiente del `local.settings.json`. Per
sceglierlo si aggiunge `--env staging`, `--env preview` o `--env prod`: gli ambienti sono dentro il
binario, non c'è nulla da configurare.

Il **tenant** non si scrive: senza `--company` la CLI ne elenca i nomi e chiede quale. Eseguita da
un assistente l'input non è un terminale, quindi stampa l'elenco e si ferma con **6** — vuol dire
riportare i nomi all'utente e chiedere quale, non indovinarne uno.

In **produzione** si lavora sul solo tenant di Hevolus: l'API non elenca gli ambienti dei clienti e
li rifiuta anche se il GUID viene scritto a mano (**3**). Non è un permesso che manca, è una scelta:
l'ambiente di un cliente si configura dall'interfaccia. Se qualcuno chiede di applicare un blueprint
sul tenant di un cliente in produzione, la risposta è questa, non un tentativo.

**Mostrare il piano all'utente e fermarsi.** Non «riassumere che è tutto a posto»: riportare cosa
verrà creato e il grafo del processo, perché è su quello che la persona deve decidere.

Poi **chiedere esplicitamente l'approvazione**, dicendo su quale tenant e quante entità. Finché non
arriva un sì, il lavoro è finito qui.

Cosa **non** vale come approvazione:

- un sì dato prima, per un piano diverso o per una versione precedente del manifest;
- un «vai» generico detto all'inizio della conversazione, prima che il piano esistesse;
- il fatto che il piano non abbia errori. Un piano valido è un piano che *si può* applicare, non uno
  che *si deve* applicare.

Se il piano riporta collisioni, spiegare quale nome è già occupato e le tre strade — rinominare,
cambiare tag, rimuovere l'entità esistente — senza sceglierne una.

## 6. Applicare, solo dopo il sì

```bash
xrcopilotlab-bp apply --tag <TAG> --company <guid> --yes
```

`--yes` **non** è una scorciatoia per saltare la domanda: è la forma scritta dell'approvazione che
l'utente ha appena dato, e finisce nel run insieme a chi l'ha data e a quando. Usarlo senza quel sì
significa firmare al posto di qualcun altro.

La CLI difende comunque il cancello: eseguita da un assistente l'input non è un terminale, quindi
senza `--yes` stampa il piano, si ferma e restituisce **6**. Nessuna entità viene creata. Se ricevi
un 6, non aggiungere `--yes` per «sbloccare»: significa che l'approvazione manca ancora.

Al termine riportare: quante entità sono state create, il `runId`, gli eventuali riferimenti non
risolti nei processi, e — se è stato creato un webhook — che la chiave compare **una sola volta** e
va conservata adesso.

Se l'applicazione fallisce a metà, dire com'è messo: cosa è stato creato, che il run riparte con
`--resume <runId>`, e che `rollback --run <runId>` smonta ciò che l'inventario elenca.

## 7. Cancellare un blueprint

`delete --tag <TAG>` toglie dall'archivio le versioni del manifest, gli artefatti nello storage e i
run. **Non è il contrario di `apply`**: quello è `rollback`, che smonta le entità dal tenant.

Se il blueprint ha ancora entità vive il comando si ferma con **3** e dice quante. Le due strade
vanno riportate all'utente senza sceglierne una: `rollback --run <runId>` prima, oppure
`--with-entities` per smontarle nello stesso comando — che le rimuove **prima** di cancellare
l'archivio, perché l'inventario è l'unica cosa che sa come si chiamano.

Il cancello è **più duro** di quello di `apply`: `--yes` non vale, serve `--confirm <TAG>` con il
tag esatto del blueprint. Si riporta all'utente l'avviso che il comando stampa — quante entità,
quante versioni, e che non esiste un annulla — e si attende un sì che nomini quel blueprint. Un sì
detto per un altro piano, o prima che il piano esistesse, non vale qui più che altrove.

## Codici di uscita

| Codice | Cosa fare |
|---|---|
| `0` | Procedere |
| `2` | Manifest non valido: correggerlo, non girare l'errore all'utente |
| `3` | Piano bloccato da collisioni o segreti mancanti: riportare, non forzare. In produzione, anche: il tenant indicato non è di Hevolus — non cercare strade alternative |
| `4` | Esecuzione fallita: riportare lo stato, proporre `--resume` o `rollback` |
| `5` | In attesa di un passo manuale |
| `6` | Manca una decisione umana. Piano non approvato: **non aggiungere `--yes` di propria iniziativa**, chiedere il sì. Tenant non scelto: riportare l'elenco dei nomi e chiedere quale |

## Cosa non fare

- Non chiamare l'API direttamente: tutto passa dalla CLI.
- Non lanciare `delete` per «ripulire» di propria iniziativa, e `--confirm <TAG>` solo dopo un sì
  esplicito per quel blueprint: cancella l'archivio e, con `--with-entities`, ciò che sta sul
  tenant. Non esiste un annulla.
- Non lanciare `apply` o `pipeline` con `--yes` senza un consenso esplicito **per quel piano**. Un
  consenso dato prima, per un piano diverso, non vale. Il flag registra un'approvazione umana: se
  non c'è stata, sta registrando il falso.
- Non chiedere, ripetere o scrivere il valore di un segreto.
- Non usare `--overwrite` di propria iniziativa: una versione pubblicata è immutabile, e alzare
  `version:` è la strada normale.
- Non promettere le due cose che restano fuori: l'ereditarietà fra blueprint (`extends`) e
  l'ingresso **push** della posta (`external` con `ingress.kind: logicapp`), che vuole una Logic App
  e un'autorizzazione umana. Tutto il resto — connessioni, server MCP, orchestratori, agent task
  schedulati con le loro code di uscita — il blueprint lo crea davvero.
