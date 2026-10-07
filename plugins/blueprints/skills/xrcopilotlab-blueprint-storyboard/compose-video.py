#!/usr/bin/env python3
"""Monta la voce sul video registrato.

Un elenco di «momenti» [{t, text, mp3}]: `t` è l'istante del video in cui comincia ciò che la battuta
racconta, `mp3` la sua voce già sintetizzata. Il video si taglia in segmenti da un momento al
successivo; in ognuno parte la voce (con un piccolo anticipo). Se la voce è più lunga del segmento si
tiene fermo l'ultimo fotogramma finché ha finito: il video non va mai accelerato né la voce tagliata.
Alla fine i segmenti si concatenano in un MP4 solo, leggero (15 fotogrammi al secondo: è uno schermo).
"""
import json, os, subprocess, sys, tempfile

LEAD = 0.35      # la voce parte un attimo dopo l'inizio del segmento
TAIL = 0.45      # respiro dopo l'ultima parola
FPS = 15


def dur(path):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))


def run(*args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


def compose(video, items, out, crf=31, work=None):
    work = work or tempfile.mkdtemp(prefix="compose-")
    total = dur(video)
    items = sorted(items, key=lambda i: i["t"])
    if items[0]["t"] > 0.05:                       # prima del primo momento: video senza voce
        items.insert(0, {"t": 0.0, "text": "", "mp3": None})
    parts, listing = [], []
    held = 0.0
    for n, it in enumerate(items):
        start = it["t"]
        end = items[n + 1]["t"] if n + 1 < len(items) else total
        vlen = max(0.2, end - start)
        alen = dur(it["mp3"]) if it["mp3"] else 0.0
        need = alen + LEAD + TAIL if it["mp3"] else 0.0
        extra = max(0.0, need - vlen)              # fotogramma fermo in coda
        held += extra
        seg = os.path.join(work, f"seg{n:03d}.mp4")
        vf = f"fps={FPS},scale=1920:1080,format=yuv420p"
        if extra > 0.01:
            vf += f",tpad=stop_mode=clone:stop_duration={extra:.3f}"
        seglen = vlen + extra
        if it["mp3"]:
            run("-ss", f"{start:.3f}", "-t", f"{vlen:.3f}", "-i", video, "-i", it["mp3"],
                "-filter_complex",
                f"[0:v]{vf}[v];[1:a]aresample=24000,adelay={int(LEAD*1000)}|{int(LEAD*1000)},apad=whole_dur={seglen:.3f}[a]",
                "-map", "[v]", "-map", "[a]", "-t", f"{seglen:.3f}",
                "-c:v", "libx264", "-crf", str(crf), "-preset", "veryfast", "-c:a", "aac", "-b:a", "48k", "-ac", "1", seg)
        else:
            run("-ss", f"{start:.3f}", "-t", f"{vlen:.3f}", "-i", video,
                "-f", "lavfi", "-t", f"{seglen:.3f}", "-i", "anullsrc=r=24000:cl=mono",
                "-filter_complex", f"[0:v]{vf}[v]", "-map", "[v]", "-map", "1:a", "-t", f"{seglen:.3f}",
                "-c:v", "libx264", "-crf", str(crf), "-preset", "veryfast", "-c:a", "aac", "-b:a", "48k", "-ac", "1", seg)
        parts.append(seg)
        listing.append(f"file '{seg}'")
    lst = os.path.join(work, "list.txt")
    open(lst, "w").write("\n".join(listing) + "\n")
    run("-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", out)
    return {"totale_s": round(dur(out), 1), "fermo_s": round(held, 1), "segmenti": len(parts),
            "mb": round(os.path.getsize(out) / 1048576, 1)}


if __name__ == "__main__":
    cfg = json.load(open(sys.argv[1]))
    print(json.dumps(compose(cfg["video"], cfg["items"], cfg["out"], cfg.get("crf", 31)), indent=1))
