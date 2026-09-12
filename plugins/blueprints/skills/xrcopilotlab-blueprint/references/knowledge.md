# La knowledge — topic, profili, agenti

Un blueprint che crea un topic e non lo popola produce un ambiente che **non fallisce**: risponde a
vuoto. L'agente c'è, l'orchestrazione parte, la risposta esce priva di contenuto — e si va a cercare
l'errore nei prompt, dove non è. Questo documento dice com'è fatta davvero la knowledge, perché il
modo più comune di sbagliarla è immaginarla di un livello più semplice di quanto sia.

## I tre livelli, e chi fa cosa

```
TOPIC          il repository dei file. Non è il RAG: è dove i file stanno.
  │            Un file caricato qui non è ancora interrogabile da nessuno.
  │
  ├─ PROFILO   il RAG. Seleziona un sottoinsieme dei file del topic e li indicizza.
  │            Un topic può averne più d'uno, su file diversi e con lingue diverse.
  │            È l'entità che si attiva, che consuma licenza e che si collega all'agente.
  │
  └─ AGENTE    non vede il topic: vede i profili che gli sono stati collegati.
```

L'errore da non fare è saltare il livello di mezzo. «Caricare i file nel topic dell'agente» descrive
due operazioni distinte come se fossero una: senza un profilo che li raccolga, i file restano
documenti in un contenitore, e l'agente non ne sa nulla.

Nel dossier di Confindustria Como l'`AgenteProfilo` è descritto come collegato al «profilo
`54a97ab7-e48b-49d9-b26e-b69811cf4ca1`»: è questo livello, non il topic.

## Il profilo è knowledge graph, salvo richiesta contraria

`Profile.IsKnowledgeGraph` decide fra due strade che nel codice divergono presto:

| | `IsKnowledgeGraph: true` — **il default** | `false` — indice classico |
|---|---|---|
| Cosa costruisce | knowledge graph con entità e relazioni | indice di ricerca Azure |
| Chi lo costruisce | `KnowledgeGraphIngestionAsync`, subito | coda Service Bus di attivazione profilo |
| Citazioni alla fonte | native | native |

**In un blueprint si scrive knowledge graph e basta**, a meno che l'utente chieda esplicitamente
l'indice classico. Non è una preferenza estetica: il knowledge graph è ciò che regge le domande che
attraversano più documenti — «quali associati lavorano nel tessile tecnico», «quali conti di questa
società non sono nel mapping» — e sono quelle per cui si costruisce un agente invece di una ricerca.

## Il tipo del file non si dichiara, salvo richiesta esplicita

Un file caricato nel topic porta due attributi, e si confondono facilmente:

**`FileType`** — a che cosa serve il file: `Original = 5` (**il default**), `Reference = 2`,
`Target = 3`, `Template = 4`.

**`FileScope`** — da dove viene: `None = 0` (**il default**: caricato a mano), `SharePoint = 6`,
`GoogleClassroom = 7`. Non è il ruolo del file, è la sua provenienza, e per un blueprint è sempre
`None`.

> **La regola: non specificare nulla.** Un file caricato senza dire altro è `Original` con scope
> `None`, ed è la forma giusta nella quasi totalità dei casi. `Reference`, `Target` e `Template` si
> scrivono **solo** quando l'utente li chiede, o quando un dossier li distingue di proposito —
> come fa quello di FinLogic, che separa il mapping (la logica, stabile) dai libri giornali (i dati
> del periodo).
>
> Dichiarare un tipo «per essere precisi» è il modo di introdurre una distinzione che nessuno ha
> chiesto e che poi va mantenuta.

Il vincolo lato API: `POST profiles/files` **rifiuta** con 400 un `ProfileFile` che porti uno scope
diverso da `None`. Lo scope di un file caricato dal blueprint non è mai altro.

## La sequenza, nell'ordine in cui va eseguita

```
1. upload     Topics.UploadFileAsync(stream, companyId, topicId, fileName,
                                     FileScope.None, FileType.Original)
                 → il file entra nel repository del topic

2. profilo    Profiles.SaveProfileAsync(new Profile {
                     ProfileName, DocumentsLanguage,
                     IsKnowledgeGraph = true,      ← il default
                     IsActive = false,             ← si attiva dopo, non qui
                     ProfileFiles = [ ... ] })     ← i file che questo RAG raccoglie
                 → il profilo e le sue righe file si salvano in UNA transazione

3. attiva     Profiles.ActivateProfileAsync(profile con IsActive = true)
                 → su un profilo KG: accoda l'ingestione e segna il profilo attivo
                 → su un profilo classico: manda il lavoro alla coda Service Bus

4. collega    l'agente porta il profilo in Agent.AgentProfiles, poi SaveAgentAsync
                 → da qui l'agente interroga quel RAG
```

Due cose che fanno risparmiare un giro:

