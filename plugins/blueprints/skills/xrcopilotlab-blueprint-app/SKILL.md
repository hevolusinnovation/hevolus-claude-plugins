---
name: xrcopilotlab-blueprint-app
description: Da un blueprint XRCopilotLab già applicato su un tenant porta a un'app di App Builder collegata ai suoi agenti, orchestratori e processi BPM. Legge manifest e inventario, mostra quali entità un'app può usare e in che modo (chat incorporata o propria, agente come servizio, procedura su un orchestratore, pratica in un processo, lavoro asincrono), sceglie l'archetipo, propone 2-3 varianti di layout come mock-up con i dati di collaudo del blueprint (al più una in 3D con Babylon.js, e solo se utile) e scrive il brief per App Buddy. Usa quando l'utente chiede «un'app sul blueprint», «un'app per il cliente», «uno sportello / un widget / un cruscotto per questo blueprint», «un'app 3D del blueprint», oppure dopo un apply chiede come le persone useranno ciò che è stato creato. NON usare per scrivere o applicare il manifest (è `xrcopilotlab-blueprint`), né per un'app di App Builder che non nasce da un blueprint.
---

# xrcopilotlab-blueprint-app

Porta l'utente da «il blueprint è applicato» a «ecco l'app che le persone useranno ogni giorno».

Un blueprint dà a un cliente agenti, orchestrazioni e processi, ma chi deve usarli li raggiunge solo
dall'interfaccia di XRCopilotLab. Questa skill decide **quale app** serve, **come** parla al blueprint
e **che faccia** ha, e la consegna ad App Buddy con un brief che non lascia niente da indovinare.

Input: `$ARGS` — il tag del blueprint (con ambiente e tenant, se non sono quelli di default), una
descrizione dell'app desiderata, oppure **niente**.

Piano e decisioni: issue #1566 (primo commento) e
`docs/superpowers/specs/2026-10-25-blueprint-app-design.md`.

## 0. Se `$ARGS` è vuoto, o chiede aiuto

Rispondere con che cosa fa la skill e **fermarsi**, senza iniziare l'intervista:

- parte da un blueprint **già applicato** (se non lo è, prima `xrcopilotlab-blueprint`);
- mostra la **mappa delle integrazioni**: per ogni entità, in che modo un'app la usa, che cosa
  funziona nel sandbox di App Builder e che cosa solo a progetto pubblicato, che cosa manca;
- propone **2-3 varianti** dell'app come mock-up in un artifact, con i dati di collaudo del
  blueprint; al più una è una scena 3D, e solo se il blueprint ha un luogo vero;
- scrive il **brief** per App Buddy;
- non crea niente in App Builder senza un sì esplicito (oggi la creazione è a mano, vedi § 8).

Chiudere chiedendo il tag del blueprint.

## Cosa leggere prima

| Quando | File |
|---|---|
| Sempre, al passo 2 | [`references/integrazioni.md`](references/integrazioni.md) — i sei modi A–F, i limiti del sandbox, le rotte verificate |
| Al passo 5 | [`references/archetipi.md`](references/archetipi.md), [`references/layout.md`](references/layout.md) — compresa la regola del 3D |
| Al passo 7 | [`references/brief.md`](references/brief.md) |
| Prima di dire che l'app funziona | [`references/collaudo.md`](references/collaudo.md) |
| Regole che valgono qui come in ogni blueprint | `.claude/rules/blueprints.md` (regole 1, 3, 5, 8), `.claude/rules/no-secrets-in-messages.md` |

## 1. Il blueprint applicato: manifest e inventario

