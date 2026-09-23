# L'accesso ad Azure

**Per chi usa il plugin `blueprints` su Claude Code.** È il punto contro cui si sbatte per primo, e
non si risolve riprovando: va sistemato una volta, e poi non ci si pensa più.

L'assessment su Claude Desktop non tocca niente di tutto questo: lì non serve nessun accesso Azure.

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

| Ambiente | Resource group | App Configuration | Key Vault |
|---|---|---|---|
| `staging` | `rg-xrcopilotlab-staging-itn-01` | `appcs-xrcopilotlab-staging-01` | `kv-xrcopilotlab-stg-01` |
| `prod` | `rg-xrcopilotlab-prod-itn-01` | `appcs-xrcopilotlab-prod-01` | `kv-xrcopilotlab-prod-01` |

> **Verificati contro Azure il 22/09/2026, e i nomi erano sbagliati.** Questa pagina citava per la
> produzione un `appcs-xrcopilotlab-prod-italynorth` che **non esiste** — non risolve nemmeno in DNS
> — e un ambiente `preview` che non è un ambiente: `xrcopilotlab-preview.hevolus.it` è un secondo
> nome host della **produzione**. Chiedere un ruolo su una risorsa inesistente fa perdere un giro a
> te e a chi amministra.
>
> Nella sottoscrizione esiste anche un `kv-xrcopilotlab-staging`, che **non** è quello usato da
> staging. Se ti viene chiesto su quale vault assegnare un ruolo, è `kv-xrcopilotlab-stg-01`.

Due cose che sorprendono chi amministra, ed entrambe fanno perdere tempo se non si sanno prima.

**Essere Owner della sottoscrizione non basta.** Questi sono ruoli del **piano dati**: né *Owner*
né *Contributor* li portano con sé. Chi amministra la sottoscrizione ha comunque le due
assegnazioni scritte esplicitamente sulle risorse — se qualcuno obietta «ma ho già i permessi su
tutto», è questo il punto.

**E non c'è la scorciatoia dell'access policy.** Il vault di staging ha l'autorizzazione **RBAC**
attiva e **zero** access policy: aggiungerne una — la prima cosa che viene in mente quando si
chiede accesso a un Key Vault — non ha alcun effetto. Serve l'assegnazione di ruolo, quella dei
comandi qui sotto.

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

**I comandi da girare a chi amministra** — assegnati sulla **singola risorsa**, non sul resource
group: così il permesso non si estende in silenzio ad altro che vive lì accanto. Sotto c'è staging;
per la produzione cambiano solo le tre righe delle coordinate, e le trovi subito dopo.

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

Per la **produzione**, stessi ruoli, altre coordinate:

```bash
SUB=/subscriptions/73961d27-722e-4282-be21-bfb36e97c0f0/resourceGroups/rg-xrcopilotlab-prod-itn-01
APPCS=$SUB/providers/Microsoft.AppConfiguration/configurationStores/appcs-xrcopilotlab-prod-01
KV=$SUB/providers/Microsoft.KeyVault/vaults/kv-xrcopilotlab-prod-01
```

> **Su produzione, al 22/09/2026, nessuna persona ha App Configuration Data Reader** — ci sono solo
> quattro service principal. Sul Key Vault di produzione tre persone hanno *Secrets User*. Quindi
> oggi la CLI su `prod` non la può usare nessuno, e la richiesta va fatta: non è un difetto del
> plugin, è un'assegnazione che non c'è mai stata. `xrcopilotlab-bp environments` lo dice in un
> comando, prima di cominciare.

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

