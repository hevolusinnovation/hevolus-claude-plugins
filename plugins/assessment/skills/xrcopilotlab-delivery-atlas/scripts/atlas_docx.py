#!/usr/bin/env python3
"""Genera un .docx con lo stile Hevolus / Atlas Framework dei template (frontespizio con logo,
codice, titolo, sottotitolo, blocco Atlas Framework; intestazione con logo e «CODICE — Titolo»;
piè di pagina «Atlas Framework · Hevolus SRL · Pagina N»; Calibri, viola 5E4F9C, tabelle con
intestazione viola, riquadri lilla con bordo sinistro viola, nota di proprietà in chiusura).

Serve per gli artefatti di step che non hanno un template proprio: Agent Specification (D2.1/S.1),
verbale S.0, readiness D1.2, sintesi del workshop D1.6, e qualunque documento Atlas per cliente.
Per D2, D3, S1, O1 NON usarlo: compila il template vero con fill_template.py.

Uso:
  python atlas_docx.py INPUT.md OUTPUT.docx --codice "S.1" --titolo "Agent Specification — Agente Scadenze" \
     --sottotitolo "Perimetro, dati, autonomia e criteri di successo dell'agente." \
     --tipo "Documento per cliente · Bozza da firmare" --fase "Ramo SOW · Stage Frame" \
     --versione "Versione 0.1 · Ottobre 2026" [--indice] [--no-nota] [--base assets/templates/atlas_base.docx]

Markdown supportato (nel corpo, dopo l'eventuale «# Titolo» che viene ignorato):
  ## Titolo      → titolo di sezione (livello 1, viola, nell'indice)   es. «## 1. Scopo»
  ### Titolo     → livello 2 (nero)            #### Titolo → livello 3 (viola, piccolo)
  paragrafi con **grassetto**, *corsivo*, `codice`
  - elenco puntato           1. elenco numerato
  | a | b | tabelle         → intestazione viola, bordi DEDCE8, testo 10 pt
  > **Titolo riquadro**      → riquadro Atlas (lilla, bordo viola): la prima riga in grassetto
  > testo del riquadro          è il titolo; le righe «✓ ...» diventano voci di criterio
  ```                        → blocco di testo monospazio in riquadro grigio (bozze di prompt)
  ![didascalia](file.png)    → immagine centrata (larghezza max 16 cm)
  ---                        → interruzione di pagina
"""
import argparse, html, os, re, shutil, struct, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
DEF_BASE = os.path.join(HERE, "..", "assets", "templates", "atlas_base.docx")

VIOLA, SCURO, GRIGIO, TENUE, BORDO, LILLA = "5E4F9C", "23242B", "4B4D57", "83858F", "DEDCE8", "F3F2F8"
W_TOT = 9638

ap = argparse.ArgumentParser()
ap.add_argument("input"); ap.add_argument("output")
ap.add_argument("--codice", required=True); ap.add_argument("--titolo", required=True)
ap.add_argument("--sottotitolo", default="")
ap.add_argument("--tipo", default="Documento per cliente")
ap.add_argument("--fase", default="")
ap.add_argument("--versione", default="")
ap.add_argument("--indice", action="store_true")
ap.add_argument("--no-nota", action="store_true")
ap.add_argument("--base", default=DEF_BASE)
A = ap.parse_args()


def esc(t):
    return html.escape(t, quote=False)


def rpr(color=SCURO, sz=22, b=False, i=False, font="Calibri"):
    return (f'<w:rPr><w:rFonts w:ascii="{font}" w:cs="{font}" w:eastAsia="{font}" w:hAnsi="{font}"/>'
            + ("<w:b/><w:bCs/>" if b else "") + ("<w:i/><w:iCs/>" if i else "")
            + f'<w:color w:val="{color}"/><w:sz w:val="{sz}"/><w:szCs w:val="{sz}"/></w:rPr>')


def run(t, **k):
    return f'<w:r>{rpr(**k)}<w:t xml:space="preserve">{esc(t)}</w:t></w:r>'


