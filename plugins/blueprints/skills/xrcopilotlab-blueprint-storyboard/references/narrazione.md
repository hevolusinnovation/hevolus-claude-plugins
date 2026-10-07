# La voce che racconta

## Scrivere la battuta

La lingua è l'**italiano**, per ora la sola: battute, scritte e voce guida (`Alice`, `Reed`).

- Una frase per scena, due al massimo; parlata, non scritta: «Poi decide una persona.»
- **Budget di parole**: circa **2 parole al secondo** di scena, meno se la scena ha un movimento
  importante. Una scena da 4 s regge 8 parole; una da 7,5 s, 14. Le pause fanno parte del racconto.
- Dove l'immagine parla da sola: **nessuna voce**. «Musica · nessuna voce» vale come battuta.
- Numeri e sigle si scrivono come si dicono («quattordici», «PEC» letto come lettere, «ISO»).
  Date e orari in lettere se sono parlati.
- La **frase chiave** arriva una volta, in fondo, in due tempi se serve; non si ripete prima.
- Le parole introdotte nella parte basilare (archivio, knowledge, assistente, skill) si dicono con
  la loro spiegazione la prima volta ([`base-piattaforma.md`](base-piattaforma.md)).

## Voce guida di prova (macOS)

Serve a **misurare**, non a consegnare. Voce italiana di sistema: `Alice` (donna) o `Reed`
(uomo); `say -v '?' | grep it_IT` elenca le disponibili. A velocità `-r 165` fa circa 2 parole al
secondo.

Per ogni scena `<codice>` con durata `<s>` secondi e battuta `<testo>`:

```bash
mkdir -p audio && cd audio
say -v Alice -r 165 -o scena-<codice>.aiff "<testo>"
ffmpeg -loglevel error -y -i scena-<codice>.aiff -c:a libmp3lame -b:a 80k scena-<codice>.mp3
ffprobe -v error -show_entries format=duration -of csv=p=0 scena-<codice>.mp3   # durata reale
```

1. **Confronto**: la durata reale deve stare nella durata della scena, con almeno 0,3 s di respiro
   alla fine. Se è più lunga: **si accorcia la battuta** e si rigenera. Non si alza `-r` oltre 185.
2. **Traccia unica**: ogni scena si porta alla sua durata con silenzio in coda e si concatena, così
   la traccia ha i tempi dello storyboard:

   ```bash
   # WAV intermedi: con l'mp3 in ingresso apad + libmp3lame dà «inadequate AVFrame plane padding»
   ffmpeg -loglevel error -y -i scena-<codice>.mp3 -ar 24000 -ac 1 -af "apad=whole_dur=<s>" -t <s> pad-<n>.wav
   # scena senza voce: ffmpeg -f lavfi -i anullsrc=r=24000:cl=mono -t <s> pad-<n>.wav
   printf "file 'pad-1.wav'\nfile 'pad-2.wav'\n" > lista.txt   # una riga per scena
   ffmpeg -loglevel error -y -f concat -safe 0 -i lista.txt -c:a libmp3lame narrazione.mp3
   ```

   La durata totale può superare di un decimo di secondo quella dichiarata (padding del codec): si
   accetta fino a 0,3 s, oltre si ricontrolla una scena.
3. I file `.aiff` e i `pad-*` si cancellano; restano `scena-<codice>.mp3` e `narrazione.mp3`.
4. Sono **audio di servizio**: lo si scrive nella pagina («voce di prova») e nel messaggio finale.
   Non si pubblica come voce del video.

## Se la voce è troppo sintetica

La voce di sistema (`say`) è **di servizio**: sul Mac ci sono solo le voci italiane di base (Alice,
Reed, Flo, Sandy, Eddy…) e suonano artificiali. Non si può migliorare dalla skill. Le strade, in
ordine di costo, e **ogni voce migliore si chiede all'utente prima**:

1. **Voci Premium/Migliorate** di macOS, se l'utente le scarica (Impostazioni di Sistema →
   Accessibilità → Contenuto vocale → Voci di sistema → Gestisci voci → Italiano): `say -v '?'` le
   elenca e la skill usa la migliore che trova. Locale e gratuito, ma resta una voce di sistema.
2. **Una voce neurale in cloud** (per esempio Azure AI Speech, voci `it-IT`, o un servizio di terzi):
   molto più naturale, ma il **testo della narrazione esce dalla macchina** e serve una chiave. Si usa
   solo con l'ok dell'utente, con lo scenario anonimo, e la chiave non entra mai nei file.
3. **Una voce umana**: si consegna la sezione «Copione della voce» a chi registra, con i tempi.

Qualunque sia la voce, i tempi sono quelli dello storyboard: si rimisura con la stessa procedura.

## L'animatic

Per ogni scena un fotogramma 1280×720 (HTML con lo schizzo, il codice, il titolo e la battuta come
sottotitolo, reso con Chrome senza interfaccia), poi:

```bash
# anim.txt: «ffconcat version 1.0», poi per ogni scena  file 'frames/f<n>.png'  e  duration <s>,
# e l'ultimo file ripetuto una volta
ffmpeg -y -f concat -safe 0 -i anim.txt -i audio/narrazione.mp3 -vf "fps=25,format=yuv420p" \
  -c:v libx264 -crf 30 -c:a aac -b:a 80k -shortest -movflags +faststart animatic.mp4
```

La durata del video deve essere quella dello storyboard (`ffprobe`); si guarda un fotogramma a metà
e uno verso la fine prima di pubblicare.

Dove non c'è `say` o `ffmpeg` (Windows, Claude Desktop) l'audio non si genera: si pubblica lo
storyboard con le battute e il budget di parole controllato a mano, e lo si dice.

## Nella pagina

Ogni riquadro con voce ha un pulsante «▶ voce» che riproduce `scena-<codice>.mp3`; in testata un
lettore con `narrazione.mp3` intera. Se manca l'audio, i pulsanti non si mostrano (la pagina non
deve avere controlli morti).

## Il testo per chi registra

Nel Markdown, in fondo, una sezione **«Copione della voce»**: tutte le battute in ordine, con il
tempo accanto e le indicazioni di lettura (pausa, tono) fra parentesi quadre. È ciò che si consegna
a chi registrerà la voce vera.
