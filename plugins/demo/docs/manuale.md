# Manuale — il video tutorial di un blueprint

Serve a una cosa sola: hai configurato un cliente su XRCopilotLab con un blueprint, hai controllato
che sia venuto bene, e adesso vuoi mandargli un video che gli faccia vedere cosa ha.

## Cosa ti serve prima di cominciare

| | |
|---|---|
| Il manifest | `blueprints/<tag>-<slug>.yml`, quello che hai applicato |
| Il blueprint applicato **su hevodemo** | il video si gira lì: se hai applicato altrove, il filmato riprenderebbe uno spazio vuoto |
| Una verifica tua | il brief nasce dal manifest, cioè da quello che il blueprint *voleva* creare. Se l'`apply` è andato a metà, il video cerca roba che non c'è |
| `gh` autenticato | serve a scrivere il brief nel repository del demo-recorder e a lanciare il workflow |

Non ti serve: clonare il demo-recorder, avere .NET, avere Playwright, avere una chiave Anthropic.
Tutto quello che gira, gira in CI.

## Come si usa

In una chat di Claude Code, dove hai il manifest:

> «Fammi il video del blueprint STUDIOPOLIS»

Da lì la skill:

1. **Ti fa due domande**: è stato applicato su hevodemo? l'hai guardato? Se rispondi di no a una
   delle due, si ferma — ed è giusto così.
2. **Legge il manifest** e ne tira fuori l'elenco di quello che c'è da mostrare: topic, profili di
   conoscenza, agenti, orchestratori, agent task, processi.
3. **Ti propone i sottotitoli.** È la parte che conta: le descrizioni del manifest sono scritte per
   chi configura («agente con skill legal-research collegato al profilo contabilita»), quelle del
   video sono per il cliente («risponde sulle udienze in calendario e prepara il riepilogo della
   settimana»). Le riscrive e te le mostra: correggile, sono le frasi che il cliente leggerà.
4. **Ti chiede quali agenti approfondire.** Uno o due: sono quelli di cui il video apre la scheda
   invece di limitarsi a nominarli.
5. **Scrive il brief** in `demo-xrcopilotlab/briefs/<tag>.json` nel repository del demo-recorder, e
   te lo dice prima di farlo — quel file contiene i nomi e le frasi del tuo cliente.
6. **Lancia il workflow** e ti dà il link del run.

A fine run, nel riepilogo del run trovi il video: `demo-xrcopilotlab-blueprint-<n>-<sha>.mp4`.

## Quanto ci mette

Una decina di minuti, quasi tutti spesi dalla CI a compilare l'app e ad accendere il browser. Il
video dura in genere fra tre e cinque minuti, a seconda di quanto è grande il blueprint.

## Cosa fa vedere il video

In quest'ordine: il topic con dentro i profili di conoscenza e gli agenti, la scheda di uno o due
agenti, gli orchestratori con il flusso di uno di loro, gli agent task, i processi. Ogni passaggio ha
il suo sottotitolo, e la ricerca viene usata a schermo per trovare le cose — così il cliente impara
anche dove stanno.

Davanti c'è il logo XR Copilot per due secondi, poi la dissolvenza sulla demo.

Quello che **non** fa vedere: nessuna chat con un agente, nessun processo avviato. Il video non
scrive niente sul tenant. È una scelta: una risposta di un agente ci mette un tempo imprevedibile e
dice ogni volta una cosa diversa — non è materiale da tutorial registrato.

## Quando qualcosa non va

| Cosa vedi | Cosa è successo |
|---|---|
| Il run fallisce dicendo che non trova un elemento per nome | sul tenant quell'entità non c'è o si chiama diversamente. Ricontrolla con `xrcopilotlab-bp status --run <runId>` |
| «Brief non valido» con il nome di un campo | il brief ha un campo sbagliato: la skill lo corregge e rilancia |
| «non sta in 60 step» | il blueprint è troppo grande per un video solo: si fanno due brief, uno per scenario |
| Il video mostra nomi tipo «New Agent test» | sono i nomi sul tenant. Il video li riprende e basta: si cambiano nel manifest e si riapplica |

Se il run fallisce **dopo** aver detto «piano confermato», il problema è nella registrazione, non nel
brief: è roba da segnalare nel repository del demo-recorder.

## Se il cliente non deve stare in quel repository

Il brief viene committato in `demo-recorder-playwright`. Se i nomi e le descrizioni di quel cliente
non possono starci, il video si fa in locale: serve un clone del demo-recorder, .NET 10, `az login` e
le credenziali demo. Le istruzioni sono nel `CLAUDE.md` di quel repository, sezione sul demo
XRCopilotLab.
