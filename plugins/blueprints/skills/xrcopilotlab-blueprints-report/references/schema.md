# `manuale.json` — lo schema

La pagina (`assets/report-viewer.html`) impagina questo file; non aggiunge contenuto. Tutti i testi sono
in italiano semplice (vedi la SKILL §2). I campi con `?` sono facoltativi.

```json
{
  "titolo": "Catalogo dei blueprint",
  "ambiente": "Staging",
  "letto_il": "2026-10-10",
  "introduzione": ["Un paragrafo.", "Un altro."],
  "modelli": [
    {
      "id": "legal-suite",
      "nome": "Suite legale",
      "versione": 3,
      "tag": "LEGAL",
      "in_una_frase": "Un assistente legale su diritto italiano: ricerca con fonti, analisi di atti, redazione.",
      "per_chi": "Studi legali e uffici legali interni.",
      "numeri": ["9 assistenti", "2 percorsi di lavoro", "1 archivio di conoscenza"],
      "assistenti": [ { "nome": "Ricerca", "compito": "Cerca norme e sentenze e le cita con la fonte." } ],
      "processi": [
        {
          "titolo": "Titolo esatto del processo",
          "scopo": "Una frase: a che cosa serve, per chi.",
          "racconto": ["Come parte e che cosa fa il sistema.", "Dove decide una persona e come finisce."],
          "partecipano": "Referente agenda, Professionista"
        }
      ],
      "processi_nota": "?  Se i processi non sono descritti: perché (manifest non letto).",
      "risorse": [
        { "tipo": "video", "titolo": "Video Suite legale", "url": "https://claude.ai/artifact/…", "a_chi": "interno", "nota": "?  Una riga: che cosa si trova lì." }
      ],
      "serve": ["Le persone di ogni ruolo", "Le credenziali del servizio X, per nome"],
      "non_fa": ["Non inventa un dato che non trova: lo dice."]
    }
  ],
  "plugin": "?  Sostituisce il testo standard «Installare il plugin» (HTML escluso: solo testo, un array di paragrafi).",
  "importare": "?  Idem per «Portare un modello sul vostro tenant».",
  "glossario": [ { "termine": "Modello", "spiegazione": "Un blueprint pronto, installabile da qualunque tenant." } ]
}
```

Note:

- `risorse` (facoltativo): gli artifact creati dalle skill dei blueprint per quel modello. `tipo` è uno fra `video`,
  `guida`, `presentazione`, `processi`, `domande`, `brief`, `altro`. `a_chi` è `cliente` solo se l'artifact è scritto per
  il cliente **e** l'utente lo ha confermato; ogni altro caso è `interno` (è anche il valore se il campo manca). La
  pagina mostra l'indirizzo per intero accanto al titolo, perché il PDF non ha link cliccabili.
- `processi` può essere vuoto: allora `processi_nota` dice perché, e la pagina lo mostra al posto del racconto.
- `numeri` vengono dal catalogo/manifest, mai stimati.
- Niente HTML nei testi: la pagina fa l'escape. Un a-capo è un nuovo elemento dell'array.
- I comandi `/plugin …` e le fasi dell'importazione sono **già nella pagina** (standard, dalla SKILL §3 e §4):
  si sovrascrivono con `plugin` / `importare` solo se `docs/installare.md` è cambiato.
