"""
Generatore PDF premium per i documenti di consegna demo "Liberi di Essere" (BnsStudio).

Trasforma i due markdown editoriali in PDF impaginati con identità BnsStudio:
- eyebrow uppercase con tracking
- titoli importanti
- numerazione 01 / 02 / 03 ...
- box informativi (SUGGERIMENTO / DA RICORDARE / ...)
- footer con brand e numero pagina
- righe per la scrittura a penna nel documento di feedback

Uso:
    python3 docs/consegna-demo/build_pdf.py
"""
from __future__ import annotations

import re
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

HERE = Path(__file__).resolve().parent
LOGO = HERE / "assets" / "bnsstudio-logo.png"
COVER_FOOTER = "Demo valida fino al 31 Luglio"

# Font display Phonk per i titoli di copertina (con fallback a Helvetica-Bold).
PHONK_FONT = HERE / "assets" / "Phonk-Regular-DEMO.otf"
try:
    pdfmetrics.registerFont(TTFont("Phonk", str(PHONK_FONT)))
    COVER_TITLE_FONT = "Phonk"
except Exception:
    COVER_TITLE_FONT = "Helvetica-Bold"

# Palette allineata a src/config/salonConfig.ts
BRAND = colors.HexColor("#2f665f")       # verde salvia scuro
BRAND_DEEP = colors.HexColor("#22433f")  # verde profondo per titoli
ACCENT = colors.HexColor("#b9795f")      # cipria/terracotta (leggibile su bianco)
INK = colors.HexColor("#2f3632")         # testo
MUTE = colors.HexColor("#7c847f")        # testo attenuato
LINE = colors.HexColor("#d9d2ca")        # filetti
BOX_BG = colors.HexColor("#f4f1ec")      # sfondo box
RULE_WRITE = colors.HexColor("#c9c2b8")  # righe per scrittura

DOCS = [
    {
        "src": "Guida-Demo.md",
        "out": "Liberi-di-Essere_Guida-Demo.pdf",
        "page_title": "Guida all'utilizzo della Demo",
        "cover_title": "GUIDA ALLA DEMO",
        "cover_subtitle": "Sviluppata per Liberi di essere",
    },
    {
        "src": "Raccolta-Feedback.md",
        "out": "Liberi-di-Essere_Raccolta-Feedback.pdf",
        "page_title": "Raccolta Feedback",
        "cover_title": "RACCOLTA FEEDBACK",
        "cover_subtitle": "Per la demo di Liberi di essere",
    },
]


def styles() -> dict[str, ParagraphStyle]:
    return {
        "eyebrow": ParagraphStyle(
            "eyebrow", fontName="Helvetica-Bold", fontSize=8.5, leading=12,
            textColor=ACCENT, spaceAfter=6,
        ),
        "title": ParagraphStyle(
            "title", fontName="Helvetica-Bold", fontSize=27, leading=31,
            textColor=BRAND_DEEP, spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "subtitle", fontName="Helvetica-Oblique", fontSize=12.5, leading=17,
            textColor=ACCENT, spaceAfter=12,
        ),
        "meta": ParagraphStyle(
            "meta", fontName="Helvetica", fontSize=9.5, leading=15, textColor=MUTE,
        ),
        "section": ParagraphStyle(
            "section", fontName="Helvetica-Bold", fontSize=14, leading=18,
            textColor=BRAND_DEEP, spaceBefore=12, spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body", fontName="Helvetica", fontSize=10.5, leading=15,
            textColor=INK, spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "bullet", fontName="Helvetica", fontSize=10.5, leading=15,
            textColor=INK, leftIndent=15, firstLineIndent=-9, spaceAfter=2,
        ),
        "caption": ParagraphStyle(
            "caption", fontName="Helvetica-Oblique", fontSize=10, leading=14,
            textColor=MUTE, spaceAfter=6,
        ),
        "big_url": ParagraphStyle(
            "big_url", fontName="Helvetica-Bold", fontSize=15, leading=20,
            textColor=BRAND, spaceAfter=6,
        ),
        "box_label": ParagraphStyle(
            "box_label", fontName="Helvetica-Bold", fontSize=8.5, leading=12,
            textColor=ACCENT, spaceAfter=4,
        ),
        "box_body": ParagraphStyle(
            "box_body", fontName="Helvetica", fontSize=10, leading=15,
            textColor=INK, spaceAfter=3,
        ),
        "box_bullet": ParagraphStyle(
            "box_bullet", fontName="Helvetica", fontSize=10, leading=14.5,
            textColor=INK, leftIndent=13, firstLineIndent=-8, spaceAfter=2,
        ),
        "signature": ParagraphStyle(
            "signature", fontName="Helvetica-Oblique", fontSize=11, leading=15,
            textColor=BRAND, spaceBefore=6,
        ),
    }


