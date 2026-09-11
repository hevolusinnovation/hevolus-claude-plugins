# Collegare una casella Microsoft 365 a un blueprint

Procedura per dare a un blueprint l'accesso a posta e calendario di **una** casella. Va fatta una
volta per tenant del cliente; il blueprint poi crea da solo connessione, server MCP e collegamento
agli agenti.

Serve perché i permessi vivono in **Entra** e in **Exchange**, non nella piattaforma: il blueprint
non può crearli, e non deve poterlo fare.

## Cosa si ottiene

Un'app che legge la posta in arrivo, risponde (anche con allegati) e scrive il calendario — **di
quella sola casella**, non di tutto il tenant.

## La decisione che viene prima: una app per tutti, o una per cliente

Il cliente è un'altra azienda, quindi un altro tenant. Due modelli, e non si equivalgono:

| | App nel tenant del cliente | **App multi-tenant nostra** |
|---|---|---|
| Chi la crea | il cliente | noi, una volta sola |
| Cosa ci consegna | `appId` **e client secret** | niente |
| Segreti che viaggiano fra aziende | sì | **no** |
| Al decimo cliente | dieci app, dieci segreti, dieci scadenze | sempre la stessa |
| Se il cliente revoca | deve cancellare l'app | toglie il consenso, un clic |

**Multi-tenant è la strada normale**, ed è quella descritta qui sotto. L'app nel tenant del cliente
si fa solo quando la sua policy vieta di consentire applicazioni esterne: succede, ma è l'eccezione,
e costa al cliente creare l'app, consentirla, generare un segreto e trasmetterlo in modo sicuro — a
ogni scadenza.

La scelta si fa **prima** di creare l'app, perché è `--sign-in-audience` e non si cambia comodamente
dopo. Anche quando si comincia con una casella interna di collaudo: se quell'app dovrà poi servire
un cliente, va creata multi-tenant da subito.

## Cosa chiedere al cliente

Con il modello multi-tenant sono tre cose, tutte dal suo amministratore Microsoft 365:

1. **il consenso** alla nostra applicazione, da un link che gli mandiamo noi;
2. **l'indirizzo della casella** da sorvegliare;
3. **la restrizione a quella sola casella**, che deve fare lui in Exchange.

Nessuna password, nessun segreto, nessun accesso condiviso.

Il punto 3 va chiesto **prima** del punto 1, e conviene dirgli perché: finché non c'è, i permessi
valgono su tutte le caselle dell'azienda. Essere noi a chiedere di essere limitati è anche il modo
più rapido di togliere la domanda che un cliente attento farebbe comunque.

Testo pronto da inoltrare:

> Per attivare la lettura automatica ci serve, dal vostro amministratore Microsoft 365:
>
> **1.** L'autorizzazione della nostra applicazione sul vostro tenant. Vi inviamo un link: chi ha i
> privilegi di amministratore accede, vede i permessi richiesti e conferma. I permessi sono tre, e
> solo questi: leggere la posta, inviare posta, leggere e scrivere il calendario.
>
> **2.** L'indirizzo della casella su cui arrivano i messaggi da lavorare.
>
> **3.** Una restrizione che limiti la nostra applicazione a quella sola casella. Si imposta da
> Exchange Online con un comando, che vi forniamo pronto. Chiediamo di applicarla **prima**
> dell'autorizzazione al punto 1: finché non c'è, i permessi valgono su tutte le caselle, e
> preferiamo che quella finestra non esista.
>
> Nessuna password ci viene comunicata: l'autorizzazione resta vostra e la potete revocare in
> qualunque momento dal portale Microsoft, senza passare da noi.

## Chi serve

| Passo | Ruolo necessario |
|---|---|
| 1. Registrazione applicativa | nessuno: nel tenant `hevolus.it` gli utenti possono crearla |
| 2. Consenso amministratore | Global Administrator, Cloud Application Administrator o Application Administrator |
| 3. Application Access Policy | Exchange Administrator |
| 4. Segreti nel blueprint | chi applica il blueprint |

I passi 2 e 3 **non sono aggirabili**: un permesso applicativo `Mail.Read` legge ogni casella del
tenant finché la policy non lo restringe, ed è corretto che nessuno se lo possa concedere da solo.

## 1. La registrazione applicativa

