# La tavola

Una tavola è una pagina con **al massimo 6 riquadri** in griglia 3×2, letta da sinistra a destra e
dall'alto in basso. Un video da 80 s ne ha di solito tre.

## Il riquadro

| Campo | Contenuto | Regola |
|---|---|---|
| **Codice** | `1`, `2`, … ; `7A`/`7B` se una scena ha due inquadrature; `B1…B5` per la parte basilare (poi si rinumera in sequenza se serve); `FINE` per la chiusura | in alto a sinistra, sul disegno |
| **Schizzo** | disegno in bianco e nero con accenti viola/azzurro, formato 16:9 | vedi [`schizzi.md`](schizzi.md) |
| **Titolo** | 2–6 parole, un fatto («Il Control Plane», «Venerdì · posta ↔ calendario») | in grassetto sotto lo schizzo |
| **Tempo** | `0:20,5–0:28` + durata `7,5 s` in un'etichetta | l'inizio di una scena è la fine della precedente |
| **Battuta** | la voce, tra virgolette, in corsivo, con una barra viola a sinistra | senza voce: «musica · nessuna voce» |
| **Descrizione** | che cosa si vede e come si muove, in 1–2 frasi | include le note di camera |
| **A schermo** | le scritte che il montaggio sovrappone, separate da « · » | brevi, senza nomi veri |
| **Camera** | nello schizzo, in corsivo: «push-in lento», «orbita lenta», «carrello laterale», «crane up», «ferma» | una per scena |

## I tempi

- Si parte da `0:00`; ogni scena inizia dove finisce la precedente; **la somma è la durata**.
- 2–8 s a scena; la scena del problema e quella della frase chiave possono arrivare a 6, le
  scene del processo stanno su 3,5–4,5 s.
- Una scena con due inquadrature (`7A`/`7B`) divide i secondi, ma ha **una sola battuta** o due
  che si seguono: non due voci in conflitto.
- Il formato dei tempi: `m:ss` con la virgola per i decimali, come nelle tavole di riferimento.

## Il codice colore

Fisso, scritto in legenda a piè di pagina e usato negli schizzi:

| Colore | Significato | Esadecimale |
|---|---|---|
| **Viola** | l'AI: un assistente che legge, propone, scrive | `#7c3aed` (fondo `#ede9fe`) |
| **Azzurro** | una **decisione umana**: la persona conferma, assegna, scrive l'esito | `#0ea5e9` (fondo `#e0f2fe`) |
| Ambra | una differenza o un'attenzione (es. posta e calendario non coincidono) | `#d97706` |
| Grigio/nero | tutto il resto: luoghi, persone, oggetti | inchiostro |

Una scena in cui l'AI **decide da sola** una cosa che nel manifest decide una persona è un
errore da correggere, non una licenza narrativa.

## Intestazione e piè di pagina

- Intestazione: «<Scenario> · <caso> · STORYBOARD», a destra «<durata> s · TAVOLA n/N». Il «caso»
  è un'etichetta anonima («Studio legale associato») salvo autorizzazione.
- Piè di pagina: **legenda dei colori**, una nota («Le scritte “a schermo” si aggiungono in
  montaggio.») e a destra «v<n> · <data> · <giro di feedback>». **Nessun marchio.**

## Il Markdown sorgente (`storyboard.md`)

Una sezione per scena, così la prossima sessione la rilegge e la modifica:

```markdown
## 7A · Anna verifica e conferma · 0:40,5–0:44,3 (3,8 s)
voce: "Poi decide una persona."
camera: ferma
guida: giornata-pec · D1
disegno: la referente davanti a due schermi, testo originale e proposta; una luce azzurra parte dal dito
a schermo: La referente verifica e assegna
umano: sì
```

Il campo `umano` (sì/no) alimenta il colore e il controllo «l'AI non decide al posto della persona».
