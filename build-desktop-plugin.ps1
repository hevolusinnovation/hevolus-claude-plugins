# Costruisce lo zip di un plugin per Claude Desktop.
#
# Quale plugin lo dice superfici.json. Normalmente non serve lanciarlo a mano: la CI lo esegue
# a ogni release e allega lo zip alla pagina Releases, da dove i colleghi lo scaricano.
#
#   .\build-desktop-plugin.ps1                              il plugin desktop, in dist/
#   .\build-desktop-plugin.ps1 ~/Assessments                altrove
#   .\build-desktop-plugin.ps1 --plugin assessment         se un giorno ce ne fosse più d'uno
#
# Avviatore Windows: la logica sta in tools\build_desktop_plugin.py.
# Gemello di build-desktop-plugin.sh — stesso comportamento, perché è lo stesso programma.
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

& $Python @Prefisso (Join-Path $Here 'tools\build_desktop_plugin.py') @args
exit $LASTEXITCODE
