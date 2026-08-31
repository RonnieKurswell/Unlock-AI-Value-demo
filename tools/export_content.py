"""Export every word the kiosk displays into a client-review workbook.

Reads the build's own content model, so what the client reviews is exactly what
a visitor sees — retyping it by hand is how the two drift apart. Re-run this
after any copy change, or the spreadsheet in the client's inbox is describing a
kiosk that no longer exists.

    python3 tools/export_content.py

Writes 'Unlock AI Value - content for client review.xlsx' to the repo root.
Requires openpyxl and node (to evaluate build/js/data.js).
"""
import json, datetime, os, subprocess, tempfile
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "Unlock AI Value - content for client review.xlsx")

# data.js is an ES module of plain literals; node is the only honest way to read
# it, and it keeps this export in step with the build automatically.
_dump = os.path.join(tempfile.gettempdir(), "uav_dump.mjs")
with open(_dump, "w", encoding="utf-8") as fh:
    fh.write("import * as D from %r;\n" % os.path.join(ROOT, "build/js/data.js")
             + "const o={};for(const[k,v]of Object.entries(D))o[k]=typeof v==='function'?'[fn]':v;"
               "process.stdout.write(JSON.stringify(o));")
D = json.loads(subprocess.check_output(["node", _dump], text=True))

NAME = {p["id"]: p["name"] for p in D["POOLS"]}
ORDER = [p["id"] for p in sorted(D["POOLS"], key=lambda p: p["edge"])]
BANDS = D["BANDS"]
RANGES = ["0-2", "3-5", "6-8", "9-10", "11-12"]
REVIEW = ["Approved? (Y/N)", "Revised copy", "Client comments"]

INK   = "1F3B57"
HEAD  = PatternFill("solid", fgColor=INK)
PEND  = PatternFill("solid", fgColor="FFF2CC")
ALT   = PatternFill("solid", fgColor="F4F7FA")
RCOL  = PatternFill("solid", fgColor="EAF3EA")
HFONT = Font(bold=True, color="FFFFFF", size=10)
THIN  = Side(style="thin", color="D6DEE6")
BOX   = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
TOP   = Alignment(vertical="top", wrap_text=True)

wb = Workbook()

def sheet(title, headers, widths, rows, notes=None, pending_col=None, freeze="A2"):
    ws = wb.create_sheet(title)
    r = 1
    if notes:
        for n in notes:
            c = ws.cell(row=r, column=1, value=n)
            c.font = Font(italic=True, size=9, color="6A7B8C")
            r += 1
        r += 1
    hrow = r
    for i, h in enumerate(headers, 1):
        c = ws.cell(row=hrow, column=i, value=h)
        c.fill = HEAD; c.font = HFONT
        c.alignment = Alignment(vertical="center", wrap_text=True)
        c.border = BOX
    ws.row_dimensions[hrow].height = 30
    nrev = len(REVIEW)
    first_rev = len(headers) - nrev + 1
    for j, row in enumerate(rows):
        rr = hrow + 1 + j
        for i, v in enumerate(row, 1):
            c = ws.cell(row=rr, column=i, value=v)
            c.alignment = TOP; c.border = BOX
            c.font = Font(size=10)
            if i >= first_rev:
                c.fill = RCOL
            elif pending_col is not None and row[pending_col]:
                c.fill = PEND
            elif j % 2:
                c.fill = ALT
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = ws.cell(row=hrow + 1, column=1)
    return ws

# ---------- 1. Read me ----------
ws = wb.active; ws.title = "Read me"
ws.column_dimensions["A"].width = 4
ws.column_dimensions["B"].width = 112
def line(t, style=None, r=[1]):
    c = ws.cell(row=r[0], column=2, value=t)
    c.alignment = Alignment(wrap_text=True, vertical="top")
    if style == "h1": c.font = Font(bold=True, size=17, color=INK)
    elif style == "h2": c.font = Font(bold=True, size=11, color=INK)
    elif style == "flag": c.font = Font(size=10, color="9C6500")
    else: c.font = Font(size=10)
    ws.row_dimensions[r[0]].height = None if style else 14
    r[0] += 1
    return r[0]

