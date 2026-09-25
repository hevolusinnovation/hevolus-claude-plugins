# Il metodo Atlas in sintesi (v0.5, settembre 2026)

Estratto operativo dei documenti C1, C2, D1, D3, Q1, S1, E1, O1. Serve per compilare i
documenti per cliente e per costruire il piano della delivery nel CMS. Se un dettaglio
manca qui, la fonte è il template in `assets/templates/` o la Libreria del CMS.

## Indice
1. Fasi e gate
2. Fase 1 a intensità variabile
3. Codici dei deliverable (programma e SOW)
4. Ruoli e stakeholder del template
5. Ciclo agente, taglie, autonomia
6. Scoring Valore × Fattibilità e readiness
7. Regole di scrittura che valgono per tutti i documenti

## 1. Fasi e gate

Un programma ha cinque fasi, ognuna chiusa da un gate che nel CMS è uno step come gli altri.

- **0 · Pre-vendita** (1–2 incontri): awareness e sponsor. Gate **G0**: si sceglie l'intensità della Fase 1.
- **1 · Discovery, workshop o nulla** (0–3 settimane): processi mappati con chi li esegue, Quick Win scelto, readiness dei dati. Gate **G1**: portafoglio approvato, Quick Win scelto, baseline definita, D3 firmata.
- **2 · Quick Win** (6–10 settimane): primo agente in esercizio in Co-pilot su perimetro chiuso. Gate **G2**: pass rate ≥ soglia, valore misurato sulla baseline, runbook consegnato.
- **3 · Scale e autonomia** (continua, per SOW): un SOW per ogni agente successivo, passaggi di autonomia. Gate **G3**: SOW approvato; Autonomy gate per agente.
- **4 · Operate e handover** (trimestrale): report O1, pacchetto di handover. Gate **G4**: cliente autonomo o Membership.

Una delivery **SOW** sostituisce le fasi 0–2 con il ramo **S** (stage S.F Frame, S.E Evaluate,
S.B Build, S.I Iterate, S.P Pilot, S.C Consegna, gate **MC** di consegna) e poi prosegue con le
fasi 3 e 4. Nel CMS il ramo S di una delivery copre **un** processo: più processi = più delivery
SOW (la stessa offerta S1 può coprirli tutti).

## 2. Fase 1 a intensità variabile (C1 §2.1)

- Cliente grande o strutturato, non ancora convinto → **discovery** completo (2–3 settimane, 7 step).
- Grande già convinto, oppure piccolo/medio non ancora convinto → **workshop** di un giorno (2 step) + 1 settimana di stesura.
- Piccolo/medio già convinto, con caso d'uso chiaro → **diretto**: nessuna Fase 1, Frame esteso di una settimana in 2.1.

In ogni intensità restano obbligatorie: readiness di dati e integrazioni, gate nativo sul caso
d'uso, baseline. Se il Frame esteso trova dati non pronti si torna al workshop.

## 3. Codici dei deliverable

**Fase 1** — D1.1 Canvas dei processi · D1.2 Readiness dati e integrazioni · D1.3 Portafoglio
scorato · D1.4 Report di Discovery (= documento D2) · D1.5 Proposta Quick Win (= D3) ·
D1.6 Sintesi del workshop (2 pagine, solo variante workshop).

**Fase 2 (Quick Win)** — D2.1 Agent Specification (firmata dal process owner) · D2.2 Eval set v1 e
scheda metriche · D2.3 Agente in ambiente di test · D2.4 Connettori in perimetro · D2.5 Agente sopra
soglia · D2.6 Eval set v2 e note di rilascio · D2.7 Comunicazione e materiale utenti · D2.8 Cruscotto
di misurazione · D2.9 Runbook v1 · D2.10 Report di fine Quick Win · D2.11 Registro degli agenti.
Milestone M2 = gate G2.

**Fase 3** — D3.1–D3.11 come D2.n per ogni SOW · D3.12 Verbale di Autonomy gate · D3.13 Schede di
ruolo · D3.14 Piano di comunicazione · D3.15 Piano di reskilling.

**Fase 4** — D4.1 Report trimestrale di valore (= O1) · D4.2 Pacchetto di handover.

**SOW (ramo S)** — S.0 Verbale di verifica dei prerequisiti (dipendenza cliente) · S.1 Agent
Specification · S.2 Eval set v1 e scheda metriche (dipendenza cliente) · S.3 Connettori da
realizzare · S.4 Agente in ambiente di test · S.5 Agente sopra soglia, eval v2, note di rilascio ·
S.6 Agente in esercizio in Co-pilot · S.7 Runbook e rollback · S.8 Sessione di consegna e registro ·
S.9 Report di consegna. Gate MC. Poi S1 (offerta SOW), D3.12–D3.15, D4.1, D4.2.

Documenti di base ereditati dalla Libreria del CMS: C1 · C2 · A0 · P0 · D1 · D2 · D3 · Q1 · Q2 ·
Q3 · S1 · E1 · O1. Quelli **di metodo** (C1, C2, A0, P0, D1, Q1, Q2, Q3, E1) non si ricompilano per
cliente: sono già collegati alla delivery. Quelli **per cliente** (D2, D3, S1, O1) si compilano.

