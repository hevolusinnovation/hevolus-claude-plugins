#!/bin/sh
# Estrae dal manifest di un blueprint solo ciò che serve a disegnare i flussi:
#   blueprint, tag, version, businessRoles, agentTasks, processes, orchestrators
# e, di agents / connections / mcpServers, soltanto i campi che collegano le cose fra loro:
#   agents -> key, name, mcp     connections -> key, name, process     mcpServers -> key, name, connection
# (i system message, gli indirizzi, le autenticazioni NON entrano nella pagina).
# Vengono scartate le righe di solo commento (note interne del manifest) e quelle con un indirizzo
# email (membri dei ruoli, responsabili, destinatari): non servono al disegno e non devono finire
# in una pagina che si condivide.
# Uso: estrai-blocchi.sh manifest.yml > blocchi.yml
awk '
  BEGIN { allow["agents"]=" key name mcp "; allow["connections"]=" key name process "; allow["mcpServers"]=" key name connection " }
  /^[ \t]*#/ { next }
  !/^[A-Za-z_]+:/ && /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]+/ { next }
  /^[A-Za-z_]+:/ {
    key=$1; sub(/:.*/,"",key)
    keep = (key=="blueprint"||key=="tag"||key=="version"||key=="businessRoles"||key=="agentTasks"||key=="processes"||key=="orchestrators")
    slim = (key in allow); itemIndent=-1; cont=0
    if (keep) print
    else if (slim) print key ":"
    next
  }
  slim {
    match($0,/^ */); ind=RLENGTH
    if ($0 ~ /^ *- /) { if (itemIndent<0 || ind<itemIndent) itemIndent=ind }
    if (itemIndent<0) next
    if (ind==itemIndent && $0 ~ /^ *- /) {                 # riga di inizio voce
      f=$0; sub(/^ *- /,"",f); sub(/:.*/,"",f)
      if (index(allow[key], " " f " ")) { print; cont=1 } else { print substr($0,1,ind) "- key: \"\""; cont=0 }
      next
    }
    if (ind==itemIndent+2 && $0 !~ /^ *- /) {              # campo diretto della voce
      f=$0; sub(/^ */,"",f); sub(/:.*/,"",f)
      if (index(allow[key], " " f " ")) { print; cont=1 } else cont=0
      next
    }
    if (cont) print                                        # righe di una lista di un campo tenuto
    next
  }
  keep { print }
' "$1"