```bash
cat > /tmp/graph-perms.json <<'JSON'
[{
  "resourceAppId": "00000003-0000-0000-c000-000000000000",
  "resourceAccess": [
    { "id": "810c84a8-4a9e-49e6-bf7d-12d183f40d01", "type": "Role" },
    { "id": "b633e1c5-b582-4048-a93e-9f11b44c7e96", "type": "Role" },
    { "id": "ef54d2bf-783f-4e0f-bca1-3210c0444d99", "type": "Role" }
  ]
}]
JSON

APP_ID=$(az ad app create \
  --display-name "xrcopilotlab-blueprints-m365" \
  --sign-in-audience AzureADMultipleOrgs \
  --required-resource-accesses @/tmp/graph-perms.json \
  --query appId -o tsv)

# Il service principal è ciò a cui il consenso si applica: senza, il passo 2 non ha bersaglio.
az ad sp create --id "$APP_ID"

echo "appId = $APP_ID"
```

`AzureADMultipleOrgs` è ciò che rende l'app consentibile da un altro tenant. Con `AzureADMyOrg`
vale solo per `hevolus.it`, e per il primo cliente andrebbe rifatta.

I tre GUID sono `Mail.Read`, `Mail.Send` e `Calendars.ReadWrite` applicativi. Sono stabili, ma si
rileggono con:

```bash
az ad sp show --id 00000003-0000-0000-c000-000000000000 \
  --query "appRoles[?value=='Mail.Read' || value=='Mail.Send' || value=='Calendars.ReadWrite'].[value,id]" -o tsv
```

**Fermarsi qui.** L'app esiste ma non può ancora fare nulla: i permessi sono *richiesti*, non
concessi. È lo stato giusto in cui lasciarla mentre si aspetta un amministratore.

## 2. Il consenso — serve un amministratore

```bash
az ad app permission admin-consent --id "$APP_ID"
```

Oppure dal portale: **Entra ID → App registrations → xrcopilotlab-blueprints-m365 → API permissions
→ Grant admin consent**.

⚠️ **Da questo momento e finché non è fatto il passo 3, l'app legge e scrive la posta e il
calendario di chiunque nel tenant.** Se i due passi non avvengono nella stessa sessione, conviene
invertirli: la policy si può creare **prima** del consenso, e così la finestra non esiste.

## 3. La policy che restringe — serve un Exchange Administrator

```powershell
Connect-ExchangeOnline

New-ApplicationAccessPolicy `
  -AppId <appId> `
  -PolicyScopeGroupId test@hevolus.it `
  -AccessRight RestrictAccess `
  -Description "xrcopilotlab blueprints: solo la casella di collaudo"

# Verifica, che è la parte che dice se ha davvero funzionato
Test-ApplicationAccessPolicy -Identity test@hevolus.it -AppId <appId>   # AccessCheckResult: Granted
Test-ApplicationAccessPolicy -Identity <un'altra casella> -AppId <appId> # AccessCheckResult: Denied
```

Le due verifiche insieme sono la prova: la prima dice che funziona, la seconda che è **ristretta**.
Una sola policy copre posta, calendario e contatti, perché vivono tutti in Exchange.

Per più caselle si usa un gruppo di sicurezza abilitato alla posta come `PolicyScopeGroupId`.

## 4. I segreti nel blueprint

```bash
az ad app credential reset --id "$APP_ID" --display-name "blueprint" --years 1 --query password -o tsv
```

Il valore si vede **una volta sola**. Va messo subito, senza passare da un file o da una chat:

```bash
xrcopilotlab-bp secrets set --env staging --tag <TAG> graph-client-id      # incollare l'appId
xrcopilotlab-bp secrets set --env staging --tag <TAG> graph-client-secret  # incollare il valore
```

L'input è mascherato. Nel manifest compaiono solo i **nomi** di queste chiavi.

Il segreto ha una scadenza: quando arriva, l'agente smette di leggere la posta e l'unico sintomo è
una casella che sembra vuota. Vale la pena segnarsela.

## 5. Provare

```bash
xrcopilotlab-bp plan --env staging --tag <TAG>
```

Il piano include la prova del tool (`testTool`), in sola lettura su una finestra vuota: esercita
credenziale, permesso e policy senza lasciare traccia. Se quella prova passa, i quattro passi sono
a posto.

## Quando il cliente dà la casella definitiva

Se è **nello stesso tenant**: si cambia `variables.mailbox` nel manifest e si rifà il passo 3 sulla
nuova casella. Il resto resta com'è.

Se è **nel tenant del cliente**: l'app è la stessa (per questo si crea multi-tenant), ma servono il
consenso del suo amministratore e una policy sul suo Exchange. I segreti restano i nostri: il
`clientSecret` è dell'app, non del tenant che la consente.
