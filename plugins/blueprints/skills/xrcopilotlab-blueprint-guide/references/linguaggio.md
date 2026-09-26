# Il linguaggio della guida: dal nostro vocabolario al suo

La guida si legge senza sapere niente della piattaforma. Il modo più veloce di sbagliare è usare
le parole con cui la costruiamo: sono esatte per noi e opache per chi la usa.

## Il vocabolario

| Diciamo noi | Si scrive nella guida | Nota |
|---|---|---|
| blueprint, manifest | **il progetto del vostro ambiente** | «manifest» solo nel glossario |
| tenant | **il vostro ambiente** | |
| topic | *(non compare)* | è un contenitore tecnico |
| agente | **assistente** (con il suo compito: «l'assistente che legge la base dati») | «agente» solo nel glossario |
| orchestratore | **la catena di assistenti**, o semplicemente «la chat» | |
| step, passo | **passo** | |
| parallel group | «**nello stesso momento**» | «sei ricerche partono insieme» |
| profilo di knowledge, knowledge graph | **l'archivio dei documenti** che l'assistente consulta | |
| server MCP, connessione | **un collegamento a un servizio esterno** (il registro europeo, il motore di ricerca) | |
| skill | **una capacità in più** (disegnare la mappa, scrivere un documento) | |
| system message, prompt | **le istruzioni dell'assistente** | |
| processo BPM, istanza | **la pratica** e il suo percorso | |
| work item, compito umano | **un compito che arriva a una persona** | |
| gateway, switch, condizione | «**se… allora…**» | il simbolo non compare |
| webhook | «**un indirizzo a cui un altro sistema può mandare una richiesta**» | quasi mai serve |
| gap | **dato mancante, dichiarato** | «la scheda dice che cosa manca» |
| hallucination | «**inventare un dato**» | |
| apply, plan | «**vi mostriamo l'elenco di ciò che cambierà, e procediamo dopo il vostro sì**» | |
| aggiornamento sul posto | «**si aggiorna solo ciò che cambia**» | |
| suite di collaudo, casi | **domande di esempio**, con una risposta possibile | solo nell'atto «Provatelo voi»; gli esiti non compaiono mai |
| collaudo, giudizio, «provato», «verde» | *(non compaiono)* | la guida spiega come funziona, non come l'abbiamo verificato |
| run, inventario, id | *(non compaiono)* | |
| codici BP0xx, nomi di componenti, issue | *(non compaiono)* | al più «è segnalato ed è in correzione» |

## Prima e dopo

> ❌ L'orchestratore esegue in parallelo sei agenti che ricevono in input il soggetto estratto dal
> profilo; il merger aggrega gli output e l'AgenteResume produce il report.

> ✅ Appena l'assistente ha trovato l'azienda nella vostra base dati, sei ricerche partono nello
> stesso momento — il web, il registro europeo, LinkedIn, Facebook, i dossier, i bilanci. Quando
> tornano, un ultimo assistente scrive la scheda.

> ❌ Il ramo bilanci fallisce per la issue #1042: il KG non restituisce file quando il soggetto è un record.

> ✅ Oggi la scheda non riporta ancora i bilanci depositati, anche se sono nell'archivio: è un limite
> che conosciamo ed è in correzione. Finché non lo è, quella sezione dice «non risultano bilanci».

> ❌ Lo switch `verifica-sede` salta il passo mappa se l'AgenteSede risponde NESSUNA_SEDE.

> ✅ Se in base dati c'è l'indirizzo, sotto compare la mappa; se c'è solo il comune, la mappa non si
> fa — un punto sul paese non direbbe dove sta l'azienda.

> ❌ Abbiamo fatto 47 domande di prova: 40 giuste, 7 da correggere, tutte nello stesso punto.

> ✅ *(Niente: i risultati delle prove non stanno nella guida. Se una sezione non funziona ancora,
> la chiusura dice che cosa non fa, senza numeri.)*

> ❌ **Domanda:** «Chi è Alfa S.r.l.?» — **Risposta attesa:** scheda con sede, VIES valido, 3 notizie. ✅ superata

> ✅ **Chiedete:** *«Mi dici qualcosa di Alfa S.r.l.?»*
> **Una risposta possibile:** «Alfa S.r.l., Cantù, associata dal 2019. Partita IVA valida sul
> registro europeo. Sul web: due notizie nell'ultimo anno, una sull'apertura del nuovo stabilimento.
> Il sito non è indicato nel gestionale.» — *Notate l'ultima riga: il dato che manca è scritto.*

## Il tono

- **«Voi» e «noi»**: la guida parla al cliente, e noi siamo chi ha costruito l'ambiente e lo mantiene.
- **Frasi di una riga o due.** Un paragrafo che richiede di rileggere va spezzato.
- **Un esempio concreto dopo ogni affermazione astratta.** «Non inventa»: e subito, «se il sito
  non è nel gestionale, la scheda scrive che manca, invece di indovinarlo dal nome».
- **I numeri veri**, arrotondati come li direbbe una persona: «in circa due minuti», «40 domande su 47».
- **Nessuna enfasi commerciale**: niente «rivoluzionario», «potente», «intelligente». La guida
  convince perché è precisa, non perché è entusiasta.
