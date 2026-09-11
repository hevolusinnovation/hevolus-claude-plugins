# assessment

Traduce una proposta di progetto in una soluzione di agenti orchestrati su XRCopilotLab: estrae
scenari e obiettivi, progetta l'orchestrazione, verifica la fattibilità delle fonti dati e genera
il dossier tecnico in Markdown e Word. Produce la valutazione tecnica, non il pricing.

Gira su **Claude Desktop**, non su Claude Code: si installa caricando il pacchetto su
[claude.ai/customize/plugins](https://claude.ai/customize/plugins). Lo zip si costruisce dalla radice
del repository con `./build-desktop-plugin.sh`.

**Manuale d'uso: [docs/manuale.md](docs/manuale.md).**

```bash
./build-desktop-plugin.sh          # → dist/Xrcopilotlab-<versione>.zip
```

Poi si carica lo zip su [claude.ai/customize/plugins](https://claude.ai/customize/plugins) e si
conferma dall'anteprima. Da lì, in una chat di Claude Desktop, basta caricare la proposta e chiedere
di valutarla: la skill si attiva da sola, anche senza nominare XRCopilotLab.

## Cosa contiene

| | |
|---|---|
| `skills/xrcopilotlab-assessment/` | La skill, con i vincoli di piattaforma, la struttura del dossier e le vie di accesso verificate alle fonti dati italiane |
| `skills/.../scripts/` e `assets/` | Il generatore Word e il template Office (font Aptos, frontespizio con segnaposto) |
| `docs/manuale.md` | Il manuale per chi lo usa |

A differenza di `blueprints`, questa skill non ha una sorgente in un repository di prodotto: vive
qui e si modifica qui. Dopo ogni modifica va **alzata la versione** in
`.claude-plugin/plugin.json` e ricostruito lo zip: è l'unico segnale che chi l'ha già installata
vede.

Il dossier che produce è la sorgente del manifest che il plugin `blueprints` applica al tenant —
per questo chiude con il capitolo «Elementi per il provisioning».
