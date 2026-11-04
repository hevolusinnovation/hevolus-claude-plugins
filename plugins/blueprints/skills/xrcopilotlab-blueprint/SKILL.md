---
name: xrcopilotlab-blueprint
description: Genera un manifest YAML di blueprint XRCopilotLab (topic, ruoli aziendali, agenti con system message e skill, agent task, processi BPM pubblicati con webhook) e lo applica a un tenant con la CLI `xrcopilotlab-bp`, fermandosi a mostrare il piano prima di creare qualcosa. Usa quando l'utente chiede di "creare un blueprint", "configurare un cliente o un contesto da zero", "generare lo YAML del blueprint", "provisionare agenti e processi", "applicare un blueprint", "creare un processo BPM da riga di comando", oppure nomina `xrcopilotlab-bp`. Usa anche quando chiede orientamento sui blueprint — "come funziona", "cosa posso fare", "help", "quali ambienti ci sono", "quali blueprint esistono" — o invoca la skill senza argomenti: in quel caso risponde con le informazioni e si ferma, senza iniziare un'intervista. NON usare per modificare un singolo agente o processo già esistente: per quello si va dalla UI.
---

# xrcopilotlab-blueprint

Porta l'utente da «vorrei un ambiente così» a un blueprint applicato su un tenant.

Il lavoro è in due metà: **scrivere il manifest** e **applicarlo**. La seconda passa sempre dalla
CLI, mai da chiamate dirette all'API, e si ferma a chiedere il permesso prima di toccare il tenant.

Input: `$ARGS` — la descrizione del contesto da configurare, il percorso di un manifest già scritto
da rivedere o applicare, oppure **niente**.

## 0. Se `$ARGS` è vuoto, o chiede aiuto

`help`, `aiuto`, `?`, «cosa sai fare», «come funziona» — e anche l'invocazione senza argomenti — non
sono l'inizio di un'intervista: sono una richiesta di orientamento. Rispondere, e **fermarsi lì**.
Chi arriva così non ha ancora deciso cosa fare, e partire a chiedere «di che cliente si tratta?» lo
costringe a una conversazione che non aveva chiesto.

Cosa riportare, in quest'ordine:

1. **A cosa serve**: descrivere un ambiente in un file e crearlo su un tenant — topic, agenti,
   connessioni, server MCP, orchestratori, agent task, processi BPM — mostrando il piano e
   chiedendo conferma prima di toccare qualcosa.
