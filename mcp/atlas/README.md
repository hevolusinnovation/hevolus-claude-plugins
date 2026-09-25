# Configurazione del server MCP «atlas»

Due script equivalenti, da eseguire una volta per postazione prima di usare le skill `atlas` e
`xrcopilotlab-delivery-atlas`. Registrano il server MCP del CMS Atlas in Claude Code (HTTP con token)
e in Claude Desktop (tramite `mcp-remote`), e installano la skill `atlas` se trovano `SKILL.md`
nella stessa cartella.

**macOS / Linux**

    chmod +x setup-atlas-mcp.sh
    ./setup-atlas-mcp.sh

**Windows**

    powershell -ExecutionPolicy Bypass -File .\setup-atlas-mcp.ps1

Opzioni (bash / PowerShell): `--solo-code` / `-SoloCode`, `--solo-desktop` / `-SoloDesktop`,
`--skill <file>` / `-Skill <file>`, `--desktop-config <file>` / `-DesktopConfig <file>`,
`--url <url>` / `-Url <url>`, `--no-test` / `-NoTest`.

Il token si incolla quando lo script lo chiede (non viene mostrato) oppure si passa con la variabile
d'ambiente `ATLAS_TOKEN`. Non va mai scritto negli script, in chat o in un repository.

Cosa fanno, in ordine: controllano Claude Code e Node.js; verificano che il server accetti il token;
registrano `atlas` in Claude Code a livello utente (sostituendo una registrazione precedente);
aggiungono `atlas` alla configurazione di Claude Desktop dopo averne fatto una copia di sicurezza,
senza toccare gli altri server; installano la skill; ricordano di riavviare Claude Desktop e di
verificare con `/mcp` in Claude Code.

Requisiti: Claude Code e/o Claude Desktop, Node.js LTS (per `npx mcp-remote`), curl per il test su
macOS/Linux. Il token resta salvato in chiaro nei file di configurazione di Claude: su macOS e Linux
lo script li rende leggibili solo dal proprio utente.
