# I grafici della guida

Pochi, semplici, sempre gli stessi. Un disegno serve se il cliente lo capisce senza didascalia; se
ha bisogno di una legenda lunga, ha troppi elementi.

Tutti in **Mermaid**: nel Markdown si leggono come testo, nella pagina web diventano disegni. Si
scrivono in un blocco ` ```mermaid ` nel Markdown e in un `<pre class="mermaid">` nella pagina.

## I colori: sempre quattro, sempre con lo stesso significato

| Colore | Chi | `classDef` |
|---|---|---|
| azzurro | **una persona** (chi chiede, chi approva) | `persona` |
| viola | **l'AI** (un assistente che legge, cerca, scrive) | `ai` |
| verde | **un archivio o un servizio** (la base dati, il registro europeo, il web) | `fonte` |
| grigio | **una regola fissa** (se… allora…, la mappa, un controllo) | `regola` |

```
classDef persona fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
classDef ai      fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
classDef fonte   fill:#dcfce7,stroke:#16a34a,color:#14532d
classDef regola  fill:#f3f4f6,stroke:#6b7280,color:#111827
```

Sotto ogni disegno, una legenda di una riga: «azzurro: persone · viola: AI · verde: archivi e servizi · grigio: regole fisse».

## 1. Il flusso — al massimo otto riquadri

Da sinistra a destra, con i passi che il cliente riconosce. I sei rami paralleli diventano **un
riquadro solo** («sei ricerche, nello stesso momento») se il dettaglio non serve alla storia.

```mermaid
flowchart LR
  A([Chiedete di un'azienda]):::persona --> B[L'assistente la trova<br/>nella vostra base dati]:::ai
  B --> C[Sei ricerche<br/>nello stesso momento]:::ai
  C --> D[(Web · registro europeo<br/>social · dossier · bilanci)]:::fonte
  D --> E{C'è l'indirizzo?}:::regola
  E -- sì --> F[La mappa della sede]:::regola
  E -- no --> G
  F --> G[L'assistente scrive la scheda]:::ai
  G --> H([Leggete e decidete]):::persona
  classDef persona fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
  classDef ai      fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
  classDef fonte   fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef regola  fill:#f3f4f6,stroke:#6b7280,color:#111827
```

Il primo e l'ultimo riquadro sono **sempre una persona**: il disegno deve dire da solo che si
comincia e si finisce con qualcuno che decide.

## 2. Dove lavora l'AI — tre corsie

Quando la slide «chi fa che cosa» ha bisogno di un disegno invece delle tre colonne, tre gruppi affiancati con due o tre voci ciascuno:

```mermaid
flowchart LR
  subgraph P[Le persone decidono]
    p1[Chiedono]:::persona
    p2[Approvano]:::persona
  end
  subgraph A[L'AI lavora]
    a1[Legge e cerca]:::ai
    a2[Scrive la scheda]:::ai
  end
  subgraph R[Regole fisse]
    r1[Verifica sul registro]:::regola
    r2[Mappa]:::regola
  end
  p1 --> a1 --> r1 --> a2 --> p2
  a1 --> r2 --> a2
  classDef persona fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
  classDef ai      fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
  classDef regola  fill:#f3f4f6,stroke:#6b7280,color:#111827
```

## 3. Come nasce e come cambia l'ambiente — un ciclo

Per la slide del ciclo, nell'atto «Come è fatto». Il cliente vede che il suo sì sta **prima** di
ogni modifica, e che una correzione non riparte da zero:

```mermaid
flowchart LR
  A[Scriviamo il progetto<br/>del vostro ambiente]:::regola --> B[Vi mostriamo l'elenco<br/>di ciò che cambierà]:::regola
  B --> C([Il vostro sì]):::persona
  C --> D[L'ambiente viene<br/>creato o aggiornato]:::regola
  D --> E([Lo usate, e ci dite<br/>che cosa migliorare]):::persona
  E --> F[Versione nuova:<br/>cambia solo quel pezzo]:::regola
  F --> B
  classDef persona fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
  classDef regola  fill:#f3f4f6,stroke:#6b7280,color:#111827
```

Niente viola qui: il ciclo del progetto non lo fa l'AI.

## 4. Le versioni — una linea del tempo

Cinque o sei tappe scelte fra le versioni del manifest, ciascuna con **che cosa è cambiato per il
cliente** in parole semplici. Serve a mostrare che l'ambiente è migliorato molte volte senza
ripartire da zero. Il perché di una tappa è una cosa che il cliente ha chiesto o mostrato, mai una
prova fallita.

```mermaid
timeline
  title Il vostro ambiente, versione dopo versione
  13 settembre : Prima versione
  17 settembre : Anche LinkedIn e Facebook
  21 settembre : Dove il gestionale non dice niente, la scheda lo dice
  24 settembre : La mappa della sede : Ricerca sul web più approfondita
```

## Regole

- **Niente simboli BPMN**, niente nomi di passi del manifest, niente id.
- **Etichette di due-quattro parole**, con `<br/>` se serve andare a capo.
- **Un disegno per slide, e la slide non porta altro** che una riga di didascalia. L'atto «Come è fatto» ne ha due, in due slide
  (il ciclo e le versioni). La guida non è un catalogo di diagrammi.
- **Nessun grafico dei risultati di collaudo**: niente torte, barre o percentuali di domande superate.
- **Verificare che si disegni**: un errore di sintassi Mermaid nella pagina web mostra il codice al
  posto del disegno. Prima di pubblicare, aprire la copia HTML locale e guardarla.
