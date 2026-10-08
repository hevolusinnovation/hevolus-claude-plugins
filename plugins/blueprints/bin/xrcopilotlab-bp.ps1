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

# La versione del plugin installato, dal suo manifest: una versione del plugin può portare skill
# nuove con la stessa CLI, e l'avviso deve saperlo.
$PluginVersion = try {
    (Get-Content (Join-Path $Here '..\.claude-plugin\plugin.json') -Raw | ConvertFrom-Json).version
} catch { $null }
$Nota       = Join-Path $CacheRoot 'ultima-cli'
$NotaPlugin = Join-Path $CacheRoot 'ultimo-plugin'

function Stop-WithMessage([string]$Message) {
    [Console]::Error.WriteLine("xrcopilotlab-bp: $Message")
    exit 70
}

# Gemella di $AggiornaNote per chi non ha gh — di norma, chi non sviluppa. Legge dal ramo main del
# catalogo, che è pubblico, i due numeri che servono: nessun account, nessun parsing di JSON.
$AggiornaNotePubbliche = {
    param($Repo, $File, $FilePlugin)
    try {
        $ProgressPreference = 'SilentlyContinue'
        $Base = "https://raw.githubusercontent.com/$Repo/main/plugins/blueprints"
        $V = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 -Uri "$Base/bin/version.txt").Content.Trim()
        if ($V -match '^\d+\.\d+\.\d+$') { Set-Content -Path $File -Value $V }
        $P = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 -Uri "$Base/.claude-plugin/plugin.json").Content | ConvertFrom-Json
        if ($P.version -match '^\d+\.\d+\.\d+$') { Set-Content -Path $FilePlugin -Value $P.version }
    } catch { }
}

# Vero se la prima versione è almeno pari alla seconda, confrontando i campi come numeri.
function Test-Aggiornato([string]$Trovata, [string]$Attesa) {
    try {
        return ([version]$Trovata) -ge ([version]$Attesa)
    } catch {
        return $false
    }
}

# Aggiorna le due note — ultima CLI e ultimo plugin pubblicati — dal catalogo. Gemella della
# funzione dell'avviatore bash: se gh non c'è o GitHub non risponde, le note restano come sono.
$AggiornaNote = {
    param($Repo, $File, $FilePlugin)
    try {
        $V = gh release list --repo $Repo --limit 30 2>$null |
             ForEach-Object { if ($_ -match 'bp-v(\d+\.\d+\.\d+)') { [version]$Matches[1] } } |
             Sort-Object | Select-Object -Last 1
        if ($V) { Set-Content -Path $File -Value $V.ToString() }
        # L'ultima vX.Y.Z del catalogo, per nome: non la release marcata «Latest», che può essere il
        # rispecchiamento di una CLI (bp-v*) senza la tabella «Versioni» (24/09/2026).
        $Catalogo = gh release list --repo $Repo --limit 30 2>$null |
             ForEach-Object { if ($_ -match '(?<![\w-])v(\d+\.\d+\.\d+)(?!\S)') { [version]$Matches[1] } } |
             Sort-Object | Select-Object -Last 1
        if (-not $Catalogo) { return }
        $Body = gh release view "v$Catalogo" --repo $Repo --json body --jq .body 2>$null
        $Riga = $Body | Where-Object { $_ -match '^\|\s*blueprints\s*\|[^|]*\|\s*(\d+\.\d+\.\d+)\s*\|' } | Select-Object -First 1
        if ($Riga -and ($Riga -match '^\|\s*blueprints\s*\|[^|]*\|\s*(\d+\.\d+\.\d+)\s*\|')) {
            Set-Content -Path $FilePlugin -Value $Matches[1]
        }
    } catch { }
}

function Test-NoteScadute {
    -not (Test-Path $NotaPlugin) -or ((Get-Item $NotaPlugin).LastWriteTime -lt (Get-Date).AddDays(-1))
}

