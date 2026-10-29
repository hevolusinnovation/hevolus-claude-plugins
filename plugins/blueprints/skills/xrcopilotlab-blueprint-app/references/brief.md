# Il brief per App Buddy (passo 7)

App Buddy parte da un template e da un messaggio. Il brief è quel messaggio: deve bastare da solo,
perché App Buddy non vede il manifest, la mappa né questa conversazione. Ciò che non è scritto lo
indovina, e di solito indovina male gli id, i campi dei moduli e i tempi.

Si scrive in italiano (App Buddy risponde nella lingua del brief), in Markdown, e **senza segreti**:
gli id delle entità sì, le chiavi no.

## Struttura

```markdown
# <Nome dell'app> — <una riga su che cosa fa e per chi>

## Per chi e dove
<ruoli, luogo (sito esistente, pagina a sé, postazione), dispositivo>

## Il lavoro principale
<una frase con un verbo, per ciascun ruolo>

## Schermate
<una sezione per schermata: che cosa si vede, che cosa si fa, stati vuoti ed errori>

## Azioni e collegamenti
| Azione | Rotta del BFF | Entità | Modo | Nel sandbox |
|---|---|---|---|---|

## Entità del blueprint
<per ogni entità della tabella: nome sul tenant, id dall'inventario, input e output attesi;
per un processo, i campi del modulo di avvio con il tipo>

## Dati di prova
<da testData: i valori da usare nel preview, e che sono di prova>

## Che cosa resta simulato
<ciò che nel sandbox non funziona (P2, embed senza dominio) e come l'app lo mostra>

## Aspetto
<marchio, colori, tono; «neutro» se non dati>

## Regole che non si aggirano
<il blocco fisso qui sotto, più la sezione «Scena 3D» se la variante è 3D>
```

## Il blocco fisso delle regole

Va in ogni brief, così com'è:

```markdown
- Il browser non chiama mai XRCopilot: ogni dato passa da una rotta `/api/*` in `server/index.ts`.
- Nessun segreto in `client/`, e nessuna chiave scritta nel codice: le chiavi dei webhook si leggono
  da variabili d'ambiente del BFF (`HOOK_KEY_<PROCESSO>`). `.env.example` è protetto: il nome di ogni
  variabile nuova va nella sezione «Configurazione del progetto esportato» del `README.md`.
- Non modificare `server/xrcopilot.ts` né `.env.example` (sono protetti).
- Nessuna dipendenza nuova: `npm install` non funziona. Usa quello che è in `package.json`.
- Ogni chiamata che può superare i 60 secondi si avvia e si interroga: `startChatAsync` +
  `getConversationHistoryAsync`, `startOrchestrationExecutionAsync` + `getOrchestrationStatusAsync`.
  Mai `chatAsync` sincrono per un orchestratore.
- Nessuna operazione amministrativa: niente pubblicazione di processi, import, rigenerazione di chiavi.
- I compiti umani dei processi non si completano dall'app: si fanno nell'Hub. L'app mostra lo stato.
- Prima di dire che hai finito: `npm run build`.
```

## Sezione «Scena 3D» (solo per la variante 3D)

```markdown
## Scena 3D
- Babylon.js è già installato (`@babylonjs/core`, `@babylonjs/gui`, `@babylonjs/loaders`).
  Importa per percorso (`@babylonjs/core/Engines/engine`), mai dalla radice.
- La scena è un componente caricato con `React.lazy`: chi non la apre non scarica Babylon.
- Un Engine per canvas, `dispose()` nel cleanup dell'effetto (StrictMode lo esegue due volte).
- Camera ferma sul punto di vista di ciascun ruolo (<punti di vista>), rotazione ±20°, niente pan,
  zoom limitato, nessun volo automatico, un pulsante «Ricentra».
- Oggetti interattivi — ognuno con evidenziazione al passaggio, tooltip con un verbo e l'azione nel
  pannello accanto:
  | Ruolo | Oggetto | Al tocco | Rotta | Esito nella scena |
- Ogni azione della scena ha lo stesso comando nel pannello 2D (tastiera, lettore di schermo).
- Modelli: procedurali (primitive). Nessuna texture o modello da URL esterni.
- Effetti (ombre, evidenziazione, post-processing) creati **dopo** la camera, e passandole la camera.
```

## Come si riempie, in pratica

- **Gli id** vengono dall'inventario del run (`status --run`), mai scritti a memoria. Nel sandbox il
  `companyId` resta il segnaposto `{companyId}`: non si scrive l'id del tenant.
- **I campi dei moduli di avvio** si copiano dal manifest con nome, tipo e obbligatorietà: è il
  contratto che il processo si aspetta, e un nome diverso fa partire una pratica con dati vuoti.
- **I tempi**: per ogni azione, se può superare i 60 s (orchestratori, agenti con MCP), lo si scrive.
- **Il modo** di ogni azione è quello della mappa del passo 2, compreso «E via D».
- Un brief lungo va bene; un brief vago no.
