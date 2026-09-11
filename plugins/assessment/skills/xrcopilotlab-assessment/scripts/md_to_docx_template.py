#!/usr/bin/env python3
"""Converte un Markdown in .docx iniettando il contenuto in un template Office
(eredita stili, tema e font del template, es. Aptos). Riusa il frontespizio del
template se contiene i segnaposto [Document title] / [Document subtitle] / [Year].

Uso:
  python md_to_docx_template.py INPUT.md OUTPUT.docx \
      --template assets/template.docx \
      --title "Titolo" --subtitle "Sottotitolo" --year "Giugno 2026"

Markdown supportato: #/##/### heading, paragrafi, liste - e 1., tabelle |..|,
blocchi ``` ```, immagini ![](path.png), --- , **bold** *ita* `code`, [testo](url).
I diagrammi vanno inclusi come immagini PNG con ![](path) (renderizza prima i mermaid,
es. con Graphviz/mmdc, poi referenziali). Le tabelle larghe (>4 colonne o celle-frase)
è meglio scriverle in prosa: vedi SKILL.md.
"""
import argparse, os, re, shutil, struct, subprocess, html, tempfile

ap=argparse.ArgumentParser()
ap.add_argument("input"); ap.add_argument("output")
ap.add_argument("--template", required=True)
ap.add_argument("--title", default=""); ap.add_argument("--subtitle", default="")
ap.add_argument("--year", default="")
ap.add_argument("--author", default="Hevolus")
A=ap.parse_args()

CONTENT_W=9360; IMG_CAP_EMU=int(6.3*914400)
md=open(A.input,encoding="utf-8").read()
base=os.path.dirname(os.path.abspath(A.input))

pkg=tempfile.mkdtemp(prefix="docxpkg_")
subprocess.run(["bash","-c",f'cd "{pkg}" && unzip -oq "{os.path.abspath(A.template)}"'],check=True)
os.makedirs(f"{pkg}/word/media",exist_ok=True)

doc=open(f"{pkg}/word/document.xml",encoding="utf-8").read()
header=doc[:doc.index("<w:body>")]+"<w:body>"
cover=doc[doc.index("<w:body>")+len("<w:body>"):doc.index("<w:sectPr")]
sectpr=re.search(r"<w:sectPr.*?</w:sectPr>",doc,re.S).group(0)
# sostituisci l'autore del template (campo legato ai metadati) con --author
import re as _re
_core=f"{pkg}/docProps/core.xml"
_orig_author=None
if os.path.exists(_core):
    _t=open(_core,encoding="utf-8").read()
    _m=_re.search(r"<dc:creator>([^<]*)</dc:creator>",_t)
    _orig_author=_m.group(1) if _m else None
if _orig_author and A.author:
    for _cf in ("docProps/core.xml","docProps/app.xml"):
        _p=f"{pkg}/{_cf}"
        if os.path.exists(_p):
            _tt=open(_p,encoding="utf-8").read().replace(_orig_author, html.escape(A.author,quote=False))
            open(_p,"w",encoding="utf-8").write(_tt)
    cover=cover.replace(_orig_author, html.escape(A.author,quote=False))
has_ph = "[Document title]" in cover
if has_ph:
    cover=(cover.replace("[Document title]", html.escape(A.title,quote=False))
                .replace("[Document subtitle]", html.escape(A.subtitle,quote=False))
                .replace("[Year]", html.escape(A.year,quote=False)))
else:
    cover=""  # niente frontespizio nel template: creeremo Title/Subtitle sotto

def esc(t): return html.escape(t,quote=False)
def png_size(p):
    b=open(p,"rb").read(); return struct.unpack(">II",b[16:24])

