# Avvia xrcopilotlab-bp su Windows, procurandoselo al primo uso.
#
# Gemello di bin/xrcopilotlab-bp: stesso ordine di ricerca — variabile d'ambiente, strumento
# globale .NET, cache, download dalla release — così il comportamento non dipende dal sistema.

$ErrorActionPreference = 'Stop'

$Repo    = 'hevolusinnovation/xrcopilotlab-webapp-dotnet'
$Here    = Split-Path -Parent $MyInvocation.MyCommand.Path
$Version = (Get-Content (Join-Path $Here 'version.txt')).Trim()
$CacheRoot = if ($env:CLAUDE_PLUGIN_DATA) { $env:CLAUDE_PLUGIN_DATA } else { Join-Path $HOME '.xrcopilotlab-bp\cache' }
$CacheDir  = Join-Path $CacheRoot 'bin'

function Stop-WithMessage([string]$Message) {
    [Console]::Error.WriteLine("xrcopilotlab-bp: $Message")
    exit 70
}

# 1. Un percorso imposto a mano vince su tutto.
if ($env:XRCOPILOTLAB_BP_BIN) {
    & $env:XRCOPILOTLAB_BP_BIN @args
    exit $LASTEXITCODE
}

# 2. Lo strumento globale .NET, per chi sviluppa anche sul repository.
$Tool = Join-Path $HOME '.dotnet\tools\xrcopilotlab-bp.exe'
if (Test-Path $Tool) {
    & $Tool @args
    exit $LASTEXITCODE
}

# 3. La copia già scaricata.
$Rid   = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'win-arm64' } else { 'win-x64' }
$Bin   = Join-Path $CacheDir "xrcopilotlab-bp-$Version-$Rid.exe"
$Asset = "xrcopilotlab-bp-$Rid.exe"
$Tag   = "bp-v$Version"

if (Test-Path $Bin) {
    & $Bin @args
    exit $LASTEXITCODE
}

function Get-Asset([string]$Name, [string]$Destination) {
    # Gli allegati di una release privata non si scaricano senza credenziali: si usa gh quando c'è,
    # altrimenti un token dall'ambiente.
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        gh release download $Tag --repo $Repo --pattern $Name --output $Destination --clobber
        if ($LASTEXITCODE -eq 0) { return }
    }

    $Token = if ($env:GH_TOKEN) { $env:GH_TOKEN } elseif ($env:GITHUB_TOKEN) { $env:GITHUB_TOKEN } else { $null }
    if (-not $Token) {
        Stop-WithMessage @"
per scaricare la CLI serve l'accesso a GitHub.
  · installa GitHub CLI e fai 'gh auth login', oppure
  · imposta GH_TOKEN con un token che possa leggere $Repo, oppure
  · scarica a mano $Asset dalla release $Tag e indicalo con:
      `$env:XRCOPILOTLAB_BP_BIN = 'C:\percorso\del\binario.exe'
"@
    }

    $Headers = @{ Authorization = "Bearer $Token" }
    $Release = Invoke-RestMethod -Headers $Headers -Uri "https://api.github.com/repos/$Repo/releases/tags/$Tag"
    $Item    = $Release.assets | Where-Object { $_.name -eq $Name } | Select-Object -First 1
    if (-not $Item) { Stop-WithMessage "la release $Tag non contiene l'allegato $Name." }

    $Headers['Accept'] = 'application/octet-stream'
    Invoke-WebRequest -Headers $Headers -Uri "https://api.github.com/repos/$Repo/releases/assets/$($Item.id)" -OutFile $Destination
}

# 4. Scaricare. Succede una volta per versione, e lo si annuncia.
[Console]::Error.WriteLine("Prima esecuzione: scarico la CLI ($Asset, ~52 MB) dalla release $Tag.")
New-Item -ItemType Directory -Force -Path $CacheDir | Out-Null

$Tmp = Join-Path $CacheDir ".download.$([guid]::NewGuid().ToString('N'))"
try {
    Get-Asset $Asset $Tmp

    # Verifica dell'impronta: si sta per eseguire ciò che si è appena scaricato.
    $Sha = "$Tmp.sha256"
    try { Get-Asset "$Asset.sha256" $Sha } catch { }

    if (Test-Path $Sha) {
        $Attesa   = ((Get-Content $Sha -Raw).Trim() -split '\s+')[0]
        $Ottenuta = (Get-FileHash $Tmp -Algorithm SHA256).Hash.ToLower()
        if ($Attesa.ToLower() -ne $Ottenuta) {
            Stop-WithMessage "impronta non corrispondente (attesa $Attesa, ottenuta $Ottenuta). Non eseguo il file."
        }
    } else {
        [Console]::Error.WriteLine('xrcopilotlab-bp: la release non pubblica l''impronta, download non verificato.')
    }

    Move-Item $Tmp $Bin -Force
} finally {
    if (Test-Path $Tmp) { Remove-Item $Tmp -Force -ErrorAction SilentlyContinue }
    if (Test-Path "$Tmp.sha256") { Remove-Item "$Tmp.sha256" -Force -ErrorAction SilentlyContinue }
}

[Console]::Error.WriteLine("CLI pronta in $Bin")
& $Bin @args
exit $LASTEXITCODE
