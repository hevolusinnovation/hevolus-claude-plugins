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
2. **Cosa serve per poterlo usare**, in due righe: la CLI — che si ottiene installando il plugin
   `blueprints@hevolus`, non compilando questo repository ([`references/installazione.md`](references/installazione.md)
   anche per l'installazione a mano su macOS e Windows) — un accesso `hevolus.it` — non c'entra
   l'account con cui si usa Claude — e, la prima volta su quella macchina, un accesso ad Azure che
   si fa dal proprio terminale. Dettagli in [§ Con quale identità gira](#con-quale-identità-gira--da-chiarire-al-primo-comando-che-fallisce-o-prima):
   vale la pena dirlo qui, perché è il punto contro cui si sbatte prima di riuscire a fare qualsiasi
   altra cosa.
3. **Su cosa si può lavorare adesso.** Non recitare l'elenco degli ambienti: eseguire
   `xrcopilotlab-bp environments` e riportarne l'esito. Gli ambienti sono gli stessi per tutti — i
   **permessi no**, e sono personali: quel comando li prova con l'utenza corrente e dice su quali
   si può davvero lavorare, invece di far scoprire un errore di ruoli a lavoro cominciato. Senza
   `--env` vale lo sviluppo, cioè il `local.settings.json` del clone. Dire che in produzione si
   lavora solo sui tenant a cui l'utente appartiene — quelli che gli mostra l'interfaccia — e perché.

   Se un ambiente risulta **non accessibile**, non proporlo come se lo fosse: distinguere il ruolo
   mancante — che si chiede a chi amministra la sottoscrizione — dall'accesso ad Azure mai fatto su
   quella macchina, che l'utente risolve da sé, una volta, da un terminale.
4. **I blueprint che esistono già**: non stanno nel repository ma nell'archivio del tenant
   (`xrcopilotlab-bp status` sull'ambiente indicato, o la cartella di lavoro
   `~/.xrcopilotlab/blueprints/` se c'è): elencarli con tag e versione. È la risposta più utile, perché quasi sempre chi chiede aiuto vuole ripartire da uno.
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
| Se la CLI non c'è, o `xrcopilotlab-bp` non è un comando | [`references/installazione.md`](references/installazione.md) — il plugin, e l'installazione a mano su macOS e Windows |
| Sempre, prima di scrivere lo YAML | [`references/regole-del-grafo.md`](references/regole-del-grafo.md) — cosa il validatore accetta |
| Quando parti da zero e devi intervistare | [`references/intervista.md`](references/intervista.md) — l'ordine delle domande e come tradurre le risposte |
| Quando serve una fonte esterna che non è ancora collegata | [`references/mcp-builder.md`](references/mcp-builder.md) — il ciclo connessione → MCP → agente, verificato su VIES |
| Quando l'ambiente ha dei documenti — sempre, se c'è un topic | [`references/knowledge.md`](references/knowledge.md) — topic, profili, agenti: i tre livelli, la sequenza, e **come si dividono i file fra i profili** |
| Quando si scrive un agente — cioè sempre | [`references/modelli.md`](references/modelli.md) — quale modello, e perché la fascia dipende dal lavoro del passo |
| Per il significato di un campo | [`references/manifest-reference.md`](references/manifest-reference.md) |
| Per un comando o un codice di uscita | [`references/cli-reference.md`](references/cli-reference.md) |
| Manuale d'uso del plugin | [`../../docs/manuale.md`](../../docs/manuale.md) |

Lo schema è in [`references/blueprint.v1.schema.json`](references/blueprint.v1.schema.json).
Due esempi commentati: [`references/esempio-agenda.yml`](references/esempio-agenda.yml) (scenario reale)
e [`references/esempio-minimo.yml`](references/esempio-minimo.yml) (il giro più corto).

## Se compare che il plugin è indietro

L'avviso arriva in due posti: **all'apertura della sessione** (un hook del plugin) e **in cima
all'output di un comando**. Le righe sono due, e dicono cose diverse:

```
xrcopilotlab-bp: c'è il plugin blueprints 2.19.0, questo è il 2.18.0: skill o CLI nuove. Aggiornalo con '/plugin marketplace update hevolus' e '/plugin update blueprints@hevolus', poi riavvia la sessione.
xrcopilotlab-bp: c'è la 2.16.0, il plugin chiede la 2.15.0. Aggiornalo con '/plugin update blueprints@hevolus'.
```

La prima vuol dire che è uscita una versione del **plugin** — skill nuove o aggiornate, a volte una
CLI nuova — e ci sono **due comandi e un riavvio**: le skill si caricano all'apertura della
sessione, quindi senza riavvio si continua a seguire quelle vecchie. La seconda vuol dire che c'è
una CLI più recente di quella che il plugin chiede.

**Non ignorarla e non lasciarla sepolta nell'output**: dilla all'utente a parole, una riga, e
proponi il comando. Chi legge una risposta lunga quella riga non la vede, e se ne accorge settimane
dopo — quando un comando del manuale «non esiste», che è il modo peggiore di scoprirlo.

Due cose da sapere mentre lo dici:

- **non puoi aggiornare tu**: `/plugin update` è un comando del client, lo digita la persona. Anche
  potendo, aggiornare sostituisce le skill mentre le stai seguendo: si fa fra un lavoro e l'altro,
  non a metà di un `apply`.
- **non è urgente**, e va detto: ciò che sta girando funziona. Se l'utente è a metà di qualcosa, si
  finisce e si aggiorna dopo.

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

1. la CLI se la installa il plugin da solo — `/plugin marketplace add hevolusinnovation/hevolus-claude-plugins`
   e `/plugin install blueprints@hevolus`, e serve l'accesso Hevolus, quello con cui entra nella
   posta aziendale;
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
un allegato raccolto nel form di avvio — dirlo subito: è meglio scoprirlo qui che a piano rifiutato.

Altrimenti condurre l'intervista seguendo [`references/intervista.md`](references/intervista.md):
una domanda per volta, senza chiedere ciò che si può dedurre e senza inventare ciò che non è stato
detto.

Se quello che descrivono non regge le regole del motore — un bivio senza ramo di default, due rami
paralleli che si ricongiungono, un passo automatico con un modulo da compilare — dirlo subito e
proporre la forma corretta. Scrivere uno YAML che il validatore rifiuterà fa perdere un giro a
entrambi.

## 2. Scrivere il manifest

Il file va nella cartella di lavoro, `~/.xrcopilotlab/blueprints/<TAG>/<tag-minuscolo>-<slug>.yml`:
non nel repository, dove la cartella `blueprints/` è in `.gitignore`. Una volta pubblicato con
`push`, la sua copia di riferimento è quella nell'archivio del tenant.

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
7-bis. **Un server MCP che il tenant ha già si cita, non si ricrea.** `web-search`, un server
   registrato a mano, uno di un altro blueprint: `mcpServers` con `kind: existing` e il **nome
   esatto del catalogo** (niente prefisso, niente tool, niente URL), e l'agente lo mette in `mcp:`.
   La CLI lo collega all'agente; se il server non c'è il piano si ferma con `BP069`, che elenca
   ciò che il catalogo contiene. Non scrivere più «da collegare dalla UI» in una `description`:
   era il ripiego di quando questa forma non esisteva (fino al 29/09/2026).
8. **Il topic non è il RAG.** Il topic è il repository dei file; il **profilo** è ciò che li
   indicizza e che si collega all'agente. Un agente su un topic pieno di file ma senza profilo non
   vede niente. I profili si dichiarano in `knowledge:` e sono **knowledge graph per default**; il
   tipo dei file **non si scrive** se non lo chiede l'utente. Prima di scrivere quella sezione:
   [`references/knowledge.md`](references/knowledge.md).
9. **Un profilo per agente, e i nomi dei file contano.** Dentro un profilo le sorgenti si
   selezionano confrontando le parole della domanda con il **nome del file**, e se qualcuna
   corrisponde le altre sono escluse: un riferimento comune che nessuno nomina sparisce, e in una
   catena orchestrata — dove il messaggio contiene l'output del passo precedente — la selezione non
   discrimina più e si carica tutto. Un profilo con tutti i documenti collegato a tutti gli agenti è
   la forma che sbaglia. `xrcopilotlab-bp suggest <file.yml> --files <cartella>` propone la
   partizione e calcola i vincoli; il validatore li segnala con `BP028`.
10. **Il modello si dichiara.** Senza `model:` l'agente nasce su `gpt-5.4` (`BP015` lo avvisa), e un
    nome fuori catalogo ferma il piano (`BP065`). La fascia dipende dal lavoro del passo, non dalla
    sua importanza: [`references/modelli.md`](references/modelli.md).

11. **Negli orchestratori non c'è uno step di avvio.** Si parte dal primo step elencato, quello a
    cui nessun flusso arriva — come nel designer, dove uno «Start» non si può aggiungere. Un
    `type: start` scritto per abitudine è segnalato (`BP094`) e ignorato dal piano; due step senza
    flussi entranti, o nessuno, fermano il piano (`BP095`).
12. **Le domande suggerite all'utente stanno in `welcomeMessage`, sull'orchestratore.** È il messaggio
    che la chat mostra all'apertura, prima che l'utente scriva (max 1500 caratteri). **Non** uno step
    `sendMessage` in testa alla catena: il suo testo arriva in chat solo insieme alla risposta
    finale, quando non serve più. Scriverci la forma che una domanda deve avere e due o tre esempi
    che funzionano davvero.

L'id dei flussi lasciarlo fuori: lo genera la CLI, e il file resta leggibile.

### Se l'ambiente ha dei documenti, far parlare i file prima di decidere

```bash
xrcopilotlab-bp suggest ~/.xrcopilotlab/blueprints/<TAG>/<file>.yml --files <cartella> --env staging
```

Da lanciare **dopo** aver scritto gli agenti e **prima** di scrivere `knowledge:`. Propone un
profilo per agente, assegna i file dove il nome lo giustifica, e calcola i vincoli che i nomi
impongono: quali file il selettore non distinguerà, e quali dentro il loro profilo non hanno parole
proprie — cioè verranno esclusi appena una domanda nomina uno degli altri. Stampa anche una fascia
di modello per agente, con i segnali su cui si basa.

Non scrive niente, e ciò che propone **non si incolla senza leggerlo**: i file che lascia non
assegnati sono quelli per cui il nome non basta a decidere, e quella decisione richiede di sapere
che cosa fa ciascun agente. La proposta di modello è un'inferenza su segnali del manifest, non sul
lavoro del passo.

### Quando serve una fonte esterna che non è ancora collegata

Un agente che deve leggere da un sistema esterno ha bisogno di un **server MCP**. Prima domanda:
il tenant **ce l'ha già** nel catalogo? Allora è `kind: existing` (regola 7-bis) e non si costruisce
niente. Altrimenti la domanda da farsi è una sola: quella fonte è **HTTP interrogabile**?

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

**Se è la chat a dover far partire un processo** — l'utente detta o incolla qualcosa all'agente e
da lì deve nascere una pratica — la forma è una `connections` con `process: <chiave del processo>`
(niente `baseUrl`, niente `auth`: indirizzo e chiave del webhook li mette l'apply, dopo aver creato
il webhook) e un `mcpServers` `builder` su quella connessione con un tool `POST /` il cui corpo ha le
chiavi del modulo di avvio. L'agente della chat non deve essere quello di un passo automatico del
processo, e va istruito a rileggere, chiedere conferma e chiamare il tool **una** volta.

Procedura completa, la scelta di un tool di prova in sola lettura, l'errore del path duplicato che
costa un 404, il ponte dalla chat al processo e le regole di prompt sui gap:
[`references/mcp-builder.md`](references/mcp-builder.md).

## 3. Validare

```bash
xrcopilotlab-bp validate ~/.xrcopilotlab/blueprints/<TAG>/<file>.yml --graph
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

Poi verificare con `xrcopilotlab-bp secrets check ~/.xrcopilotlab/blueprints/<TAG>/<file>.yml --env <ambiente>`.
`--env` non è un dettaglio: senza, la verifica può guardare un ambiente diverso da quello in cui il
piano andrà a cercare la chiave, e si finisce a rifare due volte la stessa cosa.

Se `secrets set` risponde che non sa in quale Key Vault scrivere, **non indovinare il vault dal
nome**: si prende da quelli a cui puntano i riferimenti già presenti nell'App Configuration di
quell'ambiente. Vault dal nome plausibile ma inutilizzati esistono davvero, e scriverci un segreto
non dà nessun errore — semplicemente nessuno lo legge.

## 5. Piano, e approvazione umana

```bash
xrcopilotlab-bp push ~/.xrcopilotlab/blueprints/<TAG>/<file>.yml
xrcopilotlab-bp plan --tag <TAG> --company <guid>
```

Dentro il repository, senza `--env`, si lavora sull'ambiente del `local.settings.json`. Per
sceglierlo si aggiunge `--env staging` o `--env prod`: gli ambienti sono dentro il
binario, non c'è nulla da configurare.

Il **tenant** non si scrive: senza `--company` la CLI ne elenca i nomi e chiede quale. Eseguita da
un assistente l'input non è un terminale, quindi stampa l'elenco e si ferma con **6** — vuol dire
riportare i nomi all'utente e chiedere quale, non indovinarne uno.

Su **staging** fa eccezione: l'ambiente di prova è uno solo, quindi senza `--company` la CLI ci
lavora e lo annuncia. Non c'è niente da chiedere all'utente, e non c'è un 6 da aspettarsi.

In **produzione** si lavora sui tenant a cui l'utente **appartiene** — gli stessi che gli mostra
l'interfaccia dopo il login. Un tenant fuori da quell'elenco viene rifiutato anche se il GUID è
scritto a mano (**3**), e lo è pure quando l'identità non si riesce a stabilire: non sapere chi sei
non è una ragione per mostrarti di più. Se qualcuno dovrebbe esserci e non c'è, la risposta è farlo
censire su quel tenant nel prodotto — non un ruolo Azure, e non un tentativo.

**Mostrare il piano all'utente e fermarsi.** Non «riassumere che è tutto a posto»: riportare cosa
verrà creato e il grafo del processo, perché è su quello che la persona deve decidere.

Poi **chiedere esplicitamente l'approvazione**, dicendo su quale tenant e quante entità. Finché non
arriva un sì, il lavoro è finito qui.

Cosa **non** vale come approvazione:

- un sì dato prima, per un piano diverso o per una versione precedente del manifest;
- un «vai» generico detto all'inizio della conversazione, prima che il piano esistesse;
- il fatto che il piano non abbia errori. Un piano valido è un piano che *si può* applicare, non uno
  che *si deve* applicare.

Se il blueprint è già applicato su quel tenant, il piano **non** riporta collisioni sulle sue entità:
è un aggiornamento — vedi [§ 6-ter](#6-ter-una-versione-nuova-su-un-blueprint-già-applicato).

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

**Se la sezione «Prove dei tool MCP» riporta un avviso**, l'apply è riuscito ma quel server non
raggiunge la sua fonte (credenziale sbagliata, permesso mancante, casella non pronta). I task
schedulati sugli agenti di quel server partono comunque, e girano a vuoto — o peggio, mandano un
esito d'errore a un webhook che apre un caso a ogni giro. Dirlo subito all'utente, con il messaggio
dell'errore **senza ripetere valori che sembrano credenziali**, e proporre la pausa:

```bash
xrcopilotlab-bp schedule list                --tag <TAG> --company <guid>
xrcopilotlab-bp schedule pause <chiave-task> --tag <TAG> --company <guid>
```

Un task schedulato ha una **quota giornaliera** (100 esecuzioni al giorno UTC di default): oltre,
la piattaforma salta i giri senza errore. Se il cron è più fitto — ogni minuto sono 1440 giri — il
validatore lo dice (`BP029`) e la risposta è `executionPolicy.maxDailyExecutions` sul task, non un
cron più largo se la latenza conta. Si riprende con `schedule resume` quando la fonte risponde. Per capire **perché** la fonte non
risponde, `xrcopilotlab-bp mcp test <server> --tag <TAG>` mostra la risposta grezza del sistema di
terze parti (l'errore di Entra, il 403 di Graph) senza passare dal modello; `mcp check` dice se
l'agente carica davvero il server. Dopo aver corretto un segreto con `secrets set`, la connessione
va riallineata con `connections refresh --tag <TAG>`: porta i valori risolti all'apply, e non cambia
da sola. Un segreto scambiato con un altro si recupera dalle **versioni precedenti** in Key Vault,
senza ruotarlo.

Due comandi dicono cosa sta succedendo davvero dopo l'apply, senza aprire l'interfaccia:
`xrcopilotlab-bp schedule logs <chiave-task> --tag <TAG>` (quota giornaliera del task, ultime
esecuzioni con esito, avviso se lo scheduler avanza mentre le esecuzioni no) e
`xrcopilotlab-bp instances list --tag <TAG> --running` / `instances show <id>` (le istanze dei
processi del blueprint: dove sta il token, eventi, compiti, dati del caso). Un token su un compito
umano — `verifica:waiting`, `assegna:waiting` — vuol dire che manca il passo di una persona, non che
qualcosa è rotto. Un blueprint applicato si collauda con la skill `xrcopilotlab-blueprint-test`.
Per spiegarlo al cliente — il flusso, dove lavora l'AI, domande di esempio, come è fatto il suo
ambiente — la guida non tecnica, a story slides, con la sua pagina web e il deck per i sales, la
scrive la skill `xrcopilotlab-blueprint-guide`.

## 6-ter. Una versione nuova su un blueprint già applicato

Quando sul tenant c'è già un run **completato** dello stesso blueprint, `plan` e `apply` lo
riconoscono da soli (#1126): il piano si apre con «Aggiornamento della vN applicata», elenca solo ciò
che si crea e ciò che si aggiorna, e dice quante entità restano come sono. Non serve nessuna opzione,
e non serve niente fuori dalla CLI.

Cosa riportare all'utente prima di chiedere il sì, perché è su questo che decide:

- **che cosa si aggiorna e in che cosa** — «AgenteResume: istruzioni», «orchestratore: 9 modifiche»
  con le righe che il piano elenca. Un aggiornamento cambia una chat in uso: va detto che cosa cambia;
- **che non si cancella niente**: ciò che la versione nuova non dichiara più è un avviso `BP068` e
  resta sul tenant;
- se il piano si ferma con **`BP067`**, la modifica non si può fare sul posto (un'entità tolta a
  mano, file nuovi su un profilo già indicizzato): riportare il messaggio, non cercare strade intorno.

Se il piano dice che **il tenant è già come la versione lo vuole**, non c'è niente da approvare e il
comando esce `0`.

**Mai aggiornare a mano** — né dall'API, né con uno script, né avviando l'API in locale: chi usa questa
skill non è necessariamente uno sviluppatore, e un aggiornamento fatto fuori dalla CLI non lascia
traccia nel run. L'API locale si usa solo se l'utente lo chiede espressamente. Se la CLI installata
non riconosce l'aggiornamento (il piano si ferma con `BP060` su entità del blueprint), è una versione
precedente a #1126: proporre `/plugin update blueprints@hevolus`.

Dopo l'esecuzione le entità passano al run nuovo: è quello da collaudare, e quello che `rollback`
smonterebbe. Il run di partenza resta come storico (`Superseded`).

## 6-bis. Portare una versione in un altro ambiente o su un altro tenant

Un manifest collaudato **non si riscrive** per applicarlo altrove: si copia. Ogni ambiente ha il
proprio archivio, e dentro l'archivio ogni tenant il suo, quindi una voce ha quattro coordinate —
ambiente, tenant, blueprint, versione.

```bash
xrcopilotlab-bp promote --tag <TAG> --version <n> \
    --from-env staging --from-company <guid-origine> \
    --to-env   prod    --to-company   <guid-destinazione>
```

Quattro cose da dire all'utente, perché sono le quattro che sorprendono:

1. **Non crea niente sul tenant.** La copia è solo in archivio: dopo servono ancora `plan` e
   `apply`, con la loro approvazione. Riferire il comando di `plan` che la CLI stampa alla fine.
2. **Ripeterlo non fa danni.** Se alla destinazione c'è già la stessa versione con lo stesso
   contenuto, non scrive niente e lo dice.
3. **Se si ferma con «contenuto diverso»**, non aggiungere `--overwrite` per sbloccare: vuol dire
   che qualcuno ha modificato il manifest per l'ambiente di destinazione, e la strada giusta è
   quasi sempre alzare `version:`.
4. **I segreti non viaggiano** — nel manifest ci sono solo i nomi. Quelli che la destinazione non
   ha, `promote` li elenca: vanno impostati con `secrets set --env <destinazione>` prima del
   `plan`.

Per rileggere un manifest archiviato — anche senza il file, anche da un altro computer — c'è
`pull --tag <TAG> [--out <file>] [--with-files]`. Due `pull` e un `diff` dicono senza
interpretazioni se due ambienti stanno eseguendo davvero lo stesso blueprint.

In **produzione** vale la solita protezione: un tenant che l'API non elenca viene rifiutato con
**3** anche come destinazione di una copia. L'archivio non è una porta di servizio.

## 6-quater. Dal tenant al manifest: leggere ciò che esiste

Quando l'ambiente c'è già — costruito a mano dall'interfaccia, o applicato da un blueprint — e serve il
suo manifest: per riusarlo su un altro cliente, per partire da un esempio che funziona invece che da
una pagina bianca, per vedere quanto del tenant un manifest sa dire (#1173).

1. **Chiedere l'ambito, prima di leggere**: un orchestratore, un topic, ciò che ha creato un blueprint
   (`blueprint <TAG>`), o il tenant intero (solo se ha un topic). E il tag del manifest.
2. **Chiedere dei dati personali**: il manifest va a un altro cliente (segnaposto, il default) o resta
   allo stesso (`--keep-people`)?
3. **Leggere**, solo letture:
   ```bash
   xrcopilotlab-bp export --scope topic "Agenda di Studio" --tag STUDIOPOLIS --env staging --company <guid> --out export-studiopolis
   ```
4. **Spiegare il rapporto** (`export-report.md`) prima del manifest: i segreti da impostare (per nome,
   `secrets.txt`), le chiavi che si rigenerano e chi fuori dalla piattaforma le usa, i requisiti della
   destinazione, ciò che il manifest non sa dire, le dipendenze entrate da sé. È lì che si capisce
   se il manifest è pronto o se va completato.
5. **Poi il percorso di sempre**: completare ciò che il rapporto chiede, `validate`, `secrets set`,
   `push`, piano, sì, apply.

Due cose da dire sempre: i nomi escono **senza** `BP-<TAG>-` e l'apply li rimette — un agente fatto a
mano diventa `BP-<TAG>-<nome>`; e riapplicare l'export sullo stesso tenant da cui viene **crea delle
copie**, non aggiorna le entità fatte a mano (il collegamento a entità esistenti non c'è ancora). Per
un blueprint già applicato l'aggiornamento sul posto resta la strada (§6-ter).

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
