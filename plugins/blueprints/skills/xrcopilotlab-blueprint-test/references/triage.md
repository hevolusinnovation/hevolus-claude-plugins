# Triage: da un fallimento al componente

Il report porta per ogni caso non passato un **sospetto** calcolato dalla CLI
(`BlueprintTestTriage`): componente, fiducia, ragione. Questa pagina dice come leggerlo, come
confermarlo leggendo il codice, e dove si apre la segnalazione. La fiducia conta: **High** è un
errore esplicito del componente, **Medium** un comportamento osservato nel log, **Low**
un'inferenza da un'assenza — e un'assenza si conferma, non si segnala.

## I componenti e i repository

| Componente | Che cos'è | Dove si guarda (il codice) | Segnalazione |
|---|---|---|---|
| **Manifest** | il blueprint: system message, modello, partizione della knowledge, attese della suite | `blueprints/<nome>.yml`, `blueprints/tests/` | nessuna: si corregge il file |
| **KnowledgeGraph** | ingestione, retrieval, canonical store, selezione delle sorgenti | pacchetto `XRCopilotLab.KnowledgeGraph`, clone in `../xrcopilotlab-knowledge-graph` | issue nella webapp, label `kgraph` |
| **Skills** | selezione (LLM tool-calling, keyword) ed esecuzione delle skill | pacchetti `XRCopilotLab.Agent.*`, clone in `../xrcopilotlab-agent-framework` (`platform/lib-skills`, `skills/<dominio>`) | issue nella webapp, label `skills` |
| **Orchestration** | il motore degli orchestratori: passi, parallelismo, mappature, HITL | `Api/Services/Orchestration/`, `Api.Common/Services/*Orchestration*` | issue nella webapp, label `blueprints` |
| **Process** | il motore BPM: istanze, token, agent task, work item, webhook | `Core/Services/Process/`, `Api/Endpoints/Process*`, `Api.AsyncOperations` | issue nella webapp, label `blueprints` |
| **WebApp** | la pipeline della chat, intent, routing, plugin, persistenza | `Api/Services/Agents/AgentServiceBase.cs`, `Api.Plugins/` | issue nella webapp, label `blueprints` |
| **Environment** | rete, credenziali, tenant, run, lentezza | — | nessuna: si sistema e si rilancia |

Tutte le issue si aprono in `hevolusinnovation/xrcopilotlab-webapp-dotnet`, anche per le
librerie: è il repository in cui l'AI Team pianifica, e la label dice il componente. Il clone
della libreria è dove si legge il codice per confermare il sospetto.

Le versioni che il tenant consuma: `KnowledgeGraphVersion` in `src/XRCopilotLab/KGraph.props`,
`AgentFrameworkVersion` in `src/XRCopilotLab/AgentFramework.props`. Vanno in ogni segnalazione a
una libreria — ma attenzione: sono le versioni **del branch**, non necessariamente quelle
deployate sull'ambiente. La versione deployata si legge dal workflow di deploy dell'ambiente
(skill `xrcopilotlab-cicd`) o dal `CHANGELOG.md` della libreria confrontato con la data del deploy.

## La tabella: evidenza → sospetto → come confermare

