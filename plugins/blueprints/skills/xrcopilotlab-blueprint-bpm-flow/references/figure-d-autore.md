# La figura d'autore di un processo (facoltativa)

Una figura isometrica per processo: un **oggetto fisico** il cui funzionamento è il processo — un nastro che porta
le comunicazioni, un arco che le legge, un bivio che le smista, una scrivania dove una persona controlla. Non è
il diagramma BPMN (quello resta com'è): è il **colpo d'occhio** da mettere in testa alla scheda, nel PDF e nel Word.

Esempio completo: [`../assets/iso/esempi/presa-in-carico.mjs`](../assets/iso/esempi/presa-in-carico.mjs)
(≈ 60 parti, 110 KB di SVG). Il kit è quello della skill `anatomy` ([origine e licenza](../assets/iso/ORIGINE.md)).

## Quando farla

Solo su richiesta, o quando il blueprint va davanti a un cliente. Costa: una figura vera, con molte parti piccole e
precise, richiede da mezz'ora a un'ora e mezza. **Una per i processi che contano**, non una per ogni processo.
Serve **Node 20 o più recente**; non serve nient'altro (nessun `npm install`).

## Come si fa

1. **Leggere il processo** (la scheda e il grafo): che cosa arriva, chi fa che cosa, dove decide una persona, come finisce.
2. **Scegliere l'oggetto**, in una frase: «che cosa si muove e che cosa significa». Mai un diagramma con scatole e frecce.
3. **Mappare i passi sugli stessi colori della pagina**: azzurro persona, viola persona + assistente, verde automatico,
   ambra bivio (`tone: "blue" | "violet" | "green" | "amber"`; il resto è grigio). Un pezzo colorato per ogni passo che conta.
4. **Scrivere lo script** partendo dall'esempio: stesso scheletro (`fitProjection`, funzioni che restituiscono SVG,
   composizione «dal fondo al davanti»). Almeno 40 parti: base su piedi, righello inciso, viti, bordi, targhetta.
5. **Ordine di disegno**: dietro prima, davanti dopo; ciò che sta sopra un altro pezzo si disegna dopo quel pezzo; un pezzo
   che ne avvolge un altro (l'arco sul nastro) si divide in metà posteriore e anteriore.
6. **Costruire e guardare**: `node mio-script.mjs uscita.svg --preview` scrive l'SVG e due pagine (`-dark.html`, `-light.html`)
   da aprire nel browser. Guardare **in chiaro e in scuro**, e ingrandire a 4×: ogni linea deve finire su qualcosa.
7. **Consegnare**: l'SVG si chiama `<chiave-del-processo>.svg` (la chiave è quella del manifest) e va in una cartella;
   `assembla.sh` la riceve come quarto argomento. Titolo, didascalia e dato di lettura stanno in `spiegazioni.yml`:

```yaml
flussi:
  "Presa in carico di una comunicazione (civile)":
    figura:
      titolo: "Presa in carico"                 # in alto a destra nella cornice
      didascalia: "Le comunicazioni entrano dalla vaschetta, l'assistente le legge, il bivio le smista…"
      dato: "arrivo → controllo → pratica chiusa"   # in basso a destra
```

```bash
sh <skill>/assets/assembla.sh $S/blocchi.yml $S/spiegazioni.yml "<Scenario>" $S/figure > $S/flussi-bpm.html
```

## Dove stanno i file (regola dei blueprint)

Lo script e l'SVG di un blueprint **non vanno nel repository**: sono file del blueprint e vivono nell'archivio del tenant
(`xrcopilotlab-bp files put --kind attachment …`), con una cartella di appoggio temporanea su disco. Nel repository restano
solo gli esempi di questa skill.

## Regole del disegno (in breve)

- **Solidi, non fili**: ogni parte è piena e dipinta in ordine; niente linee nascoste né tratteggi per «vedere attraverso».
- **Toni**: base e piedi `lo`, struttura `mid`, soggetto `hi`; un solo pezzo `lit`. Il colore solo dove il colore è il soggetto.
- **Le linee finiscono su qualcosa** (una faccia, un'altra linea, un pallino): niente frecce o etichette che fluttuano.
  Le parole nel disegno sono al massimo una, incisa (la targhetta).
- **Non dire più del manifest**: ogni pezzo è un passo vero; niente pezzi «per bellezza» che somigliano a passi.
- **Il movimento è facoltativo, ma una figura che si muove spiega meglio.** Si fa con SMIL (`animate`, `animateTransform`,
  `animateMotion`), senza script e senza WebGL: le comunicazioni che scorrono sul nastro, un timbro che batte, una lancetta che
  oscilla. Due regole perché PDF e Word (che non animano e **tolgono** ogni animazione) restino giusti: un movimento di una parte
  sta in un elemento `animate*` figlio della parte, così senza animazione la parte resta a riposo; ciò che si muove in
  un gruppo a parte sta in `<g class="iso-anim">`, e ciò che deve vedersi al suo posto a riposo in `<g class="iso-static">`
  (la pagina nasconde `.iso-static` mentre anima). Con «riduci movimento» la pagina mostra la figura ferma.
  Esempio: `presa-in-carico.mjs` (lettere sul nastro, timbro, occhio dell'arco, lancetta).