line("Unlock AI Value — content for client review", "h1")
line(f"Insurance kiosk · exported {datetime.date.today():%d %B %Y} from the build's content model", "flag")
line("")
line("What this is", "h2")
line("Every word the kiosk displays, pulled straight out of the build so what you review is what visitors read. One sheet per content type.")
line("")
line("How to give us changes", "h2")
line("Three columns on the right of every sheet, shaded green:")
line("    Approved? (Y/N)      leave blank if you have not looked at the row yet")
line("    Revised copy         paste the wording you want instead — full replacement, not a note")
line("    Client comments      anything that needs a conversation rather than a rewrite")
line("Do not edit the left-hand columns. We diff against them to find what moved.")
line("")
line("Where we still need content from Infosys", "h2")
line("These are gaps in the build today, not questions about wording. Highlighted amber on their sheets.")
line("    1.  Six of the eighteen proof tiles have no case study — marked 'Infosys to supply'. Physical AI has no case studies at all; AI Trust has one of three; Agentic Legacy Modernization has two of three. See 'Proof tiles'.")
line("    2.  Benchmark medians are illustrative placeholders, not Infosys research. See 'Benchmark'.")
line("    3.  The QR code on the final screen points nowhere yet. We need the destination URL.")
line("    4.  The five-year forecast columns present today's case studies under future-dated headings. Flag if that framing is a problem.")
line("")
line("Sheet guide", "h2")
for t, d in [
    ("Diagnostic questions", "18 questions, 5 answers each (90 rows). Answer wording and the score behind each answer."),
    ("Value pools",          "The six pools — name, verb, description, three supporting facts."),
    ("Proof tiles",          "18 case-study tiles, 3 per pool. Six are unfilled."),
    ("Score band feedback",  "30 report blocks — what each score band tells a visitor, and the recommended move."),
    ("Archetypes",           "Five overall positions a visitor can land in."),
    ("Role futures",         "How each role changes, matched from the badge."),
    ("Benchmark",            "Industry median per pool. Placeholder data."),
    ("Forecast lines",       "The three five-year outlook captions."),
    ("Screen copy",          "Headlines, buttons and instructional text that is not pool-specific."),
]:
    c = ws.cell(row=line.__defaults__[1][0], column=2)
    line(f"    {t:22}  {d}")

# ---------- 2. Diagnostic questions ----------
rows = []
for pid in ORDER:
    for qi, q in enumerate(D["QUESTIONS"][pid], 1):
        ref = f"{pid[:3].upper()}-{qi}"
        for oi, (lab, desc, score) in enumerate(q["opts"], 1):
            rows.append([
                NAME[pid], ref, q["kind"],
                q["q"] if oi == 1 else "",
                "Yes" if q.get("allowExplain") and oi == 1 else "",
                oi, lab, desc, score, "", "", ""
            ])
sheet("Diagnostic questions",
      ["Value pool", "Q ref", "Theme", "Question", "Free-text option?", "#",
       "Answer (shown large)", "Answer detail (shown small)", "Score"] + REVIEW,
      [20, 8, 20, 52, 11, 4, 26, 46, 6, 13, 42, 34], rows,
      notes=["18 questions, 3 per pool, 5 answers each. Score drives the result: 4 = most mature, 0 = no capability. "
             "The question text appears once per group of five answers.",
             "If you change an answer, keep it to about three words — the kiosk renders it at display size."])

# ---------- 3. Value pools ----------
rows = [[NAME[p["id"]], p["verb"], " / ".join(p["lines"]), p["blurb"],
         p["facts"][0], p["facts"][1], p["facts"][2], "", "", ""]
        for p in sorted(D["POOLS"], key=lambda p: p["edge"])]
sheet("Value pools",
      ["Value pool", "Verb", "Board label", "Description", "Fact 1", "Fact 2", "Fact 3"] + REVIEW,
      [22, 14, 26, 60, 40, 40, 40, 13, 42, 34], rows,
      notes=["Shown when a visitor taps a pool on the hexagon. Platform names here are load-bearing — flag any that are wrong or renamed."])