# La riga da dire, o niente. Una sola: se il plugin è indietro, aggiornarlo porta anche la CLI.
function Get-MessaggioAggiornamento {
    $Ultimo = if (Test-Path $NotaPlugin) { (Get-Content $NotaPlugin -ErrorAction SilentlyContinue | Select-Object -First 1) } else { $null }
    if ($Ultimo -and $PluginVersion -and -not (Test-Aggiornato $PluginVersion $Ultimo.Trim())) {
        return "c'è il plugin blueprints $($Ultimo.Trim()), questo è il $($PluginVersion): skill o CLI nuove. Aggiornalo con '/plugin marketplace update hevolus' e '/plugin update blueprints@hevolus', poi riavvia la sessione."
    }
    $Ultima = if (Test-Path $Nota) { (Get-Content $Nota -ErrorAction SilentlyContinue | Select-Object -First 1) } else { $null }
    if ($Ultima -and -not (Test-Aggiornato $Version $Ultima.Trim())) {
        return "c'è la $($Ultima.Trim()), il plugin chiede la $Version. Aggiornalo con '/plugin update blueprints@hevolus'."
    }
    return $null
}

# All'apertura di una sessione (hook SessionStart): si dice se il plugin è indietro, e basta. Le note
# scadute si aggiornano in primo piano, perché il processo dell'hook finisce subito.
if ($args.Count -gt 0 -and $args[0] -eq '--avviso-sessione') {
    if ((Get-Command gh -ErrorAction SilentlyContinue) -and (Test-NoteScadute)) {
        New-Item -ItemType Directory -Force $CacheRoot | Out-Null
        & $AggiornaNote $RepoCatalogo $Nota $NotaPlugin
    }
    $M = Get-MessaggioAggiornamento
    if ($M) {
        @{
            systemMessage      = "xrcopilotlab-bp: $M"
            hookSpecificOutput = @{
                hookEventName     = 'SessionStart'
                additionalContext = "Il plugin blueprints è indietro. Dillo all'utente in una riga, con i comandi: $M"
            }
        } | ConvertTo-Json -Compress -Depth 4
    }
    exit 0
}

# 1. Un percorso imposto a mano vince su tutto.
if ($env:XRCOPILOTLAB_BP_BIN) {
    & $env:XRCOPILOTLAB_BP_BIN @args
    exit $LASTEXITCODE
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

# Dice, una riga sola, se il plugin è indietro rispetto all'ultima CLI pubblicata. Gemello della
# stessa logica nell'avviatore bash: si **legge** la cache (immediato) e si **aggiorna** in
# background, quindi la notizia arriva al comando successivo. Costa zero e non può far fallire
# niente: se gh non c'è, o GitHub non risponde, non succede nulla di visibile.
$M = Get-MessaggioAggiornamento
if ($M) { [Console]::Error.WriteLine("xrcopilotlab-bp: $M") }

# Durante un comando le note si aggiornano staccate: il comando non aspetta GitHub.
if (Test-NoteScadute) {
    New-Item -ItemType Directory -Force $CacheRoot | Out-Null
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        Start-Job -ScriptBlock $AggiornaNote -ArgumentList $RepoCatalogo, $Nota, $NotaPlugin | Out-Null
    } else {
        Start-Job -ScriptBlock $AggiornaNotePubbliche -ArgumentList $RepoCatalogo, $Nota, $NotaPlugin | Out-Null
    }
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

function Try-Pubblico([string]$Repo, [string]$Name, [string]$Destination) {
    # La strada normale: il catalogo è pubblico, quindi l'allegato si scarica senza account, senza gh
    # e senza token. Le altre due restano per il repository di prodotto, che è privato.
    try {
        $ProgressPreference = 'SilentlyContinue'   # su Windows PowerShell 5 la barra rallenta di ordini di grandezza
        Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/$Repo/releases/download/$Tag/$Name" -OutFile $Destination
        return (Test-Path $Destination)
    } catch {
        return $false
    }
}

function Try-Repo([string]$Repo, [string]$Name, [string]$Destination) {
    # Vero se l'allegato è arrivato da questo repository, per una delle tre strade.
    if (Try-Pubblico $Repo $Name $Destination) { return $true }

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

  Il catalogo è pubblico: non serve un account GitHub. Le cause possibili sono due:
  · il computer non raggiunge github.com (rete aziendale, proxy, VPN)
    -> riprova da un'altra rete, oppure fatti passare il binario e indicalo con:
        `$env:XRCOPILOTLAB_BP_BIN = 'C:\percorso\del\binario.exe'
  · la release non ha l'allegato per questa piattaforma ($Rid)
    -> scrivi al team: serve una release che lo pubblichi
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
