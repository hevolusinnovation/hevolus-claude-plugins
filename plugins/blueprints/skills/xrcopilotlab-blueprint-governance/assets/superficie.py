#!/usr/bin/env python3
"""La superficie di governance di un manifest di blueprint: che cosa fanno i suoi agenti che la governance vede.

Uso:  python3 -I superficie.py <manifest.yml> [--json] [--riga]

Legge il manifest in sola lettura e stampa, per ogni punto di controllo della governance:
  - action.email    le email di agent task e step (solo il DOMINIO dei destinatari, mai l'indirizzo)
  - action.webhook  i webhook di agent task e step (host, o «processo» per processes.<chiave>.webhook)
  - action.script   gli step javascript
  - tool.invoke     i tool dei server MCP builder, con il metodo HTTP (scrive se POST, PUT, PATCH, DELETE)
e poi: gli agenti aperti alle persone (chatEndpoints), gli agent task che agiscono da soli (scheduled, webhook),
le skill degli agenti (oggi fuori dalla governance, #1701), le connessioni con il loro host, la sezione
governance se c'è già. --json scrive lo stesso in JSON, --riga una riga di sintesi per il report dell'archivio.

Non stampa mai system message, prompt, credenziali, email complete o query string.
"""
import json
import re
import sys
from urllib.parse import urlparse

import yaml

SCRIVE = {"POST", "PUT", "PATCH", "DELETE"}


def carica(percorso):
    testo = open(percorso, encoding="utf-8").read()
    # PyYAML rifiuta «?» prima di «}» in una mappa in linea (`{ name: Approvato? }`), che YamlDotNet accetta.
    testo = re.sub(r"\?(\s*[},])", r"？\1", testo)
    return yaml.safe_load(testo) or {}


def voci(sezione):
    """Una sezione del manifest come coppie (chiave, voce): vale sia la lista con `key` sia la mappa."""
    if isinstance(sezione, dict):
        return [(k, v or {}) for k, v in sezione.items()]
    return [(v.get("key"), v) for v in sezione or [] if isinstance(v, dict)]


def nome(voce, chiave):
    return voce.get("name") or voce.get("title") or chiave


def dominio(destinatario):
    d = str(destinatario)
    if "{{" in d:
        return "variabile"
    if d.startswith("role:"):
        return "ruolo " + d[5:]
    if d.startswith("user:"):
        return "utente del tenant"
    return d.split("@", 1)[1].lower() if "@" in d else "?"


def host(url):
    u = str(url or "")
    if u.startswith("processes."):
        return "processo " + u.split(".")[1]
    if "{{" in u and "://" not in u:
        return "variabile"
    return urlparse(u).hostname or "?"


def azioni(nodo, dove, risultato):
    """Cerca nel sotto-albero le azioni in uscita: outputActions degli agent task e step action degli orchestratori e dei processi."""
    if isinstance(nodo, dict):
        tipo = nodo.get("type")
        provider = nodo.get("provider")
        if tipo == "email" and ("recipients" in nodo or "to" in nodo):
            dest = nodo.get("recipients") or nodo.get("to") or []
            dest = dest if isinstance(dest, list) else [dest]
            risultato.append({"operazione": "action.email", "dove": dove, "domini": sorted({dominio(x) for x in dest})})
        elif tipo == "webhook" and "url" in nodo:
            risultato.append({"operazione": "action.webhook", "dove": dove, "host": host(nodo.get("url")),
                              "metodo": str(nodo.get("method") or "POST").upper()})
        elif tipo == "action" and provider:
            op = {"email": "action.email", "webhook": "action.webhook", "javascript": "action.script"}.get(provider)
            if op:
                passo = f"{dove} › {nodo.get('key') or nodo.get('name') or 'step'}"
                riga = {"operazione": op, "dove": passo}
                inp = nodo.get("input") or {}
                if op == "action.email":
                    dest = inp.get("to") or inp.get("recipients") or []
                    riga["domini"] = sorted({dominio(x) for x in (dest if isinstance(dest, list) else [dest])})
                if op == "action.webhook":
                    riga["host"] = host(inp.get("url"))
                    riga["metodo"] = str(inp.get("method") or "POST").upper()
                risultato.append(riga)
        for k, v in nodo.items():
            if k in ("systemMessage", "prompt", "systemPrompt", "code", "transform", "testData"):
                continue
            azioni(v, dove, risultato)
    elif isinstance(nodo, list):
        for v in nodo:
            azioni(v, dove, risultato)


def analizza(m):
    s = {"tag": m.get("tag"), "blueprint": m.get("blueprint"), "versione": m.get("version")}
    connessioni = {k: ("processo " + v["process"]) if v.get("process") else host(v.get("baseUrl"))
                   for k, v in voci(m.get("connections"))}
    s["connessioni"] = [{"chiave": k, "host": h} for k, h in connessioni.items()]

    mcp = []
    for k, v in voci(m.get("mcpServers")):
        tools = [{"nome": t.get("name"), "metodo": str(t.get("method") or "GET").upper()}
                 for t in v.get("tools") or [] if isinstance(t, dict)]
        mcp.append({"chiave": k, "nome": nome(v, k), "tipo": v.get("kind"),
                    "host": connessioni.get(v.get("connection"), "?") if v.get("connection") else None,
                    "scrive": [t["nome"] for t in tools if t["metodo"] in SCRIVE],
                    "legge": [t["nome"] for t in tools if t["metodo"] not in SCRIVE]})
    s["mcp"] = mcp

    agenti = []
    for k, v in voci(m.get("agents")):
        agenti.append({"chiave": k, "nome": nome(v, k),
                       "persone": bool(v.get("chatEndpoints") or v.get("embed")),
                       "skill": list(v.get("skills") or []),
                       "mcp": list(v.get("mcp") or []),
                       "descrizione": (v.get("description") or "").strip()[:240]})
    s["agenti"] = agenti

    compiti, uscite = [], []
    for k, v in voci(m.get("agentTasks")):
        trig = v.get("trigger") or "manual"
        compiti.append({"chiave": k, "nome": nome(v, k), "agente": v.get("agent") or v.get("orchestrator"), "trigger": trig,
                        "daSolo": trig in ("scheduled", "webhook")})
        azioni(v.get("outputActions") or [], f"agent task {k}", uscite)
    s["compiti"] = compiti
    for sezione, etichetta in (("orchestrators", "orchestratore"), ("processes", "processo")):
        for k, v in voci(m.get(sezione)):
            azioni(v, f"{etichetta} {k}", uscite)
    s["uscite"] = uscite

    g = m.get("governance")
    s["governance"] = None if not g else {
        "regolamenti": [x.get("id") for x in g.get("models") or []],
        "regole": [x.get("key") for x in g.get("rules") or []],
        "regolamentiDelBlueprint": [x.get("key") for x in g.get("ruleGroups") or []],
        "sistemi": list((g.get("systems") or {}).keys()),
        "responsabile": bool(g.get("owner")),
    }
    return s


