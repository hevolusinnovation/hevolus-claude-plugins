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

| Plugin | Dove gira | Skill | Cosa fa | Manuale |
|---|---|---|---|---|
| **blueprints** | Claude Code | `xrcopilotlab-blueprint` | Configura un ambiente XRCopilotLab da un file: topic, profili di knowledge, ruoli, agenti (con modello e documenti), agent task, processi BPM. Propone come dividere i documenti fra i profili, mostra il piano e chiede conferma prima di creare | [manuale.md](plugins/blueprints/docs/manuale.md) |
| **blueprints** | Claude Code | `xrcopilotlab-blueprint-test` | Collauda un blueprint **applicato**: scrive le domande per agenti, orchestratori e processi, le esegue sul tenant raccogliendo risposte e log, giudica, attribuisce ogni fallimento a un componente, e ne ricava le guide per il cliente | [manuale.md](plugins/blueprints/docs/manuale.md) |
| **assessment** | Claude Desktop | `xrcopilotlab-assessment` | Traduce una proposta di progetto nella soluzione XRCopilotLab: scenari, agenti orchestrati o processo BPM, fattibilità delle fonti dati, dossier tecnico in Markdown e Word | [manuale.md](plugins/assessment/docs/manuale.md) |

I due plugin sono i tempi dello stesso lavoro, su due strumenti diversi: l'assessment si fa in
chat su Claude Desktop, dove la proposta del cliente si carica e si legge; il provisioning e il
collaudo si fanno da Claude Code, dove la CLI può parlare con il tenant.

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

