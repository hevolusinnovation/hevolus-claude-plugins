# La guida video nel tenant: topic Guide, video, agente

**Obbligatorio**, **dopo** i video narrati ([`video-narrato.md`](video-narrato.md)). Il video smette di essere un
file da mandare e diventa **una guida che il cliente interroga**: i video stanno nel topic **Guide** del
suo blueprint, un profilo di knowledge li indicizza e **un agente video per manifest** risponde alle domande
citando il video che le spiega.

Si aggiunge **al manifest del cliente** (stesso tag), come versione nuova: non è un blueprint a parte.
L'`apply` lo tratta come aggiornamento sul posto (regola 2 di `.claude/rules/blueprints.md`): crea ciò che
manca, non tocca il resto.

## La regola: il topic «Guide» lo crea il manifest, un agente video per manifest

- **Il manifest dichiara il topic** `Guide` con `name`: il planner lo crea come **`BP-<TAG>-Guide`**, con il
  prefisso del blueprint, e lo mette nell'inventario del run. Non c'è nessun controllo «esiste già?» da
  fare a mano: il blueprint crea ciò che manca, e a un aggiornamento successivo lo ritrova nell'inventario
  e non lo ricrea (regola 2 di `.claude/rules/blueprints.md`).
- **Una guida per blueprint, non una per tenant.** Un cliente con due blueprint (due tag) ha due topic
  `BP-<TAGA>-Guide` e `BP-<TAGB>-Guide`. Il rollback di un blueprint porta via la sua guida con le altre
  sue entità: è voluto, la guida descrive quello scenario.
- **Un agente video per manifest**, con **tutti i video di quel manifest** (di solito `01-come-si-crea`,
  `02-come-si-usa`, `03-processo-in-funzione`) in un solo profilo. Il nome del file per argomento è ciò
  che gli fa citare il video giusto. Non un agente per video: ogni agente e ogni profilo consumano licenza
  (`BP071`), e un agente con più video risponde meglio alle domande che li attraversano.
- **Il nome dell'agente** nel manifest è «Agente video - <Scenario>» (per Studio Polis: «Agente video -
  Agenda»): il planner antepone `BP-<TAG>-`, quindi il cliente non va scritto nel nome.
- Se in quel tenant esiste già un topic che si chiama `BP-<TAG>-Guide` **non creato dal blueprint**, il piano
  si ferma (`BP060`): lo si rinomina o si cambia il nome nel manifest. Non si sovrascrive.

Se i video non sono consegnabili (passo 1) il passo si salta, ma **va scritto nel riepilogo** con il
motivo: senza agente video il prodotto è incompleto e chi legge deve saperlo.

## Cosa fa la piattaforma, e cosa no

- Un `.mp4` in un profilo di knowledge **viene ingerito**: Content Understanding ne ricava trascrizione e
  fotogrammi chiave, e il grafo li indicizza come ogni altro documento. Il validatore non lo rifiuta
  (`BP027` riguarda solo `.xls`).
- L'agente risponde **da ciò che i video dicono**: la voce che racconta e i fotogrammi. Non «apre il video a
  un minuto preciso»: non lo si promette. Lo si fa citare per **nome del file**.
- Il profilo consuma licenza (`XRCopilotLab.Profile`) e l'agente anche (`XRCopilotLab.Agent`): il piano si
  ferma con `BP071` se il tenant le supererebbe. L'indicizzazione prosegue dopo l'apply: un video da 7
  minuti richiede qualche minuto, e finché non ha finito l'agente risponde su una guida parziale.

## Il frammento

Si aggiunge al manifest esistente (provato con `xrcopilotlab-bp validate`):

