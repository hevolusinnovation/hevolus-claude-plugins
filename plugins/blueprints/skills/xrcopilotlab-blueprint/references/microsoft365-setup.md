# Collegare una casella Microsoft 365 a un blueprint

Procedura per dare a un blueprint l'accesso a posta o calendario di **una** casella, con i soli
permessi che i suoi tool usano. Va fatta una volta per tenant del cliente; il blueprint poi crea da solo connessione, server MCP e collegamento
agli agenti.

**Vale solo quando la casella è di un'altra azienda**, nel suo tenant — come per Studio Polis:
due tenant che devono parlarsi, con un'app nostra multi-tenant e permessi applicativi. Se la casella
è di una persona di Hevolus che usa l'agente per sé (il proprio calendario, la propria posta),
questa procedura **non si applica**: si usa OAuth delegato, con la persona che autorizza dal pulsante
*Autorizza* di Connections — vedi «La casella è di chi usa l'agente» nel riferimento
`mcp-builder.md` della skill `xrcopilotlab-blueprint`.

Serve perché i permessi vivono in **Entra** e in **Exchange**, non nella piattaforma: il blueprint
non può crearli, e non deve poterlo fare.

## Cosa si ottiene

Un'app che fa **solo** ciò che fanno i tool del blueprint — per esempio leggere la disponibilità,
oppure leggere la posta e rispondere — **di quella sola casella**, non di tutto il tenant.

## Prima di cominciare: serve davvero un'app?

Se lo scenario è «chi mi scrive sceglie uno slot e prenota sul mio calendario», la risposta è
**Microsoft Bookings** («Bookings with me», in Outlook): legge la disponibilità, propone gli slot,
crea la riunione Teams e fa le domande al prenotante. L'agente dà il link; non servono
registrazioni applicative, consensi né segreti, e questa pagina non si applica.

## I permessi si ricavano dai tool

| Il tool fa | Ruolo applicativo in Exchange |
|---|---|
| slot liberi / occupati (`getSchedule`) | `Application Calendars.Read` |
| legge gli eventi | `Application Calendars.Read` |
| crea o sposta eventi | `Application Calendars.ReadWrite` |
| legge la posta | `Application Mail.Read` |
| invia, anche con allegati | `Application Mail.Send` |

Si assegnano **solo** quelli che un tool usa. Un agente che dice gli slot liberi ha bisogno della
prima riga e di nient'altro.

## La decisione che viene prima: una app per tutti, o una per cliente

Il cliente è un'altra azienda, quindi un altro tenant. Due modelli, e non si equivalgono:

| | App nel tenant del cliente | **App multi-tenant nostra** |
|---|---|---|
| Chi la crea | il cliente | noi (AI Team), una volta sola |
| Cosa ci consegna | `appId` **e client secret** | niente |
| Segreti che viaggiano fra aziende | sì | **no** |
| Al decimo cliente | dieci app, dieci segreti, dieci scadenze | sempre la stessa |
| Se il cliente revoca | deve cancellare l'app | toglie l'assegnazione in Exchange |

**Multi-tenant è la strada normale**, ed è quella descritta qui sotto. L'app nel tenant del cliente
si fa solo quando la sua policy vieta di abilitare applicazioni esterne: succede, ma è l'eccezione,
e costa al cliente creare l'app, abilitarla, generare un segreto e trasmetterlo in modo sicuro — a
ogni scadenza.

La scelta si fa **prima** di creare l'app, perché è `--sign-in-audience` e non si cambia comodamente
dopo. Anche quando si comincia con una casella interna di collaudo: se quell'app dovrà poi servire
un cliente, va creata multi-tenant da subito.

## Come si restringe: RBAC for Applications, non più Application Access Policy

Il permesso **non si consente in Entra**. Lo assegna un Exchange Administrator con **RBAC for
Applications**, già ristretto a una *management scope* che contiene solo la casella. Due
conseguenze:

