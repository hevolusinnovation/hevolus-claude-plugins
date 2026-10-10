# Giudicare le risposte

La CLI dice se i numeri ci sono e se le risposte sbagliate note sono comparse. Non dice se la
risposta è **giusta**: se ha risposto alla domanda, se lo ha fatto nel modo che il system message
prescrive, se ha aggiunto cose che non doveva. Questo lo giudichi tu, caso per caso, e lo scrivi
in `giudizio.md` accanto al report. È il documento che l'utente legge per primo.

Il modello è quello dei set di domande della demo (`demo-domande-orchestratore.md`,
`demo-domande-per-agente.md`): ogni domanda ha un **atteso** con numeri, una tolleranza, e le
**risposte sbagliate da riconoscere** con la loro spiegazione. Il giudizio si fa contro quello.

## I quattro criteri, in ordine

Si applicano nell'ordine, e il primo che fallisce decide il verdetto. L'ordine non è arbitrario:
un numero sbagliato rende irrilevante la forma, e una risposta che inventa è peggio di una
incompleta.

| # | Criterio | Domanda da farsi | Dove guardare |
|---|---|---|---|
| 1 | **Esattezza** | I numeri e i fatti attesi ci sono, entro tolleranza, con il segno giusto? | I controlli `numbers` della CLI, e i numeri della risposta elencati nel report («Numeri nella risposta») per quelli che la suite non dichiara |
| 2 | **Nessuna invenzione** | Ha aggiunto un dato che non c'è nei file, una regola che non ha citato, un'attribuzione «per somiglianza», una stima, un dato di un periodo diverso? | `expect.answer`, i `wrongAnswers`, le regole negative del system message |
| 3 | **Completezza** | Tutti gli elementi dell'atteso ci sono? Le sezioni prescritte compaiono (anche con «nessuno»)? I due livelli, le tre cifre, i quattro periodi? | `expect.answer` confrontato voce per voce |
| 4 | **Forma** | Il formato prescritto dal prompt è rispettato (una riga per termine, la riga finale, «non indicato» dove manca)? La risposta è nella lingua attesa? Riporta ciò che la domanda chiedeva di riportare, senza riassumere il dettaglio? | Il system message, `contains`/`matches`, la risposta |

Verdetti possibili, e quando:

