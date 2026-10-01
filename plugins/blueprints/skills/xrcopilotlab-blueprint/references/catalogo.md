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

## Installare e aggiornare

`catalog install` copia il modello nell'archivio del tenant con le scelte di chi installa e
**non crea niente sul tenant**: dopo servono `secrets set`, `plan` e `apply`, con la loro
approvazione, come per ogni altro blueprint. La copia è del tenant: una versione nuova del modello
non la cambia da sola. `catalog list --company <tenant>` la segnala; `catalog install` di nuovo
riparte dalle scelte precedenti e il piano applica la differenza sul posto (#1126).

I segreti appartengono al tenant (`Blueprints:Secrets:<companyId>:<TAG>:<nome>`): due tenant che
installano lo stesso modello con lo stesso tag non condividono niente.

## Nella webapp

Catalogo e installazione compaiono nella pagina dei blueprint dell'amministrazione: specifiche nella
#1175.