# ---------- 4. Proof tiles ----------
rows = []
for pid in ORDER:
    for t in D["TILES"][pid]:
        p = bool(t.get("pending"))
        rows.append([NAME[pid], "NEEDS CONTENT" if p else "Ready",
                     t.get("client", ""), t.get("title", ""), t.get("metric", ""),
                     t.get("detail", ""), "", "", "", p])
ws = sheet("Proof tiles",
      ["Value pool", "Status", "Client", "Tile title", "Headline metric", "Detail"] + REVIEW + ["_p"],
      [22, 15, 20, 28, 30, 66, 13, 42, 34, 3], rows, pending_col=9,
      notes=["Three per pool. Amber rows have no case study — we need client name, metric and one or two lines of detail, "
             "or permission to drop the tile.",
             "Named carriers appear on a public show floor. Confirm each one is cleared for use."])
ws.column_dimensions["J"].hidden = True

# ---------- 5. Score band feedback ----------
rows = []
for pid in ORDER:
    for bi, blk in enumerate(D["BAND_COPY"][pid]):
        rows.append([NAME[pid], BANDS[bi], RANGES[bi], blk["read"], blk["move"], "", "", ""])
sheet("Score band feedback",
      ["Value pool", "Band", "Score range", "What we tell them ('the read')", "What we recommend ('the move')"] + REVIEW,
      [22, 15, 11, 62, 72, 13, 42, 34], rows,
      notes=["The report body. A visitor sees one row per pool — whichever band their score falls into. 12 is the max per pool.",
             "This is where Infosys is making a recommendation to a prospect, so it is the highest-risk copy on the kiosk."])

# ---------- 6. Archetypes ----------
rows = [[a["name"], a["tag"], a["body"], a["risk"], "", "", ""]
        for a in D["ARCHETYPES"].values()]
sheet("Archetypes",
      ["Archetype", "Strapline", "Body", "Risk line"] + REVIEW,
      [24, 30, 76, 72, 13, 42, 34], rows,
      notes=["The visitor's overall position, chosen from their six pool scores. One of five."])

# ---------- 7. Role futures ----------
rows = [[", ".join(r["match"]), r["from"], r["to"],
         ", ".join(NAME[f] for f in r["focus"]), r["change"], "", "", ""]
        for r in D["ROLES"]]
rd = D["ROLE_DEFAULT"]
rows.append(["(fallback — no keyword match)", rd["from"], rd["to"],
             ", ".join(NAME[f] for f in rd["focus"]), rd["change"], "", "", ""])
sheet("Role futures",
      ["Badge keyword match", "Role today", "Role in five years", "Focus pools", "How the role changes"] + REVIEW,
      [30, 24, 30, 40, 76, 13, 42, 34], rows,
      notes=["Matched from the job title on the visitor's badge. Keywords are matched as substrings, case-insensitive.",
             "Telling someone their job changes is the most personal claim the kiosk makes. Worth a close read."])

# ---------- 8. Benchmark ----------
rows = [[NAME[pid], D["BENCHMARK_MEDIAN"][pid], D["MAX_POOL_SCORE"], "", "", "", True]
        for pid in ORDER]
ws = sheet("Benchmark",
      ["Value pool", "Industry median (placeholder)", "Max score"] + REVIEW + ["_p"],
      [24, 26, 11, 13, 42, 34, 3], rows, pending_col=6,
      notes=[f"Kiosk currently labels this: \"{D['BENCHMARK_STATUS']}\"",
             "Every figure here is a placeholder we invented for layout. Replace with Infosys research, or we keep the "
             "'illustrative' label on the screen."])
ws.column_dimensions["G"].hidden = True

# ---------- 9. Forecast lines ----------
LBL = {"compounding": "Pools where they score well", "exposed": "Pools where they score badly",
       "holding": "Pools in the middle"}
