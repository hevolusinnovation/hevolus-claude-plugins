# Registrare l'applicazione vera: `xrcopilotlab-demo`

Il video con lo schermo reale lo registra `xrcopilotlab-demo`, il banco di registrazione
([`demo-recorder-playwright`](https://github.com/hevolusinnovation/demo-recorder-playwright)) in forma di
comando, come `xrcopilotlab-bp`: il plugin `blueprints` porta il lanciatore, che al primo uso scarica il
pacchetto (Node incluso) da una release `demo-v*` e ne verifica l'impronta. Questo sostituisce la skill
`xrcopilotlab-demo-video`, che non serve più: la panoramica di un blueprint è il sottocomando `tour`.

## Prima di registrare

```bash
xrcopilotlab-demo doctor
```

Dice che cosa manca: il browser (`xrcopilotlab-demo install`, una volta, ~150 MB), `ffmpeg`
(`brew install ffmpeg` / `winget install ffmpeg`) e **le credenziali dell'account demo**, in
`~/.xrcopilotlab-demo/auth.json`. Quel file non lo scrive né lo legge la skill: lo mette chi mantiene il
banco, e non finisce in un repository né in una conversazione.

**L'ambiente non si assume.** Senza `--env` il comando si ferma. La skill lo ha già chiesto al §1 di
`SKILL.md` (staging come predefinito) e lo passa uguale a ogni comando. Una registrazione apre
conversazioni e istanze sul tenant: dire a chi la chiede su quale ambiente e quale company, e attendere il sì.

## Due modi

| | Che cosa fa | Quando |
|---|---|---|
| `tour --brief brief.json` | Panoramica **in sola lettura** di un blueprint già applicato: topic, profili, assistenti, orchestratori, agent task, processi, con un sottotitolo ciascuno. Calcola il piano dal brief e lo rigioca a freddo prima di registrare | Basta un video tutorial di ciò che il blueprint ha creato |
| `record --plan piano.json` | Registra un piano: azioni sull'app (`navigate`, `click`, `fill`, `expectVisible`, `pause`), ciascuna con un sottotitolo e, se serve, il codice di una **scena** | Le scene `Dn` dello storyboard |

L'uscita (cartella `--out`, default `./demo-out/<data>`):

| File | Contenuto |
|---|---|
| `video.mp4` | Il video, già tagliato dei secondi di ingresso nell'app |
| `scene-timings.json` | Inizio e fine di ogni scena **nel tempo di quel video**, con i sottotitoli |
| `clips/<scena>.mp4` | Un clip per scena, senza audio |
| `plan.json` | Il piano che è stato registrato |

## Il brief del `tour`

Un file per blueprint, scritto dalla skill leggendo il manifest (non dal manifest tal quale: il video non
ha bisogno di uno schema di quindici sezioni). Formato completo nello schema del banco
(`demo-xrcopilotlab/blueprint/brief-schema.ts`, esempio in `brief.example.json`); in breve:

| Dal manifest | Nel brief |
|---|---|
| `tag`, `blueprint`, `version` | `tag`, `blueprint`, `manifestVersion` |
| `tenant.topic` (o `existingTopic`, con `displayName`) | `topic.name` |
| `knowledge[].name` | `knowledge[].name` |
| `agents[].name`, `model` | `agents[].name`, `model` |
| `orchestrators[].name` e i nomi degli step | `orchestrators[].name`, `steps` |
| `agentTasks[].name`, `trigger` | `agentTasks[].name`, `trigger` |
| `processes[].name` | `processes[].name` |

I nomi si scrivono **senza prefisso** (`BP-<TAG>-` lo aggiunge il generatore). **Non** vanno nel brief:
segreti, `systemMessage`, connessioni, server MCP, ruoli, email, la `spec` dei processi. Le `description`
diventano i sottotitoli: una frase, in italiano, che dice **a che cosa serve** quell'elemento per il cliente,
al massimo 200 caratteri. `spotlight: true` su uno o due assistenti (e al più un orchestratore) per entrarci.

Il brief si **mostra all'utente prima di usarlo**: contiene i nomi di ciò che è configurato per un cliente.
Si valida con `xrcopilotlab-demo validate --brief brief.json`.

## Il piano delle scene `Dn`

Ogni scena `Dn` dello storyboard diventa un gruppo di step che comincia con `"scene": "D1"`:

```json
{
  "demoable": true,
  "title": "Agenda di studio",
  "steps": [
    { "action": "navigate", "path": "/agents", "scene": "D1", "narrate": "Gli assistenti dello studio." },
    { "action": "click", "target": { "by": "role", "role": "link", "name": "Agenda" } },
    { "action": "expectVisible", "target": { "by": "text", "text": "Istruzioni" } }
  ]
}
```

I selettori dipendono dalla pagina e **non si inventano**: si prendono da un piano che già gira (gli
esempi del banco) o dall'esplorazione dell'app. Una scena di cui non si hanno selettori verificati resta
uno schizzo e lo storyboard lo dichiara. Il giro è in **sola lettura**: niente chat con gli assistenti,
niente avvio di processi, finché il banco non sa farlo con garanzie.

`--no-captions` toglie i sottotitoli sovrapposti: nello storyboard c'è la voce, e quelli incisi si
sovrapporrebbero ai nostri.

## Il montaggio

Con `scene-timings.json` e i clip la skill monta il video finale con `ffmpeg`: per ogni scena del
copione, il clip registrato (se c'è) oppure il fotogramma dello schizzo, per la durata della scena, con
sopra la traccia della voce (`narrazione.mp3`). Le scene registrate durano quanto il loro clip: se il clip
è più lungo della scena si accelera o si taglia, mai si altera la voce; se è più corto si tiene
l'ultimo fotogramma.

## Se qualcosa non va

| Sintomo | Che cosa vuol dire |
|---|---|
| `Il piano non trova un elemento per nome` | l'entità non c'è su quella company, o si chiama in un altro modo: manifest e tenant divergono |
| Il piano non regge alla riesecuzione a freddo | la UI è cambiata: vanno aggiornati i selettori nel banco, non il brief |
| La pagina torna su `/company-selection` | la company indicata non è fra quelle dell'account demo |
| `Mancano le credenziali` | manca `~/.xrcopilotlab-demo/auth.json`: lo mette chi mantiene il banco |
