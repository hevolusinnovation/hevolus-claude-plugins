---
name: xrcopilotlab-blueprint-howto
description: Pubblica (o aggiorna allo stesso link) l'artifact «Dall'intervista alla demo», la guida d'uso delle skill XRCopilotLab nell'ordine in cui si usano - installazione su Claude Desktop e su Claude Code, xrcopilotlab-assessment (dall'intervista al cliente al dossier), xrcopilotlab-blueprint (dal dossier alla prima versione del manifest, applicata), il giro di xrcopilotlab-blueprint-test fino alla versione stabile, poi xrcopilotlab-blueprint-guide, xrcopilotlab-blueprint-demo e xrcopilotlab-blueprint-storyboard prima della demo al cliente. Per ogni tappa - dove si lavora, cosa portare, frasi da scrivere, cosa succede, cosa si ottiene, domande tipiche, errori frequenti. Usa quando l'utente chiede "come si usano le skill dei blueprint", "la guida al percorso blueprint", "da dove comincio", "l'howto dei blueprint", "spiegami il flusso assessment → demo", "manda a un collega come si usano i plugin", o invoca la skill. NON esegue nessuna delle skill che descrive, non tocca il tenant e non scrive manifest.
---

# xrcopilotlab-blueprint-howto

Pubblica una pagina sola che accompagna un collega — un AI Specialist, un Sales, chi entra nel
team — lungo **tutto** il percorso, nell'ordine in cui lo farà:

```
installazione  →  assessment  →  blueprint v1  →  collaudo ↺ (fino ai verdi)  →  guide  →  brief  →  video  →  demo
(Desktop+Code)    (Desktop)      (Code)            (Code)                          (Code/Desktop)    (Code)
```

Le skill dei singoli passi hanno ciascuna il proprio orientamento («cosa sai fare?»), ma nessuna
racconta la catena: quale skill viene dopo, che cosa passa da una all'altra, e perché il collaudo è
un giro e non un passo. Questa pagina è quel racconto.

**È una skill di sola pubblicazione.** Non lancia `xrcopilotlab-bp`, non legge il tenant, non scrive
manifest né suite. Se l'utente, leggendo, chiede di fare una delle cose descritte, si passa alla
skill di quella tappa.

## La pagina

La pagina completa è [`references/percorso.html`](references/percorso.html): contenuto, impaginazione
e tema chiaro/scuro sono già lì. **Non si riscrive da zero a ogni invocazione** — la forma è stata
decisa una volta, e chi ha già il link deve ritrovare la stessa pagina. Si aggiorna ciò che è
invecchiato (sotto) e si ripubblica.

| | |
|---|---|
| Titolo | «Dall'intervista alla demo» — fisso, è il nome con cui la si ritrova in `/artifacts` |
| Icona | `route` al primo publish, poi mai più |
| Descrizione | «Come si usano, in ordine, le skill XRCopilotLab: dall'intervista al cliente alla demo, passando per il manifest e il collaudo.» |
| Destinatari | interni Hevolus (AI Team, Sales). **Non** è per il cliente |

## 1. Controllare che non sia invecchiata

La pagina **non contiene numeri di versione** di proposito, come `sito/index.html` del catalogo: dice
«l'ultima release», e fa scaricare dalla pagina delle release. Quello che può invecchiare sono i
**fatti**. Prima di pubblicare, confrontarli con le sorgenti che questa sessione ha davvero:

| Fatto nella pagina | Dove si verifica |
|---|---|
| Le frasi che attivano ogni skill, cosa produce, cosa non fa | la `description` e il § 0 del `SKILL.md` di ciascuna skill (`xrcopilotlab-assessment`, `xrcopilotlab-blueprint`, `-test`, `-guide`, `-demo`, `-storyboard`), che sono fra le skill della sessione |
| I nomi dei pacchetti e dove si caricano | il README del catalogo `hevolus-claude-plugins`, § «I pacchetti pronti» — se il clone c'è; altrimenti `references/installazione.md` della skill `xrcopilotlab-blueprint` |
| Le due righe di installazione e i comandi di aggiornamento | idem |
| I ruoli Azure e le risorse per ambiente | `docs/accesso-azure.md` del catalogo, se c'è |
| I comandi della CLI e i codici di uscita | `xrcopilotlab-bp --help`, **se** la CLI è disponibile; altrimenti le tabelle di `cli-reference.md` della skill `xrcopilotlab-blueprint` |
| I nomi degli artifact prodotti dalle altre skill («— guida», «— demo (interna)», «— domande di prova», «DEMO-») | le sezioni di pubblicazione di `-guide`, `-test`, `-demo`, `-storyboard` |

Se una di queste fonti dice una cosa diversa dalla pagina, **vince la fonte**: si corregge la pagina
nel punto preciso, senza toccare il resto. Una skill nuova nella catena si aggiunge come tappa, al suo
posto nell'ordine. Se una fonte non è disponibile, lo si dice all'utente in una riga («non ho potuto
verificare i codici di uscita: la CLI non c'è in questa sessione») invece di dare la pagina per
verificata.

Si corregge anche la sorgente — `references/percorso.html` nel repository di prodotto, se la sessione
è lì — e lo si dice: altrimenti alla prossima sincronizzazione del plugin la correzione sparisce.

## 2. Adattarla, solo se chiesto

Di norma la pagina è una e uguale per tutti. Due varianti ammesse, e solo su richiesta esplicita:

- **un esempio di un cliente preciso** al posto di quelli generici («la faccio vedere a chi lavora su
  COMO»): si cambiano gli esempi di frasi, mai la struttura. È un artifact **separato**, con titolo
  «Dall'intervista alla demo · <cliente>», perché il link generico non deve cambiare contenuto;
- **una tappa sola**, per esempio solo il giro del collaudo: si pubblica la pagina intera e si indica
  l'ancora (`#collaudo`), invece di tagliare.

Niente dati del tenant (GUID, runId, chiavi di webhook) in nessuna variante: la pagina si gira ai
colleghi.

## 3. Pubblicare, allo stesso link

1. **Organizzazione**: `/status` deve mostrare l'organizzazione Hevolus. Un artifact appartiene
   all'account e all'organizzazione della sessione; da un'altra si vede «Page not found», e non si
   sposta — si ripubblica.
2. **Cercare se esiste già**: `Artifact` `action: "list"` e cercare il titolo «Dall'intervista alla
   demo». Se c'è, `action: "read"` su quel `url`, e si pubblica **passando quel `url`**: chi ha il link
   lo ritrova aggiornato. Un publish senza `url` crea un secondo artifact e lascia vecchio il primo.
3. **Copiare** `references/percorso.html` nello scratchpad della sessione, applicare lì le correzioni
   del § 1, e pubblicare quel file (alla prima pubblicazione con `icon: "route"` e la descrizione
   della tabella sopra).
4. **Aprirla subito** nel browser dell'utente: Claude in Chrome (`tabs_context_mcp`, poi `navigate`)
   se è connesso, altrimenti `open <url>` su macOS (`start` su Windows). Se compare «Page not found»,
   il problema dell'organizzazione emerge adesso e non quando la apre un collega.
5. **Nel messaggio finale**: il link, che cosa è stato verificato o corretto nel § 1 (una riga per
   correzione, oppure «nessuna differenza con le skill installate»), e come si ritrova (`ctrl+]`,
   `/artifacts`). È privata alla nascita: condividerla è una scelta dell'utente, dalla pagina.

## 4. Se `$ARGS` è vuoto, o chiede aiuto

Non c'è niente da decidere prima: si pubblica (o si aggiorna) la pagina e si dà il link. Se l'utente
chiede invece una cosa puntuale — «qual è la skill che viene dopo il collaudo?», «come si installa su
Desktop?» — si risponde a quella in poche righe, pescando dalla pagina, e si offre il link in una
riga.

## Cosa non fare

- Non eseguire le skill che la pagina descrive, né la CLI per «mostrare come funziona».
- Non riscrivere la pagina da capo, né cambiarne titolo o icona: il link e l'aspetto sono ciò che i
  colleghi riconoscono.
- Non mettere numeri di versione nel testo: invecchiano il giorno dopo.
- Non ripubblicare a un `url` nuovo una pagina che esiste già.
- Non promettere nella pagina ciò che una skill non fa: se la `description` di una skill è cambiata,
  si allinea la pagina, non il contrario.
- Non metterci dati del tenant, chiavi, nomi di persone del cliente.
