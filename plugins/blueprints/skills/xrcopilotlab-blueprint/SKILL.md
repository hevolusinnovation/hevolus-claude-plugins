---
name: xrcopilotlab-blueprint
description: Genera un manifest YAML di blueprint XRCopilotLab (topic, ruoli aziendali, agenti con system message e skill, agent task, processi BPM pubblicati con webhook) e lo applica a un tenant con la CLI `xrcopilotlab-bp`, fermandosi a mostrare il piano prima di creare qualcosa. Usa quando l'utente chiede di "creare un blueprint", "configurare un cliente o un contesto da zero", "generare lo YAML del blueprint", "provisionare agenti e processi", "applicare un blueprint", "creare un processo BPM da riga di comando", oppure nomina `xrcopilotlab-bp`. NON usare per modificare un singolo agente o processo già esistente: per quello si va dalla UI.
---

# xrcopilotlab-blueprint

Porta l'utente da «vorrei un ambiente così» a un blueprint applicato su un tenant.

Il lavoro è in due metà: **scrivere il manifest** e **applicarlo**. La seconda passa sempre dalla
CLI, mai da chiamate dirette all'API, e si ferma a chiedere il permesso prima di toccare il tenant.

Input: `$ARGS` — la descrizione del contesto da configurare, oppure il percorso di un manifest già
scritto da rivedere o applicare.

## Cosa leggere prima

| Quando | Documento |
|---|---|
| Sempre, prima di scrivere lo YAML | [`references/regole-del-grafo.md`](references/regole-del-grafo.md) — cosa il validatore accetta |
| Quando parti da zero e devi intervistare | [`references/intervista.md`](references/intervista.md) — l'ordine delle domande e come tradurre le risposte |
| Quando serve una fonte esterna che non è ancora collegata | [`references/mcp-builder.md`](references/mcp-builder.md) — il ciclo connessione → MCP → agente, verificato su VIES |
| Per il significato di un campo | [`references/manifest-reference.md`](references/manifest-reference.md) |
| Per un comando o un codice di uscita | [`references/cli-reference.md`](references/cli-reference.md) |
| Manuale d'uso del plugin | [`../../docs/manuale.md`](../../docs/manuale.md) |

Lo schema è in [`references/blueprint.v1.schema.json`](references/blueprint.v1.schema.json).
Due esempi commentati: [`references/esempio-agenda.yml`](references/esempio-agenda.yml) (scenario reale)
e [`references/esempio-minimo.yml`](references/esempio-minimo.yml) (il giro più corto).

## 1. Capire il processo

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
un allegato in un processo dichiarativo — dirlo subito: è meglio scoprirlo qui che a piano rifiutato.

Altrimenti condurre l'intervista seguendo [`references/intervista.md`](references/intervista.md):
una domanda per volta, senza chiedere ciò che si può dedurre e senza inventare ciò che non è stato
detto.

Se quello che descrivono non regge le regole del motore — un bivio senza ramo di default, due rami
paralleli che si ricongiungono, un passo automatico con un modulo da compilare — dirlo subito e
proporre la forma corretta. Scrivere uno YAML che il validatore rifiuterà fa perdere un giro a
entrambi.

## 2. Scrivere il manifest

Il file va in `blueprints/<tag-minuscolo>-<slug>.yml` dentro il progetto dell'utente; se quella
cartella non esiste, si crea.

Sei errori che si fanno se non si sta attenti:

1. **I nomi si scrivono senza prefisso.** Il planner antepone `BP-<TAG>-`. Scriverlo a mano produce
   `BP-TEST-BP-TEST-…` ed è un errore segnalato.
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

L'id dei flussi lasciarlo fuori: lo genera la CLI, e il file resta leggibile.

### Quando serve una fonte esterna che non è ancora collegata

Un agente che deve leggere da un sistema esterno ha bisogno di un **server MCP**, e la domanda da
farsi è una sola: quella fonte è **HTTP interrogabile**?

Se sì, non si scrive un servizio: si costruisce con **MCP Builder**, e il manifest lo **dichiara** —
una `connections` con provider, baseUrl e autenticazione, e un `mcpServers` con `kind: builder` e i
tool, che sono già `{nome, metodo, path}`. La CLI oggi lo verifica ma non lo crea (`BP070`):
dichiararlo serve comunque, perché il piano riporta con quali parametri esatti va fatto a mano, e
quando la milestone 2 arriverà il manifest è già pronto.

