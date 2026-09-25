# Dal dossier di assessment al piano Atlas

Il dossier prodotto da `xrcopilotlab-assessment` ha le sezioni 0–9 (executive summary, scenari,
architettura, eventuale processo BPM in 2-bis, catalogo componenti, fonti dati, discovery tecnica
GO/CONDIZIONALE/NO-GO, privacy, punti in sospeso, elementi per il provisioning, appendice prompt).
I dossier più vecchi non hanno 2-bis né il capitolo per il provisioning e l'appendice è la §8: la
mappatura vale lo stesso, per contenuto e non per numero. Qui c'è come ogni parte alimenta la delivery.

## Corrispondenze

**§0 Executive summary** → obiettivo in una frase (D3 §2 / S1 §2), sintesi della slide 2 di D2,
campo `note` del cliente nel CMS (una riga, niente dettagli riservati).

**§1 Scenari: obiettivi → soluzione** → ogni scenario è un **processo candidato**. Gli obiettivi
citati dalla proposta diventano gli «Obiettivi espressi» (slide 4 di D2) e il §3.1 di D3. Il
«come è risolto» dà l'esito del **gate nativo**: tutto nativo → *nativo*; nativo + agenti
configurati senza nuovi MCP → *ibrido*; servono MCP da costruire o logica custom → *custom*.

**§2 Architettura** → D3 §4.1 (i tre strati: sistemi esistenti · strato MCP · agenti su
XRCopilot). Nessun nome di framework interno: vale il linguaggio dell'assessment.

**§2-bis Il processo (BPM)** → se lo scenario è un procedimento, le attività in ordine con la loro
modalità (umano / AI-assistito / automatico) diventano il perimetro della Agent Specification e i
casi dell'eval set; il «piano di adozione delle modalità» è la ladder di autonomia (tutto parte in
Co-pilot o in umano). I «limiti dichiarati» del BPM sono componenti da costruire: vanno nel
perimetro con la loro taglia o tra le esclusioni.

**§3 Catalogo componenti** → per ogni agente: una voce `agenti[]` del piano (nome, processo,
livello iniziale Co-pilot, MCP collegato) e la base della **Agent Specification** (D2.1 o S.1):
scopo, perimetro, dati e sistemi, cosa non deve fare (dalla bozza di system prompt). Gli MCP da
costruire diventano «Connettori da realizzare» (S.3 / D2.4). L'Orchestratore non è un agente: non
va nel registro.

**§4–5 Fonti dati e discovery tecnica** → **readiness** (D1.2, slide 7 di D2, S1 §3):
🟢 GO → *pronto*; 🟡 CONDIZIONALE → *pronto con lavoro preparatorio* (il fallback è il lavoro
preparatorio); 🔴 NO-GO → *non pronto* (il fallback è il pattern di integrazione alternativo).
I test di fattibilità proposti diventano azioni del Senior Architect nello stage Frame.

**§6 Privacy e GDPR** → classificazione del rischio e dati personali nella Agent Specification e
nella scheda di perimetro S1 §4; se ci sono dati personali: azione del cliente «nominare il
referente privacy» e, prima del Pilot, DPIA (C2 §3.1).

**§7 Punti in sospeso** → non si risolvono: diventano
- **azioni del cliente** (`del_cliente: true`, owner = ruolo del cliente, `entro` = fine Frame o
  data concordata) quando la risposta spetta al cliente;
- **azioni Hevolus** quando spetta al sales o al Delivery Manager;
- **rischi** quando, se la risposta è sfavorevole, il perimetro o i tempi saltano.
Nei documenti restano come «assunzione da confermare» o come segnaposto dichiarato.

**§8 Elementi per il provisioning** → è l'input del plugin `blueprints` nello stage Build (S.B /
2.3), non della delivery: tag e topic vanno nella Agent Specification («Dati e sistemi»), i segreti
citati per nome diventano un'azione del Referente IT («fornire le credenziali applicative»), i passi
manuali residui (connessioni, server MCP, orchestratori) diventano azioni Hevolus dello stage Build.

**§9 Appendice (bozze di prompt)** → allegato della Agent Specification, sezione «Scopo e
comportamento». La bozza resta bozza: è Build a renderla definitiva.

## Severità dei rischi (con criterio, perché «alta» manda la delivery in rosso)

- **alta**: NO-GO su una fonte indispensabile al Quick Win o al processo del SOW, senza fallback
  accettabile; dati personali ad alto rischio (C2 §3.1) senza referente privacy.
- **media**: CONDIZIONALE su una fonte del perimetro; punto in sospeso che può cambiare taglia o
  tempi; dipendenza da un fornitore terzo del cliente.
- **bassa**: tutto il resto che vale la pena tracciare.
Se dopo questa regola un rischio resta «alta», dillo esplicitamente nell'anteprima.

## Scelta del tipo di delivery

Decidi con questi segnali, poi fai confermare all'utente.

1. **Il cliente ha già un programma Atlas** con Hevolus (in `lista_delivery` c'è un programma con
   G1 superato o una D3 firmata) → **SOW** in continuità, S1 variante A, una delivery per processo.
2. **Il cliente ha una piattaforma agentica realizzata altrove** e chiede solo l'implementazione →
   **SOW stand-alone**, S1 variante B.
3. **Altrimenti programma**, con la Fase 1 dalla matrice di C1 §2.1. Un assessment nato da
   un'intervista con casi d'uso già chiari indica di norma un cliente *già convinto*: **workshop**
   se grande o strutturato, **diretto** se piccolo o medio. Se la proposta è generica o gli scenari
   sono molti e poco definiti, **discovery**.
4. **Personalizzata** (`crea_delivery_personalizzata`) solo quando il lavoro non è una consegna di
   agenti secondo il ciclo Atlas (es. architettura di un data lake, creazione del team di
   implementazione) o quando l'utente lo chiede.

Con più scenari in un programma: il Quick Win è il candidato in banda Quick Win che soddisfa i
requisiti di D1 §6.4; gli altri vanno in D2 come portafoglio e roadmap (progetti strategici, futuri
SOW). Non creare nel CMS delivery per i progetti futuri se l'utente non lo chiede.

Dimensione del cliente: usa ciò che dice il dossier (società, sedi, numero di persone coinvolte).
Se non c'è, chiedilo insieme alla conferma del tipo.

## Punteggi di scoring

L'assessment non contiene i punteggi dei process owner. Proponili tu criterio per criterio,
motivandoli con il dossier (volumi, fonti GO/COND/NO-GO, standardizzazione), e marcali
«proposta Hevolus, da validare nella sessione di scoring». Non presentarli mai come punteggi del
cliente.

## Baseline

Quasi mai presente nel dossier. Usa i valori citati dalla proposta se esistono (con la fonte),
altrimenti lascia i segnaposto e crea l'azione del cliente «Fornire la baseline del processo
(tempo per caso, casi/mese, errori, attraversamento)» con scadenza fine Frame.
