<#
.SYNOPSIS
  Configura il server MCP «atlas» (CMS Atlas Orchestratore) per Claude Code e Claude Desktop,
  prima di usare le skill atlas e xrcopilotlab-delivery-atlas.

.DESCRIPTION
  Il token si inserisce a richiesta (non viene mostrato) oppure tramite la variabile
  d'ambiente ATLAS_TOKEN. Lo script non stampa mai il token.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\setup-atlas-mcp.ps1
  .\setup-atlas-mcp.ps1 -SoloCode
  .\setup-atlas-mcp.ps1 -Skill .\SKILL.md -DesktopConfig "$env:APPDATA\Claude\claude_desktop_config.json"
#>
[CmdletBinding()]
param(
  [string]$Url = $(if ($env:ATLAS_MCP_URL) { $env:ATLAS_MCP_URL } else { 'https://ca-atlas-orch.yellowisland-21488844.italynorth.azurecontainerapps.io/api/mcp' }),
  [switch]$SoloCode,
  [switch]$SoloDesktop,
  [string]$Skill,
  [string]$DesktopConfig,
  [switch]$NoTest
)

$ErrorActionPreference = 'Stop'
function Ok($m)   { Write-Host "[OK] $m" -ForegroundColor Green }
function Info($m) { Write-Host "[..] $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[!!] $m" -ForegroundColor Yellow }
function Die($m)  { Write-Host "[XX] $m" -ForegroundColor Red; exit 1 }

$doCode    = -not $SoloDesktop
$doDesktop = -not $SoloCode
$stamp     = Get-Date -Format 'yyyyMMdd-HHmmss'

Write-Host "Configurazione del server MCP «atlas»"
Write-Host "Server: $Url`n"

# ---------------------------------------------------------------- prerequisiti
if ($doCode -and -not (Get-Command claude -ErrorAction SilentlyContinue)) {
  Warn "Claude Code (comando 'claude') non trovato: salto la configurazione di Claude Code."
  $doCode = $false
}
if ($doDesktop -and -not (Get-Command npx -ErrorAction SilentlyContinue)) {
  Warn "Node.js/npx non trovati: servono a Claude Desktop per avviare mcp-remote. Installa Node.js LTS e rilancia."
  $doDesktop = $false
}
if (-not $doCode -and -not $doDesktop) { Die "Niente da configurare: mancano sia Claude Code sia Node.js." }