Se no — la fonte non è HTTP, richiede logica di trasformazione, o custodisce un token per ogni
entità autorizzata come LinkedIn — il server va scritto, e **non è dichiarabile**: `kind: external`
pretende l'URL di un server già ospitato, e inventarlo metterebbe nel manifest un dato falso. Si
annota nella `description` dell'agente che lo userà e finisce fra i passi manuali del piano di
attivazione.

Procedura completa, con l'errore del path duplicato che costa un 404 e le regole di prompt sui gap:
[`references/mcp-builder.md`](references/mcp-builder.md).

## 3. Validare

```bash
xrcopilotlab-bp validate blueprints/<file>.yml --graph
```

Se ci sono errori, correggerli e ripetere. **Non chiedere all'utente di interpretare i codici**: i
rilievi sono per chi scrive il file, e chi scrive il file sei tu.

Quando è pulito, mostrare all'utente il **grafo stampato** e chiedere conferma che il percorso sia
quello che intendeva. È il momento giusto per accorgersi di un ramo mancante: dopo, correggerlo
costa una versione nuova.

## 4. Segreti, se il manifest ne cita

Il valore di un segreto **non si chiede e non si maneggia**. Stampare all'utente il comando da
lanciare, con il prefisso `!` così gira nella sua shell:

```
! xrcopilotlab-bp secrets set --tag STUDIOPOLIS graph-client-secret
```

Poi verificare con `xrcopilotlab-bp secrets check blueprints/<file>.yml`.

## 5. Piano, e approvazione umana

```bash
xrcopilotlab-bp push blueprints/<file>.yml
xrcopilotlab-bp plan --tag <TAG> --company <guid>
```

Dentro il repository non serve altro: l'ambiente si deduce dal `local.settings.json` dell'Api. Fuori
dal repository, o per puntare a un ambiente diverso, si aggiunge `--env <profilo>`.

**Mostrare il piano all'utente e fermarsi.** Non «riassumere che è tutto a posto»: riportare cosa
verrà creato e il grafo del processo, perché è su quello che la persona deve decidere.

Poi **chiedere esplicitamente l'approvazione**, dicendo su quale tenant e quante entità. Finché non
arriva un sì, il lavoro è finito qui.

Cosa **non** vale come approvazione:

- un sì dato prima, per un piano diverso o per una versione precedente del manifest;
- un «vai» generico detto all'inizio della conversazione, prima che il piano esistesse;
- il fatto che il piano non abbia errori. Un piano valido è un piano che *si può* applicare, non uno
  che *si deve* applicare.

Se il piano riporta collisioni, spiegare quale nome è già occupato e le tre strade — rinominare,
cambiare tag, rimuovere l'entità esistente — senza sceglierne una.

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

## Codici di uscita

| Codice | Cosa fare |
|---|---|
| `0` | Procedere |
| `2` | Manifest non valido: correggerlo, non girare l'errore all'utente |
| `3` | Piano bloccato da collisioni o segreti mancanti: riportare, non forzare |
| `4` | Esecuzione fallita: riportare lo stato, proporre `--resume` o `rollback` |
| `5` | In attesa di un passo manuale |
| `6` | Piano valido ma non approvato. **Non aggiungere `--yes` di propria iniziativa**: chiedere il sì |

## Cosa non fare

- Non chiamare l'API direttamente: tutto passa dalla CLI.
- Non lanciare `apply` o `pipeline` con `--yes` senza un consenso esplicito **per quel piano**. Un
  consenso dato prima, per un piano diverso, non vale. Il flag registra un'approvazione umana: se
  non c'è stata, sta registrando il falso.
- Non chiedere, ripetere o scrivere il valore di un segreto.
- Non usare `--overwrite` di propria iniziativa: una versione pubblicata è immutabile, e alzare
  `version:` è la strada normale.
- Non promettere ciò che la milestone 1 non fa: connessioni, server MCP, orchestratori e risorse
  esterne si dichiarano nel manifest ma non vengono ancora creati.
