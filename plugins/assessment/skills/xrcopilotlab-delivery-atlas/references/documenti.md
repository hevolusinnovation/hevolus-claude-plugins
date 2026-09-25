# Documenti da generare per la delivery

Tutti i file vanno in `<cartella Delivery>/<Cliente>/<nome o sigla della delivery>/`, con nome
`<CODICE>_<Cliente>_<Titolo_breve>.<ext>` (es. `S1_Confindustria-Como_Offerta-SOW.docx`,
`S.1_Confindustria-Como_Agent-Specification_Profilo-associato.docx`). Tieni accanto
`piano-delivery.json` e `anteprima.md`: sono il registro di cosa è stato generato e scritto.

## Stile: sempre quello Hevolus / Atlas dei template

Ogni file che consegni deve sembrare uscito dalla stessa libreria dei template: frontespizio con
logo Hevolus, codice in viola, titolo grande, sottotitolo grigio, blocco «Atlas Framework · tipo ·
fase · versione · Hevolus SRL»; intestazione con logo e «CODICE — Titolo»; piè di pagina «Atlas
Framework · Hevolus SRL · Pagina N»; Calibri; viola `5E4F9C`, testo `23242B`, grigio `4B4D57`;
tabelle con intestazione viola e righe alterne lilla `F3F2F8`; riquadri lilla con bordo sinistro
viola («Contesto nel programma Atlas», «Criterio di uscita»); nota di proprietà in corsivo in fondo.
Mai il template del dossier di assessment (Aptos), mai un docx «nudo» di python-docx.

Tre strumenti, in quest'ordine di preferenza:

1. **Il template vero** (D2, D3, S1, O1 in `assets/templates/`) compilato con
   `scripts/fill_template.py`: conserva tutto il layout.
2. **`scripts/atlas_docx.py`** per gli artefatti di step senza template proprio (Agent
   Specification D2.1/S.1, verbale S.0, readiness D1.2, sintesi del workshop D1.6): scrivi il
   Markdown e lo script lo impagina con lo stile Atlas, partendo da `assets/templates/atlas_base.docx`
   (logo, intestazione, piè di pagina, stili ed elenchi dei template). Apri il corpo con il riquadro
   di contesto in forma `> **Contesto nel programma Atlas**` + le tre righe «Da dove veniamo / Dove
   siamo / Dove andiamo», e chiudi con `> **Criterio di uscita**` e le voci `✓ …`, come i template.
3. **`scripts/eval_set_skeleton.py`** per l'eval set: il foglio esce già con Calibri, intestazione
   viola, bordi e righe alterne Atlas.

Se aggiungi slide a D2, duplica una slide esistente del template (stesso layout, logo, piè di
pagina) invece di crearne una vuota.

```
python scripts/fill_template.py assets/templates/S1_Offerta_implementazione_processi.docx OUT.docx spec.json
python scripts/atlas_docx.py agent-spec.md OUT.docx --codice "S.1" --titolo "Agent Specification — <agente>" \
  --sottotitolo "<una frase: cosa fa l'agente e per chi>" --tipo "Documento per cliente · Bozza da firmare" \
  --fase "Ramo SOW · Stage Frame" --versione "Versione 0.1 · Ottobre 2026"
python scripts/eval_set_skeleton.py OUT.xlsx --agente "<agente>" --casi 30 --failure "..." --metriche "..."
```

Nei template compilati **riscrivi** il riquadro «Contesto nel programma Atlas» con il contesto del
cliente (chiave `boxes` di `fill_template.py`: stesso titolo e stile, righe nuove) e **togli** i
riquadri che parlano a chi compila il modello: `"remove_boxes": ["Regole di compilazione",
"Due situazioni, un modello", "Criterio di uscita"]` (il criterio di uscita dei template è una
checklist per chi compila). Non riscrivere con `tables` le tabelle-Gantt («Settimana | 1 | 2 | …»):
le celle colorate andrebbero perse; lasciale del template se la durata coincide, altrimenti descrivi
il piano per stage in un paragrafo e togli la tabella.

