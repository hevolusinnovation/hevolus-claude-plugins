---
name: xrcopilotlab-blueprint-version
description: È l'unica skill che pubblica le notifiche dei blueprint XRCopilotLab nei canali Teams, come Adaptive Card con un flusso Power Automate e solo dopo il sì dell'utente sull'anteprima. Due modi. `versioni` (default) — il report delle novità delle skill fra due versioni del plugin (es. dalla 2.27.0 alla 2.30.2): in testa i comandi per aggiornare da Claude Code e da Claude Desktop, poi le novità per versione, gli ultimi blueprint in produzione, il riepilogo delle feature, i link alla guida e al Blueprint Marketplace; va nel canale delle versioni. `catalogo` — i blueprint disponibili nel catalogo di produzione, uno per riga con il link alla sua scheda sul Blueprint Marketplace, la governance e le app; va nel canale del catalogo. Usa quando l'utente chiede "il report delle novità delle skill blueprint", "avvisa il team che c'è una versione nuova", "cosa è cambiato dalla 2.x alla 2.y", "messaggio di aggiornamento del plugin blueprints", "avvisa il team dei blueprint nel catalogo", "cosa c'è nel catalogo", anche se dice "la mail": le notifiche non vanno per mail. NON per le release del prodotto (xrcopilot-release-email), per le release notes (xrcopilot-release-notes), per costruire il sito (xrcopilotlab-blueprint-marketplace) né per aggiornare davvero un'installazione.
---

# xrcopilotlab-blueprint-version

Chi usa le skill dei blueprint non legge le release del catalogo: le versioni salgono quasi ogni
giorno e le novità stanno nei messaggi di commit. Questa skill le trasforma in **un messaggio nel
canale Teams del team** che si legge in due minuti e dice, nell'ordine: *come aggiorno*, *cosa è
cambiato*, *quali blueprint sono appena arrivati in produzione*, *in breve, tutto quello che c'è di
nuovo*, e *dove trovo il resto* (la guida e il Blueprint Marketplace).

Teams e non la mail: nel canale lo leggono tutti senza che nessuno debba incollare indirizzi.

**È l'unica skill che pubblica nei canali dei blueprint.** Il sito lo costruisce
`xrcopilotlab-blueprint-marketplace`, la CLI la allinea `xrcopilotlab-blueprint-sync`: nessuna delle due
pubblica card. Quando una loro PR va in `main` e porta qualcosa da annunciare (un blueprint nuovo nel catalogo,
una versione delle skill), l'annuncio si fa da qui.

| Modo | Che cosa annuncia | Canale (`teams.sh --canale`) | Modello della card |
|---|---|---|---|
| `versioni` (default) | le novità delle skill fra due versioni del plugin (§ 1–3) | `versioni` | [`references/teams-card.json`](references/teams-card.json) |
| `catalogo` | i blueprint disponibili nel catalogo di produzione, con il link alla scheda (§ 4) | `catalogo` | [`references/catalogo-card.json`](references/catalogo-card.json) |

**Pubblica nel canale solo dopo il sì dell'utente sull'anteprima. Non aggiorna nessuna installazione,
non tocca il tenant.**

## 0. Cosa serve

| | |
|---|---|
| **da** | la versione del plugin che i destinatari hanno adesso (esclusa). Se l'utente non la dice, **chiedila**: non si indovina. Dove leggerla: `/plugin` in Claude Code, oppure il nome dello zip caricato su Desktop |
| **a** | la versione di arrivo (inclusa). Vuota = l'ultima del catalogo |
| **canale** | il flusso Power Automate del canale. Ogni indirizzo porta la firma (`sig=…`) ed è un **segreto**: non sta nella skill né nel repository, ma in un file di `~/.xrcopilotlab/teams/` (permessi 600) o in una variabile d'ambiente — versioni: `blueprint-version-webhook` / `XRCOPILOTLAB_BP_TEAMS_WEBHOOK`; catalogo: `blueprint-catalog-webhook` / `XRCOPILOTLAB_BP_TEAMS_CATALOG_WEBHOOK`. Se manca, chiedi all'utente di crearlo (`umask 077`, una riga, `chmod 600`); **non scriverlo mai** in un file del repository, in un commit, in un artifact o nella risposta |

