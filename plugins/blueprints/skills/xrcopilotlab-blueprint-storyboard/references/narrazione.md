# La voce che racconta

## Scrivere la battuta

La lingua è l'**italiano**, per ora la sola: battute, scritte e voce guida (`Alice`, `Reed`).

- Una frase per scena, due al massimo; parlata, non scritta: «Poi decide una persona.»
- **Budget di parole**: con la voce neurale della piattaforma circa **1,5 parole al secondo** di scena (2 con la voce di sistema), meno se la scena ha un movimento
  importante. Una scena da 4 s regge 8 parole; una da 7,5 s, 14. Le pause fanno parte del racconto.
- Dove l'immagine parla da sola: **nessuna voce**. «Musica · nessuna voce» vale come battuta.
- Numeri e sigle si scrivono come si dicono («quattordici», «PEC» letto come lettere, «ISO»).
  Date e orari in lettere se sono parlati.
- La **frase chiave** arriva una volta, in fondo, in due tempi se serve; non si ripete prima.
- Le parole introdotte nella parte basilare (archivio, knowledge, assistente, skill) si dicono con
  la loro spiegazione la prima volta ([`base-piattaforma.md`](base-piattaforma.md)).

## La voce ElevenLabs (quando c'è la chiave)

È la voce **predefinita** della storyboard quando nell'ambiente c'è `ELEVENLABS_API_KEY`: più espressiva delle
voci neurali della piattaforma, la stessa dei reel del registratore (`demo-recorder-playwright`, stesse
impostazioni: modello `eleven_multilingual_v2`, voce **Liam**, «espressiva e decisa»). Lo script è accanto a
`compose-video.py` e ha la stessa interfaccia di `xrcopilotlab-bp voice say`, quindi il montaggio non cambia:

```bash
python3 -I voce-elevenlabs.py controlla                                   # c'è la chiave? (non la stampa mai)
python3 -I voce-elevenlabs.py voci --lang it                              # le voci dell'account, con l'id
python3 -I voce-elevenlabs.py say "<testo>" --out scena-1.mp3 --voice Liam
python3 -I voce-elevenlabs.py say --lines righe.json --out-dir audio --voice "<voce scelta>"
```

Formato MP3 mono 16 kHz, come la voce della piattaforma. Una voce della libreria condivisa di ElevenLabs va prima
aggiunta a «My voices» sul sito; il piano Free non ha la licenza commerciale. Errori: `401` chiave non valida,
`402` voce o funzione a pagamento, `429` crediti esauriti o troppe richieste (si riprova, o si passa alla voce della
piattaforma e lo si dice).

ElevenLabs parla **più svelto** delle voci della piattaforma (circa 2 parole al secondo con Liam): si rimisura
ogni battuta dopo la scelta della voce, come per qualunque cambio di voce.

### La chiave ElevenLabs: come si salva (una volta per macchina)

La chiave non passa **mai** dalla conversazione: la skill non la chiede, non la legge, non la stampa. La persona la
crea su elevenlabs.io (Profile → API Keys, con il permesso *Text to Speech*; l'account è quello di Hevolus, chi lo
gestisce la dà) e la salva **da sé**, nel proprio terminale:

**macOS** — nel Portachiavi, poi resa visibile alla shell:
```bash
security add-generic-password -a "$USER" -s elevenlabs-api-key -w          # la chiede senza mostrarla
echo 'export ELEVENLABS_API_KEY="$(security find-generic-password -a "$USER" -s elevenlabs-api-key -w 2>/dev/null)"' >> ~/.zshrc
```

**Windows** — nelle variabili dell'utente (PowerShell):
```powershell
$k = Read-Host "Chiave ElevenLabs" -AsSecureString
[Environment]::SetEnvironmentVariable("ELEVENLABS_API_KEY", [Net.NetworkCredential]::new("", $k).Password, "User")
```

Poi si **riavvia Claude Code** (e il terminale), perché la variabile entri nell'ambiente, e si verifica con
`python3 -I voce-elevenlabs.py controlla`. Non si mette nel blocco `env` di `settings.json` di Claude Code: lì resta
in chiaro su disco. Per revocarla: elevenlabs.io → API Keys; poi `security delete-generic-password -s
elevenlabs-api-key` (macOS) o `[Environment]::SetEnvironmentVariable("ELEVENLABS_API_KEY", $null, "User")` (Windows).

## La voce della piattaforma (`xrcopilotlab-bp voice`)

Quando la chiave ElevenLabs non c'è (o la persona sceglie di non usarla): nessuna chiave da gestire, le quattro voci
neurali di §5-bis.


```bash
xrcopilotlab-bp voice list --env <ambiente>                         # le voci, con il loro identificativo
xrcopilotlab-bp voice say "<testo>" --out scena-1.mp3 --voice "<voce scelta>" --env <ambiente>
xrcopilotlab-bp voice say --lines righe.json --out-dir audio --voice "<voce scelta>" --env <ambiente>
```

Formato MP3 mono 16 kHz. Poi si misura e si monta come qui sotto (la parte «Traccia unica»), con la
stessa regola: la durata reale entro la scena, con almeno 0,3 s di respiro.

**La voce di sistema (`say`) è solo il ripiego**, per quando la CLI non ha `voice` o non c'è la
rete verso la piattaforma. Resta la procedura qui sotto, e va detto che suona artificiale.

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

## Voci migliori della predefinita

La voce si sceglie fra quattro, ascoltandole sulla prima battuta (SKILL.md §5-bis): Isabella HD e Alessio HD
(`DragonHD` nell'identificativo, le più naturali), Fabiola, e Diego, il default della piattaforma. Dopo la
scelta si ricontrollano i tempi: ogni voce ha il suo passo. `voice list` elenca le altre voci della
piattaforma, se l'utente ne chiede una che non è fra le quattro; si passano con `--voice "<identificativo>"`. Per un video da consegnare, la strada resta una
**voce umana** a partire dal «Copione della voce» in fondo allo `storyboard.md`.

Il ripiego `say` (macOS) ha solo le voci italiane base; se l'utente scarica quelle Premium
(Impostazioni di Sistema → Accessibilità → Contenuto vocale → Voci di sistema → Gestisci voci)
`say -v '?'` le elenca e si usa la migliore.

## Niente animatic

Lo storyboard non ha disegni, quindi non si monta un animatic: la narrazione si ascolta nella pagina
(traccia intera e un pulsante per scena) accanto alle descrizioni. Il video vero si fa registrando
l'applicazione (`registrazione.md`).

Dove non c'è `say` o `ffmpeg` (Windows, Claude Desktop) l'audio non si genera: si pubblica lo
storyboard con le battute e il budget di parole controllato a mano, e lo si dice.

## Nella pagina

Ogni riquadro con voce ha un pulsante «▶ voce» che riproduce `scena-<codice>.mp3`. **Nessun lettore della
narrazione intera in testata**: nella pagina non serve (si ascolta una scena alla volta, accanto alla sua
descrizione). `narrazione.mp3` resta un file di lavoro per il montaggio e si pubblica fra i file solo se
qualcuno lo chiede. Se manca l'audio, i pulsanti non si mostrano (la pagina non deve avere controlli morti).

## Il testo per chi registra

Nel Markdown, in fondo, una sezione **«Copione della voce»**: tutte le battute in ordine, con il
tempo accanto e le indicazioni di lettura (pausa, tono) fra parentesi quadre. È ciò che si consegna
a chi registrerà la voce vera.
