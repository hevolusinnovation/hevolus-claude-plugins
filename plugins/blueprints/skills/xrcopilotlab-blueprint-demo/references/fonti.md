# Le fonti: manifest e dossier di assessment

Si parte da una delle due, meglio da entrambe. Il manifest dice **che cosa esiste e come funziona**;
il dossier dice **con quali parole il cliente ha descritto il problema**. Al brief servono tutte e
due le cose: la seconda è ciò che l'agenzia userà per parlare, la prima è ciò che le impedisce di
promettere il falso.

## Dove si trovano

| Fonte | Dove | Nota |
|---|---|---|
| Manifest di un cliente | nell'archivio del tag sul tenant di collaudo di staging: `xrcopilotlab-bp pull --tag <TAG> --env staging` | il commento in testa spiega il perché delle scelte e i limiti. Il repository non li contiene più |
| Modello del catalogo | `xrcopilotlab-bp catalog list` | generico per costruzione: non nomina clienti |
| Dossier di assessment | `../hevolus-assessment/customers/<cliente>/README.md` o `assessment-*.md` | criticità del cliente, stato di maturità, punti aperti |
| Guida per il cliente | `../hevolus-assessment/customers/<cliente>/guida-<scenario>.md` | **la fonte migliore per il linguaggio**: è già scritta senza tecnicismi |
| File allegati dall'utente | la conversazione | su Claude Desktop sono l'unica fonte |

Non servono i giudizi di collaudo né le suite di test: il brief non parla di collaudo.

## Dal manifest

| Nel manifest | Che cosa se ne ricava |
|---|---|
| `description`, commento in testa | il problema e la promessa dello scenario |
| `agents[]` con il loro «cosa non fai» | i compiti dell'assistente e **ciò che rifiuta**: materiale per «Dove decide la persona» e «Da non dire» |
| `processes[]` (passi, ruoli, tempi, «se… allora») | il flusso in passi, chi decide, dove c'è un'approvazione |
| `orchestrators[]` (passi, gruppi in parallelo) | «più ricerche nello stesso momento, poi una sintesi» |
| `agentTasks[]` con la schedulazione | i controlli che girano da soli: ogni sera, ogni venerdì, ogni minuto |
| `connections[]`, `mcpServers[]` | **quali** servizi esterni sono collegati davvero (posta Microsoft 365, un registro pubblico) |
| `knowledge[]` | che cosa consulta: estrazioni, dossier, bilanci, modelli |
| commenti «fuori perimetro», «che cosa NON c'è ancora» | i limiti: vanno in «Da non dire» |

## Dal dossier di assessment

| Nel dossier | Che cosa se ne ricava |
|---|---|
| le criticità citate dal cliente | il **problema di oggi**, con parole di chi lavora; parafrasate, mai citate come sue |
| gli scenari (A, B, C…) e il loro stato 🟢🟡🔴 | quali scenari esistono e quali no: un 🔴 non entra nel brief |
| gli interventi da fare prima dell'apertura | i limiti presenti: vanno in «Da non dire» finché non sono chiusi |
| la parte sul posizionamento commerciale, se c'è | ciò che la scheda di vendita attuale promette **di troppo**: da correggere, non da copiare |
| i punti aperti | ciò che non si può ancora affermare |

Un dossier senza manifest descrive un progetto, non un ambiente: i suoi scenari valgono al più
**«si configura»**, e solo se ogni mattone è già usato da uno scenario realizzato
([`scenari.md`](scenari.md)). Un esito 🟢 del dossier non basta: dice che una fonte è raggiungibile,
non che un ambiente vero l'abbia già usata. Spesso uno scenario del dossier supera la prova solo in
parte: si propone quella parte, con il resto in «Da non dire» (vedi
[`brief.md`](brief.md), «Se la fonte è solo un assessment»).

## Il modello dello scenario

Prima di scrivere una sola scheda, fissare per te — non per l'agenzia — questo modello:

```
Scenario:        <nome nella lingua del cliente>
Settore / funzione:
Problema di oggi:   <due o tre frasi>
Flusso:          1. <persona|AI|regola|posta> · <che cosa succede>  …
Mattoni:         <codici da scenari.md: M-POSTA, M-PRATICA, …>
Limiti:          <ciò che non fa, per scelta o perché manca>
Fatti citabili:  <solo con la loro fonte: «circa tre minuti (guida, misura in demo)»>
Stato:           realizzato per un cliente | pronto da installare | si configura
```

È il modello a dire se uno scenario derivato regge: se un passo del derivato non trova un mattone
qui o nel registro, il derivato non entra.
