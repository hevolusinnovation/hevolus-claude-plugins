# XRCopilotLab Assessment — manuale

Traduce una proposta di progetto in una soluzione di agenti orchestrati su XRCopilotLab e ne
valuta la fattibilità tecnica. L'output è il **dossier tecnico**: il documento che l'ingegnere
porta all'incontro con il cliente e passa a chi prepara la quotazione.

Non produce offerte, non contiene prezzi e non argomenta la vendita. Il confine è netto: noi
diciamo se si può fare, con che componenti e con che effort tecnico; quanto costa lo decide chi
cura l'offerta.

## Come si attiva

Non serve nominarla. Carica o cita la proposta in chat e chiedi una di queste cose:

- «valutami questa proposta», «fammi l'assessment»;
- «come la implementiamo?», «traducila in architettura»;
- «è fattibile? stimane la fattibilità»;
- «mappala su agenti e MCP» — anche senza scrivere XRCopilotLab.

Per esserne certi: «usa la skill xrcopilotlab-assessment su questo documento».

## Cosa portare in chat

- **La proposta** (PDF o Word: il testo viene estratto). Con mail e verbali degli incontri, se ci
  sono: servono a capire cosa il cliente *vuole ottenere*, che spesso non coincide con come la
  proposta è scritta.
- **Quello che sai dei sistemi del cliente**: gestionali, ERP, CRM, e-commerce, dove stanno i
  documenti. Senza questo, ogni fonte finisce fra i punti in sospeso.
- **Il vincolo di contesto, se c'è**: un requisito Difesa, un dato che non può uscire, una
  scadenza. Cambia gli esiti di fattibilità.

Non servono ipotesi su come risolvere: le fa la skill, rispettando i vincoli di piattaforma.

## Le fasi

1. **Estrai scenari e obiettivi** — cosa il cliente vuole ottenere, citando il testo della
   proposta. Output: scenari con obiettivi e output attesi.
2. **Progetta la soluzione** — prima il modello di erogazione: **chat con agenti orchestrati** se
   il cliente descrive una domanda e una risposta, **processo BPM** se descrive chi fa cosa e in
   che ordine. Poi gli agenti, con bozza di system prompt e MCP collegato, e — per un processo —
   attività, corsie, modalità di ogni passo e moduli. Include sempre la verifica di cosa la
   piattaforma fa già nativamente, e se convenga impacchettare lo scenario come skill riusabile.
3. **Discovery di fattibilità** — per ogni fonte: domande al cliente, verifiche tecniche
   (endpoint, auth, permessi, rate limit), un test eseguibile ed esito 🟢 GO / 🟡 CONDIZIONALE /
   🔴 NO-GO con il fallback. Senza test eseguito l'esito resta CONDIZIONALE.
4. **Punti in sospeso** (obbligatorio) — tutto ciò che il sales non ha chiarito diventa una
   domanda aperta, non un'ipotesi inventata.
5. **Dossier** — struttura a 9 sezioni, salvata in Markdown e generata in Word.
6. **Elementi per il provisioning** — il capitolo da cui nasce il blueprint: tag, topic, ruoli,
   agenti, agent task, processo, segreti citati per nome, passi manuali residui.

## Dall'assessment alla configurazione del tenant

I due plugin sono i due tempi dello stesso lavoro:

```
Claude Desktop + plugin assessment          Claude Code + plugin blueprints
  proposta del cliente                         dossier dell'assessment
        ↓                                              ↓
  dossier .md/.docx           ──────────▶       manifest .yml
                                                       ↓
                                          xrcopilotlab-bp: piano → conferma → tenant configurato
```

Per questo il dossier chiude con il capitolo **«Elementi per il provisioning»**: chi configura
l'ambiente parte da lì e non deve tornare a chiedere corsie, moduli o condizioni. Un capitolo vago
si paga due volte — la prima quando qualcuno reinventa il disegno, la seconda quando il tenant non
corrisponde a quanto promesso.

I **segreti si citano per nome, mai per valore**: nel manifest sono riferimenti a una chiave di
configurazione, e la password vera non entra in un documento né in una chat.

## I vincoli di piattaforma

- un agente ha **un solo MCP** collegato; due fonti = due agenti coordinati. È una **convenzione
  nostra**, non un limite della piattaforma: si raccomanda, non si dichiara come impossibile;
- l'**Orchestratore non ha system prompt**: è coordinamento di piattaforma, non un agente;
- il **modulo Processi (BPM) richiede la licenza `XRCopilotLab.Process`**, ed è la prima cosa da
  verificare prima di proporlo;
- il **BPM non ha timer né scadenze che agiscono da sole**, i gateway paralleli non riconvergono,
  gli agenti non leggono gli allegati e i file che producono non rientrano nel flusso: tutto ciò
  che serve oltre questo è **da costruire e da stimare**, mai da dare per fatto;
