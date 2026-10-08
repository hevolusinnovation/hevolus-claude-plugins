---
name: xrcopilotlab-blueprint-version
description: Scrive la mail che annuncia ai colleghi le novità delle skill dei blueprint XRCopilotLab fra due versioni del plugin (es. dalla 2.27.0 alla 2.30.2). In testa i comandi per aggiornare, sia da terminale (Claude Code) sia da Claude Desktop; poi il link all'artifact «Dall'intervista alla demo» (la guida d'uso, della skill xrcopilotlab-blueprint-howto); le novità raccontate per versione; in fondo il riepilogo di tutte le feature. Lascia una bozza in Outlook (o un .eml), mai inviata. Usa quando l'utente chiede "la mail delle novità delle skill blueprint", "avvisa il team che c'è una versione nuova", "cosa è cambiato dalla 2.x alla 2.y", "mail di aggiornamento del plugin blueprints". NON per le release del prodotto (xrcopilot-release-email), per le release notes (xrcopilot-release-notes) né per aggiornare davvero un'installazione.
---

# xrcopilotlab-blueprint-version

Chi usa le skill dei blueprint non legge le release del catalogo: le versioni salgono quasi ogni
giorno e le novità stanno nei messaggi di commit. Questa skill le trasforma in **una mail** che si
legge in due minuti e dice, nell'ordine: *come aggiorno*, *dove trovo la guida*, *cosa è cambiato*,
*in breve, tutto quello che c'è di nuovo*.

**Scrive una bozza. Non invia, non aggiorna nessuna installazione, non tocca il tenant.**

## 0. Cosa serve

| | |
|---|---|
| **da** | la versione del plugin che i destinatari hanno adesso (esclusa). Se l'utente non la dice, **chiedila**: non si indovina. Dove leggerla: `/plugin` in Claude Code, oppure il nome dello zip caricato su Desktop |
| **a** | la versione di arrivo (inclusa). Vuota = l'ultima del catalogo |
| **destinatari** | chiedili; senza un indirizzo la mail resta una bozza senza «A:». Non dedurli |

I numeri sono **tre e diversi**: *plugin* `blueprints` (quello che ci interessa, `2.x.y`), *CLI*
`xrcopilotlab-bp` (`version.txt` del plugin) e *catalogo* (`v1.x.0`, il tag della release). Nella
mail il numero in primo piano è sempre quello del plugin; la CLI si cita dove cambia.

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
novità a memoria. **Non inventare feature**: ogni riga della mail deve poter indicare dove l'hai letta.

## 2. Scrivere la mail

Oggetto: `Blueprint: nuove versioni delle skill — dalla <da> alla <a>`. Italiano, tono da collega,
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

Subito dopo il riquadro: «**La guida d'uso, dall'installazione alla demo:**» con il link all'artifact
«Dall'intervista alla demo» (la pagina della skill `xrcopilotlab-blueprint-howto`).

1. `Artifact` con `action: "list"` e cerca il titolo «Dall'intervista alla demo». **Il link è quello
   che trovi, mai uno scritto a mano.**
2. Se non c'è, dillo all'utente e proponi di pubblicarlo con `xrcopilotlab-blueprint-howto` **prima**
   di chiudere la mail; non lasciare un segnaposto.
3. Una pagina è **privata alla nascita**: chi riceve la mail può non riuscire ad aprirla. Dillo
   all'utente e lascia a lui la scelta di condividerla; **non cambiare tu i permessi**.
4. Se il howto è indietro rispetto alle versioni della mail (una tappa nuova, per esempio), segnalalo:
   l'aggiornamento della pagina è un'altra skill.

### 2.3 Le novità, per versione

Dalla più vecchia alla più nuova, **una sezione per versione** con data e un titolo che dica la cosa
(«2.29.0 — nasce la skill dello storyboard»). Sotto, due-quattro righe: che cosa **puoi fare adesso
che prima non potevi**, e **a chi serve**. Distingui con un'etichetta: *Nuova skill*, *Nuovo comando
della CLI*, *Cambia il comportamento di…*, *Correzione*. Se la CLI cambia versione, scrivilo nella
riga. Le versioni che sono solo correzioni di testo si accorpano in una riga («2.30.1, 2.30.2:
descrizioni e guida allineate»).

Quello che **cambia un comportamento esistente** o **richiede un'azione** (riavvio, ricaricare uno zip,
un comando nuovo da imparare) va in evidenza, non in coda.

### 2.4 In fondo — il riepilogo di tutte le feature

Una tabella sola, l'ultima cosa che si legge:

| Feature | Da | Cosa fa per te | Skill / comando |
|---|---|---|---|

Una riga per feature **dell'intervallo**, raggruppate per skill, senza duplicare i testi delle sezioni
sopra: qui in una frase. Chiudi con una riga: «Dubbi? Ripassa dalla guida: <link>».

## 3. Consegna

1. Mostra all'utente **oggetto, riquadro d'aggiornamento e riepilogo** nella risposta, e chiedi se va
   bene prima di creare la bozza.
2. Parti da [`references/mail-template.html`](references/mail-template.html): è già impaginato (intestazione viola, riquadri d'aggiornamento, pulsante verso la guida, versioni a schede, tabella finale). Si sostituiscono i segnaposto in doppie graffe e si ripetono i blocchi fra `<!--VERSIONI-->` e `<!--RIGHE-->`; non si rifà la grafica. Regole: stili **inline**, colonna da ~640 px, nessuna immagine esterna, i comandi in blocchi
   a larghezza fissa (su Outlook i `<pre>` perdono il formato: usa `<div>` con `font-family:Consolas,monospace`).
3. Se c'è il connettore Microsoft 365: `outlook_create_draft` con il corpo HTML. Altrimenti scrivi un
   `.eml` e un `.html` di anteprima nello scratchpad e dai il percorso.
4. **Mai `outlook_send_*`**, nemmeno se l'utente dice «mandala»: prima gli si fa vedere la bozza,
   poi invia lui, o lo chiede esplicitamente dopo averla vista.

## Cosa non fare

- Non scrivere novità che il § 1 non ha trovato; non dedurre una feature dal solo titolo di un commit.
- Non mettere sha, nomi di branch, numeri di PR, né i nomi di persone del cliente nella mail.
- Non mescolare i tre numeri di versione: plugin in primo piano, CLI e catalogo solo dove servono.
- Non scrivere un link all'artifact a memoria, né fingere che sia pubblico.
- Non lanciare tu `/plugin update` o `xrcopilotlab-bp update` «per provare»: sono comandi del
  collega, sul suo computer.
- Non usare questa skill per l'annuncio di una release del **prodotto** (è `xrcopilot-release-email`).