INLINE = re.compile(r"(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)")


def runs(text, color=SCURO, sz=22, b=False):
    out = []
    for part in INLINE.split(text):
        if not part:
            continue
        if part.startswith("**") and part.endswith("**"):
            out.append(run(part[2:-2], color=color, sz=sz, b=True))
        elif part.startswith("`") and part.endswith("`"):
            out.append(run(part[1:-1], color=color, sz=sz - 2, b=b, font="Consolas"))
        elif part.startswith("*") and part.endswith("*") and len(part) > 2:
            out.append(run(part[1:-1], color=color, sz=sz, b=b, i=True))
        else:
            out.append(run(part, color=color, sz=sz, b=b))
    return "".join(out)


def para(inner, after=140, line=300, before=None, style=None, extra=""):
    ppr = (f'<w:pStyle w:val="{style}"/>' if style else "") + extra + \
          f'<w:spacing w:after="{after}"' + (f' w:before="{before}"' if before is not None else "") + \
          (f' w:line="{line}"' if line else "") + "/>"
    return f"<w:p><w:pPr>{ppr}</w:pPr>{inner}</w:p>"


def empty(after=200):
    return f'<w:p><w:pPr><w:spacing w:after="{after}"/></w:pPr></w:p>'


def page_break():
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def box(title, lines, mono=False):
    left = f'<w:left w:val="single" w:color="{VIOLA if not mono else BORDO}" w:sz="24"/>'
    fill = LILLA if not mono else "F6F6F8"
    ps = []
    if title:
        ps.append(para(run(title, color=VIOLA, sz=22, b=True), after=80, line=None))
    for l in lines:
        if mono:
            ps.append(para(run(l if l else " ", color=SCURO, sz=18, font="Consolas"), after=0, line=240))
        elif l.startswith("✓"):
            ps.append(para(run("✓ ", color=GRIGIO, sz=21, b=True) + runs(l[1:].strip(), color=GRIGIO, sz=21), after=60, line=280))
        else:
            ps.append(para(runs(l, color=GRIGIO, sz=21), after=60, line=280))
    return (f'<w:tbl><w:tblPr><w:tblW w:type="dxa" w:w="{W_TOT}"/></w:tblPr><w:tblGrid><w:gridCol w:w="{W_TOT}"/></w:tblGrid>'
            f'<w:tr><w:tc><w:tcPr><w:tcW w:type="dxa" w:w="{W_TOT}"/><w:tcBorders><w:top w:val="none" w:color="FFFFFF" w:sz="0"/>'
            f'{left}<w:bottom w:val="none" w:color="FFFFFF" w:sz="0"/><w:right w:val="none" w:color="FFFFFF" w:sz="0"/></w:tcBorders>'
            f'<w:shd w:fill="{fill}" w:color="auto" w:val="clear"/><w:tcMar><w:top w:type="dxa" w:w="140"/><w:left w:type="dxa" w:w="220"/>'
            f'<w:bottom w:type="dxa" w:w="140"/><w:right w:type="dxa" w:w="200"/></w:tcMar></w:tcPr>{"".join(ps)}</w:tc></w:tr></w:tbl>'
            + empty(200))


