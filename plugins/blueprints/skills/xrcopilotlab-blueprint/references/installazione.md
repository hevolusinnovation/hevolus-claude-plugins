# Come si ottiene la CLI `xrcopilotlab-bp`

Ogni comando di queste skill passa dalla CLI. Non si compila, non si clona il repository di
prodotto, non si chiama l'API a mano: si prende il binario già pubblicato.

## La strada normale: il plugin

Due righe dentro Claude Code, una volta sola:

```
/plugin marketplace add hevolusinnovation/hevolus-claude-plugins
/plugin install blueprints@hevolus
```

Da lì in poi `xrcopilotlab-bp` è un comando come un altro, su **macOS, Windows e Linux**: al primo
uso l'avviatore riconosce il sistema, scarica l'allegato giusto (~52 MB), **ne verifica l'impronta
SHA-256** e lo tiene in cache. Non si riscarica più finché il plugin non chiede una versione nuova.

Serve un accesso GitHub dell'organizzazione Hevolus — lo stesso che serve a registrare il catalogo:
se il plugin si installa, la CLI si scarica.

L'avviatore cerca il binario in quest'ordine, e la prima risposta vince:

1. `XRCOPILOTLAB_BP_BIN`, se punta a un eseguibile — è il modo per provare una build locale;
2. lo strumento globale `dotnet tool`, **se non è più vecchio** di quello che il plugin chiede;
3. la cache del plugin;
4. il download dalla release.

## A mano, senza plugin

Serve a chi non usa Claude Code, a chi deve fissare una versione precisa, o a una macchina che non
può raggiungere GitHub al primo avvio. Gli allegati stanno nella release
[`bp-v2.19.0`](https://github.com/hevolusinnovation/hevolus-claude-plugins/releases/tag/bp-v2.19.0)
— accanto a ognuno c'è un file `.sha256` che contiene **solo l'impronta**, quindi si confronta, non
si dà in pasto a `shasum -c`.

| Sistema | Allegato |
|---|---|
| macOS Apple Silicon (M1/M2/M3/M4) | `xrcopilotlab-bp-osx-arm64` |
| macOS Intel | `xrcopilotlab-bp-osx-x64` |
| Windows x64 | `xrcopilotlab-bp-win-x64.exe` |
| Linux x64 | `xrcopilotlab-bp-linux-x64` |

Su **Windows ARM** questa release non pubblica un binario nativo: si usa quello x64, che gira in
emulazione. Lo stesso per **Linux ARM**. Entrambi arrivano con la release successiva.

### macOS

```bash
gh release download bp-v2.19.0 --repo hevolusinnovation/hevolus-claude-plugins \
    --pattern 'xrcopilotlab-bp-osx-arm64*' --dir ~/Downloads

# L'impronta si confronta: il file .sha256 contiene solo il numero.
[ "$(shasum -a 256 ~/Downloads/xrcopilotlab-bp-osx-arm64 | awk '{print $1}')" \
  = "$(tr -d '\r\n' < ~/Downloads/xrcopilotlab-bp-osx-arm64.sha256)" ] \
  && echo "impronta ok" || echo "NON eseguirlo"

mkdir -p ~/.local/bin
mv ~/Downloads/xrcopilotlab-bp-osx-arm64 ~/.local/bin/xrcopilotlab-bp
chmod +x ~/.local/bin/xrcopilotlab-bp
```

Se il file è stato scaricato **dal browser** invece che con `gh`, macOS lo mette in quarantena e al
primo avvio dice che «non è possibile verificare lo sviluppatore»: si toglie l'attributo, una volta
sola, dopo aver verificato l'impronta qui sopra.

```bash
xattr -d com.apple.quarantine ~/.local/bin/xrcopilotlab-bp
```

`~/.local/bin` deve essere nel `PATH` (`echo $PATH`); se non c'è, si aggiunge al proprio
`~/.zshrc` con `export PATH="$HOME/.local/bin:$PATH"`.

### Windows (PowerShell)

```powershell
gh release download bp-v2.19.0 --repo hevolusinnovation/hevolus-claude-plugins `
    --pattern 'xrcopilotlab-bp-win-x64.exe*' --dir $HOME\Downloads

# Confronto dell'impronta, prima di eseguire.
$atteso  = (Get-Content $HOME\Downloads\xrcopilotlab-bp-win-x64.exe.sha256).Trim()
$ottenuto = (Get-FileHash $HOME\Downloads\xrcopilotlab-bp-win-x64.exe -Algorithm SHA256).Hash.ToLower()
if ($atteso -eq $ottenuto) { "impronta ok" } else { "NON eseguirlo" }

New-Item -ItemType Directory -Force "$HOME\bin" | Out-Null
Move-Item $HOME\Downloads\xrcopilotlab-bp-win-x64.exe "$HOME\bin\xrcopilotlab-bp.exe"
Unblock-File "$HOME\bin\xrcopilotlab-bp.exe"      # toglie il marchio «scaricato da internet»
```

Per avere il comando in ogni finestra nuova, `$HOME\bin` va nel `PATH` dell'utente:

```powershell
[Environment]::SetEnvironmentVariable(
    "Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";$HOME\bin", "User")
```

Senza `gh`, gli stessi file si scaricano dalla pagina della release con il browser: cambia solo
il modo di prenderli, non la verifica dell'impronta né lo sblocco.

## Verificare, e capire quale versione si ha davanti

```bash
xrcopilotlab-bp --help
```

Questo è anche il modo di sapere **cosa quel binario sa fare**. La skill descrive la CLI come è nel
repository; il binario installato può essere più vecchio. Se un comando citato qui non compare
nell'elenco di `--help`, non è un errore della skill né della macchina: è una versione indietro, e
si aggiorna il plugin (`/plugin`) o si riscarica da una release più recente.

Non scrivere a memoria l'elenco dei comandi e delle opzioni: `--help` è l'unica fonte che non può
essere in ritardo rispetto a ciò che è installato.
