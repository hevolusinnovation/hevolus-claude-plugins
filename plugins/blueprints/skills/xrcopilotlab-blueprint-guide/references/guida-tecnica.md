# La guida tecnica per l'AI Specialist

La guida per il cliente racconta; questa fa **eseguire**. La legge l'AI Specialist il giorno prima,
la tiene aperta durante la sessione accanto alle slide, e la usa quando qualcosa non va. È interna:
il cliente non la vede, e può contenere tutto ciò che serve a chi fa la demo — nomi veri dei
componenti, stato del collaudo, fragilità — **tranne i segreti**.

Il file è `../hevolus-assessment/customers/<cliente>/guida-tecnica-<scenario>.md`. Se c'era una
guida scritta per chi conduce la demo (un canovaccio, i materiali, i percorsi del processo), è la sua
fonte principale: si riprende ciò che regge e lo si mette in questa forma.

## Le sezioni, in quest'ordine

### 0. Scheda

Una tabella che si legge in trenta secondi, il giorno della demo.

```markdown
| | |
|---|---|
| Scenario | Agenda di Studio — blueprint `STUDIOPOLIS`, manifest v32 |
| Guida per il cliente | `guida-agenda.md` · pagina <link> · deck <link> |
| Ambiente della demo | staging, tenant «Hevolus Innovation», topic `BP-STUDIOPOLIS-Agenda di Studio` |
| Casella e calendario | `test@hevolus.it` (civile e penale sulla stessa casella di prova) |
| Chi conduce | Sales + AI Specialist · da soli: vedi §2 |
| Durata | 60 minuti, di cui 25 di demo |
| Sicuro dal vivo | D1, D3, D4 (giudizio del 24/09) |
| Fragile dal vivo | D2: la Sorveglianza a volte tarda un giro — tenere pronto il piano B |
```

### 1. Il flusso, in tecnico

Due parti. **La mappa**: i componenti come stanno nel manifest e sul tenant — agenti (con che cosa
fanno e i tool che hanno), agent task (con il cron), processi (con i passi e i ruoli), orchestratori
(con i loro step), server MCP (con i tool). **In tabelle, senza disegni**: un percorso di processo è un
elenco di passi con, per ciascuno, il tipo (compito umano, agent task, regola) e il ruolo.

**Il ponte**: la tabella che traduce ogni frase della guida per il cliente nel componente che la fa.
È ciò che permette all'AI Specialist di rispondere alla domanda «ma come fa?» restando nel racconto.

```markdown
| Nella guida per il cliente | Dietro | Dove si vede |
|---|---|---|
| «la casella si legge ogni minuto» | agent task `Sorveglianza posta civile`, cron `* * * * *`, agente con il server MCP `Microsoft365-Civile` | Agent task → esecuzioni |
| «la referente verifica» | passo `verifica` del processo `Presa in carico … civile`, ruolo `Referente agenda civile`, soglia 480 min | Processi → istanza → compiti |
| «l'impegno entra nel calendario» | passo `registra`: agent task `Registrazione udienza civile`, tool `cerca_eventi` → `crea_evento` | Outlook della casella |
```

### 2. La scaletta

Slide per slide, chi parla e quanto: è il copione dei due ruoli.

```markdown
| Slide | Chi | Minuti | Nota |
|---|---|---|---|
| `apertura-frase` | Sales | 2 | la promessa |
| `giornata-pec` | Sales | 2 | chiude con «ve la facciamo vedere» |
| `demo-D2` | AI Specialist (Sales commenta) | 6 | §D2 |
```

Poi **da soli**: che cosa si taglia (di solito l'atto «Che cosa cambia» si riassume in una frase, le
domande alla sala si riducono a una), e come si annuncia una demo senza il Sales («vi faccio vedere
adesso tre cose…», leggendo il corpo della slide di demo).

### 3. Preparazione

Una lista da spuntare, divisa in **il giorno prima** e **l'ora prima**. Ogni voce è un'azione con il
suo controllo: «bozza della mail M5 in Outlook — aprirla e verificare destinatario e oggetto».
Dentro: i dati da mettere in casella o in calendario, le istanze da avere già aperte a un passo
preciso, gli account con cui entrare, le schede del browser nell'ordine della demo, il piano B di ogni
demo a portata di mano, e **lo stato del tenant** da verificare (niente istanze rimaste da prove
precedenti che confonderebbero lo schermo).

### 4. Le demo

