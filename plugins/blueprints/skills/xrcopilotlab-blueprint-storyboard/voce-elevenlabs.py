#!/usr/bin/env python3
"""
La voce ElevenLabs della storyboard, con la stessa interfaccia di `xrcopilotlab-bp voice say`: un MP3 mono 16 kHz
per battuta, così compose-video.py monta allo stesso modo qualunque sia la voce.

Le impostazioni sono quelle del registratore (demo-recorder-playwright, reel/voice-elevenlabs.ts), perché la stessa
voce suoni uguale nei video della storyboard e nei reel: modello eleven_multilingual_v2, voce Liam, «espressiva e
decisa» (stabilità 0,4, somiglianza 0,8, stile 0,45). ELEVENLABS_MODEL, ELEVENLABS_VOICE, ELEVENLABS_STABILITY,
ELEVENLABS_SIMILARITY, ELEVENLABS_STYLE le ritoccano.

La chiave arriva SOLO da ELEVENLABS_API_KEY nell'ambiente: mai un argomento, mai su disco, mai nel log.

Uso:
  voce-elevenlabs.py controlla                                  # c'è la chiave? (non la stampa mai)
  voce-elevenlabs.py voci [--lang it]                           # le voci dell'account, con l'id
  voce-elevenlabs.py say "<testo>" --out scena-1.mp3 [--voice Liam] [--rate 1.0]
  voce-elevenlabs.py say --lines righe.json --out-dir audio [--voice Liam] [--rate 1.0]
     righe.json = [{"name": "scena-1", "text": "…"}] (lo stesso file di xrcopilotlab-bp voice say --lines)

Codici di uscita: 0 ok · 2 uso errato · 3 manca la chiave · 4 errore del servizio.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request

API = "https://api.elevenlabs.io"
MODELLO = os.environ.get("ELEVENLABS_MODEL", "").strip() or "eleven_multilingual_v2"
VOCE = os.environ.get("ELEVENLABS_VOICE", "").strip() or "Liam"


def unita(nome, default):
    raw = os.environ.get(nome, "").strip()
    if not raw:
        return default
    v = float(raw)
    if not 0 <= v <= 1:
        sys.exit(f"{nome} vale da 0 a 1 (trovato «{raw}»)")
    return v


def impostazioni(rate):
    s = ({"stability": unita("ELEVENLABS_STABILITY", 0.5)} if MODELLO.startswith("eleven_v3") else {
        "stability": unita("ELEVENLABS_STABILITY", 0.4),
        "similarity_boost": unita("ELEVENLABS_SIMILARITY", 0.8),
        "style": unita("ELEVENLABS_STYLE", 0.45),
        "use_speaker_boost": True,
    })
    if rate != 1.0:
        s["speed"] = max(0.85, min(1.15, rate))
    return s


def chiave():
    k = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not k:
        print("Manca ELEVENLABS_API_KEY nell'ambiente: vedi references/narrazione.md, «La chiave ElevenLabs».", file=sys.stderr)
        sys.exit(3)
    return k


def richiesta(metodo, percorso, corpo=None):
    req = urllib.request.Request(API + percorso, method=metodo,
                                 data=json.dumps(corpo).encode() if corpo is not None else None,
                                 headers={"xi-api-key": chiave(), "Content-Type": "application/json", "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        dettaglio = ""
        try:
            d = json.loads(e.read()).get("detail")
            dettaglio = d if isinstance(d, str) else " · ".join(str(x) for x in (d or {}).values() if x)
        except Exception:
            pass
        aiuto = {401: " — chiave non valida, o senza il permesso text_to_speech",
                 402: " — serve un piano a pagamento per questa voce o funzione",
                 429: " — troppe richieste o crediti esauriti: riprova fra poco"}.get(e.code, "")
        print(f"ElevenLabs: {metodo} {percorso.split('?')[0]} → HTTP {e.code}{', ' + dettaglio if dettaglio else ''}{aiuto}", file=sys.stderr)
        sys.exit(4)
    except urllib.error.URLError as e:
        print(f"ElevenLabs non raggiungibile: {e.reason}", file=sys.stderr)
        sys.exit(4)


def voci_account():
    return json.loads(richiesta("GET", "/v2/voices?page_size=100"))["voices"]


def id_voce(voce):
    if re.fullmatch(r"[A-Za-z0-9]{20}", voce):
        return voce
    for v in voci_account():
        if v["name"].lower() == voce.lower() or v["name"].lower().split(" ")[0] == voce.lower():
            return v["voice_id"]
    print(f"La voce «{voce}» non è fra quelle dell'account (voci: voce-elevenlabs.py voci). Una voce della libreria "
          "condivisa va prima aggiunta a «My voices» sul sito.", file=sys.stderr)
    sys.exit(2)


def sintetizza(testo, voce_id, rate, destinazione):
    audio = richiesta("POST", f"/v1/text-to-speech/{voce_id}?output_format=mp3_44100_128",
                      {"text": testo, "model_id": MODELLO, "voice_settings": impostazioni(rate)})
    # Mono 16 kHz come xrcopilotlab-bp voice: compose-video.py non deve sapere da dove viene la voce.
    if shutil.which("ffmpeg"):
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as t:
            t.write(audio)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", t.name, "-ac", "1", "-ar", "16000", destinazione], check=True)
        os.unlink(t.name)
    else:
        open(destinazione, "wb").write(audio)


def nome_sicuro(n):
    return re.sub(r"[^A-Za-z0-9._-]", "-", n)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("controlla")
    v = sub.add_parser("voci"); v.add_argument("--lang", default="it")
    s = sub.add_parser("say")
    s.add_argument("testo", nargs="?"); s.add_argument("--out"); s.add_argument("--lines"); s.add_argument("--out-dir")
    s.add_argument("--voice", default=VOCE); s.add_argument("--rate", type=float, default=1.0)
    a = ap.parse_args()

    if a.cmd == "controlla":
        presente = bool(os.environ.get("ELEVENLABS_API_KEY", "").strip())
        print("chiave ElevenLabs presente" if presente else "chiave ElevenLabs assente")
        sys.exit(0 if presente else 3)

    if a.cmd == "voci":
        voci = voci_account()
        parla = lambda x: (x.get("labels") or {}).get("language") == a.lang or any(l.get("language") == a.lang for l in x.get("verified_languages") or [])
        for x in sorted(voci, key=lambda x: (not parla(x), x["name"])):
            print(f"  {x['name']:<28} {(x.get('labels') or {}).get('gender', '-'):<8} {x['voice_id']}{'  · ' + a.lang if parla(x) else ''}")
        return

    voce_id = id_voce(a.voice)
    if a.lines:
        if not a.out_dir:
            sys.exit("Con --lines serve --out-dir: la cartella dove scrivere un MP3 per riga.")
        righe = json.load(open(a.lines, encoding="utf-8"))
        if not righe or any(not (r.get("name") and r.get("text")) for r in righe):
            sys.exit("Il file delle righe vuole [{\"name\": …, \"text\": …}], senza voci vuote.")
        os.makedirs(a.out_dir, exist_ok=True)
        for r in righe:
            f = os.path.join(a.out_dir, nome_sicuro(r["name"]) + ".mp3")
            sintetizza(r["text"], voce_id, a.rate, f)
            print(f"✓ {f}")
    else:
        if not (a.testo and a.out):
            sys.exit("Uso: say \"<testo>\" --out <file.mp3>  oppure  say --lines <righe.json> --out-dir <cartella>")
        sintetizza(a.testo, voce_id, a.rate, a.out)
        print(f"✓ {a.out}")


if __name__ == "__main__":
    main()
