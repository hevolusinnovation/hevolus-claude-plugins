# Costruisce lo zip di UNA skill per il caricamento su claude.ai (Impostazioni → Skill).
#
# Non è lo stesso pacchetto del plugin: l'uploader delle skill vuole una sola cartella di primo
# livello, che è la skill. Caricare il pacchetto sbagliato dà l'errore
# «All files must be inside the top-level folder».
#
#   .\build-skill-zip.ps1 plugins/blueprints/skills/xrcopilotlab-blueprint-test
#   .\build-skill-zip.ps1 --all
#
# Avviatore Windows: la logica sta in tools\build_skill_zip.py.
# Gemello di build-skill-zip.sh — stesso comportamento, perché è lo stesso programma.
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

& $Python @Prefisso (Join-Path $Here 'tools\build_skill_zip.py') @args
exit $LASTEXITCODE
