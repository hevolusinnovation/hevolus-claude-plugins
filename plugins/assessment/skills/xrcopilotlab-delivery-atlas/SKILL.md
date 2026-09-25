---
name: xrcopilotlab-delivery-atlas
description: >
  Porta un cliente XRCopilotLab dall'analisi alla delivery Atlas: usa (o riusa) il report di
  xrcopilotlab-assessment, ne ricava fasi, step, deliverable, rischi e dipendenze del cliente
  secondo il metodo Atlas, genera la documentazione per cliente dai template Atlas (D2, D3 o S1,
  Agent Specification, eval set, readiness) e crea o aggiorna la delivery nel CMS Atlas
  (delivery.hevolus.it) tramite il server MCP «atlas», con anteprima e conferma prima di scrivere.
  Usala SEMPRE quando l'utente vuole «avviare la delivery», «aprire il programma Atlas», «creare il
  SOW», «caricare il cliente sull'orchestratore/CMS», «trasformare l'assessment in delivery» o
  preparare offerta, piano e documenti Atlas a partire da una proposta, un'intervista o un dossier
  di assessment — anche se non nomina Atlas o il CMS. Per la sola valutazione tecnica usa
  xrcopilotlab-assessment; per la gestione quotidiana di una delivery già aperta (riunioni, spunte,
  minute) usa la skill atlas.
---

# XRCopilotLab → delivery Atlas

Questa skill chiude la filiera: **proposta o intervista → dossier di assessment → piano Atlas →
documenti per cliente → delivery nel CMS**. L'assessment dice *cosa costruire e se è fattibile*;
Atlas dice *come lo si consegna*: fasi, gate, deliverable con criterio di accettazione,
responsabilità del cliente con scadenza. Il CMS è la fonte unica dello stato del programma, quindi
ciò che scrivi lì deve essere esatto e verificabile: meglio un campo vuoto dichiarato che un dato
inventato.

Prima di cominciare leggi `references/atlas-metodo.md` (fasi, codici, ruoli, taglie, regole di
scrittura). Gli altri reference si leggono quando servono, come indicato nei passi.

## Regole

- **Niente dati inventati.** Persone, email, baseline, punteggi del cliente, date concordate:
  se non stanno nel dossier o nel messaggio dell'utente restano vuoti, diventano un'azione del
  cliente o una domanda. I punteggi di scoring che proponi tu sono etichettati come proposta.
- **Niente importi né giorni persona** nei documenti per cliente: gli investimenti li produce
  l'Atlas Project Calculator, tu lasci `[importo]`. È la regola dei tre strati di C1 e protegge
  l'offerta da cifre non validate.
- **Il linguaggio dell'assessment resta valido**: si parla di agenti XRCopilotLab e MCP server,
  non di framework interni; niente metafore da pitch; lessico Atlas (lavoro ripetitivo, tempo
  liberato, affiancamento — mai sostituzione o riduzione).
- **Prima leggi, poi scrivi** sul CMS; **nessuna scrittura senza conferma** esplicita
  dell'anteprima; **mai** spuntare step o deliverable, chiudere, sospendere, creare riunioni o
  inviare minute: la delivery nasce, non avanza.
- **Il token del server MCP non compare mai** in file, piano, anteprima o risposta.
- Date `AAAA-MM-GG` nei dati; «lunedì prossimo» lo converti tu e dici quale data hai usato.
- Rispondi in italiano.

## Passi

### 1. Procurati il report di analisi

- Se l'utente allega o indica un dossier di assessment (Markdown o Word, di solito in
  `Assessments/<Cliente>/`), leggilo e usalo: non rifare l'assessment.
- Se c'è solo la proposta o l'intervista, **esegui prima la skill `xrcopilotlab-assessment`**
  (invocala e seguine le fasi fino al dossier in Markdown e Word), poi torna qui.
- Se il dossier è vecchio o incompleto (manca la discovery GO/CONDIZIONALE/NO-GO o il catalogo
  agenti), dillo e proponi di completarlo prima: senza readiness la delivery non si pianifica.

### 2. Guarda cosa c'è già nel CMS (sola lettura)

Se gli strumenti `atlas` sono disponibili, chiama `lista_clienti` e `lista_delivery`: servono a
riconoscere il cliente, a evitare doppioni e a capire se esiste già un programma (che porta a un
SOW in continuità). Se non sono disponibili, prosegui con documenti e anteprima e segnala che le
scritture restano in sospeso (vedi `references/mcp-atlas.md`).

### 3. Costruisci il piano della delivery

Leggi `references/mappatura-assessment.md` e scrivi `piano-delivery.json` (schema in
`references/mcp-atlas.md`). In pratica:

- ogni scenario del dossier diventa un processo candidato, con esito del gate nativo;
- ogni fonte dati diventa una riga di readiness (GO → pronto, COND → pronto con lavoro
  preparatorio, NO-GO → non pronto);
