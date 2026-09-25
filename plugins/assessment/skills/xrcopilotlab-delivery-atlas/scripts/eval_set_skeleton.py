#!/usr/bin/env python3
"""Crea lo scheletro dell'eval set (deliverable D2.2 / S.2) in .xlsx con i campi del Kit
Evaluate (Q1 §3.1) e le righe-traccia per categoria, da far compilare agli utenti del cliente.

Uso:
  python eval_set_skeleton.py OUTPUT.xlsx --agente "Nome agente" --casi 30 \
      [--failure "Inventare un dato assente" --failure "..."] [--metriche "Accuratezza per campo; ..."]

Distribuzione (Q1 §2.2): standard 60-70%, eccezioni 20-30%, avversari/fuori perimetro 10%.
Le righe contengono solo ID e categoria: input ed esito atteso li scrivono gli utenti.
Le failure mode critiche diventano casi a tolleranza zero precompilati nel campo «Failure mode».
"""
import argparse
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation

ap = argparse.ArgumentParser()
ap.add_argument("output")
ap.add_argument("--agente", required=True)
ap.add_argument("--casi", type=int, default=30)
ap.add_argument("--failure", action="append", default=[])
ap.add_argument("--metriche", default="")
a = ap.parse_args()
n = max(20, min(50, a.casi))

n_adv = max(2, round(n * 0.10))
n_exc = round(n * 0.25)
n_std = n - n_adv - n_exc
cats = ["Standard"] * n_std + ["Eccezione"] * n_exc + ["Avversario"] * (n_adv // 2 + n_adv % 2) + ["Fuori perimetro"] * (n_adv // 2)

wb = Workbook()
ws = wb.active
ws.title = "Eval set v1"
head = ["ID", "Categoria", "Input", "Esito atteso", "Criterio di pass", "Failure mode", "Fonte e data"]
ws.append(head)
# stile Atlas: Calibri, intestazione viola 5E4F9C, bordi DEDCE8, righe alterne F3F2F8
VIOLA, BORDO, LILLA, SCURO = "5E4F9C", "DEDCE8", "F3F2F8", "23242B"
side = Side(style="thin", color=BORDO)
BRD = Border(left=side, right=side, top=side, bottom=side)
for c in ws[1]:
    c.font = Font(name="Calibri", bold=True, color="FFFFFF", size=10)
    c.fill = PatternFill("solid", fgColor=VIOLA)
    c.alignment = Alignment(vertical="center")
    c.border = BRD
fm = list(a.failure)
for i, cat in enumerate(cats, 1):
    f = ""
    if cat in ("Avversario", "Fuori perimetro") and fm:
        f = fm.pop(0)
    ws.append([f"E{i:03d}", cat, "", "", "", f, ""])
for i, f in enumerate(fm, len(cats) + 1):  # failure mode rimaste: casi extra a tolleranza zero
    ws.append([f"E{i:03d}", "Avversario", "", "", "Rifiuta correttamente", f, ""])
for r_i, row in enumerate(ws.iter_rows(min_row=2), 2):
    for c in row:
        c.font = Font(name="Calibri", color=SCURO, size=10)
        c.border = BRD
        c.alignment = Alignment(vertical="top", wrap_text=True)
        if r_i % 2 == 1:
            c.fill = PatternFill("solid", fgColor=LILLA)
widths = [8, 16, 50, 50, 24, 36, 22]
for col, w in zip("ABCDEFG", widths):
    ws.column_dimensions[col].width = w
dv1 = DataValidation(type="list", formula1='"Standard,Eccezione,Avversario,Fuori perimetro"')
dv2 = DataValidation(type="list", formula1='"Esatto,Equivalente (giudizio),Contiene elementi obbligatori,Rifiuta correttamente"')
ws.add_data_validation(dv1); ws.add_data_validation(dv2)
dv1.add(f"B2:B{ws.max_row}"); dv2.add(f"E2:E{ws.max_row}")
ws.freeze_panes = "A2"

m = wb.create_sheet("Scheda metriche")
rows = [
    ("Agente", a.agente),
    ("Casi", f"{ws.max_row - 1} (standard {n_std}, eccezioni {n_exc}, avversari/fuori perimetro {n_adv})"),
    ("Metrica primaria", a.metriche or "[da concordare con il process owner — vedi Q1 §3.2]"),
    ("Soglia di pass rate per il Pilot", "[tipicamente ≥ 90% — da concordare per iscritto]"),
    ("Failure mode critiche", "; ".join(a.failure) or "[da elencare nel Frame]"),
    ("Tolleranza sulle failure mode", "zero"),
    ("Chi compila input ed esito atteso", "Gli utenti del cliente (Hevolus facilita)"),
]
for r in rows:
    m.append(r)
m.column_dimensions["A"].width = 34
m.column_dimensions["B"].width = 90
for row in m.iter_rows():
    for c in row:
        c.font = Font(name="Calibri", color=SCURO, size=10, bold=(c.column == 1))
        c.border = BRD
        c.alignment = Alignment(vertical="top", wrap_text=True)
    row[0].fill = PatternFill("solid", fgColor=LILLA)
wb.save(a.output)
print(f"Salvato: {a.output} ({ws.max_row - 1} casi)")
