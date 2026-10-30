# Intervista — da «come lavoriamo» a un manifest

Chi conosce il processo non conosce la notazione, e non deve impararla. L'intervista serve a
raccogliere quello che sa già, in un ordine che porta a un manifest completo senza tornare indietro.

Una domanda per volta. Non chiedere ciò che puoi dedurre, non inventare ciò che non ti è stato
detto, e quando una risposta è incompleta chiedi l'esempio concreto invece della regola generale:
«l'ultima volta che è successo, chi l'ha fatto?» funziona meglio di «chi se ne occupa di solito?».

Se esiste un **dossier di assessment**, l'intervista non parte da zero: si legge il capitolo
«Elementi per il provisioning», si traduce ciò che c'è, e le domande qui sotto servono solo per i
buchi rimasti. Le più frequenti sono le email dei membri di un ruolo e le condizioni esatte dei
bivi, che nei dossier restano spesso a livello di intenzione.

## L'ordine delle domande

**0. È un'agenda personale?** Se l'utente vuole un agente che legga il suo calendario per dare gli
slot liberi, o che faccia prenotare appuntamenti sul suo Outlook, l'intervista non comincia: prima
lo si avvisa che esiste Microsoft Bookings e gli si danno i passi (`SKILL.md`, «Prima di tutto: è
un'agenda personale?»). Si riprende da qui solo se, saputo di Bookings, vuole comunque un agente.

**1. Di chi è questo processo.** Tag (cliente o contesto) e tenant. Il tag è maiuscole e cifre,
2–20 caratteri: `STUDIOPOLIS`, `LEGAL`, `MARKETING`.

Subito dopo, **come si devono chiamare le cose che il blueprint crea.** Senza scelta gli agenti, i
processi, il topic escono come `BP-STUDIOPOLIS-Agenda`: chiedere se va bene o se l'utente preferisce
un prefisso leggibile (`naming.prefix: "Polis · "` → «Polis · Agenda») o nessun prefisso
(`prefix: ""` → «Agenda»). Va deciso **ora**: dopo il primo apply il prefisso non si cambia più
(`BP111`). Senza prefisso dirlo chiaramente: un nome già usato sul tenant ferma il piano (`BP060`).

**2. Come comincia.** Cosa fa partire il lavoro — una email, una telefonata, una richiesta a voce,
una scadenza — e quali dati si conoscono in quel momento. Da qui esce il **modulo di avvio**.

**3. Chi fa cosa.** Le persone coinvolte, per ruolo e non per nome: «il referente», «l'avvocato
responsabile». Ogni ruolo diventa un `businessRole`, e servono gli indirizzi email di chi ne fa
parte. Chiedi anche **chi sostituisce chi**: nel BPM un sostituto è semplicemente un altro membro
dello stesso ruolo.

Le email dipendono dall'**ambiente**. In **produzione** si chiedono sempre, ruolo per ruolo, e devono
essere utenti di quel tenant: niente segnaposto, niente «metto me intanto». **Fuori dalla produzione**,
se la persona non le sa ancora, si può mettere un utente del tenant di prova — ma solo dichiarandolo
in `testData`, con la domanda da fare prima della produzione (§ «Dati di collaudo» della skill). Vale
lo stesso per ogni valore che la persona non ha deciso e che il collaudo richiede: una soglia, un
server MCP del tenant di prova, un indirizzo di callback che ancora non c'è.

**4. I passi, in ordine.** Per ognuno: chi lo esegue, quanto dura di solito, e cosa produce.
Distingui tre casi, perché diventano tre cose diverse:

| Come lo descrivono | Diventa |
|---|---|
| «lo fa una persona» | `Task` · `HumanOnly` con `roleName` |
| «lo prepara il sistema e poi qualcuno controlla» | `Task` · `AiAssisted` con `agentTaskName` **e** `roleName` |
| «lo fa il sistema da solo» | `Task` · `Automated` con `agentTaskName` |

**5. Dove si decide.** Ogni «dipende», «se invece», «solo quando» è un gateway esclusivo. Chiedi
**su quale dato** si decide: quel dato deve essere la chiave di un campo raccolto prima, o l'esito
di un passo automatico. E chiedi **cosa succede nell'altro caso**, perché serve il ramo di default.

**6. Cosa si compila a ogni passo umano.** Nome del campo, tipo, se è obbligatorio. Se in un passo
la persona deve *vedere* qualcosa prodotto prima, quello è un campo `context: true`, non un campo da
ricompilare.

**7. Quando qualcosa è in ritardo.** Per i passi umani: dopo quanto tempo fermo qualcuno deve essere
avvisato. Diventa `maxLeadTimeMinutes`, e l'avviso va agli `owners` del processo.

**8. Chi può avviarlo e chi lo sorveglia.** `starterRoles` e `owners`.

**9. Serve un ingresso automatico.** Se il processo deve partire da una email o da un sistema
esterno, serve `webhook: { enabled: true }`.

## Gli agenti

Per ogni passo non umano serve un agente e un agent task. Dell'agente chiedi tre cose:

- **cosa deve fare**, in una frase;
- **cosa NON deve fare** — è la parte che le persone hanno più chiara e che nessuno pensa a dire:
  «non deve calcolare i termini», «non deve dedurre i dati mancanti»;
- **cosa fa quando un dato non c'è**. La risposta giusta è quasi sempre «lo dice», mai «lo stima».

Da queste tre risposte esce il `systemMessage`. Scrivilo in italiano, all'imperativo, con il
vincolo esplicito: un prompt che dice cosa non fare produce meno sorprese di uno che elenca solo
compiti.

Se l'utente chiede una skill del catalogo (per esempio `video-gen`), verifica che esista: il
blueprint non crea skill, e `plan` fallisce se non c'è.

## Come tradurre le risposte

| Quello che dicono | Dove finisce |
|---|---|
| «arriva una mail con l'avviso» | modulo di avvio + `webhook: { enabled: true }` |
| «il referente controlla e conferma» | `Task` `HumanOnly`, `roleName: Referente`, form con un campo `bool` |
| «se non torna, si rifà» | gateway `Exclusive`, ramo con condizione e ramo di default che torna indietro |
| «di solito ci vogliono dieci minuti» | `expectedDurationMinutes: 10` |
| «se dopo un giorno nessuno l'ha preso, avvisatemi» | `maxLeadTimeMinutes: 1440` + `owners` |
| «lo vede anche il responsabile» | `owners`, non un ruolo in più |
| «solo il referente può avviarlo» | `starterRoles` |

## Prima di passare alla validazione

Rileggi con l'utente **il percorso**, non il file: «arriva l'avviso, il sistema ne estrae gli
estremi, il referente conferma, se conferma si registra, se non conferma si rifà l'estrazione».
Se il racconto suona giusto, il grafo è giusto. Se qualcuno dice «e poi c'è il caso che…», hai
trovato un ramo che mancava.
