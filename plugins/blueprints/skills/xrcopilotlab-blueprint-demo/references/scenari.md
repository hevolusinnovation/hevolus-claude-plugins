# Gli scenari: come si derivano, e come si prova il loro stato

## Lo stato

L'agenzia scriverà come vero ciò che legge. Per questo lo stato di uno scenario non si stima: si
prova con le fonti.

| Stato | Che cosa vuol dire | Come si prova | Che cosa può dire l'agenzia |
|---|---|---|---|
| **Realizzato per un cliente** | costruito e provato sui dati veri di un cliente | un manifest applicato per un cliente, con la sua guida o il suo dossier | «già realizzato per uno studio legale», «già al lavoro presso un'associazione di imprese» — mai «in uso da anni», mai il nome |
| **Pronto da installare** | un modello generico, nel catalogo | una voce di `catalog list` | «pronto: si installa nel vostro ambiente» |
| **Si configura** | non esiste ancora, ma ogni suo passo usa un mattone già usato da uno scenario realizzato | la tabella dei mattoni qui sotto: **ogni** passo ha un codice | «si può costruire per voi», «si configura sul vostro processo» |
| *Richiede sviluppo* | serve qualcosa che la piattaforma oggi non fa | almeno un passo senza mattone, o un mattone con un limite che lo esclude | **non entra nel brief**: lo si dice all'utente |

Nel dubbio fra due stati si sceglie il più basso. Un «pronto» con limiti importanti (per esempio
«solo testo incollato») resta pronto, e il limite va in «Da non dire».

## I mattoni

Sono le capacità che almeno uno scenario realizzato usa **davvero**, dette come le direbbe un sales.
Un mattone non è una funzione della piattaforma in generale: è una cosa che abbiamo visto funzionare
in un ambiente vero. Il registro per scenario è in [`scenari-esistenti.md`](scenari-esistenti.md).

| Codice | Il mattone, in parole semplici | Dove è già usato | Limiti noti |
|---|---|---|---|
| `M-POSTA` | legge una casella di posta Microsoft 365, capisce di che cosa parla una mail, risponde con una conferma di ricezione | agenda studio legale | solo le caselle autorizzate dall'amministratore; **il contenuto dei PDF allegati non si legge**; non Gmail |
| `M-CALENDARIO` | legge e scrive un calendario comune Microsoft 365, senza doppioni | agenda studio legale | non il calendario Google |
| `M-CHAT` | si chiede in chat, scrivendo o dettando col microfono del telefono; l'assistente rilegge e chiede il sì prima di agire | agenda studio legale, conoscenza associati | il vocale inoltrato per mail no |
| `M-PRATICA` | un percorso con compiti che arrivano alle persone giuste, con un tempo entro cui farli, strade diverse a seconda del caso e un avviso se un compito si ferma | agenda studio legale | — |
| `M-CONTROLLO` | un controllo che gira da solo a orari fissi e manda un riepilogo: ogni sera, ogni lunedì mattina, ogni venerdì | agenda studio legale | — |
| `M-ARCHIVIO` | consulta i documenti e le estrazioni caricati nell'ambiente e cita da dove viene ogni informazione | conoscenza associati, bilancio aggregato, assistente legale | i documenti si caricano, non si sincronizzano da soli con un gestionale |
| `M-RICERCHE` | più ricerche partono nello stesso momento su fonti diverse, poi un assistente scrive una sintesi sola | conoscenza associati, assistente legale | un soggetto alla volta: niente ricerche su «tutte le aziende del settore» |
| `M-FONTI-PUBBLICHE` | interroga servizi pubblici: il web, il registro europeo delle partite IVA, le pagine social, le banche dati giuridiche pubbliche (legge nazionale, Cassazione, diritto europeo) | conoscenza associati, assistente legale | dei social si legge il collegamento, non i contenuti; la Cassazione spesso restituisce solo il rimando al portale; **TAR, Consiglio di Stato e Corte Costituzionale non sono ancora collegati** al modello legale |
| `M-MAPPA` | mette una sede sulla mappa | conoscenza associati | solo se c'è l'indirizzo, non il solo comune |
| `M-CONTI` | lavora su file contabili esportati (libri giornale, piani dei conti) e li riporta su uno schema comune | bilancio aggregato | sui file caricati, non collegato al gestionale; aggregato, non consolidato |
| `M-TESTI-LEGALI` | ricerca giuridica con fonti, analisi di un contratto, strategia, stress-test, bozza di un atto, traduzione IT↔EN | assistente legale | **solo testo incollato**, non documenti caricati; **solo casi anonimizzati**; la bozza è testo, non un file Word |

Che cosa **nessun** mattone copre oggi, e quindi rende uno scenario «richiede sviluppo»:

- scrivere dentro il gestionale, il CRM o l'ERP del cliente;
- leggere il contenuto dei PDF allegati alle mail;
- ricerche su molti soggetti insieme («tutti gli associati del tessile sopra i 50 dipendenti»);
- dare punteggi, rating o giudizi di affidabilità su un'azienda o una persona;
- calcolare termini processuali o scadenze che non sono scritte nel testo;
- Gmail, calendario Google, WhatsApp, telefonate;
- decidere al posto di una persona in un passo che ha conseguenze (pagare, assegnare, rispondere
  all'esterno).

Quando la piattaforma cambia, questa tabella si aggiorna **solo** dopo che un blueprint applicato
usa il mattone nuovo: una funzione annunciata non è un mattone.

## I tre assi di derivazione

Da uno scenario d'origine se ne ricavano altri tenendo fermo qualcosa e cambiando il resto.

| Asse | Si tiene fermo | Si cambia | Esempio dall'agenda di uno studio legale |
|---|---|---|---|
| **Stesso flusso, altro settore** | la forma del flusso | chi lo usa | «richiesta di intervento via mail → coordinatore assegna il tecnico → appuntamento in calendario → esito scritto una volta» per un'azienda di assistenza tecnica |
| **Altro processo, stesso settore** | chi compra | il problema | in uno studio legale: la presa in carico delle nuove richieste dei clienti |
| **Stessa capacità, altra funzione** | un mattone forte | l'ufficio che lo usa | la riunione dettata in chat che diventa compiti con scadenza, per la segreteria di direzione |

Regole:

- **Ogni passo del derivato ha un mattone.** Scrivi il flusso del derivato con i codici accanto,
  per te: se un passo resta senza codice, il derivato è «richiede sviluppo».
- **I limiti viaggiano con i mattoni.** Se un derivato usa `M-POSTA` in un settore dove i dati
  stanno quasi sempre nei PDF allegati, o lo si riformula o va in «Da non dire» in modo esplicito;
  se il limite svuota lo scenario, lo scenario non regge.
- **Un derivato deve essere un problema riconoscibile**, non una combinazione di mattoni. La prova:
  una persona di quel settore lo descriverebbe con quelle parole?
- **Da tre a sei derivati per brief.** Se ne escono di più, tieni quelli con il problema più forte
  e dillo all'utente.
- **Non ripetere lo scenario d'origine** cambiando solo il nome del settore, a meno che il settore
  nuovo non abbia davvero lo stesso problema: allora è un derivato legittimo, e lo si dice
  («stesso flusso, altra associazione»).
