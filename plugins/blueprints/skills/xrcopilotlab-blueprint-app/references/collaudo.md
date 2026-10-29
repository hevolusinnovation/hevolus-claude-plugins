# Collaudo dell'app (passo 9)

Che l'app compili non dice che parli al blueprint. Il collaudo verifica sei cose, dalla più economica
alla più costosa, e si ferma alla prima che fallisce. Oggi si fa a mano (il verbo `app test` è la fase 4
della #1566): si dichiara sempre quali livelli sono stati fatti e quali no.

| # | Livello | Che cosa | Come, oggi | Scrive sul tenant |
|---|---|---|---|---|
| 1 | Regole statiche | nessuna chiamata a XRCopilot da `client/` (né `xrcopilot`, né l'host di APIM, né `localhost:9000`); nessun segreto; `server/xrcopilot.ts` e `.env.example` intatti; nessuna dipendenza nuova in `package.json`; le rotte del brief ci sono | grep sui file dell'app (export o `/_runner/file`) | no |
| 2 | Relay | ogni chiamata del BFF passa le regole del relay: niente `DELETE`/`PUT`/`PATCH`, niente `delete`/`purge`/`/save`/`remove` nel percorso, `{companyId}` come segmento | lettura di `server/` | no |
| 3 | Build | `npm run build` senza errori; log del dev server e del BFF puliti | nel container | no |
| 4 | Contratti | ogni integrazione della mappa provata con i dati di `testData`: risposta dell'agente, variabili tipizzate dell'orchestratore, `instanceId` dal webhook del processo; con i tempi, confrontati con 60 s | dall'app, sull'Api locale o di staging | **sì**: chat e istanze vere |
| 5 | Richiamate | `/api/callbacks/*` con il segreto giusto, sbagliato, e un doppione | solo a progetto pubblicato | no |
| 6 | Smoke | le rotte `/api/*` rispondono sul preview, o sull'export avviato in locale | browser | dipende dalle rotte |

## Prima del livello 4: chiedere

I contratti scrivono sul tenant: ogni chat consuma token, ogni avvio di processo crea un'istanza che
l'operatore vede nell'Hub. Si mostra all'utente che cosa verrà chiamato (tenant, entità, quante volte,
quali aprono istanze) e si aspetta un sì. Dopo, le istanze di prova si chiudono con
`xrcopilotlab-bp instances cancel` (memoria: mai un comando distruttivo come prova; qui è pulizia di ciò
che il collaudo ha creato, e anche quella si chiede).

## La scena 3D

Il rendering non si giudica in automatico:

- **build**: il bundle principale non contiene Babylon (la scena è un chunk a parte, caricato con
  `import()`); lo si vede dai nomi dei chunk di `vite build`;
- **screenshot headless** della scena per ciascun ruolo (Chrome con `--use-angle=swiftshader`), nessun
  errore in console; lo screenshot va nel report e **una persona lo guarda**;
- **ogni oggetto della tabella del brief** si prova: passaggio (tooltip), tocco (azione nel pannello),
  esito nella scena; e lo stesso comando dal pannello 2D.

## Il report

Va nell'archivio del blueprint, come un collaudo del blueprint (regola 8): una cartella con
`report.md` (livelli fatti, esiti, tempi, screenshot) e, se ci sono, gli id delle istanze aperte.

```bash
xrcopilotlab-bp files put <scratchpad>/app-report --kind report --tag <TAG> --env <env> --company <tenant>
```

Mai un id di tenant o una chiave nel report oltre a quelli che il report di un collaudo già porta.
