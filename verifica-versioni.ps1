# Verifica che un plugin toccato alzi la versione, e che il catalogo la riporti.
#
#   .erifica-versioni.ps1 <ref-di-base>     es. origin/main
#
# Avviatore Windows: la logica sta in tools\verifica_versioni.py.
# Gemello di verifica-versioni.sh — stesso comportamento, perché è lo stesso programma.
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

& $Python @Prefisso (Join-Path $Here 'tools\verifica_versioni.py') @args
exit $LASTEXITCODE
