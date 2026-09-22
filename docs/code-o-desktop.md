# Claude Code o Claude Desktop

Ogni plugin di questo repository gira su **una** delle due superfici, e non è una preferenza: è una
conseguenza di cosa la skill deve poter toccare. «Superficie» non vuol dire «due programmi da
installare»: sono due schede della stessa app Claude, Chat e Code — chi deve solo usarle parta da
[§ Installare](installare.md#unapp-sola-due-schede). Questa pagina dice come si decide, dove la
decisione è scritta e cosa succede da sola una volta presa.

## Le due superfici, e cosa cambia davvero

| | **Claude Code** | **Claude Desktop** |
|---|---|---|
| Dov'è | la scheda **Code** dell'app Claude, dentro una cartella di lavoro — o un terminale, per chi sviluppa | la scheda **Chat** della stessa app, con i file caricati nella conversazione |
| Può eseguire comandi | **sì** — `bin/` finisce nel PATH | **no**: non c'è nessun terminale |
| Vede i file del progetto | **sì**, li legge e li scrive | solo quelli caricati in chat, e quelli che produce |
| Come si installa | dal catalogo: `/plugin install` | caricando uno **zip** su claude.ai |
| Si aggiorna | da sé, dal repository | riscaricando e ricaricando lo zip |
| Può portare `bin/`, `hooks/`, `commands/`, `agents/` | sì | **no**: non avrebbero dove girare |

La riga che decide quasi sempre è la seconda. Una skill che deve **applicare** qualcosa a un tenant
— cioè lanciare `xrcopilotlab-bp` — su Desktop non ha come farlo: non le manca un permesso, le manca
il terminale.

## Come si decide, in tre domande

1. **Deve eseguire un comando o uno strumento a riga di comando?** Sì → **Code**. È il caso di
   `blueprints`: senza `xrcopilotlab-bp` non c'è né piano né apply né collaudo.
2. **Deve leggere o scrivere i file di un progetto sul disco?** Sì → **Code**.
3. **Lavora su un documento che l'utente carica in chat, e produce documenti?** Sì → **Desktop**. È
   il caso di `assessment`: la proposta del cliente arriva come PDF o Word in conversazione, e ne
   esce un dossier.

Se rispondi sì alla 1 o alla 2 **e** alla 3, la skill è di Code: Claude Code sa fare anche il resto,
mentre Desktop non sa fare le prime due. Se non rispondi sì a nessuna, è di Desktop, perché è lì che
sta la maggior parte dei colleghi e non richiede di installare nient'altro.

## Dov'è scritta la decisione

In un file solo, alla radice: **`superfici.json`**. Chi lo legge sa in cinque secondi cosa gira dove.

```json
{
  "blueprints": {
    "superficie": "code",
    "distribuzione": "marketplace"
  },
  "assessment": {
    "superficie": "desktop",
    "distribuzione": "zip",
    "nomeNelPacchetto": "xrcopilotlab"
  }
}
```

| Campo | Cosa dice |
|---|---|
| `superficie` | `code` o `desktop`: dove il plugin gira |
| `distribuzione` | `marketplace` per chi gira su Code, `zip` per chi gira su Desktop — discende dalla superficie, ed è scritto perché si legga senza saperlo a memoria |
| `nomeNelPacchetto` | solo per `desktop`: il nome con cui il plugin appare nell'app, che non deve per forza essere il nome della cartella |

## Cosa discende dalla superficie, senza che nessuno se ne occupi

| | `superficie: code` | `superficie: desktop` |
|---|---|---|
| Compare in `.claude-plugin/marketplace.json` | **sì, obbligatorio** | **no, mai** |
| Pacchetto da costruire | nessuno: si installa dal repository | `./build-desktop-plugin.sh` → lo zip |
| Versione | dev'essere la stessa in `plugin.json` e nel catalogo | solo in `plugin.json` |
| Contenuto ammesso | `skills/`, `bin/`, `hooks/`, `commands/`, `agents/`, `docs/` | **solo** `skills/` e `docs/` |

Il catalogo lo legge **soltanto Claude Code**. Elencarci un plugin Desktop non lo renderebbe
installabile lì dove serve: lo renderebbe installabile dove non serve, e chi lo installasse si
troverebbe una skill che non ha come lavorare.

## La regola è verificata, non ricordata

```bash
./verifica-superfici.sh        # su Windows: .\verifica-superfici.ps1
```

Controlla che il repository dica la stessa cosa in tutti i punti in cui lo dice: ogni cartella sotto
`plugins/` dichiarata, ogni dichiarazione con la sua cartella, i plugin `code` nel catalogo con la
versione allineata, i plugin `desktop` fuori dal catalogo e senza cartelle che su Desktop non
avrebbero senso, ogni skill con il suo `SKILL.md`.

Gira anche in CI a ogni push e a ogni pull request (`.github/workflows/controlli.yml`), insieme alla
costruzione dei pacchetti: se la separazione si rompe, si rompe la build, non l'installazione di un
collega.

## La stessa skill su tutte e due?

Si può, ed è quello che succede oggi in una forma minore: le due skill dei blueprint vengono
pubblicate **anche** come skill singole caricabili su claude.ai, per chi vuole leggerne le regole e
scrivere un manifest in chat. Ma restano skill di Code, e la differenza va detta a chi le usa così:
fuori da Claude Code sanno **spiegare e scrivere**, non **applicare**.

La regola per non prendersi in giro: una skill si pubblica su una superficie solo se **tutto** quello
che la sua descrizione promette funziona lì. Se metà dei suoi comandi non può girare, non è la
stessa skill con meno funzioni — è una skill che fallisce a metà lavoro, dopo che qualcuno ci ha
contato.

## Aggiungere un plugin

1. la cartella sotto `plugins/`, con `.claude-plugin/plugin.json` e almeno una skill;
2. la voce in `superfici.json`, che è il passo che decide tutto il resto;
3. se è `code`, la voce in `.claude-plugin/marketplace.json` con la stessa versione;
4. `./verifica-superfici.sh`, che dice se qualcosa non torna prima che lo dica a qualcun altro.

Il dettaglio dei passi, compresa la sincronizzazione delle skill dal repository di prodotto:
[§ Manutenzione](manutenzione.md).
