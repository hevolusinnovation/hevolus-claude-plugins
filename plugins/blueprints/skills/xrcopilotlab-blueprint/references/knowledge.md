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

## Le tre cose che vanno male

**L'attivazione consuma licenza, e senza licenza risponde 403.** Il controllo sta in
`ActivateIndex`: serve un prodotto di scope `XRCopilotLab.Profile` sul tenant, e il numero di
profili con `IsActive = 1` non può superare la somma delle quantità licenziate. I due messaggi sono
`No profile activation licenses found for this company` e `Active profiles limit reached`. Non è una
condizione da interpretare: si riporta all'utente così com'è, perché la risolve chi amministra le
licenze, non chi applica il blueprint.

**L'ingestione è asincrona, e l'apply no.** `activateIndex` torna appena il lavoro è accodato. Un
`apply` che finisce lì dichiara creato ciò che sta ancora costruendosi: l'utente apre la chat, il
grafo è a metà, l'agente risponde a vuoto — sintomo identico a quello di un prompt sbagliato.
`GetIndexingStatus` è il modo di saperlo, e va interrogato prima di dire che è finita.

**`.xlsm` e `.xls` passano il selettore e poi non vengono ingeriti.**
`KnowledgeDialog.razor:1142` li elenca fra le estensioni ammesse; `ReadDocumentContentAsync`
(`DocumentsPlugin.cs:39`) gestisce `.xlsx` ma non loro, e finisce su
`NotSupportedException: File format .xlsm is not supported`. Un workbook con macro va convertito in
`.xlsx` **prima** di caricarlo. La conversione pulita non passa da un round-trip che riscrive le
celle: si apre il pacchetto OPC, si toglie `vbaProject.bin` e si correggono i content type, così
formule e valori in cache restano quelli originali.

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
