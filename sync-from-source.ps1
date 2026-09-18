# Allinea le skill al repository sorgente di XRCopilotLab.
#
# Le skill vivono in xrcopilotlab-webapp-dotnet: qui ne serve una copia, e si rifà con questo
# invece che a mano. Riscrive anche i link che nel plugin punterebbero a file inesistenti.
#
#   .\sync-from-source.ps1 ../xrcopilotlab-webapp-dotnet
#
# Avviatore Windows: la logica sta in tools\sync_from_source.py.
# Gemello di sync-from-source.sh — stesso comportamento, perché è lo stesso programma.
$ErrorActionPreference = 'Stop'

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path

# Su Windows Python si chiama in tre modi diversi a seconda di come è stato installato.
$Python, $Prefisso = $null, @()
foreach ($Nome in @('py', 'python3', 'python')) {
    $Cmd = Get-Command $Nome -ErrorAction SilentlyContinue
    if ($Cmd) {
        $Python = $Cmd.Source
        if ($Nome -eq 'py') { $Prefisso = @('-3') }
        break
    }
}
if (-not $Python) {
    [Console]::Error.WriteLine("Serve Python 3: installalo dal Microsoft Store o da python.org.")
    exit 1
}

& $Python @Prefisso (Join-Path $Here 'tools\sync_from_source.py') @args
exit $LASTEXITCODE
