# La guida video nel tenant: l'agente con i video allegati

**Obbligatorio**, **dopo** i video narrati ([`video-narrato.md`](video-narrato.md)). Il video smette di essere un
file da mandare e diventa **una guida che il cliente interroga**: un **agente video per manifest**, con i video
**allegati all'agente**, risponde alle domande dicendo in quale video e in quale punto si vede la risposta.

Si aggiunge **al manifest del cliente** (stesso tag), come versione nuova: non è un blueprint a parte.
L'`apply` lo tratta come aggiornamento sul posto (regola 2 di `.claude/rules/blueprints.md`): crea ciò che
manca, non tocca il resto.

## La regola: i video stanno sull'agente, mai in un profilo di knowledge

Un agente risponde da un video in due modi molto diversi, e solo uno funziona:

| Dove sta il video | Che cosa succede | Esito |
|---|---|---|
| **File dell'agente** (`agents[].files`) | All'attivazione l'agente lo manda all'analisi dei video: Content Understanding ne trascrive **tutti i segmenti**, descrive i fotogrammi chiave e tiene i tempi. In chat l'agente riceve i dati dei suoi video e può citare segmento e minuto | **Si usa questo** |
| Profilo di knowledge (`knowledge[].files`) | Il video entra nel knowledge graph come testo, ma la libreria legge **solo il primo segmento** del risultato di Content Understanding (15–30 secondi): il resto del video non c'è | Non si usa |

Lo si è visto con SCHOOL v17 (29/10/2026). Profilo con tre video da 2–7 minuti e agente collegato:
indicizzazione «completata», ma l'agente rispondeva che nei video non c'era ciò che la voce diceva dopo il primo
mezzo minuto. La guida è stata tolta con la v19. Il percorso, riletto nel codice:

- **video sull'agente**: `IndexFiles` di un agente Smart con file video chiama `IndexFileByAgent` →
  `VideoFeatureProcessor` → coda di analisi dei media → `MediaAnalysisWorker`, che legge la trascrizione di tutti
  i segmenti;
- **video in un profilo**: `ParseContentUnderstandingResponse` della libreria del knowledge graph legge
  `contents[0]`, cioè solo il primo segmento.

Il tipo «Video» dell'agente è obsoleto e non serve: un agente **Smart** (il default del manifest) con dei video
fra i suoi file attiva da solo il percorso dei video.

## Le altre regole

- **Un agente video per manifest**, con **tutti i video di quel manifest** (di solito `01-come-si-crea`,
  `02-come-si-usa`, `03-processo-in-funzione`). Non un agente per video: ogni agente consuma licenza (`BP071`),
  e uno solo risponde meglio alle domande che attraversano più video.
- **Il nome dell'agente** nel manifest è «Agente video - <Scenario>» (per Studio Polis: «Agente video -
  Agenda»). Il planner antepone `BP-<TAG>-`, quindi il cliente non va scritto nel nome.
- **Nel topic di `tenant`**: i file dell'agente si caricano nel topic dell'agente. Un topic in più («Guide») non
  serve: è un'altra licenza di topic e un altro posto da smontare.
- **Niente profilo di knowledge** per i video, per la regola sopra. Un profilo serve solo se la guida deve
  rispondere anche da documenti scritti, ed è un'altra cosa.
- **Il nome del file dice di che cosa parla il video**: è con quello che l'agente lo cita.
- **Fuori dal modello del catalogo**, salvo i video registrati su un tenant che mostra solo cose del cliente:
  quelli girati sul tenant di collaudo di Hevolus mostrano contatori, preferiti e progetti interni.

Se i video non sono consegnabili (passo 1) il passo si salta, ma **va scritto nel riepilogo** con il motivo:
senza agente video il prodotto è incompleto e chi legge deve saperlo.

## Il frammento

Si aggiunge al manifest esistente:

