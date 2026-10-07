# Avvia xrcopilotlab-demo su Windows, procurandoselo al primo uso (gemello di `xrcopilotlab-demo`).
$ErrorActionPreference = 'Stop'

$RepoCatalogo = 'hevolusinnovation/hevolus-claude-plugins'
$RepoBanco = 'hevolusinnovation/demo-recorder-playwright'
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Version = (Get-Content (Join-Path $Here 'demo-version.txt') -Raw).Trim()
$Base = if ($env:CLAUDE_PLUGIN_DATA) { $env:CLAUDE_PLUGIN_DATA } else { Join-Path $HOME '.xrcopilotlab-demo\cache' }
$CacheDir = Join-Path $Base 'demo'

function Run($dir) {
  & (Join-Path $dir 'runtime\node.exe') (Join-Path $dir 'app\bin\xrcopilotlab-demo.mjs') @args
  exit $LASTEXITCODE
}

if ($env:XRCOPILOTLAB_DEMO_DIR) { Run $env:XRCOPILOTLAB_DEMO_DIR @args }

$Rid = if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq 'Arm64') { 'win-arm64' } else { 'win-x64' }
$Dir = Join-Path $CacheDir "$Version-$Rid"

if (Test-Path (Join-Path $Dir 'runtime\node.exe')) { Run $Dir @args }

$Asset = "xrcopilotlab-demo-$Rid.zip"
$Tag = "demo-v$Version"

function Scarica($nome, $destinazione) {
  foreach ($repo in @($RepoCatalogo, $RepoBanco)) {
    if (Get-Command gh -ErrorAction SilentlyContinue) {
      gh auth status *> $null
      if ($LASTEXITCODE -eq 0) {
        gh release download $Tag --repo $repo --pattern $nome --output $destinazione --clobber *> $null
        if ($LASTEXITCODE -eq 0 -and (Test-Path $destinazione)) { return $true }
      }
    }
  }
  return $false
}

Write-Host "Prima esecuzione: scarico xrcopilotlab-demo ($Asset, ~45 MB) dalla release $Tag." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $CacheDir | Out-Null
$Zip = Join-Path $CacheDir ".download-$Rid.zip"
$Sha = "$Zip.sha256"

if (-not (Scarica $Asset $Zip)) {
  Write-Error "xrcopilotlab-demo: non sono riuscito a scaricare $Asset (release $Tag). Serve 'gh auth login' con accesso al catalogo; oppure estrai il pacchetto a mano e imposta XRCOPILOTLAB_DEMO_DIR."
  exit 70
}

if (Scarica "$Asset.sha256" $Sha) {
  $Attesa = ((Get-Content $Sha -Raw).Trim() -split '\s+')[0].ToLower()
  $Ottenuta = (Get-FileHash $Zip -Algorithm SHA256).Hash.ToLower()
  if ($Attesa -ne $Ottenuta) { Write-Error "xrcopilotlab-demo: impronta non corrispondente. Non eseguo il file."; exit 70 }
} else {
  Write-Host 'xrcopilotlab-demo: la release non pubblica l''impronta, download non verificato.' -ForegroundColor Yellow
}

$Parziale = "$Dir.parziale"
if (Test-Path $Parziale) { Remove-Item -Recurse -Force $Parziale }
Expand-Archive -Path $Zip -DestinationPath $Parziale
Move-Item $Parziale $Dir
Remove-Item -Force $Zip, $Sha -ErrorAction SilentlyContinue

Run $Dir @args