# ---------------------------------------------------------------- token
$token = $env:ATLAS_TOKEN
if (-not $token) {
  $sec  = Read-Host "Incolla il token Atlas (non verrà mostrato)" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try     { $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}
$token = ($token -replace '^\s*Bearer\s+', '') -replace '\s', ''
if (-not $token) { Die "Token vuoto." }

try {
  # ------------------------------------------------------------ test del token
  if (-not $NoTest) {
    $init = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"atlas-setup","version":"1.0"}}}'
    $code = 0
    try {
      $r = Invoke-WebRequest -Method Post -Uri $Url -UseBasicParsing -TimeoutSec 20 `
             -ContentType 'application/json' -Body $init `
             -Headers @{ Authorization = "Bearer $token"; Accept = 'application/json, text/event-stream' }
      $code = [int]$r.StatusCode
    } catch {
      if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode } else { $code = 0 }
    }
    switch ($code) {
      { $_ -in 200, 202 } { Ok "Server raggiungibile e token accettato." }
      { $_ -in 401, 403 } { Die "Il server ha rifiutato il token (HTTP $code). Controlla il token e rilancia." }
      0                   { Warn "Server non raggiungibile (rete, VPN o proxy?). Proseguo comunque con la configurazione." }
      default             { Warn "Risposta inattesa dal server (HTTP $code). Proseguo; verifica poi con /mcp." }
    }
  }

  # ------------------------------------------------------------ Claude Code
  if ($doCode) {
    & claude mcp get atlas *> $null
    if ($LASTEXITCODE -eq 0) {
      Info "Server «atlas» già presente in Claude Code: lo sostituisco."
      & claude mcp remove atlas -s user *> $null
    }
    & claude mcp add --transport http --scope user atlas $Url --header "Authorization: Bearer $token" *> $null
    if ($LASTEXITCODE -eq 0) { Ok "Claude Code: server «atlas» registrato a livello utente." }
    else { Warn "Claude Code: registrazione non riuscita. Riprova con: claude mcp add --transport http --scope user atlas <url> --header `"Authorization: Bearer <token>`"" }
  }

  # ------------------------------------------------------------ Claude Desktop
  if ($doDesktop) {
    if (-not $DesktopConfig) {
      # installazione classica; per la versione Microsoft Store il file può trovarsi in
      # %LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\ (usa -DesktopConfig)
      $DesktopConfig = Join-Path $env:APPDATA 'Claude\claude_desktop_config.json'
      $store = Get-ChildItem (Join-Path $env:LOCALAPPDATA 'Packages') -Directory -Filter 'Claude_*' -ErrorAction SilentlyContinue |
               ForEach-Object { Join-Path $_.FullName 'LocalCache\Roaming\Claude\claude_desktop_config.json' } |
               Where-Object { Test-Path $_ } | Select-Object -First 1
      if ($store -and -not (Test-Path $DesktopConfig)) { $DesktopConfig = $store }
    }
    $dir = Split-Path $DesktopConfig -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }

    $cfg = [pscustomobject]@{}
    if (Test-Path $DesktopConfig) {
      $bak = "$DesktopConfig.bak-$stamp"
      Copy-Item $DesktopConfig $bak -Force
      Info "Copia di sicurezza: $bak"
      $raw = [IO.File]::ReadAllText($DesktopConfig)
      if ($raw.Trim()) {
        try { $cfg = $raw | ConvertFrom-Json }
        catch { Die "Claude Desktop: file di configurazione non valido ($($_.Exception.Message)). Il file originale è intatto." }
      }
    }
    if (-not $cfg.PSObject.Properties['mcpServers']) {
      $cfg | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{})
    }
    # su Windows Claude Desktop avvia npx tramite cmd; ${ATLAS_AUTH} lo espande mcp-remote
    $atlas = [pscustomobject]@{
      command = 'cmd'
      args    = @('/c', 'npx', '-y', 'mcp-remote', $Url, '--header', 'Authorization:${ATLAS_AUTH}')
      env     = [pscustomobject]@{ ATLAS_AUTH = "Bearer $token" }
    }
    if ($cfg.mcpServers.PSObject.Properties['atlas']) { $cfg.mcpServers.atlas = $atlas }
    else { $cfg.mcpServers | Add-Member -NotePropertyName atlas -NotePropertyValue $atlas }

    # avviso se altri server hanno chiavi in chiaro negli argomenti
    foreach ($p in $cfg.mcpServers.PSObject.Properties) {
      if ($p.Name -ne 'atlas' -and ($p.Value.args | Where-Object { "$_" -match '^(napi_|sk-|ghp_|xox[bp]-)' })) {
        Warn "Il server «$($p.Name)» ha una chiave in chiaro negli argomenti: valuta di ruotarla."
      }
    }

    $json = $cfg | ConvertTo-Json -Depth 100
    [IO.File]::WriteAllText($DesktopConfig, $json, (New-Object Text.UTF8Encoding($false)))  # UTF-8 senza BOM
    Ok "Claude Desktop: server «atlas» aggiunto a $DesktopConfig (via mcp-remote)."
  }

  # ------------------------------------------------------------ skill atlas
  if (-not $Skill) {
    $local = Join-Path $PSScriptRoot 'SKILL.md'
    if (Test-Path $local) { $Skill = $local }
  }
  if ($Skill) {
    if (-not (Test-Path $Skill)) { Die "SKILL.md non trovato: $Skill" }
    $dest = Join-Path $env:USERPROFILE '.claude\skills\atlas'
    New-Item -ItemType Directory -Force $dest | Out-Null
    $target = Join-Path $dest 'SKILL.md'
    if (Test-Path $target) { Copy-Item $target "$target.bak-$stamp" -Force }
    Copy-Item $Skill $target -Force
    Ok "Skill «atlas» installata in $target"
  } else {
    Info "Skill «atlas» non installata: metti SKILL.md accanto allo script o usa -Skill."
  }
}
finally {
  $token = $null
  Remove-Variable token -ErrorAction SilentlyContinue
}

# ---------------------------------------------------------------- riepilogo
Write-Host "`nFatto. Prossimi passi:"
if ($doCode)    { Write-Host "  - Claude Code: apri una nuova sessione e digita /mcp (il server «atlas» deve risultare connesso)." }
if ($doDesktop) { Write-Host "  - Claude Desktop: chiudi l'app del tutto (anche dall'area di notifica) e riaprila; prova con «elenca i clienti»." }
Write-Host "  - Elimina la guida o qualsiasi file che contiene il token in chiaro."