```yaml
topics:
  - key: guida
    name: Guide                   # il planner lo crea come BP-<TAG>-Guide

knowledge:
  - key: guida-video
    name: Video dello scenario
    description: I video che spiegano come si crea lo scenario, come si usa e il processo in funzione
    language: it
    topic: guida
    files:                        # niente fileType: è original, la forma giusta
      - path: video-guida/01-come-si-crea.mp4
      - path: video-guida/02-come-si-usa.mp4
      - path: video-guida/03-processo-in-funzione.mp4

agents:
  - key: agente-video
    name: Agente video - Agenda   # «- <Scenario>»; il planner mette BP-<TAG>- davanti
    description: Risponde alle domande sullo scenario citando il video che le spiega
    language: it
    model: gpt-5.4-mini           # dichiararlo (BP015); niente temperature (BP018)
    topic: guida
    systemMessage: |
      Sei la guida video di questo scenario. Il tuo unico materiale sono i video che ti sono collegati.
      Rispondi in italiano, in poche frasi, solo con ciò che i video dicono o mostrano.
      Chiudi ogni risposta indicando il video che la contiene, con il suo nome file.
      Se nessun video tratta la domanda, dillo: «Nei video non c'è, chiedi a una persona del team».
      Non dedurre, non completare con ciò che «di solito» si fa, non citare minuti che non conosci.
    knowledge: [guida-video]
```

I nomi dei file contengono ciò che distingue i video: dentro un profilo i file si selezionano **per nome**
([`manifest-reference.md`](../../xrcopilotlab-blueprint/references/manifest-reference.md) § «Come si dividono i file»).
Se un manifest ha più video su uno stesso argomento, il nome dice quale.

## Passi

1. **I video sono consegnabili?** Blocco: nelle liste dell'applicazione compaiono nomi di **altri
   progetti e clienti** e il nome dell'utente ([`video-narrato.md`](video-narrato.md) passo 7). Un video
   caricato nel tenant di un cliente lo vede chiunque in quel tenant. Si caricano solo video **oscurati o
   registrati su un tenant che contiene solo cose del cliente**; la conferma la dà l'utente.
2. **I file accanto al manifest.** Si scaricano dall'archivio (`xrcopilotlab-bp files get --tag <TAG>
   --kind attachment ...`) con `--out <scratch>/video-guida/` (cartella temporanea della sessione, da eliminare a fine lavoro), con nomi per argomento.
   I percorsi del manifest sono relativi alla sua cartella.
3. **Validare.** `xrcopilotlab-bp validate <manifest> --graph`: zero errori; `BP027` = file mancante.
4. **Il piano.** Si segue [`xrcopilotlab-blueprint`](../../xrcopilotlab-blueprint/SKILL.md): `push`,
   `plan`, si **mostra il piano** (un topic `BP-<TAG>-Guide`, un profilo con N file, un agente) e si
   attende il sì. Scrive sul tenant: ambiente e company si dichiarano, mai assunti. I video viaggiano con
   la versione del manifest (`push` li archivia in `v<N>/files/`).
5. **Apply e attesa.** Dopo l'apply si controlla che l'indicizzazione sia finita, **poi** si prova: una
   domanda per video, la cui risposta è nel video, e una fuori argomento che deve rispondere «non c'è».
6. **Consegna.** Nel riepilogo: nome dell'agente, topic `BP-<TAG>-Guide`, versione del manifest, esito delle domande di prova.
7. **Dirlo nell'artifact.** Sotto il video una riga «Chiedi all'agente video» con il nome dell'agente e il
   topic `BP-<TAG>-Guide`. Niente link a entità del tenant se l'artifact esce dall'organizzazione.

## Cosa non fare

- Non mettere i video nel topic di `tenant`: un file nel topic non è interrogabile da nessuno finché un
  profilo non lo seleziona, e si mescolerebbe con la knowledge dello scenario.
- Non cambiare il nome del topic dopo il primo apply: il blueprint lo ritrova per nome nell'inventario.
- Non fare un agente per video: uno per manifest, con tutti i suoi video.
- Non promettere «ti porta al minuto giusto»: l'agente cita il file, non il secondo.
- Non attivare il profilo senza licenza: l'API risponde 403 e il run si ferma a metà (`BP071`).
- Non applicare senza il sì dell'utente sul piano, né con `--yes` dichiarato al posto suo.
- Non caricare video con nomi di altri clienti in vista.
