# Origine del kit isometrico

`iso-kit.mjs` e `iso.css` sono copiati **senza modifiche** dalla skill `anatomy`
(https://github.com/wheresryan22/anatomy, licenza MIT, © 2026 Ryan: il testo è in `LICENSE-anatomy-MIT.txt`
e va conservato con questi file). Copia del 12/10/2026, dall'installazione locale della skill, voce
`[Unreleased]` del suo CHANGELOG (la skill non ha numeri di versione).

Non si copiano gli esempi, gli script di verifica, i moduli WebGL e 3D: servono solo il nucleo
(camera, solidi, ombreggiatura a quattro toni, rendering SVG a stringhe) e i suoi stili.

| File | Che cos'è |
|---|---|
| `iso-kit.mjs` | il nucleo: `fitProjection`, `extrude`, `slabOf`, `cylinder`, `solidSvg`, `lineSvg`, `wireSvg`, `plateHtml`… |
| `iso.css` | gli stili del kit (`ISO_CSS` scritto su file), per `class="iso"` |
| `iso-bpm.css` | **nostro**: porta i colori del kit sulla tavolozza della pagina (chiaro/scuro) e aggiunge i toni viola e ambra |
| `inline-kit.sh` | **nostro**: avvolge il kit in una funzione, così le sue funzioni non si scontrano con quelle della pagina |

Per aggiornare: ricopiare i due file dalla skill `anatomy`, rilanciare l'assemblaggio e controllare la
mappa a occhio in chiaro e in scuro. Non si modificano a mano: i ritocchi stanno in `iso-bpm.css` e nel
disegnatore (`../mappa-isometrica.js`).