class HRule(Flowable):
    """Filetto orizzontale sottile."""

    def __init__(self, width, color=LINE, thickness=0.6, space_before=6, space_after=6):
        super().__init__()
        self.width = width
        self.color = color
        self.thickness = thickness
        self.space_before = space_before
        self.space_after = space_after
        self.height = thickness + space_before + space_after

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        y = self.space_after
        self.canv.line(0, y, self.width, y)


class WriteLine(Flowable):
    """Riga leggera per la scrittura a penna."""

    def __init__(self, width, gap=13.5):
        super().__init__()
        self.width = width
        self.height = gap

    def draw(self):
        self.canv.setStrokeColor(RULE_WRITE)
        self.canv.setLineWidth(0.5)
        self.canv.setDash(1, 2)
        self.canv.line(0, 2, self.width, 2)
        self.canv.setDash()


def inline(text: str) -> str:
    text = escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    return text


def draw_cover(canvas, cover_title: str, cover_subtitle: str) -> None:
    """Disegna la copertina in stile BnsStudio (pagina 1)."""
    width, height = A4
    center = width / 2.0
    canvas.saveState()

    # Logo BnsStudio centrato in alto
    if LOGO.exists():
        img = ImageReader(str(LOGO))
        iw, ih = img.getSize()
        logo_w = 5.7 * cm
        logo_h = logo_w * ih / iw
        canvas.drawImage(
            img,
            center - logo_w / 2.0,
            height - 3.1 * cm - logo_h,
            width=logo_w,
            height=logo_h,
            mask="auto",
            preserveAspectRatio=True,
        )

    # Titolo grande centrato verticalmente (font display Phonk)
    canvas.setFillColor(colors.HexColor("#111111"))
    title_size = 34 if COVER_TITLE_FONT == "Phonk" else 30
    canvas.setFont(COVER_TITLE_FONT, title_size)
    canvas.drawCentredString(center, height * 0.5, cover_title)

    # Sottotitolo
    canvas.setFillColor(colors.HexColor("#333333"))
    canvas.setFont("Helvetica", 15)
    canvas.drawCentredString(center, height * 0.5 - 0.95 * cm, cover_subtitle)

    # Nota a piè pagina in corsivo
    canvas.setFillColor(MUTE)
    canvas.setFont("Helvetica-Oblique", 9)
    canvas.drawCentredString(center, 1.6 * cm, COVER_FOOTER)

    canvas.restoreState()


def make_footer(page_title: str, cover_title: str, cover_subtitle: str):
    def footer(canvas, doc):
        # Pagina 1 = copertina, senza intestazione/numero di pagina
        if doc.page == 1:
            draw_cover(canvas, cover_title, cover_subtitle)
            return

        canvas.saveState()
        width, height = A4
        left, right = 2.0 * cm, width - 2.0 * cm
        # filetto in alto
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.6)
        canvas.line(left, height - 1.35 * cm, right, height - 1.35 * cm)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTE)
        canvas.drawString(left, height - 1.15 * cm, "LIBERI DI ESSERE")
        canvas.drawRightString(right, height - 1.15 * cm, page_title.upper())
        # footer
        canvas.setStrokeColor(LINE)
        canvas.line(left, 1.35 * cm, right, 1.35 * cm)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTE)
        canvas.drawString(left, 1.05 * cm, "BnsStudio  ·  Studio creativo digitale")
        canvas.drawRightString(right, 1.05 * cm, f"Pagina {doc.page - 1}")
        canvas.restoreState()

    return footer


def make_box(lines: list[str], st, content_width: float) -> Flowable:
    """Costruisce un box informativo dai contenuti del blockquote."""
    inner = []
    label_done = False
    for ln in lines:
        if ln.startswith("- "):
            inner.append(Paragraph(f"&bull;&nbsp;{inline(ln[2:])}", st["box_bullet"]))
        elif not label_done and ln.startswith("**") and ln.endswith("**"):
            inner.append(Paragraph(escape(ln.strip("*")).upper(), st["box_label"]))
            label_done = True
        else:
            inner.append(Paragraph(inline(ln), st["box_body"]))
    tbl = Table([[inner]], colWidths=[content_width])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BOX_BG),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                ("LINEBEFORE", (0, 0), (0, -1), 2.2, ACCENT),
            ]
        )
    )
    return tbl


