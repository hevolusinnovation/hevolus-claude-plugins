#!/usr/bin/env python3
"""Trasforma il piano di delivery (piano-delivery.json) nella sequenza ordinata di chiamate al
server MCP «atlas» e produce l'anteprima da mostrare all'utente prima di scrivere sul CMS.

Uso:
  python plan_to_mcp.py piano-delivery.json --out chiamate.json --md anteprima.md \
      [--tools lista_clienti,crea_cliente,...]   # strumenti effettivamente esposti dal server

Con --tools lo script sa se esistono gli strumenti non ancora rilasciati
(`carica_documento`, `aggiungi_agente`): se mancano, i documenti senza URL diventano
un'azione «Caricare … nel CMS» e gli agenti restano elencati nell'anteprima come da
registrare a mano. Senza --tools assume il set dei 15 strumenti della guida.

Lo script non chiama nulla: prepara e valida. Le chiamate le esegue Claude, nell'ordine,
dopo la conferma dell'utente. I nomi dei parametri sono quelli della skill `atlas`;
se lo schema reale dello strumento differisce, vale lo schema reale.
"""
import argparse, json, re, sys

BASE_TOOLS = {
    "lista_clienti", "crea_cliente", "lista_delivery", "crea_delivery",
    "crea_delivery_personalizzata", "scheda_delivery", "aggiorna_stakeholder", "imposta_date",
    "crea_riunione", "segna_step", "segna_deliverable", "segna_azione", "aggiungi_azione",
    "aggiungi_rischio", "aggiungi_documento",
}
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
RUOLI = {
    "Direzione commerciale", "Delivery Manager", "Senior Architect", "Agent Developer",
    "Practice Lead Atlas", "Sponsor esecutivo", "Process owner", "Champion", "Referente IT",
    "Referente privacy", "Responsabile interno degli agenti", "Comitato strategico",
}
LIVELLI_CMS = {  # Atlas (C2/Q1) -> etichetta della scheda Agenti del CMS
    "co-pilot": "assistente", "copilot": "assistente", "assisted": "co-pilot",
    "autonomous": "autonomo",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("piano")
    ap.add_argument("--out", default="chiamate.json")
    ap.add_argument("--md", default="anteprima.md")
    ap.add_argument("--tools", default="")
    a = ap.parse_args()

    tools = set(t.strip() for t in a.tools.split(",") if t.strip()) or set(BASE_TOOLS)
    piano = json.load(open(a.piano, encoding="utf-8"))
    avvisi, calls, manuali = [], [], []

    def call(tool, args, perche, dopo=None):
        if tool not in tools:
            avvisi.append(f"Strumento `{tool}` non disponibile: {perche} va fatto a mano.")
            manuali.append(f"{perche} ({json.dumps(args, ensure_ascii=False)})")
            return
        calls.append({"n": len(calls) + 1, "tool": tool, "args": args, "perche": perche,
                      **({"dopo": dopo} if dopo else {})})

    cli = piano.get("cliente", {})
    if not cli.get("nome"):
        sys.exit("piano: manca cliente.nome")

    call("lista_clienti", {}, "verificare se il cliente esiste già (anche con maiuscole diverse)")
    call("crea_cliente", {k: v for k, v in cli.items() if v}, "creare il cliente se non esiste",
         dopo="solo se lista_clienti non lo trova")
    call("lista_delivery", {}, "evitare doppioni di delivery per lo stesso cliente")

    for i, dl in enumerate(piano.get("delivery", []), 1):
        ref = dl.get("sigla") or f"<SIGLA delivery {i}>"
        tipo = dl.get("tipo")
        if dl.get("avvio") and not DATE.match(dl["avvio"]):
            avvisi.append(f"Delivery {i}: data di avvio non in formato AAAA-MM-GG ({dl['avvio']}).")
        if tipo in ("programma", "sow"):
            args = {"cliente": cli["nome"], "nome": dl["nome"], "tipo": tipo, "avvio": dl.get("avvio")}
            if tipo == "programma":
                if dl.get("fase1") not in ("discovery", "workshop", "diretto"):
                    avvisi.append(f"Delivery {i}: fase1 deve essere discovery, workshop o diretto.")
                args["fase1"] = dl.get("fase1")
            if dl.get("sigla"):
                args["sigla"] = dl["sigla"]
            call("crea_delivery", args, f"creare la delivery «{dl['nome']}» dal template Atlas")
        elif tipo == "personalizzata":
            if not dl.get("fasi"):
                avvisi.append(f"Delivery {i}: tipo personalizzata senza fasi.")
            args = {"cliente": cli["nome"], "nome": dl["nome"], "avvio": dl.get("avvio"),
                    "fasi": dl.get("fasi", [])}
            if dl.get("sigla"):
                args["sigla"] = dl["sigla"]
            call("crea_delivery_personalizzata", args, f"creare il progetto «{dl['nome']}» con fasi proprie")
        else:
            avvisi.append(f"Delivery {i}: tipo sconosciuto «{tipo}».")
            continue

        call("scheda_delivery", {"delivery": ref},
             "leggere codici di step e deliverable e ruoli stakeholder ancora vuoti")

        for s in dl.get("stakeholder", []):
            if not s.get("nome"):
                continue  # mai inventare persone
            if s.get("ruolo") and s["ruolo"] not in RUOLI:
                avvisi.append(f"Stakeholder {s['nome']}: ruolo «{s['ruolo']}» non è un ruolo del template "
                              "(verrà aggiunto come persona).")
            call("aggiorna_stakeholder", {"delivery": ref, **{k: v for k, v in s.items() if v not in (None, "")}},
                 f"compilare lo stakeholder {s['nome']}")

        for d in dl.get("date", []):
            call("imposta_date", {"delivery": ref, **d}, "allineare una data al piano concordato")

        for r in dl.get("rischi", []):
            if r.get("severita") not in ("alta", "media", "bassa"):
                avvisi.append(f"Rischio «{r.get('titolo')}»: severità deve essere alta/media/bassa.")
            if r.get("severita") == "alta":
                avvisi.append(f"Rischio «{r.get('titolo')}» con severità alta: la delivery nascerà in ROSSO.")
            if r.get("scadenza") and not DATE.match(r["scadenza"]):
                avvisi.append(f"Rischio «{r.get('titolo')}»: scadenza non AAAA-MM-GG.")
            call("aggiungi_rischio", {"delivery": ref, **r}, f"registrare il rischio «{r.get('titolo')}»")

        for az in dl.get("azioni", []):
            if az.get("entro") and not DATE.match(az["entro"]):
                avvisi.append(f"Azione «{az.get('testo')}»: data non AAAA-MM-GG.")
            call("aggiungi_azione", {"delivery": ref, **az}, f"registrare l'azione «{az.get('testo')}»")

        for doc in dl.get("documenti", []):
            titolo = f"{doc.get('codice', '')} {doc.get('titolo', '')}".strip()
            if doc.get("url"):
                call("aggiungi_documento", {"delivery": ref, "titolo": titolo, "url": doc["url"],
                                             **({"fase": doc["fase"]} if doc.get("fase") else {})},
                     f"collegare il documento {titolo}")
            elif "carica_documento" in tools:
                call("carica_documento", {"delivery": ref, "titolo": titolo, "file": doc.get("file"),
                                           **({"fase": doc["fase"]} if doc.get("fase") else {}),
                                           **({"deliverable": doc["deliverable"]} if doc.get("deliverable") else {})},
                     f"caricare il file {titolo}")
            else:
                call("aggiungi_azione", {"delivery": ref,
                                         "testo": f"Caricare {titolo} nella scheda Documenti ({doc.get('file')})",
                                         "owner": "Delivery Manager"},
                     f"ricordare il caricamento di {titolo} (upload non disponibile via MCP)")

        for ag in dl.get("agenti", []):
            liv = LIVELLI_CMS.get(str(ag.get("livello", "co-pilot")).lower(), ag.get("livello"))
            args = {"delivery": ref, "nome": ag["nome"], "processo": ag.get("processo", ""), "livello": liv}
            if "aggiungi_agente" in tools:
                call("aggiungi_agente", args, f"registrare l'agente {ag['nome']}")
            else:
                manuali.append(f"Scheda Agenti → aggiungere «{ag['nome']}» (processo: {ag.get('processo', '')}, "
                               f"livello CMS: {liv})")

        call("scheda_delivery", {"delivery": ref},
             "verifica finale: salute, fase corrente, conteggi di stakeholder, rischi, azioni e documenti")

    json.dump(calls, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    L = [f"# Anteprima scritture sul CMS Atlas — {cli['nome']}", ""]
    for dl in piano.get("delivery", []):
        L.append(f"- **{dl.get('nome')}** · tipo `{dl.get('tipo')}`"
                 + (f" · fase 1 `{dl.get('fase1')}`" if dl.get("fase1") else "")
                 + f" · avvio {dl.get('avvio', '—')} · sigla {dl.get('sigla') or 'ricavata dal CMS'}")
    L += ["", f"## Chiamate MCP in ordine ({len(calls)})", ""]
    for c in calls:
        extra = f" — _{c['dopo']}_" if c.get("dopo") else ""
        L.append(f"{c['n']}. `{c['tool']}` — {c['perche']}{extra}")
    if manuali:
        L += ["", "## Da fare a mano nel CMS (nessuno strumento MCP)", ""] + [f"- {m}" for m in manuali]
    if avvisi:
        L += ["", "## Avvisi", ""] + [f"- {x}" for x in avvisi]
    L += ["", "Nessuna spunta, chiusura o invio di minuta è inclusa. Confermi le scritture?"]
    open(a.md, "w", encoding="utf-8").write("\n".join(L) + "\n")
    print("\n".join(L))


if __name__ == "__main__":
    main()