2. **Cosa serve per poterlo usare**, in due righe: la CLI — che si ottiene installando il plugin
   `blueprints@hevolus`, non compilando questo repository ([`references/installazione.md`](references/installazione.md)
   anche per l'installazione a mano su macOS e Windows) e un **accesso**. L'accesso preferito è
   `xrcopilotlab-bp login`: si apre il browser, un clic con l'account aziendale `hevolus.it` — non c'entra
   l'account con cui si usa Claude — e basta: niente ruoli Azure, niente chiavi (#1772). Dettagli in
   [§ Come si entra](#come-si-entra-login-e-nientaltro): vale la pena dirlo qui, perché è il punto contro cui
   si sbatte prima di riuscire a fare qualsiasi altra cosa.
3. **Su cosa si può lavorare adesso.** Non recitare l'elenco degli ambienti. Prima si prova l'identità:
   `xrcopilotlab-bp whoami --env staging` dice chi sei, su quali tenant puoi lavorare e se sei amministratore o
   operatore di piattaforma ([§ Come si entra](#come-si-entra-login-e-nientaltro)); `xrcopilotlab-bp environments`
   lo dice per ogni ambiente in una volta. Gli ambienti sono gli stessi per tutti — i **tenant no**, e sono
   personali: quelli che l'interfaccia mostra alla persona. Senza `--env` vale `staging`. Dire che in produzione
   si indica sempre il tenant con `--company`, e perché.

   Se un ambiente risulta **senza sessione**, è `login --env <nome>` (lo lanci tu, il clic è suo). Un permesso che
   manca nel prodotto (non amministratore del tenant, non operatore di piattaforma) **lo segnali tu al team** con
   `report-problem` ([«Quando non lo risolvi tu»](#quando-non-lo-risolvi-tu-ruoli-mancanti-e-difetti)).
4. **I blueprint che esistono già**: non stanno nel repository né su disco ma solo
   nell'archivio del tenant (`xrcopilotlab-bp status` sull'ambiente indicato): elencarli con tag e versione. È la risposta più utile, perché quasi sempre chi chiede aiuto vuole ripartire da uno. Se la domanda è quali si usano di più, la risposta è `copies` (§ 6-sexies), solo per lo staff.
5. **Cosa c'è già sul tenant**, se l'utente ha indicato un ambiente: `xrcopilotlab-bp status` lo
   dice in una riga per blueprint. Non lanciarlo di propria iniziativa su un ambiente non indicato.
6. **I tre percorsi possibili**, come domanda finale: partire da un dossier di assessment, fare
   l'intervista da zero, oppure rivedere o applicare un manifest che esiste.

Per l'elenco dei comandi e delle opzioni **non scrivere a memoria**: eseguire `xrcopilotlab-bp
--help` e riportarne l'esito. È l'unica versione che non può essere in ritardo rispetto al binario
installato, che potrebbe non essere l'ultimo.

Se la domanda è puntuale — «come si scrive un gateway», «che vuol dire BP060», «come si cancella un
blueprint» — rispondere a quella e basta, pescando dal riferimento giusto qui sotto, senza recitare
tutto l'orientamento.

## Cosa leggere prima

| Quando | Documento |
|---|---|
| Se la CLI non c'è, o `xrcopilotlab-bp` non è un comando | [`references/installazione.md`](references/installazione.md) — il plugin, e l'installazione a mano su macOS e Windows |
| Sempre, prima di scrivere lo YAML | [`references/regole-del-grafo.md`](references/regole-del-grafo.md) — cosa il validatore accetta |
| Quando parti da zero e devi intervistare | [`references/intervista.md`](references/intervista.md) — l'ordine delle domande e come tradurre le risposte |
| Quando serve una fonte esterna che non è ancora collegata | [`references/mcp-builder.md`](references/mcp-builder.md) — il ciclo connessione → MCP → agente, verificato su VIES |
| Quando l'ambiente ha dei documenti — sempre, se c'è un topic | [`references/knowledge.md`](references/knowledge.md) — topic, profili, agenti: i tre livelli, la sequenza, e **come si dividono i file fra i profili** |
| Quando si scrive un agente — cioè sempre | [`references/modelli.md`](references/modelli.md) — quale modello, e perché la fascia dipende dal lavoro del passo |
| Per il significato di un campo | [`references/manifest-reference.md`](references/manifest-reference.md) |
| Per un comando o un codice di uscita | [`references/cli-reference.md`](references/cli-reference.md) |
| Manuale d'uso del plugin | [`../../docs/manuale.md`](../../docs/manuale.md) |

Lo schema è in [`references/blueprint.v1.schema.json`](references/blueprint.v1.schema.json).
Due esempi commentati: [`references/esempio-agenda.yml`](references/esempio-agenda.yml) (scenario reale)
e [`references/esempio-minimo.yml`](references/esempio-minimo.yml) (il giro più corto).

## Se compare che il plugin è indietro

L'avviso arriva in due posti: **all'apertura della sessione** (un hook del plugin) e **in cima
all'output di un comando**. Le righe sono due, e dicono cose diverse:

```
xrcopilotlab-bp: c'è il plugin blueprints 2.19.0, questo è il 2.18.0: skill o CLI nuove. Aggiornalo con '/plugin marketplace update hevolus' e '/plugin update blueprints@hevolus', poi riavvia la sessione.
xrcopilotlab-bp: c'è la 2.16.0, il plugin chiede la 2.15.0. Aggiornalo con '/plugin update blueprints@hevolus'.
```

La prima vuol dire che è uscita una versione del **plugin** — skill nuove o aggiornate, a volte una
CLI nuova — e ci sono **due comandi e un riavvio**: le skill si caricano all'apertura della
sessione, quindi senza riavvio si continua a seguire quelle vecchie. La seconda vuol dire che c'è
una CLI più recente di quella che il plugin chiede.

**Non ignorarla e non lasciarla sepolta nell'output**: dilla all'utente a parole, una riga, e
proponi il comando. Chi legge una risposta lunga quella riga non la vede, e se ne accorge settimane
dopo — quando un comando del manuale «non esiste», che è il modo peggiore di scoprirlo.

Due cose da sapere mentre lo dici:

- **non puoi aggiornare tu**: `/plugin update` è un comando del client, lo digita la persona. Anche
  potendo, aggiornare sostituisce le skill mentre le stai seguendo: si fa fra un lavoro e l'altro,
  non a metà di un `apply`.
- **non è urgente**, e va detto: ciò che sta girando funziona. Se l'utente è a metà di qualcosa, si
  finisce e si aggiorna dopo.

## Come si entra: `login`, e nient'altro

La CLI lavora **solo con l'account della persona** (#1333, chiusa con la fase 5 #1772): si fa `login` una volta,
il browser si apre, un clic con l'account aziendale `hevolus.it`, e da lì ogni comando parla con l'API con il
token della persona. **Niente ruoli Azure, niente `az login`, niente chiavi, niente variabili da impostare**: l'app
Entra della CLI è nel binario. L'API legge archivio, segreti e tenant con la propria identità e **autorizza per
tenant**: utente → legge; amministratore → scrive; **operatore di piattaforma** (super-amministratore del prodotto)
→ ogni tenant, il catalogo e l'archivio intero, con ogni accesso registrato.

```bash
xrcopilotlab-bp whoami --env staging     # chi sei, su quali tenant, se sei amministratore o operatore di piattaforma
xrcopilotlab-bp login  --env staging     # se serve: si apre il browser
```

**Come si decide, senza indovinare** — il codice di uscita di `whoami` dice che cosa manca:

| Esito di `xrcopilotlab-bp whoami --env <amb>` | Significa | Che fai |
|---|---|---|
| exit `0`, elenca i tenant | Tutto a posto | Lavora: i comandi che scrivono vogliono che la persona sia amministratrice del tenant |
| exit `8` («Non hai una sessione valida») | Manca l'accesso su questa macchina | Lancia `login` (vedi sotto) |
| exit `8` («non sei un utente di XRCopilotLab») | Il token è valido ma la persona non è utente di nessun tenant | Non è un errore tecnico: deve essere aggiunta da chi amministra il suo tenant. Dillo e basta |
| exit `3`, «non è ancora attivo su …» | L'API dell'ambiente è una build precedente alla #1779 senza `CliAccess:Issuers`, oppure è chiusa apposta (`CliAccess:Closed`) | Configurazione del team: segnalalo con `report-problem --kind access`, non c'è altro da fare |

**`login` lo puoi lanciare tu**: apre il browser **sulla macchina della persona**, ed è lei a completare l'accesso.
Il comando aspetta fino a cinque minuti, quindi lancialo con un timeout di almeno 300 secondi e di' all'utente,
*prima*, che cosa succederà («si apre il browser: scegli il tuo account»). Se il browser non si apre, il comando
stampa l'indirizzo: riportalo all'utente perché lo apra a mano. Non ripetere `login` per un'attesa che sembra
lunga; se scade, una volta sola. Serve un `login` **per ambiente** (`--env staging`, `--env prod`): `promote` fra
due ambienti vuole entrambi.

**Tenant**: `--company` deve essere uno dei tuoi (`whoami` li elenca); su staging senza `--company` vale il tenant
di prova. Un 403 dell'API non distingue «non sei utente» da «il tenant non esiste»: è voluto, non cercare di
aggirarlo — dì all'utente che quel tenant non è fra i suoi. Un errore che parla di «operatore di piattaforma»
vuol dire che il comando è dello staff (`catalog publish`, `copies`, `usage`, `access`): non lo si aggira, si
chiede a chi ha quel ruolo.

**L'account con cui si usa Claude non c'entra niente**: la CLI parla con l'API di XRCopilotLab, e l'identità che
conta è quella con cui la persona entra nel prodotto. Un account Microsoft personale non funziona: l'API accetta
l'account aziendale `hevolus.it` (B2C e i clienti arriveranno dopo).

### Gli indirizzi nel manifest sono utenti del prodotto, non identità Azure

Vale quando scrivi `businessRoles[].members`, `processes[].owners` e i `recipients` di un passo
`humanApproval`. Il preflight li confronta con gli utenti **del tenant XRCopilotLab**
(`Api.Users.GetUsersAsync`), cioè con la directory B2C:

- un `mario@gmail.com` registrato con Google è un membro di ruolo **valido**;
- un collega con un ottimo account `hevolus.it` che non è mai entrato nel prodotto **non lo è**, e
  il piano si ferma con «l'utente non esiste nel tenant».

Il blueprint aggiunge le persone ai ruoli, non le crea. Quindi, prima di scrivere un indirizzo nel
manifest, la domanda non è «ha un account Hevolus?» ma «**è già un utente di quel tenant?**».

Attenzione a un caso che nasconde la distinzione: quando la stessa persona ha entrambe le cose —
identità Azure per lanciare la CLI e utente del prodotto per ricevere i compiti — la mail è la
stessa stringa in due panni diversi, e sembra che ci sia un solo account. Non c'è.

### La consegna agli amministratori: chi chiede non è chi esegue

Quando un blueprint ha passi fuori dalla piattaforma (Entra, Exchange, segreti) si scrive una
consegna da inoltrare. Chi la chiede è spesso **fuori dall'AI Team** — un Sales che si costruisce un
agente — e la consegna non deve trasformare la sua richiesta in privilegi per lui. Regole, senza
eccezioni:

- **Mai ruoli Azure per una persona.** La CLI non ne usa (#1772): né *App Configuration Data
  Owner/Reader* né *Key Vault Secrets Officer/User*, che varrebbero sull'intero ambiente — i segreti di
  **tutti** i blueprint e di tutti i tenant. Un permesso che manca è un ruolo **nel prodotto**
  (amministratore del tenant, operatore di piattaforma), e lo si segnala con `report-problem --kind access`.
- **`push`, `plan`, `apply` e `secrets set` in produzione li esegue l'AI Team.** Chi ha chiesto il
  blueprint consegna il manifest e approva il piano; non lancia la CLI su `prod`. E prima di prod
  c'è staging.
- **L'app registration non è di chi chiede.** L'owner può generare credenziali nuove, quindi
  agire come l'app senza passare da nessuno: owner è l'AI Team (o il gruppo che gestisce le
  integrazioni), mai un utente senza ruoli amministrativi. Se l'ha creata l'assistente con
  l'utenza di chi chiede, la consegna dice di trasferirla.
- **Ogni passo ha un esecutore con nome di ruolo**, e la colonna «chi» non contiene mai
  «il richiedente» per un passo che tocca Entra, Exchange o Key Vault.
- **Il perimetro si scrive per tool**, non per argomento: quali endpoint, con quale permesso, su
  quale casella, e se l'agente è usato da persone esterne (vedi
  [`references/mcp-builder.md`](references/mcp-builder.md), «Quando l'agente parla con chi non è
  il titolare della casella»).

### Se l'utente non è tecnico

È il caso per cui esiste il plugin, e conviene dirgli tre cose e non di più:

1. la CLI se la installa il plugin da solo — `/plugin marketplace add hevolusinnovation/hevolus-claude-plugins`
   e `/plugin install blueprints@hevolus`, e serve l'accesso Hevolus, quello con cui entra nella
   posta aziendale;
2. la prima volta (`login`) si apre una pagina del browser: è normale, un clic, e succede una volta sola su quella
   macchina per ambiente;
3. se compare un errore che parla di ruoli o di permessi, non è qualcosa che può risolvere da sé, e
   **non deve nemmeno scrivere a nessuno**: lo segnali tu al team, con `report-problem`, come
   descritto in [«Quando non lo risolvi tu»](#quando-non-lo-risolvi-tu-ruoli-mancanti-e-difetti).

Non fargli installare Azure CLI, non fargli scrivere un profilo, non fargli maneggiare una chiave:
niente di tutto ciò è necessario, e ognuna di quelle strade ha un modo di finire male che lui non
può riconoscere.

## Quando non lo risolvi tu: ruoli mancanti e difetti

Ci sono tre cose che questa skill non può sistemare da sola, e in entrambi i casi **il team deve
saperlo subito**, senza che l'utente debba ricordarsi di scrivere:

| Che cosa è successo | `--kind` | Chi interviene |
|---|---|---|
| Un messaggio dice che manca il ruolo **App Configuration Data Reader** (App Configuration) o **Key Vault Secrets User** (Key Vault) sull'utenza | `access` | Di norma nessuno: i due ruoli li dà il **gruppo Entra dinamico `@hevolus.it`** (issue [xrcopilotlab-iac-terraform#64](https://github.com/hevolusinnovation/xrcopilotlab-iac-terraform/issues/64)). Se l'utente è appena entrato o il gruppo non è ancora applicato, il team |
| Il piano avvisa `BP178`, oppure dopo l'apply un server **nativo** (PEC, posta, Google) risponde **401** o **405** a «elenca i tool» e a ogni chiamata | `access` | DevOps: la chiave di piattaforma dei server nativi è configurazione dell'Api (`NativeMcp:Servers`, #1768) e in quell'ambiente manca o non è allineata. Non è il manifest, non è la password della casella, e **non si chiede a nessuno la chiave né si incolla nell'indirizzo del server** |
| L'API risponde che la persona non è utente o amministratrice del tenant, che serve l'operatore di piattaforma, o che l'accesso con l'identità «non è ancora attivo» sull'ambiente | `access` | Chi amministra il tenant nel prodotto (utenti e ruoli), o l'AI Team per il ruolo di piattaforma e per la configurazione dell'API (build precedente alla #1779, o `CliAccess:Closed`) |
| Il blueprint chiede una **funzionalità che il manifest non sa esprimere** e la piattaforma non ha (nessun tipo di step, campo, connettore o capacità equivalente: hai controllato `copertura.md` (il registro di copertura, nel repository di prodotto) e `BP052`/`external` non la risolvono) | `feature` | Il team: valuta se si sviluppa o se esiste già una forma nativa che non conosci |
| Qualcosa non funziona e la causa è la **webapp o la libreria**, non il manifest né l'utente: eccezione dell'API, 5xx, un comando o un endpoint che il manuale cita e non esiste, un esito che contraddice la documentazione, il codice di uscita `4` che non dipende dai dati | `defect` | Il team, sul codice |

**Come si segnala: sempre, senza chiedere, con un comando solo.**

```bash
xrcopilotlab-bp report-problem --kind access --env staging --tag MARKETING --manifest-version 16 \
    --command "plan --tag MARKETING" --message "L'API risponde 403 su staging: la persona non è amministratrice del tenant Hevolus."
```

La segnalazione arriva all'**AI Team per mail** (l'Api la manda ai destinatari di `SupportReport:NotifyEmails`,
e chi risponde risponde a chi ha segnalato); porta **chi** sta usando la skill, l'**ambiente**, il **manifest**
(tag, versione, file) e il messaggio. Non apre processi né attività sul tenant. Prova chi è con il token della sessione di `login`. Dettagli e limiti in [`cli-reference.md`](references/cli-reference.md).

Per `feature`, nel messaggio descrivi **che cosa il cliente vuole ottenere** e quale parte del manifest non lo
esprime, non una soluzione: «il processo deve fare X, non esiste uno step che lo faccia». Vale anche quando a
scrivere il blueprint è chi non conosce il manifest (un sales): se ciò che chiede non è realizzabile, non si
inventa un surrogato in `external` e non si lascia cadere in silenzio. Si segnala, e si propone al
massimo ciò che si può fare senza quella parte, dicendo che cosa resta fuori.

Regole che non si derogano:

1. **Si segnala prima di dirlo all'utente**, e poi gli si dice che cosa è stato fatto: «ho avvisato il
   team». Non si lascia la segnalazione a un suo «sì».
2. **Il messaggio è il fatto, non il contesto**: il nome della risorsa o dell'endpoint, il codice o il
   testo dell'errore, il comando. **Mai** un segreto, una chiave, il body di un messaggio, il contenuto
   di un documento o il nome di un cliente o di una persona che non sia nel manifest. La CLI oscura ciò
   che somiglia a una chiave, ma non è una ragione per passargliela.
3. **Una segnalazione per problema**, non una per tentativo: il limite è sei all'ora per persona, e se
   si esaurisce la segnalazione non parte.
4. **Se il comando non riesce a inviare** (esce con `4` e stampa un testo), il problema non è finito:
   dai all'utente quel testo, così com'è, da mandare all'AI Team (giuseppe.zileni@gmail.com,
   marcellomarchetti@hevolus.it), e non riprovare in cerca di un'altra strada. Su produzione la rotta non è
   ancora verificata, quindi il comando lo dice e non prova.
5. **Se la CLI non c'è o non si può lanciare** (Claude Desktop, nessun terminale, nessuna sessione), il testo lo
   scrivi tu, nella stessa forma: una riga d'oggetto `[blueprint] <accesso|difetto|funzionalità mancante> ·
   <ambiente> · <TAG vN>`, poi Chi, Ambiente, Manifest, Comando, Versione della CLI, «Che cosa è successo» con il
   fatto (risorsa, errore, comando) e, per `access`, i due ruoli che sbloccano. Le regole 2 e 3 valgono uguali.
   Lo consegni all'utente in un blocco da copiare, con i due indirizzi, e gli dici che lo mandi lui.
6. **Non è per i problemi che puoi risolvere**: un manifest non valido, un nome occupato, un segreto
   mancante o un accesso ad Azure da fare dal terminale si risolvono qui, con l'utente.

Dopo la segnalazione si prosegue con ciò che si può fare senza la parte mancante; se il blocco è un
ruolo, l'unica cosa utile è aspettare che arrivi, e dirlo.

## 1. Capire il processo

### Prima di tutto: è un'agenda personale? Allora si avvisa e si propone Bookings

Vale **prima** dell'intervista, prima di leggere un dossier e anche se l'utente porta già un
manifest. Se la richiesta è una di queste —

- «un agente che legge il mio calendario e mi dice / dice ai clienti gli slot liberi»;
- «far prenotare un appuntamento, una call, una demo sul mio calendario Outlook»;
- «un assistente che fissa incontri con i clienti al posto mio»;

— **fermarsi e dirlo all'utente subito**, con parole sue e non da sviluppatore: quello che chiede
esiste già in Microsoft 365, si chiama **Bookings** («Bookings with me», in Outlook), se lo
configura da solo in pochi minuti e **non richiede permessi Azure, app registration, consensi
di amministratori né segreti**. Poi dargli i passi, che sono in
[`references/mcp-builder.md`](references/mcp-builder.md), «Come si usa Bookings: i passi da
dare all'utente». Testo di partenza:

> Prima di costruire l'agente: quello che descrivi lo fa già Microsoft Bookings, dentro Outlook.
> Legge il tuo calendario, mostra a chi prenota solo gli orari liberi (mai i tuoi impegni), crea la
> riunione Teams e fa le domande che vuoi tu (azienda, tema…). Si configura da solo, senza chiedere
> permessi a nessuno. Ti scrivo i passi; poi, se vuoi, l'agente XRCopilotLab può dare il link della
> tua pagina a chi chiede un appuntamento.

Solo dopo si decide **con l'utente** come proseguire:

1. **Bookings e basta**, oppure Bookings più un agente che dà il link: il manifest non ha
   connessioni né server MCP, e non c'è niente da chiedere a DevOps;
2. **un agente che ragiona sulla disponibilità** (proporre slot in chat insieme ad altro
   contesto): si fa, ma con OAuth **delegato** sulla casella della persona (`OAuth2PkceGeneric`,
   solo `Calendars.ReadBasic`, solo `getSchedule`) e **mai** con credenziali applicative, che
   servono solo fra due tenant. La prenotazione resta comunque su Bookings.

Non si salta l'avviso perché l'utente «ha già deciso»: chi non è tecnico chiede l'agente perché
non sa che Bookings esiste, e lo scopre di solito dopo aver mandato agli amministratori una lista
di permessi che non servivano.

### Poi, il processo

Se l'utente ha già un manifest, saltare al punto 2.

**Se porta un dossier di assessment** — il documento prodotto su Claude Desktop dalla skill
`xrcopilotlab-assessment` — la fonte è quello, non un'intervista da capo. Il capitolo **«Elementi
per il provisioning»** contiene già tag, topic, ruoli aziendali con i membri, agenti con il system
message, agent task e il disegno del processo; il capitolo del processo contiene attività, modalità,
corsie, moduli e condizioni. Leggili, traducili, e **chiedi solo ciò che manca davvero**: fare
ripetere all'utente cose che ha già scritto è il modo più veloce per perderne la fiducia.

Due cose vanno comunque verificate, perché il dossier non può saperle: che i **nomi non siano già
occupati** sul tenant (lo dice il preflight del piano) e che i **valori dei segreti** siano stati
impostati con `secrets set` — nel dossier c'è solo il loro nome, ed è giusto così.

Se il dossier promette qualcosa che il motore non fa — un timer, un ricongiungimento dopo un fork,
un allegato raccolto nel form di avvio — dirlo subito: è meglio scoprirlo qui che a piano rifiutato.

Altrimenti condurre l'intervista seguendo [`references/intervista.md`](references/intervista.md):
una domanda per volta, senza chiedere ciò che si può dedurre e senza inventare ciò che non è stato
detto.

Se quello che descrivono non regge le regole del motore — un bivio senza ramo di default, due rami
paralleli che si ricongiungono, un passo automatico con un modulo da compilare — dirlo subito e
proporre la forma corretta. Scrivere uno YAML che il validatore rifiuterà fa perdere un giro a
entrambi.

## 2. Scrivere il manifest

**La sede del blueprint è l'archivio del tenant (Azure Blob Storage), e basta.** Non il repository (la
cartella `blueprints/` è in `.gitignore`), non `~/.xrcopilotlab/blueprints/`, non una cartella «di
lavoro». Un file su disco è un appoggio di pochi minuti, e ha un solo ciclo di vita:

1. **si parte da `pull`** dell'ultima versione del tenant giusto, mai da un file già su disco (può essere
   di un altro ambiente o vecchio). Per un blueprint nuovo si parte da zero;
2. **si scrive nella cartella temporanea della sessione** (lo scratchpad), **mai sotto
   `~/.xrcopilotlab/`**: una cartella di quella famiglia sembra una sede e diventa una copia che
   sopravvive;
3. **`validate`, poi `push` subito** — anche una correzione intermedia, anche una versione che non si
   applicherà. Non si aspetta il piano, il collaudo o il sì dell'utente: il manifest non è nell'archivio
   finché `push` non l'ha scritto;
4. **dopo il `push` il file locale si elimina**. Se serve ancora, si rilegge con `pull`.
5. **Fuori dalla produzione l'archivio tiene le ultime due versioni** (#1596): dopo ogni `push` su
   staging restano la versione appena scritta e quella prima, e il comando dice quali sono uscite.
   Una versione ancora installata sul tenant resta comunque; in produzione restano tutte. Se serve
   una versione più vecchia, non c'è più: si riparte da `pull` dell'ultima. Per ripulire ciò che era
   in archivio prima della regola: `prune --env staging` (conferma scrivendo `archivio`, o il tag con
   `--tag`), mai in produzione.
6. **Che cosa è fermo, doppio o mai usato lo dice `audit`** (#1766): `audit --env staging --company <guid>`
   dà un giudizio per blueprint (tieni, attivo, guarda, doppio, fermo, non usato) con i motivi — ultima
   attività nell'archivio, tag condiviso, famiglia di varianti, run da chiudere, istanze in corso — e
   non scrive niente. Un blueprint da non proporre più si segna con `audit keep --tag <TAG> --reason
   <testo>`; i report vecchi di un tag si tolgono con `test prune --tag <TAG>` (restano gli ultimi di
   ogni suite e i giudicati; conferma: il tag). A smontare e cancellare restano `rollback` e `delete`.

All'utente si riporta **la versione e il blob** scritti da `push` (`blueprints/<company>/<blueprint>/v<N>/…`),
mai «salvato in cartella». Un file locale a nome del blueprint che non è nell'archivio è un difetto da
segnalare, non un risultato. Nei comandi qui sotto `<manifest>` indica quel file temporaneo.

**Le risposte degli agenti sono per persone, non per programmi.** Ogni `systemMessage` di un agente che
risponde a qualcuno — in chat, come passo di un orchestratore con `displayOutput`, in un agent task — chiede
prosa in paragrafi, con i titoli delle sezioni dove aiutano; un elenco solo quando le voci sono davvero un
elenco, una tabella solo quando un confronto non si legge in prosa. **Mai** una riga «leggibile a macchina»
(`STRATEGY_JSON: {...}`), un oggetto JSON o YAML, un blocco di codice, un punteggio numerico al posto di una
valutazione detta a parole con il suo perché. Il formato strutturato è legittimo solo per un passo che una
macchina legge e nessuno vede: un router con `requireStructuredOutput` e `outputSchema`, un passo senza
`displayOutput` il cui output entra in un tool. Un blocco «Per chi scrivi» con questa regola, in ogni agente
rivolto a una persona, costa poco e risparmia una versione (LEGAL v11, 23/10/2026: l'avvocato riceveva un memo
a elenchi con `STRATEGY_JSON` in coda). Nello stesso blocco si dà un **tetto di parole** e, agli agenti con
strumenti, un **tetto di ricerche e pagine**: nel collaudo LEGAL del 22/10 il passo di ricerca durava da 180 a
446 secondi perché il prompt chiedeva cinque fonti e 3-5 precedenti senza limite.

Se un passo successivo ha bisogno di un **numero o di una scelta** ricavati dal testo di un agente (una
probabilità per un `condition`, una via per uno `switch`), non si chiede all'agente di scrivere JSON nel
testo: **in modo strutturato le variabili arrivano solo dal blocco `OUTPUT`**, quindi lo stesso agente non
può dare la prosa al passo dopo e i campi al motore senza duplicare tutto il testo nel JSON. Si aggiunge un
**passo di lettura** — un agente interno su `gpt-5.4-mini`, `requireStructuredOutput: true`, `outputSchema`
con i soli campi, `userMessageTemplate` con le variabili dei passi in prosa — e un `condition` che li usa
(LEGAL v12, 23/10/2026: «lettura-esito» → «bassa-probabilita» → `sendMessage` di avviso prima della bozza).
Costa una chiamata breve, e la prosa che l'utente legge non cambia.

Sei errori che si fanno se non si sta attenti:

1. **I nomi si scrivono senza prefisso.** Il planner antepone `BP-<TAG>-`, oppure il prefisso scelto
   in `naming.prefix` (`"Polis · "`, o `""` per nessuno — chiederlo nell'intervista, prima del primo
   apply: poi non cambia più, `BP111`). Scriverlo a mano nei nomi produce `BP-TEST-BP-TEST-…` ed è un
   errore segnalato.
2. **Nella `spec` i riferimenti sono nomi, non chiavi.** `roleName: Referente agenda`, non
   `roleName: referente`. Devono coincidere con il `name` dichiarato in `businessRoles` e
   `agentTasks`.
3. **Il tipo dei valori conta.** `value: true` è booleano, `value: "true"` è stringa, e il motore
   confronta per tipo.
4. **Un gateway esclusivo vuole esattamente un ramo senza condizione.**
5. **`categoryName` non si prefissa**: appartiene al catalogo del tenant.
6. **Mai un segreto nel file.** Solo il nome di una chiave `Blueprints:Secrets:<TAG>:<nome>`.
7. **Il topic si indica in un modo solo.** `topic` ne crea uno nuovo; `existingTopic` (per nome,
   come compare nella UI) o `topicId` ne riusano uno esistente. Se l'utente vuole aggiungere agenti
   a un topic che ha già, è `existingTopic`: chiediglielo invece di crearne uno nuovo con un nome
   simile.
7-bis. **Un server MCP che il tenant ha già si cita, non si ricrea.** `web-search`, un server
   registrato a mano, uno di un altro blueprint: `mcpServers` con `kind: existing` e il **nome
   esatto del catalogo** (niente prefisso, niente tool, niente URL), e l'agente lo mette in `mcp:`.
   La CLI lo collega all'agente; se il server non c'è il piano si ferma con `BP069`, che elenca
   ciò che il catalogo contiene. Non scrivere più «da collegare dalla UI» in una `description`:
   era il ripiego di quando questa forma non esisteva (fino al 29/09/2026).
7-ter. **Google a nome di una persona è `kind: native`, mai `builder`.** Calendario, Drive o posta di
   un account Google si leggono con il server nativo della piattaforma, ma quello di default è
   uno solo per tutti i tenant (un solo account Google). Si dichiara `kind: native` con `service:
   calendar|drive|gmail` e `clientId`/`clientSecret` come **riferimenti** ai segreti dell'app Google
   **del cliente** (`Blueprints:Secrets:<TAG>:…`): l'apply crea per il tenant la copia e la riga OAuth,
   **non autorizza**. Poi una persona esegue `xrcopilotlab-bp mcp authorize <chiave> --tag <TAG>` e
   accede con il suo account Google (la CLI stampa il link e attende, non vede mai password né token).
   MCP Builder non può farlo: Google non concede il client credentials sul calendario. **Prima di
   applicare**, riportare sempre all'utente i passi che restano a lui nella Google Cloud Console — il
   piano li elenca con l'avviso **`BP112`**, con l'URI di reindirizzamento dell'ambiente — e non
   darli per scontati: abilitare la API del servizio, schermata di consenso, ID client «Applicazione
   web» con l'URI `…/api/auth/google/callback` dell'ambiente, i due segreti con `secrets set`,
   poi `mcp authorize` con il link copiato **intero** (procedura completa e URI per ambiente:
   [`references/mcp-builder.md`](references/mcp-builder.md#lapp-oauth-google-del-cliente-passo-per-passo)).
   `native` è l'**unica** strada per Google: un server MCP Google di terzi registrato a mano non
   funziona, perché l'autenticazione «OAuth 2.0 (Google Auth Code)» passa il token come **argomento
   dei tool** (`oauth_access_token`…), e solo i nostri server nativi lo leggono da lì. E se l'agente
   deve leggere il **contenuto** di PDF o Word che stanno su Drive, la strada sicura è la knowledge
   (file nel topic, indicizzati da un profilo — regola 8), non il server MCP.
7-quater. **Una casella di posta è `kind: native, service: pec` (certificata) o `service: mail` (ordinaria)**
   (#1750, #1751): la piattaforma ha due server nativi, PEC e `Mail (IMAP/SMTP)`, lo stesso codice con due
   facce, e il blueprint ne crea per il tenant la copia con `mailbox:`
   (l'indirizzo PEC, che è anche l'utente IMAP) e `password:` come **riferimento** a un segreto
   (`Blueprints:Secrets:<TAG>:pec-password`). Niente app OAuth e niente browser: se il segreto manca
   all'apply, la copia nasce con la sola casella e la password la mette l'amministratore dalla UI
   (Interoperabilità › MCP Servers › Autenticazione «Mailbox (IMAP/SMTP)» › Password), oppure `secrets set` e poi
   `mcp authorize <chiave> --tag <TAG>`, che per la PEC riscrive gli header dal segreto. Il gestore (Aruba,
   Legalmail, Postecert, Namirial) lo trova il server dal dominio della casella o dai record MX; `imapHost`
   si dichiara solo se non lo trova. **Non si inoltra la PEC a una casella M365** per leggerla via Graph, e
   non si costruisce un server `builder` sopra IMAP: non è HTTP. Sola lettura: il server non cancella, non
   sposta, non segna come letto, e l'archivio legale resta dal gestore. L'ingresso di un processo da una PEC è
   la forma di sempre: agent task schedulato sull'agente con `mcp: [pec]` e `outputActions` `webhook` verso il
   processo; gli allegati li porta la piattaforma dalla rotta degli allegati del server, non il tool.
   **L'invio c'è** (`pec_send_message`, `mail_send_message`) ed è **governato**: il punto di controllo della
   governance lo valuta come `action.email` sui domini dei destinatari, quindi il regolamento «Perimetro delle
   comunicazioni» del tenant lo copre; `allowedDomains` nel manifest è il perimetro lato server, l'ultima linea.
   Quando un agente deve scrivere, proporre sempre la governance (skill `xrcopilotlab-blueprint-governance`) o
   almeno `allowedDomains`, mai un invio senza perimetro. **La chiave con cui la piattaforma parla ai propri server
   nativi non è un affare del blueprint** (#1768): la manda l'Api dalla sua configurazione, il manifest non la
   contiene, la copia del tenant non la porta, e un `BP178` nel piano o un 401/405 dopo l'apply si segnalano con
   `report-problem --kind access`, mai chiedendo la chiave o scrivendola nell'indirizzo. Dettagli: [`references/mcp-builder.md`](references/mcp-builder.md#pec-e-posta-i-server-nativi-della-piattaforma).
8. **Il topic non è il RAG.** Il topic è il repository dei file; il **profilo** è ciò che li
   indicizza e che si collega all'agente. Un agente su un topic pieno di file ma senza profilo non
   vede niente. I profili si dichiarano in `knowledge:` e sono **knowledge graph per default**; il
   tipo dei file **non si scrive** se non lo chiede l'utente. Prima di scrivere quella sezione:
   [`references/knowledge.md`](references/knowledge.md).
9. **Un profilo per dominio, non per agente — e i nomi dei file contano.** Ogni profilo attivo
   consuma una licenza, e un profilo per agente su un blueprint grande la supera (FINBANK: 20
   profili, `BP071`). Gli agenti che lavorano sugli stessi documenti condividono un profilo; in un
   blueprint a moduli, **un profilo per segmento**, in un modulo che i moduli del segmento
   richiedono. Due cose restano: un profilo **unico** per tutto il blueprint è la forma che sbaglia
   (ogni agente carica i documenti di domini che non sono suoi), e il **passo a valle di una catena
   orchestrata** — il cui messaggio contiene l'output del precedente, quindi fa corrispondere quasi
   ogni nome file — vuole un profilo con i soli file che deve leggere (`BP028`). Dentro un profilo
   le sorgenti si selezionano confrontando le parole della domanda con il **nome del file**: in un
   profilo condiviso il nome porta il dominio (`finbank-reclami-…`, `finbank-dora-…`), così una
   domanda su un dominio esclude i file degli altri. `xrcopilotlab-bp suggest` propone un profilo per
   agente come punto di partenza da **accorpare** per dominio. Dettagli in
   [`references/knowledge.md`](references/knowledge.md).
10. **Il modello si dichiara.** Senza `model:` l'agente nasce su `gpt-5.4` (`BP015` lo avvisa), e un
    nome fuori catalogo ferma il piano (`BP065`). La fascia dipende dal lavoro del passo, non dalla
    sua importanza: [`references/modelli.md`](references/modelli.md).

11. **Negli orchestratori non c'è uno step di avvio.** Si parte dal primo step elencato, quello a
    cui nessun flusso arriva — come nel designer, dove uno «Start» non si può aggiungere. Un
    `type: start` scritto per abitudine è segnalato (`BP094`) e ignorato dal piano; due step senza
    flussi entranti, o nessuno, fermano il piano (`BP095`).
12. **Le domande suggerite all'utente stanno in `welcomeMessage`, sull'orchestratore.** È il messaggio
    che la chat mostra all'apertura, prima che l'utente scriva (max 1500 caratteri). **Non** uno step
    `sendMessage` in testa alla catena: il suo testo arriva in chat solo insieme alla risposta
    finale, quando non serve più. Scriverci la forma che una domanda deve avere e due o tre esempi
    che funzionano davvero. Per un **agente** benvenuto e suggerimenti stanno nel primo elemento di
    `chatEndpoints` (`welcomeMessage`, `enableSuggestions`, `suggestionMode`, `manualSuggestions`).
13. **Un agente dichiara il suo tipo e il suo modo di rispondere, quando conta.** `type: base` per un
    dialogo a più turni: un agente `smart` (il default, Q&A sulla knowledge) ha il grounding stretto e
    rifiuta un seguito come «B». Poi `verbosityLevel` (`veryConcise`, `concise` di default, `verbose`,
    `noLimit`), `searchTopK` (estratti per profilo, solo `smart`), `reasoningEffort` (`minimal`…`high`,
    solo sui modelli che lo supportano), `enablePermanentMemory`, `disableHistory`,
    `enableGroundednessDetection`, `minRankingScore`, `minWordsValidation`. Ciò che non si scrive prende
    il default della UI, e in una versione nuova resta com'è sul tenant. Dal 24/10/2026 (#1612): prima
    l'apply li ignorava e ogni agente nasceva Q&A. Dettagli in `docs/blueprints/manifest-reference.md`,
    «Tipo, comportamento della risposta e endpoint di chat».
14. **In un `parallelGroup` ogni membro può avere il suo messaggio e i suoi parametri**:
    `agentMessages` e `agentSkillMetadata`, dalla chiave dell'agente al messaggio (come
    `userMessageTemplate`) o ai parametri (come `skillMetadata`). `agentMessages` vuole un
    `inputMapping` sul gruppo; una chiave che non è fra gli `agents` è un errore. I file generati da un
    membro diventano `{variabile}_file` / `{variabile}_files` della sua variabile di `agentOutputs`: è
    così che immagini, clip e voce si generano in parallelo (v4.1.0).
15. **Un orchestratore si progetta per essere veloce.** Chi lo usa aspetta in chat: ogni secondo di
    troppo si vede. Prima di consegnare il manifest, rileggere ogni orchestratore con queste regole:
    - **Un modello per passo, il più piccolo che basta.** Il modello dell'agente vale anche come step di
      orchestratore (#1552). Un agente che **non ragiona** ma rimette in forma — compone un JSON o un
      payload per una skill, converte, estrae un campo, smista, controlla una lista — va su `-nano` o
      `-mini`; la fascia piena resta per chi ragiona su documenti, scrive testi che leggono i clienti o
      produce numeri ([`references/modelli.md`](references/modelli.md)). Un agente di sola forma, usato
      solo negli orchestratori e dichiarato su un modello pieno, è `BP176`.
    - **In parallelo ciò che non dipende da altro.** Due passi in fila dove il secondo non legge niente
      di ciò che produce il primo si mettono in un `parallelGroup` (`agents`, `agentMessages`,
      `agentOutputs`, `maxParallel`): girano insieme e il tempo è quello del più lento, non la somma. Il
      caso tipico è una catena di produzione — immagini e testo, clip e audio, bozza della news e della
      newsletter. Due agenti in fila indipendenti sono `BP175`. Restano in fila solo i passi che leggono
      l'output del precedente, quelli con `allowAgentInteraction` e quelli dopo una domanda all'utente.
    - **Pochi passi, ciascuno con un compito.** Un passo che fa tre cose diventa una chiamata lunga e
      fragile; tre passi in fila che potrebbero essere uno solo sono tre chiamate. La regola è la
      dipendenza dei dati: si divide ciò che può girare in parallelo o su un modello più piccolo, si
      unisce ciò che la stessa chiamata farebbe comunque.
    - **Niente output che nessuno legge.** `displayOutput: false` sui passi interni (payload, guardie,
      riformattazioni): la chat mostra solo ciò che serve a chi aspetta, e un gruppo mostrato senza
      sintesi è `BP096`.
    - **Le scadenze non accorciano niente.** Un `timeoutSeconds` stretto non rende il passo più veloce:
      lo fa fallire (le scadenze finalizzano, non cancellano: regola `chat-no-forced-timeout`). Si accelera
      con il modello e con il parallelo, mai tagliando il tempo concesso.
    - **Le voci si mostrano come «Nome LINGUA»**, in qualunque orchestratore e in qualunque modulo:
      `Isabella IT`, `Ava EN`, mai `Isabella (it-IT-IsabellaMultilingualNeural)` (`BP177`). Il passo che
      compone il payload della voce ha nel suo messaggio la tabella nome → identificativo
      (`Isabella IT → it-IT-IsabellaMultilingualNeural`), così la persona sceglie un nome e la skill
      riceve l'identificativo giusto.

    Dopo l'apply, il collaudo di un orchestratore riporta i tempi per passo: il passo più lungo è il
    primo candidato, a un modello più piccolo o a un gruppo parallelo.

L'id dei flussi lasciarlo fuori: lo genera la CLI, e il file resta leggibile.

### Se l'ambiente ha dei documenti, far parlare i file prima di decidere

```bash
xrcopilotlab-bp suggest <manifest> --files <cartella> --env staging
```

Da lanciare **dopo** aver scritto gli agenti e **prima** di scrivere `knowledge:`. Propone un
profilo per agente, assegna i file dove il nome lo giustifica, e calcola i vincoli che i nomi
impongono: quali file il selettore non distinguerà, e quali dentro il loro profilo non hanno parole
proprie — cioè verranno esclusi appena una domanda nomina uno degli altri. Stampa anche una fascia
di modello per agente, con i segnali su cui si basa.

Non scrive niente, e ciò che propone **non si incolla senza leggerlo**: i file che lascia non
assegnati sono quelli per cui il nome non basta a decidere, e quella decisione richiede di sapere
che cosa fa ciascun agente. La proposta di modello è un'inferenza su segnali del manifest, non sul
lavoro del passo.

### Quando serve una fonte esterna che non è ancora collegata

Un agente che deve leggere da un sistema esterno ha bisogno di un **server MCP**. Prima domanda:
il tenant **ce l'ha già** nel catalogo? Allora è `kind: existing` (regola 7-bis) e non si costruisce
niente. È un servizio Google da usare a nome di una persona? Allora è `kind: native` (regola 7-ter).
È una casella PEC o di posta ordinaria? Allora è `kind: native, service: pec` o `service: mail` (regola 7-quater).
Altrimenti la domanda da farsi è una sola: quella fonte è **HTTP interrogabile**?

Se sì, non si scrive un servizio: si costruisce con **MCP Builder**, e il manifest lo **dichiara** —
una `connections` con provider, baseUrl e autenticazione, e un `mcpServers` con `kind: builder` e i
tool, che sono già `{nome, metodo, path}`. **La CLI lo crea**: connessione, server, prova di un tool
e pubblicazione, più il collegamento all'agente. Le autenticazioni coprono `None`, `Bearer`,
`Basic`, `CustomHeaders` e `OAuth2ClientCredentials` — quindi anche Microsoft Graph, e con esso una
casella o un calendario.

Se no — la fonte non è HTTP, richiede logica di trasformazione, o custodisce un token per ogni
entità autorizzata come LinkedIn — il server va scritto, e **non è dichiarabile**: `kind: external`
pretende l'URL di un server già ospitato, e inventarlo metterebbe nel manifest un dato falso. Si
annota nella `description` dell'agente che lo userà e finisce fra i passi manuali del piano di
attivazione.

**Microsoft 365 — posta, calendario, contatti, file — ha una forma sola, e va proposta senza
farsela chiedere**: connessione a Graph con `OAuth2ClientCredentials`, server `builder` con i soli
tool che servono, e l'identità per-utente (la casella) in `variables` e **mai** fra i parametri del
tool — altrimenti è il modello a decidere di chi legge la posta, su un permesso che vale per tutto
il tenant.

Prima di proporla, però, **tre domande**, perché la forma è una ma i permessi no:

0. **di chi è la casella, e in quale tenant?** Le credenziali applicative (`OAuth2ClientCredentials`
   con un'app nostra multi-tenant) servono **solo a far parlare due tenant**: la casella è di
   un'altra azienda, come per Studio Polis, e nessuno di quell'azienda può autorizzare a nome
   suo dentro XRCopilotLab. Se la casella è di **una persona di Hevolus che usa l'agente per sé**
   — il proprio calendario, la propria posta — non si usano permessi applicativi: è OAuth
   **delegato** (connessione `OAuth2PkceGeneric`, pulsante *Autorizza* in Connections), la persona
   autorizza con il proprio account e il token vede solo la sua casella, senza consensi tenant-wide
   né assegnazioni in Exchange. Il manifest non dichiara ancora questa connessione: si crea dalla
   UI e il server si collega con `kind: existing`
   ([`references/mcp-builder.md`](references/mcp-builder.md), «La casella è di chi usa l'agente»);
1. **serve davvero un'app?** Chi vuole far prenotare appuntamenti sul proprio calendario ha già
   Microsoft Bookings («Bookings with me»): slot, riunione Teams e domande al prenotante, senza
   registrazioni applicative né consensi. L'agente porta al link; il blueprint non tocca Graph;
2. **che cosa deve fare, esattamente?** I permessi si ricavano dai tool, non dall'argomento: gli
   slot liberi sono `getSchedule` e bastano a `Calendars.Read`; `Calendars.ReadWrite`, `Mail.Read`
   e `Mail.Send` si chiedono solo se c'è un tool che li usa. «È un calendario» non è un motivo per
   chiedere di scriverlo.

I passi che il blueprint non può fare — registrazione applicativa, **permesso ristretto a quella
casella con RBAC for Applications** in Exchange (non più consenso tenant-wide + Application Access
Policy, che Microsoft ha dichiarato legacy), credenziale, segreti con `secrets set` — si riportano
all'utente prima di applicare. **Chi li esegue** lo dice la tabella in
[«La consegna agli amministratori»](#la-consegna-agli-amministratori-chi-chiede-non-è-chi-esegue):
mai chi ha chiesto il blueprint, se non è dell'AI Team.

**Se è la chat a dover far partire un processo** — l'utente detta o incolla qualcosa all'agente e
da lì deve nascere una pratica — la forma è una `connections` con `process: <chiave del processo>`
(niente `baseUrl`, niente `auth`: indirizzo e chiave del webhook li mette l'apply, dopo aver creato
il webhook) e un `mcpServers` `builder` su quella connessione con un tool `POST /` il cui corpo ha le
chiavi del modulo di avvio. L'agente della chat non deve essere quello di un passo automatico del
processo, e va istruito a rileggere, chiedere conferma e chiamare il tool **una** volta.

Procedura completa, la scelta di un tool di prova in sola lettura, l'errore del path duplicato che
costa un 404, il ponte dalla chat al processo e le regole di prompt sui gap:
[`references/mcp-builder.md`](references/mcp-builder.md).

### Dati di collaudo: si dichiarano in `testData`, e in produzione si chiedono

Un blueprint si mette a punto sul tenant di prova, e lì porta valori che in produzione non valgono:
la stessa persona in tutti i ruoli, una soglia scelta per esercitare i rami di un gateway, il server
MCP che c'è solo sul tenant di prova, un indirizzo di callback che il cliente non ha ancora dato.
Sono legittimi **solo dichiarati**: un valore finto lasciato in un commento arriva in produzione con
la prima copia del manifest.

- **Fuori dalla produzione** — se la persona non ha deciso persone o valori, proponi un dato di
  collaudo e **scrivi la voce** in `testData`: che cosa è finto (`what`), il valore (`value`), dove
  compare (`where`) e **la domanda da fare prima della produzione** (`production`). Il piano le
  elenca come avvisi (`BP141`): riportale all'utente insieme al piano.
- **In produzione** — nessun dato di collaudo. Si chiede **ruolo per ruolo** quali utenti del tenant
  ne fanno parte (`AskUserQuestion` va bene: un ruolo per domanda, le email degli utenti del tenant
  fra le opzioni quando la CLI le ha elencate), e ogni valore che in prova era fittizio. Un manifest
  che porta ancora `testData` in produzione si ferma (`BP140`): fai le domande scritte nelle voci,
  sostituisci i valori, togli le voci, alza `version`.
- **Portare in produzione un blueprint collaudato** (`promote`, `catalog publish`) vuol dire prima
  fare le domande di `testData`: è la lista di ciò che va chiesto al cliente, già scritta.
- **La documentazione segue la sezione**: il README del blueprint (`files put --kind doc`) ha un
  paragrafo «Dati di collaudo» con le stesse voci, in parole semplici, e per ogni voce che cosa si
  chiederà in produzione. Non è un secondo posto da tenere allineato a mano: si riscrive dal
  manifest ogni volta che `testData` cambia.

```yaml
testData:
  - key: persone
    what: Membri di tutti i ruoli, owner dei processi e destinatari delle approvazioni
    value: utente-di-prova@hevolus.it
    where: [businessRoles, processes.*.owners]
    production: Per ogni ruolo aziendale, quali utenti del tenant ne fanno parte?
  - key: soglia-fido
    what: Soglia oltre la quale un fido lo approva il CFO
    value: "50000"
    where: [processes.affidamento-clienti.chiApprova]
    production: Sopra quale importo di fido decide il CFO invece del responsabile credito?
```

Il campo è descritto in [`manifest-reference.md`](references/manifest-reference.md#testdata-i-dati-di-collaudo).

## 3. Validare

```bash
xrcopilotlab-bp validate <manifest> --graph
```

Se ci sono errori, correggerli e ripetere. **Non chiedere all'utente di interpretare i codici**: i
rilievi sono per chi scrive il file, e chi scrive il file sei tu.

Quando è pulito, mostrare all'utente il **grafo stampato** e chiedere conferma che il percorso sia
quello che intendeva. È il momento giusto per accorgersi di un ramo mancante: dopo, correggerlo
costa una versione nuova.

## 4. Segreti, se il manifest ne cita

Il valore di un segreto **non si chiede e non si maneggia**. Stampare all'utente il comando da
lanciare, dicendogli di darlo **nel suo terminale**:

```
xrcopilotlab-bp secrets set --env staging --tag STUDIOPOLIS graph-client-secret
```

**Questo è l'unico comando che non va proposto con il prefisso `!`**, ed è una differenza che
costa: il `!` lo esegue dentro la sessione, quindi l'interazione finisce nella trascrizione — cioè
esattamente il posto in cui un segreto non deve passare. Il comando chiede il valore con una
lettura mascherata: va data dove la maschera serve a qualcosa.

Per un valore che l'utente ha già altrove c'è **`--from-env NOME_VARIABILE`**, che lo legge da una
variabile d'ambiente invece che dal prompt.

Poi verificare con `xrcopilotlab-bp secrets check <manifest> --env <ambiente>`.
`--env` non è un dettaglio: senza, la verifica può guardare un ambiente diverso da quello in cui il
piano andrà a cercare la chiave, e si finisce a rifare due volte la stessa cosa.

I segreti li conserva la piattaforma, cifrati, per tenant e tag (#1798): `secrets set` non tocca
né Key Vault né App Configuration, e non chiede ruoli Azure. Un segreto vale dal piano successivo.

## 5. Piano, e approvazione umana

```bash
xrcopilotlab-bp push <manifest>
xrcopilotlab-bp plan --tag <TAG> --company <guid>
```

Dentro il repository, senza `--env`, si lavora sull'ambiente del `local.settings.json`. Per
sceglierlo si aggiunge `--env staging` o `--env prod`: gli ambienti sono dentro il
binario, non c'è nulla da configurare.

Il **tenant** non si scrive: senza `--company` la CLI ne elenca i nomi e chiede quale. Eseguita da
un assistente l'input non è un terminale, quindi stampa l'elenco e si ferma con **6** — vuol dire
riportare i nomi all'utente e chiedere quale, non indovinarne uno.

Su **staging** fa eccezione: l'ambiente di prova è uno solo, quindi senza `--company` la CLI ci
lavora e lo annuncia. Non c'è niente da chiedere all'utente, e non c'è un 6 da aspettarsi.

In **produzione** si lavora sui tenant a cui l'utente **appartiene** — gli stessi che gli mostra
l'interfaccia dopo il login. Un tenant fuori da quell'elenco viene rifiutato anche se il GUID è
scritto a mano (**3**), e lo è pure quando l'identità non si riesce a stabilire: non sapere chi sei
non è una ragione per mostrarti di più. Se qualcuno dovrebbe esserci e non c'è, la risposta è farlo
censire su quel tenant nel prodotto — non un ruolo Azure, e non un tentativo.

**Mostrare il piano all'utente e fermarsi.** Non «riassumere che è tutto a posto»: riportare cosa
verrà creato e il grafo del processo, perché è su quello che la persona deve decidere.

Poi **chiedere esplicitamente l'approvazione**, dicendo su quale tenant e quante entità. Finché non
arriva un sì, il lavoro è finito qui.

Cosa **non** vale come approvazione:

- un sì dato prima, per un piano diverso o per una versione precedente del manifest;
- un «vai» generico detto all'inizio della conversazione, prima che il piano esistesse;
- il fatto che il piano non abbia errori. Un piano valido è un piano che *si può* applicare, non uno
  che *si deve* applicare.

Se il blueprint è già applicato su quel tenant, il piano **non** riporta collisioni sulle sue entità:
è un aggiornamento — vedi [§ 6-ter](#6-ter-una-versione-nuova-su-un-blueprint-già-applicato).

Se il piano riporta collisioni, spiegare quale nome è già occupato e le tre strade — rinominare,
cambiare tag, rimuovere l'entità esistente — senza sceglierne una.

Se il piano riporta **`BP128`**, a chi applica manca nel tenant un ruolo della webapp che quelle operazioni
chiedono (`topic-manager`, `agent-manager`, `process-manager`, oppure l'amministratore del tenant per
orchestratori, agent task, connessioni, server MCP e ruoli aziendali). `apply` non parte finché ne manca uno:
riportare quali ruoli e per quante operazioni, e che li assegna l'amministratore del tenant dalla webapp. Non
proporre di applicare «solo il resto».

## 6. Applicare, solo dopo il sì

```bash
xrcopilotlab-bp apply --tag <TAG> --company <guid> --yes
```

`--yes` **non** è una scorciatoia per saltare la domanda: è la forma scritta dell'approvazione che
l'utente ha appena dato, e finisce nel run insieme a chi l'ha data e a quando. Usarlo senza quel sì
significa firmare al posto di qualcun altro.

La CLI difende comunque il cancello: eseguita da un assistente l'input non è un terminale, quindi
senza `--yes` stampa il piano, si ferma e restituisce **6**. Nessuna entità viene creata. Se ricevi
un 6, non aggiungere `--yes` per «sbloccare»: significa che l'approvazione manca ancora.

Al termine riportare: quante entità sono state create, il `runId`, gli eventuali riferimenti non
risolti nei processi, e — se è stato creato un webhook — che la chiave compare **una sola volta** e
va conservata adesso.

Se l'applicazione fallisce a metà, dire com'è messo: cosa è stato creato, che il run riparte con
`--resume <runId>`, e che `rollback --run <runId>` smonta ciò che l'inventario elenca.

**Se la sezione «Prove dei tool MCP» riporta un avviso**, l'apply è riuscito ma quel server non
raggiunge la sua fonte (credenziale sbagliata, permesso mancante, casella non pronta). I task
schedulati sugli agenti di quel server partono comunque, e girano a vuoto — o peggio, mandano un
esito d'errore a un webhook che apre un caso a ogni giro. Dirlo subito all'utente, con il messaggio
dell'errore **senza ripetere valori che sembrano credenziali**, e proporre la pausa:

```bash
xrcopilotlab-bp schedule list                --tag <TAG> --company <guid>
xrcopilotlab-bp schedule pause <chiave-task> --tag <TAG> --company <guid>
```

Un task schedulato ha una **quota giornaliera** (100 esecuzioni al giorno UTC di default): oltre,
la piattaforma salta i giri senza errore. Se il cron è più fitto — ogni minuto sono 1440 giri — il
validatore lo dice (`BP029`) e la risposta è `executionPolicy.maxDailyExecutions` sul task, non un
cron più largo se la latenza conta. Si riprende con `schedule resume` quando la fonte risponde. Per capire **perché** la fonte non
risponde, `xrcopilotlab-bp mcp test <server> --tag <TAG>` mostra la risposta grezza del sistema di
terze parti (l'errore di Entra, il 403 di Graph) senza passare dal modello; `mcp check` dice se
l'agente carica davvero il server. Dopo aver corretto un segreto con `secrets set`, la connessione
va riallineata con `connections refresh --tag <TAG>`: porta i valori risolti all'apply, e non cambia
da sola. Un segreto sovrascritto non ha versioni precedenti (#1798): il valore giusto si riprende
da chi lo possiede.

Due comandi dicono cosa sta succedendo davvero dopo l'apply, senza aprire l'interfaccia:
`xrcopilotlab-bp schedule logs <chiave-task> --tag <TAG>` (quota giornaliera del task, ultime
esecuzioni con esito, avviso se lo scheduler avanza mentre le esecuzioni no) e
`xrcopilotlab-bp instances list --tag <TAG> --running` / `instances show <id>` (le istanze dei
processi del blueprint: dove sta il token, eventi, compiti, dati del caso). Un token su un compito
umano — `verifica:waiting`, `assegna:waiting` — vuol dire che manca il passo di una persona, non che
qualcosa è rotto. Un blueprint applicato si collauda con la skill `xrcopilotlab-blueprint-test`.
Per spiegarlo al cliente — il flusso, dove lavora l'AI, domande di esempio, come è fatto il suo
ambiente — la guida non tecnica, a story slides, con la sua pagina web e il deck per i sales, la
scrive la skill `xrcopilotlab-blueprint-guide`.

### Dopo l'apply: un'app per chi lo usa ogni giorno

Se l'utente chiede un'app sul blueprint — uno sportello pubblico, un widget nel sito del cliente, un
cruscotto per un ruolo, una scena 3D di un luogo — la porta la skill `xrcopilotlab-blueprint-app`:
mappa delle integrazioni, archetipo, 2-3 varianti di layout come mock-up (al più una in 3D) e brief
per App Buddy. Questa skill non disegna app.

Il ritorno è uno solo: quando la mappa trova qualcosa che manca nel manifest (un `embed`, il webhook di
un processo, uno step `action` che richiami l'app, un endpoint di chat dedicato), arriva qui come
**proposta di modifica**, con il frammento YAML e il motivo. Si tratta come ogni versione nuova:
validazione, piano, approvazione, apply (§ 6-ter). La skill dell'app non fa né `push` né `apply`.

Lo stesso vale per l'app stessa, a collaudo finito: un frammento della sezione `apps` (con `kind: demo` o
`product`) e i sorgenti, che viaggiano con la versione come la knowledge. Un manifest può avere più app di demo,
anche adottate da colleghi (con il blocco `origin`). **Le app si creano solo in produzione**: su staging l'apply
non le crea (`BP169`, avviso) e il resto del blueprint si applica. **Copiando verso la produzione un blueprint che
ha app `kind: demo`** (`promote --to prod`, `catalog install` in prod) si chiede all'utente quali app di demo vuole
— risposta proposta: tutte — e la risposta va nel comando (`--demo-apps all|none|<k1,k2>`). Le app `kind: product`
viaggiano sempre.

**Governance e app sono facoltative** (31/10/2026). L'apply crea il blueprint senza la sezione `governance` e senza
le app, e alla fine — la prima volta che il blueprint arriva sul tenant, anche da una copia — chiede per ciascuna se
installarla. Dove la CLI gira senza terminale, la domanda si fa all'utente in chat: che cosa porta la governance
(modelli, regole, schede, responsabile) e quali app; la risposta va nel comando (`apply … --governance yes|no
--apps all|none|<k1,k2>`, oppure `extras --tag <TAG> --governance … --apps …` dopo). **Mai scegliere al suo posto**,
e mai `--governance yes` o `--apps` senza la sua risposta. Ciò che si installa mostra il suo piano e chiede il suo sì,
come un apply. La scelta resta nel run: un aggiornamento tiene allineata la governance accettata e non tocca quella
rifiutata; un'app si installa una volta sola e poi si aggiorna in App Builder, e alla fine di un aggiornamento si
propongono solo le app nuove. Ciò che è stato rifiutato si installa a richiesta con `extras`.

## 6-ter. Una versione nuova su un blueprint già applicato

Quando sul tenant c'è già un run **completato** dello stesso blueprint, `plan` e `apply` lo
riconoscono da soli (#1126): il piano si apre con «Aggiornamento della vN applicata», elenca solo ciò
che si crea e ciò che si aggiorna, e dice quante entità restano come sono. Non serve nessuna opzione,
e non serve niente fuori dalla CLI.

Cosa riportare all'utente prima di chiedere il sì, perché è su questo che decide:

- **che cosa si aggiorna e in che cosa** — «AgenteResume: istruzioni», «orchestratore: 9 modifiche»
  con le righe che il piano elenca. Un aggiornamento cambia una chat in uso: va detto che cosa cambia;
- **che non si cancella niente**: ciò che la versione nuova non dichiara più è un avviso `BP068` e
  resta sul tenant;
- se il piano si ferma con **`BP067`**, la modifica non si può fare sul posto (un'entità tolta a
  mano): riportare il messaggio, non cercare strade intorno;
- i **file nuovi** di un profilo già indicizzato non fermano più il piano (#1518): diventano l'operazione
  «aggiungi file e reindicizza», che li carica, li collega al profilo e indicizza solo loro. Per aggiungere
  documenti **senza una versione nuova** c'è `knowledge add <profilo> <file…> --tag <TAG>`, con lo stesso sì
  dell'apply; poi si aggiungono gli stessi file a `knowledge[].files` alla versione dopo.

Se il piano dice che **il tenant è già come la versione lo vuole**, non c'è niente da approvare e il
comando esce `0`.

**Mai aggiornare a mano** — né dall'API, né con uno script, né avviando l'API in locale: chi usa questa
skill non è necessariamente uno sviluppatore, e un aggiornamento fatto fuori dalla CLI non lascia
traccia nel run. L'API locale si usa solo se l'utente lo chiede espressamente. Se la CLI installata
non riconosce l'aggiornamento (il piano si ferma con `BP060` su entità del blueprint), è una versione
precedente a #1126: proporre `/plugin update blueprints@hevolus`.

Dopo l'esecuzione le entità passano al run nuovo: è quello da collaudare, e quello che `rollback`
smonterebbe. Il run di partenza resta come storico (`Superseded`).

## 6-bis. Portare una versione in un altro ambiente o su un altro tenant

Un manifest collaudato **non si riscrive** per applicarlo altrove: si copia. Ogni ambiente ha il
proprio archivio, e dentro l'archivio ogni tenant il suo, quindi una voce ha quattro coordinate —
ambiente, tenant, blueprint, versione.

```bash
xrcopilotlab-bp promote --tag <TAG> --version <n> \
    --from-env staging --from-company <guid-origine> \
    --to-env   prod    --to-company   <guid-destinazione>
```

Quattro cose da dire all'utente, perché sono le quattro che sorprendono:

1. **Non crea niente sul tenant.** La copia è solo in archivio: dopo servono ancora `plan` e
   `apply`, con la loro approvazione. Riferire il comando di `plan` che la CLI stampa alla fine.
2. **Ripeterlo non fa danni.** Se alla destinazione c'è già la stessa versione con lo stesso
   contenuto, non scrive niente e lo dice.
3. **Se si ferma con «contenuto diverso»**, non aggiungere `--overwrite` per sbloccare: vuol dire
   che qualcuno ha modificato il manifest per l'ambiente di destinazione, e la strada giusta è
   quasi sempre alzare `version:`.
4. **I segreti non viaggiano** — nel manifest ci sono solo i nomi. Quelli che la destinazione non
   ha, `promote` li elenca: vanno impostati con `secrets set --env <destinazione>` prima del
   `plan`.
5. **La copia è firmata e contata** (#1516): la CLI registra chi l'ha fatta, da dove a dove e
   quando, e la riga `firmata` del risultato lo dice. La firma è l'email del token con cui la persona ha
   fatto `login`, e la mette l'API: `promote` vuole una sessione sull'ambiente di origine e una su quello di
   destinazione. Il registro è ciò da cui `copies` ricava i
   blueprint più usati (§ 6-sexies).

Per rileggere un manifest archiviato — anche senza il file, anche da un altro computer — c'è
`pull --tag <TAG> [--out <file>] [--with-files]`. Due `pull` e un `diff` dicono senza
interpretazioni se due ambienti stanno eseguendo davvero lo stesso blueprint.

In **produzione** vale la solita protezione: un tenant che l'API non elenca viene rifiutato con
**3** anche come destinazione di una copia. L'archivio non è una porta di servizio.

## 6-quater. Dal tenant al manifest: leggere ciò che esiste

Quando l'ambiente c'è già — costruito a mano dall'interfaccia, o applicato da un blueprint — e serve il
suo manifest: per riusarlo su un altro cliente, per partire da un esempio che funziona invece che da
una pagina bianca, per vedere quanto del tenant un manifest sa dire (#1173).

1. **Chiedere l'ambito, prima di leggere**: un orchestratore, un topic, ciò che ha creato un blueprint
   (`blueprint <TAG>`), o il tenant intero (solo se ha un topic). E il tag del manifest.
2. **Chiedere dei dati personali**: il manifest va a un altro cliente (segnaposto, il default) o resta
   allo stesso (`--keep-people`)?
3. **Leggere**, solo letture:
   ```bash
   xrcopilotlab-bp export --scope topic "Agenda di Studio" --tag STUDIOPOLIS --env staging --company <guid> --out export-studiopolis
   ```
4. **Spiegare il rapporto** (`export-report.md`) prima del manifest: i segreti da impostare (per nome,
   `secrets.txt`), le chiavi che si rigenerano e chi fuori dalla piattaforma le usa, i requisiti della
   destinazione, ciò che il manifest non sa dire, le dipendenze entrate da sé. È lì che si capisce
   se il manifest è pronto o se va completato.
5. **Poi il percorso di sempre**: completare ciò che il rapporto chiede, `validate`, `secrets set`,
   `push`, piano, sì, apply.

Due cose da dire sempre: i nomi escono **senza** `BP-<TAG>-` e l'apply li rimette — un agente fatto a
mano diventa `BP-<TAG>-<nome>` (se non lo si vuole, aggiungere `naming: { prefix: "" }` o un prefisso
leggibile prima del primo apply); e riapplicare l'export sullo stesso tenant da cui viene **crea delle
copie**, non aggiorna le entità fatte a mano (il collegamento a entità esistenti non c'è ancora). Per
un blueprint già applicato l'aggiornamento sul posto resta la strada (§6-ter).

## 6-quinquies. Installare dal catalogo di Hevolus (la partizione `default`)

**Il catalogo è il tenant `default` di ogni ambiente**, la convenzione della webapp: un modello pubblicato non ha un
tenant suo, e ogni tenant di quell'ambiente lo vede insieme ai propri blueprint. Staging e produzione hanno ciascuno il
suo catalogo, nel proprio database. Un modello si prepara e si collauda nel catalogo di staging
(`catalog publish <file> --env staging`); portarlo in produzione vuol dire pubblicare **la stessa versione** nel
catalogo di produzione (`catalog pull <modello> --env staging --out <file>`, poi `catalog publish <file> --env prod`),
cioè copiarla nel database di produzione. Una correzione è una versione nuova che fa lo stesso giro. `promote` non
scrive nel catalogo: lo rifiuta. Chi applica un modello nel suo tenant ne riceve una copia nel proprio archivio.

**Nel catalogo c'è una versione sola per modello: l'ultima che funziona** ([`references/catalogo.md`](references/catalogo.md#una-versione-sola-per-modello-1595),
#1595). `catalog publish` toglie da sé le versioni precedenti del modello
appena la nuova è scritta, e rifiuta una versione più vecchia di quella pubblicata; quindi **si pubblica solo una
versione collaudata su staging**, perché quella che c'era esce. Prima di pubblicare, si dice all'utente quali versioni
escono (la domanda di conferma le elenca). Se nel catalogo un modello ne ha ancora più d'una — pubblicato prima della
regola — si propone `catalog prune <modello> --env <e>`: la conferma è il nome del modello, scritto dall'utente o
passato con `--confirm` **solo dopo il suo sì esplicito**, mai di propria iniziativa. `catalog install` installa
l'ultima, e non si propone `--version`: le versioni ritirate non si installano più. Se un tenant ha installato una
versione più vecchia, `catalog list --company <tenant>` lo dice, e l'aggiornamento è un nuovo `catalog install`
dell'ultima: la copia del tenant non cambia finché non lo si fa.

I modelli del catalogo sono scritti **senza persone vere**: i ruoli sono vuoti, i passi indirizzati a
una persona citano `role:<chiave>`, e dove serve un indirizzo (owner, destinatari, una casella di
ascolto, un testo) c'è un **segnaposto** — una mail finta (`…@esempio.invalid`, `…@esempio.it`) o,
nei modelli più vecchi, una di `hevolus.it`. Nessuna di queste è un utente del tenant che installa, e
il blueprint le persone le aggiunge ai ruoli, non le crea.

**Il tag della copia lo ricava la CLI** (#1427): senza `--tag` è il tag del modello più il nome del tenant
in maiuscolo senza spazi né simboli (`LEGAL` su «Pippo SRL» → `LEGALPIPPOSRL`); un aggiornamento tiene il
tag già installato. Dopo l'installazione si usa **quel** tag in `plan`, `apply` e `secrets set`, non
quello del modello. `--tag` si passa solo se l'utente ne vuole uno suo; con `BP109` (nome del tenant non
disponibile) si chiede all'utente quale tag usare.

**Prima di `catalog install` ci si ferma a chiedere, e non si sceglie al posto dell'utente:**

1. Leggere il modello (`catalog list`, `pull` dalla partizione) e **elencare all'utente** ogni indirizzo
   segnaposto e ogni ruolo con le persone che il modello gli indirizza.
2. Chiedere, **per ognuno**, con quale utente del **tenant di destinazione** sostituirlo. Non
   proporre `giuseppe.zileni@…`, l'utente della sessione o un collega «perché è lui che sta
   installando»: se l'utente non lo dice, si resta in attesa. Se serve un aiuto, mostrare gli utenti
   che il tenant ha (la CLI li elenca quando ne manca uno).
3. Chiedere anche **come si devono chiamare le entità**: con il prefisso del modello (di norma
   `BP-<TAG>-`), con uno leggibile (`--prefix "Studio · "`) o senza (`--no-prefix`). Un aggiornamento
   dell'installazione tiene quello della prima volta.
4. Lanciare l'installazione con le risposte:

   ```bash
   xrcopilotlab-bp catalog install <modello> --env <ambiente> --company <tenant> \
       [--prefix "Studio · " | --no-prefix] \
       --members "responsabile=marco@studio.it;segreteria=sara@studio.it" \
       --replace "referente@esempio.invalid=marco@studio.it;capo@hevolus.it=sara@studio.it"
   ```

5. Se la CLI si ferma con **`BP108`** (un segnaposto senza sostituto) o con **3** e «Non sono utenti
   del tenant» (una persona scelta che non c'è nel tenant): **non aggiungere `--yes` né indovinare**.
   Riportare gli indirizzi, chiedere all'utente con chi sostituirli e ripetere con `--members` /
   `--replace`. Una persona che non è utente del tenant non si crea da qui: va invitata nel prodotto,
   o si sceglie un altro utente.

Al terminale (nessun `--yes`) la CLI fa le stesse domande da sé. In nessun caso un indirizzo di
`hevolus.it` o di esempio deve arrivare, tale e quale, nell'archivio di un tenant di un cliente: una
approvazione o una mail indirizzata a una persona che non esiste non arriva a nessuno.

Come `promote`, anche l'installazione è **firmata e contata** (#1516): la riga `firmata` del
risultato va riportata, e se dice «non verificata» si ripete la regola del §6-bis — l'accesso Entra
si fa prima di installare. Un'installazione dalla webapp la firma l'utente che l'ha approvata.

**Scrivendo o correggendo un modello da pubblicare** (`catalog publish`, la partizione `default`): le
persone sono `role:<chiave>`, gli altri indirizzi sono **finti** — `<nome>@esempio.invalid` — e mai un
indirizzo di `hevolus.it` o di un cliente. `catalog publish --check` rifiuta gli indirizzi veri
(`BP101`); la sostituzione con utenti reali la fa chi installa, come sopra.

## 6-sexies. Quali blueprint si usano di più

Quando l'utente chiede «quali blueprint si usano di più», «quante volte è stato copiato», «chi l'ha
portato su quel cliente», «su quali investire»: il registro delle copie (#1516) lo dice, in sola
lettura.

```bash
xrcopilotlab-bp copies                         # tutti gli ambienti, classifica intera
xrcopilotlab-bp copies --env prod --top 10
xrcopilotlab-bp copies --tag <TAG>             # ogni copia di un blueprint: firma, origine, destinazione
xrcopilotlab-bp copies --since 2026-10-01
```

Se la domanda è **dove vive** un blueprint — «su quali tenant è installato», «quale cliente lo usa in
produzione» — le copie non bastano: un blueprint pubblicato e applicato direttamente sul tenant del
cliente non lascia una copia. Lo dice `usage` (#1665), che conta le installazioni (un run completato
sul tenant) con il nome del tenant, e mette le copie accanto:

```bash
xrcopilotlab-bp usage                          # tutti gli ambienti, un blueprint per riga
xrcopilotlab-bp usage --tag <TAG>              # tenant per tenant: copia, origine o diretta, versione, date
```

Come leggerla, e come riferirla:

1. **L'ordine è per copie applicate**: una copia che nessuno ha mai applicato è un tentativo, non un
   uso. Riportare sempre anche le copie totali e i tenant distinti accanto — la differenza fra le due
   colonne è spesso la notizia (un blueprint copiato molto e applicato poco ha un problema).
2. **Una riga è un blueprint d'origine**: staging → produzione → catalogo → clienti contano insieme.
3. **Una firma con `*` non è verificata** (nome del computer, o una copia di prima del #1516): dirlo,
   non presentarla come l'autore certo.
4. **È un'informazione dello staff.** La classifica dice dove sono finite le copie di ogni cliente:
   non va in un documento, in una guida, in una mail o in una pagina per un cliente, né nel
   marketplace pubblico. Il nome di un altro cliente non si riferisce a un cliente.

Senza `--env` legge tutti gli ambienti; se uno risulta illeggibile la CLI lo dichiara — riportarlo,
perché un ambiente mancante sembrerebbe un ambiente senza copie. Per un uso in uno script c'è
`--json`.

## 6-septies. Chi governa un blueprint: `access`, embed

**`access`** (#1518, [`manifest-reference.md`](references/manifest-reference.md#access-scope-blocco-e-owner)) è
facoltativo e dice tre cose: dove può andare il blueprint (`scope: public | staging | tenant`), se si può copiare
(`locked`) e chi lo governa (`owners`, per email). Quando proporlo, scrivendo il manifest:

- per un modello che andrà nel **catalogo ufficiale**: `scope: public`, `locked: false`, gli owner che l'utente
  indica — mai indovinati;
- per un blueprint **riservato** (un assistente interno, un ambiente che non deve uscire dal tenant):
  `scope: tenant`, `locked: true`;
- per il lavoro su staging: `scope: staging`, oppure niente, finché non serve.

Che cosa riportare quando una regola ferma un comando, invece di cercare strade intorno:

- **`BP123`** — il blueprint è bloccato: non si installa, non si promuove, non si esporta, non si pubblica, e non si
  esporta nemmeno un orchestratore, un topic o il tenant che ne contiene entità. Lo sblocca solo un owner, con una
  versione nuova;
- **`BP124`/`BP125`** — chi lancia il comando non è fra gli owner della versione in vigore: lo deve fare uno di
  loro. Gli owner si riconoscono dall'email dell'identità verificata, non da un'opzione;
- **`BP126`** — la versione nuova toglie dagli owner chi la porta: chiedere all'utente se vuole davvero cedere il
  blueprint, e solo con un sì ripetere con `--release-ownership`. Da lì non lo governa più;
- **`403 hevolus_only`** — oggi ogni operazione sui blueprint è riservata ai membri di Hevolus, anche
  l'installazione dal catalogo: un account esterno o ospite non passa, e non c'è un ruolo da chiedere.

Per i blueprint archiviati prima di `access` c'è `access migrate` (anteprima senza `--apply`, in produzione anche
`--yes`): è un'operazione del team, da non proporre a chi sta scrivendo un manifest.

**`embed`** su un agente o un orchestratore porta il suo endpoint di chat in un sito: embed pubblico, domini
autorizzati (`https://sito.it`, senza percorso), modalità d'identità. L'apply lo configura a ogni versione e stampa
l'indirizzo dell'iframe; per `identity: session` stampa anche la chiave API **una sola volta**: va riportata
all'utente perché la conservi, e non va scritta in file, manifest o messaggi. Il segreto di `jwt-hs256` e la
chiave pubblica di `jwt-rs256` si impostano dall'interfaccia. Il `rollback` toglie anche i domini autorizzati.

## 6-octies. Moduli: installare un blueprint per parti

**`modules`** ([`manifest-reference.md`](references/manifest-reference.md#modules-scenari-installabili-separatamente)) è
facoltativo. Si propone quando il cliente ha **scenari distinti** che può volere in momenti diversi (es. civile e penale
in uno studio legale): ogni modulo elenca per chiave le sue entità e i moduli che `requires`; ciò che nessun modulo
elenca — e sempre topic, tenant ed `external` — è `core`, che si installa sempre. Un blueprint con un solo scenario
non ne ha bisogno.

- Scrivendoli: un'entità sta in un modulo solo (`BP134`); se serve a più moduli va in `core`. Ogni riferimento verso
  un altro modulo vuole quel modulo in `requires` (`BP135`), e niente cicli (`BP136`). `validate` lo verifica.
- Applicando: `plan`/`apply --modules <k1,k2>`; le dipendenze entrano da sole e il piano le mostra. Senza il flag, alla
  prima installazione si installa tutto; su un tenant che ha già una parte si tengono i moduli installati e il piano
  elenca gli altri come «Non installati». Aggiungere un modulo dopo è un altro `apply --modules`: crea solo ciò che manca.
- `status` mostra versione e moduli installati; `rollback --run <id> --module <k>` smonta un modulo solo, ed è rifiutato
  (`BP138`) se un altro modulo installato ne dipende. `test run --only <modulo>` collauda un modulo.
- Riportare all'utente che la versione è del blueprint: tutti i moduli installati sono alla stessa versione.

## 7. Cancellare un blueprint

`delete --tag <TAG>` toglie dall'archivio le versioni del manifest, gli artefatti nello storage e i
run. **Non è il contrario di `apply`**: quello è `rollback`, che smonta le entità dal tenant.

Se il blueprint ha ancora entità vive il comando si ferma con **3** e dice quante. Le due strade
vanno riportate all'utente senza sceglierne una: `rollback --run <runId>` prima, oppure
`--with-entities` per smontarle nello stesso comando — che le rimuove **prima** di cancellare
l'archivio, perché l'inventario è l'unica cosa che sa come si chiamano.

Il cancello è **più duro** di quello di `apply`: `--yes` non vale, serve `--confirm <TAG>` con il
tag esatto del blueprint. Si riporta all'utente l'avviso che il comando stampa — quante entità,
quante versioni, e che non esiste un annulla — e si attende un sì che nomini quel blueprint. Un sì
detto per un altro piano, o prima che il piano esistesse, non vale qui più che altrove.

**Le copie restano nel registro** (#1516): `delete` non toglie gli eventi di copia, e il blueprint
cancellato continua a contare in `copies`. È voluto — la classifica non deve dimenticare chi ha
disinstallato — e va detto se l'utente chiede «cosa resta» dopo un `delete`.

## Codici di uscita

| Codice | Cosa fare |
|---|---|
| `0` | Procedere |
| `2` | Manifest non valido: correggerlo, non girare l'errore all'utente |
| `3` | Piano bloccato da collisioni o segreti mancanti: riportare, non forzare. In `catalog install`, anche «Non sono utenti del tenant»: chiedere all'utente con chi sostituirli (§ 6-quinquies). In produzione, anche: il tenant indicato non è di Hevolus — non cercare strade alternative |
| `4` | Esecuzione fallita: riportare lo stato, proporre `--resume` o `rollback`. Se la causa è un difetto della webapp o della libreria, segnalarlo con `report-problem --kind defect` |
| `5` | In attesa di un passo manuale |
| `6` | Manca una decisione umana. Piano non approvato: **non aggiungere `--yes` di propria iniziativa**, chiedere il sì. Tenant non scelto: riportare l'elenco dei nomi e chiedere quale |
| `8` | Serve l'accesso con l'identità: manca la sessione (lanciare `login`, vedi [«Come si entra»](#come-si-entra-login-e-nientaltro)), il token non è accettato, oppure la persona non è utente del tenant (403). **Non è un ruolo Azure mancante**: non usare `report-problem --kind access`, e non passare alla strada Azure per aggirare un 403 su un tenant |

## Cosa non fare

- Non mettere in un manifest di produzione persone o valori di collaudo, e non lasciarne in prova senza
  la loro voce in `testData`: in produzione si chiedono, ruolo per ruolo.

- Non chiamare l'API direttamente: tutto passa dalla CLI. Vale anche per le rotte `cli/*` con il token: non
  estrarre il token dalla cache e non usarlo con `curl`.
- Non scambiare un 403 con l'identità per un problema di ruoli Azure: significa «non sei utente di quel tenant».
- Non lanciare `delete` per «ripulire» di propria iniziativa, e `--confirm <TAG>` solo dopo un sì
  esplicito per quel blueprint: cancella l'archivio e, con `--with-entities`, ciò che sta sul
  tenant. Non esiste un annulla.
- Non lanciare `apply` o `pipeline` con `--yes` senza un consenso esplicito **per quel piano**. Un
  consenso dato prima, per un piano diverso, non vale. Il flag registra un'approvazione umana: se
  non c'è stata, sta registrando il falso.
- Non chiedere, ripetere o scrivere il valore di un segreto.
- Non lasciare un ruolo mancante o un difetto di webapp o libreria senza `report-problem`, e non metterci un segreto, il body di un messaggio o dati di un cliente.
- Non usare `--overwrite` di propria iniziativa: una versione pubblicata è immutabile, e alzare
  `version:` è la strada normale.
- Non promettere le due cose che restano fuori: l'ereditarietà fra blueprint (`extends`) e
  l'ingresso **push** della posta (`external` con `ingress.kind: logicapp`), che vuole una Logic App
  e un'autorizzazione umana. Tutto il resto — connessioni, server MCP, orchestratori, agent task
  schedulati con le loro code di uscita — il blueprint lo crea davvero.