- **pass** — i quattro criteri reggono. Un dettaglio di forma trascurabile (una parola diversa,
  l'ordine di due righe) non toglie il pass, ma va annotato.
- **parziale** — esattezza e nessuna invenzione reggono, ma manca qualcosa (criterio 3) o la
  forma è sbagliata (criterio 4). Tipico: il numero c'è ma senza il conteggio che lo produce;
  due sezioni su quattro; il livello di dettaglio senza quello di sintesi.
- **fail** — un numero sbagliato o assente, oppure un'invenzione, oppure una risposta sbagliata
  nota. Anche se tutto il resto è perfetto. *«Un numero preciso, plausibile e sbagliato, che in
  sala nessuno mette in dubbio»* è il caso peggiore, non un parziale.
- **in attesa di verifica** — il caso è fallito, ma la causa non si è potuta confermare da
  questa postazione (niente cloni, niente accesso al repository) ed è stata **consegnata a uno
  sviluppatore** ([`consegna-dev.md`](consegna-dev.md)). Non è un pass e non è un difetto
  confermato: è un fail di cui non sappiamo ancora di chi sia. Si scrive `🔁 in attesa di
  verifica`, con il sospetto della CLI e la data della consegna, e resta così finché non torna
  una risposta.

Un caso può essere `Passed` per la CLI e **fail** per te: tutti i frammenti ci sono, ma l'agente
ha aggiunto una scadenza inventata, o ha attribuito un conto «dove gli sembrava giusto». Conta il
tuo giudizio. Vale anche l'inverso: `Failed` per la CLI su un `contains` che il modello ha
riformulato legittimamente («9:30» scritto «nove e trenta»), **pass** per te — e in quel caso
si corregge l'attesa, non la risposta.

## Come si legge una risposta

1. **Prima i numeri, poi le parole.** Confronta ogni numero dell'atteso con quelli della risposta,
   con la tolleranza della suite (0,50 € nei set FinLogic). Il segno conta: un ricavo è negativo
   nel giornale. Un numero «vicino ma non entro tolleranza» è un fail, e lo scarto va scritto —
   spesso dice la causa (−698,70 è un risconto; 0,00 su tutto sono le chiusure incluse).
2. **Poi le risposte sbagliate note.** Se la CLI ne ha riconosciuta una, il verdetto è fail e la
   diagnosi è già scritta: riportala. Se ne riconosci una che la suite non elenca, **aggiungila
   alla suite** con la sua diagnosi: è così che il set si arricchisce, ed è il motivo per cui i
   documenti della demo hanno le righe ⚠️.
3. **Poi l'atteso, voce per voce.** Spunta ogni elemento di `expect.answer`. Ciò che manca è un
   parziale; ciò che c'è in più e non dovrebbe è un fail se è un dato, un'annotazione se è prosa.
4. **Infine il prompt.** Rileggi le regole del system message: «non calcolare», «scrivi non
   indicato», «una riga per termine», «chiudi con questa frase». Ogni regola violata è, come
   minimo, un parziale.

Due trappole che rendono un giudizio sbagliato:

- **Giudicare il lavoro dell'agente invece dei dati.** «Ha riconosciuto 5 scritture» è una frase
  sull'agente, non sui dati: il numero vero è 334. Se la domanda era formulata così, il difetto
  è nella domanda (§0.4 dei set FinLogic), e va riscritta come aggregazione.
- **Prendere per buono un numero perché è preciso.** 8.131 e 501 sono numeri esatti di qualcosa —
  non di ciò che era stato chiesto. Confrontare sempre con l'atteso, mai con la plausibilità.

## Il file `giudizio.md`

```markdown
# Giudizio · <blueprint> · <data del report>

Report: <scratch>/report/report.md · report <reportId> · tenant <guid> · run <runId>

| Caso | CLI | Giudizio | Perché (una riga) |
|---|---|---|---|
| `n4a-chiusure-contate` | Failed | **fail** | risponde 5 su 501: campione del recupero, non aggregazione (wrongAnswer riconosciuta) |
| `r1-bridge-sito-web` | Passed | **parziale** | Type e Ref giusti, riporta solo la voce di dettaglio: manca la sintesi (criterio 3) |
| `d1-tre-conti` | Passed | **pass** | tre saldi entro 0,50 €, nessun termine aggiunto |

## Casi da rivedere

### `n4a-chiusure-contate` — fail
- Atteso: 334 su 5.995, somma 0,00.
- Risposta: «ho riconosciuto 5 registrazioni…».
- Diagnosi: risposta sbagliata nota — il campione del recupero canonico. Sospetto KnowledgeGraph (Medium).
- Da fare: confermare su `CanonicalRetriever` / `AsksForAggregate`; se la domanda non viene
  instradata al piano analitico, è la libreria; se lo è e il conteggio è 5, è il tetto dei record.

## Attese da correggere nella suite
- `agenda-avviso-completo`: `contains: "9:30"` → accettare anche «ore nove e trenta» (`matches`).

## Segnalazioni
- #<n> in <repo> — <titolo> (casi: …)
```

La tabella è obbligatoria e va per prima. I casi da rivedere sono solo quelli non **pass**. Le
attese da correggere sono la manutenzione della suite: si fanno subito, nella stessa sessione,
e si rilancia il caso con `--only`.

## Quando la risposta è di un orchestratore

Si giudica l'**ultimo** passo, con un'avvertenza: solo il primo agente legge la domanda. Se la
risposta finale non contiene il dato chiesto, prima di dire «sbagliato» guarda gli output dei
passi intermedi nel report (`OrchestrationSteps`): se il dato c'è nel primo e sparisce nel
terzo, il fallimento è nel passaggio (`userMessageTemplate`, troncamento), non nell'agente — e
la domanda va riscritta chiedendo *esplicitamente* di riportarlo nella risposta finale.

## Quando la risposta è di un processo

Non c'è una risposta: c'è un case data. Si giudica la variabile di output dell'agent task come
si giudicherebbe una risposta dell'agente (numeri, invenzioni, completezza, forma), e si
verifica che l'istanza sia dove doveva essere — quello lo ha già fatto la CLI.
