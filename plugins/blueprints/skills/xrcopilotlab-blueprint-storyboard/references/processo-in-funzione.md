# Il processo in funzione, ruolo per ruolo

**Terzo dei tre video narrati** (`03-processo-in-funzione.mp4`). Il primo racconta come si costruisce e il
secondo come si usa; questo fa vedere **un caso che gira davvero**, dall'arrivo alla chiusura, passando per **ogni ruolo**
con la sua schermata e la sua istanza, perché il cliente si riconosca nel proprio. Così fa il video del
processo «quote»: prima come si costruisce, poi il processo funzionante ruolo per ruolo.

È la sola parte della skill che **fa lavorare il tenant**: apre un'istanza, esegue gli agenti (token) e
completa compiti a nome di persone. Per questo ha un piano, un sì e una pulizia.

## Che cosa serve

| | |
|---|---|
| **Un caso di esempio** | Anonimo, scritto per il video, **con un titolo riconoscibile** («Pratica di prova — udienza 12/11»), mai un fascicolo vero. Il materiale d'ingresso (la mail, l'avviso) lo scrive la skill e lo mostra all'utente |
| **Un utente per ruolo** | Ogni `businessRoles[].key` che compare in una scena ha un utente di prova **già membro di quel ruolo**, con la sua sessione (`xrcopilotlab-demo login --as <ruolo>`). Un solo utente membro di tutti i ruoli mostra le schermate ma non l'identificazione: si accetta solo se l'utente lo sceglie, dichiarandolo |
| **Effetti esterni spenti** | Le mail in uscita, le scritture su calendari e registri **veri** non partono: caselle e calendari di prova, o passi `email` rimossi dalla copia di prova. Il piano dice per ciascuno che cosa fa |
| **Tenant** | Quello del video (staging, company dichiarata): non il tenant di un cliente in produzione |

## Ricavare le scene dal manifest

Si legge il processo scelto (`processes[].spec`) e si fa un elenco, **in ordine di flusso**:

1. **Chi** fa ogni attività: agente (lavora da solo) o persona (compito assegnato a un ruolo).
2. **Dove la persona decide**: le attività umane (qui: verifica del referente, presa visione, conferma
   del professionista) sono le scene dei ruoli. Quelle dell'agente si mostrano nell'istanza (passo
   eseguito, esito), non con una schermata di lavoro.
3. **I rami**: un caso felice e, se il manifest lo prevede, un ramo di eccezione (chiarimenti, rinvio).
   Un caso solo, scelto bene, vale più di tutti i rami a velocità doppia.

**Prima di scegliere ruoli, utenti e caselle si legge l'ultimo manifest dall'archivio, in ogni ambiente e tenant**
([`SKILL.md` §1-bis](../SKILL.md)). Per Studio Polis la v40 (08/10/2026) sta sul tenant «STUDIO POLIS» in
produzione, la v37 su staging, e **a parte `companyId`, i membri dei ruoli e il commento di una correzione di
prompt i due manifest sono uguali** (verificato con `diff`, 08/10/2026): processi, ruoli e assistenti sono gli
stessi. Il video 3 si gira quindi **su staging**: i ruoli hanno un solo membro, l'utente di prova, e nessuna
persona dello Studio riceve compiti o avvisi. In produzione i ruoli includono persone vere: lì non si registra.

