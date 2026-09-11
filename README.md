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