- **I file del profilo si salvano con il profilo.** `SaveProfileAsync` persiste anche
  `ProfileFiles` nella stessa transazione: non serve una chiamata per file. Il `POST profiles/files`
  esiste per aggiungerne uno dopo, e su un profilo KG accoda da solo l'ingestione di quel file.
- **L'ordine 2→3 non si inverte.** Un profilo attivato prima di avere file accoda un'ingestione su
  un insieme vuoto: non è un errore, è un'attivazione che non fa niente, e poi bisogna rifarla.

## Le quattro cose che vanno male

**L'attivazione consuma licenza, e senza licenza risponde 403.** Il controllo sta in
`ActivateIndex`: serve un prodotto di scope `XRCopilotLab.Profile` sul tenant, e il numero di
profili con `IsActive = 1` non può superare la somma delle quantità licenziate. I due messaggi sono
`No profile activation licenses found for this company` e `Active profiles limit reached`. Non è una
condizione da interpretare: si riporta all'utente così com'è, perché la risolve chi amministra le
licenze, non chi applica il blueprint.

**Senza `CanonicalStore` cablato, un workbook non è interrogabile — e non lo dice.**
Dalla v3.7.18 gli spreadsheet **saltano l'embedding del testo**: al loro posto risponde il layer
canonico, che a query time fa lookup per record, per denominazione, totali e analitica. Se
`Cosmos:CanonicalContainerName` non è configurato (container `document-guides`, partition key
`/documentId`), quel layer è spento: non c'è dataset canonico e non c'è nemmeno il testo su cui
fare vector search, quindi ogni domanda su un file tabellare torna «No relevant data found in the
knowledge graph» — dopo circa 74 secondi spesi in chiamate al modello. Il sintomo è
indistinguibile da «i documenti non ci sono».

Due conseguenze operative: prima di dire che un profilo di workbook è pronto, verificare che
l'ambiente abbia quel container; e un profilo **indicizzato prima** che lo store fosse cablato non
ha dataset canonico, quindi **va re-ingerito** — il dataset si costruisce in ingestione, non a
query time.

**L'ingestione è asincrona, e l'apply no.** `activateIndex` torna appena il lavoro è accodato. Un
`apply` che finisce lì dichiara creato ciò che sta ancora costruendosi: l'utente apre la chat, il
grafo è a metà, l'agente risponde a vuoto — sintomo identico a quello di un prompt sbagliato.
`GetIndexingStatus` è il modo di saperlo, e va interrogato prima di dire che è finita.

**`.xls` passa il selettore e poi non viene ingerito — `.xlsm` invece va bene.**
La distinzione conta, ed è l'opposto di quella che questa pagina dichiarava: `.xlsm` è un pacchetto
OpenXML identico a un `.xlsx` con dentro un `vbaProject.bin` che il lettore ignora, e
`CanonicalFileRouting` lo elenca fra i tabellari (`.xlsx`, `.xlsm`, `.csv`, `.pdf`) — la pipeline
canonica lo ingerisce come tutti gli altri. `.xls` no: è il formato binario pre-2007, che nessun
lettore OpenXML apre, e va convertito in `.xlsx` prima di caricarlo.

Il limite di `DocumentsPlugin.cs:52` — che gestisce `.xlsx` e non `.xlsm` — riguarda il **percorso
classico** (indice di ricerca, file allegati in chat), non un profilo knowledge graph. Chiedere di
convertire un `.xlsm` a chi lo mantiene con le macro è un costo vero, e non serviva: il validatore
rifiutava manifest validi, e ora rifiuta solo `.xls` (`BP027`).

## Come si dividono i file fra i profili

È la decisione che questa pagina, per un po', non conteneva — e la più facile da sbagliare, perché
sbagliarla non rompe niente: l'apply riesce, l'agente risponde, e la risposta è incompleta o riferita
al documento sbagliato. Tre meccanismi, tutti a query time.

### 1. Un profilo è una partizione interrogata da sola

`QueryByKnowledgeGraph` lancia **una query per profilo**, in parallelo, e **concatena** le risposte
(`KnowledgeGraphPlugIn.cs:602`). Fra profili non esiste join: una domanda che deve incrociare due
famiglie di documenti le incrocia nel prompt, non nel grafo. Quindi due documenti che vanno
correlati **dentro un solo passo di ragionamento** stanno nello stesso profilo; documenti che si
passano il risultato lungo una catena, no.

### 2. Dentro un profilo i file si selezionano per nome

`CanonicalRetriever.SelectSourcesForQuestion` (`CanonicalRetriever.cs:726`) prende le parole della
domanda lunghe almeno quattro caratteri e tiene le sole sorgenti il cui nome ne contiene una; se
qualcuna corrisponde, **le altre sono escluse**. Il commento nel codice la chiama «a correctness
rule, not a ranking preference»: consultare ogni file offrirebbe alla risposta un decoy perfetto —
un record completo, quadrato, della società sbagliata.

Due conseguenze:

