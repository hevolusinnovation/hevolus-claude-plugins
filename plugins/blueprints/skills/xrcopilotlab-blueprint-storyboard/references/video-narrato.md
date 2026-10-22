# I tre video narrati, con lo schermo vero

Questo è **il prodotto di default** della skill: **tre video separati**, ciascuno con il suo file, la sua
durata e il suo capitolo nella pagina. Tutti sulla piattaforma (staging, 1920×1080, cursore visibile,
**senza sottotitoli**, voce neurale italiana). Non si concatenano: hanno pubblici e momenti diversi, e
caricati nel tenant come guida ([`guida-video.md`](guida-video.md)) l'assistente li distingue dal nome.

| # | File | Per chi | Che cosa mostra | Oggi |
|---|---|---|---|---|
| 1 | `01-come-si-crea.mp4` | chi implementa | il blueprint **da zero, passo passo**: topic, conoscenza, assistenti, orchestratore, processo disegnato a mano | si fa (`create`, passi sotto) |
| 2 | `02-come-si-usa.mp4` | chi lavora ogni giorno con lo scenario | il risultato **già creato, usato**: si chiede qualcosa a un assistente, la knowledge risponde, dove si consultano i processi. **Non** fa girare un caso completo | il tour del risultato si fa (`tour`); la chat con gli assistenti richiede che il banco la sappia fare |
| 3 | `03-processo-in-funzione.mp4` | chi decide e deve riconoscersi | **un caso solo, dall'arrivo alla chiusura, ruolo per ruolo**, con l'istanza che avanza ([`processo-in-funzione.md`](processo-in-funzione.md)) | si fa su staging con le caselle di prova (variante v41 per Studio Polis) e le macro `startInstance`/`completeWorkItem` |

**Ordine: 1, 2, 3.** I primi due non dipendono da nulla di nuovo; il terzo scrive istanze sul tenant e va
per ultimo. Se il 2 e il 3 sembrano sovrapposti, il 2 resta l'uso degli assistenti e della knowledge e il 3
è il solo che porta un caso fino in fondo.

Niente animatic, niente versioni parallele: lo storyboard con le scene descritte per esteso
([`descrizione.md`](descrizione.md)) si fa solo se l'utente lo chiede, per esempio per un'agenzia.

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
   al secondo, con la voce scelta con il campione (SKILL.md §5-bis): `python3 -I voce-elevenlabs.py say --lines righe.json
   --out-dir voce --voice "<voce>"` se è ElevenLabs, `xrcopilotlab-bp voice say --lines righe.json --out-dir voce --voice
   "<voce>" --env <amb>` se è della piattaforma (ElevenLabs va a circa 2 parole al secondo).
6. **Montaggio.** Un elenco `{t, mp3}` con `t` dall'inizio della fase in `timings.json`; si lancia
   `compose-video.py` (configurazione JSON: `video`, `items`, `out`). Il video si taglia da un momento al
   successivo; se la voce è più lunga si tiene fermo l'ultimo fotogramma, mai si accelera la voce.
   15 fps, `crf` 31–32: ~9 MB per 7 minuti. Ogni video si compone da sé, nel suo file: nessuna
   concatenazione. Tetto di 15 MB per file nell'artifact.
7. **Pagina.** Un `<video>` per ciascuno dei tre (o per quelli fatti), i capitoli cliccabili (secondi **nel video composto**, che contiene i
   fotogrammi fermi), il pulsante **Scarica** (`downloads` capability) e, sotto il titolo, il
   **tempo di creazione**: quanto è durata la registrazione e quanto dura il video finale.
   Una nota avvisa che nelle liste compaiono nomi di altri progetti: oscurarli prima di uscire dall'organizzazione.
8. **Archivio.** Finito il lavoro manifest-video, regia, brief, piano, `timings.json` e gli mp4 si caricano
   **nell'archivio del tenant** (blob), non si lasciano su disco:
   `xrcopilotlab-bp files put <file> --tag <TAG> --kind attachment --name creazione-umana/video/01-come-si-crea.mp4 --env <amb> --company <id>`
   (si rileggono con `files ls|get --kind attachment`). **I nomi sono fissi**, perché il Blueprint Marketplace li
   riconosce da lì: `creazione-umana/video/01-come-si-crea.mp4`, `02-come-si-usa.mp4`, `03-processo-in-funzione.mp4` (e, se fatto, `04-short.mp4`),
   mai `video.mp4`. Accanto a ciascuno, **`<stesso nome>.capitoli.json`** con ciò che la pagina dei video già mostra:
   ```json
   { "titolo": "Come si crea: topic, conoscenza, assistenti e percorsi", "descrizione": "Una o due frasi, senza esiti di collaudo.",
     "capitoli": [ { "secondi": 0, "titolo": "Apertura" }, { "secondi": 11, "titolo": "Topic" } ],
     "titoloEn": "How it is built: …", "descrizioneEn": "…", "capitoliEn": [ { "secondi": 0, "titolo": "Opening" } ] }
   ```
   I secondi sono quelli **del video composto**, come nella pagina (passo 7). Su disco non resta niente: si lavora in
   una cartella temporanea della sessione (mai sotto `~/.xrcopilotlab/`) e si elimina dopo l'upload: regola 8 di `.claude/rules/blueprints.md`.
9. **Agente video nel tenant (obbligatorio).** I video generati si aggiungono al manifest come guida
   interrogabile con un agente video: [`guida-video.md`](guida-video.md). Si salta solo se i video non
   sono consegnabili, e lo si dichiara.
10. **Nel marketplace.** Archiviati i video, si portano nella scheda del blueprint nel Blueprint Marketplace con
   la skill `xrcopilotlab-blueprint-marketplace`, modo `video <TAG>` (lo strumento `tools/video-storyboard.py` del
   sito li scarica dall'archivio, li carica nello storage del sito e scrive la scheda italiana e inglese). Si propone
   all'utente alla fine, con il comando; la PR del sito la apre quella skill.
11. **Pulizia.** Le entità create restano sul tenant: si propone di cancellarle, e si cancella solo con il sì
   (mai dal codice: lo fa una persona o uno spec dedicato con elenco esplicito).

## Cose che si sono imparate

- Blazor Server riscrive il campo durante la digitazione: il banco digita a blocchi e attende che il
  valore si stabilizzi; non si abbassa il ritardo per accelerare.
- Una versione vecchia del lanciatore non ha `voice`: serve `bp-v2.19.0` o successiva.
- I processi si disegnano a mano (palette, doppio clic per il nome, strumento di collegamento) perché
  l'editor non ha scorciatoie senza AI.
