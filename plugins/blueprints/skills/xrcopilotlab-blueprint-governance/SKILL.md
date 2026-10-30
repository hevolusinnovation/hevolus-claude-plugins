---
name: xrcopilotlab-blueprint-governance
description: Analizza un blueprint XRCopilotLab e ne propone la governance — i regolamenti Hevolus che gli si adattano, le regole proprie, le schede Sistemi degli agenti, le domande per il cliente — con il perché di ogni scelta; la scrive nella sezione `governance:` del manifest solo dopo un sì, la fa applicare dalla skill `xrcopilotlab-blueprint` con l'approvazione del piano, aggiunge i casi di governance alla suite e li fa eseguire dalla skill `xrcopilotlab-blueprint-test`. Su richiesta produce il report dell'archivio di un tenant: per ogni blueprint, che cosa manca alla sua governance. Usa per «la governance del blueprint», «proponi le regole», «quali regolamenti servono», «governa questo blueprint», «che cosa manca alla governance dell'archivio». NON scrive regolamenti Hevolus, non accende mai la governance di un tenant e non promette conformità; non scrive il resto del manifest (`xrcopilotlab-blueprint`).
---

# xrcopilotlab-blueprint-governance

Un blueprint crea agenti che mandano email, chiamano webhook, usano server MCP e parlano con le persone. Decidere
che cosa governare richiede giudizio: quali azioni sono rischiose, quali regolamenti si adattano, quali valori
chiedere al cliente, come classificare ogni agente. Questa skill fa quel lavoro **in modo ripetibile**, blueprint per
blueprint, e lo porta nel manifest, dove viaggia con la versione: l'apply lo crea, il rollback lo toglie.

Input: `$ARGS` — un modo e un tag (`proponi FINBANK`), con ambiente e tenant se non sono quelli di default, oppure
**niente**. Senza modo, con un tag, vale `proponi`.

Issue: #1637 (epic #1579, ombrello #1719). Riferimento del manifest: `docs/blueprints/manifest-reference.md`
§ `governance`; del collaudo: `docs/blueprints/testing.md` § «La governance nel collaudo».

## 0. Se `$ARGS` è vuoto, o chiede aiuto

