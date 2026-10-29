# Archetipi: da che cosa parte l'app (passo 5)

L'archetipo si sceglie dal **profilo della mappa delle integrazioni**, non dal nome del blueprint. Dice
di che genere è il lavoro dell'app, e quindi quali modi usa per primi e su quale template parte.

| La mappa ha soprattutto… | Archetipo | Template | Modi | Lavoro tipico |
|---|---|---|---|---|
| agenti con knowledge, niente processi | **Assistente** | `static-site` se basta l'embed, altrimenti `spa-react` | A, B | rispondere a domande |
| agenti usati come servizio, dati da arricchire | **Strumento** | `spa-react` | C, B | incollo un testo, ricevo una classificazione o un'estrazione |
| orchestratori | **Procedura guidata** | `spa-react` | D, C | una richiesta che passa per più passi, con pause umane |
| processi BPM avviati da webhook | **Sportello pratiche** | `spa-react` | E, D, A | aprire una pratica e seguirla fino all'esito |
| agent task con webhook in ingresso | **Ingresso eventi** | `spa-react` | F, C | un evento entra, un agente lo lavora, l'esito torna |
| un misto | **Workspace** | `spa-react` | secondo la mappa | più lavori per uno o più ruoli |

## Come si decide

1. Si contano le righe della mappa per modo, **solo quelle che l'app userà davvero** (le entità interne
   non ci sono).
2. Se un modo pesa più degli altri, l'archetipo è il suo. Se due o più modi pesano uguale, o l'app ha due
   ruoli con lavori diversi, è un **workspace**.
3. Si dice in una riga: «Workspace: tre processi con webhook (E) e due orchestratori rivolti a persone
   (D), per due ruoli».

L'archetipo **non** è il layout. Lo stesso workspace si può fare come cruscotto, come chat al centro o
come scena 3D: sono le varianti del passo 5 ([`layout.md`](layout.md)).

## Esempio: SANITA v7

| Entità | Modo | Ruolo |
|---|---|---|
| `accoglienza-cup` (orchestratore: classifica → smista → informa / richiamata) | D | cittadino |
| `copilot-cup` (orchestratore: regole → tempi → tutela) | D | operatore |
| `disdetta-riallocazione` (processo con webhook) | E | operatore |
| `percorso-tutela` (processo con webhook) | E via D (`copilot-cup` → `apri_tutela`) | operatore |
| `richiamata-cup` (processo con webhook) | E via D (`accoglienza-cup` → `apri_richiamata`), E dal modulo | cittadino (lo chiede), operatore (lo lavora) |
| `sportello-cup` (agente, senza `embed`) | B, A dopo la modifica | cittadino |

Fuori dalla mappa: `istruttoria-reclamo` e `preparazione-audit` (lavoro interno dell'URP e della
direzione), `gestione-reclami` (l'app manda i reclami all'URP e basta).

→ **Workspace**, due ruoli. Varianti proposte: la sala del CUP in 3D (cittadino e operatore nella
stessa scena), lo sportello nel sito dell'ASL (cittadino, widget), il cruscotto dell'operatore.

## I segnali che ingannano

- **Un solo agente non fa un assistente** se quell'agente è un passo di un orchestratore: l'app
  parla all'orchestratore (D).
- **Un processo senza webhook non fa uno sportello pratiche**: un'app non può avviarlo. O si propone il
  webhook (passo 3), o il processo resta fuori dalla mappa.
- **Gli agent task schedulati non fanno un ingresso eventi**: non hanno una porta da cui un evento
  entra.
