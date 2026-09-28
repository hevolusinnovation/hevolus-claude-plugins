# Il brief: struttura e lunghezze

Il brief è **sintetico**. L'agenzia deve poterlo leggere tutto in dieci minuti e tornarci per
cercare una scheda. Non è una guida né una presentazione: è un canovaccio da cui altri scriveranno.

## Le sezioni, in quest'ordine

| # | Sezione | Contenuto | Misura |
|---|---|---|---|
| 1 | **Testata** | titolo (la famiglia di scenari, nella lingua del mercato), una frase su da dove nasce («da uno scenario realizzato per uno studio legale»), data | 3 righe |
| 2 | **Come usare questo brief** | per chi è, che cosa ne deve uscire (post, visual, landing, brochure), che le schede sono indipendenti, che «Da non dire» è vincolante | 3–4 righe |
| 3 | **La promessa comune** | la frase che vale per tutti gli scenari del brief, più tre principi | 1 frase + 3 punti |
| 4 | **Gli scenari in un colpo d'occhio** | una tabella: scenario · per chi · stato. Filtri per stato | una riga per scenario |
| 5 | **Le schede** | una per scenario: prima l'origine, poi i derivati, poi i già realizzati | vedi sotto |
| 6 | **Le parole** | la tabella «si dice / non si dice» di [`linguaggio-sales.md`](linguaggio-sales.md), ridotta alle righe pertinenti | 6–10 righe |
| 7 | **Da non promettere mai** | le promesse vietate di [`riservatezza.md`](riservatezza.md) | 5–7 punti |

## La scheda

Ogni campo ha un limite: se non ci sta, il campo dice troppo.

| Campo | Che cosa porta | Misura |
|---|---|---|
| **Titolo** | il messaggio, in una frase con un verbo: «La PEC arriva, la pratica è già pronta» | ≤ 12 parole |
| **Stato** | una delle tre etichette di [`scenari.md`](scenari.md) | etichetta |
| **Asse** | origine · stesso flusso, altro settore · altro processo · altra funzione · già realizzato | etichetta |
| **Per chi** | settore e dimensione tipica; **chi decide** l'acquisto; **chi lo usa** ogni giorno | 3 righe brevi |
| **Il problema di oggi** | la fatica quotidiana, come la direbbe chi la vive | ≤ 40 parole |
| **Com'è dopo** | la stessa scena, dopo | ≤ 40 parole |
| **Come funziona** | 3 o 4 passi, ognuno con chi lo fa (persona, assistente, controllo automatico) | ≤ 15 parole a passo |
| **Dove decide la persona** | il punto o i punti in cui una persona approva, sceglie, corregge | 1–2 righe |
| **Il messaggio** | la frase che l'agenzia deve far arrivare, in qualunque formato | 1 frase |
| **Fatti citabili** | fatti di funzionamento con la loro fonte; vuoto se non ce ne sono | 0–3 punti |
| **Da non dire** | i limiti veri, scritti come frasi che l'agenzia potrebbe scrivere per sbaglio | 2–4 punti |

Le schede dei **già realizzati** che non appartengono alla famiglia del brief si possono dare in
forma breve: titolo, stato, per chi, il problema, il messaggio, da non dire.

## Scrivere una scheda: un esempio

> **La PEC arriva, la pratica è già pronta** · *Realizzato per un cliente* · *Origine*
>
> **Per chi** — studi legali associati, da 20 professionisti in su · decide il socio che coordina
> l'organizzazione · lo usano la segreteria dell'agenda e gli avvocati.
>
> **Il problema di oggi** — Le comunicazioni delle cancellerie arrivano in una casella e una persona
> le ricopia a mano in agenda. Se quella persona manca, o una mail sfugge, un'udienza resta scoperta.
>
> **Com'è dopo** — Ogni comunicazione diventa una pratica con i dati già letti. La referente li
> controlla sul testo originale, sceglie chi ci va, e l'udienza compare nel calendario di tutti.
>
> **Come funziona** — 1. arriva la mail o la PEC (casella) · 2. l'assistente prepara la pratica ·
> 3. la referente verifica e assegna · 4. l'udienza entra nel calendario comune, il professionista
> conferma.
>
> **Dove decide la persona** — Niente entra in calendario prima che la referente l'abbia visto.
>
> **Il messaggio** — Nessuno ricopia più un'udienza, e nessuna udienza resta senza qualcuno che ci va.
>
> **Fatti citabili** — la casella si legge ogni minuto (dal progetto dell'ambiente) · ogni sera alle
> 18:30 un riepilogo delle udienze del giorno senza esito.
>
> **Da non dire** — «legge anche gli allegati PDF» · «calcola i termini» · «funziona con Gmail».

## Il titolo della pagina

`DEMO-` seguito dal nome della famiglia di scenari, non «Brief marketing»: «DEMO-Agenda e
scadenze», «DEMO-Conoscere un'azienda in una domanda», «DEMO-Assistente legale». Il prefisso,
senza spazio, vale per il `<title>` e per l'`<h1>`: nella galleria degli artifact distingue a colpo
d'occhio il materiale per l'agenzia dalle guide dei clienti. La spiegazione va nella `description`
della pubblicazione. Il nome del file resta `brief-<famiglia>.html`, senza prefisso: cambiarlo
creerebbe un artifact nuovo.

## Se la fonte è solo un assessment

Un dossier di assessment senza manifest descrive un progetto, non un ambiente: **non c'è uno scenario
d'origine**, perché niente è stato realizzato. Il brief salta il gruppo «Lo scenario d'origine» e
comincia da «Gli scenari che si possono proporre oggi»: gli scenari del dossier che superano la prova
dei mattoni, anche ridotti alla parte che la supera (per esempio «la scheda prodotto dal listino,
da verificare», senza la scrittura nel gestionale che il dossier prevede). Il resto va all'utente
nel messaggio finale, scenario per scenario, con il mattone che manca.
