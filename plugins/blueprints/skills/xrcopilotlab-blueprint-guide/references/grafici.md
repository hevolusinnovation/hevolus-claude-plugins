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

Quando la sezione 3 ha bisogno di un disegno, tre gruppi affiancati con due o tre voci ciascuno:

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

## 3. L'esito del collaudo — una torta

I numeri dell'ultimo giudizio, tre fette al massimo, con etichette nella lingua del cliente:

```mermaid
pie showData
  title 47 domande di prova
  "Giuste" : 40
  "Da correggere (bilanci e dossier)" : 6
  "Parzialmente giuste" : 1
```

Accanto, sempre, la tabella di stato per parte dello scenario (✅ pronta · 🟡 in correzione ·
⛔ non ancora · ⏳ attende un servizio): la torta dà la misura, la tabella dice **dove**.

## 4. Come si fanno le prove — un ciclo

```mermaid
flowchart LR
  A[Scriviamo le domande<br/>e le risposte giuste]:::persona --> B[Le facciamo girare<br/>tutte, in automatico]:::regola
  B --> C[Una persona legge<br/>ogni risposta]:::persona
  C --> D[Ciò che non va<br/>si corregge]:::ai
  D --> B
  classDef persona fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
  classDef ai      fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
  classDef regola  fill:#f3f4f6,stroke:#6b7280,color:#111827
```

## 5. Le versioni — una linea del tempo

Cinque o sei tappe scelte fra le versioni del manifest, ciascuna con il suo perché in parole
semplici. Serve a mostrare che l'ambiente è migliorato molte volte senza ripartire da zero.

```mermaid
timeline
  title Il vostro ambiente, versione dopo versione
  13 settembre : Prima versione collaudata
  17 settembre : Anche LinkedIn e Facebook
  21 settembre : Nessun «no» dove il gestionale non dice niente
  24 settembre : La mappa della sede : Ricerca sul web più approfondita
```

## Regole

- **Niente simboli BPMN**, niente nomi di passi del manifest, niente id.
- **Etichette di due-quattro parole**, con `<br/>` se serve andare a capo.
- **Un disegno per sezione, al massimo.** La guida non è un catalogo di diagrammi.
- **Verificare che si disegni**: un errore di sintassi Mermaid nella pagina web mostra il codice al
  posto del disegno. Prima di pubblicare, aprire la copia HTML locale e guardarla.
