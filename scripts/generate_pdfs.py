from __future__ import annotations

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
DOC_GROUPS = {
    "internal": ROOT / "docs" / "internal",
    "client": ROOT / "docs" / "client",
}
PDF_ROOT = ROOT / "docs" / "pdf"


def title_from_markdown(path: Path) -> str:
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return path.stem.replace("_", " ").title()


def styles():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#1f2a24"),
            spaceAfter=18,
        )
    )
    base.add(
        ParagraphStyle(
            name="DocHeading1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#1f2a24"),
            spaceBefore=14,
            spaceAfter=8,
        )
    )
    base.add(
        ParagraphStyle(
            name="DocHeading2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#6c4f3d"),
            spaceBefore=10,
            spaceAfter=6,
        )
    )
    base.add(
        ParagraphStyle(
            name="DocBody",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=colors.HexColor("#2f3632"),
            spaceAfter=7,
        )
    )
    base.add(
        ParagraphStyle(
            name="DocBullet",
            parent=base["DocBody"],
            leftIndent=14,
            firstLineIndent=-8,
        )
    )
    base.add(
        ParagraphStyle(
            name="DocCode",
            parent=base["DocBody"],
            fontName="Courier",
            fontSize=8.5,
            leading=12,
            backColor=colors.HexColor("#f3f0ec"),
            borderPadding=5,
        )
    )
    return base


def draw_page(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(colors.HexColor("#d8cdc3"))
    canvas.line(1.7 * cm, height - 1.55 * cm, width - 1.7 * cm, height - 1.55 * cm)
    canvas.setFillColor(colors.HexColor("#6c4f3d"))
    canvas.setFont("Helvetica", 8)
    canvas.drawString(1.7 * cm, height - 1.25 * cm, "Liberi di Essere - BNS Studio")
    canvas.drawRightString(width - 1.7 * cm, 1.1 * cm, f"Pagina {doc.page}")
    canvas.restoreState()


def markdown_to_story(path: Path):
    style = styles()
    title = title_from_markdown(path)
    story = [
        Spacer(1, 2.2 * cm),
        Paragraph(escape(title), style["CoverTitle"]),
        Paragraph("Documentazione finale demo gestionale e prenotazioni", style["DocBody"]),
        Spacer(1, 1.2 * cm),
    ]
    in_code = False
    code_lines: list[str] = []

    def flush_code():
        if code_lines:
            story.append(Paragraph("<br/>".join(escape(line) for line in code_lines), style["DocCode"]))
            story.append(Spacer(1, 4))
            code_lines.clear()

    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.rstrip()
        if line.startswith("```"):
            if in_code:
                flush_code()
                in_code = False
            else:
                in_code = True
            continue
        if in_code:
            code_lines.append(line)
            continue
        if not line:
            story.append(Spacer(1, 3))
            continue
        if line.startswith("# "):
            story.append(Paragraph(escape(line[2:]), style["DocHeading1"]))
        elif line.startswith("## "):
            story.append(Paragraph(escape(line[3:]), style["DocHeading2"]))
        elif line.startswith("### "):
            story.append(Paragraph(escape(line[4:]), style["DocHeading2"]))
        elif line.startswith("- "):
            story.append(Paragraph(f"&bull; {escape(line[2:])}", style["DocBullet"]))
        elif len(line) > 2 and line[0].isdigit() and line[1] == ".":
            story.append(Paragraph(escape(line), style["DocBullet"]))
        else:
            story.append(Paragraph(escape(line), style["DocBody"]))

    flush_code()
    return story


def build_pdf(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(target),
        pagesize=A4,
        rightMargin=1.7 * cm,
        leftMargin=1.7 * cm,
        topMargin=2.1 * cm,
        bottomMargin=1.8 * cm,
        title=title_from_markdown(source),
        author="BNS Studio",
    )
    doc.build(markdown_to_story(source), onFirstPage=draw_page, onLaterPages=draw_page)


def main():
    generated = []
    for group, directory in DOC_GROUPS.items():
        for markdown in sorted(directory.glob("*.md")):
            target = PDF_ROOT / group / f"{markdown.stem}.pdf"
            build_pdf(markdown, target)
            generated.append(target)
    print(f"Generated {len(generated)} PDF files")
    for path in generated:
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