rel_entries=[]; media={}
def add_image(src):
    p=src if os.path.isabs(src) else os.path.join(base,src)
    if p in media: return media[p],p
    n=len(media)+1; fn=f"img{n}.png"; shutil.copy(p,f"{pkg}/word/media/{fn}")
    rid=f"rIdI{n}"; rel_entries.append(f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/{fn}"/>')
    media[p]=rid; return rid,p

def runs(text):
    text=re.sub(r"\[([^\]]+)\]\(([^)]+)\)",r"\1",text).replace("***","**")
    base_i=False
    if re.match(r"^\*[^*].*\*$",text.strip()) and not text.strip().startswith("**"):
        text=text.strip()[1:-1]; base_i=True
    out=[]; pat=re.compile(r"(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)"); last=0
    def emit(s,b=False,i=False,c=False):
        if not s: return
        rpr=""
        if b: rpr+="<w:b/>"
        if i or base_i: rpr+="<w:i/>"
        if c: rpr+='<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:color w:val="C7254E"/>'
        out.append(f'<w:r><w:rPr>{rpr}</w:rPr><w:t xml:space="preserve">{esc(s)}</w:t></w:r>')
    for m in pat.finditer(text):
        emit(text[last:m.start()]); tok=m.group(0)
        if tok.startswith("**"): emit(tok[2:-2],b=True)
        elif tok.startswith("`"): emit(tok[1:-1],c=True)
        else: emit(tok[1:-1],i=True)
        last=m.end()
    emit(text[last:])
    return "".join(out) or "<w:r><w:t/></w:r>"

body=[]; first_h1=[True]
def _hrun(text,sz):
    t=esc(re.sub(r"[*`]","",text))
    return f'<w:r><w:rPr><w:b/><w:sz w:val="{sz}"/><w:szCs w:val="{sz}"/></w:rPr><w:t xml:space="preserve">{t}</w:t></w:r>'
def heading(lv,text):
    sz={1:36,2:28,3:24}.get(lv,24)
    if lv==1:
        pb="" if first_h1[0] else "<w:pageBreakBefore/>"; first_h1[0]=False
        body.append(f'<w:p><w:pPr><w:pStyle w:val="Heading1"/>{pb}</w:pPr>{_hrun(text,sz)}</w:p>')
    else:
        body.append(f'<w:p><w:pPr><w:pStyle w:val="Heading{min(lv,3)}"/></w:pPr>{_hrun(text,sz)}</w:p>')
def para(text,style=None):
    ppr=f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ""
    body.append(f"<w:p>{ppr}{runs(text)}</w:p>")
def li(text,numid):
    body.append(f'<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="{numid}"/></w:numPr><w:spacing w:after="80"/></w:pPr>{runs(text)}</w:p>')
def code(text):
    ps="".join(f'<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="17"/><w:color w:val="333333"/></w:rPr><w:t xml:space="preserve">{esc(l) if l else " "}</w:t></w:r></w:p>' for l in text.split("\n"))
    body.append('<w:tbl><w:tblPr><w:tblStyle w:val="TableNormal"/><w:tblW w:w="9360" w:type="dxa"/><w:tblBorders>'+"".join(f'<w:{e} w:val="single" w:sz="4" w:space="0" w:color="D9D9D9"/>' for e in ["top","left","bottom","right"])+'</w:tblBorders><w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:left w:w="180" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:right w:w="180" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="9360"/></w:tblGrid>'+f'<w:tr><w:tc><w:tcPr><w:tcW w:w="9360" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F4F4F4"/></w:tcPr>{ps}</w:tc></w:tr></w:tbl>')
    body.append('<w:p><w:pPr><w:spacing w:after="80"/></w:pPr></w:p>')
def table(rows):
    nc=max(len(r) for r in rows); cw=CONTENT_W//nc
    grid="".join(f'<w:gridCol w:w="{cw}"/>' for _ in range(nc)); trs=[]
    for ri,r in enumerate(rows):
        cells=[]
        for ci in range(nc):
            txt=(r[ci] if ci<len(r) else "").replace("<br/>"," ").replace("<br>"," ")
            fill="E8E8EE" if ri==0 else ("F7F7F7" if ri%2==0 else "FFFFFF")
            inner=f'<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">{esc(txt.replace("**",""))}</w:t></w:r>' if ri==0 else runs(txt)
            cells.append(f'<w:tc><w:tcPr><w:tcW w:w="{cw}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="{fill}"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr>{inner}</w:p></w:tc>')
        hdr='<w:trPr><w:tblHeader/></w:trPr>' if ri==0 else ''
        trs.append(f'<w:tr>{hdr}{"".join(cells)}</w:tr>')
    body.append('<w:tbl><w:tblPr><w:tblStyle w:val="TableNormal"/><w:tblW w:w="9360" w:type="dxa"/><w:tblBorders>'+"".join(f'<w:{e} w:val="single" w:sz="4" w:space="0" w:color="DCDCDC"/>' for e in ["top","left","bottom","right","insideH","insideV"])+'</w:tblBorders><w:tblCellMar><w:top w:w="90" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tblCellMar></w:tblPr>'+f'<w:tblGrid>{grid}</w:tblGrid>{"".join(trs)}</w:tbl>')
    body.append('<w:p><w:pPr><w:spacing w:after="80"/></w:pPr></w:p>')
def image(src):
    rid,p=add_image(src); w,h=png_size(p); cx=int(w*9525); cy=int(h*9525)
    if cx>IMG_CAP_EMU: r=IMG_CAP_EMU/cx; cx=int(cx*r); cy=int(cy*r)
    d=len(media)
    body.append('<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="160"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">'
      f'<wp:extent cx="{cx}" cy="{cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="{d}" name="img{d}"/>'
      '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>'
      '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
      '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
      f'<pic:nvPicPr><pic:cNvPr id="{d}" name="img{d}"/><pic:cNvPicPr/></pic:nvPicPr>'
      f'<pic:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
      f'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
      '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>')

if not has_ph and (A.title or A.subtitle):
    if A.title: body.append(f'<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t xml:space="preserve">{esc(A.title)}</w:t></w:r></w:p>')
    if A.subtitle: body.append(f'<w:p><w:pPr><w:pStyle w:val="Subtitle"/></w:pPr><w:r><w:t xml:space="preserve">{esc(A.subtitle)}</w:t></w:r></w:p>')
    body.append('<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>')

def _join_softwrap(text):
    """Unisce le righe di continuazione (soft-wrap) dentro paragrafi ed elenchi,
    così un punto elenco scritto su più righe resta un unico elemento. Rispetta i
    blocchi di codice ``` e non tocca heading/tabelle/immagini/hr/citazioni/blank."""
    def is_block(l):
        s=l.lstrip()
        return (l.strip()=="" or s.startswith("#") or re.match(r"^[-*]\s",s) or
                re.match(r"^\d+\.\s",s) or s.startswith("|") or s.startswith("```") or
                s.startswith(">") or l.strip()=="---" or re.match(r"^!\[",s))
    out=[]; in_code=False
    for l in text.split("\n"):
        if l.startswith("```"): in_code=not in_code; out.append(l); continue
        if in_code: out.append(l); continue
        if not is_block(l) and out and out[-1].strip()!="" and not out[-1].startswith("```"):
            # continuazione: accoda alla riga precedente (se non è blank/code)
            prev=out[-1]
            if not (prev.lstrip().startswith("|")):  # non unire a righe di tabella
                out[-1]=prev.rstrip()+" "+l.strip(); continue
        out.append(l)
    return "\n".join(out)

md=_join_softwrap(md)
# ---- parse markdown ----
lines=md.split("\n"); i=0
if lines and lines[0].strip()=="---":
    i=1
    while i<len(lines) and lines[i].strip()!="---": i+=1
    i+=1
# salta la testa del file (titolo + descrizione) fino alla prima sezione "## ":
# il titolo vive nel frontespizio, la descrizione è solo per il .md
if any(l.startswith("## ") for l in lines[i:]):
    while i<len(lines) and not lines[i].startswith("## "): i+=1
while i<len(lines):
    L=lines[i]
    if L.startswith("```"):
        j=i+1; buf=[]
        while j<len(lines) and not lines[j].startswith("```"): buf.append(lines[j]); j+=1
        code("\n".join(buf)); i=j+1; continue
    m=re.match(r"^(#{1,3})\s+(.*)$",L)
    if m:
        title=m.group(2).strip()
        if re.match(r"^(indice|sommario)\b", title, re.I):   # salta sommario e il suo elenco
            i+=1
            while i<len(lines) and not re.match(r"^#{1,3}\s+", lines[i]): i+=1
            continue
        heading(len(m.group(1)),title); i+=1; continue
    if L.strip()=="---": i+=1; continue   # niente linee orizzontali
    im=re.match(r"^!\[[^\]]*\]\(([^)]+)\)",L)
    if im: image(im.group(1)); i+=1; continue
    if L.startswith("|"):
        rows=[]
        while i<len(lines) and lines[i].startswith("|"):
            cs=[c.strip() for c in lines[i].strip().strip("|").split("|")]
            if not all(re.fullmatch(r":?-{2,}:?",c) for c in cs): rows.append(cs)
            i+=1
        table(rows); continue
    if re.match(r"^\s*[-*]\s+",L): li(re.sub(r"^\s*[-*]\s+","",L),2); i+=1; continue
    if re.match(r"^\s*\d+\.\s+",L): li(re.sub(r"^\s*\d+\.\s+","",L),1); i+=1; continue
    if L.startswith("> "): para(L[2:],style="Quote"); i+=1; continue
    if L.strip(): para(L.strip())
    i+=1

open(f"{pkg}/word/document.xml","w",encoding="utf-8").write(header+cover+"".join(body)+sectpr+"</w:body></w:document>")

# numbering
open(f"{pkg}/word/numbering.xml","w",encoding="utf-8").write('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="&#8226;"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>')
rels=open(f"{pkg}/word/_rels/document.xml.rels",encoding="utf-8").read()
if "numbering.xml" not in rels:
    rels=rels.replace("</Relationships>",'<Relationship Id="rIdNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>')
rels=rels.replace("</Relationships>","".join(rel_entries)+"</Relationships>")
open(f"{pkg}/word/_rels/document.xml.rels","w",encoding="utf-8").write(rels)
ct=open(f"{pkg}/[Content_Types].xml",encoding="utf-8").read()
if 'Extension="png"' not in ct: ct=ct.replace("</Types>",'<Default Extension="png" ContentType="image/png"/></Types>')
if "numbering.xml" not in ct: ct=ct.replace("</Types>",'<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>')
open(f"{pkg}/[Content_Types].xml","w",encoding="utf-8").write(ct)

tmp_out="/tmp/_mdtpl_out.docx"
if os.path.exists(tmp_out): os.remove(tmp_out)
subprocess.run(["bash","-c",f'cd "{pkg}" && zip -Xrq "{tmp_out}" "[Content_Types].xml" _rels docProps word'],check=True)
shutil.copy(tmp_out,A.output)
print("Scritto",A.output)