Rispondere con i modi qui sotto, che cosa serve (la CLI `xrcopilotlab-bp` del plugin *blueprints* con la lettura
dell'ambiente, il tag), che cosa produce ciascuno, e **fermarsi** chiedendo modo e tag.

| Modo | Che cosa fa | Scrive? |
|---|---|---|
| `analizza <TAG>` | la superficie di governance del manifest: uscite, tool MCP, agenti aperti alle persone, agent task da soli, skill fuori governance, la sezione `governance` se c'è | no |
| `proponi <TAG>` | `analizza` + la sezione `governance:` proposta, voce per voce con il perché, le domande al cliente, i limiti, il piano di collaudo | no |
| `scrivi <TAG>` | dopo un sì sulla proposta: la sezione nel manifest, `validate`, poi la consegna a `xrcopilotlab-blueprint` per push, piano e apply | il manifest, dopo un sì |
| `collauda <TAG>` | i casi di governance nella suite (dopo un sì), poi `xrcopilotlab-blueprint-test` | la suite, dopo un sì |
| `archivio` | il report di un tenant: ogni blueprint, la sua superficie e che cosa manca alla governance | no |

Default: **staging**, tenant di collaudo `4da69cbc-d935-4050-f410-08d8392ca08f` (si passa sempre con `--company`).

## Le regole che valgono sempre

1. **I regolamenti Hevolus non si scrivono.** Il blueprint li cita per id (`perimetro-comunicazioni`, `uscite-di-rete`,
   `riferimento-gdpr`, `riferimento-ai-act`, `riferimento-owasp`, `riferimento-soc2`, `riferimento-cis`): li scrive
   Hevolus con una revisione legale. Un regolamento che manca si chiede all'AI Team, non si inventa.
2. **La governance di un tenant non si accende da qui.** Né la skill né il blueprint la accendono mai: lo fa una
   persona da Governance › Stato. Si parte in **Osserva**, dove le regole registrano che cosa farebbero senza
   fermare niente.
3. **Evidenze, mai conformità.** Nessuna proposta, nota o scheda dice «conforme», «a norma», «certificato».
4. **Il responsabile è una persona del cliente.** In un modello del catalogo `owner` non si scrive; su un tenant del
   cliente è l'email di un suo **amministratore**, data dal cliente. Mai inventata, mai una casella Hevolus.
5. **Ogni scrittura dopo un sì**: la sezione nel manifest, la suite, il push, l'apply. Il piano lo approva una persona
   (regola 3 di `.claude/rules/blueprints.md`); `--yes` solo dopo un sì esplicito.
6. **Il manifest si parte dall'archivio** (`pull`, regola 8): mai da un file trovato su disco. Le copie di lavoro
   stanno nello scratchpad della sessione.
7. **In Osserva un «deny» non ferma niente**: l'email parte, il webhook viene chiamato. I casi che provano un
   perimetro scrivono verso **caselle e sistemi di prova**, mai verso destinatari veri.

## 1. Leggere: `analizza <TAG>`

```bash
S=<scratchpad>/governance; mkdir -p $S
xrcopilotlab-bp pull --tag <TAG> --env <env> --company <tenant> --out $S/<TAG>.yml
python3 -I <skills>/xrcopilotlab-blueprint-governance/assets/superficie.py $S/<TAG>.yml
```

Per un modello del catalogo: `xrcopilotlab-bp catalog pull <modello> --env <env> --out $S/<TAG>.yml`.

Lo script legge il manifest in sola lettura e non stampa mai istruzioni, prompt, credenziali né indirizzi completi
(delle email solo il dominio, o «ruolo …»). Il manifest intero si apre solo per le `description` degli agenti, che
servono allo scopo delle schede.

## 2. Proporre: `proponi <TAG>`

Dalla superficie alla proposta con [`references/proposta.md`](references/proposta.md): che cosa la governance vede
(e non vede), le regole di base che valgono già e non si ripetono, la tabella superficie → scelta → perché, le
differenze fra modello del catalogo e blueprint di un cliente.

La proposta si consegna in chat, in questa forma:

1. **In breve** — tre righe: che cosa fa il blueprint fuori dal tenant, che cosa si governa, che cosa resta fuori.
2. **La sezione `governance:`** in YAML, pronta, con un commento `# perché: …` su ogni voce.
3. **Le domande** (D1, D2…) — i valori che solo il cliente sa: domini ammessi, host dei suoi sistemi, chi è il
   responsabile, la classificazione `high_risk` quando la si solleva. Per un modello del catalogo le domande sono
   per l'AI Team, e i valori del cliente restano «da completare» all'installazione (`BP156`).
4. **I limiti** — le skill degli agenti oggi fuori dalla governance (#1701), le risposte in chat che non sono azioni,
   ciò che il punto di controllo non vede.
5. **Il piano di collaudo** — i casi che `collauda` aggiungerà (§5).

E chiedere: «La scrivo nel manifest?». Senza un sì ci si ferma qui.

## 3. Scrivere: `scrivi <TAG>`

Dopo il sì, sul manifest appena scaricato (`pull`, regola 6):

1. Si aggiunge la sezione `governance:` in fondo al manifest (prima di `testData`, se c'è), con le risposte alle
   domande; dove una risposta manca, la voce resta fuori e la proposta lo dice.
2. Si controlla il manifest:
   ```bash
   xrcopilotlab-bp validate $S/<TAG>.yml
   ```
   I rilievi della governance sono `BP145`–`BP157` e `BP170` (`docs/blueprints/codici.md`). Un errore si corregge
   nella sezione, non si aggira.
3. Si mostra il diff della sezione e si consegna alla skill `xrcopilotlab-blueprint`, che fa `push` della versione
   nuova, `plan` (il piano elenca regolamenti, regole, schede e la pubblicazione, e dice se la governance del tenant
   è spenta, `BP155`), chiede l'approvazione e fa `apply`. Questa skill non fa né push né apply da sola.

Dopo l'apply si dice alla persona che cosa resta a lei: indicare il responsabile nelle schede Sistemi (se il
manifest non lo porta), accendere la governance in **Osserva** da Governance › Stato, poi lanciare `collauda`.

**Un modello del catalogo** segue la stessa strada su staging, sul tenant di collaudo; la pubblicazione nel catalogo
(`catalog publish`, regola 10) la fa la skill `xrcopilotlab-blueprint`, dopo il collaudo e un sì.

## 4. Applicare

Non è un modo di questa skill: è `xrcopilotlab-blueprint` (§3.3). Si cita qui perché la proposta finisce lì, e
perché una governance scritta nel manifest e mai applicata non governa niente.

## 5. Collaudare: `collauda <TAG>`

Il collaudo ha due forme nella stessa suite (`docs/blueprints/testing.md`):

- **il caso `kind: governance`**, che `test init` aggiunge da sé quando il manifest ha la sezione: legge regole in
  vigore, regolamenti e dove valgono, schede Sistemi e fa la prova della sospensione. Non manda messaggi, quindi si
  lancia anche in produzione. Si controlla che ci siano `rulesInForce` per ogni regola del manifest,
  `rulebooks` per ogni regolamento, `systems` per ogni scheda e `suspensionTest` sugli agenti che agiscono da soli;
- **un caso agente o orchestratore per ogni regola che nega o avvisa**, con `expect.governance.decisions`
  (`operation`, `rule`, `decision`) e `waitSeconds: 30`, che fa fare all'agente l'azione vietata verso una
  **casella o un host di prova** (`prova@esempio-esterno.it`, `httpbin.org`), mai verso destinatari veri; e un caso
  con `governanceSwitch: off` e `expect.governance: { nothing: true }` per la prova che spenta non decide niente.

**Una regola che ripete un divieto delle istruzioni dell'agente non si prova in chat.** Se il prompt dice già «non
prenotare», l'agente rifiuta prima di chiamare lo strumento e il registro resta vuoto: il caso con
`expect.governance.decisions` fallisce per il comportamento corretto dell'agente (SANITA v12, 30/10/2026). La regola è
la cintura di sicurezza per quando il modello sbaglia: che sia **in vigore** lo prova il caso `kind: governance`
(`rulesInForce`), e il caso in chat si scrive come prova del **rifiuto** — `contains` sulle parole del rifiuto e
`expect.governance.notDecisions` sull'operazione — non come prova della regola. Un caso che fa scattare davvero una
regola serve un agente che quell'azione la fa: un'email, un webhook, un tool che il prompt non vieta.

Si parte dalla suite nell'archivio (`files get tests/<nome>.v<k>.tests.yml --tag <TAG> …`), altrimenti da `test init`;
si aggiungono i casi, si controlla la suite con `test validate`, si mostrano, e dopo un sì `test push`. L'esecuzione e il giudizio sono della skill `xrcopilotlab-blueprint-test`, in
**due giri**: governance in Osserva (le decisioni compaiono come «avrebbe negato», niente si ferma) e poi in Applica,
che una persona accende da Governance › Stato prima del giro e rimette com'era dopo. Fra un cambio di modo e il giro
si aspettano 30 secondi (la cache del modo). Un fallimento solo di governance ha sospetto `Governance`: di norma si
corregge la regola, non il codice.

## 6. L'archivio: `archivio`

```bash
sh <skills>/xrcopilotlab-blueprint-governance/assets/archivio.sh <env> <tenant> <scratchpad>/governance-archivio
```

Per ogni blueprint pubblicato sul tenant: ultima versione, se ha la sezione, quali uscite, quanti tool MCP scrivono,
quanti agenti sono aperti alle persone, quanti agent task agiscono da soli, e **che cosa manca** («nessuna sezione»,
«email senza perimetro», «agenti aperti alle persone senza scheda», oppure «niente da governare oltre le regole di
base»). Si consegna la tabella con, in testa, i blueprint da governare per primi: quelli con uscite verso l'esterno e
tool che scrivono, poi quelli aperti alle persone. Nessuna scrittura.

## Cosa non fare

- Non scrivere regolamenti Hevolus, né copiarne le regole come regole proprie del blueprint.
- Non accendere, spegnere o cambiare il modo della governance di un tenant, nemmeno per un collaudo: lo fa una persona.
- Non scrivere `owner` in un modello del catalogo, né un indirizzo che il cliente non ha dato.
- Non promettere conformità, in nessun testo.
- Non scrivere nel manifest, nella suite o nell'archivio senza un sì; non fare push o apply da questa skill.
- Non provare un perimetro verso destinatari o sistemi veri: in Osserva l'azione parte davvero.
- Non proporre regole per le skill degli agenti finché #1701 è aperta: si dicono fra i limiti.
