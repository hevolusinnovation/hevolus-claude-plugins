# demo

Trasforma un blueprint **già applicato e verificato** in un video tutorial da consegnare al cliente:
una panoramica del topic, dei profili di conoscenza, degli agenti, degli orchestratori, degli agent
task e dei processi che il blueprint ha creato, con i sottotitoli che spiegano a cosa serve ciascuno.

Gira su **Claude Code**. Si installa dal catalogo:

```bash
/plugin install demo@hevolus
```

**Manuale d'uso: [docs/manuale.md](docs/manuale.md).**

## Come si incastra con gli altri due

```
assessment          blueprints                     persona            demo
proposta → dossier  dossier → manifest → apply  →  verifica       →   manifest → brief → video
```

Il plugin non registra niente e non tocca il tenant: legge il manifest, ne ricava un **brief** e lo
consegna a [`hevolusinnovation/demo-recorder-playwright`](https://github.com/hevolusinnovation/demo-recorder-playwright),
che calcola il piano del video, lo rigioca a freddo per verificarlo, registra e carica l'mp4 su Azure
Blob Storage.

Fra questo plugin e `blueprints` **non c'è nessuna dipendenza**: passa solo un file. Il motivo sta
per esteso nella skill, in breve è che le skill di `blueprints` sono una copia sincronizzata dal
repository di prodotto e non vanno modificate qui — mentre il manifest `.yml` è già un contratto
versionato che resta su disco dopo l'`apply`.

## Cosa contiene

| | |
|---|---|
| `skills/xrcopilotlab-demo-video/` | La skill: le condizioni da verificare, come si legge il manifest, come si scrivono i sottotitoli, come si lancia il workflow |
| `skills/.../references/brief-format.md` | Il formato del brief campo per campo, con quello che il generatore ne fa |
| `skills/.../references/brief.example.json` | Un brief completo, da copiare |
| `docs/manuale.md` | Il manuale per chi lo usa |

Come `assessment` e a differenza di `blueprints`, questa skill **non** ha una sorgente in un
repository di prodotto: vive qui e qui si modifica. Non va aggiunta a `sync-from-source.sh`.

## Limiti, oggi

- Il video si gira sul tenant **`hevodemo`**: il blueprint va applicato lì.
- È in **sola lettura** — nessuna chat con gli agenti, nessun processo avviato.
- Un blueprint molto grande non sta in un solo video (il piano ha un tetto di 60 passaggi): in quel
  caso si fanno due brief, uno per scenario.