Tutto in sola lettura, con la CLI (mai chiamate dirette all'API):

```bash
xrcopilotlab-bp status --env <env> --company <tenant>                 # è installato? quale run, quale versione
xrcopilotlab-bp pull --tag <TAG> --env <env> --company <tenant> --out <scratchpad>/<tag>.v<n>.yml
xrcopilotlab-bp status --run <runId> --env <env> --company <tenant>   # l'inventario: gli id veri
```

- **Si parte sempre da `pull`**, mai da un file che c'è già su disco (regola 8): può essere di un
  altro ambiente o vecchio. `--out` vuole il percorso di un **file**, non una cartella.
- La versione che conta è quella **del run completato**, non l'ultima pubblicata: un'app collegata a
  un agente che sul tenant non c'è ancora non funziona. Se le due differiscono, dirlo.
- Su staging il tenant di collaudo va passato con `--company` (memoria `staging-tenant-default`).

Dal manifest si leggono: agenti (con `embed` e `chatEndpoints`), orchestratori (step, pause umane,
`embed`), processi (webhook e **modulo di avvio**: i campi veri che un'app deve raccogliere), agent
task (trigger, webhook in ingresso, `outputActions`), ruoli, `testData`.

## 2. La mappa delle integrazioni

Per ogni entità del manifest che una persona userebbe, una riga:

| Entità | Modo | Nel sandbox | Pubblicata | Manca |
|---|---|---|---|---|

con i modi di [`integrazioni.md`](references/integrazioni.md):
**A** chat incorporata · **B** chat propria · **C** agente come servizio · **D** procedura su un
orchestratore · **E** pratica in un processo BPM · **F** lavoro asincrono di un agent task.

- Un'entità può avere più modi (un orchestratore di accoglienza è D, e A se ha `embed`); si scrive il
  modo che l'app userà davvero, e l'alternativa fra parentesi.
- Le entità interne (classificatori, step di servizio, task schedulati senza ingresso) **non** vanno
  nella mappa: un'app non ci parla.
- **Ciò che manca si dice per nome**: «`sportello-cup` non ha `embed`: per il modo A serve
  aggiungerlo», «nel sandbox il webhook del processo non passa dal relay (P2): l'avvio si prova solo
  a progetto esportato». Mai una riga verde su un modo che oggi non funziona.
- La mappa si mostra all'utente e si **rivede insieme** prima di andare avanti.

## 3. Ciò che manca nel manifest: una proposta, non una modifica

Se un'app ha bisogno di qualcosa che il manifest non ha — un `embed` su un agente, il webhook di un
processo, uno step `action` che richiami l'app, un endpoint di chat dedicato per il modo C — la skill
**scrive la proposta di modifica** (il frammento YAML e perché serve) e la passa a
`xrcopilotlab-blueprint`, che fa validazione, piano e approvazione come per ogni versione nuova.

Questa skill **non** fa `push` né `apply`. Se l'utente non vuole toccare il manifest, si prosegue con
i modi che funzionano già, e la mappa lo dice.

## 4. Intervista breve

Quattro domande, solo quelle che il manifest non risponde già:

1. **Chi usa l'app?** Una persona o più ruoli (cittadino e operatore, cliente e consulente). I ruoli
   del manifest sono un punto di partenza, non la risposta.
2. **Dove vive?** Un sito che esiste già (widget), una pagina a sé, una postazione di lavoro, uno
   schermo in un luogo fisico.
3. **Qual è il lavoro principale?** In una frase, con un verbo: «prenotare», «registrare una
   disdetta», «seguire le pratiche in scadenza».
4. **Marchio e tono**: nome, colori, registro (formale, istituzionale, amichevole). Se non ci sono,
   si usano quelli neutri e lo si scrive nel brief.

## 5. Archetipo e varianti di layout

1. **L'archetipo** viene dal profilo della mappa ([`archetipi.md`](references/archetipi.md)): assistente,
   strumento, procedura guidata, sportello pratiche, ingresso eventi, workspace. Si dice quale e
   perché, in una riga.
2. **2 o 3 varianti** che differiscono nel **modo di lavorare**, non nell'aspetto
   ([`layout.md`](references/layout.md)): chat al centro, cruscotto, procedura a passi, widget nel sito.
3. **Il 3D: al massimo una variante, e solo se serve.** Si propone solo se c'è un luogo vero, ogni
   oggetto della scena è un comando su un'entità del manifest con il suo modo, e gli esiti tornano
   nella scena. Le altre varianti sono **normali app web, senza 3D**. Se il 3D non aggiunge niente,
   lo si dice e le varianti sono tutte 2D. Mai tre scene 3D per lo stesso blueprint.
4. **I mock-up in un artifact**, uno per variante, con i dati di `testData` e i campi veri dei moduli
   di avvio dei processi. Funzionano: si clicca, si compila, si vede l'esito simulato. Per la
   variante 3D è una scena Babylon vera (versione esatta da cdn.jsdelivr.net; nell'app vera Babylon
   viene invece dall'immagine del sandbox).
5. Nell'artifact, sotto le varianti: la **mappa delle integrazioni** e **che cosa manca** prima di
   creare l'app. Chi guarda deve capire che cosa è simulato.

Mai inventare fatti del dominio (tariffe, orari, indirizzi, regole) per riempire il mock-up: quello che
il manifest non dà resta un segnaposto che nomina la fonte («orari dello sportello: dal documento
dell'URP»).

L'utente sceglie una variante.

## 6. Raffinare la variante scelta

Si itera sullo stesso artifact (stesso file, stesso URL): testi, ordine dei pannelli, che cosa vede
ciascun ruolo, stati vuoti ed errori (una risposta oltre 60 s, un processo che non parte). Le regole
della scena 3D restano ([`layout.md`](references/layout.md)); se una richiesta le viola — «fai volare la camera
fino allo sportello» — si spiega perché no e si propone l'alternativa.

## 7. Il brief per App Buddy

Si scrive seguendo [`brief.md`](references/brief.md): archetipo, variante, schermate, per ogni azione la rotta
`/api/*` del BFF e l'entità che chiama con il suo modo, i dati di prova, che cosa resta simulato nel
sandbox, le regole che App Buddy non deve aggirare (nessuna chiamata dal browser, nessun segreto,
start-and-poll oltre i 60 s, Babylon caricato con `import()`).

Il brief, la variante scelta e il mock-up vanno nell'**archivio del blueprint** (regola 8), dopo un sì:

```bash
xrcopilotlab-bp files put <scratchpad>/app --kind doc --name app --tag <TAG> --env <env> --company <tenant>
```

(una cartella con `brief.md`, `varianti.html` e la mappa) e si riporta il percorso del blob, non
«salvato in cartella». `files put` si ferma se un file somiglia a una credenziale: è il controllo che
serve.

## 8. Creare l'app — oggi a mano

Il verbo `xrcopilotlab-bp app` (piano, creazione con il kit, collaudo) è la fase 3 della #1566 e
aspetta l'allow-list del relay (P1). Fino ad allora:

- l'app si crea **dall'interfaccia di App Builder**, dall'utente, incollando il brief come primo
  messaggio; la skill non chiama l'API di App Builder;
- la creazione **consuma il budget mensile** del tenant: dirlo prima;
- per una demo in locale si può provare il brief nel container `spa-react` contro l'Api locale, che
  usa i dati di staging: ogni avvio di processo crea un'istanza vera e ogni chat consuma token, quindi
  **si chiede prima** di ogni chiamata che scrive.

## 9. Collaudo

[`collaudo.md`](references/collaudo.md): regole statiche sui file (nessuna chiamata dal client, nessun segreto,
`server/xrcopilot.ts` intatto, nessuna dipendenza nuova), build, contratti con i dati di prova, e per
la scena 3D uno screenshot che una persona guarda. Finché `app test` non c'è, le verifiche si fanno a
mano e si dichiara quali sono state fatte e quali no.

## 10. L'app entra nel manifest

Un'app collaudata diventa parte del blueprint, così `rollback` e `delete` la tolgono e una copia del blueprint
la porta con sé. La skill **non** scrive il manifest: consegna a `xrcopilotlab-blueprint`

- il frammento della sezione `apps` (design doc § 4-bis):
  ```yaml
  apps:
    - key: cruscotto-cup
      title: Cruscotto dell'operatore CUP
      kind: demo                  # demo: dati di collaudo, passi simulati · product: la usa il cliente
      template: spa-react
      layout: dashboard           # dashboard | chat | wizard | widget | scene3d
      uses: [copilot-cup, disdetta-riallocazione, percorso-tutela, richiamata-cup]
      source: apps/cruscotto-cup/
      brief: apps/cruscotto-cup/brief.md
  ```
- i sorgenti dell'app (senza `node_modules`, senza `.env`), che viaggiano con la versione come la knowledge;
- le modifiche alle entità trovate al passo 3.

**`kind`** si chiede all'utente, non si indovina: un'app costruita sul `testData`, con passi simulati
(per esempio il webhook di un processo nel sandbox), è `demo`.

Un manifest può avere **più app di demo**: chiavi uniche, `uses` che si sovrappongono.

**Le app si creano solo in produzione** (D16): App Builder apre le sessioni solo lì. Su staging il blueprint
porta sezione e sorgenti nell'archivio, ma l'apply non crea il progetto (`BP169`): l'app si mette a punto con la
demo locale (§ mock-up), non in App Builder di staging.

**Alla copia verso la produzione** di un manifest con app `kind: demo` (`promote --to prod`, `catalog install` in
prod) la CLI chiede «Quali app di demo copio?», con risposta proposta **tutte**; l'apply in produzione crea quelle
copiate, senza altre domande. Fuori produzione la copia porta tutto senza chiedere. Quando la skill guida una copia
verso la produzione senza terminale, la domanda si fa all'utente in chat, elencando le app, e la risposta va nel
comando (`--demo-apps all|none|<k1,k2>`): mai scegliere al suo posto.

**Che cosa fa già la CLI** (dal 27/10/2026):
- `validate` e `push` controllano la sezione (`BP158`–`BP160`) e i sorgenti (`BP161`: segreti, `.env`, chiamate a
  XRCopilot dal browser; `BP162`: id scritti nel codice, avviso) e `push` li archivia con la versione sotto
  `apps/<chiave>/`, senza `node_modules`, `dist` e cache. I sorgenti si mettono accanto al manifest, nella cartella
  di `source`, prima del `push`;
- `promote` e `catalog install` verso la produzione fanno la domanda delle app di demo (`BP163` per una chiave sbagliata);
- `catalog publish` rifiuta un'app con `origin.company` o `origin.projectId` (`BP164`).

- l'apply crea ogni app in App Builder, per ultima: il progetto con il prefisso (nome = `title`) e i sorgenti della
  versione come snapshot, senza aprire una sessione. L'app va in inventario (`App`): `rollback` e `delete` la
  tolgono. Solo in produzione: altrove il piano lo dice e non la crea (`BP169`). Con App Builder spento sul tenant
  l'app non si crea e il piano lo dice (`BP165`).

**Che cosa non fa**:
- un aggiornamento non riscrive un'app già creata se qualcuno l'ha modificata in App Builder dopo l'apply (`BP166`,
  con i file cambiati). Si chiede all'utente quale strada vuole: **sostituirla** (`apply --replace-apps <chiave>`:
  l'export del progetto va prima nell'archivio, `attachments/app-backup/<chiave>/`) oppure **tenere le modifiche**
  (si scarica l'export, se ne fanno i sorgenti del blueprint come per un'adozione, §11, e si fa il push di una versione
  nuova). Mai `--replace-apps` senza il suo sì. Un'app non modificata si aggiorna da sola; con una sessione aperta
  (`BP167`) si chiede di chiuderla;
- finché manca l'allow-list del relay (P1 della #1566), le app si applicano solo sui tenant di collaudo, non su
  quelli dei clienti.

## 11. Adottare un'app già fatta da un collega

Se in staging o in produzione c'è già un'app di App Builder utile per il blueprint, non si rifà: si adotta come
app di demo (design doc, D10-D13).

1. **Trovarla**, in sola lettura: `app list --env <env> --company <tenant>` (nome, autore, template, ultima
   modifica). Chiedere all'utente quale.
2. **Copiarla, non spostarla**: `app adopt --project <id> --from-env <env> --from-company <tenant> --tag <TAG>`
   scarica l'export. Il progetto del collega resta com'è e fuori da ogni inventario; sul tenant del blueprint
   nascerà un progetto nuovo con il prefisso.
3. **Controllare i sorgenti** ([`collaudo.md`](references/collaudo.md), livelli 1 e 2, più):
   - nessun id del tenant d'origine scritto nel codice: si sostituisce con la ricerca per nome (come
     `server/blueprint/catalog.ts`), sulla copia e **dopo un sì**;
   - `uses` si ricava dal codice; se l'app non chiama nessuna entità del blueprint, non è di questo blueprint e
     ci si ferma;
   - da produzione, prima di tutto si mostrano i sorgenti: possono contenere testi o dati del cliente.
4. **Il frammento** ha `kind: demo` e il blocco `origin` (ambiente, tenant, progetto, autore, chi adotta, quando),
   e passa a `xrcopilotlab-blueprint` come al passo 10.
5. **L'autore** resta registrato in `origin` e compare nel piano. Si suggerisce all'utente di avvisarlo; la skill
   non manda niente.

Il limite di una sola app 3D vale per le app che la skill propone e crea, non per quelle adottate.

Finché `app list` e `app adopt` non sono nella CLI (fase 3), l'export si scarica dall'interfaccia di App
Builder dall'utente, e la skill fa i controlli sulla cartella.

## Cosa non fare

- **Non scrivere il manifest** e non applicarlo: è `xrcopilotlab-blueprint`, con il suo cancello.
- **Nessun segreto** nel brief, nei mock-up, nell'artifact o in chat: chiavi di webhook, subscription
  key, `companyId` reali nel codice dell'app. Gli id delle entità non sono segreti; le chiavi sì.
- **Nessuna operazione amministrativa** dall'app: pubblicare processi, rigenerare chiavi, importare.
- **Nessuna scena decorativa**: se un oggetto non fa niente, non c'è.
- **Nessuna variante che finge**: un modo che nel sandbox non funziona si mostra come simulato.
- **Non completare compiti BPM per conto di una persona**: i compiti umani si completano nell'Hub, con
  l'identità di chi li fa (P5 è fuori da questa fase).
