# Avvia xrcopilotlab-bp su Windows, procurandoselo al primo uso.
#
# Gemello di bin/xrcopilotlab-bp: stesso ordine di ricerca — variabile d'ambiente, strumento
# globale .NET, cache, download dalla release — così il comportamento non dipende dal sistema.

$ErrorActionPreference = 'Stop'

# Due repository, in quest'ordine: il binario nasce da una release del prodotto e viene
# rispecchiato sul catalogo, che è l'unico a cui chi installa il plugin ha di sicuro accesso.
$RepoCatalogo = 'hevolusinnovation/hevolus-claude-plugins'
$RepoProdotto = 'hevolusinnovation/xrcopilotlab-webapp-dotnet'
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

# Vero se la prima versione è almeno pari alla seconda, confrontando i campi come numeri.
function Test-Aggiornato([string]$Trovata, [string]$Attesa) {
    try {
        return ([version]$Trovata) -ge ([version]$Attesa)
    } catch {
        return $false
    }
}

# 2. Lo strumento globale .NET, per chi sviluppa anche sul repository — ma solo se non è più
#    vecchio della versione che il plugin si aspetta. Prima vinceva sempre, ed era la trappola che
#    costava di più: una CLI installata a mano mesi prima continuava a essere usata anche dopo un
#    aggiornamento del plugin. Chi vuole imporre la propria build usa XRCOPILOTLAB_BP_BIN.
$Tool = Join-Path $HOME '.dotnet\tools\xrcopilotlab-bp.exe'
if (Test-Path $Tool) {
    $Riga = (& $Tool version 2>$null | Select-String -Pattern '^xrcopilotlab-bp (\d[\d.]*)' | Select-Object -First 1)
    $ToolVersion = if ($Riga) { $Riga.Matches[0].Groups[1].Value } else { $null }

    if ($ToolVersion -and (Test-Aggiornato $ToolVersion $Version)) {
        & $Tool @args
        exit $LASTEXITCODE
    }

    $Quale = if ($ToolVersion) { $ToolVersion } else { "più vecchio di 'version'" }
    [Console]::Error.WriteLine("xrcopilotlab-bp: ignoro lo strumento globale ($Quale), il plugin chiede la $Version. Per imporlo: `$env:XRCOPILOTLAB_BP_BIN = '$Tool'")
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

function Try-Repo([string]$Repo, [string]$Name, [string]$Destination) {
    # Vero se l'allegato è arrivato da questo repository, per una delle due strade.
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        gh release download $Tag --repo $Repo --pattern $Name --output $Destination --clobber 2>$null
        if ($LASTEXITCODE -eq 0) { return $true }
    }

    $Token = if ($env:GH_TOKEN) { $env:GH_TOKEN } elseif ($env:GITHUB_TOKEN) { $env:GITHUB_TOKEN } else { $null }
    if (-not $Token) { return $false }

    try {
        $Headers = @{ Authorization = "Bearer $Token" }
        $Release = Invoke-RestMethod -Headers $Headers -Uri "https://api.github.com/repos/$Repo/releases/tags/$Tag"
        $Item    = $Release.assets | Where-Object { $_.name -eq $Name } | Select-Object -First 1
        if (-not $Item) { return $false }

        $Headers['Accept'] = 'application/octet-stream'
        Invoke-WebRequest -Headers $Headers -Uri "https://api.github.com/repos/$Repo/releases/assets/$($Item.id)" -OutFile $Destination
        return $true
    } catch {
        return $false
    }
}

function Get-Asset([string]$Name, [string]$Destination) {
    foreach ($Repo in @($RepoCatalogo, $RepoProdotto)) {
        if (Try-Repo $Repo $Name $Destination) { return }
    }

    Stop-WithMessage @"
non sono riuscito a scaricare $Name (release $Tag).

  Le cause sono tre, e il rimedio è diverso:
  · non sei autenticato su GitHub  -> 'gh auth login', oppure imposta GH_TOKEN;
  · lo sei, ma quell'account non legge $RepoCatalogo
    -> chiedi l'accesso a chi mantiene il catalogo: riprovare non serve;
  · la release non ha l'allegato per questa piattaforma ($Rid)
    -> fatti passare il binario e indicalo con:
        `$env:XRCOPILOTLAB_BP_BIN = 'C:\percorso\del\binario.exe'
"@
}

# 4. Scaricare. Succede una volta per versione, e lo si annuncia.
[Console]::Error.WriteLine("Prima esecuzione: scarico la CLI ($Asset, ~52 MB) dalla release $Tag.")
New-Item -ItemType Directory -Force -Path $CacheDir | Out-Null

$Tmp = Join-Path $CacheDir ".download.$([guid]::NewGuid().ToString('N'))"
try {
    Get-Asset $Asset $Tmp

    # Verifica dell'impronta: si sta per eseguire ciò che si è appena scaricato.
    $Sha = "$Tmp.sha256"
    # L'impronta è facoltativa: se manca si avverte, non si muore.
    foreach ($Repo in @($RepoCatalogo, $RepoProdotto)) {
        if (Try-Repo $Repo "$Asset.sha256" $Sha) { break }
    }

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