- **il nome del file è la chiave di selezione.** Ci va dentro ciò che lo distingue: società,
  periodo. `giornale.xlsx` non è nominabile; `socialware-giornale-2025.xlsx` sì. Due file con le
  stesse parole utili sono indistinguibili, e una domanda su uno recupera anche l'altro;
- **un riferimento che nessuna domanda nomina sparisce.** Uno schema, una tabella di corrispondenza,
  un file di rettifiche: appena un file specifico corrisponde, quello viene escluso. Va in un
  profilo suo.

La nominabilità si misura **dentro il profilo**, non sull'insieme di tutti i documenti: due file che
si somigliano ma vivono in profili diversi non si fanno concorrenza.

### 3. In una catena orchestrata la selezione per nome si spegne

Il messaggio di un passo a valle contiene l'output del precedente — un giornale normalizzato, un
bilancio riclassificato: centinaia di parole, quindi quasi ogni nome file corrisponde, e i dataset
**si caricano interi** (fino a 8 sorgenti, `MaxCanonicalSourcesPerQuery`). Per quegli agenti il
profilo deve contenere **solo** ciò che devono leggere: quello che arriva dal passo precedente è già
nel messaggio, e riaverlo dalla knowledge è puro costo.

### La forma che ne risulta

**Un profilo per agente.** Non è un'estetica: è ciò che rende minima la superficie di query di
ciascun passo, che è l'unica leva disponibile quando la selezione per nome non discrimina.

| Da evitare | Perché |
|---|---|
| Un profilo con tutto dentro, collegato a tutti | Ogni agente carica i documenti degli altri; sul passo a valle il file che gli serve viene superato in classifica da quelli che non gli servono |
| File specifici e riferimenti comuni nello stesso profilo | I riferimenti vengono esclusi appena una domanda nomina i primi |
| Lo stesso profilo su due agenti che leggono cose diverse | Nessuno dei due può dire «questo no» |
| Nomi file generici | Il selettore non ha niente su cui agganciarsi |

`IsDescriptionFiltered` **non** è la soluzione per un agente di catena: il filtro è una chiamata al
modello sul messaggio, e lì il messaggio è enorme. Su un profilo per agente, poi, non c'è niente da
filtrare.

**Ogni profilo attivo consuma una licenza** (§ le quattro cose che vanno male): tre profili sono tre
attivazioni. È il limite che fa da contrappeso allo split, e va verificato prima di proporre una
partizione fine.

### Il comando che la propone

```bash
xrcopilotlab-bp suggest blueprints/<file>.yml --files <cartella> --env staging
```

Propone un profilo per agente, assegna i file dove il nome lo giustifica, lascia **non assegnato**
il resto, e calcola i vincoli: quali file il selettore non distinguerà, e quali dentro il loro
profilo non hanno parole proprie. Non scrive niente.

Perché non raggruppa i file da sé: dai soli nomi il raggruppamento è **ambiguo**. Sui file di
FinLogic — due giornali e due mapping, per due società — le parole condivise formano due dimensioni
incrociate, `{libro, giornale}` da una parte e `{socialware}` dall'altra. «Per tipo» e «per società»
sono entrambe letture legittime, e sono partizioni diverse. Quale sia giusta lo decide il lavoro
degli agenti, e i nomi non lo sanno.

Il validatore segnala gli stessi casi con `BP028`, come **avvisi**: la decisione richiede di sapere
cosa fa ciascun agente.

## Come si scrive nel manifest

```yaml
tenant:
  companyId: <guid>
  topic: Conoscenza associati        # il repository dei file

knowledge:
  - key: associati
    name: Estrazioni associati        # il profilo: il RAG
    description: >
      Le estrazioni del gestionale ingerite per la risoluzione dell'azienda.
    language: it
    # knowledgeGraph: true  ← è il default, si scrive solo per metterlo a false
    files:
      - path: data/estrazioni-2025.xlsx
      # fileType: reference  ← solo se l'utente lo chiede o il dossier lo distingue

agents:
  - key: profilo
    name: AgenteProfilo
    knowledge: [associati]            # i profili collegati all'agente
```

`path` è relativo alla cartella del manifest. Il `push` si porta i file nell'archivio della versione,
accanto al manifest: è ciò che permette a un collega di applicare la stessa versione dalla sua
macchina senza avere la cartella dei dati.

## Cosa dire all'utente, e quando

Prima di applicare, se il manifest dichiara knowledge: **quanti file, quanto pesano, e che
l'ingestione continua dopo la fine dell'apply**. Un giornale contabile da 42.000 righe non si indicizza
nel tempo di un comando, e saperlo prima evita che il primo tentativo in chat venga letto come un
difetto dei prompt.

Se i file non ci sono — perché il dossier li nomina ma nessuno li ha consegnati — **non si inventa un
percorso**: il profilo si dichiara comunque, i file si lasciano fuori, e il caricamento finisce fra i
passi di attivazione. Un profilo vuoto è una condizione onesta; un `path` che punta a un file
inesistente è un piano che fallisce a metà.
