---
name: xrcopilotlab-demo-video
description: Produce il video tutorial di un blueprint XRCopilotLab già applicato e verificato, per consegnarlo al cliente. Legge il manifest `.yml` del blueprint, ne ricava un brief con i nomi e le descrizioni degli elementi creati (topic, profili di knowledge, agenti, orchestratori, agent task, processi), lo consegna al repository demo-recorder-playwright e lancia il workflow che registra la panoramica e la carica su Azure. Usa quando l'utente chiede di "fare il video del blueprint", "registrare la demo di quello che abbiamo creato", "preparare il tutorial per il cliente", "generare il brief per il demo-recorder", o nomina il demo-recorder insieme a un blueprint. Usa anche per orientamento — "come si fa il video", "cosa serve" — o se la skill viene invocata senza argomenti: in quel caso risponde e si ferma. NON usare per registrare il tour generico dell'app o la demo di un commit: quelli hanno già i loro ingressi nel workflow del demo-recorder.
---

# xrcopilotlab-demo-video

Porta da «il blueprint è applicato e l'ho controllato» a «ecco il link del video da mandare al
cliente».

Non registra niente in prima persona e non tocca il tenant: **scrive un file** e lascia che sia il
demo-recorder a fare il resto. È deliberato — vedi [Perché passa da un file](#perché-passa-da-un-file).

## 0. Se ti chiamano senza argomenti

Rispondi con questo e **fermati**. Non chiedere il manifest, non iniziare niente.

- A cosa serve: dal manifest di un blueprint già applicato ricava un video di panoramica degli
  elementi creati, con sottotitoli, pronto da consegnare.
- Cosa serve: il file `blueprints/<tag>-<slug>.yml` del blueprint, il blueprint **applicato sul
  tenant hevodemo** e **verificato a mano**, e `gh` autenticato sull'organizzazione.
- Cosa non fa: non applica blueprint (quello è `xrcopilotlab-blueprint`), non collauda le risposte
  degli agenti (quello è `xrcopilotlab-blueprint-test`), non mostra chat né avvia processi — il video
  è in sola lettura.
- Poi la domanda: di quale blueprint vuoi il video?

## 1. Le due condizioni, prima di tutto

Chiedile esplicitamente e **non tirare a indovinare**: sono le due cose che fanno la differenza fra
un video utile e un video da buttare.

1. **Il blueprint è stato applicato sul tenant `hevodemo`?** La registrazione entra nell'app con
   l'account demo e seleziona la company `hevodemo`: se le entità sono state create su un'altra
   company, il video riprenderebbe uno spazio in cui non c'è niente di quello che deve mostrare, e il
   run fallirebbe sul primo elemento cercato. Se il manifest ha un `tenant.companyId` diverso da
   quello di hevodemo, dillo e fermati: o si riapplica lì, oppure serve un lavoro sul demo-recorder
   che oggi non c'è (la company è fissata in `demo-xrcopilotlab/app-session.ts`).
2. **Qualcuno ha guardato il risultato?** Il brief nasce dal manifest, cioè da quello che il
   blueprint *voleva* creare. Se un `apply` è andato a metà, o se qualcosa è stato poi cancellato a
   mano, il manifest lo ignora e il video andrebbe a cercare elementi che non esistono. Facoltativo
   ma utile: `xrcopilotlab-bp status --run <runId>` mostra l'inventario di cosa è stato creato
   davvero.

Se una delle due non è soddisfatta, dillo e fermati.

## 2. Leggi il manifest

Chiedi il percorso, o cercalo in `blueprints/`. Da lì prendi:

| Dal manifest | Va nel brief |
|---|---|
| `tag` | `tag` — e da lì il prefisso `BP-<TAG>-` dei nomi |
| `blueprint`, `version` | `blueprint`, `manifestVersion` |
| `tenant.topic` | `topic.name` |
| `tenant.existingTopic` | `topic.name` **e** `topic.displayName` con lo stesso valore: un topic riusato non viene prefissato |
| `knowledge[].name` | `knowledge[].name` |
| `agents[].name`, `agents[].model` | `agents[].name`, `agents[].model` |
| `orchestrators[].name`, `steps[].name` | `orchestrators[].name`, `orchestrators[].steps` |
| `agentTasks[].name`, `trigger` | `agentTasks[].name`, `agentTasks[].trigger` |
| `processes[].name` (o `spec.name`) | `processes[].name` |

I nomi si scrivono **senza prefisso**, esattamente come nel manifest: al prefisso pensa il
generatore. Se il manifest usa `tenant.topicId` (un GUID), il nome del topic lì non c'è: chiedilo e
mettilo in `topic.name` e `topic.displayName`.

Quello che **non** va nel brief: segreti, `systemMessage`, `connections`, `mcpServers`,
`businessRoles`, email dei membri, la `spec` dei processi. Il video non li mostra, e il brief finisce
committato.

## 3. Scrivi le descrizioni — è qui che serve la testa

Le `description` del brief diventano i **sottotitoli del video**, letti da un cliente che non conosce
la piattaforma. Quelle del manifest sono scritte per chi configura, e quasi mai vanno bene così.

Riscrivile: una frase, in italiano, che dica **a cosa serve quell'elemento per lui**, non com'è
fatto. Massimo 200 caratteri — oltre, il generatore taglia.

| Nel manifest | Nel brief |
|---|---|
| «Agente con skill legal-research collegato al profilo contabilita» | «Risponde sulle udienze in calendario e prepara il riepilogo della settimana.» |
| «Profilo RAG con knowledgeGraph su mapping.xlsx e giornale.xlsx» | «Indicizza il mapping contabile e il giornale: è la fonte che gli agenti consultano sui numeri.» |

Poi decidi la parte editoriale:

- `title` — il titolo del video, con il nome del cliente.
- `intro` e `outro` — la prima e l'ultima frase.
- `spotlight: true` su **uno o due** agenti (e al più un orchestratore): sono quelli in cui il video
  entra davvero, aprendo la scheda. Scegli quelli che spiegano meglio lo scenario. Il generatore ne
  apre al massimo due, e li sacrifica per primi se il piano non ci sta nel budget di step.

Mostra il brief all'utente e fatti dire se va bene **prima** di scriverlo da qualche parte.

Formato completo, campo per campo: [references/brief-format.md](references/brief-format.md).
Esempio: [references/brief.example.json](references/brief.example.json).

## 4. Consegna il brief al demo-recorder

Il brief vive in `hevolusinnovation/demo-recorder-playwright`, in
`demo-xrcopilotlab/briefs/<tag-minuscolo>.json`. Va **committato**: è l'input del workflow, ed è anche
la traccia di cosa è stato filmato e quando.

Se l'utente ha un clone del repo, scrivi il file lì, poi commit e push. Se non ce l'ha, senza clonare
niente:

```bash
gh api --method PUT \
  repos/hevolusinnovation/demo-recorder-playwright/contents/demo-xrcopilotlab/briefs/TAG.json \
  -f message="brief demo per il blueprint TAG" \
  -f content="$(base64 -w0 brief-locale.json)"
```

Se il file esiste già va passato anche `-f sha=<sha del file esistente>`, che si legge con
`gh api repos/hevolusinnovation/demo-recorder-playwright/contents/demo-xrcopilotlab/briefs/TAG.json --jq .sha`.

**Prima di committare, avvisa**: il brief contiene i nomi degli elementi configurati per quel cliente
e le frasi che descrivono il suo scenario. Se non devono stare in quel repository, il video si fa
lanciando il demo-recorder in locale.

## 5. Lancia la registrazione

```bash
gh workflow run record-demo-xrcopilotlab.yml \
  --repo hevolusinnovation/demo-recorder-playwright \
  -f brief_path=demo-xrcopilotlab/briefs/TAG.json \
  -f target_env=staging
```

`target_env` segue l'ambiente su cui il blueprint è stato applicato: `staging` o `prod`.

I quattro ingressi del workflow (`plan_path`, `explore_script`, `explore_commit`, `brief_path`) sono
**alternativi**: valorizzarne due fa fallire il run in partenza.

Poi riporta all'utente il link del run:

```bash
gh run list --repo hevolusinnovation/demo-recorder-playwright --workflow record-demo-xrcopilotlab.yml --limit 1
```

A fine run, nel riepilogo ci sono il piano generato e il link del video,
`demo-xrcopilotlab-blueprint-<n>-<sha>.mp4`. L'alias `demo-xrcopilotlab-latest.mp4` **non** viene
toccato: quello è il tour generico, non il video di un cliente.

## 6. Se il run fallisce

Il workflow calcola il piano e lo **rigioca a freddo** prima di registrare: quasi tutti i fallimenti
arrivano da lì, e dicono esattamente quale passaggio è saltato.

| Sintomo | Cosa vuol dire |
|---|---|
| `Brief non valido (…): - agents.0.name: …` | il brief non rispetta lo schema: correggi il campo nominato |
| Il piano non trova un elemento per nome | quell'entità sul tenant non c'è, o si chiama diversamente: manifest e realtà divergono — torna al punto 1 |
| `Nessun link a "/x" nel menu di navigazione` | regressione nel demo-recorder, non nel brief: segnalala lì |
| `La pagina è tornata su /company-selection` | idem: è un problema del runner |
| Il generatore dice che il blueprint non sta in 60 step | il blueprint è troppo grande per un solo video: dividi il brief in due, per scenario |

Un brief corretto che non regge alla riesecuzione è quasi sempre il segnale che **la UI di
XRCopilotLab è cambiata**: in quel caso vanno aggiornati i locator in
`demo-xrcopilotlab/blueprint/build-plan.ts` nel demo-recorder, non il brief.

## Perché passa da un file

Il plugin dei blueprint e questo non si conoscono. Fra i due passa un JSON, e basta.

Non è pigrizia: le skill di `plugins/blueprints/` sono una **copia sincronizzata** dal repository di
prodotto e non si modificano qui. Far emettere il brief a quel plugin vorrebbe dire legare il suo
rilascio alle esigenze di questo. Il manifest, invece, è già un contratto pubblico e versionato
(`blueprint.v1.schema.json`) e resta su disco dopo l'apply: leggerlo non costringe nessuno a cambiare
niente.

Per lo stesso motivo il brief non è il manifest: il generatore di piani del demo-recorder non deve
sapere cos'è uno schema blueprint v1, e il video ha bisogno di scelte editoriali che in un file di
provisioning non avrebbero senso.

## Cosa questo video non fa

In sola lettura, di proposito: nessuna chat con gli agenti (la risposta è imprevedibile nei tempi e
nel contenuto, e consuma token del tenant), nessun avvio di processi (creerebbe istanze vere), nessun
tenant diverso da `hevodemo`. Se servono, sono aggiunte da fare nel demo-recorder — il brief ha un
`briefVersion` apposta.