Dopo ogni `fill_template.py` leggi l'elenco dei segnaposto rimasti: `[importo]`, firme, luogo e
data restano volutamente vuoti; tutto il resto va compilato o dichiarato come punto aperto nella
risposta finale. Converti ogni documento in PDF (`soffice --headless --convert-to pdf`) e guarda
almeno le pagine con tabelle prima di consegnare.

## Pacchetto per tipo di delivery

**SOW** (per ogni processo, una delivery):
1. **S1 — Offerta di implementazione processi** (template S1): una sola variante di §11 (A in
   continuità, B stand-alone; togli l'altra con `remove_paragraphs` o riscrivendo il paragrafo).
2. **S.0 — Verbale di verifica dei prerequisiti** (bozza, `atlas_docx.py`): la tabella dei componenti
   di S1 §3 con lo stato che risulta dall'assessment e la colonna «verifica» da eseguire nel Frame.
3. **S.1 — Agent Specification** per ogni agente del processo (`atlas_docx.py`, modello sotto).
4. **S.2 — Eval set v1 e scheda metriche** (scheletro xlsx con `eval_set_skeleton.py`).

**Programma**:
1. Fase 1 secondo l'intensità:
   - *discovery* → **D2 — Report di Discovery** (template pptx) con le slide compilate dall'assessment;
   - *workshop* → **D1.6 — Sintesi del workshop** (2 pagine, `atlas_docx.py`) al posto di D2;
   - *diretto* → nessun documento di Fase 1: readiness, gate nativo e baseline confluiscono in D2.1.
2. **D1.2 — Readiness dati e integrazioni** (`atlas_docx.py`, un sistema per blocco) — salvo *diretto*.
3. **D3 — Proposta commerciale** (template D3): una sola variante in §5.1.
4. **D2.1 — Agent Specification** del Quick Win (`atlas_docx.py`).
5. **D2.2 — Eval set v1** del Quick Win (scheletro xlsx).

**Personalizzata**: nessun template di offerta obbligatorio; genera solo i documenti che l'utente
chiede e, se il progetto porta a un agente, la Agent Specification.

I documenti di metodo (C1, C2, A0, P0, D1, Q1, Q2, Q3, E1) non si rigenerano: la delivery li eredita
dalla Libreria del CMS. O1 si compila solo in Fase 4, non all'avvio.

## Compilazione dei template

### D3 — Proposta commerciale (docx)
Tabelle (chiave `header` per `fill_template.py`):
- `Voce | Valore` — riferimenti: cliente, referente, n. proposta `HEV-AAAA-nnn` (lascia il segnaposto
  se non noto), versione e data, oggetto.
- `Fase | Durata | Risultato | Investimento` — una riga per fase effettivamente offerta; investimento `[importo]`.
- `Processo | Volume | Tempo attuale per caso | Principale attrito` — dal canvas/assessment.
- `Indicatore | Valore attuale | Fonte | Obiettivo di scenario` — baseline (segnaposto se ignota).
- `Strato | Cosa contiene | Per questo intervento` — sistemi in perimetro, connettori MCP con pattern, agente.
- `Incluso | Escluso` — perimetro: l'escluso comprende sempre i livelli Assisted/Autonomous.
- `Variante | Durata | Attività | Deliverable | Milestone` — **una sola riga** (A, B o C).
- `Responsabilità | Entro | Impatto se mancante` — mantieni le righe standard, aggiungi quelle che
  derivano dai punti in sospeso.
Paragrafi: §2 sintesi, §3.1 obiettivo (4–6 righe con le parole emerse, niente citazioni letterali
di documenti del cliente), §3.2 as-is, §4.2 capacità dell'agente (3 voci). Togli i paragrafi di
istruzione «Mantenere una sola delle tre varianti; eliminare le altre.» e valuta ogni `[opz.]`.
§11 e §12: lascia gli importi al Calculator e le clausole invariate (validate dal legale).

### S1 — Offerta SOW (docx)
- `Voce | Valore` — riferimenti (accordo di riferimento solo in variante A).
- `Processo | Durata | Livello alla consegna | Investimento` — una riga per processo + Totale; durata
  dalla taglia (S 3–4, M 6–8, L 10–14 settimane).
- `Componente | Stato dichiarato dal cliente | Realizzato da | Verifica di Hevolus` — prerequisiti
  dall'assessment (piattaforma XRCopilot, identità, connettori esistenti, osservabilità, ambiente di
  test, responsabile interno, kit Evaluate). Stato non noto → «da dichiarare dal cliente».
