# Struttura del dossier di assessment

Template a 9 sezioni. Adatta i titoli al progetto ma mantieni l'ordine: prima cosa vuole il
cliente, poi come lo si realizza, poi se è fattibile, infine i dettagli.

```
# <Titolo del report>

<Breve descrizione testuale del contenuto: 1-2 frasi che dicono di cosa tratta il documento
(es. "Report tecnico che traduce la proposta X nella soluzione ad agenti XRCopilotLab, con
analisi di fattibilità delle fonti dati e punti aperti per l'incontro tecnico.").>

## 0. Executive summary e modello di erogazione
   - 3-5 righe sugli scenari
   - modello: agenti XRCopilotLab + MCP; cosa è nativo vs cosa si costruisce
   - principio guida (1 MCP per fonte, 1 agente = 1 MCP, riuso per composizione)

## 1. Gli scenari: obiettivi di progetto → soluzione ad agenti
   - per scenario, in prosa: gli obiettivi (citati dal testo) e come sono risolti (nativo / agente / MCP)
   - una tabella breve è ammessa solo se resta a 2-3 colonne con celle di poche parole (es. Obiettivo | Realizzato da)
   - orchestrazione degli agenti descritta a parole (chi coordina chi)

## 2. Architettura tecnica su XRCopilotLab
   - vista d'insieme (diagramma mermaid: fonti → MCP → piattaforma)
   - orchestrazione per scenario
   - riuso su altri clienti (template + composizione)

## 2-bis. Il processo (solo se lo scenario è un procedimento)
   - il flusso in prosa: cosa lo fa partire, chi interviene, dove finisce
   - le attività in ordine; per ognuna: modalità (umano / AI-assistito / automatico), ruolo aziendale
     della corsia, campi del modulo, condizioni dei gateway in uscita
   - una tabella breve va bene qui: Attività | Modalità | Ruolo
   - avvio (manuale con modulo, o webhook) e permessi di avvio
   - piano di adozione delle modalità: cosa parte in umano e a quali condizioni si promuove
   - limiti dichiarati: cosa lo scenario chiede e il BPM non fa, con il componente da costruire

## 3. Catalogo componenti
   - Agenti: un breve blocco per agente (nome, ruolo in una frase, MCP collegato max 1 o "nessuno")
     seguito dalla BOZZA di system prompt in un blocco di codice — NON dentro una tabella
   - MCP server: elenco descrittivo (nome, a cosa serve, fonte, se nativo o da costruire); tabella
     solo se a 2-3 colonne brevi

## 4. Approfondimento fonti dati esterne
   - per ogni fonte: vie di accesso, criteri GO/COND/NO-GO (vedi data-sources-italy.md)

## 5. Discovery tecnica: dalle domande della proposta alle verifiche
   - in prosa: per ciascun componente/fonte, prerequisito, test proposto ed esito 🟢/🟡/🔴 con fallback
   - scheda di rilevazione come elenco puntato di domande (non un tabellone)
   - eventuale tabella riassuntiva solo a 2-3 colonne brevi (Componente | Esito | Fallback)

## 6. Privacy e GDPR by design
   - mappatura requisiti → dove sono implementati

## 7. Punti in sospeso (domande aperte per il sales/cliente)
   - elenco descrittivo: per ogni punto un bullet con titolo in grassetto, la frase su scenario/
     componente e perché è aperto, e la domanda da porre (+ eventuale "assunzione da confermare").
     NON una tabella a molte colonne. Copre fonti non definite, parametri di origine ignota,
     ambiguità, prerequisiti non verificabili, decisioni non tecniche. Nessun punto risolto a invenzione.

## 8. Elementi per il provisioning (blueprint)
   - tag suggerito (prefisso BP-<TAG>- su tutto ciò che verrà creato)
   - topic e documenti da caricare; ruoli aziendali con i membri; agenti (nome, system message,
     skill, topic); agent task; processo (attività, modalità, corsie, moduli, gateway, avvio)
   - segreti necessari citati PER NOME, mai per valore
   - passi manuali residui: connessioni, server MCP, orchestratori, campo modulo allegato

## 9. Appendice
   - bozze complete di system prompt degli agenti (con placeholder)
   - note implementative
```

Regole di stile: documento **tecnico e leggibile**, basato su **prosa** e sottotitoli chiari;
tabelle solo per dati brevi (max 3-4 colonne, celle di poche parole) — mai tabelloni con frasi nelle
celle, che vanno riscritti in prosa. Niente pricing né linguaggio di vendita, e nessun gergo interno
(framework di orchestrazione, prodotti inesistenti): si parla solo di agenti XRCopilotLab e MCP server. Gli esiti 🟢/🟡/🔴 servono a chi prepara la quotazione. Cita il testo della proposta
per gli obiettivi. Ogni componente "da costruire" deve avere un test di fattibilità in §5.

La sezione 8 esiste perché il dossier è la sorgente del manifest di provisioning: da lì Claude Code
con il plugin `blueprints` scrive il `.yml` che la CLI `xrcopilotlab-bp` applica al tenant. Se
quella sezione è vaga, chi configura reinventa corsie, moduli e condizioni — ed è esattamente ciò
che il blueprint doveva evitare.