def table(rows):
    ncol = max(len(r) for r in rows)
    lens = [max(len(r[c]) if c < len(r) else 0 for r in rows) for c in range(ncol)]
    lens = [max(6, min(60, l)) for l in lens]
    widths = [int(W_TOT * l / sum(lens)) for l in lens]
    widths[-1] = W_TOT - sum(widths[:-1])
    borders = "".join(f'<w:{s} w:val="single" w:color="{BORDO}" w:sz="4"/>' for s in ("top", "left", "bottom", "right"))
    mar = '<w:tcMar><w:top w:type="dxa" w:w="90"/><w:left w:type="dxa" w:w="120"/><w:bottom w:type="dxa" w:w="90"/><w:right w:type="dxa" w:w="120"/></w:tcMar>'
    trs = []
    for ri, r in enumerate(rows):
        head = ri == 0
        tcs = []
        for c in range(ncol):
            txt = r[c] if c < len(r) else ""
            fill = VIOLA if head else (LILLA if ri % 2 == 0 else None)  # righe alterne come in D3/S1
            shd = f'<w:shd w:fill="{fill}" w:color="auto" w:val="clear"/>' if fill else ""
            inner = run(txt, color="FFFFFF", sz=20, b=True) if head else runs(txt, color=SCURO, sz=20)
            tcs.append(f'<w:tc><w:tcPr><w:tcW w:type="dxa" w:w="{widths[c]}"/><w:tcBorders>{borders}</w:tcBorders>{shd}{mar}'
                       f'<w:vAlign w:val="center"/></w:tcPr>{para(inner, after=40, line=260)}</w:tc>')
        trpr = "<w:trPr><w:tblHeader/></w:trPr>" if head else '<w:trPr><w:tblHeader w:val="false"/></w:trPr>'
        trs.append(f"<w:tr>{trpr}{''.join(tcs)}</w:tr>")
    grid = "".join(f'<w:gridCol w:w="{w}"/>' for w in widths)
    return (f'<w:tbl><w:tblPr><w:tblW w:type="dxa" w:w="{W_TOT}"/></w:tblPr><w:tblGrid>{grid}</w:tblGrid>{"".join(trs)}</w:tbl>'
            + empty(200))


# ------------------------------------------------------------------ pacchetto base
pkg = tempfile.mkdtemp(prefix="atlasdocx_")
subprocess.run(["unzip", "-oq", os.path.abspath(A.base), "-d", pkg], check=True)
docxml = open(f"{pkg}/word/document.xml", encoding="utf-8").read()
head_xml = docxml[:docxml.index("<w:body>") + len("<w:body>")]
body = docxml[docxml.index("<w:body>") + len("<w:body>"):]
sectpr = re.search(r"<w:sectPr.*?</w:sectPr>", body, re.S).group(0)
logo_p = re.match(r"\s*(<w:p>.*?</w:p>)", body, re.S).group(1)  # primo paragrafo: logo del frontespizio
if "<w:drawing>" not in logo_p:
    logo_p = ""

# intestazione: «\tCODICE — Titolo»
for hf in os.listdir(f"{pkg}/word"):
    if hf.startswith("header") and hf.endswith(".xml"):
        h = open(f"{pkg}/word/{hf}", encoding="utf-8").read()
        h = re.sub(r'(<w:t xml:space="preserve">)\t[^<]*(</w:t>)', lambda m: m.group(1) + "\t" + esc(f"{A.codice} — {A.titolo}") + m.group(2), h)
        open(f"{pkg}/word/{hf}", "w", encoding="utf-8").write(h)

rels_p = f"{pkg}/word/_rels/document.xml.rels"
rels = open(rels_p, encoding="utf-8").read()
ct_p = f"{pkg}/[Content_Types].xml"
ct = open(ct_p, encoding="utf-8").read()
num_p = f"{pkg}/word/numbering.xml"
numx = open(num_p, encoding="utf-8").read()
dec_abs = None
for m in re.finditer(r'<w:abstractNum [^>]*w:abstractNumId="(\d+)".*?</w:abstractNum>', numx, re.S):
    if re.search(r'<w:lvl w:ilvl="0".*?numFmt w:val="decimal"', m.group(0), re.S):
        dec_abs = m.group(1); break
bul_num = None
for nid, aid in re.findall(r'<w:num w:numId="(\d+)"[^>]*>\s*<w:abstractNumId w:val="(\d+)"', numx):
    a = re.search(rf'<w:abstractNum [^>]*w:abstractNumId="{aid}".*?</w:abstractNum>', numx, re.S).group(0)
    if re.search(r'<w:lvl w:ilvl="0".*?numFmt w:val="bullet"', a, re.S):
        bul_num = nid  # l'ultimo bullet definito è quello usato nei template (•)
next_num = [max(int(x) for x in re.findall(r'<w:num w:numId="(\d+)"', numx)) + 1]
new_nums = []


