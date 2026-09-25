# Aggiornare il CMS Atlas tramite il server MCP «atlas»

CMS: <https://delivery.hevolus.it> (Orchestratore Atlas). Server MCP: `/api/mcp` dell'applicazione,
trasporto HTTP con token Bearer nell'intestazione. Gli strumenti compaiono come `mcp__atlas__*`
(in Cowork possono avere un prefisso diverso: cerca gli strumenti che finiscono con
`lista_clienti`, `crea_delivery`, ecc.). Il token non va mai scritto in file, prompt o risposte.

Se gli strumenti non ci sono: fermati prima delle scritture, consegna documenti e
`anteprima.md`, e di' all'utente di collegare il server: una volta per postazione, con lo script
`setup-atlas-mcp.sh` (macOS/Linux) o `setup-atlas-mcp.ps1` (Windows) nella cartella `mcp/atlas/`
del repository `hevolus-claude-plugins`, che configura sia Claude Code sia Claude Desktop e chiede
il token senza mostrarlo; poi `/mcp` in Claude Code, o riavvio completo di Claude Desktop. A mano,
in Claude Code: `claude mcp add --transport http --scope user atlas <url>/api/mcp --header
"Authorization: Bearer …"`; in Cowork, connettore personalizzato.

## Strumenti (guida v. settembre 2026)

- `lista_clienti` (`anche_archiviati`) · `crea_cliente` (`nome`, `settore`, `note`)
- `lista_delivery` (`stato`) — fase corrente, avanzamento, salute con motivo
- `crea_delivery` — `cliente`, `nome`, `tipo` (programma|sow), `fase1` (discovery|workshop|diretto), `avvio`, `sigla`
- `crea_delivery_personalizzata` — `fasi` → `step` (`nome`, `descrizione`, `giorni`) → `deliverable`
- `scheda_delivery` — fasi, step con spunte e date, deliverable, azioni aperte, rischi, stakeholder
- `aggiorna_stakeholder` — per `nome` o `ruolo`; `email`, `telefono`, `sponsor`, `champion`, `riceve_minute`, `adkar`
- `imposta_date` — `step` + `inizio`/`fine`/`giorni` (+ `ripianifica`), `deliverable` + `scadenza`, `avvio`
- `crea_riunione` — non usarlo in questa skill se l'utente non lo chiede
- `segna_step`, `segna_deliverable`, `segna_azione` — **mai** in questa skill senza richiesta esplicita
- `aggiungi_azione` (`testo`/titolo, `owner`, `entro`, `del_cliente`) · `aggiungi_rischio` (`titolo`, `tipo`, `severita`, `owner`, `scadenza`) · `aggiungi_documento` (`titolo`, `url`, `fase`)

I nomi dei parametri sono quelli della skill `atlas`: se lo schema reale di uno strumento è
diverso, vale lo schema reale. Ogni strumento che scrive su una delivery vuole il riferimento alla
delivery (la **sigla**): dopo `crea_delivery` leggila dal risultato e sostituiscila ai segnaposto
`<SIGLA delivery n>` di `chiamate.json`.

### Strumenti attesi ma non ancora rilasciati

La skill li usa **solo se compaiono** nell'elenco degli strumenti; altrimenti applica il ripiego.

- `carica_documento` — carica un file (docx, pptx, xlsx, pdf, md; ≤ 25 MB, come la scheda
  Documenti) su una delivery. Parametri proposti: `delivery`, `titolo`, `file` (contenuto base64
  o percorso, secondo lo schema), `nome_file`, `fase` (facoltativa, «trasversale» se assente),
  `deliverable` (codice, facoltativo: collega il file al deliverable, es. `S.1`), `nota`.
  Ripiego: `aggiungi_documento` con l'URL di condivisione se l'utente lo fornisce; altrimenti
  un'azione Hevolus «Caricare <codice titolo> nella scheda Documenti» con owner Delivery Manager.
- `aggiungi_agente` — registra un agente nella scheda Agenti. Parametri proposti: `delivery`,
  `nome`, `processo`, `livello` (etichette del CMS: assistente | co-pilot | autonomo).
  Ripiego: elencare gli agenti nella risposta finale come da registrare a mano.

`plan_to_mcp.py --tools <elenco>` applica questi ripieghi automaticamente.

## Ordine delle chiamate