I numeri sono **tre e diversi**: *plugin* `blueprints` (quello che ci interessa, `2.x.y`), *CLI*
`xrcopilotlab-bp` (`version.txt` del plugin) e *catalogo* (`v1.x.0`, il tag della release). Nella
report il numero in primo piano è sempre quello del plugin; la CLI si cita dove cambia.

## 1. Le novità, dalla fonte

```bash
scripts/novita.sh <da> [<a>]       # dalla cartella della skill
```

Legge lo storico di `plugins/blueprints/.claude-plugin/plugin.json` nel catalogo
`hevolusinnovation/hevolus-claude-plugins` (usa il clone in `~/Hevolus/hevolus-claude-plugins`, o ne
fa uno senza blob in `$TMPDIR`) e stampa, per ogni versione nell'intervallo: data, messaggio completo
del commit, skill toccate, e la versione della CLI all'inizio e alla fine.

**Il messaggio di commit non basta sempre** (una voce come «video narrato di default, recorder 1.2.0»
dice poco). Per ogni versione con un messaggio scarno, leggi la fonte:

- `git -C <catalogo> show <sha> -- plugins/blueprints/skills` per cosa è cambiato davvero nelle skill
  (soprattutto le `description`, che dicono **quando si attiva** la skill);
- `plugins/blueprints/docs/cli.md` per i comandi nuovi della CLI;
- per una skill **nuova**, il suo `SKILL.md`.

Se una fonte non c'è (nessun `gh`, nessun clone), dillo in una riga all'utente invece di scrivere
novità a memoria. **Non inventare feature**: ogni riga del report deve poter indicare dove l'hai letta.

## 1-bis. Gli ultimi blueprint pubblicati in produzione

Dal catalogo dei modelli di produzione, la fonte unica di «che cosa c'è in produzione»:

```bash
xrcopilotlab-bp catalog list --env prod
```

Una riga per modello: id, versione, tag e data. Prendi i **pubblicati dopo il primo rilascio della
finestra** (la data del § 2.3); se sono meno di tre, gli ultimi tre per data. Per ognuno una frase su
**a che cosa serve**, presa dalla `description` del manifest (`catalog pull <id> --env prod --out
<scratchpad>`) o dalla sua scheda sul Blueprint Marketplace, mai inventata. È una lettura: non serve
nessun `--yes`, e non si scrive niente.

Se il comando non si può lanciare (nessuna CLI, nessun accesso a produzione), dillo all'utente e
lascia fuori la sezione: non la si riempie a memoria, e non si mettono blueprint di staging.

## 2. Scrivere il report

Titolo: `Blueprint: nuove versioni delle skill — dalla <da> alla <a>`. Italiano, tono da collega,
frasi corte, niente gergo di sviluppo (niente «sync», «mirror», sha). Struttura fissa, **in questo ordine**:

### 2.1 In testa — come si aggiorna

Un riquadro, prima di qualsiasi novità. Tre vie, ognuna con i suoi comandi pronti da copiare:

