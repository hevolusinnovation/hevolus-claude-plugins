# Il video narrato: un solo video, con lo schermo vero

Questo è **il prodotto di default** della skill. Un solo video della piattaforma (staging, 1920×1080,
cursore visibile, **senza sottotitoli**, voce neurale italiana), in due parti:

1. **Come si crea**: topic, conoscenza, assistenti, orchestratore e processo, creati davanti alla camera.
2. **Il risultato, già creato**: il tour del blueprint applicato, spiegato nel dettaglio.

Niente schizzi, niente animatic, niente versioni parallele: gli schizzi (`schizzi.md`, `animazione.md`) si
fanno solo se l'utente li chiede per un'agenzia.

## Passi

1. **Manifest del video.** Non il manifest vero (nomi con codici, istruzioni da 175 righe): una versione
   **semplice e umana** — nomi che direbbe una persona, istruzioni di poche righe, nessun suffisso o
   codice — in una cartella di lavoro temporanea. Mai anagrafiche vere: si anonimizza.
2. **Regia** (`regia.yml`): `activateAgents: false`, `activateProfiles: false` (niente licenze consumate) e,
   per il processo, `drawnProcesses` — gli step `createProcess` scritti a mano (elementi `task`/`gateway`/`end`
   con `cell: {col,row}`, e `flows` da `start`). Il processo del video è una versione semplice di quello
   del manifest: 3–5 elementi.
3. **Piano e sì.** `xrcopilotlab-demo create --manifest m.yml --regia r.yml --suffix none --env <amb> --plan-only`,
   si mostra all'utente (ambiente, company, entità e nomi) e si attende il sì: **scrive sul tenant**.
4. **Registrazione.** Stesso comando senza `--plan-only`, `--out <cartella>`. Dura circa 7–8 minuti
   (lascia stare il browser). Esce `video.mp4` e `timings.json` (inizio e fine di ogni step e fase, già nel
   tempo del video tagliato).
5. **Voce.** Una battuta per momento (apertura, topic, conoscenza, ogni assistente: istruzioni, modello,
   collegamento; orchestratore e passi; processo: elementi, collegamenti, salvataggio; chiusura), 1,5 parole
   al secondo, con `xrcopilotlab-bp voice say --lines righe.json --out-dir voce --env <amb>`.
6. **Montaggio.** Un elenco `{t, mp3}` con `t` dall'inizio della fase in `timings.json`; si lancia
   `compose-video.py` (configurazione JSON: `video`, `items`, `out`). Il video si taglia da un momento al
   successivo; se la voce è più lunga si tiene fermo l'ultimo fotogramma, mai si accelera la voce.
   15 fps, `crf` 31–32: ~9 MB per 7 minuti. Il tour del risultato si compone allo stesso modo e si
   concatena (`ffmpeg -f concat -c copy`). Tetto di 15 MB per file nell'artifact.
7. **Pagina.** Un `<video>`, i capitoli cliccabili (secondi **nel video composto**, che contiene i
   fotogrammi fermi), il pulsante **Scarica** (`downloads` capability) e, sotto il titolo, il
   **tempo di creazione**: quanto è durata la registrazione e quanto dura il video finale.
   Una nota avvisa che nelle liste compaiono nomi di altri progetti: oscurarli prima di uscire dall'organizzazione.
8. **Archivio.** Finito il lavoro manifest-video, regia, brief, piano, `timings.json` e gli mp4 si caricano
   **nell'archivio del tenant** (blob), non si lasciano su disco:
   `xrcopilotlab-bp files put <file> --tag <TAG> --kind attachment --name creazione-umana/video/video.mp4 --env <amb> --company <id>`
   (si rileggono con `files ls|get --kind attachment`). La cartella locale `~/.xrcopilotlab/blueprints/<TAG>/`
   è solo di lavoro e può sparire: regola 8 di `.claude/rules/blueprints.md`.
9. **Pulizia.** Le entità create restano sul tenant: si propone di cancellarle, e si cancella solo con il sì
   (mai dal codice: lo fa una persona o uno spec dedicato con elenco esplicito).

## Cose che si sono imparate

- Blazor Server riscrive il campo durante la digitazione: il banco digita a blocchi e attende che il
  valore si stabilizzi; non si abbassa il ritardo per accelerare.
- Una versione vecchia del lanciatore non ha `voice`: serve `bp-v2.19.0` o successiva.
- I processi si disegnano a mano (palette, doppio clic per il nome, strumento di collegamento) perché
  l'editor non ha scorciatoie senza AI.
