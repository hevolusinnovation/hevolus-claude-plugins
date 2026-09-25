# assessment

Traduce una proposta di progetto in una soluzione XRCopilotLab: estrae scenari e obiettivi, sceglie
fra chat con agenti orchestrati e processo BPM, verifica la fattibilità delle fonti dati e genera il
dossier tecnico in Markdown e Word — compreso il capitolo da cui nasce il blueprint di provisioning.
Produce la valutazione tecnica, non il pricing.

Dalla 0.3.0 porta una seconda skill, `xrcopilotlab-delivery-atlas`, che parte dal dossier e apre la
**delivery Atlas**: fasi, step, deliverable, rischi e dipendenze del cliente secondo il metodo Atlas,
i documenti per cliente (D2, D3 o S1, Agent Specification, eval set) nello stile dei template Atlas,
e la delivery nel CMS [delivery.hevolus.it](https://delivery.hevolus.it) tramite il server MCP «atlas»,
sempre con anteprima e conferma prima di scrivere.

Gira su **Claude Desktop**, non su Claude Code.

**Per installarlo non serve questo repository**: si scarica `Xrcopilotlab-<versione>.zip` dalla
[pagina delle release](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/latest)
e si carica su [claude.ai/customize/plugins](https://claude.ai/customize/plugins), senza aprirlo.
I passi per intero: **[§ Installare](../../docs/installare.md)**.

Da lì, in una chat di Claude Desktop, basta caricare la proposta e chiedere di valutarla: la skill
si attiva da sola, anche senza nominare XRCopilotLab.

**Manuale d'uso: [docs/manuale.md](docs/manuale.md).**

## Cosa contiene

| | |
|---|---|
| `skills/xrcopilotlab-assessment/` | La skill, con i vincoli di piattaforma, la struttura del dossier e le vie di accesso verificate alle fonti dati italiane |
| `skills/.../scripts/` e `assets/` | Il generatore Word e il template Office (font Aptos, frontespizio con segnaposto) |
| `skills/xrcopilotlab-delivery-atlas/` | La skill della delivery Atlas: metodo, mappatura dossier → Atlas, strumenti MCP del CMS e i loro limiti |
| `skills/.../assets/templates/` | I template Atlas per cliente (D2, D3, S1, O1) e la base di stile per gli artefatti senza template |
| `skills/.../scripts/` | Compilazione dei template, generatore Word in stile Atlas, scheletro dell'eval set, anteprima delle chiamate MCP |
| `docs/manuale.md` | Il manuale per chi lo usa |

A differenza di `blueprints`, queste skill non hanno una sorgente in un repository di prodotto: vivono
qui e si modificano qui. Dopo ogni modifica va **alzata la versione** in `.claude-plugin/plugin.json`
e pubblicata una release: su Desktop non ci sono aggiornamenti automatici, e il numero di versione è
l'unico segnale che chi l'ha già installata vede. Lo zip lo costruisce la CI — a mano si fa solo per
provarlo, con `./build-desktop-plugin.sh` dalla radice. Vedi
[§ Manutenzione](../../docs/manutenzione.md#pubblicare-una-release).

Il dossier che produce è la sorgente del manifest che il plugin `blueprints` applica al tenant —
per questo chiude con il capitolo «Elementi per il provisioning».
