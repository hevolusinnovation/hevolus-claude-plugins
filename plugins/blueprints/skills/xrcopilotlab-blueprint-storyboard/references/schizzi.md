# Gli schizzi

Il riferimento è una tavola a mano libera: linee nere sottili, tratteggio a righe per le ombre,
**un solo accento di colore per significato** (viola = AI, azzurro = decisione umana). Non è
un'illustrazione rifinita: deve far capire la scena e lasciare libero chi la disegna davvero.

## Due livelli, sempre insieme

1. **Lo schizzo SVG**, nel riquadro: semplice, leggibile, fatto con forme base.
2. **La descrizione di disegno**, nel Markdown: la scena scritta per chi la illustra o la dà a un
   generatore di immagini — soggetto, posizione, che cosa è viola e che cosa azzurro, camera,
   scritte. È la parte che non si perde se lo schizzo viene rifatto.

La descrizione non contiene nomi di strumenti di generazione né prompt tecnici: è prosa da
sceneggiatura.

## Come si disegna in SVG

- viewBox `0 0 640 360` (16:9), sfondo trasparente, nessuna immagine esterna.
- Tratto `stroke: currentColor`, `stroke-width` 1.6–2, `fill: none` o bianco; angoli leggermente
  irregolari (polilinee, non rettangoli perfetti) per l'effetto a mano.
- Ombre e volumi: `pattern` di linee oblique a 45° (una sola definizione, riusata).
- Persone: sagome stilizzate (testa tonda, tronco trapezoidale, braccia a linea), mai volti
  riconoscibili né tratti che richiamino una persona reale.
- Scritte negli schizzi: corsivo, corpo 11–13, **solo etichette anonime** («testo originale»,
  «proposta AI», «Designato: avv. Rossi» → «Designato: un professionista»).
- Colori da CSS variabili (`--ai`, `--umano`, `--attenzione`), così il tema scuro funziona.
- Ogni schizzo ha `role="img"` e un `aria-label` con la descrizione in una riga.

## Elementi ricorrenti (riusarli, non reinventarli)

| Elemento | Disegno |
|---|---|
| L'AI / un assistente | sfera o nodo viola con alone |
| Un passo affidato all'AI | riquadro viola con punto d'ingresso/uscita |
| Una decisione umana | riquadro azzurro, **luce azzurra** sul gesto (un tocco, una firma) |
| Documenti | fogli con righe; un contenitore di vetro per l'archivio |
| Knowledge | fascio di luce dal profilo verso l'assistente |
| Skill | moduli (tasselli) che si agganciano all'assistente |
| Il processo | corsie orizzontali (ruoli) con riquadri e frecce, come un diagramma a corsie |
| Tempo che passa | orologio, calendario, cambio di luce |
| Una differenza | riga ambra con punto esclamativo |

## Controlli

- Ogni schizzo si capisce da solo **senza** la battuta; la battuta non lo spiega, lo accompagna.
- Nessun elemento viola dove nel manifest decide una persona.
- Se uno schizzo SVG non rende la scena (movimento, prospettiva), si lascia **un segnaposto
  tratteggiato** con la descrizione di disegno dentro, come nell'ultimo riquadro delle tavole di
  riferimento («[ loghi ufficiali affiancati ]»): meglio un segnaposto onesto di un disegno
  sbagliato.
