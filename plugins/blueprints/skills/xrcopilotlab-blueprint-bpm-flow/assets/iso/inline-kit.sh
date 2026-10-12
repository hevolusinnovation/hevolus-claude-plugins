#!/bin/sh
# Stampa il kit isometrico come una funzione che restituisce le sue API: `var ISO=(function(){...})();`
# Le funzioni del kit (pathOf, iso, escape...) restano interne e non si scontrano con quelle della pagina.
# Dentro un <script> la sequenza «</script» chiuderebbe la pagina: il kit la contiene in una stringa (pageHtml),
# e qui diventa «<\/script», che in JavaScript vale lo stesso.
D=$(cd "$(dirname "$0")" && pwd)
printf 'var ISO=(function(){\n'
sed -e 's/^export //' -e 's|</script|<\\/script|g' "$D/iso-kit.mjs"
printf '\nreturn {'
grep -o '^export \(function\|const\) [A-Za-z_][A-Za-z0-9_]*' "$D/iso-kit.mjs" | awk '{printf "%s%s:%s", (n++?",":""), $3, $3}'
printf '};\n})();\n'
