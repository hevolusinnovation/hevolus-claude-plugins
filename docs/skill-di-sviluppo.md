# Le skill che restano nel repository di prodotto

**Per chi sviluppa su XRCopilotLab.** Se non hai un clone di `xrcopilotlab-webapp-dotnet`, questa
pagina non ti riguarda: le skill che si installano dal catalogo sono in [§ Le skill](le-skill.md).

Le quattro skill del catalogo arrivano da lì perché servono a chi **non** ha i repository: si
installano e funzionano su una macchina vuota. Chi sviluppa su XRCopilotLab ne ha altre, che vivono
in `.claude/skills/` del clone di
[`xrcopilotlab-webapp-dotnet`](https://github.com/hevolusinnovation/xrcopilotlab-webapp-dotnet) e si
attivano da sole quando si lavora lì dentro. **Non si installano: si ottengono clonando il
repository.** Non sono nel catalogo perché senza il codice non avrebbero niente da leggere — un
piano di implementazione, un controllo architetturale o una PR si scrivono contro i file, non
contro una descrizione.

Quelle che riguardano il ciclo di una issue sono tre, e si dividono il lavoro così:

| Skill | Chi la usa | Cosa produce |
|---|---|---|
| `xrcopilotlab-issue-report` | chi **trova** un problema | la issue che descrive **il problema**, in inglese, senza dettagli tecnici, già registrata nel progetto «AI Team» con priorità, sprint e data |
| `xrcopilotlab-issue-plan` | chi **conosce già** l'area | **il come**: piano di implementazione ancorato al codice, più il branch di lavoro |
| [`xrcopilotlab-issue-guide`](#xrcopilotlab-issue-guide--imparare-il-codebase-mentre-si-risolve-una-issue) | chi **sta imparando** il codebase | la stessa cosa, più lentamente e spiegando: il fix, e una persona che la volta dopo ne sa di più |

La separazione fra le prime due non è burocrazia: una issue di questo repo descrive un problema e
**non** dice come risolverlo, perché il *come* si decide quando la si prende in mano, che può essere
mesi dopo. Chi scrive la issue non sa ancora dove sarà il codice.

### `xrcopilotlab-issue-guide` — imparare il codebase mentre si risolve una issue

È la **modalità studio**: un senior developer seduto di fianco a chi sta imparando. Non il
professore — il collega che ne sa di più, che spiega **perché** le cose stanno così, passa i trucchi
che ha imparato sbagliando, e a un certo punto passa la tastiera.

Il risultato di una sessione sono due cose, tutte e due obbligatorie: **la issue risolta bene** e
**una persona che la volta dopo ne sa di più** — dell'architettura, delle regole del repo, e del
mestiere.

**Quando usarla e quando no.** Se chi lavora conosce già l'area e vuole solo piano e branch, la
skill giusta è `xrcopilotlab-issue-plan`: questa fa la stessa cosa più lentamente, **apposta**. E se
non c'è tempo per la modalità studio si cambia skill invece di accorciare le spiegazioni: fare le
cose di fretta *e* mal spiegate è il peggio dei due mondi.

**Come si chiede**, dentro il clone del repository di prodotto — a voce, oppure invocandola per
nome con `/xrcopilotlab-issue-guide <numero>`:

| Cosa scrivi | Cosa fa la skill |
|---|---|
| «Aiutami con la issue #987» · «affiancami sulla issue» | Legge la issue, la ridice in tre righe, verifica che il suo oggetto esista, fa il giro dell'architettura per quell'area, propone il piano e **si ferma** |
| «Spiegami mentre la faccio» · «modalità studio» | Idem: la modalità studio è il modo di lavorare, non un passo in più |
| «Non conosco questa parte del codice» · «insegnami l'architettura mentre risolvo la issue» | Il giro di `architettura.md` limitato alle sezioni che la issue tocca, ognuna con il punto del codice dove vedere la cosa con i propri occhi |
| «Guidami sulla issue, ma il test lo scrivo io» | È già così: in ogni issue c'è un pezzo che la skill **offre** a chi impara invece di farlo |

**Le quattro regole del banco**, che sono anche il motivo per cui la sessione a volte si ferma:

1. **Prima si capisce, poi si scrive.** Nessuna riga di codice finché il problema non è stato detto
   in parole semplici e chi impara non ha detto «sì, è questo».
2. **Una parte la scrive lui.** Un pezzo piccolo e ben delimitato — un test, un metodo, una query —
   va offerto, non fatto. Se risponde «fallo tu» va bene, ma la proposta va fatta. E quando torna,
   quel codice si **legge prima di correggerlo**: si corregge ciò che è sbagliato, non ciò che è
   diverso da come l'avrebbe scritto la skill.
3. **Ci si ferma in tre punti, e non altrove.** Dopo il piano, prima di ogni cosa che non si annulla
   (push, PR, mock, commento su GitHub), e alla fine. In mezzo si va: troppe domande sono peggio di
   nessuna. L'unica eccezione dichiarata è la issue bloccata dalle dipendenze, dove la domanda è
   dovuta perché la decisione non è della skill.
4. **Il gergo si spiega la prima volta.** *Token*, *case data*, *work item*, *config bridge*,
   *tenant*: mezza riga alla prima comparsa, poi si va avanti. Comprese le due parole che in questo
   repo hanno due significati — *intent*, e *orchestratore* contro *processo*.

**Il percorso**, in sei passi:

1. **Capire** — legge la issue con `gh`, la ridice come la racconteresti a un collega al caffè, e
   **verifica che l'oggetto della issue esista**: le dipendenze dichiarate, le sub-issue, un `grep`
   dei componenti che la issue nomina, la issue sorella già chiusa. È il controllo che chi è nuovo
   non sa di dover fare e costa un minuto. Se quel codice non c'è, la issue descrive un futuro: lo
   dice in chiaro e pone l'unica domanda dovuta — **(A)** resta bloccata, **(B)** si reinterpreta
   contro ciò che esiste oggi. Il piano lo scrive comunque per la strada B, ma la scelta è di chi
   possiede la issue.
2. **Orientarsi** — il giro dell'architettura limitato alle sezioni che servono, più la mappa **per
   questa issue**: in quale progetto sta il lavoro e **perché lì**, quale file esistente fa già una
   cosa simile (e si legge insieme prima di scrivere), chi ha toccato l'area per ultimo, quali
   regole di `.claude/rules/` la toccano — nominate e aperte, con in due righe l'incidente che le ha
   generate. Un divieto con la sua storia si ricorda; un divieto e basta no.
3. **Il piano**, con la struttura di `xrcopilotlab-issue-plan` e il branch con la convenzione del
   repo. Per un bug il primo passo è **sempre** la riproduzione: test rosso, poi fix, poi test verde.
   Poi il primo stop — non «procedo?», che si risponde di riflesso, ma «dimmi con parole tue cosa
   faremo al passo 2»: se lo sa dire si va, se no il piano va rispiegato, non eseguito.
4. **Fare**, un passo per volta: due righe prima su *cosa* e *perché proprio così*, solo le parti
   del diff che contano, al massimo cinque momenti didattici per issue. Se compare qualcosa che
   andrebbe sistemato ma non è nella issue, **non lo si aggiusta di passaggio**: si nomina e finisce
   nei rischi della PR o in una issue nuova. Tenere il diff dentro la issue è una cosa che si
   insegna, come scrivere il fix.
5. **Verificare** — build e test, poi le skill di controllo sull'area toccata
   (`/xrcopilotlab-validate-architecture` sempre, e secondo il diff quelle su isolamento del
   tenant, allineamento degli SDK, config bridge). Prima di lanciarle dice in una riga **cosa
   controlla ciascuna e perché esiste**: un check lanciato senza sapere cosa cerca è un rito. Se un
   check trova qualcosa non lo aggiusta in silenzio — un errore trovato è il momento didattico
   migliore che ci sia, e sistemarlo di nascosto lo butta via.
6. **Chiudere** — la PR con il suo template e la sezione «Configurazione Azure / Deploy»
   obbligatoria, poi due documenti a struttura fissa: la **nota per chi rivede** in testa alla PR e
   la **scheda di fine sessione** come commento sulla issue. Push, apertura della PR e commento sono
   stop: si chiede e si aspetta il sì.

**I due documenti di chiusura** sono la parte che fa scalare un solo senior su più persone — chi
rivede non deve ricostruire cosa è successo, glielo si dice:

```markdown
## Nota per chi rivede

**Cosa ho fatto** — [3 righe, in parole semplici]
**Dove guardare prima** — [il file/metodo con la decisione più importante, e perché]
**Dove non sono sicuro** — [1–3 punti, onesti: «ho scelto X ma non so se Y era meglio perché…»]
**Cosa ho scritto io** — [il pezzo scritto da chi impara, così chi rivede lo guarda con l'occhio giusto]
**Regole che ho applicato** — [nomi, non copie: multi-tenancy in AgentRepository, models-location per il DTO…]
```

«Dove non sono sicuro» **non è opzionale**: una PR di chi impara che dichiara tre dubbi è una PR
onesta, una che non ne dichiara nessuno è una PR che non ha guardato abbastanza.

```markdown
## Scheda di fine sessione — modalità studio

**Issue** — #N, [titolo]
**Cosa ho imparato** — [le tre cose, con parole sue]
**Architettura vista** — [le sezioni toccate, es. § 7 BPM: engine puro e worker]
**Regole incontrate** — [nomi, con l'incidente in una riga ciascuna]
**Trucchi usati** — [es. git log -S per trovare il perché; issue sorella #963; test rosso prima del fix]
**Il pezzo scritto da me** — [file e cosa fa]
**Cosa chiederei a un collega** — [1 dubbio rimasto aperto, e a chi lo chiederebbe]
```

Le tre cose imparate **si chiedono, non si dicono**, e non si salta perché è tardi. La scheda serve
a due persone: a chi impara, che fra un mese la rilegge, e a chi guida il team, che vede cosa è
passato senza essere stato lì.

**Come spiega.** Ogni momento didattico ha una di tre forme, così si riconosce a colpo d'occhio cosa
sta insegnando:

> 💡 **Perché così** — la scelta, l'alternativa scartata, cosa si romperebbe con l'alternativa; se
> c'è un incidente vero dietro, la data e il danno. Rimanda alla regola in `.claude/rules/`.
>
> 🗺️ **Come è fatta** — quale pezzo fa cosa, dove sta il confine, e il punto del codice dove vederlo
> con i propri occhi.
>
> 🔧 **Trucco** — la mossa, il comando, e perché funziona qui.

Merita un momento didattico una regola che si applica **qui**, una scelta fra due strade entrambe
plausibili, un errore classico che il codice sta evitando, un confine architetturale che la issue
attraversa, una mossa che ha appena fatto risparmiare un'ora. Non lo merita la sintassi, un `using`,
il nome di una variabile, «così è più pulito». Il criterio è secco: se non sai dire **cosa si
romperebbe** facendo altrimenti — o, per un trucco, **quanto tempo** ha fatto risparmiare — non è un
momento didattico, è un'opinione, e le opinioni non si insegnano.

**Cosa non fa.** Non lavora in silenzio (tre file scritti senza spiegare niente sono mezzo
risultato); non salta gli stop, nemmeno se chi impara dice «vai vai», soprattutto se lo dice; non
tocca `main`, non fa push forzati, non riscrive la storia; non mocka senza chiedere e non crea
milestone; non allarga il diff oltre la issue, nemmeno per una cosa giusta; **non inventa storie** —
date e danni degli incidenti sono quelli scritti nei § *Razionale* delle regole, perché una storia
verosimile, il giorno che viene smentita, brucia la fiducia in tutte le altre; e non giudica la
persona, solo il codice.

**Cosa si porta dietro.** Cinque riferimenti, che sono anche il materiale di studio più utile del
repo per chi è appena arrivato:

| Riferimento | Cosa contiene |
|---|---|
| `architettura.md` | Il giro completo in quattordici sezioni, ognuna con il punto del codice dove vederla: i tre repository e le librerie che arrivano come NuGet, chi può parlare con chi, l'ordine di registrazione in `Program.cs`, il viaggio di un messaggio in chat, i due database e la regola del tenant, il lavoro lungo, il motore BPM puro e il suo worker, SignalR, i tre livelli della conoscenza, i blueprint, gli SDK, i test, la CI, e il metodo in cinque mosse per leggere un'area nuova |
| `trucchi.md` | Dodici mosse del mestiere: trovare il *perché* di una riga, capire chi conosce l'area e chiederglielo, la issue sorella, seguire un dato nei quattro salti con il grep giusto, riprodurre prima di aggiustare, la trappola dei due serializzatori, **cinque errori che mentono**, i numeri delle migrazioni presi su tutti i branch, guardare la base di una PR prima di mergiarla, e che un precedente nel repo non è una verifica |
| `glossario.md` | Le parole del repo in mezza riga — piattaforma, processi BPM — e le due che sembrano la stessa cosa e non lo sono |
| `perche.md` | Il catalogo dei *perché* pronti, uno per regola del repo, più tre che sembrano regole e non lo sono |
| `tono.md` | Come si parla a chi impara: informale e amichevole, con regole precise su cosa non dire mai |

Modificarli è come modificare le altre skill del prodotto: si cambia il file nel repository di
prodotto, e basta — questi non passano dal catalogo, quindi non c'è niente da sincronizzare qui.

### Le altre skill del repository di prodotto

Le skill del clone si invocano con `/<nome>` oppure si attivano da sole quando la richiesta
corrisponde. Oltre alle tre della issue, il repository ne porta una dozzina, per famiglia:

| Famiglia | Skill | A cosa servono |
|---|---|---|
| Validazione sui diff | `xrcopilotlab-validate-architecture`, `-check-tenant-isolation`, `-check-sdk-alignment`, `-check-config-bridge` | Verificano le regole obbligatorie sul diff prima di un commit o di una PR: tutte insieme, oppure mirate su isolamento del tenant, allineamento dei tre SDK pubblici, bridge delle variabili d'ambiente |
| Scaffolding | `xrcopilotlab-add-endpoint`, `-add-migration`, `-add-model` | Un endpoint CRUD completo con il suo repository e la registrazione; una migrazione SQL idempotente con la numerazione presa su tutti i branch; un modello AI a catalogo, sondato sul deployment prima di scriverlo |
| Comandi, CI/CD, PR | `xrcopilotlab-commands`, `-cicd`, `-pr-template` | Build, run e test in locale; workflow, mappa degli ambienti e tabella sintomo → verifica; il template della PR compilato dal diff, con la sezione «Configurazione Azure / Deploy» obbligatoria |
| Debug e analisi | `xrcopilotlab-trace-skill-flow`, `-generate-docs` | Perché una skill dell'agente non parte: intent → routing → handler → completion; documentazione tecnica con i diagrammi, o il manuale utente |
| Sprint e release | `xrcopilotlab-version-bump`, `-label-semver`, `-sprint-milestone`, `-milestone-report`, `xrcopilot-release-notes`, `-release-email`, `-wiki-update` | Il prossimo numero di versione derivato dalle issue chiuse e dalle label `semver:*`, le label stesse, le milestone di sprint e i loro report di stato (pulse, checkpoint, recap), e le note di rilascio con la mail e l'aggiornamento del wiki |
| Provisioning, collaudo, guida, brief e storyboard | `xrcopilotlab-blueprint`, `-blueprint-test`, `-blueprint-guide`, `-blueprint-demo`, `-blueprint-storyboard`, `-blueprint-bpm-flow`, `-blueprint-version` | Le stesse quattro del plugin: nel repository sono la **sorgente**, qui una copia sincronizzata |

L'indice completo, con «cosa fa» e «quando usarla» per ciascuna, è in `.claude/skills/README.md`
del repository di prodotto.