**Da terminale — Claude Code** (plugin `blueprints`): dentro Claude Code, nella casella dei messaggi
```
/plugin marketplace update hevolus
/plugin update blueprints@hevolus
```
poi **riavviare la sessione** (le skill si caricano all'apertura). Skill e CLI si muovono insieme; il
binario nuovo si riscarica da sé al comando successivo. Solo la CLI, da una shell normale:
`xrcopilotlab-bp update` (con `--check` dice cosa farebbe e si ferma).

**Da Claude Desktop**: il plugin `blueprints` non c'è su Desktop, ci sono le singole skill.
Scaricare gli zip `xrcopilotlab-….zip` aggiornati dalla
[pagina delle release](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/latest)
e ricaricarli in *Impostazioni → Capacità → Skill* (sostituiscono i precedenti). Il plugin
**assessment** (zip `Xrcopilotlab-….zip`) si ricarica su
[claude.ai/customize/plugins](https://claude.ai/customize/plugins). **Da Desktop si scrive, non si
applica niente al tenant**: applicare vuole la CLI, che c'è solo in Claude Code.

**Una skill da sola su Claude Code** (senza plugin): togliere la cartella vecchia e scompattare
lo zip, così non restano file che la versione nuova non ha più:
```
rm -rf ~/.claude/skills/xrcopilotlab-blueprint
unzip -o ~/Downloads/xrcopilotlab-blueprint.zip -d ~/.claude/skills
```

Una riga di avvertenza: chi è **sotto la 2.19.0** non riceve l'avviso automatico di aggiornamento e
deve fare i due comandi a mano; chi ha una **sessione aperta** deve riavviarla. Prima di scrivere
questo blocco **rileggi** il § «Aggiornare» del README del catalogo: se i comandi sono cambiati,
vince il README.

### 2.2 Il link alla guida

In fondo alla card c'è il pulsante «Guida: dall'intervista alla demo», con il link all'artifact
«Dall'intervista alla demo» (la pagina della skill `xrcopilotlab-blueprint-howto`).

1. `Artifact` con `action: "list"` e cerca il titolo «Dall'intervista alla demo». **Il link è quello
   che trovi, mai uno scritto a mano.**
2. Se non c'è, dillo all'utente e proponi di pubblicarlo con `xrcopilotlab-blueprint-howto` **prima**
   di pubblicare il report; non lasciare un segnaposto. Se l'utente preferisce non pubblicarlo, togli il
   pulsante: il link al Blueprint Marketplace resta.
3. Una pagina è **privata alla nascita**: chi legge il canale può non riuscire ad aprirla. Dillo
   all'utente e lascia a lui la scelta di condividerla; **non cambiare tu i permessi**.
4. Se il howto è indietro rispetto alle versioni del report (una tappa nuova, per esempio), segnalalo:
   l'aggiornamento della pagina è un'altra skill.

### 2.3 L'apertura — due righe ricavate dalla tabella, non improvvisate

Dopo il link alla guida e prima delle versioni: due o tre frasi che dicano in un colpo d'occhio che
cosa è successo. **Si scrive per ultima**, quando la tabella del § 2.5 è pronta, perché ogni numero
viene da lì e si verifica prima di scriverlo:

- **Plugin e CLI hanno numerazioni diverse, e l'apertura lo dice**: «il plugin blueprints dalla
  2.27.0 alla 2.39.0, la CLI `xrcopilotlab-bp`, che ha una numerazione sua, dalla 2.17.0 alla
  2.20.0». Due intervalli affiancati senza il nome di che cosa sono sembrano lo stesso conto fatto
  in due modi.
- **Le skill nuove si contano dalle etichette *Nuova skill* delle sezioni per versione**, non a
  memoria: nata dopo la versione «da» = nuova, anche se nella stessa finestra ha poi cambiato
  comportamento. E una skill nata nella finestra **non si racconta come un cambiamento** («tre video
  al posto di uno»): chi ha la versione «da» non ha mai visto la forma di prima. Si dice che cos'è
  oggi.
- **I rilasci si contano tutti, patch comprese**, oppure si scrive solo l'intervallo: «dalla 2.28.0
  alla 2.39.0», non «dodici versioni» quando i rilasci sono sedici.
- **La data è quella del primo rilascio dopo la versione «da»**, non quella della «da», che il
  lettore ha già.
- **Una feature si nomina come la nomina la sua release**, non con un'abbreviazione che la confonde
  con un'altra della stessa finestra: i server MCP Google del catalogo della piattaforma (CLI
  2.20.0) e l'accesso alla CLI con account Google (2.31.1) sono due cose.

Emersa il 14/10/2026 con la mail 2.27.0 → 2.39.0, già spedita: «tre skill nuove» (erano quattro),
«tre video al posto di uno» detto di una skill nata nella finestra, e i due intervalli affiancati
senza dire quale fosse il plugin e quale la CLI. L'apertura era stata scritta prima della tabella.

### 2.4 Le novità, per versione

Dalla più vecchia alla più nuova, **una sezione per versione** con data e un titolo che dica la cosa
(«2.29.0 — nasce la skill dello storyboard»). Sotto, due-quattro righe: che cosa **puoi fare adesso
che prima non potevi**, e **a chi serve**. Distingui con un'etichetta: *Nuova skill*, *Nuovo comando
della CLI*, *Cambia il comportamento di…*, *Correzione*. Se la CLI cambia versione, scrivilo nella
riga. Le versioni che sono solo correzioni di testo si accorpano in una riga («2.30.1, 2.30.2:
descrizioni e guida allineate»).

Quello che **cambia un comportamento esistente** o **richiede un'azione** (riavvio, ricaricare uno zip,
un comando nuovo da imparare) va in evidenza, non in coda.

