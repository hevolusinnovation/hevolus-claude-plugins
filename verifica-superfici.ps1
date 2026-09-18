# Verifica che la separazione fra Claude Code e Claude Desktop tenga.
#
# Ogni plugin dichiara in superfici.json dove gira; questo controlla che i manifest e il
# catalogo dicano la stessa cosa. Gira anche in CI a ogni push.
#
#   .\verifica-superfici.ps1
#
# Avviatore Windows: la logica sta in tools\verifica_superfici.py.
# Gemello di verifica-superfici.sh — stesso comportamento, perché è lo stesso programma.
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

& $Python @Prefisso (Join-Path $Here 'tools\verifica_superfici.py') @args
exit $LASTEXITCODE