- ogni agente del catalogo diventa una voce `agenti[]` (livello iniziale Co-pilot, al massimo un MCP);
- i punti in sospeso diventano azioni (del cliente o Hevolus) o rischi, con la severità del reference;
- le responsabilità standard del cliente (nomine, accessi, 20–50 casi per l'eval set, baseline,
  referente privacy se ci sono dati personali) diventano azioni del cliente con scadenza;
- la taglia di ogni processo segue le regole S/M/L/XL.

### 4. Scegli tipo di delivery e fai confermare

Applica le regole di `references/mappatura-assessment.md` («Scelta del tipo di delivery») e
proponi all'utente, in un solo messaggio: tipo (programma / SOW / personalizzata) con il motivo,
intensità della Fase 1 se programma, Quick Win o processi dei SOW, data di avvio, sigla
(facoltativa), e i dati che mancano davvero (dimensione del cliente se serve alla matrice, nomi
degli stakeholder se l'utente li conosce). Usa lo strumento per domande se disponibile. Se la
sessione è non presidiata, scegli il predefinito motivato, scrivilo in testa alla risposta e
fermati prima delle scritture sul CMS.

### 5. Genera la documentazione

Ogni documento deve avere **lo stesso stile Hevolus / Atlas dei template** (frontespizio con logo,
codice viola, intestazione «CODICE — Titolo», piè di pagina Atlas Framework, Calibri, tabelle viola,
riquadri lilla): il cliente riceve una libreria coerente, non file di formati diversi. Per questo non
scrivere docx da zero: segui `references/documenti.md`, che indica per ogni deliverable lo strumento —
il template vero compilato con `scripts/fill_template.py` (D2, D3, S1), `scripts/atlas_docx.py` per
gli artefatti senza template (Agent Specification, S.0, D1.2, D1.6), `scripts/eval_set_skeleton.py`
per l'eval set.

Salva nella cartella Delivery del cliente se l'utente ne ha collegata una
(`<Delivery>/<Cliente>/<delivery>/`), altrimenti nella cartella di lavoro. Controlla i segnaposto
rimasti e guarda il PDF (frontespizio e pagine con tabelle) prima di consegnare: se una pagina non
somiglia ai template, correggila.

Aggiorna `documenti[]` del piano con i file prodotti (e l'URL, se l'utente te lo dà).

### 6. Anteprima delle scritture

```
python scripts/plan_to_mcp.py piano-delivery.json --out chiamate.json --md anteprima.md --tools <strumenti atlas visti>
```

Mostra l'anteprima all'utente e chiedi conferma. Evidenzia gli avvisi: rischi «alta» (la delivery
nascerebbe in rosso), date non valide, ruoli fuori template, cose da fare a mano (agenti, upload).

### 7. Scrivi sul CMS

Dopo il sì, esegui `chiamate.json` in ordine con gli strumenti `atlas`, sostituendo la sigla reale
dopo `crea_delivery` e rispettando le condizioni «dopo» (es. `crea_cliente` solo se manca). Se esiste
lo strumento `carica_documento` carica i file; altrimenti collega gli URL con `aggiungi_documento`
o lascia l'azione di promemoria. Chiudi con `scheda_delivery` per verificare cosa è stato creato.
Se una chiamata fallisce, fermati e riporta cosa è stato fatto e cosa manca.

## Risposta finale

Breve, in quest'ordine:

1. **Delivery**: sigla, tipo, fase corrente, fine prevista, salute e link (URL del risultato
   anteposto a `https://delivery.hevolus.it`). Se non hai scritto sul CMS, dillo e perché.
2. **Documenti generati**: elenco con codice, titolo e percorso.
3. **Registrato nel CMS**: numero di stakeholder, rischi, azioni, documenti.
4. **Da fare a mano**: agenti da registrare, file da caricare, campi rimasti vuoti (es. importi
   per il Calculator, baseline).
5. **Punti aperti** che bloccano un gate, con la domanda da porre.

## Esempi

**Esempio 1** — «Ho finito l'assessment di Confindustria Como, il dossier è in
Assessments/Confindustria Como. Apri la delivery sul profilo associato, parte il 5 ottobre.»
→ legge il dossier; `lista_delivery` mostra che non c'è un programma → propone SOW stand-alone o
programma con Fase 1 diretta e chiede quale; genera S1, S.0, S.1, S.2; anteprima; dopo il sì
`crea_delivery` (sow, avvio 2026-10-05), stakeholder noti, rischi COND, azioni del cliente.

**Esempio 2** — «Questa è la proposta per Ossola Impianti (PDF). Fai l'assessment e prepara tutto
per Atlas.» → esegue prima xrcopilotlab-assessment fino al dossier; poi piano, scelta del tipo
(programma, workshop se il cliente è strutturato e già orientato), D1.6, D1.2, D3 con importi
lasciati al Calculator, D2.1 e D2.2 del Quick Win; anteprima e conferma.

**Esempio 3** — «Genera solo i documenti Atlas per EffeZeta, al CMS ci penso io.» → passi 1–5,
poi l'anteprima come promemoria delle scritture, senza chiamare strumenti di scrittura.