### 2.5 In fondo — il riepilogo di tutte le feature

Una tabella sola, l'ultima cosa che si legge:

| Feature | Da | Cosa fa per te | Skill / comando |
|---|---|---|---|

Una riga per feature **dell'intervallo**, raggruppate per skill, senza duplicare i testi delle sezioni
sopra: qui in una frase. Nella card la tabella diventa un `FactSet` (titolo = feature, valore = cosa fa,
da quale versione, skill o comando): Teams non disegna tabelle.

### 2.6 Il Blueprint Marketplace

L'ultima riga e il primo pulsante della card portano al **Blueprint Marketplace**,
<https://yellow-river-0ad4d3203.6.azurestaticapps.net/>, dove stanno schede, guide, processi e video
di ogni blueprint: «Tutte le informazioni sui blueprint sono sul Blueprint Marketplace». È già nel
modello della card; non toglierlo.

## 3. Consegna, nel canale Teams

1. Mostra all'utente **titolo, riquadro d'aggiornamento, apertura, blueprint di produzione e
   riepilogo** nella risposta, e chiedi se va bene.
2. Parti da [`references/teams-card.json`](references/teams-card.json): è una Adaptive Card 1.4 già
   impaginata (intestazione, riquadro d'aggiornamento, una scheda per versione, blueprint di
   produzione, feature, link al Marketplace, pulsanti). Sostituisci i segnaposto in doppie graffe e
   **ripeti l'elemento d'esempio** dove ce n'è uno solo: il `Container` della versione (uno per
   versione), il fatto del `FactSet` dei blueprint (uno per blueprint), quello delle feature (uno per
   feature). Non rifare la grafica. I comandi stanno in `TextBlock` con `fontType: Monospace`, una
   riga vuota fra un comando e l'altro (Teams unisce le righe singole). Scrivi la card nello scratchpad.
3. Controlla la card, senza inviare:
   ```bash
   scripts/teams.sh --check <scratchpad>/card.json
   ```
   Fallisce se il JSON non è valido, se restano segnaposto `{{…}}` o se supera il limite di Teams
   (~28 KB): in quel caso accorcia le sezioni per versione, non togliere i comandi d'aggiornamento.
4. **Solo dopo un sì esplicito dell'utente sull'anteprima** pubblica:
   ```bash
   scripts/teams.sh --send <scratchpad>/card.json --canale versioni
   ```
   Un «mandala» detto prima di aver visto l'anteprima non vale: prima la si mostra. Una sola
   pubblicazione: se va a buon fine non si ripete, e per correggere un errore si pubblica un messaggio
   di rettifica breve, non il report di nuovo.
