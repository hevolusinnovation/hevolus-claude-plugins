#!/usr/bin/env bash
# setup-atlas-mcp.sh — configura il server MCP «atlas» (CMS Atlas Orchestratore)
# per Claude Code e Claude Desktop, prima di usare le skill atlas e xrcopilotlab-delivery-atlas.
#
# Uso:
#   ./setup-atlas-mcp.sh [--url URL] [--solo-code | --solo-desktop] [--skill PERCORSO/SKILL.md]
#                        [--desktop-config PERCORSO] [--no-test]
#
# Il token si inserisce a richiesta (non viene mostrato) oppure tramite la variabile
# d'ambiente ATLAS_TOKEN. Lo script non stampa mai il token e non lo scrive nella cronologia.
set -euo pipefail

DEFAULT_URL="https://ca-atlas-orch.yellowisland-21488844.italynorth.azurecontainerapps.io/api/mcp"
URL="${ATLAS_MCP_URL:-$DEFAULT_URL}"
DO_CODE=1
DO_DESKTOP=1
DO_TEST=1
SKILL_SRC=""
DESKTOP_CFG=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ok()   { printf '\033[32m✓\033[0m %s\n' "$*"; }
info() { printf '\033[34m•\033[0m %s\n' "$*"; }
warn() { printf '\033[33m!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[31m✗\033[0m %s\n' "$*" >&2; exit 1; }

usage() { sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; exit 0; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)            URL="${2:?manca il valore di --url}"; shift 2 ;;
    --solo-code)      DO_DESKTOP=0; shift ;;
    --solo-desktop)   DO_CODE=0; shift ;;
    --skill)          SKILL_SRC="${2:?manca il percorso di --skill}"; shift 2 ;;
    --desktop-config) DESKTOP_CFG="${2:?manca il percorso di --desktop-config}"; shift 2 ;;
    --no-test)        DO_TEST=0; shift ;;
    -h|--help)        usage ;;
    *)                die "Opzione sconosciuta: $1 (usa --help)" ;;
  esac
done

echo "Configurazione del server MCP «atlas»"
echo "Server: $URL"
echo

# ---------------------------------------------------------------- prerequisiti
if [[ $DO_CODE -eq 1 ]] && ! command -v claude >/dev/null 2>&1; then
  warn "Claude Code (comando 'claude') non trovato: salto la configurazione di Claude Code."
  DO_CODE=0
fi
if [[ $DO_DESKTOP -eq 1 ]] && { ! command -v node >/dev/null 2>&1 || ! command -v npx >/dev/null 2>&1; }; then
  warn "Node.js/npx non trovati: servono a Claude Desktop per avviare mcp-remote. Installa Node.js LTS e rilancia."
  DO_DESKTOP=0
fi
[[ $DO_CODE -eq 0 && $DO_DESKTOP -eq 0 ]] && die "Niente da configurare: mancano sia Claude Code sia Node.js."

# ---------------------------------------------------------------- token
if [[ -z "${ATLAS_TOKEN:-}" ]]; then
  read -rsp "Incolla il token Atlas (non verrà mostrato): " ATLAS_TOKEN
  echo
fi
ATLAS_TOKEN="${ATLAS_TOKEN#Bearer }"                  # accetta anche «Bearer xxx»
ATLAS_TOKEN="$(printf '%s' "$ATLAS_TOKEN" | tr -d '[:space:]')"
[[ -n "$ATLAS_TOKEN" ]] || die "Token vuoto."
export ATLAS_TOKEN
trap 'unset ATLAS_TOKEN' EXIT

# ---------------------------------------------------------------- test del token
if [[ $DO_TEST -eq 1 ]]; then
  if command -v curl >/dev/null 2>&1; then
    INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"atlas-setup","version":"1.0"}}}'
    # l'intestazione passa da stdin (-H @-): il token non compare tra gli argomenti dei processi
    code="$(printf 'Authorization: Bearer %s\n' "$ATLAS_TOKEN" \
      | curl -sS -o /dev/null -w '%{http_code}' --max-time 20 -X POST "$URL" -H @- \
          -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
          --data "$INIT" 2>/dev/null)" || true
    code="${code:-000}"
    case "$code" in
      200|202) ok "Server raggiungibile e token accettato." ;;
      401|403) die "Il server ha rifiutato il token (HTTP $code). Controlla il token e rilancia." ;;
      000)     warn "Server non raggiungibile (rete, VPN o proxy?). Proseguo comunque con la configurazione." ;;
      *)       warn "Risposta inattesa dal server (HTTP $code). Proseguo; verifica poi con /mcp." ;;
    esac
  else
    warn "curl non trovato: salto il test del token."
  fi
fi