def new_decimal_list():
    nid = next_num[0]; next_num[0] += 1
    new_nums.append(f'<w:num w:numId="{nid}"><w:abstractNumId w:val="{dec_abs}"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>')
    return nid


img_n = [0]


def image(path, alt):
    src = path if os.path.isabs(path) else os.path.join(os.path.dirname(os.path.abspath(A.input)), path)
    if not os.path.exists(src):
        return para(run(f"[immagine mancante: {path}]", color=TENUE, sz=18, i=True))
    img_n[0] += 1
    ext = os.path.splitext(src)[1].lower().lstrip(".") or "png"
    name = f"atlas_img{img_n[0]}.{ext}"
    os.makedirs(f"{pkg}/word/media", exist_ok=True)
    shutil.copy(src, f"{pkg}/word/media/{name}")
    rid = f"rIdAtlasImg{img_n[0]}"
    global rels, ct
    rels = rels.replace("</Relationships>", f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/{name}"/></Relationships>')
    if f'Extension="{ext}"' not in ct:
        mime = "image/png" if ext == "png" else "image/jpeg"
        ct = ct.replace("</Types>", f'<Default Extension="{ext}" ContentType="{mime}"/></Types>')
    w, h = 1600, 900
    with open(src, "rb") as f:
        head = f.read(26)
        if head[:8] == b"\x89PNG\r\n\x1a\n":
            w, h = struct.unpack(">II", head[16:24])
    cx = min(int(16 * 360000), w * 9525); cy = int(cx * h / w)
    drawing = (f'<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{cx}" cy="{cy}"/><wp:docPr id="{100 + img_n[0]}" name="img{img_n[0]}" descr="{esc(alt)}"/>'
               f'<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
               f'<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="{name}"/><pic:cNvPicPr/></pic:nvPicPr>'
               f'<pic:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
               f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>')
    out = f'<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="80"/></w:pPr><w:r>{drawing}</w:r></w:p>'
    if alt:
        out += para(run(alt, color=TENUE, sz=18, i=True), after=200, line=None, extra='<w:jc w:val="center"/>')
    return out


# ------------------------------------------------------------------ frontespizio
X = []
if logo_p:
    X.append(logo_p)
X.append(para(run(A.codice, color=VIOLA, sz=26, b=True), after=120, line=None))
X.append(para(run(A.titolo, color=SCURO, sz=52, b=True), after=240, line=240))
if A.sottotitolo:
    X.append(para(run(A.sottotitolo, color=GRIGIO, sz=26), after=1800, line=300))
X.append(para(run("Atlas Framework", color=VIOLA, sz=22, b=True), after=60, line=None))
for t in (A.tipo, A.fase, A.versione, "Hevolus SRL"):
    if t:
        X.append(para(run(t, color=GRIGIO, sz=20), after=40, line=None))
X.append(page_break())
if A.indice:
    X.append(para(run("Indice", color=VIOLA, sz=34, b=True), after=160, before=420, line=None, style="Heading1"))
    X.append('<w:sdt><w:sdtPr><w:alias w:val="Indice"/></w:sdtPr><w:sdtContent><w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/>'
             '<w:instrText xml:space="preserve">TOC \\h \\o &quot;1-2&quot;</w:instrText><w:fldChar w:fldCharType="separate"/></w:r></w:p>'
             '<w:p><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:sdtContent></w:sdt>')
    X.append(page_break())

# ------------------------------------------------------------------ corpo
lines = open(A.input, encoding="utf-8").read().splitlines()
i = 0
if lines and lines[0].startswith("# "):
    i = 1
cur_num = None
while i < len(lines):
    l = lines[i]
    s = l.strip()
    if not s:
        cur_num = None; i += 1; continue
    if s.startswith("```"):
        buf = []; i += 1
        while i < len(lines) and not lines[i].strip().startswith("```"):
            buf.append(lines[i].rstrip()); i += 1
        i += 1
        X.append(box("", buf, mono=True)); continue
    if s.startswith(">"):
        buf = []
        while i < len(lines) and lines[i].strip().startswith(">"):
            buf.append(lines[i].strip()[1:].strip()); i += 1
        buf = [b for b in buf if b]
        title = ""
        if buf and re.fullmatch(r"\*\*[^*]+\*\*", buf[0]):
            title = buf.pop(0)[2:-2]
        X.append(box(title, buf)); continue
    if s.startswith("|"):
        rows = []
        while i < len(lines) and lines[i].strip().startswith("|"):
            cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
            if not all(re.fullmatch(r":?-{2,}:?", c) for c in cells):
                rows.append(cells)
            i += 1
        if rows:
            X.append(table(rows))
        continue
    m = re.match(r"(#{2,4})\s+(.*)", s)
    if m:
        lvl = len(m.group(1)) - 1
        if lvl == 1:
            X.append(para(run(m.group(2), color=VIOLA, sz=34, b=True), after=160, before=420, line=None, style="Heading1"))
        elif lvl == 2:
            X.append(para(run(m.group(2), color=SCURO, sz=26, b=True), after=120, before=300, line=None, style="Heading2"))
        else:
            X.append(para(run(m.group(2), color=VIOLA, sz=23, b=True), after=80, before=220, line=None, style="Heading3"))
        i += 1; continue
    if s == "---":
        X.append(page_break()); i += 1; continue
    m = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", s)
    if m:
        X.append(image(m.group(2), m.group(1))); i += 1; continue
    m = re.match(r"[-*]\s+(.*)", s)
    if m and bul_num:
        X.append(para(runs(m.group(1)), after=80, line=290, style="ListParagraph",
                      extra=f'<w:numPr><w:ilvl w:val="0"/><w:numId w:val="{bul_num}"/></w:numPr>'))
        i += 1; continue
    m = re.match(r"\d+[.)]\s+(.*)", s)
    if m and dec_abs:
        if cur_num is None:
            cur_num = new_decimal_list()
        X.append(para(runs(m.group(1)), after=80, line=290, style="ListParagraph",
                      extra=f'<w:numPr><w:ilvl w:val="0"/><w:numId w:val="{cur_num}"/></w:numPr>'))
        i += 1; continue
    buf = [s]; i += 1
    while i < len(lines) and lines[i].strip() and not re.match(r"(#{1,4}\s|[-*]\s|\d+[.)]\s|\||>|```|!\[|---$)", lines[i].strip()):
        buf.append(lines[i].strip()); i += 1
    X.append(para(runs(" ".join(buf))))

if not A.no_nota:
    X.append(empty(120))
    X.append(para(run("Atlas Framework è metodologia proprietaria di Hevolus SRL. Documento a uso interno e per i clienti del "
                      "programma; non è consentita la diffusione a terzi senza autorizzazione scritta.", color=TENUE, sz=18, i=True)))

open(f"{pkg}/word/document.xml", "w", encoding="utf-8").write(head_xml + "".join(X) + sectpr + "</w:body></w:document>")
if new_nums:
    numx = numx.replace("</w:numbering>", "".join(new_nums) + "</w:numbering>")
    open(num_p, "w", encoding="utf-8").write(numx)
open(rels_p, "w", encoding="utf-8").write(rels)
open(ct_p, "w", encoding="utf-8").write(ct)
# niente commenti del template di base
cm = f"{pkg}/word/comments.xml"
if os.path.exists(cm):
    c = open(cm, encoding="utf-8").read()
    c = re.sub(r"<w:comment .*?</w:comment>", "", c, flags=re.S)
    open(cm, "w", encoding="utf-8").write(c)
out = os.path.abspath(A.output)
if os.path.exists(out):
    os.remove(out)
subprocess.run(["bash", "-c", f'cd "{pkg}" && zip -qX "{out}" "[Content_Types].xml" && zip -qrX "{out}" . -x "[Content_Types].xml"'], check=True)
shutil.rmtree(pkg, ignore_errors=True)
print(f"Scritto {out}")