Una sezione per demo, con il codice della slide (`D2`), sempre nella stessa forma:

```markdown
## D2 · Una PEC diventa una pratica, e la pratica un impegno

**Slide**: `demo-D2`, dopo `giornata-pec`. **Durata**: 6 minuti. **Stato**: fragile dal vivo (24/09).

**Che cosa deve capire il cliente**: che nessuno ricopia, e che nessun dato arriva in calendario
senza una persona.

**Prima**: bozza M5 pronta; referente di prova loggata in una seconda scheda; calendario aperto sul
13/10.

**Passi**
1. Invia M5 dalla bozza. *Sales, intanto*: rilegge i tre punti della slide.
2. Attendi il giro della Sorveglianza (fino a 60 s). *Sales*: «la casella si legge ogni minuto».
3. Processi → istanze: apri quella nuova, compito «Verifica del referente».
   **Deve comparire**: Tipo proposto «Udienza»; data 13/10/2026 09:30; R.G. 5310/2025.
4. Scegli il professionista, completa. **Deve comparire**, in Outlook: «Tribunale di Bari … — R.G. 5310/2025».

**Sotto il cofano** (se chiedono): …

**Se va storto**
| Sintomo | Che cosa fare |
|---|---|
| dopo 2 minuti nessuna istanza | piano B: avvia a mano la presa in carico incollando il testo di M5 |
| l'impegno non compare | il passo `registra` ha soglia 30 min: mostra l'esito nel compito del professionista |

**Dopo**: cancella l'evento di prova; annulla l'istanza se non completata.
```

Le regole della sezione:

- **I passi sono azioni**, uno per riga, con il posto dove si fa (chat, Processi, Outlook) e ciò che si
  scrive o si clicca. Il testo da incollare sta in un blocco, pronto da copiare.
- **«Deve comparire»** dopo ogni passo che produce qualcosa: il valore esatto, non «il risultato
  corretto». È ciò che l'AI Specialist controlla prima di girare lo schermo verso la sala.
- **Il Sales ha il suo testo** mentre l'AI Specialist esegue: l'attesa è il momento in cui si spiega.
  Da soli, quel testo lo dice l'AI Specialist.
- **Sotto il cofano** spiega il meccanismo in tre-cinque frasi tecniche: quale agente, con quali tool,
  quale passo del processo, perché è fatto così. È la risposta a un tecnico del cliente, non un
  pezzo della demo.
- **Se va storto** è una tabella sintomo → azione, con in testa il **piano B**: la stessa cosa mostrata
  senza il passaggio fragile (un input incollato, un compito già completato, uno screenshot preparato).
- **Dopo** dice come rimettere l'ambiente com'era, perché la demo successiva parta pulita.

### 5. Domande tecniche

Le domande che un tecnico del cliente fa davvero, con la risposta vera e breve: permessi su Microsoft
365, dove stanno i dati, dove girano i modelli, che cosa succede se una persona è assente, come si
toglie tutto. Si prendono dal dossier di assessment (le domande già fatte) e dal manifest (i
commenti che spiegano le scelte).

### 6. Limiti e cose da non mostrare

Tre elenchi: **ciò che non c'è** (fuori perimetro, da costruire); **ciò che è fragile dal vivo**, con
la data del giudizio che lo dice; **come dirlo** — la frase per il cliente, la stessa della chiusura
della guida per il cliente.

### 7. Dopo la demo

La pulizia del tenant e della casella (istanze di prova da annullare, eventi da cancellare, agent task
da rimettere com'erano), e che cosa lasciare al cliente: il link alla guida, il deck se lo chiede, le
domande di prova se vuole provare da sé.

## Le regole di scrittura

- **Tecnico, ma per una persona sola che ha fretta**: frasi corte, azioni in cima, spiegazioni sotto.
- **Nomi veri** dei componenti, come compaiono sul tenant (`BP-<TAG>-…`).
- **Nessun segreto**: né chiavi, né token, né connection string, né URL con credenziali, né password
  degli account di prova. Gli account si nominano; le credenziali le ha chi conduce.
- **Stato con la data**: «fragile al 24/09» invecchia, e deve dire quando lo si è visto.
- **Coerenza con la guida per il cliente**: stessi codici di demo, stessi nomi di slide, stessi
  esempi. Una demo che mostra qualcosa di diverso da ciò che la slide promette è un errore della
  guida tecnica, non della slide.