Cosa fa ciascuna skill, con che frase si attiva e che cosa produce: [§ Le skill](#le-skill).

Chi usa un plugin **non ha bisogno di clonare i repository di prodotto**, né di essere uno
sviluppatore: gli strumenti che servono arrivano da soli al primo utilizzo. L'**accesso**, invece,
no — e vale la pena leggere il paragrafo qui sotto prima di provare, perché è il punto contro cui si
sbatte per primo.

## ⚠️ Prima di cominciare: l'accesso

Riguarda il plugin **blueprints**. L'assessment gira su Claude Desktop e non tocca Azure: lì non
serve niente di tutto questo.

**L'account con cui usi Claude non c'entra niente.** Personale o aziendale, non cambia nulla: la CLI
non parla con Claude, parla con **Azure**.

Quello che serve è il tuo **account `hevolus.it`** — lo stesso della posta aziendale. Le risorse
(App Configuration, Key Vault, Cosmos, storage) vivono nella sottoscrizione **Azure AI** di Hevolus,
quindi un account Microsoft personale non può funzionare: non è un permesso che manca, è che quelle
risorse non sono sue.

#### E non è l'account con cui entri in XRCopilotLab

È la confusione più facile, e chi ci cade ha le sue ragioni: su XRCopilotLab l'accesso è già suo.
Ma il prodotto si usa con un'identità **Azure AD B2C** — la pagina è `xrcopilotlab.b2clogin.com`,
con email e password registrate sul momento oppure **Login with Google**. È una directory
**diversa** da quella aziendale, e le due non si incontrano mai.

| | Chi **usa** XRCopilotLab | Chi **esegue** il plugin |
|---|---|---|
| Directory | Azure AD B2C (`xrcopilotlab.onmicrosoft.com`) | Entra ID aziendale (`hevolus.it`) |
| Identità | email registrata, o account Google | account `hevolus.it` |
| Serve a | chat, UI, processi, work item | leggere App Configuration e Key Vault, comandare l'API |
| Conta qui? | **no** | sì, è l'unica che conta |

Avere un account XRCopilotLab, anche da amministratore del tenant, **non dà alcun accesso al
plugin**. E i ruoli Azure, per conto loro, non ti fanno entrare nel prodotto.

> **A chi è destinato.** Il plugin blueprints è uno strumento dell'**AI Team di Hevolus**, che
> configura XRCopilotLab a valle di un assessment. Non è pensato per il cliente: lui nel prodotto
> entra, ma la CLI parla con la sottoscrizione Azure di Hevolus, dove non ha — e non deve avere —
> alcun ruolo.

| Coordinate | |
|---|---|
| Tenant | `hevolus.it` — `45bb21a6-d8f8-4218-b74d-f4a5d5c2138e` |
| Sottoscrizione | **Azure AI** — `73961d27-722e-4282-be21-bfb36e97c0f0` |

### I ruoli che ti servono

Sono ruoli **del piano dati**, assegnati sull'App Configuration e sul Key Vault dell'ambiente su cui
lavori (o ereditati dal resource group). Non servono ruoli su Cosmos, sullo storage o sull'API:
tutto passa da riferimenti a Key Vault dentro App Configuration.

| Cosa vuoi fare | Ruoli necessari |
|---|---|
| `validate` — controllare un manifest | **nessuno**, non tocca la rete |
| `push`, `plan`, `apply`, `status`, `rollback`, `delete` | **App Configuration Data Reader** · **Key Vault Secrets User** |
| in più, `secrets set` — impostare un segreto | **App Configuration Data Owner** · **Key Vault Secrets Officer** |

Le risorse su cui vanno assegnati, per ambiente:

| Ambiente | App Configuration | Key Vault |
|---|---|---|
| `staging` | `appcs-xrcopilotlab-staging-01` | `kv-xrcopilotlab-stg-01` |
| `preview` | `appcs-xrcopilotlab-preview-italynorth` | `kv-xrcopilotlab-preview` |
| `prod` | `appcs-xrcopilotlab-prod-italynorth` | *(da verificare con chi amministra)* |

> Nella sottoscrizione esiste anche un `kv-xrcopilotlab-staging`, che **non** è quello usato da
> staging. Se ti viene chiesto su quale vault assegnare un ruolo, è `kv-xrcopilotlab-stg-01`.

Se non li hai, non è qualcosa che puoi risolvere da solo: scrivi a chi amministra la sottoscrizione
riportando **il nome della risorsa** e **il ruolo** che il messaggio d'errore nomina.

### Chi abilita chi, in pratica

**L'utente da abilitare sei tu**, con il tuo `nome.cognome@hevolus.it` — non un account condiviso,
non un service principal. Se le persone che useranno il plugin sono più di due o tre, conviene
assegnare i ruoli a un **gruppo di sicurezza** e gestire lì le entrate e le uscite: un posto solo da
guardare quando qualcuno cambia squadra.

**Chi può assegnarli** è un **Owner** o uno **User Access Administrator** sul resource group (o
sulla sottoscrizione). Chi sia oggi si chiede ad Azure invece di tenerne un elenco qui, che
invecchierebbe:

```bash
az role assignment list \
  --scope /subscriptions/73961d27-722e-4282-be21-bfb36e97c0f0/resourceGroups/rg-xrcopilotlab-staging-itn-01 \
  --include-inherited \
  --query "[?roleDefinitionName=='Owner' || roleDefinitionName=='User Access Administrator'].principalName" -o tsv
```

**I comandi da girare a chi amministra** — per staging, e assegnati sulla **singola risorsa**, non
sul resource group: così il permesso non si estende in silenzio ad altro che vive lì accanto.

```bash
UTENTE=nome.cognome@hevolus.it
SUB=/subscriptions/73961d27-722e-4282-be21-bfb36e97c0f0/resourceGroups/rg-xrcopilotlab-staging-itn-01
APPCS=$SUB/providers/Microsoft.AppConfiguration/configurationStores/appcs-xrcopilotlab-staging-01
KV=$SUB/providers/Microsoft.KeyVault/vaults/kv-xrcopilotlab-stg-01

# per USARE il plugin
az role assignment create --assignee "$UTENTE" --role "App Configuration Data Reader" --scope "$APPCS"
az role assignment create --assignee "$UTENTE" --role "Key Vault Secrets User"        --scope "$KV"

# SOLO per chi deve anche impostare segreti (secrets set)
az role assignment create --assignee "$UTENTE" --role "App Configuration Data Owner"  --scope "$APPCS"
az role assignment create --assignee "$UTENTE" --role "Key Vault Secrets Officer"     --scope "$KV"
```

Le due righe in fondo servono a poche persone: chi scrive i segreti di una connessione. Darle a
tutti per comodità significa dare a tutti la scrittura sulla configurazione di un ambiente.

### L'accesso ad Azure: una volta per macchina

```bash
az login --tenant hevolus.it
```

E, se hai più sottoscrizioni:

```bash
az account set --subscription "Azure AI"
```

**Azure CLI non è obbligatoria.** Se non ce l'hai, basta lanciare **una volta** un qualsiasi comando
del plugin dal **tuo terminale**, per esempio `xrcopilotlab-bp status`: si apre una pagina del
browser per l'accesso, ed è normale. Il token resta in cache: succede una volta sola su quella
macchina, non a ogni comando.

**Questo primo accesso devi farlo tu, e non può farlo Claude.** Non è una scelta di prodotto: senza
un terminale vero il ramo che apre il browser è disattivato di proposito, perché altrimenti il
comando resterebbe appeso ad aspettare una pagina che nessuno vede. Fatto l'accesso una volta, tutti
i comandi successivi — compresi quelli che lancia Claude per te — usano il token in cache e
funzionano.

Se vedi un errore di autenticazione, quindi, la risposta non è riprovare: è fare l'accesso nel tuo
terminale.

### E il tuo ruolo dentro XRCopilotLab? Non c'entra — ed è bene saperlo

Verrebbe da pensare che, trattandosi di operazioni sul backend di XRCopilotLab, contino i permessi
che hai **dentro** il prodotto. Non è così, e la ragione è precisa: la CLI si presenta all'API con
una **chiave** — la function key della rotta interna, o la subscription key di APIM — e **mai con la
tua identità**. Nessun token utente, nessun accesso Entra verso l'API.

Tre conseguenze che conviene avere chiare:

1. **Il tuo ruolo su XRCopilotLab non ti abilita e non ti blocca.** Essere amministratore del
   prodotto non ti serve; non esserlo non ti ferma.
2. **Il vero cancello è Azure.** L'App Configuration di un ambiente contiene
   `InternalApi:FunctionKey`, cioè la chiave con cui si comanda l'API di XRCopilotLab su quel
   tenant. Quindi **App Configuration Data Reader ha un nome che suona innocuo e non lo è**: chi
   legge la configurazione può agire sul backend del prodotto. Va concesso a chi affideresti
   l'amministrazione di XRCopilotLab, non come un banale permesso di sola lettura.
3. **La traccia nei run è un nome, non un'identità verificata.** Il campo `CreatedBy` e la firma
   dell'approvazione riportano il tuo utente del sistema operativo. Serve a ricostruire chi ha fatto
   cosa fra colleghi, non a dimostrarlo: per sapere *chi poteva* farlo, si guarda chi ha i ruoli
   Azure sopra.

Dove invece gli utenti del prodotto contano davvero è **dentro il manifest**: i membri dei ruoli
aziendali, gli owner di un processo e i destinatari di un passo di approvazione devono già esistere
sul tenant. Il blueprint aggiunge le persone ai ruoli, non le crea — e se un indirizzo non esiste il
piano si ferma prima di toccare qualsiasi cosa.

Quegli indirizzi sono **utenti B2C del prodotto**, non identità Azure. La differenza si vede subito
con due esempi:

- `mario@gmail.com`, registrato su XRCopilotLab con Google → membro di ruolo **valido**;
- un collega con un ottimo account `hevolus.it` che nel prodotto non è mai entrato → **non valido**,
  e il piano si ferma.

Quindi, prima di scrivere un indirizzo in un manifest, la domanda non è «ha un account Hevolus?» ma
«**è già un utente di quel tenant?**». Quando la stessa persona ha entrambe le cose — identità Azure
per lanciare il comando e utente del prodotto per ricevere i compiti — la mail è la stessa stringa in
due panni diversi, e sembra che l'account sia uno solo. Non lo è.

## Le skill

Un plugin è un contenitore: quello che fa davvero il lavoro sono le **skill**, cioè le istruzioni
che Claude carica quando la richiesta le riguarda. Il catalogo ne porta tre, e conoscerle per nome
serve a due cose — sapere **come chiedere** perché si attivino, e sapere **cosa non chiedere**
perché non lo fanno.

Chi sviluppa su XRCopilotLab ne ha altre, che non passano dal catalogo perché vivono nel clone del
repository di prodotto: [§ Per chi sviluppa](#per-chi-sviluppa-le-skill-che-restano-nel-repository-di-prodotto).

| Skill | Plugin | Si attiva quando | Produce |
|---|---|---|---|
| [`xrcopilotlab-blueprint`](#xrcopilotlab-blueprint--scrivere-e-applicare-un-blueprint) | blueprints | «crea un blueprint», «configura il cliente da zero», «applica il manifest», o si nomina `xrcopilotlab-bp` | il manifest `.yml`, il piano, il tenant configurato |
| [`xrcopilotlab-blueprint-test`](#xrcopilotlab-blueprint-test--collaudare-un-blueprint-applicato) | blueprints | «collauda il blueprint», «scrivi le domande di test», «vedi se funziona», «prepara le domande per il cliente», o si nomina `test run` | la suite `.tests.yml`, il report, il giudizio, le bozze di issue, le guide per il cliente |
| [`xrcopilotlab-assessment`](#xrcopilotlab-assessment--dalla-proposta-al-dossier) | assessment (Claude Desktop) | si carica una proposta e si chiede di «valutarla», «fare l'assessment», «tradurla in soluzione» | il dossier tecnico `.md` e `.docx`, con il capitolo per il provisioning |

Le tre skill sono i tre tempi dello stesso lavoro: l'assessment dice **cosa** costruire, il
blueprint lo **costruisce**, il collaudo dice **se funziona** e a chi tocca ciò che non va.

```
xrcopilotlab-assessment        xrcopilotlab-blueprint          xrcopilotlab-blueprint-test
  proposta → dossier      →      dossier → manifest → tenant  →   tenant → suite → report → giudizio
  (Claude Desktop)               (Claude Code)                    (Claude Code)
                                                                        ↓
                                                              issue (dopo un sì) · guide per il cliente
```

Di solito non serve nominarle: si attivano dalla richiesta. Quando due potrebbero valere — «testa il
blueprint» mentre lo si sta ancora scrivendo — si nomina quella giusta («usa la skill
`xrcopilotlab-blueprint-test`»). Chieste **senza dire cosa fare**, le due del plugin `blueprints` non
partono a fare domande: si orientano — a cosa servono, cosa serve per usarle, quali blueprint e quali
suite esistono già — e si fermano. È la strada giusta la prima volta.

### `xrcopilotlab-blueprint` — scrivere e applicare un blueprint

Porta da «vorrei un ambiente così» a un blueprint applicato su un tenant. Il lavoro è in due
metà, **scrivere il manifest** e **applicarlo**, e la seconda passa sempre dalla CLI
`xrcopilotlab-bp`, mai da chiamate dirette all'API, fermandosi a chiedere il permesso prima di
toccare il tenant.

**Da dove parte.** Da una di tre cose:

- **un dossier di assessment** — il documento prodotto su Claude Desktop dall'altra skill. Il
  capitolo «Elementi per il provisioning» contiene già tag, topic, ruoli con i membri, agenti con il
  system message, agent task e il disegno del processo: la skill lo traduce e chiede solo ciò che
  manca davvero;
- **un'intervista da zero**, una domanda per volta, seguendo una traccia che chiede prima il
  processo e poi le persone, e non fa ripetere ciò che si può dedurre;
- **un manifest già scritto**, da rivedere o da applicare.

**Come si chiede.** Frasi che la attivano, con quello che succede dopo:

| Cosa scrivi | Cosa fa la skill |
|---|---|
| «Crea un blueprint per lo studio legale Polis: un assistente che legge gli avvisi di udienza e un processo in cui il referente conferma la data» | Intervista breve, poi scrive `blueprints/studiopolis-agenda.yml`, lo valida, mostra il grafo del processo |
| «Ecco il dossier dell'assessment di Confindustria Como, prepara il blueprint» | Legge il capitolo per il provisioning, traduce, chiede solo i membri dei ruoli e i nomi dei segreti mancanti |
| «Ho questi documenti in `~/Documenti/como`, a quali agenti li collego?» | Lancia `xrcopilotlab-bp suggest` sulla cartella, propone un profilo di knowledge per agente e una fascia di modello, e spiega quali file il nome non basta a distinguere |
| «Applica `blueprints/como-conoscenza-associati.yml` su staging» | `push`, poi `plan`: stampa il piano — quante entità, quali nomi, il grafo — e **si ferma ad aspettare il sì** |
| «Sì, vai» (detto **dopo** aver visto il piano) | `apply --yes`, poi riporta entità create, `runId`, e la chiave del webhook se ce n'è una: compare una sola volta |
| «Cancella il blueprint TEST» | Riporta cosa sparirebbe e chiede un sì che nomini quel tag: senza `--confirm TEST` la CLI non procede |
| «Cosa sai fare con i blueprint?» · la skill chiesta senza altro | Orientamento: a cosa serve, cosa serve per usarlo, ambienti, blueprint esistenti. Nessuna intervista |

**Il giro dei comandi**, che la skill lancia per te nell'ordine giusto — e che puoi lanciare anche
a mano, perché `bin/` è nel PATH quando il plugin è attivo:

```bash
xrcopilotlab-bp validate blueprints/<file>.yml --graph            # offline: rilievi + grafo del processo
xrcopilotlab-bp suggest  blueprints/<file>.yml --files <cartella>  # come dividere i documenti fra i profili
xrcopilotlab-bp secrets set --env staging --tag <TAG> <nome>        # nel TUO terminale, mai con il prefisso !
xrcopilotlab-bp push     blueprints/<file>.yml --env staging        # pubblica la versione del manifest
xrcopilotlab-bp plan     --tag <TAG> --env staging --company <guid> # preflight + piano: nomi occupati, segreti, utenti
xrcopilotlab-bp apply    --tag <TAG> --env staging --company <guid> --yes   # solo dopo il sì sul piano
xrcopilotlab-bp status   --env staging --company <guid>             # cosa c'è sul tenant, un rigo per blueprint
xrcopilotlab-bp rollback --run <runId>                              # smonta ciò che l'inventario del run elenca
```

**Che aspetto ha un manifest.** Un estratto dell'esempio minimo che viaggia con la skill
(`references/esempio-minimo.yml`): un topic, un ruolo, un agente, un agent task e un processo con
un gateway. I nomi si scrivono **senza** il prefisso `BP-<TAG>-`: lo aggiunge il planner.

```yaml
blueprint: test-agenda
version: 1
tag: TEST
description: Presa in carico di un avviso di udienza arrivato via email

tenant:
  companyId: 00000000-0000-0000-0000-000000000000
  topic: Agenda di Studio

businessRoles:
  - key: referente
    name: Referente agenda
    members: [test@hevolus.it]          # utenti DEL TENANT XRCopilotLab, non identità Azure

agents:
  - key: agenda
    name: Agenda
    language: it
    systemMessage: |
      Ricevi il testo di un avviso di udienza e restituisci data e ora, sede, numero di ruolo, parti.
      Se un dato non è presente scrivi «non indicato»: non dedurlo e non inventarlo.
    skills: []

agentTasks:
  - key: estrai-udienza
    name: Estrazione udienza
    agent: agenda
    prompt: |
      Estrai gli estremi dell'udienza dal seguente avviso:
      {{testoAvviso}}

processes:
  - key: presa-in-carico
    publish: true
    starterRoles: [referente]
    spec:
      activities:
        - id: start
          type: Start
          name: Avviso ricevuto
          form:
            - { key: testoAvviso, label: Testo dell'avviso, type: textarea, required: true }

        - id: estrai
          type: Task
          name: Estrai gli estremi
          performer: Automated                 # eseguito dall'agent task
          agentTaskName: Estrazione udienza    # nella spec i riferimenti sono NOMI, non chiavi
          outputVariable: proposta

        - id: conferma
          type: Task
          name: Conferma del referente
          performer: HumanOnly                 # compito in lista di lavoro, sulla corsia del ruolo
          roleName: Referente agenda
          form:
            - { key: proposta, label: Proposta dell'assistente, type: textarea, context: true }
            - { key: confermato, label: Estremi confermati, type: bool }

        - id: registra
          type: Task
          name: Registra in calendario
          performer: HumanOnly
          roleName: Referente agenda

        - id: fine
          type: End
          name: Presa in carico conclusa

      gateways:
        - id: esito
          type: Exclusive
          name: Estremi confermati

      flows:
        - { from: start, to: estrai }
        - { from: estrai, to: conferma }
        - { from: conferma, to: esito }
        - { from: esito, to: registra, label: confermati, condition: { var: confermato, op: eq, value: true } }
        - { from: esito, to: estrai, label: da rifare }    # il ramo senza condizione: obbligatorio, uno solo
        - { from: registra, to: fine }
```

**Le regole che la skill applica al posto tuo** — e che spiegano perché a volte si ferma:

- **nessuna creazione senza un sì sul piano**: `--yes` è la forma scritta dell'approvazione appena
  data, non una scorciatoia. Senza terminale interattivo la CLI esce con codice `6` e la skill
  chiede, non aggiunge il flag;
- **se un nome esiste già il piano si ferma** (`BP060`): non esiste aggiornamento in place. La skill
  riporta le tre strade — rinominare, cambiare tag, rimuovere l'entità — senza sceglierne una;
- **i segreti si citano per nome** (`Blueprints:Secrets:<TAG>:<nome>`) e si impostano con
  `secrets set` nel **tuo** terminale: il valore non passa mai per la conversazione;
- **un profilo di knowledge per agente**: il topic è il deposito dei file, il profilo è ciò che li
  indicizza e si collega all'agente. Un agente su un topic pieno di file ma senza profilo non vede
  niente;
- **il modello si dichiara**: senza `model:` l'agente nasce sul default (`BP015` avvisa), un nome
  fuori catalogo ferma il piano (`BP065`);
- **in produzione solo il tenant di Hevolus**: l'API rifiuta gli altri anche con il GUID scritto a
  mano (codice `3`). L'ambiente di un cliente si configura dall'interfaccia.

**Cosa non fa.** Non modifica un singolo agente o processo già esistente (per quello si va dalla
UI); non crea l'ingresso *push* della posta (`ingress.kind: logicapp`, che vuole una Logic App e
un'autorizzazione umana); non eredita fra blueprint (`extends`). Tutto il resto — connessioni,
server MCP via MCP Builder, orchestratori, agent task schedulati — lo crea davvero.

Riferimenti che viaggiano con la skill: le regole del grafo BPM, la traccia dell'intervista, i tre
livelli della knowledge, la scelta del modello, il ciclo per una fonte HTTP via MCP Builder (con
Microsoft 365 come caso guidato), il riferimento del manifest e dei comandi, lo schema JSON e due
esempi commentati. Manuale passo passo: [`plugins/blueprints/docs/manuale.md`](plugins/blueprints/docs/manuale.md).

### `xrcopilotlab-blueprint-test` — collaudare un blueprint applicato

Porta un blueprint applicato da «esiste sul tenant» a «sappiamo come risponde, e sappiamo di chi è
ogni difetto», e da lì a «il cliente sa cosa provare e cosa aspettarsi». Cinque mosse: **scrivere
le domande, eseguirle, giudicare, segnalare, scrivere le guide per il cliente**.

La divisione del lavoro è netta, ed è ciò che rende il collaudo ripetibile:

| Chi | Fa | Non fa |
|---|---|---|
| **La CLI** (`xrcopilotlab-bp test`) | esegue i casi, raccoglie **tutte** le evidenze (risposte, passi della pipeline, file di knowledge consultati, skill selezionate, eventi e compiti dell'istanza), verifica le attese meccaniche, propone un sospetto per fallimento | non giudica se una risposta è *buona* |
| **La skill** | scrive domande e risposte attese, giudica le risposte in prosa, conferma o smentisce il sospetto leggendo il codice, scrive segnalazioni e guide | non chiama l'API direttamente, non apre issue senza un sì |
| **Tu** | decidi su quale tenant si esegue, approvi le segnalazioni | — |

**Come si chiede.** Frasi che la attivano, con quello che succede dopo:

| Cosa scrivi | Cosa fa la skill |
|---|---|
| «Collauda il blueprint STUDIOPOLIS su staging» | Cerca `blueprints/tests/studiopolis-*.tests.yml`; se c'è la valida e **ti mostra le domande** prima di eseguire; se non c'è genera lo scheletro e le scrive leggendo il manifest |
| «Scrivi le domande di test per gli agenti di FINLOGIC» | `test init` dal manifest, poi compila i `TODO` — un caso positivo e uno negativo per agente, uno per orchestratore, uno per processo — partendo dal system message di ciascun agente |
| «Ecco le domande della demo, traducile in una suite» (con un file `demo-domande-*.md`) | Traduce campo per campo: la domanda **identica** in `message`, l'atteso in `expect.answer`, i numeri con tolleranza in `expect.numbers`, le «risposte sbagliate da riconoscere» in `expect.wrongAnswers` |
| «Esegui solo i casi dell'agente agenda» | `test run … --only agenda`: un valore combacia con la chiave, con un tag **o con il target** del caso |
| «Cosa è andato male, e di chi è?» | Legge il report, dà un verdetto **pass / parziale / fail** per ogni caso, fa il triage per componente e scrive `giudizio.md` |
| «Apri le issue» (**dopo** aver visto le bozze) | Le apre in `xrcopilotlab-webapp-dotnet` con la label del componente, una per difetto confermato, e riporta i numeri nel giudizio |
| «Prepara le domande di prova per il cliente» · «Scrivi la guida del processo per il cliente» | Scrive `demo-domande-<scenario>.md` e `guida-<scenario>.md` nella cartella del cliente dell'assessment, e pubblica la guida anche come pagina web |
| «Come si collauda un blueprint?» · la skill chiesta senza altro | Orientamento: a cosa serve, cosa serve, quali suite esistono, quali blueprint hanno un run. Poi la domanda: quale blueprint, su quale ambiente |

**I tre comandi** della CLI dietro la skill:

```bash
xrcopilotlab-bp test init     blueprints/<nome>.yml                       # scheletro della suite dal manifest, offline
xrcopilotlab-bp test validate blueprints/tests/<nome>.tests.yml           # verifica contro il manifest, offline
xrcopilotlab-bp test run      blueprints/tests/<nome>.tests.yml --env staging --company <guid> [--only k1,tag,entità]
```

| Comando | Rete | Exit |
|---|---|---|
| `test init` | no | `0` — non sovrascrive una suite esistente senza `--overwrite` |
| `test validate` | no | `0` valida · `2` rilievi `BT0xx` (entità inesistente, `TODO` non scritto, attese incompatibili…) |
| `test run` | sì | `0` tutti passati · `7` almeno un caso non passato · `2` suite non valida · `3` nessun run del tag sul tenant |

Il `7` **non è un errore della CLI**: è l'esito del collaudo.

**Che aspetto ha una suite.** Un file `blueprints/tests/<nome>.tests.yml` accanto al manifest. Tre
casi presi dall'esempio che viaggia con la skill (`references/esempio-suite-agenda.tests.yml`): un
agente che deve estrarre, uno che **non** deve fare una cosa, e un processo seguito fino al primo
compito umano.

```yaml
blueprint: studiopolis-agenda
tag: STUDIOPOLIS                       # da qui il run e le entità: gli id che il blueprint ha creato
version: 7
defaults:
  language: it
  timeoutSeconds: 180
  userId: collaudo@hevolus.it          # per conto di chi si parla: senza, i processi con ruoli di avvio escono 403

cases:
  - key: agenda-avviso-completo
    kind: agent
    target: agenda                     # chiave dell'agente nel manifest
    message: |
      TRIBUNALE ORDINARIO DI BARI — Sezione Seconda Civile
      R.G. n. 4127/2025 — Rossi Mario c/ Alfa S.r.l.
      Udienza fissata per il 14 ottobre 2026 alle ore 9:30, aula 3, Giudice dott.ssa Bianchi.
    expect:
      answer: >                        # in prosa: la CLI NON la verifica, la giudica la skill
        Sei voci, tutte valorizzate; nessun termine proposto.
      contains: ["14 ottobre 2026", "9:30", "4127/2025", "Bianchi"]
      notContains: ["termine per", "scadenza"]
      wrongAnswers:                    # risposte sbagliate già viste: se compaiono, fail con la diagnosi
        - pattern: "(?i)(ho|è stat[oa]) (registrat|creat|inserit)"
          means: L'agente di estrazione ha scritto in calendario, ma la registrazione è del referente.
          suspect: Manifest
      maxSeconds: 60
    tags: [agent, agenda]

  - key: agenda-non-calcola-termini
    kind: agent
    target: agenda
    message: |
      Udienza il 14 ottobre 2026, R.G. 4127/2025. Entro quando va depositata la memoria ex art. 183 c.p.c.?
    expect:
      answer: Riporta gli estremi e dichiara che non calcola termini processuali.
      notContains: ["giorni prima", "entro il"]
    tags: [agent, agenda, negative]

  - key: presa-in-carico-udienza-avvio
    kind: process
    target: presa-in-carico-udienza
    timeoutSeconds: 300
    caseData:                          # i campi del modulo di avvio, con i tipi YAML 1.2
      testoAvviso: "TRIBUNALE DI BARI — R.G. 4127/2025 — udienza 14 ottobre 2026 ore 9:30"
      materia: Civile
    expect:
      process:
        events: [InstanceStarted, ActivityCompleted, WorkItemCreated]   # sottosequenza ordinata
        completed: [estrai]            # il passo automatico è passato
        waitingAt: verifica            # c'è un compito aperto sul passo umano
        status: Running
        caseData: { proposta: "14 ottobre 2026" }
    tags: [process]
```

Per una domanda **numerica** — «quante righe hanno *Chiusura conti* nelle osservazioni» — l'atteso
si scrive per valore, non per stringa, così non dipende dalla formattazione:

```yaml
    expect:
      numbers:
        - { label: righe, value: 5995 }                           # legge 5.995, 5995, 5,995
        - { label: saldo, text: "−495.233,91", tolerance: 0.5 }   # il segno conta
      wrongAnswers:
        - { number: 5, means: "campione del recupero, non la popolazione", suspect: KnowledgeGraph }
```

**Cosa fa un caso, per tipo.** Un caso `agent` è una chat sincrona con i log accesi: un turno per
messaggio, conversazione nuova per ogni caso. Un caso `orchestrator` lancia l'esecuzione e interroga
lo stato fino a `completed`, `failed` o al timeout; se si ferma in attesa di un umano (`paused`)
esce in errore, e non è un fallimento dell'orchestratore. Un caso `process` **avvia un'istanza vera**
con i dati del modulo e la segue fino al compito umano atteso: l'istanza resta lì, chi ha il ruolo
la vedrà fra i suoi compiti — la skill lo dice prima di lanciare. La CLI **non completa mai un
compito umano**: sarebbe firmare un modulo al posto di una persona.

**Se la fonte esterna non è pronta** (una casella di posta che nessuno controlla), la logica
dell'agente si collauda con le **letture simulate**: il contenuto che restituirebbe lo strumento va
nel messaggio, nella forma vera (il corpo di una PEC, il JSON di `calendarView`), sotto il tag
`simulata`. I casi sulla fonte vera vanno in una suite a parte; quelli che **scrivono** fuori dal
tenant in una terza, lanciata solo con un sì esplicito.

**Il report** finisce in `blueprints/tests/reports/<tag>/<data>/` — `report.md` per leggere,
`report.json` per tutto il resto. La cartella è ignorata da git: contiene risposte e id del tenant.
Sopra al report la skill scrive **`giudizio.md`**: una tabella caso · esito CLI · verdetto · perché,
i casi da rivedere con atteso, risposta e diagnosi, e le attese da correggere nella suite. Un caso
può essere `Passed` per la CLI e **fail** per la skill (i numeri ci sono, ma ha attribuito un conto
«dove gli sembrava giusto»), o `Failed` per la CLI e **pass** (un `contains` che il modello ha
riformulato legittimamente — e allora si corregge l'attesa). I quattro criteri, in ordine:
esattezza dei numeri entro tolleranza e con il segno, nessuna invenzione, completezza, forma.

**Il triage: di chi è ogni fallimento.** Per ogni caso non passato il report porta un **sospetto**
— componente, fiducia (`High` per un errore che lo nomina, `Medium` per un comportamento letto nel
log, `Low` per un'inferenza da un'assenza), ragione — e la skill lo conferma o lo smentisce
**leggendo il codice** nei cloni fratelli prima di segnalare. La regola di fondo:

> Un fallimento si attribuisce a un componente solo quando c'è un'evidenza **di quel componente**.
> L'assenza di una cosa (nessun chunk, nessuna skill) è un indizio, non una prova.

| Componente | Dove si segnala | Dove guardare |
|---|---|---|
| `Manifest` — prompt, partizione della knowledge, attesa scritta male | nessuna issue: si corregge il file e si rilancia con `--only` | il manifest o la suite |
| `KnowledgeGraph` | issue in `xrcopilotlab-webapp-dotnet`, label `kgraph` | `xrcopilotlab-knowledge-graph` |
| `Skills` | issue in `xrcopilotlab-webapp-dotnet`, label `skills` | `xrcopilotlab-agent-framework` |
| `Orchestration`, `Process`, `WebApp` | issue in `xrcopilotlab-webapp-dotnet`, label `blueprints` | la webapp |
| `Environment` — rete, credenziali, tenant, lentezza | nessuna | — |
| non attribuibile | si dice così, con le ipotesi e cosa servirebbe per decidere | — |

Le issue si aprono **tutte nella webapp**, dove l'AI Team pianifica il lavoro: la label dice il
componente, il corpo cita la libreria come «dove guardare». Il titolo comincia con il componente
(«Knowledge graph: …», «BPM: …») e porta **anche l'inverso** — cosa dovrebbe succedere, scritto
come il caso della suite — così chi corregge ha già il test di regressione. Fallimenti diversi con
la stessa causa sono **una** segnalazione; un fallimento che si ripete su tutti i casi di un agente è
quasi sempre il manifest.

**Segnalare, solo dopo un sì.** Prima le **bozze**, in
`reports/<tag>/<data>/segnalazioni/<n>-<repo>-<slug>.md`, con ciò che serve a riprodurre senza il
tenant: domanda, risposta, passi del log che contano, file consultati, versioni delle librerie
(`KGraph.props`, `AgentFramework.props`), ambiente, id della conversazione o dell'istanza. Poi la
skill le mostra — titolo, repository, una riga ciascuna — e chiede **quali** aprire. Un sì vale per
le bozze mostrate, non per quelle che scriverà dopo.

**Le guide per il cliente.** Al termine di un collaudo — e sempre a quello finale — la skill
traduce suite e giudizio in due documenti che il cliente può leggere, nella cartella del cliente del
repository dell'assessment:

- **le domande di prova** (`demo-domande-<scenario>.md`): la tabella di stato in testa
  (✅ pronta · 🟡 da correggere · ⛔ da non mostrare come funzionante · ⏳ attende una fonte), le
  domande della suite **identiche** in blocchi di codice, l'atteso e le risposte sbagliate nella
  lingua del cliente («ha inventato un orario», non «suspect: KnowledgeGraph»), una scheda di
  valutazione, e una sezione interna per chi conduce con i difetti aperti;
- **la guida allo scenario** (`guida-<scenario>.md`), se c'è un processo o un'orchestrazione: i
  concetti, il diagramma dal grafo, i passi, le criticità del cliente → i meccanismi, gli agenti e
  cosa non fanno, collaudato e mancante — **e la sua pagina web**, che è ciò che si proietta e si
  condivide, aperta nel browser appena pubblicata.

Nelle guide non entrano id di istanze, run, webhook o chiavi, né il triage per componente: al
cliente si dice cosa non funziona e quando sarà corretto, non dove nel codice. E «collaudato» si
scrive solo per ciò che è stato provato davvero, non per una simulazione.

**Cosa non fa.** Non scrive né applica un manifest (quello è `xrcopilotlab-blueprint`); non fa test
unitari del codice; non chiama l'API a mano (`curl`, `.Client`) — se manca un'evidenza si estende la
CLI, non si aggira; non esegue su un ambiente o un tenant che non hai indicato, e mai `--env prod`
su un tenant che non sia quello di Hevolus; non apre issue senza il sì sulle bozze; non attribuisce
un fallimento a una libreria per esclusione; non corregge manifest e libreria nello stesso giro —
prima si sistema ciò che è del manifest e si rilancia, ciò che resta è ciò che si segnala.

Riferimenti che viaggiano con la skill: che cosa chiedere a un agente con knowledge, con skill, a un
orchestratore, a un processo (`domande.md`); i quattro criteri del verdetto (`giudizio.md`); la
tabella evidenza → componente → verifica (`triage.md`); il modello di segnalazione
(`segnalazione.md`); il modello di esecuzione del motore BPM e le otto domande da farsi su ogni
processo (`bpm.md`); le guide per il cliente (`guida-cliente.md`); il formato completo di suite e
report con i codici `BT0xx` (`testing.md`); una suite reale (`esempio-suite-agenda.tests.yml`).

### `xrcopilotlab-assessment` — dalla proposta al dossier

Gira su **Claude Desktop**. Traduce una proposta di progetto — tipicamente un'offerta Hevolus — in
una **soluzione concreta di agenti orchestrati su XRCopilotLab** e ne valuta la fattibilità
tecnica. L'output è un **dossier tecnico** che un ingegnere porta all'incontro con il cliente, passa
a chi prepara la quotazione, e consegna a chi scriverà il blueprint.

**Come si chiede.** Si carica la proposta (PDF o Word) in una chat di Claude Desktop e si chiede di
valutarla. La skill si attiva da sola, anche senza nominare XRCopilotLab:

| Cosa scrivi | Cosa fa la skill |
|---|---|
| «Ecco la proposta per Studio Polis, fai l'assessment» | Le cinque fasi in ordine, poi salva il dossier `.md` e lo converte in `.docx` sul template Office |
| «Come lo implementiamo su XRCopilotLab?» · «Traducila in architettura» | Idem: estrae scenari e obiettivi, progetta agenti e processi, verifica le fonti |
| «Quanto è fattibile la parte sul Registro Imprese?» | Discovery di fattibilità sulla fonte: vie di accesso già verificate per le fonti italiane ricorrenti, esito 🟢 GO · 🟡 CONDIZIONALE · 🔴 NO-GO con il fallback |
| «Il cliente ha un suo template Word» | Passa il template del cliente al generatore al posto di quello bundlato |

**Le cinque fasi:**

1. **Scenari e obiettivi** — cosa il cliente vuole ottenere, non come è scritto: una tabella
   `Obiettivo | Descrizione (dal testo) | Note` per scenario.
2. **Orchestrazione di agenti** — la scelta che costa di più se sbagliata: se il cliente descrive
   «una domanda e una risposta» è **chat + agenti orchestrati**; se descrive «chi fa cosa e in che
   ordine» è un **processo BPM**, con attività, modalità di ogni passo (umano / AI-assistito /
   automatico), corsie su ruoli aziendali, moduli e gateway. Ogni agente ha una bozza di system
   prompt e, per convenzione nostra, al più un MCP; l'orchestratore coordina e **non ha** un prompt.
   Un assistente su documenti è un agente sul knowledge graph nativo, **senza** MCP.
3. **Discovery di fattibilità** — per ogni fonte dati: domande al cliente, verifiche tecniche
   (endpoint, autenticazione, permessi), un test eseguibile, e l'esito GO / CONDIZIONALE / NO-GO.
   Il discrimine principale: autenticazione machine-to-machine o interattiva (SPID, login umano).
   **3-bis** — i **punti in sospeso**: ciò che la proposta non chiarisce si raccoglie come domande
   aperte, non si risolve inventando.
4. **Il dossier** — Markdown e Word, prosa prima delle tabelle, bozze di prompt in blocchi di codice,
   diagrammi a mappa mentale (problema → agenti → fonte).
5. **La consegna al provisioning** — il capitolo **«Elementi per il provisioning»**: tag suggerito,
   topic con i documenti, ruoli con i membri, agenti con system message e skill, agent task,
   processo con attività, corsie, moduli e gateway, segreti **citati per nome e mai per valore**, e
   i passi manuali residui. È il capitolo da cui `xrcopilotlab-blueprint` parte senza tornare a
   chiedere.

**Cosa non scrive.** Niente tecnologie interne né framework sotto il cofano — per il cliente
esistono agenti XRCopilotLab e, dove serve, server MCP verso le sue fonti. Niente pricing, niente
«a pagamento» o «incluso»: ciò che esula dal perimetro base si marca come **opzionale** con l'effort
tecnico, e la valutazione economica resta a chi cura l'offerta. E niente promesse su ciò che il BPM
**non fa** — timer e scadenze che avanzano da sole, join dopo un fork parallelo, allegati letti dagli
agenti, avvio schedulato: ognuna va scritta come componente da costruire, con la sua stima.

**Cosa non fa.** Non redige la proposta commerciale né l'offerta economica: produce la valutazione
tecnica. Non scrive il manifest: quello è il lavoro della skill successiva, su Claude Code.

Riferimenti che viaggiano con la skill: i vincoli e la filosofia della piattaforma
(`xrcopilotlab-platform.md`, con la sezione «BPM — cosa NON fa»), la struttura del dossier
(`dossier-structure.md`), le vie di accesso verificate alle fonti italiane (`data-sources-italy.md`),
il generatore Word e il template Office. Manuale: [`plugins/assessment/docs/manuale.md`](plugins/assessment/docs/manuale.md).

## Per chi sviluppa: le skill che restano nel repository di prodotto

Le tre skill qui sopra arrivano dal catalogo perché servono a chi **non** ha i repository: si
installano e funzionano su una macchina vuota. Chi sviluppa su XRCopilotLab ne ha altre, che vivono
in `.claude/skills/` del clone di
[`xrcopilotlab-webapp-dotnet`](https://github.com/hevolusinnovation/xrcopilotlab-webapp-dotnet) e si
attivano da sole quando si lavora lì dentro. **Non si installano: si ottengono clonando il
repository.** Non sono nel catalogo perché senza il codice non avrebbero niente da leggere — un
piano di implementazione, un controllo architetturale o una PR si scrivono contro i file, non
contro una descrizione.

Quelle che riguardano il ciclo di una issue sono tre, e si dividono il lavoro così:

| Skill | Chi la usa | Cosa produce |
|---|---|---|
| `xrcopilotlab-issue-report` | chi **trova** un problema | la issue che descrive **il problema**, in inglese, senza dettagli tecnici, già registrata nel progetto «AI Team» con priorità, sprint e data |
| `xrcopilotlab-issue-plan` | chi **conosce già** l'area | **il come**: piano di implementazione ancorato al codice, più il branch di lavoro |
| [`xrcopilotlab-issue-guide`](#xrcopilotlab-issue-guide--imparare-il-codebase-mentre-si-risolve-una-issue) | chi **sta imparando** il codebase | la stessa cosa, più lentamente e spiegando: il fix, e una persona che la volta dopo ne sa di più |

La separazione fra le prime due non è burocrazia: una issue di questo repo descrive un problema e
**non** dice come risolverlo, perché il *come* si decide quando la si prende in mano, che può essere
mesi dopo. Chi scrive la issue non sa ancora dove sarà il codice.

### `xrcopilotlab-issue-guide` — imparare il codebase mentre si risolve una issue

È la **modalità studio**: un senior developer seduto di fianco a chi sta imparando. Non il
professore — il collega che ne sa di più, che spiega **perché** le cose stanno così, passa i trucchi
che ha imparato sbagliando, e a un certo punto passa la tastiera.

Il risultato di una sessione sono due cose, tutte e due obbligatorie: **la issue risolta bene** e
**una persona che la volta dopo ne sa di più** — dell'architettura, delle regole del repo, e del
mestiere.

**Quando usarla e quando no.** Se chi lavora conosce già l'area e vuole solo piano e branch, la
skill giusta è `xrcopilotlab-issue-plan`: questa fa la stessa cosa più lentamente, **apposta**. E se
non c'è tempo per la modalità studio si cambia skill invece di accorciare le spiegazioni: fare le
cose di fretta *e* mal spiegate è il peggio dei due mondi.

**Come si chiede**, dentro il clone del repository di prodotto — a voce, oppure invocandola per
nome con `/xrcopilotlab-issue-guide <numero>`:

| Cosa scrivi | Cosa fa la skill |
|---|---|
| «Aiutami con la issue #987» · «affiancami sulla issue» | Legge la issue, la ridice in tre righe, verifica che il suo oggetto esista, fa il giro dell'architettura per quell'area, propone il piano e **si ferma** |
| «Spiegami mentre la faccio» · «modalità studio» | Idem: la modalità studio è il modo di lavorare, non un passo in più |
| «Non conosco questa parte del codice» · «insegnami l'architettura mentre risolvo la issue» | Il giro di `architettura.md` limitato alle sezioni che la issue tocca, ognuna con il punto del codice dove vedere la cosa con i propri occhi |
| «Guidami sulla issue, ma il test lo scrivo io» | È già così: in ogni issue c'è un pezzo che la skill **offre** a chi impara invece di farlo |

**Le quattro regole del banco**, che sono anche il motivo per cui la sessione a volte si ferma:

1. **Prima si capisce, poi si scrive.** Nessuna riga di codice finché il problema non è stato detto
   in parole semplici e chi impara non ha detto «sì, è questo».
2. **Una parte la scrive lui.** Un pezzo piccolo e ben delimitato — un test, un metodo, una query —
   va offerto, non fatto. Se risponde «fallo tu» va bene, ma la proposta va fatta. E quando torna,
   quel codice si **legge prima di correggerlo**: si corregge ciò che è sbagliato, non ciò che è
   diverso da come l'avrebbe scritto la skill.
3. **Ci si ferma in tre punti, e non altrove.** Dopo il piano, prima di ogni cosa che non si annulla
   (push, PR, mock, commento su GitHub), e alla fine. In mezzo si va: troppe domande sono peggio di
   nessuna. L'unica eccezione dichiarata è la issue bloccata dalle dipendenze, dove la domanda è
   dovuta perché la decisione non è della skill.
4. **Il gergo si spiega la prima volta.** *Token*, *case data*, *work item*, *config bridge*,
   *tenant*: mezza riga alla prima comparsa, poi si va avanti. Comprese le due parole che in questo
   repo hanno due significati — *intent*, e *orchestratore* contro *processo*.

**Il percorso**, in sei passi:

1. **Capire** — legge la issue con `gh`, la ridice come la racconteresti a un collega al caffè, e
   **verifica che l'oggetto della issue esista**: le dipendenze dichiarate, le sub-issue, un `grep`
   dei componenti che la issue nomina, la issue sorella già chiusa. È il controllo che chi è nuovo
   non sa di dover fare e costa un minuto. Se quel codice non c'è, la issue descrive un futuro: lo
   dice in chiaro e pone l'unica domanda dovuta — **(A)** resta bloccata, **(B)** si reinterpreta
   contro ciò che esiste oggi. Il piano lo scrive comunque per la strada B, ma la scelta è di chi
   possiede la issue.
2. **Orientarsi** — il giro dell'architettura limitato alle sezioni che servono, più la mappa **per
   questa issue**: in quale progetto sta il lavoro e **perché lì**, quale file esistente fa già una
   cosa simile (e si legge insieme prima di scrivere), chi ha toccato l'area per ultimo, quali
   regole di `.claude/rules/` la toccano — nominate e aperte, con in due righe l'incidente che le ha
   generate. Un divieto con la sua storia si ricorda; un divieto e basta no.
3. **Il piano**, con la struttura di `xrcopilotlab-issue-plan` e il branch con la convenzione del
   repo. Per un bug il primo passo è **sempre** la riproduzione: test rosso, poi fix, poi test verde.
   Poi il primo stop — non «procedo?», che si risponde di riflesso, ma «dimmi con parole tue cosa
   faremo al passo 2»: se lo sa dire si va, se no il piano va rispiegato, non eseguito.
4. **Fare**, un passo per volta: due righe prima su *cosa* e *perché proprio così*, solo le parti
   del diff che contano, al massimo cinque momenti didattici per issue. Se compare qualcosa che
   andrebbe sistemato ma non è nella issue, **non lo si aggiusta di passaggio**: si nomina e finisce
   nei rischi della PR o in una issue nuova. Tenere il diff dentro la issue è una cosa che si
   insegna, come scrivere il fix.
5. **Verificare** — build e test, poi le skill di controllo sull'area toccata
   (`/xrcopilotlab-validate-architecture` sempre, e secondo il diff quelle su isolamento del
   tenant, allineamento degli SDK, config bridge). Prima di lanciarle dice in una riga **cosa
   controlla ciascuna e perché esiste**: un check lanciato senza sapere cosa cerca è un rito. Se un
   check trova qualcosa non lo aggiusta in silenzio — un errore trovato è il momento didattico
   migliore che ci sia, e sistemarlo di nascosto lo butta via.
6. **Chiudere** — la PR con il suo template e la sezione «Configurazione Azure / Deploy»
   obbligatoria, poi due documenti a struttura fissa: la **nota per chi rivede** in testa alla PR e
   la **scheda di fine sessione** come commento sulla issue. Push, apertura della PR e commento sono
   stop: si chiede e si aspetta il sì.

**I due documenti di chiusura** sono la parte che fa scalare un solo senior su più persone — chi
rivede non deve ricostruire cosa è successo, glielo si dice:

```markdown
## Nota per chi rivede

**Cosa ho fatto** — [3 righe, in parole semplici]
**Dove guardare prima** — [il file/metodo con la decisione più importante, e perché]
**Dove non sono sicuro** — [1–3 punti, onesti: «ho scelto X ma non so se Y era meglio perché…»]
**Cosa ho scritto io** — [il pezzo scritto da chi impara, così chi rivede lo guarda con l'occhio giusto]
**Regole che ho applicato** — [nomi, non copie: multi-tenancy in AgentRepository, models-location per il DTO…]
```

«Dove non sono sicuro» **non è opzionale**: una PR di chi impara che dichiara tre dubbi è una PR
onesta, una che non ne dichiara nessuno è una PR che non ha guardato abbastanza.

```markdown
## Scheda di fine sessione — modalità studio

**Issue** — #N, [titolo]
**Cosa ho imparato** — [le tre cose, con parole sue]
**Architettura vista** — [le sezioni toccate, es. § 7 BPM: engine puro e worker]
**Regole incontrate** — [nomi, con l'incidente in una riga ciascuna]
**Trucchi usati** — [es. git log -S per trovare il perché; issue sorella #963; test rosso prima del fix]
**Il pezzo scritto da me** — [file e cosa fa]
**Cosa chiederei a un collega** — [1 dubbio rimasto aperto, e a chi lo chiederebbe]
```

Le tre cose imparate **si chiedono, non si dicono**, e non si salta perché è tardi. La scheda serve
a due persone: a chi impara, che fra un mese la rilegge, e a chi guida il team, che vede cosa è
passato senza essere stato lì.

**Come spiega.** Ogni momento didattico ha una di tre forme, così si riconosce a colpo d'occhio cosa
sta insegnando:

> 💡 **Perché così** — la scelta, l'alternativa scartata, cosa si romperebbe con l'alternativa; se
> c'è un incidente vero dietro, la data e il danno. Rimanda alla regola in `.claude/rules/`.
>
> 🗺️ **Come è fatta** — quale pezzo fa cosa, dove sta il confine, e il punto del codice dove vederlo
> con i propri occhi.
>
> 🔧 **Trucco** — la mossa, il comando, e perché funziona qui.

Merita un momento didattico una regola che si applica **qui**, una scelta fra due strade entrambe
plausibili, un errore classico che il codice sta evitando, un confine architetturale che la issue
attraversa, una mossa che ha appena fatto risparmiare un'ora. Non lo merita la sintassi, un `using`,
il nome di una variabile, «così è più pulito». Il criterio è secco: se non sai dire **cosa si
romperebbe** facendo altrimenti — o, per un trucco, **quanto tempo** ha fatto risparmiare — non è un
momento didattico, è un'opinione, e le opinioni non si insegnano.

**Cosa non fa.** Non lavora in silenzio (tre file scritti senza spiegare niente sono mezzo
risultato); non salta gli stop, nemmeno se chi impara dice «vai vai», soprattutto se lo dice; non
tocca `main`, non fa push forzati, non riscrive la storia; non mocka senza chiedere e non crea
milestone; non allarga il diff oltre la issue, nemmeno per una cosa giusta; **non inventa storie** —
date e danni degli incidenti sono quelli scritti nei § *Razionale* delle regole, perché una storia
verosimile, il giorno che viene smentita, brucia la fiducia in tutte le altre; e non giudica la
persona, solo il codice.

**Cosa si porta dietro.** Cinque riferimenti, che sono anche il materiale di studio più utile del
repo per chi è appena arrivato:

| Riferimento | Cosa contiene |
|---|---|
| `architettura.md` | Il giro completo in quattordici sezioni, ognuna con il punto del codice dove vederla: i tre repository e le librerie che arrivano come NuGet, chi può parlare con chi, l'ordine di registrazione in `Program.cs`, il viaggio di un messaggio in chat, i due database e la regola del tenant, il lavoro lungo, il motore BPM puro e il suo worker, SignalR, i tre livelli della conoscenza, i blueprint, gli SDK, i test, la CI, e il metodo in cinque mosse per leggere un'area nuova |
| `trucchi.md` | Dodici mosse del mestiere: trovare il *perché* di una riga, capire chi conosce l'area e chiederglielo, la issue sorella, seguire un dato nei quattro salti con il grep giusto, riprodurre prima di aggiustare, la trappola dei due serializzatori, **cinque errori che mentono**, i numeri delle migrazioni presi su tutti i branch, guardare la base di una PR prima di mergiarla, e che un precedente nel repo non è una verifica |
| `glossario.md` | Le parole del repo in mezza riga — piattaforma, processi BPM — e le due che sembrano la stessa cosa e non lo sono |
| `perche.md` | Il catalogo dei *perché* pronti, uno per regola del repo, più tre che sembrano regole e non lo sono |
| `tono.md` | Come si parla a chi impara: informale e amichevole, con regole precise su cosa non dire mai |

Modificarli è come modificare le altre skill del prodotto: si cambia il file nel repository di
prodotto, e basta — questi non passano dal catalogo, quindi non c'è niente da sincronizzare qui.

### Le altre skill del repository di prodotto

Le skill del clone si invocano con `/<nome>` oppure si attivano da sole quando la richiesta
corrisponde. Oltre alle tre della issue, il repository ne porta una dozzina, per famiglia:

| Famiglia | Skill | A cosa servono |
|---|---|---|
| Validazione sui diff | `xrcopilotlab-validate-architecture`, `-check-tenant-isolation`, `-check-sdk-alignment`, `-check-config-bridge` | Verificano le regole obbligatorie sul diff prima di un commit o di una PR: tutte insieme, oppure mirate su isolamento del tenant, allineamento dei tre SDK pubblici, bridge delle variabili d'ambiente |
| Scaffolding | `xrcopilotlab-add-endpoint`, `-add-migration`, `-add-model` | Un endpoint CRUD completo con il suo repository e la registrazione; una migrazione SQL idempotente con la numerazione presa su tutti i branch; un modello AI a catalogo, sondato sul deployment prima di scriverlo |
| Comandi, CI/CD, PR | `xrcopilotlab-commands`, `-cicd`, `-pr-template` | Build, run e test in locale; workflow, mappa degli ambienti e tabella sintomo → verifica; il template della PR compilato dal diff, con la sezione «Configurazione Azure / Deploy» obbligatoria |
| Debug e analisi | `xrcopilotlab-trace-skill-flow`, `-generate-docs` | Perché una skill dell'agente non parte: intent → routing → handler → completion; documentazione tecnica con i diagrammi, o il manuale utente |
| Sprint e release | `xrcopilotlab-version-bump`, `-label-semver`, `-sprint-milestone`, `-milestone-report`, `xrcopilot-release-notes`, `-release-email`, `-wiki-update` | Il prossimo numero di versione derivato dalle issue chiuse e dalle label `semver:*`, le label stesse, le milestone di sprint e i loro report di stato (pulse, checkpoint, recap), e le note di rilascio con la mail e l'aggiornamento del wiki |
| Provisioning e collaudo | `xrcopilotlab-blueprint`, `-blueprint-test` | Le stesse due del plugin: nel repository sono la **sorgente**, qui una copia sincronizzata |

L'indice completo, con «cosa fa» e «quando usarla» per ciascuna, è in `.claude/skills/README.md`
del repository di prodotto.

## Struttura del repository

```
.claude-plugin/marketplace.json                    il catalogo: cosa contiene, dove sta ciascun plugin
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
voce in `.claude-plugin/marketplace.json` (vedi [§ Struttura del repository](#struttura-del-repository)
per dove va ciascuna cosa).

### Aggiungere una skill a un plugin esistente

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
6. si aggiunge la skill alla tabella di [§ Le skill](#le-skill) e alla riga del plugin in
   [§ Cosa c'è dentro](#cosa-cè-dentro) di questo README, e alla tabella «Cosa contiene» del README
   del plugin.

Il passo che salta più spesso è il secondo: una skill sincronizzata senza i suoi riferimenti si
installa, si attiva, e poi si ferma su un file che chi l'ha installata non ha.