def build_story(md: Path, st, content_width: float):
    lines = md.read_text(encoding="utf-8").splitlines()
    story: list = []
    i = 0
    seen_title = False
    meta_buffer: list[str] = []

    def flush_meta():
        if meta_buffer:
            story.append(Paragraph("&nbsp;&nbsp;·&nbsp;&nbsp;".join(meta_buffer), st["meta"]))
            meta_buffer.clear()

    while i < len(lines):
        raw = lines[i].rstrip()
        line = raw.strip()

        if not line:
            i += 1
            continue

        # Titolo documento
        if line.startswith("# "):
            story.append(Paragraph("BnsStudio&nbsp;&nbsp;—&nbsp;&nbsp;Consegna demo", st["eyebrow"]))
            story.append(Paragraph(inline(line[2:]), st["title"]))
            seen_title = True
            i += 1
            continue

        # Sottotitolo (prima riga in **bold** subito dopo il titolo)
        if seen_title and line.startswith("**") and line.endswith("**") and ":" not in line:
            story.append(Paragraph(escape(line.strip("*")), st["subtitle"]))
            i += 1
            continue

        # Meta (Cliente / A cura di / Periodo)
        if line.startswith("**") and ":" in line:
            m = re.match(r"\*\*(.+?):\*\*\s*(.*)", line)
            if m:
                meta_buffer.append(f"<b>{escape(m.group(1))}:</b> {escape(m.group(2))}")
                i += 1
                continue

        # Divisore
        if line == "---":
            flush_meta()
            story.append(HRule(content_width, space_before=4, space_after=8))
            i += 1
            continue

        flush_meta()

        # Sezione numerata / titolo di 2° livello
        if line.startswith("## "):
            heading = inline(line[3:])
            heading = re.sub(r"^(\d{2})\s*—\s*", r'<font color="#b9795f">\1</font>&nbsp;&nbsp;', heading)
            story.append(Paragraph(heading, st["section"]))
            i += 1
            continue

        # Box informativo (blockquote)
        if line.startswith(">"):
            block: list[str] = []
            while i < len(lines) and lines[i].lstrip().startswith(">"):
                content = lines[i].lstrip()[1:].strip()
                if content:
                    block.append(content)
                i += 1
            story.append(Spacer(1, 3))
            story.append(make_box(block, st, content_width))
            story.append(Spacer(1, 5))
            continue

        # Righe di scrittura (una o più <br> consecutivi)
        if line.replace("<br>", "").strip() == "" and "<br>" in line:
            count = line.count("<br>")
            for _ in range(count):
                story.append(WriteLine(content_width))
            story.append(Spacer(1, 6))
            i += 1
            continue

        # Elenco puntato
        if line.startswith("- "):
            story.append(Paragraph(f"&bull;&nbsp;&nbsp;{inline(line[2:])}", st["bullet"]))
            i += 1
            continue

        # URL grande (riga in **bold** che contiene un punto e nessun ':')
        if line.startswith("**") and line.endswith("**") and "." in line and ":" not in line:
            story.append(Paragraph(escape(line.strip("*")), st["big_url"]))
            i += 1
            continue

        # Riga interamente in corsivo → caption / firma
        if line.startswith("*") and line.endswith("*") and not line.startswith("**"):
            text = line.strip("*")
            style = st["signature"] if text.strip().lower() == "bns studio" else st["caption"]
            story.append(Paragraph(inline(text), style))
            i += 1
            continue

        # Paragrafo normale
        story.append(Paragraph(inline(line), st["body"]))
        i += 1

    flush_meta()
    return story


def main() -> None:
    st = styles()
    left = right = 2.0 * cm
    content_width = A4[0] - left - right
    generated = []
    for spec in DOCS:
        src = HERE / spec["src"]
        out = HERE / spec["out"]
        page_title = spec["page_title"]
        doc = SimpleDocTemplate(
            str(out),
            pagesize=A4,
            leftMargin=left,
            rightMargin=right,
            topMargin=2.0 * cm,
            bottomMargin=1.9 * cm,
            title=page_title,
            author="BnsStudio",
            subject="Consegna demo Liberi di Essere",
        )
        footer = make_footer(page_title, spec["cover_title"], spec["cover_subtitle"])
        # Copertina (pagina 1, disegnata su canvas) + contenuto dalla pagina 2
        story = [Spacer(1, 1), PageBreak()] + build_story(src, st, content_width)
        doc.build(story, onFirstPage=footer, onLaterPages=footer)
        generated.append(out)

    print(f"Generati {len(generated)} PDF:")
    for path in generated:
        print(" -", path.relative_to(HERE.parents[1]))


if __name__ == "__main__":
    main()