- `Voce | [Processo 1] | [Processo 2]` — scheda di perimetro per processo: una colonna per processo.
  Se il processo è uno solo, lascia vuota la terza colonna o scrivi «—».
- `Responsabilità | Entro | Impatto se mancante` — standard + punti in sospeso del cliente.
Taglia e motivazione: applica le regole di `atlas-metodo.md` §5 alle fonti del processo.

### D2 — Report di Discovery (pptx, 12 slide)
Slide 1 `[Cliente]`, `[Data]`. Slide 2 le tre cose da portare a casa. Slide 3 tabella sessioni
(`Sessione | Partecipanti`) con le sessioni effettivamente svolte: se l'assessment è stato
un'intervista, scrivilo, non inventare sessioni. Slide 4 obiettivi e vincoli. Slide 5 maturità:
tabella `Dimensione | Oggi` + grafico radar (`charts` con `categories` e serie «Oggi»/«Target»).
Slide 6 processi (`Processo | Area`). Slide 7 readiness (`Sistema | Accesso`) con l'esito da GO/COND/
NO-GO. Slide 8 portafoglio (`Processo | Valore`) + dispersione (`xy`: [fattibilità, valore]) —
punteggi marcati come proposta. Slide 9 il Quick Win as-is / to-be. Slide 10 baseline. Slide 11
roadmap. Slide 12 decisioni di oggi. Rimuovi le note «Valori di esempio…» solo se hai messo valori
reali; se sono proposte, sostituiscile con «Punteggi proposti da Hevolus, da validare in sessione».

## Modello Agent Specification (Q1 §4) — Markdown per `atlas_docx.py`

```markdown
> **Contesto nel programma Atlas**
> **Da dove veniamo.** <assessment svolto, scenario scelto, eventuale programma già attivo>.
> **Dove siamo.** Questa è la specifica dell'agente <nome> per <processo>, da validare nel Frame.
> **Dove andiamo.** Con la firma del process owner si apre lo stage Evaluate.

## 1. Identità
Nome, versione 0.1 (bozza), responsabile Hevolus (Delivery Manager), responsabile cliente (process owner), data.

## 2. Scopo
Una frase: cosa fa l'agente e per chi.

## 3. Utenti e canale
Chi lo usa, dove (chat XRCopilot o widget sul sito del cliente), quando.

## 4. Perimetro
Processo, casi in perimetro, casi esclusi.

## 5. Esito del gate nativo
Nativo / ibrido / custom, con la motivazione (cosa la piattaforma fa già nativamente).

## 6. Dati e sistemi
Fonti, operazioni consentite (lettura / scritture elencate), MCP collegato (al massimo uno), esito di readiness.

## 7. Livello di autonomia
Iniziale Co-pilot; target a 6 mesi; soglie proposte per l'Autonomy gate (C2 §4.2).

## 8. Failure mode critiche
Elenco esplicito (parti da Q1 §3.3 e dal «cosa NON fa» della bozza di prompt).

## 9. Criteri di successo
Metrica primaria (Q1 §3.2 per tipo di agente), soglia di pass rate proposta, collegamento alla baseline.

## 10. Rischio e conformità
Classificazione AI Act (minimo / limitato / alto), dati personali, supervisione umana, DPIA sì/no.

## 11. Bozza di comportamento
La bozza di system prompt dall'assessment, in un blocco di codice, marcata come bozza.

## 12. Punti aperti
Solo quelli che riguardano questo agente, con la domanda da porre.

## 13. Firme
Process owner · Delivery Manager

> **Criterio di uscita**
> ✓ Specifica firmata dal process owner.
> ✓ Esito del gate nativo e failure mode critiche documentati.
> ✓ Soglie dell'Autonomy gate proposte e confermate.
```

Scrivi in prosa breve, senza tabelloni: la regola di leggibilità dell'assessment vale anche qui.