- **Q&A sui documenti = RAG nativo, zero MCP**: mai un «MCP file-server». I documenti si caricano
  manualmente nella knowledge; la sync automatica CMS→RAG è l'unico componente extra, fuori dal
  perimetro base;
- ciò che è **nativo si configura, non si sviluppa** (widget, dashboard, knowledge graph,
  scheduling, utenti e accessi);
- un **MCP prende solo URL e credenziali**, nessuna logica di dominio.

## Generare il Word

```
python scripts/md_to_docx_template.py dossier.md dossier.docx \
  --template assets/template.docx \
  --title "Assessment tecnico — <Cliente>" \
  --subtitle "Dalla proposta alla soluzione ad agenti XRCopilotLab" \
  --year "Settembre 2026"
```

Richiede `python-docx`. Se il cliente ha un proprio template Office, passalo con `--template`.
Per un output fortemente personalizzato nei colori e nel layout si usa la skill `docx`.

## Prima di consegnare

1. Converti il Word in PDF e **guarda le pagine**: una tabella che sfora il margine va riscritta
   in prosa.
2. Cerca nel testo nomi di tecnologie interne e prodotti inesistenti: devono comparire solo agenti
   XRCopilotLab e MCP server.
3. Verifica che nessun componente nativo sia marcato «da sviluppare».
4. Controlla che nessun agente abbia due MCP e che l'Orchestratore non abbia una bozza di prompt.
5. Se il dossier propone un processo BPM: la licenza è verificata, e nessuno dei limiti noti
   (timer, join, allegati letti dagli agenti, file di ritorno, avvio schedulato) è dato per
   risolto senza un componente e una stima.
6. Il capitolo «Elementi per il provisioning» c'è ed è abbastanza preciso da scriverci un manifest.
7. Nessun valore di password, chiave o token compare nel documento.
8. Verifica che ogni componente «da costruire» abbia un test di fattibilità nella discovery.
9. Rileggi i punti in sospeso: se il capitolo è vuoto, probabilmente hai colmato dei buchi con
   ipotesi inventate.

## Dall'assessment alla delivery Atlas

Il dossier dice **cosa** costruire e se è fattibile; la seconda skill del plugin,
`xrcopilotlab-delivery-atlas`, dice **come lo si consegna** con il metodo Atlas e mette la delivery
nell'orchestratore, il CMS [delivery.hevolus.it](https://delivery.hevolus.it).

**Come si attiva.** Frasi come «apri la delivery Atlas per Molino Verdi», «prepara SOW e documenti
per il secondo agente di Studio Ferri», «carica il cliente sul CMS», «trasforma l'assessment in
delivery». Se c'è solo la proposta, la skill esegue prima l'assessment.

**Cosa fa, in ordine:**

1. legge il dossier (o lo produce) e, se il server è collegato, il CMS in sola lettura: clienti e
   delivery esistenti, per non creare doppioni;
2. scrive `piano-delivery.json`: scenari → processi candidati, fonti GO/COND/NO-GO → readiness, agenti
   → registro, punti in sospeso → azioni del cliente o rischi, taglia S/M/L per processo;
3. propone il **tipo** — programma con Fase 1 discovery, workshop o diretta, oppure SOW in continuità
   o stand-alone — e lo fa confermare;
4. genera i documenti per cliente **nello stile dei template Atlas**: D2 o la sintesi del workshop,
   la readiness, D3 o S1 con gli importi lasciati al Calculator, la Agent Specification per agente,
   lo scheletro dell'eval set;
5. mostra l'**anteprima** delle chiamate MCP e scrive sul CMS solo dopo un sì: cliente, delivery,
   stakeholder noti, rischi, azioni, documenti. Non spunta step, non chiude, non invia minute.

**Il server MCP «atlas».** Su Claude Desktop si aggiunge come connettore personalizzato, in Claude Code
con `claude mcp add --transport http --scope user atlas <url>/api/mcp --header "Authorization: Bearer …"`.
Il token è una credenziale personale: non va in un documento, in una chat né in questo repository.
Senza server la skill arriva fino all'anteprima e si ferma.

**Limiti del server oggi**, che la skill gestisce da sé: non c'è uno strumento per la scheda Agenti
né per caricare file (i documenti diventano un'azione «caricare nel CMS», o un link se lo si
fornisce), e il piano non si modifica dopo la creazione. La specifica proposta dei due strumenti
mancanti è in `skills/xrcopilotlab-delivery-atlas/references/mcp-atlas.md`.

## Guida di team

Il capitolo esteso di questa procedura, con gli esempi di linguaggio da evitare e il percorso
completo fino alla configurazione del tenant, sta nella guida di team
«Dall'assessment alla configurazione di XRCopilotLab».