- non serve un Global Administrator o un Application Administrator per il consenso: l'app in Entra
  non chiede permessi Graph;
- non esiste la finestra in cui l'app legge le caselle di tutti: il permesso nasce ristretto.

Attenzione a non fare **anche** il consenso in Entra: i permessi dei due sistemi si sommano, e un
`Calendars.Read` consentito tenant-wide renderebbe inutile la restrizione di Exchange.

L'**Application Access Policy** (`New-ApplicationAccessPolicy`) è il meccanismo precedente: Microsoft
la dichiara legacy e chiede di non crearne di nuove. Vedi [«App già consentite in
Entra»](#app-già-consentite-in-entra-legacy) per quelle esistenti.

## Cosa chiedere al cliente

Con il modello multi-tenant sono tre cose, tutte dal suo amministratore Microsoft 365:

1. **il riferimento** alla nostra applicazione nel suo tenant (il service principal): un comando o
   un link, e **non concede alcun permesso**;
2. **l'indirizzo della casella** da usare;
3. **l'assegnazione ristretta** in Exchange: il ruolo applicativo che serve, solo su quella casella.

Nessuna password, nessun segreto, nessun accesso condiviso.

Testo pronto da inoltrare (adattare l'elenco dei permessi ai tool del blueprint):

> Per attivare il collegamento ci serve, dal vostro amministratore Microsoft 365:
>
> **1.** Registrare nel vostro tenant il riferimento alla nostra applicazione: un comando, che vi
> forniamo pronto. Di per sé non concede nessun accesso.
>
> **2.** L'indirizzo della casella da collegare.
>
> **3.** Assegnare alla nostra applicazione, in Exchange Online, **solo** il permesso di
> *leggere la disponibilità del calendario*, **solo** su quella casella. Vi forniamo i comandi e
> la verifica che prova che sulle altre caselle l'accesso è negato.
>
> Nessuna password ci viene comunicata e nessun permesso vale sul resto del tenant: l'assegnazione
> resta vostra e la potete togliere in qualunque momento, senza passare da noi.

## Chi serve

| Passo | Chi lo esegue |
|---|---|
| 1. Registrazione applicativa e owner | **AI Team** — mai chi ha chiesto il blueprint, se non ne fa parte |
| 2. Assegnazione ristretta (RBAC for Applications) | **Exchange Administrator** |
| 3. Credenziale dell'app | **AI Team**, come owner |
| 4. Segreti nel blueprint e `apply` | **AI Team** |

L'owner di un'app può generarle credenziali nuove, cioè agire come l'app: per questo non è un
utente senza ruoli amministrativi. E i ruoli per la CLI (App Configuration, Key Vault) **non si
chiedono per una persona** in una consegna: valgono sui segreti di tutti i blueprint dell'ambiente.

## 1. La registrazione applicativa (AI Team)

```bash
APP_ID=$(az ad app create \
  --display-name "xrcopilotlab-blueprints-m365" \
  --sign-in-audience AzureADMultipleOrgs \
  --query appId -o tsv)

# Il service principal è il riferimento che Exchange usa al passo 2: non concede nulla.
SP_ID=$(az ad sp create --id "$APP_ID" --query id -o tsv)

echo "appId = $APP_ID   objectId del service principal = $SP_ID"
```

Niente `--required-resource-accesses`: l'app non chiede permessi Graph in Entra, quindi non c'è un
pulsante «Grant admin consent» da premere per sbaglio. `AzureADMultipleOrgs` è ciò che la rende
utilizzabile da un altro tenant.

Se l'app l'ha creata qualcuno fuori dall'AI Team, si sistema l'owner prima di tutto il resto:

```bash
az ad app owner list --id "$APP_ID" --query "[].userPrincipalName" -o tsv
az ad app owner add --id "$APP_ID" --owner-object-id <objectId del gruppo o della persona AI Team>
az ad app owner remove --id "$APP_ID" --owner-object-id <objectId dell'utente da togliere>
```

## 2. L'assegnazione ristretta — serve un Exchange Administrator

```powershell
Connect-ExchangeOnline

# Il riferimento all'app (l'objectId è quello di Enterprise applications, non di App registrations)
New-ServicePrincipal -AppId <appId> -ObjectId <objectId del service principal> -DisplayName "xrcopilotlab-blueprints-m365"

# La sola casella
New-ManagementScope -Name "xrcopilotlab-<tag>-casella" `
  -RecipientRestrictionFilter "PrimarySmtpAddress -eq 'test@hevolus.it'"

# Il solo ruolo che serve (una riga per ciascun ruolo della tabella in testa)
New-ManagementRoleAssignment -App <appId> -Role "Application Calendars.Read" `
  -CustomResourceScope "xrcopilotlab-<tag>-casella"

# Verifica, che è la parte che dice se ha davvero funzionato
Test-ServicePrincipalAuthorization -Identity <appId> -Resource test@hevolus.it            # InScope: True
Test-ServicePrincipalAuthorization -Identity <appId> -Resource <un'altra casella>         # InScope: False
```

Le due verifiche insieme sono la prova: la prima dice che funziona, la seconda che è **ristretta**.
Il test salta la cache; l'app vera vede l'assegnazione dopo un intervallo che va da 30 minuti a 2
ore. Un 403 subito dopo non è un errore di configurazione.

Per più caselle si usa una scope su un gruppo (`MemberOfGroup -eq '<distinguished name>'`), con i
membri diretti: i gruppi annidati non contano.

## 3. La credenziale (AI Team, come owner)

Meglio un certificato, se la connessione lo supporta; altrimenti un client secret:

```bash
az ad app credential reset --id "$APP_ID" --display-name "blueprint" --years 1 --query password -o tsv
```

Il valore si vede **una volta sola**. Va messo subito, senza passare da un file o da una chat.

Il segreto ha una scadenza: quando arriva, l'agente smette di funzionare e l'unico sintomo è una
risposta vuota. La scadenza si annota dove il team la vede, non nella memoria di chi l'ha generato.

## 4. I segreti nel blueprint (AI Team)

```bash
xrcopilotlab-bp secrets set --env staging --tag <TAG> graph-client-id      # incollare l'appId
xrcopilotlab-bp secrets set --env staging --tag <TAG> graph-client-secret  # incollare il valore
```

L'input è mascherato. Nel manifest compaiono solo i **nomi** di queste chiavi.

## 5. Provare

```bash
xrcopilotlab-bp plan --env staging --tag <TAG>
```

Il piano include la prova del tool (`testTool`), in sola lettura su una finestra vuota del passato:
esercita credenziale, permesso e restrizione senza lasciare traccia. Se quella prova passa, i passi
sono a posto. In produzione si va dopo staging, con lo stesso giro, sempre dall'AI Team.

## App già consentite in Entra (legacy)

Un'app creata prima di questo cambio ha i permessi consentiti tenant-wide in Entra e una
Application Access Policy che li restringe. Funziona, ma va migrata, senza interruzioni, così:

1. una management scope sul gruppo o sulla casella della policy;
2. `New-ServicePrincipal` e `New-ManagementRoleAssignment` con i soli ruoli che i tool usano;
3. **togliere il consenso** ai permessi in Entra (finché c'è, la restrizione di Exchange non vale);
4. togliere la Application Access Policy.

## Quando il cliente dà la casella definitiva

Se è **nello stesso tenant**: si cambia `variables.mailbox` nel manifest e si aggiorna la management scope
del passo 2 sulla nuova casella. Il resto resta com'è.

Se è **nel tenant del cliente**: l'app è la stessa (per questo si crea multi-tenant), ma servono il
riferimento all'app e un'assegnazione ristretta sul suo Exchange, fatti dal suo amministratore. I
segreti restano i nostri: il `clientSecret` è dell'app, non del tenant che la usa.