# ---------------------------------------------------------------- Claude Code
if [[ $DO_CODE -eq 1 ]]; then
  if claude mcp get atlas >/dev/null 2>&1; then
    info "Server «atlas» già presente in Claude Code: lo sostituisco."
    claude mcp remove atlas -s user >/dev/null 2>&1 || true
  fi
  if claude mcp add --transport http --scope user atlas "$URL" \
       --header "Authorization: Bearer $ATLAS_TOKEN" >/dev/null; then
    ok "Claude Code: server «atlas» registrato a livello utente."
  else
    warn "Claude Code: registrazione non riuscita. Riprova con: claude mcp add --transport http --scope user atlas <url> --header \"Authorization: Bearer <token>\""
  fi
fi

# ---------------------------------------------------------------- Claude Desktop
if [[ $DO_DESKTOP -eq 1 ]]; then
  if [[ -z "$DESKTOP_CFG" ]]; then
    case "$(uname -s)" in
      Darwin) DESKTOP_CFG="$HOME/Library/Application Support/Claude/claude_desktop_config.json" ;;
      Linux)  DESKTOP_CFG="${XDG_CONFIG_HOME:-$HOME/.config}/Claude/claude_desktop_config.json" ;;
      *)      DESKTOP_CFG="" ;;
    esac
  fi
  if [[ -z "$DESKTOP_CFG" ]]; then
    warn "Sistema non riconosciuto: indica il file con --desktop-config. Salto Claude Desktop."
  elif [[ "$(uname -s)" == "Linux" && ! -d "$(dirname "$DESKTOP_CFG")" ]]; then
    warn "Claude Desktop non sembra installato ($(dirname "$DESKTOP_CFG") assente). Salto."
  else
    mkdir -p "$(dirname "$DESKTOP_CFG")"
    if [[ -f "$DESKTOP_CFG" ]]; then
      BK="$DESKTOP_CFG.bak-$(date +%Y%m%d-%H%M%S)"
      cp "$DESKTOP_CFG" "$BK"
      chmod 600 "$BK"
      info "Copia di sicurezza: $BK"
    fi
    CFG="$DESKTOP_CFG" URL="$URL" node -e '
      const fs = require("fs");
      const p = process.env.CFG;
      let c = {};
      if (fs.existsSync(p)) {
        const t = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
        if (t.trim()) {
          try { c = JSON.parse(t); }
          catch (e) { console.error("File di configurazione non valido: " + e.message); process.exit(2); }
        }
      }
      c.mcpServers = c.mcpServers || {};
      c.mcpServers.atlas = {
        command: "npx",
        args: ["-y", "mcp-remote", process.env.URL, "--header", "Authorization:${ATLAS_AUTH}"],
        env: { ATLAS_AUTH: "Bearer " + process.env.ATLAS_TOKEN }
      };
      fs.writeFileSync(p, JSON.stringify(c, null, 2) + "\n");
      // avviso se altri server hanno chiavi in chiaro negli argomenti
      for (const [n, s] of Object.entries(c.mcpServers)) {
        if (n !== "atlas" && (s.args || []).some(a => /^(napi_|sk-|ghp_|xox[bp]-)/.test(String(a))))
          console.error("AVVISO: il server «" + n + "» ha una chiave in chiaro negli argomenti: valuta di ruotarla.");
      }
    ' || die "Claude Desktop: configurazione non aggiornata (il file originale è intatto)."
    chmod 600 "$DESKTOP_CFG"
    ok "Claude Desktop: server «atlas» aggiunto a $DESKTOP_CFG (via mcp-remote)."
  fi
fi

# ---------------------------------------------------------------- skill atlas
if [[ -z "$SKILL_SRC" && -f "$SCRIPT_DIR/SKILL.md" ]]; then
  SKILL_SRC="$SCRIPT_DIR/SKILL.md"
fi
if [[ -n "$SKILL_SRC" ]]; then
  [[ -f "$SKILL_SRC" ]] || die "SKILL.md non trovato: $SKILL_SRC"
  DEST="$HOME/.claude/skills/atlas"
  mkdir -p "$DEST"
  [[ -f "$DEST/SKILL.md" ]] && cp "$DEST/SKILL.md" "$DEST/SKILL.md.bak-$(date +%Y%m%d-%H%M%S)"
  cp "$SKILL_SRC" "$DEST/SKILL.md"
  ok "Skill «atlas» installata in $DEST/SKILL.md"
else
  info "Skill «atlas» non installata: metti SKILL.md accanto allo script o usa --skill."
fi

# ---------------------------------------------------------------- riepilogo
echo
echo "Fatto. Prossimi passi:"
[[ $DO_CODE -eq 1 ]]    && echo "  • Claude Code: apri una nuova sessione e digita /mcp (il server «atlas» deve risultare connesso)."
[[ $DO_DESKTOP -eq 1 ]] && echo "  • Claude Desktop: chiudi l'app del tutto e riaprila; prova con «elenca i clienti»."
echo "  • Elimina la guida o qualsiasi file che contiene il token in chiaro."