```yaml
agents:
  - key: agente-video
    name: Agente video - Agenda   # «- <Scenario>»; il planner mette BP-<TAG>- davanti
    description: Risponde alle domande sullo scenario indicando il video e il punto in cui si vede la risposta
    language: it
    model: gpt-5.4-mini           # dichiararlo (BP015); niente temperature (BP018)
    files:                        # i video allegati all'agente: niente fileType (è reference)
      - path: video-guida/01-come-si-crea.mp4
      - path: video-guida/02-come-si-usa.mp4
      - path: video-guida/03-processo-in-funzione.mp4
    systemMessage: |
      Sei la guida video di questo scenario. Il tuo unico materiale sono i video che ti sono allegati.
      Rispondi in italiano, in poche frasi, solo con ciò che i video dicono o mostrano.
      Chiudi ogni risposta indicando il video che la contiene, con il suo nome file e il minuto.
      Se nessun video tratta la domanda, dillo: «Nei video non c'è, chiedi a una persona del team».
      Non dedurre e non completare con ciò che «di solito» si fa.
```

L'apply carica i video nel topic, li collega all'agente e, perché sono file `reference`, aggiunge
l'operazione **«Attiva l'agente e ne accoda l'indicizzazione dei file»**: è quella che li manda all'analisi.
Senza di lei (un agente salvato attivo ma non passato dalla rotta di attivazione) i video non si analizzano.

## Passi

1. **I video sono consegnabili?** Blocco: nelle liste dell'applicazione compaiono nomi di **altri
   progetti e clienti** e il nome dell'utente ([`video-narrato.md`](video-narrato.md) passo 7). Un video
   caricato nel tenant di un cliente lo vede chiunque in quel tenant. Si caricano solo video **oscurati o
   registrati su un tenant che contiene solo cose del cliente**; la conferma la dà l'utente.
2. **I file accanto al manifest.** Si scaricano dall'archivio (`xrcopilotlab-bp files get --tag <TAG>
   --kind attachment ...`) in `<scratch>/video-guida/` (cartella temporanea della sessione, da eliminare a fine
   lavoro). I percorsi del manifest sono relativi alla sua cartella.
3. **Validare.** `xrcopilotlab-bp validate <manifest> --graph`: zero errori; `BP027` = file mancante.
4. **Il piano.** Si segue [`xrcopilotlab-blueprint`](../../xrcopilotlab-blueprint/SKILL.md): `push`, `plan`, si
   **mostra il piano** (l'agente, N video caricati e collegati, l'attivazione con l'indicizzazione) e si attende
   il sì. Scrive sul tenant: ambiente e company si dichiarano, mai assunti. I video viaggiano con la versione
   del manifest (`push` li archivia in `v<N>/files/`).
5. **Apply e attesa.** L'analisi dei video prosegue dopo l'apply (qualche minuto per un video di 7 minuti). Si
   prova solo quando è finita.
6. **Prova.** Una domanda per video, la cui risposta sta **oltre il primo minuto** (è lì che si vede se l'agente
   ha il video intero), e una fuori argomento che deve rispondere «Nei video non c'è». Con
   `xrcopilotlab-bp test run`, in una suite `kind: agent` archiviata con il blueprint.
7. **Consegna.** Nel riepilogo: nome dell'agente, versione del manifest, esito delle domande di prova.
8. **Dirlo nell'artifact.** Sotto il video una riga «Chiedi all'agente video» con il nome dell'agente. Niente
   link a entità del tenant se l'artifact esce dall'organizzazione.

## Una guida già fatta con il profilo

Le guide create prima di questa regola (topic `BP-<TAG>-Guide` e profilo con i video) si smontano con una
versione che non le dichiara più, poi `xrcopilotlab-bp undeclared --tag <TAG> --remove` (#1702): toglie agente,
profilo, topic e video caricati, con la conferma del tag. Poi si rifà la guida con il frammento qui sopra.

## Cosa non fare

- Non mettere i video in un profilo di knowledge: se ne legge solo il primo segmento.
- Non fare un agente per video: uno per manifest, con tutti i suoi video.
- Non promettere un minuto che l'agente non ha restituito: lo cita se lo trova nei dati del video.
- Non applicare senza il sì dell'utente sul piano, né con `--yes` dichiarato al posto suo.
- Non caricare video con nomi di altri clienti in vista.