def mancanze(s):
    """Che cosa manca alla governance del blueprint, come lo direbbe il report dell'archivio."""
    g = s["governance"]
    superficie = s["uscite"] or any(x["scrive"] for x in s["mcp"]) or any(a["persone"] for a in s["agenti"])
    if g is None:
        return ["nessuna sezione governance"] if superficie else ["niente da governare oltre le regole di base"]
    r = []
    ops = {u["operazione"] for u in s["uscite"]}
    if "action.email" in ops and "perimetro-comunicazioni" not in g["regolamenti"]:
        r.append("email senza perimetro delle comunicazioni")
    if "action.webhook" in ops and "uscite-di-rete" not in g["regolamenti"]:
        r.append("webhook senza uscite di rete")
    if any(x["scrive"] for x in s["mcp"]) and not g["regole"]:
        r.append("tool MCP che scrivono senza regole proprie")
    descritti = set(g["sistemi"])
    persone = [a["chiave"] for a in s["agenti"] if a["persone"] and a["chiave"] not in descritti]
    if persone:
        r.append(f"agenti aperti alle persone senza scheda: {', '.join(persone)}")
    return r


def stampa(s):
    print(f"# {s['tag']} · {s['blueprint']} v{s['versione']}")
    print("\n## Uscite (action.email, action.webhook, action.script)")
    for u in s["uscite"] or [{"operazione": "—", "dove": "nessuna"}]:
        extra = ", ".join(u.get("domini") or []) or (f"{u.get('metodo', '')} {u.get('host', '')}".strip())
        print(f"- {u['operazione']}: {u['dove']}" + (f" → {extra}" if extra else ""))
    print("\n## Server MCP (tool.invoke)")
    for x in s["mcp"] or [{"chiave": "nessuno"}]:
        if "nome" not in x:
            print("- nessuno"); continue
        print(f"- {x['nome']} ({x['tipo']}{', ' + x['host'] if x['host'] else ''}): "
              f"scrivono {', '.join(x['scrive']) or '—'} · leggono {len(x['legge'])}")
    print("\n## Agenti")
    for a in s["agenti"]:
        segni = [x for x, c in (("aperto alle persone", a["persone"]),
                                (f"skill {', '.join(a['skill'])} (fuori governance, #1701)", a["skill"]),
                                (f"MCP {', '.join(a['mcp'])}", a["mcp"])) if c]
        print(f"- {a['nome']} [{a['chiave']}]" + (f" — {'; '.join(segni)}" if segni else ""))
    print("\n## Agent task che agiscono da soli")
    soli = [c for c in s["compiti"] if c["daSolo"]]
    for c in soli or [None]:
        print(f"- {c['nome']} [{c['chiave']}] trigger {c['trigger']}, esegue {c['agente']}" if c else "- nessuno")
    print("\n## Connessioni")
    for c in s["connessioni"] or [{"chiave": "nessuna", "host": ""}]:
        print(f"- {c['chiave']}: {c['host']}")
    print("\n## Governance nel manifest")
    if s["governance"] is None:
        print("- nessuna sezione")
    else:
        g = s["governance"]
        print(f"- regolamenti: {', '.join(g['regolamenti']) or '—'}")
        print(f"- regole proprie: {', '.join(g['regole']) or '—'}; regolamenti del blueprint: {', '.join(g['regolamentiDelBlueprint']) or '—'}")
        print(f"- schede Sistemi: {', '.join(g['sistemi']) or '—'}; responsabile scritto: {'sì' if g['responsabile'] else 'no'}")
    print("\n## Che cosa manca")
    for x in mancanze(s) or ["niente di evidente"]:
        print(f"- {x}")


def riga(s):
    ops = sorted({u["operazione"] for u in s["uscite"]})
    scrive = sum(len(x["scrive"]) for x in s["mcp"])
    persone = sum(1 for a in s["agenti"] if a["persone"])
    soli = sum(1 for c in s["compiti"] if c["daSolo"])
    return (f"| {s['tag']} | v{s['versione']} | {'sì' if s['governance'] else 'no'} | {', '.join(ops) or '—'} | "
            f"{scrive} | {persone} | {soli} | {'; '.join(mancanze(s)) or '—'} |")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    s = analizza(carica(sys.argv[1]))
    if "--json" in sys.argv:
        print(json.dumps(s, ensure_ascii=False, indent=2))
    elif "--riga" in sys.argv:
        print(riga(s))
    else:
        stampa(s)


if __name__ == "__main__":
    main()
