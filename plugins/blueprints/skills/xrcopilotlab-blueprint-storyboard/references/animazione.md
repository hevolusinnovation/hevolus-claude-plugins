# Animare gli schizzi delle scene `Dn`

Le scene dei punti di demo che il recorder non sa ancora registrare dal vivo (la mail che diventa pratica,
la riunione, l'esito) restano schizzi. Un fotogramma fermo non è un video: `anima-schizzi.mjs` li anima e
produce **un clip per scena, con la sua battuta**.

## Che cosa fa

Per ogni scena con un codice `Dn`, sul fotogramma HTML della scena (`frames/f<n>.html`):

- i **tratti si disegnano** uno dopo l'altro (`stroke-dashoffset`), in circa il 60% della durata;
- le **campiture** e i **testi** compaiono dopo il loro tratto, il titolo e la battuta in apertura;
- dove **decide una persona** (`umano: sì`) gli elementi azzurri pulsano con un alone;
- registra la pagina con Chrome (Playwright), taglia l'avvio e monta la **voce neurale di quella scena**.

Uscita in `clips/`: `<Dn>-scena-<n>.mp4` (con voce) e `<Dn>-scena-<n>-solo-video.mp4` (per l'animatic).

## Come si lancia

```bash
# dscenes.json: [{"n":7,"code":"D1","dur":4.5,"humans":false}, …]  — dalle scene del copione con un Dn
PLAYWRIGHT_CORE_FROM=<cartella del pacchetto xrcopilotlab-demo>/app node references/anima-schizzi.mjs
```

Serve Google Chrome, `ffmpeg` e le voci già generate (`audio/scena-<n>.mp3`). Dopo, l'animatic usa
`-solo-video.mp4` al posto del fotogramma fermo per le scene `Dn` (vedi `narrazione.md` § «L'animatic») e la
pagina mostra i clip con voce in una sezione «Scene Dn».

## Cosa controllare

Un fotogramma a inizio, metà e fine di un clip: all'inizio la pagina quasi vuota, alla fine lo schizzo
completo e la luce azzurra dove decide una persona. Nessun nome proprio nei titoli o negli schizzi
(anche questo si è visto: un titolo con «Anna» è passato fino al video).