## 4. Ruoli e stakeholder del template

Hevolus (5): Direzione commerciale · Delivery Manager · Senior Architect · Agent Developer ·
Practice Lead Atlas.
Cliente (7): Sponsor esecutivo · Process owner · Champion · Referente IT · Referente privacy ·
Responsabile interno degli agenti · Comitato strategico.

Nel CMS nascono vuoti («da compilare»). Si compilano solo con nomi ed email che compaiono nel
dossier o che l'utente fornisce. Il flag `sponsor` va allo Sponsor esecutivo, `champion` al process
owner che ha co-creato; `riceve_minute` a sponsor e process owner salvo indicazione diversa.

## 5. Ciclo agente, taglie, autonomia (Q1, C2)

Sei stage: Frame (3–5 gg; 1 settimana se esteso) → Evaluate (3–7 gg) → Build (5–10 gg) → Iterate
(5–10 gg) → Pilot (2–4 settimane) → Operate. Tre regole non negoziabili: nessun agente custom senza
gate nativo nel Frame; nessun Build senza eval set di 20–50 casi reali; ogni agente parte in Co-pilot.

Taglie (Fase 3 e SOW):
- **S** — caso nativo o ibrido, un sistema, dati pronti / connettore esistente: 3–4 settimane.
- **M** — agente custom, 1–2 sistemi con API, dati di media qualità: 6–8 settimane.
- **L** — custom, 2–3 sistemi di cui uno senza API, lavoro preparatorio sui dati: 10–14 settimane.
- **XL** — più agenti coordinati, data platform, integrazioni complesse: oltre 14 settimane, più rilasci.

Livelli di autonomia nei documenti (C2): **Co-pilot** (propone, l'umano decide) → **Assisted**
(esegue i casi standard, chiede sulle eccezioni) → **Autonomous** (esegue e segnala). Autonomy gate
Co-pilot→Assisted: 4 settimane, pass rate ≥ 95%, correzioni ≤ 10%, avversari ≥ 95%, zero failure
mode, rollback provato. Assisted→Autonomous: 8 settimane, ≥ 98%, ≤ 3%, avversari 100%.

Attenzione: la scheda **Agenti** del CMS usa etichette diverse — «assistente (propone)», «co-pilot
(esegue con conferma)», «autonomo». Corrispondenza: Co-pilot → *assistente*, Assisted → *co-pilot*,
Autonomous → *autonomo*. Nei documenti usa sempre i termini di C2.

## 6. Scoring Valore × Fattibilità e readiness (D1 §5–6)

Valore (60%): tempo liberato 20 · frequenza e volume 20 · risparmio economico 20 · persone
coinvolte 15 · strategicità 15 · autonomia raggiungibile 10.
Fattibilità (40%): sistemi e integrazioni 20 · qualità dati 25 · standardizzazione 25 · rischio e
conformità 15 · maturità del process owner 15. Punteggi 1–5.
Bande (soglia 3,0 su entrambi): **Quick Win** (V≥3, F≥3) · **Progetto strategico** (V≥3, F<3) ·
**Miglioramento incrementale** (V<3, F≥3, spesso nativo) · **Da rivalutare** (V<3, F<3).

Il Quick Win deve avere: readiness almeno «pronto con lavoro preparatorio», process owner
disponibile come champion, baseline misurabile in meno di due settimane, perimetro chiudibile in
6–10 settimane, impatto degli errori basso o reversibile.

Readiness per sistema: accesso (API · webhook · database · export · solo UI), autenticazione
(mai credenziali personali per gli agenti), dati, qualità, proprietà e vincoli (DPIA se serve),
ambiente di test, piattaforma dati, **esito**: pronto · pronto con lavoro preparatorio · non pronto.
Pattern di integrazione in ordine di preferenza: API/webhook → lettura DB → export pianificati →
agente browser sull'interfaccia (fallback dichiarato).

## 7. Regole di scrittura per tutti i documenti

- **Tre strati separati** (C1 §4.2): stima interna (giorni persona, tariffe, ricarichi) — offerta
  al cliente (solo investimento e durata) — accordi con fornitori. Nei documenti per cliente non
  compaiono mai giorni persona né tariffe. Gli importi li produce l'**Atlas Project Calculator**:
  lascia `[importo]` e segnalalo, non inventare cifre.
- Ogni impegno Hevolus è un deliverable con criterio di accettazione; ogni dipendenza del cliente
  ha una scadenza.
- Le stime di beneficio sono **stime di scenario** costruite sulla baseline, mai garanzie.
- I punteggi di scoring e i canvas li compilano i process owner: quelli derivati dall'assessment
  sono **proposte da validare in sessione** e vanno etichettati così.
- Lessico: lavoro ripetitivo, tempo liberato, affiancamento, proposta. Mai sostituzione,
  automazione delle persone, riduzione.
- Date AAAA-MM-GG nei dati e nel CMS; nei documenti va bene «5 ott 2026».
