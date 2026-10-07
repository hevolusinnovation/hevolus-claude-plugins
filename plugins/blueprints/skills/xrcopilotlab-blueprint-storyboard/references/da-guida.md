# Dalla guida allo storyboard

Lo storyboard **segue la guida per il cliente** ([`xrcopilotlab-blueprint-guide`](../../xrcopilotlab-blueprint-guide/SKILL.md)):
stessa storia, stesso ordine, stesse parole. Il cliente che ha visto la guida riconosce il video; chi
conduce la demo ritrova i punti `D1…Dn`.

## Dove si legge

1. L'artifact «<Scenario> — guida»: `Artifact` `action: "list"`, poi `action: "read"` con
   `path: "guida.md"`. Ogni slide ha un commento `<!-- slide: <id> · atto: <atto> · demo: <Dn> -->`.
2. Se la guida non esiste: si propone di scriverla prima con `xrcopilotlab-blueprint-guide`, oppure
   si ricava la storia dal manifest **con la stessa struttura** (tabella sotto) e lo si dichiara.

## Da slide a scena

| Atto della guida | Slide | Scena dello storyboard |
|---|---|---|
| apertura | `apertura-frase` | la scena che fa sentire il costo del problema (una persona, un oggetto) |
| il problema | `problema` | la scena dell'origine del disordine: da dove arriva il lavoro |
| *(la parte basilare)* | — | le scene didattiche di [`base-piattaforma.md`](base-piattaforma.md): non sono nella guida, le aggiunge la skill |
| la storia | `giornata-*` | **una scena per momento**, con l'**ora nel titolo** come nella guida («Lunedì, 15:05 · arriva una PEC») e **una persona, un caso** |
| la storia | `flusso` | **l'unico disegno**: il flusso in al massimo otto passi, colorato per chi lo fa; il primo e l'ultimo sono una persona |
| chi fa che cosa | `ruoli` | tre colonne sempre uguali: l'AI · le persone · le regole fisse, due voci ciascuna |
| chi fa che cosa | `ruoli-non-fa` | **che cosa l'assistente non fa**, in positivo, al massimo tre punti sullo schermo |
| provatelo voi | `esempio-*` | non entrano: sono domande da fare dal vivo; se serve, una sola scena con la domanda scritta male |
| che cosa cambia · come è fatto | `cambia`, `fatto-*` | non entrano nel video breve |
| chiusura | `chiusura-*` | la frase chiave e la chiusura |

## I punti di demo

Una slide `demo-Dn` o un `esempio-*` con `demo: Dn` è un punto in cui la sessione **mostra l'ambiente
dal vivo**. Nello storyboard la scena corrispondente porta il codice `Dn` (campo `guida:` nel
Markdown, etichetta «dalla guida» nella pagina): è la scena che, nel video finale, può diventare una
**registrazione dello schermo reale** invece di uno schizzo (§ «Il video» di `SKILL.md`).

## Regole prese dalla guida

- **Il titolo dice il messaggio**: «Il rinvio riapre la pratica da solo», non «Rinvio».
- **Un momento per scena**, con l'ora quando c'è, e un solo caso: mai due storie in una scena.
- **Niente esiti di collaudo** e niente difetti, come nella guida per il cliente.
- **Il linguaggio è quello della guida** (`linguaggio.md`), con l'eccezione della parte basilare.
- **I nomi** sono quelli anonimizzati: la guida può dire «Anna» e «avv. Marino», lo storyboard dice
  «la referente» e «un professionista» salvo autorizzazione del cliente per questo video.
- Se la guida e il manifest si contraddicono, vale il manifest, e lo si segnala all'utente.
