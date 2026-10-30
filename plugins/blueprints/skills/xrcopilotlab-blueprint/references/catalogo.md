# Il catalogo dei blueprint pronti

Un **modello** è un blueprint scritto per essere installato da chiunque: non nomina un tenant, non
nomina persone, cita i segreti per nome. Hevolus lo pubblica nel catalogo; l'amministratore di un
tenant lo installa scegliendo solo ciò che il modello lascia aperto — il prefisso, il topic, le
persone di ogni ruolo, le credenziali. È la decisione 1 dell'epic #680 («Hevolus cura i modelli,
l'amministratore del tenant li applica»), realizzata con la strada del manifest (#1185).

## Dove vive

Nello stesso archivio dei blueprint dei tenant — container Cosmos `blueprints`, blob `blueprints/` —
nella partizione **`default`**, la stessa convenzione che la piattaforma usa per endpoint e categorie
condivise. È l'unica partizione che un tenant legge senza possederla, e nessun tenant la scrive: ci
pubblica solo Hevolus, con `catalog publish`. Nessun altro comando accetta `default` come tenant.

## Come si scrive un modello

È un manifest normale con quattro differenze:

| | In un manifest di un cliente | In un modello |
|---|---|---|
| Tenant | `tenant.companyId: <guid>` | assente |
| Topic | `topic`, `existingTopic` o `topicId` | solo `topic`: chi installa può scegliere uno esistente |
| Persone | email in `members`, `owners`, `recipients` | ruoli vuoti; altrove `role:<chiave del ruolo>` |
| Segreti | `Blueprints:Secrets:<TAG>:<nome>` | uguale (mai con un tenant dentro) |

```yaml
businessRoles:
  - key: referente
    name: Referente agenda
    members: []                       # le sceglie chi installa

processes:
  - key: agenda
    owners: [role:referente]          # all'installazione: le persone del ruolo

orchestrators:
  - key: approvazione
    steps:
      - key: ok
        type: humanApproval
        recipients: [role:referente]
```

Un `role:<chiave>` in un elenco diventa tante voci quante sono le persone del ruolo; in un testo,
un elenco separato da virgole. Un indirizzo email in qualunque punto del modello — anche dentro un
system message — lo ferma (`BP101`), tranne quelli dei domini d'esempio (`esempio.it`,
`example.com`, `*.invalid`, `*.test`): è così che non arriva a un altro cliente il contatto di chi
aveva fatto nascere il modello.

**I documenti di conoscenza** si ridistribuiscono con il modello, anche a un concorrente del
cliente da cui sono nati: `publish` si ferma (`BP104`) finché qualcuno non dichiara di averne
rivisto l'origine con `--documents-reviewed` (checklist della #807). Chi l'ha dichiarato resta
scritto nella versione (`catalogReview.documentsReviewedBy`).

**Il controllo più importante non è una regola propria**: `publish` installa il modello per finta,
su un tenant e con una persona d'esempio per ruolo, e passa il risultato al validatore di sempre.
Un modello che il catalogo accetta non scopre i propri errori sul tenant del cliente.

## Da un blueprint di un cliente a un modello

La strada più corta parte da un tenant su cui lo scenario già funziona:

