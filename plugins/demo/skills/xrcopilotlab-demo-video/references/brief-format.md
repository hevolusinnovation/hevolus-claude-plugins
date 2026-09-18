# Il brief, campo per campo

Il brief è l'**unica** cosa che passa fra questo plugin e il demo-recorder. Lo schema vive lì
(`demo-xrcopilotlab/blueprint/brief-schema.ts`, Zod) ed è lì che viene validato: un brief non
conforme ferma il run **prima** che la registrazione parta, con l'errore che nomina il campo.

Questa pagina è la copia leggibile di quello schema. Se i due divergono, vince lo schema.

## Radice

| Campo | Obbligatorio | Cosa contiene |
|---|---|---|
| `briefVersion` | sì | sempre `1`. Cambia solo se il contratto cambia in modo non compatibile |
| `tag` | sì | il `tag` del manifest: maiuscolo, 2-20 caratteri. Da qui nasce il prefisso dei nomi |
| `blueprint` | sì | lo slug del manifest (`blueprint:`), fino a 60 caratteri |
| `manifestVersion` | no | la `version` del manifest applicata. Solo traccia |
| `env` | no | `staging` \| `preview` \| `prod` — dove il blueprint è stato applicato. Solo traccia: la registrazione gira comunque su `hevodemo` |
| `namePrefix` | no | default `BP-<TAG>-`. Si scrive solo se il planner ha cambiato convenzione |
| `title` | no | titolo del video, max 120 caratteri. Default: `<topic> — panoramica` |
| `intro` | no | primo sottotitolo, max 200 caratteri |
| `outro` | no | ultimo sottotitolo, max 200 caratteri |
| `topic` | sì | il topic che raccoglie tutto: è da lì che parte il giro |
| `knowledge` | no | i profili di conoscenza, max 40 |
| `agents` | no | gli agenti, max 40 |
| `orchestrators` | no | gli orchestratori, max 20 |
| `agentTasks` | no | gli agent task, max 40 |
| `processes` | no | i processi BPM, max 20 |
| `runId` | no | il `runId` dell'`apply`. Solo tracciabilità |

Nessun altro campo è ammesso: lo schema è strict, un campo di troppo fa fallire la validazione.

## Ogni entità

| Campo | Obbligatorio | Cosa contiene |
|---|---|---|
| `name` | sì | il nome **senza prefisso**, identico a quello del manifest |
| `displayName` | no | il nome per intero, quando non segue la regola del prefisso — un topic riusato con `existingTopic`, per esempio. Quando c'è, vince |
| `description` | no | il sottotitolo mostrato mentre l'entità è a schermo. Max 400 caratteri, ma oltre i 200 il generatore taglia: scrivine meno |

In più, per tipo:

| Tipo | Campo | Cosa contiene |
|---|---|---|
| agente | `model` | il modello, come nel manifest. Finisce nel sottotitolo dell'approfondimento |
| agente | `spotlight` | `true` per aprirne la scheda nel video. Il generatore ne apre al massimo due |
| orchestratore | `steps` | i nomi degli step in ordine, max 20: diventano «Il flusso passa per: A → B → C» |
| orchestratore | `spotlight` | `true` per entrare nel dettaglio. Al massimo uno |
| agent task | `trigger` | `manual` \| `scheduled` \| `webhook`. Senza `description`, decide la frase di ripiego |

## Cosa ne fa il generatore

Dal brief compone un piano di al massimo 60 step, in quest'ordine:

1. `/topics`, ricerca del topic, apertura.
2. Sulla scheda del topic: un passaggio per ogni profilo di conoscenza e per ogni agente, con la sua
   descrizione a sottotitolo.
3. Gli approfondimenti `spotlight`: apre la scheda dell'agente, la lascia a schermo, torna al topic.
4. `/orchestrators`, `/agent-tasks`, `/processes`: una tappa per sezione, solo se il brief ha entità
   di quel tipo.
5. La frase di chiusura.

Se non ci sta in 60 step, taglia in quest'ordine: prima gli approfondimenti, poi accorcia gli
elenchi — lasciando però un passaggio che dice quante entità non si vedono. Se non basta nemmeno
mostrandone una per sezione, fallisce con un messaggio esplicito invece di produrre un video
monco.

## Due vincoli che vengono dall'app, non dal formato

- **Gli agenti di un topic si raggiungono solo passando dal topic.** La voce di menu «Quick agents»
  (`/agents/all`) mostra soltanto i quick agent, mai gli agenti creati dentro un topic: per questo il
  giro parte sempre da `/topics`.
- **I nomi che si contengono a vicenda vanno distinti.** Il generatore se ne accorge da solo e chiede
  il match esatto, ma se due entità si chiamano «Agenda» e «Agenda legale» il video le mostrerà con
  quei nomi: se sono nomi di comodo, vale la pena cambiarli nel manifest prima di filmare.
