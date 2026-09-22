# Consegna a chi può verificare

Il triage chiede di **confermare leggendo il codice** prima di attribuire un fallimento, e la
segnalazione chiede di aprire una issue nel repository della webapp. Chi collauda non sempre può
fare né l'una né l'altra cosa: un commerciale che prova uno scenario con un cliente ha la CLI —
scaricata dal plugin — e nient'altro. Nessun clone, nessun accesso al repository.

Senza una strada per lui, il collaudo si ferma al primo fallimento da confermare, e i casi
rimanenti — che magari passano tutti — non vengono nemmeno eseguiti. Il cliente resta senza
verdetto per un difetto che forse non c'entra con ciò che gli interessa.

La strada è questa: **si consegna a chi può, e si va avanti.**

## Quando si applica

Tre condizioni, da verificare invece che da supporre. Basta che una regga:

```bash
ls ../xrcopilotlab-knowledge-graph ../xrcopilotlab-agent-framework   # i cloni fratelli
ls src/XRCopilotLab                                                  # la webapp è questa cartella?
gh auth status && gh repo view hevolusinnovation/xrcopilotlab-webapp-dotnet --json name
```

Se i cloni non ci sono, o non siamo dentro la webapp, o `gh` non raggiunge il repository, la
verifica e la segnalazione sono **fuori portata**: non è una difficoltà da superare con più
tentativi, è una cosa che questa postazione non può fare.

Dirlo all'utente in una riga, **senza farne un problema suo**: il collaudo prosegue, i fallimenti
che vanno confermati li guarda uno sviluppatore.

## Cosa fa la skill, in ordine

1. **Non si ferma.** Esegue tutti i casi della suite, produce `report.md`, `report.json` e il
   `giudizio.md` come sempre. La consegna avviene **dopo**, su ciò che resta da confermare.
2. **Raggruppa.** Fallimenti diversi con la stessa causa sono **una** consegna con più casi a
   supporto, esattamente come sarebbero una segnalazione sola.
3. **Scrive il messaggio** in `blueprints/tests/reports/<tag>/<data>/consegne/<n>-<slug>.md`,
   con il modello qui sotto.
4. **Lo mostra all'utente e chiede se mandarlo.** Vale la stessa regola delle bozze di issue: un
   sì per i messaggi mostrati, non per quelli che scriverai dopo.
5. **Manda**, con lo strumento di posta della sessione, a **`giuseppe.zileni@hevolus.it`**.
   Se in quella sessione non c'è uno strumento di posta, **non fingere**: dire che il messaggio è
   pronto, dove sta, a chi va mandato e quali file allegare. Un messaggio non mandato dichiarato
   tale è utile; uno dato per mandato è un danno.
6. **Marca i casi** come `🔁 in attesa di verifica` nel `giudizio.md` e nella tabella di stato
   delle guide per il cliente. Mai `✅`, mai `⛔`: non sappiamo ancora.

## Cosa deve contenere il messaggio

Lo scopo è uno: che chi lo riceve possa **giudicare senza il tenant e senza rilanciare la suite**.
Se per rispondere deve chiedere qualcosa indietro, il messaggio è incompleto.

```markdown
Oggetto: [collaudo <TAG>] <n> casi da verificare — <componente sospettato>

## In breve
<Una frase: che cosa non funziona, come lo vede il cliente.>

## Dove e quando
- ambiente: <staging | prod> · tenant: <nome> (`<companyId>`)
- blueprint: <blueprintId> v<n> · run del collaudo: `<runId della suite>`
- data: <gg/mm/aaaa hh:mm>
- chi ha collaudato: <nome>

## I casi
| Caso | Domanda | Risposta ottenuta | Atteso | Sospetto della CLI |
|---|---|---|---|---|
| `<key>` | … | … | … | <componente> (<fiducia>) |

## Le evidenze
- passi del log che contano (nome del passo, esito, durata), non tutto il log;
- knowledge consultata: file e chunk, o «nessuno»;
- skill selezionate, o «nessuna», con l'intent riconosciuto;
- per un processo: id dell'istanza, nodo del token, ultimi eventi;
- errore grezzo, se c'è, **senza valori che sembrano credenziali**.

## Versioni
- `KnowledgeGraphVersion` e `AgentFrameworkVersion` — se non sono leggibili da qui, dirlo
  invece di indovinarle: le sa chi ha il clone.

## Che cosa non ho potuto fare
La conferma leggendo il codice, e l'apertura della issue: questa postazione non ha i cloni né
l'accesso al repository. Il sospetto qui sopra è quello della CLI, **non è un verdetto**.

## Allegati
<elenco — vedi sotto>
```

## Gli allegati

| File | Dove si prende | Perché serve |
|---|---|---|
| `report.md` | `blueprints/tests/reports/<tag>/<data>/` | Il collaudo com'è andato, leggibile |
| `report.json` | idem | Le risposte grezze e i passi del log: è qui che si guarda davvero |
| `giudizio.md` | idem | Il giudizio umano, anche parziale |
| la suite `.tests.yml` | `blueprints/tests/`, oppure dalla cartella di lavoro | Permette di rilanciare il caso |
| il manifest della versione provata | `xrcopilotlab-bp pull --tag <TAG> --env <ambiente>` | **Anche senza il repository**: il manifest si riscarica dall'archivio, ed è il file senza cui il sospetto «è il prompt» non si può nemmeno valutare |

I file di knowledge **non** si allegano: si elencano per nome e dimensione. Sono documenti del
cliente, spesso pesanti, e chi riceve il messaggio li ritrova sul tenant.

## Due cose da non fare

**Non attribuire per non poter verificare.** Non avere i cloni non trasforma un sospetto in una
diagnosi: il messaggio dice «sospetto della CLI, non confermato», e chi lo riceve conferma. La
regola del triage — un'assenza è un indizio, non una prova — vale identica.

**Non far uscire il contenuto del cliente dal messaggio.** Il report porta risposte e id del
tenant: è il motivo per cui la cartella dei report è ignorata da git. Il messaggio è interno e va
a un destinatario interno; nella issue che nascerà dopo non entra nulla di tutto questo — la
regola problem-only resta quella di sempre.