1. `xrcopilotlab-bp export --scope blueprint <TAG>` — senza `--keep-people`, sostituisce persone
   e nomi (#1173);
2. togliere `tenant.companyId`, portare le persone a `role:<chiave>`, rileggere system message e
   documenti con la checklist della #807;
3. `catalog publish <file> --documents-reviewed`, prima su staging.

## Chi pubblica e che cosa si copia (#1518)

Un modello con la chiave `access` entra nel catalogo solo se ha `scope: public` e lo pubblica uno dei suoi `owners`
(`BP127`); un modello bloccato si vede nel catalogo, ma lo pubblicano e lo installano solo i suoi owner (`BP123`).
La copia installata prende lo scope del tenant di destinazione (`staging` su staging, `tenant` in produzione) e
conserva blocco e owner del modello; gli owner non contano come persone del modello (`BP101`) né come segnaposto da sostituire. Un modello
senza `access` si pubblica come prima, finché la migrazione non lo dichiara. Dettagli: `manifest-reference.md`,
sezione `access`.

## Installare e aggiornare

`catalog install` copia il modello nell'archivio del tenant con le scelte di chi installa e
**non crea niente sul tenant**: dopo servono `secrets set`, `plan` e `apply`, con la loro
approvazione, come per ogni altro blueprint. La copia è del tenant: una versione nuova del modello
non la cambia da sola. `catalog list --company <tenant>` la segnala; `catalog install` di nuovo
riparte dalle scelte precedenti e il piano applica la differenza sul posto (#1126).

**Il tag della copia non è quello del modello** (#1427). Senza una scelta esplicita, la copia prende il
tag del modello seguito da un codice ricavato dal **nome del tenant**: il nome intero, in maiuscolo,
senza accenti, spazi né simboli — «Pippo SRL» dà `PIPPOSRL`, e il modello `LEGAL` diventa
`LEGALPIPPOSRL`. Il tag ha al più 20 caratteri: un nome lungo si accorcia tagliando il codice. Il
prefisso dei nomi resta `BP-<TAG>-`, con il tag nuovo. Tre casi:

- **Aggiornamento**: una copia già installata tiene il tag che ha, anche se il tenant ha cambiato nome.
- **Tag esplicito** (`--tag`, o la scelta nella webapp): è ammesso se valido e libero, anche uguale a
  quello del modello. Serve quando si vuole un tag breve (`HEVODEMO` invece di `HEVOLUSDEMO`).
- **Nome non disponibile** (l'ambiente non lo elenca, o non ha lettere né cifre): `BP109`, e si sceglie
  il tag a mano.

La regola vale per l'installazione dal catalogo; `promote` copia un manifest fra archivi e ne
mantiene il tag. Le copie già installate non cambiano.

I segreti appartengono al tenant (`Blueprints:Secrets:<companyId>:<TAG>:<nome>`): due tenant che
installano lo stesso modello con lo stesso tag non condividono niente.

## Una versione sola per modello (#1595)

Il catalogo non è un archivio: è ciò che si offre a chi installa. Per questo ogni modello ci sta in **una
versione sola, l'ultima che funziona**. `catalog publish` toglie dal catalogo le versioni precedenti dello
stesso modello appena la nuova è scritta, e rifiuta una versione più vecchia di quella già pubblicata.
`catalog prune` fa lo stesso sui modelli pubblicati prima della regola, con la conferma forte di `delete`.

Una versione che esce dal catalogo non si installa più, nemmeno con `--version`. Le copie già installate
non cambiano: stanno nell'archivio del tenant, con la loro storia; il prossimo `catalog install` le porta
all'ultima versione. Il motivo è emerso il 22/10/2026: nel catalogo di produzione c'erano ancora la v2 di
FINBANK, che usava una skill ritirata, e la v20, sostituita lo stesso giorno.

## Nella webapp

Catalogo e installazione compaiono nella pagina dei blueprint dell'amministrazione: specifiche nella
#1175. Le pagine chiamano un servizio della piattaforma (#1263), `AppClient.BlueprintCatalog`, che
rifiuta chi non è amministratore della company — il controllo è dell'Api, non di ciò che l'interfaccia
mostra:

| Chiamata | Che cosa fa |
|---|---|
| `GET blueprints/{company}/catalog` | I modelli (ultima versione) con ciò che il tenant ne ha installato e se ce n'è uno più nuovo. |
| `GET blueprints/{company}/catalog/{modello}` | Che cosa crea, che cosa chiede (skill, server MCP esistenti), i segreti per nome, i ruoli che vogliono persone. |
| `POST …/{modello}/preview` | Le scelte (tag, topic, persone) → il piano, i rilievi (licenza compresa) e i segreti mancanti, con la sua **impronta**. Non scrive niente. |
| `POST …/{modello}/install` | Il sì sull'impronta: se il piano è cambiato (409) o non si può confermare (422) non si crea niente. Altrimenti copia il modello nell'archivio del tenant, crea il run approvato e accoda il lavoro (202). |
| `GET blueprints/{company}/runs/{run}` | Stato del run: entità create, operazioni previste, fasi, errore. |

L'esecuzione gira in background in `.Api.AsyncOperations` (`BlueprintInstallWorker`, coda
`blueprint-install`): il messaggio porta solo tenant, run e impronte (#1151), il worker ricostruisce
il piano dall'archivio e, se non è quello approvato, non crea niente e lo scrive nel run. Una
installazione alla volta per tenant. I segreti non passano di qui: un segreto che manca ferma
l'installazione, e si imposta con `secrets set`.