rows = [[LBL.get(k, k), k, v, "", "", ""] for k, v in D["FORECAST_LINES"].items()]
sheet("Forecast lines",
      ["Applies to", "Key", "Caption"] + REVIEW,
      [34, 16, 86, 13, 42, 34], rows,
      notes=["Captions on the five-year view."])

# ---------- 10. Screen copy ----------
SCREEN = [
 ("Attract", "Eyebrow", "AI-First Value Framework"),
 ("Attract", "Headline", "Are you ready to unlock your AI Value?"),
 ("Attract", "Subhead", "Three minutes. Six value pools. One blueprint."),
 ("Attract", "Touch cue", "Touch to begin"),
 ("All screens", "Brand line", "Unlock AI Value in Insurance"),
 ("Framework screen", "Eyebrow", "An Infosys framework"),
 ("Framework screen", "Headline", "Six pools of AI value in insurance"),
 ("Framework screen", "Lede", "Infosys' own model for insurance, not an industry standard. Each pool "
                              "is somewhere AI creates measurable value for carriers, and somewhere "
                              "programmes commonly stall."),
 ("Framework screen", "Gist \u2014 AI Strategy & Engineering", "One operating model, instead of pilots scattered across the business"),
 ("Framework screen", "Gist \u2014 Data for AI", "Policy, claims and treaty data made AI-ready and audit-ready"),
 ("Framework screen", "Gist \u2014 Process AI", "Whole journeys redesigned, not task-level automation inside old ones"),
 ("Framework screen", "Gist \u2014 Agentic Legacy Modernization", "Core platforms modernised module by module, while the book stays live"),
 ("Framework screen", "Gist \u2014 Physical AI", "Telematics, IoT and drone data as a pricing and claims input"),
 ("Framework screen", "Gist \u2014 AI Trust", "Explainability, bias testing and audit trails built in from the start"),
 ("Framework screen", "Button", "Explore the six pools"),
 ("Explore", "Instruction", "Tap a value pool to explore"),
 ("Diagnostic", "Progress", "01 / 18"),
 ("Identify", "Headline", "Tap your badge"),
 ("Identify", "Lede", "Your badge carries your role, so the blueprint fits your job."),
 ("Identify", "Reader state", "Waiting for badge"),
 ("Identify", "Button", "Enter email manually"),
 ("Identify", "Button", "See my results"),
 ("Identify", "Button", "Cancel"),
 ("Results 1", "Eyebrow", "Your position"),
 ("Results 2", "Eyebrow", "Where you lead, where you lag"),
 ("Results 2", "Headline", "Against the benchmark"),
 ("Results 3", "Eyebrow", "And your role"),
 ("Results 3", "Source note", "Matched from your badge · playbook workforce transformation table"),
 ("Results 3", "Eyebrow", "The human constraint"),
 ("Results 3", "Body", "The people most affected by AI are the domain experts who make it work. A team can have the model and "
                       "still not trust it over decades of manual judgment — which is why the carriers that scale it own "
                       "governance at board level and reward AI-enabled outcomes."),
 ("Results 4", "Eyebrow", "Five-year view"),
 ("Results 4", "Headline", "Where the gap goes"),
 ("Results 4", "Lede", "Unchanged, this is your five-year position."),
 ("Done", "Eyebrow", "Report dispatched"),
 ("Done", "Headline", "On its way"),
 ("Done", "Body", "Sent to [email]. Three ways to get it back:"),
 ("Done", "Step 1", "Scan the code above"),
 ("Done", "Step 2", "Open the email we just sent"),
 ("Done", "Step 3", "Scan your badge at the booth to see and discuss your result"),
]
rows = [[s, k, t, "", "", ""] for s, k, t in SCREEN]
sheet("Screen copy",
      ["Screen", "Element", "Text"] + REVIEW,
      [16, 16, 86, 13, 42, 34], rows,
      notes=["Fixed copy that is not pool- or score-specific. Square brackets are filled in live by the kiosk."])

wb.save(OUT)
print("saved:", OUT)
print("sheets:", ", ".join(wb.sheetnames))