| Evidenza nel report | Sospetto (fiducia) | Come confermare prima di segnalare |
|---|---|---|
| L'errore nomina `KnowledgeGraph`, `KGraph`, `Gremlin`, `canonical`, `vector store` | KnowledgeGraph (High) | Cercare il messaggio nel clone della libreria: `grep -rn "<frase>" ../xrcopilotlab-knowledge-graph/xrcopilotlab-knowledge-graph-lib-dotnet`. Se lo trovi, hai il metodo. Se è un'eccezione generica (`NullReference`), guarda chi la solleva: se è `AgentServiceBase` che passa un parametro nullo alla libreria, è WebApp |
| L'errore nomina `SkillOrchestrat`, `IAgentExecutor`, `XRCopilotLab.Agent` | Skills (High) | Stesso metodo nel clone dell'agent-framework. Distinguere `lib-skills` (selezione, pipeline) da `skills/<dominio>` (l'esecutore): la segnalazione dice quale |
| Esito `Error` con `401/403/404/timeout` | Environment (High) | 404 senza `api-version` è APIM (regola `client-api-version.md`); 401 è la chiave; timeout è l'ambiente. Non è un bug finché non si ripete con l'ambiente a posto |
| Esito `Error`, altro testo | WebApp (Medium) | Leggere la risposta grezza in `report.json`; cercare il messaggio in `Api/` |
| Istanza `Faulted` | Process (High) | `ErrorMessage` dell'istanza e gli eventi: se l'ultimo è `AgentTaskDispatched`, il passo automatico non è tornato — guardare `Api.AsyncOperations` (il consumo Service Bus) e l'agent task in SQL |
| `AgentTaskDispatched` senza `ActivityCompleted` entro il timeout | Process (Medium) | Come sopra; verificare che `Api.AsyncOperations` dell'ambiente sia su e consumi la coda (skill `xrcopilotlab-cicd`, sintomo «chat non risponde») |
| `process.waitingAt` fallito con altri eventi | Process (Medium) | Confrontare la sequenza degli eventi con il grafo del processo (`xrcopilotlab-bp validate --graph`): se il motore ha seguito un ramo diverso, guardare la condizione del gateway e il **tipo** del valore nel case data |
| Un passo orchestratore `Failed` | Orchestration (High) | L'errore del passo; se nomina un agente, ripetere la domanda a quell'agente da solo con un caso `agent`: se fallisce anche lì, non è l'orchestratore |
| `steps` fallito, nessun passo in errore | Orchestration (Medium) | Il flusso: condizione, switch, mappatura degli output (`agentOutputs`) |
| `knowledge.used` fallito, nessun chunk né file | KnowledgeGraph (Low) | **Tre verifiche in ordine**: (1) il profilo è attivo e l'indicizzazione è finita — stato del profilo in SQL / UI del topic (WebApp); (2) la domanda ha parole che compaiono nel nome di un file — se no è la selezione per nome, cioè Manifest; (3) solo se 1 e 2 sono a posto: la libreria. Per un file tabellare, riprodurre con `AssessmentRegressionTests` puntando `KG_ASSESSMENT_DATA` alla cartella dei file |
| `knowledge.files` fallito, altri file consultati | Manifest (Medium) | La partizione: `xrcopilotlab-bp suggest <manifest> --files <cartella>` mostra i vincoli sui nomi. Se la partizione è giusta e il file nominato nella domanda non è stato scelto, è `SelectSourcesForQuestion` nella libreria |
| `skills` fallito con `SkillExecution Result=ValidationFailed` | Skills (High) | Il parametro `Message` del passo dice cosa ha rifiutato la validazione |
| `skills` fallito con `Result=NoMatch` | Skills (Medium) | Prima l'assegnazione della skill all'agente in SQL (`AgentSkill`); poi il selettore: skill `xrcopilotlab-trace-skill-flow` con la domanda |
| `skills` fallito, **nessun** passo `SkillExecution` | WebApp (Medium) | L'intent (`DetectUserIntent` nel log): `Greetings`, `Gratitude`, `Clarification` non abilitano le skill — regola in `.claude/rules/skill-execution-flow.md`. Se l'intent è sbagliato per quella domanda, è `IntentPluginOpenAi`; se è giusto, la domanda è scritta male |
| `noSkills` fallito | Skills (Medium) | Il selettore ha letto un intento che non c'era: riportare domanda e skill scelta |
| `noError` fallito, `responseType=Error` | WebApp (Medium) | Il messaggio è l'errore dell'API (`BuildErrorResponse`): cercarlo in `Api/Endpoints/AgentEndpoints.cs` e `AgentServiceBase` |
| Solo `language` fallito | WebApp (Low) | `RecognizeLanguage` nel log dice cosa ha riconosciuto; se giusto, il prompt non impone la lingua |
| Solo `maxSeconds` fallito | Environment (Low) | Le durate dei passi nel log: se `GetCompletion` domina, è il modello; se `GetHistory`/`SaveHistory`, è Cosmos |
| Log puliti, `contains`/`notContains` falliti | Manifest (Low) | Il system message: la regola violata c'è? è ambigua? Il modello (`references/modelli.md` della skill blueprint): un compito di estrazione su un modello di fascia sbagliata. L'attesa: un frammento che il modello riformula legittimamente |

Per i casi di processo la lettura degli eventi — cosa vuol dire fermarsi a `InstanceStarted`, a
`AgentTaskDispatched`, o su un'attività diversa da `waitingAt` — è in
[`bpm.md`](bpm.md) § «Leggere gli eventi di un'istanza», insieme all'elenco di ciò che il motore
**non** fa e che quindi non è un bug.

## Tre distinzioni che decidono il repository

**Libreria o webapp?** La libreria fa il lavoro; la webapp la chiama. Un errore dentro un
metodo della libreria è della libreria. Un errore perché la webapp le ha passato la cosa
sbagliata — un `CanonicalStore` non assegnato sull'istanza di query, un profilo non attivato, un
parametro nullo — è della webapp, anche se lo stack trace finisce nella libreria. Guardare
**chi** ha costruito l'oggetto.

**Codice o manifest?** Se cambiando il prompt o la partizione il caso passa, era il manifest.
Provarlo costa una versione nuova del blueprint (rollback + push + apply) o, più a buon mercato,
lo stesso prompt provato dal playground della UI: se lì funziona, non è il codice.

**Bug o comportamento?** Un agente che non trova un dato in un file che non nomina non è un
bug della knowledge graph: è la regola della selezione per nome. Un agente che inventa non è
un bug della webapp: è il prompt o il modello. Prima di segnalare, chiedersi se il componente
sta facendo ciò per cui è progettato — le regole in `.claude/rules/` e i `CLAUDE.md` delle
librerie lo dicono.

## Quando fermarsi

Se dopo la verifica il sospetto resta a fiducia bassa e non hai un'evidenza del componente,
l'esito è **non attribuito**: si scrive nel `giudizio.md` con le ipotesi e con ciò che
servirebbe (un log dell'ambiente, una prova dal playground, la versione deployata). Non si apre
una issue «per vedere».