5. Se `--send` fallisce (indirizzo mancante, HTTP diverso da 200/202, rete), riporta l'errore così com'è
   e lascia all'utente il percorso della card e un testo Markdown dello stesso report da incollare a
   mano nel canale. Non provare altre strade (la mail, un altro canale) senza chiederlo.

## 4. Modo `catalogo` — i blueprint disponibili

Annuncia nel canale del catalogo **che cosa si può installare oggi**, con il link alla scheda di ognuno sul
Blueprint Marketplace. Si usa dopo che un modello è entrato o cambiato nel catalogo di produzione **e** la sua
scheda è online (PR del sito in `main`, deploy riuscito): un link a una scheda che dice ancora la versione di prima
manda il collega nel posto sbagliato.

1. **Il catalogo, dalla fonte**: `xrcopilotlab-bp catalog list --env prod` (una lettura). Solo produzione: i modelli
   di staging non si annunciano.
2. **Il sito, per i link e i fatti**: l'indice pubblico
   `https://yellow-river-0ad4d3203.6.azurestaticapps.net/schede/indice.json` dà per ogni tag il nome, la frase,
   `governance` (`manifest` → «governato», `suggeriti` → «regolamenti suggeriti», `base` → «regole di base») e
   `apps[]`. Il link è `https://yellow-river-0ad4d3203.6.azurestaticapps.net/catalogo/<TAG>`. Un modello del
   catalogo senza scheda pubblica si dice all'utente e resta fuori dalla card: non si linka una pagina che non c'è.
   La versione nella scheda (`/schede/<TAG>.json`, `origine.versione`) deve essere quella del catalogo; se non lo è,
   la scheda è indietro: lo si dice e si aspetta il sito.
3. **Una riga per blueprint**, ordinati per data di pubblicazione, il più recente in alto. `NOVITA` = che cosa è
   cambiato con questa versione in una frase («ora governato: GDPR e OWASP, 13 schede dei sistemi», «nuovo nel
   catalogo»), oppure «nessuna novità da …» con la data; `IN_UNA_FRASE` = la frase della scheda; `APP` = i titoli
   delle app o «nessuna». Si ripete il `Container` d'esempio, uno per blueprint. L'apertura dice quanti sono e quali
   sono cambiati, contati dalle righe.
4. Consegna come al § 3, con il canale giusto:
   ```bash
   scripts/teams.sh --check <scratchpad>/catalogo.json
   scripts/teams.sh --send  <scratchpad>/catalogo.json --canale catalogo     # solo dopo il sì sull'anteprima
   ```

Niente tenant, id, email o nomi di clienti: il catalogo è fatto di modelli, e la card li descrive come tali.

## Cosa non fare

- Non scrivere novità che il § 1 non ha trovato; non dedurre una feature dal solo titolo di un commit.
- Non mettere sha, nomi di branch, numeri di PR, né i nomi di persone del cliente nel report, e mai l'indirizzo del flusso Teams.
- Non mescolare i tre numeri di versione: plugin in primo piano, CLI e catalogo solo dove servono,
  e sempre con il nome accanto all'intervallo.
- Non scrivere l'apertura prima delle sezioni per versione: i suoi numeri si ricavano da lì (§ 2.3).
- Non scrivere un link all'artifact a memoria, né fingere che sia pubblico.
- Non lanciare tu `/plugin update` o `xrcopilotlab-bp update` «per provare»: sono comandi del
  collega, sul suo computer.
- Non usare questa skill per l'annuncio di una release del **prodotto** (è `xrcopilot-release-email`).
- Non mandare una card nel canale sbagliato: le versioni delle skill vanno in `versioni`, il catalogo in `catalogo`.
- Non mandare le notifiche per mail, neanche se la richiesta dice «la mail».