**Gli effetti esterni sono veri anche su staging** (verificato l'08/10/2026): il `tokenUrl` del manifest punta al
tenant `ec9b1ca0-…`, che è **polisavvocati.com** (ricerca pubblica sul dominio; Hevolus è `45bb21a6-…`), e le
caselle sono `agenda.civile@` e `agenda.penale@polisavvocati.com`, con Calendars.ReadWrite, Mail.ReadWrite e
**Mail.Send**. La v37 applicata su staging scrive quindi sul calendario vero del cliente, e il passo
«Registra sul calendario comune» lo fa davvero. **Un'istanza non si avvia su quella configurazione.**

**La variante di collaudo su staging** è la strada (a) già scritta nel manifest: stessa versione, cambiano **solo**
`tokenUrl` (tenant Hevolus `45bb21a6-…`), le due `mailbox` (`test@hevolus.it`), `dominioInterno` (`hevolus.it`) e
il numero di versione. Si ricava da `pull` con cinque sostituzioni e si valida (`xrcopilotlab-bp validate`: stessa
validità e stessi avvisi della v37). Si applica sul posto a staging dopo il piano e il sì, e **dopo il video si
riapplica la versione con le caselle del cliente** (o si lascia la variante, se staging deve restare sulle caselle
di prova). Non si pubblica come blueprint a parte: un altro tag ricreerebbe 112 entità e consumerebbe licenze
(`BP071`). Resta da verificare, alla prima prova, che l'app registrata abbia accesso a `test@hevolus.it`.

Per **Studio Polis** il processo di partenza è «Presa in carico di una comunicazione (civile)»
(`presa-in-carico-civile`): arriva la comunicazione, l'agente la classifica ed estrae gli estremi, il
**referente civile** verifica, si assegna al professionista, si registra sul calendario comune, il
**professionista** conferma, la pratica si chiude. I ruoli sono quelli del manifest (referente civile,
referente penale, responsabile agenda): in video compare **il ruolo**, non il nome della persona.

Ogni scena ruolo ha sempre: **chi sono** (nome del ruolo, a voce), **che cosa trovo nella mia casella**
(il compito con il titolo del caso), **che cosa decido**, **che cosa succede dopo** (l'istanza che
avanza). L'identificazione è questa: stesso caso, vista da chi lo ha in mano.

## La regia

Una sessione di browser per ruolo, il caso è lo stesso in tutte:

```
 avvio ─► [agente: classifica, estrae]   istanza: vista del processo, passo evidenziato
       ─► [Referente civile]  verifica → conferma    sessione del referente
       ─► [agente: assegna, registra]                 istanza
       ─► [Professionista]    conferma               sessione del professionista
       ─► chiusura                                    istanza: «Pratica chiusa»
```

Si torna alla **vista dell'istanza** fra un ruolo e l'altro: è il filo che tiene insieme il video e mostra
«a che punto è». Il montaggio è quello di `video-narrato.md` (un file a sé) (voce neurale, un blocco per scena).

## Passi

1. **Scegliere processo e caso.** Il processo principale del manifest; il caso lo scrive la skill, l'utente
   lo approva (nessun nome vero, nessun numero di ruolo reale).
2. **Piano di esecuzione.** Elenco: tenant e company, processo, **gli utenti per ruolo**, le azioni in
   scrittura (avvia istanza, prendi in carico, completa con questi valori), gli **effetti esterni** e come
   sono spenti, i token stimati. Si mostra e si **attende il sì**.
3. **Registrare.** `xrcopilotlab-demo record --plan piano.json --env <amb>`, con un passo `as: <ruolo>`
   che cambia sessione. Dipende dal supporto del banco alle azioni in scrittura e al cambio di ruolo
   (vedi sotto): finché non c'è, la scena resta un **piano scritto**, non un video, e lo si dichiara.
4. **Controllare l'istanza.** A fine registrazione si legge lo stato dell'istanza: completata, nessun passo
   in errore. Un'istanza bloccata si **registra di nuovo**, non si monta «per farla sembrare finita».
5. **Voce e montaggio.** Come negli altri due video; battute brevi e nel **linguaggio del cliente**, non dei
   motori («arriva una comunicazione», non «parte il webhook»).
6. **Pulizia.** L'istanza e i compiti restano sul tenant: si propone di cancellarli, e si cancella solo con
   il sì. Se il caso è rimasto aperto in un ruolo, non lo si lascia in una casella vera.

## Controlli bloccanti

1. L'istanza **finisce** davvero (stato completato) e ogni ruolo ha la sua scena con il **suo** utente.
2. **Riservatezza**: nelle schermate non compaiono nomi di altri clienti, il nome dell'utente che registra
   né altri fascicoli (le liste mostrano tutto il tenant): si oscura o si filtra, come in `video-narrato.md`.
3. **Nessun effetto esterno reale** partito: controllare la casella/il calendario di prova.
4. **Nessuna promessa**: il video mostra ciò che ha fatto l'istanza registrata. Se una decisione è
   dell'AI e non della persona, il manifest non la fa passare per umana, e viceversa.
5. **Il caso è anonimo** e lo dice chi lo guarda, non una didascalia.

## Come si avvia e si lavora un'istanza nell'interfaccia (verificato in sola lettura, staging, 08/10/2026)

Letto dal codice (`Pages/ProcessInstances.razor`, `Components/Process/StartInstanceDialog.razor`,
`Pages/MyTasks.razor`, `Components/Process/WorkItemPanel.razor`) e provato dal vivo fino alla finestra, **senza
avviare niente** (finestra annullata prima di scegliere il processo). Interfaccia in italiano (`uiLanguage: "it"`).

| Passo | Dove e come |
|---|---|
| Aprire l'elenco | link di menu `/process-instances` («Istanze di processo»); si naviga col link, mai `goto` |
| Nuova istanza | pulsante **«Nuova istanza»**; si apre una finestra con titolo «Nuova istanza» |
| Scegliere il processo | il menu a tendina «Processo» della finestra, con filtro: si scrive «Presa in carico» e restano le due voci `BP-STUDIOPOLIS-Presa in carico di una comunicazione (civile)` e `(penale)`. L'elenco comprende anche i processi di **altri progetti** (BP-AIACTGOV, BP-HEVREF…): oscurare |
| Titolo (facoltativo) | campo «Titolo» (`Name="instanceTitle"`, max `ProcessInstance.MaxTitleLength`): è il nome riconoscibile del caso nelle liste, da usare nel video («Pratica di prova — udienza 12/11») |
| Campi iniziali | il modulo del nodo Start (`SchemaForm`), solo se il processo ne ha; «Avvia» resta disabilitato finché il modulo non è valido |
| Avviare | pulsante **«Avvia»** (`start-instance-button`); notifica «Istanza avviata: <id>» |
| Le attività | link di menu `/my-tasks` («Le mie attività»): griglia con Attività, Processo, Stato (Aperto / Preso in carico / Completato / Annullato) |
| Prendere in carico | pulsante **«Prendi»** sulla riga (icona `pan_tool`); poi **«Apri»** (`open_in_new`) → `/work-items/<id>` |
| Compilare e completare | il modulo del compito in `WorkItemPanel`; pulsante **«Completa»** (icona `check`), abilitato quando il modulo è valido; si torna a `/my-tasks` |
| Vedere l'istanza | da `/process-instances` si sceglie il processo e si preme «Apri» sulla riga → `/process-instances/<id>` |

La pagina **Processi** (`/processes`) non ha un pulsante di avvio: porta solo i permessi di avvio e il webhook.
Non si avvia da lì.

Le liste di staging contengono già compiti di collaudi precedenti (10 righe in «Le mie attività» il 08/10): la
macro cerca il compito **per titolo del caso**, non il primo della griglia.

## Le macro del banco (scritte l'08/10/2026, **non ancora provate dal vivo**)

`demo-recorder-playwright` ha ora, oltre a `askAgent`, due macro per questo video. Come le macro di creazione
scrivono sul tenant e non si rigiocano a freddo; si validano con `xrcopilotlab-demo validate --plan`.

```json
{ "action": "startInstance", "scene": "R1",
  "process": "Presa in carico di una comunicazione (civile)",
  "title": "Pratica di prova — udienza 12/11",
  "narrate": "Arriva una comunicazione: la pratica parte." }
{ "action": "completeWorkItem", "scene": "R2",
  "activity": "Verifica del referente", "instanceTitle": "Pratica di prova — udienza 12/11",
  "fields": [ { "label": "Estremi proposti", "value": "…" } ],
  "maxWaitMs": 240000, "narrate": "Il referente civile controlla gli estremi proposti." }
```

- `startInstance`: Istanze di processo → «Nuova istanza» → processo (filtro) → titolo del caso → campi iniziali per
  etichetta → «Avvia», e attende la notifica «Istanza avviata».
- `completeWorkItem`: Le mie attività → aspetta che compaia il compito **di quell'attività e di quel titolo** (si
  aggiorna la griglia: prima possono girare passi di agente) → «Prendi» se serve → «Apri» → campi per etichetta →
  «Completa». Un campo di sola lettura non si compila.
- **Ancora da fare**: la prova dal vivo (sbaglierà dove i selettori della griglia o del modulo non sono come
  letti dal codice), il **cambio di sessione per ruolo** (`as: <ruolo>`, oggi c'è una sola sessione: va bene su
  staging dove i ruoli hanno un solo membro), la lettura dello stato finale dell'istanza e la verifica di
  **quale calendario** raggiunge il passo «Registra sul calendario comune» su staging.

## Cosa non fare

- Non usare dati o fascicoli veri, nemmeno «anonimizzati a mano» a metà.
- Non avviare l'istanza prima del sì sul piano, né con effetti esterni accesi.
- Non mostrare un ruolo con l'utente di un altro senza dirlo.
- Non tagliare i tempi di attesa dell'agente fino a far sembrare istantaneo ciò che non lo è: si
  accorcia con un fermo immagine dichiarato dalla voce («qualche istante dopo»), mai nascondendolo.
- Non lasciare compiti aperti nelle caselle dopo la registrazione.