1. **Leggi**: `lista_clienti` (lo stesso cliente può avere maiuscole diverse o «S.p.A.» in più),
   `lista_delivery` (doppioni per lo stesso cliente e lo stesso processo: se esiste già, chiedi se
   aggiornarla invece di crearne un'altra).
2. `crea_cliente` solo se manca.
3. `crea_delivery` / `crea_delivery_personalizzata`.
4. `scheda_delivery` sulla sigla nuova: ricava codici di step/deliverable e ruoli vuoti.
5. `aggiorna_stakeholder` solo per le persone note (per `ruolo` quando il ruolo del template è
   ancora vuoto).
6. `imposta_date` solo se l'utente ha concordato date diverse da quelle calcolate dal template
   (avvio diverso, durata di uno step legata alla taglia). Con `ripianifica: true` se devono
   scorrere gli step successivi.
7. `aggiungi_rischio`, poi `aggiungi_azione` (dipendenze del cliente con `del_cliente: true`).
8. Documenti: `carica_documento` → `aggiungi_documento` → azione di promemoria (vedi sopra).
9. Agenti: `aggiungi_agente` se esiste.
10. `scheda_delivery` finale per verificare e riportare salute, fase corrente e link.

Se una chiamata fallisce, fermati, riporta l'errore e cosa resta da fare: non riprovare in loop e
non creare una seconda delivery per «riprovare».

## piano-delivery.json

Unica fonte di verità tra assessment, documenti e CMS. Scrivilo prima dei documenti.

```json
{
  "cliente": {"nome": "Confindustria Como", "settore": "Associazione di categoria", "note": "Assessment XRCopilotLab set 2026"},
  "delivery": [
    {
      "nome": "Profilo associato",
      "tipo": "sow",
      "fase1": null,
      "avvio": "2026-10-05",
      "sigla": "",
      "taglia": "M",
      "processo": "Arricchimento e profilo dell'associato",
      "agenti": [
        {"nome": "Agente profilo associato", "processo": "Profilo associato", "livello": "co-pilot", "mcp": "registro-imprese-mcp"}
      ],
      "stakeholder": [
        {"ruolo": "Sponsor esecutivo", "nome": "Mario Rossi", "email": "m.rossi@example.it", "sponsor": true, "riceve_minute": true}
      ],
      "rischi": [
        {"titolo": "Accesso API Registro Imprese non ancora contrattualizzato", "tipo": "rischio", "severita": "media", "owner": "Referente IT", "scadenza": "2026-10-09"}
      ],
      "azioni": [
        {"testo": "Fornire 20–50 casi reali con esito atteso per l'eval set", "owner": "Process owner", "entro": "2026-10-09", "del_cliente": true}
      ],
      "documenti": [
        {"codice": "S1", "titolo": "Offerta di implementazione processi", "file": "S1_Confindustria-Como_Offerta-SOW.docx", "url": null, "fase": "3", "deliverable": "S1"}
      ],
      "date": []
    }
  ]
}
```

Per `personalizzata` aggiungi `fasi`: `[{"nome": "...", "step": [{"nome": "...", "descrizione": "...", "giorni": 5, "deliverable": ["..."]}]}]`.
Campi vuoti: omettili o mettili a `null`, mai inventarli.

## Anteprima e conferma

```
python scripts/plan_to_mcp.py piano-delivery.json --out chiamate.json --md anteprima.md --tools <strumenti visti>
```

Mostra all'utente `anteprima.md` (tipo e fase 1 scelti con il motivo, chiamate in ordine, cose da
fare a mano, avvisi — in particolare i rischi «alta» che mandano la delivery in rosso) e chiedi
conferma. Scrivi sul CMS solo dopo un sì esplicito; se l'utente modifica qualcosa, aggiorna il piano
e rigenera l'anteprima.

## Limiti noti del server (verificati sugli screenshot del CMS, set 2026)

- Nessuno strumento per la scheda Agenti, per l'upload di file, per note della delivery, modifica
  del cliente, sospensione/chiusura, esportazione report.
- Il piano non si modifica dopo la creazione (aggiunta/rimozione/riordino step): se il template
  Atlas non va bene, valuta `crea_delivery_personalizzata` **prima** di creare.
- Nel rischio il campo «Note» della UI non risulta esposto: metti il contesto nel titolo in breve.
- Le operazioni via MCP compaiono nello Storico senza autore.
