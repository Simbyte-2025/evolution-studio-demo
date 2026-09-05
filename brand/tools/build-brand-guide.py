from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "evolution-brand-guide.pdf"

BLACK = colors.HexColor("#090909")
BLACK_SOFT = colors.HexColor("#0F0F0F")
SURFACE = colors.HexColor("#141311")
LINE = colors.HexColor("#2D2922")
GOLD = colors.HexColor("#C9A54B")
GOLD_LIGHT = colors.HexColor("#EAD07F")
IVORY = colors.HexColor("#F4F0E8")
MUTED = colors.HexColor("#B4AEA4")
ON_GOLD = colors.HexColor("#151109")

PAGE_W, PAGE_H = A4
MARGIN_X = 20 * mm
MARGIN_TOP = 22 * mm
MARGIN_BOTTOM = 18 * mm


class BrandDocTemplate(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=MARGIN_X,
            rightMargin=MARGIN_X,
            topMargin=MARGIN_TOP,
            bottomMargin=MARGIN_BOTTOM,
            title="Guia de identidad digital Evolution Studio",
            author="Simbyte",
            subject="Sistema visual observado en la landing publicada",
        )
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="content",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        self.addPageTemplates(PageTemplate(id="brand", frames=[frame], onPage=self.draw_page))

    def draw_page(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(BLACK)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.6)
        canvas.line(MARGIN_X, 13 * mm, PAGE_W - MARGIN_X, 13 * mm)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(colors.HexColor("#817A70"))
        canvas.drawString(MARGIN_X, 8 * mm, "Evolution Studio  ·  Identidad digital v1  ·  04.09.2026")
        canvas.drawRightString(PAGE_W - MARGIN_X, 8 * mm, str(doc.page))
        canvas.restoreState()


styles = getSampleStyleSheet()
title = ParagraphStyle(
    "Title",
    parent=styles["Title"],
    fontName="Times-Roman",
    fontSize=31,
    leading=32,
    textColor=IVORY,
    alignment=TA_LEFT,
    spaceAfter=8 * mm,
)
h1 = ParagraphStyle(
    "H1",
    parent=styles["Heading1"],
    fontName="Times-Roman",
    fontSize=23,
    leading=25,
    textColor=IVORY,
    spaceBefore=2 * mm,
    spaceAfter=5 * mm,
)
h2 = ParagraphStyle(
    "H2",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=9,
    leading=12,
    textColor=GOLD,
    uppercase=True,
    spaceBefore=4 * mm,
    spaceAfter=3 * mm,
)
body = ParagraphStyle(
    "Body",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=9.4,
    leading=14.2,
    textColor=MUTED,
    spaceAfter=3.4 * mm,
)
body_ivory = ParagraphStyle(
    "BodyIvory",
    parent=body,
    textColor=IVORY,
)
small = ParagraphStyle(
    "Small",
    parent=body,
    fontSize=7.8,
    leading=11,
)
label = ParagraphStyle(
    "Label",
    parent=body,
    fontName="Helvetica-Bold",
    fontSize=7,
    leading=9,
    textColor=GOLD,
    spaceAfter=2.5 * mm,
)
callout = ParagraphStyle(
    "Callout",
    parent=body,
    fontName="Helvetica-Bold",
    fontSize=10,
    leading=14,
    textColor=IVORY,
)


def p(text, style=body):
    return Paragraph(text, style)


def section_heading(kicker, heading):
    return [p(kicker.upper(), label), p(heading, h1)]


def bullet(text):
    return Paragraph("• " + text, body)


def styled_table(data, widths, header=True):
    table = Table(data, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), SURFACE if header else BLACK),
        ("TEXTCOLOR", (0, 0), (-1, 0), IVORY),
        ("TEXTCOLOR", (0, 1 if header else 0), (-1, -1), MUTED),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1 if header else 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
        ("LEADING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    table.setStyle(TableStyle(commands))
    return table


def image_fit(path, max_w, max_h):
    image = Image(str(path))
    scale = min(max_w / image.imageWidth, max_h / image.imageHeight)
    image.drawWidth = image.imageWidth * scale
    image.drawHeight = image.imageHeight * scale
    image.hAlign = "CENTER"
    return image


story = []

# Cover
story.extend(
    [
        Spacer(1, 8 * mm),
        p("IDENTIDAD DIGITAL V1", label),
        p("Guia de identidad digital<br/>Evolution Studio", title),
        p(
            "Sistema visual documentado desde la landing publicada. "
            "Paleta, tipografia, componentes y criterios de uso reunidos "
            "sin modificar la implementacion existente.",
            body_ivory,
        ),
        Spacer(1, 6 * mm),
        image_fit(ROOT / "boards" / "evolution-brand-board.png", 166 * mm, 135 * mm),
        Spacer(1, 6 * mm),
        p(
            "<b>Estado:</b> identidad de landing verificada · logo maestro pendiente · "
            "aprobacion corporativa del cliente pendiente",
            small,
        ),
        PageBreak(),
    ]
)

# Scope
story.extend(section_heading("Conclusion", "Una identidad digital coherente con una limitacion central"))
story.append(
    p(
        "La landing utiliza una base negra, acentos dorados, texto marfil y una dupla "
        "tipografica editorial y funcional. Cormorant Garamond aporta expresion a los "
        "titulares; Jost sostiene la lectura y las acciones. El sistema tiene contraste "
        "suficiente y reglas visuales consistentes."
    )
)
story.append(
    p(
        "El unico archivo de logo disponible es una captura de Instagram. Por eso este "
        "documento registra la identidad observada, conserva la referencia y evita crear "
        "versiones supuestamente oficiales sin una fuente maestra.",
        callout,
    )
)
story.append(Spacer(1, 4 * mm))
story.extend(section_heading("Clasificacion", "Que puede afirmarse y que sigue pendiente"))
status_data = [
    ["Estado", "Contenido"],
    ["VERIFICADO", "Landing publicada, colores CSS, familias tipograficas, jerarquias, gradiente, componentes y referencia utilizada por la web."],
    ["INFERENCIA", "Caracter sobrio, elegante, editorial y premium. Es interpretacion visual, no aprobacion del cliente."],
    ["PENDIENTE", "Logo maestro, geometria oficial, color corporativo fuera de la web, usos impresos y aprobacion formal."],
]
story.append(styled_table(status_data, [31 * mm, 135 * mm]))
story.append(Spacer(1, 5 * mm))
story.extend(section_heading("Fuente de verdad", "Trazabilidad"))
story.append(bullet("Landing: https://evolution-barber.simbytelabs.com/"))
story.append(bullet("Implementacion contrastada: index.html"))
story.append(bullet("Referencia de logo: assets/reference/evolution-logo-instagram.jpeg"))
story.append(bullet("Fecha de corte: 4 de septiembre de 2026"))
story.append(PageBreak())

# Palette
story.extend(section_heading("Color", "Paleta digital"))
story.append(image_fit(ROOT / "palette" / "evolution-palette.png", 166 * mm, 111 * mm))
story.append(Spacer(1, 4 * mm))
contrast_data = [
    ["Combinacion", "Ratio", "WCAG"],
    ["Marfil / negro", "17.52:1", "AAA"],
    ["Gris calido / negro", "9.04:1", "AAA"],
    ["Dorado / negro", "8.50:1", "AAA"],
    ["Dorado claro / negro", "13.11:1", "AAA"],
    ["Texto oscuro / dorado", "8.04:1", "AAA"],
    ["Gris de pie / negro", "4.72:1", "AA"],
]
story.append(styled_table(contrast_data, [94 * mm, 35 * mm, 37 * mm]))
story.append(PageBreak())

# Typography
story.extend(section_heading("Tipografia", "Expresion editorial y claridad operativa"))
story.append(image_fit(ROOT / "typography" / "evolution-type-specimen.png", 166 * mm, 114 * mm))
story.append(Spacer(1, 4 * mm))
type_data = [
    ["Nivel", "Familia", "Peso", "Tratamiento"],
    ["Hero", "Cormorant Garamond", "500", "Gran escala e interlineado compacto"],
    ["Enfasis", "Cormorant Garamond Italic", "400", "Dorado claro"],
    ["Seccion", "Cormorant Garamond", "500", "Marfil"],
    ["Etiqueta", "Jost", "500", "Mayusculas y tracking amplio"],
    ["Cuerpo", "Jost", "400", "Gris calido"],
    ["CTA", "Jost", "600", "Mayusculas sobre dorado"],
]
story.append(styled_table(type_data, [28 * mm, 53 * mm, 20 * mm, 65 * mm]))
story.append(PageBreak())

# Components
story.extend(section_heading("Componentes", "Reglas de continuidad"))
component_data = [
    ["Elemento", "Regla registrada"],
    ["CTA", "Gradiente #EAD07F → #C9A54B → #9B792D; texto #151109; radio 2 px; altura minima 52 px."],
    ["CTA compacto", "Altura minima 44 px; Jost 600; mayusculas; tracking amplio."],
    ["Foco", "Contorno de 2 px en dorado claro con separacion de 4 px."],
    ["Etiquetas", "Jost 500; mayusculas; tracking de 0.24 a 0.25 em; dorado o gris tenue."],
    ["Separadores", "#2D2922 o dorado de baja opacidad; trazo fino."],
    ["Superficies", "Negras o casi negras; planas; sin sombras intensas."],
]
story.append(styled_table(component_data, [42 * mm, 124 * mm]))
story.append(Spacer(1, 7 * mm))
story.extend(section_heading("Evitar", "Desviaciones visibles"))
story.append(bullet("Colores saturados ajenos a la paleta."))
story.append(bullet("Radios grandes y tarjetas con apariencia generica."))
story.append(bullet("Brillos metalicos dominantes o sombras intensas."))
story.append(bullet("Uso decorativo que compita con el CTA o la informacion."))
story.append(bullet("Promociones, precios, testimonios o servicios no confirmados."))
story.append(PageBreak())

# Logo
story.extend(section_heading("Logo", "Referencia disponible<br/>y limite de uso"))
logo_table = Table(
    [
        [
            image_fit(ROOT / "logo" / "source-reference-instagram.jpeg", 63 * mm, 112 * mm),
            [
                p("ARCHIVO DISPONIBLE", label),
                p("Captura de Instagram", h1),
                p("946 × 2048 px · JPEG · sin transparencia"),
                p(
                    "La referencia muestra un monograma EE, laureles, un diamante y el texto "
                    "Evolution Studio con tratamiento dorado sobre negro."
                ),
                p(
                    "<b>No es un archivo maestro.</b> No se reconstruyo, vectorizo ni altero "
                    "durante la creacion de este paquete.",
                    callout,
                ),
            ],
        ]
    ],
    colWidths=[70 * mm, 96 * mm],
    hAlign="LEFT",
)
logo_table.setStyle(
    TableStyle(
        [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (0, 0), 7 * mm),
            ("RIGHTPADDING", (1, 0), (1, 0), 0),
        ]
    )
)
story.append(logo_table)
story.append(Spacer(1, 7 * mm))
story.extend(section_heading("Archivo solicitado", "Orden de preferencia"))
story.append(bullet("SVG, AI o EPS original."))
story.append(bullet("PDF vectorial."))
story.append(bullet("PNG transparente de alta resolucion."))
story.append(bullet("Documento previo con tipografia, colores y proporciones."))
story.append(PageBreak())

# Photography and voice
story.extend(section_heading("Fotografia", "Documentar el negocio real"))
story.append(
    p(
        "La landing no contiene todavia una biblioteca fotografica aprobada. Las futuras "
        "imagenes deben mostrar el local, el trabajo o el equipo real. No deben usarse "
        "imagenes genericas como si fueran evidencia de Evolution Studio."
    )
)
photo_data = [
    ["Aplicar", "Evitar"],
    ["Luz calida y contraste controlado", "Escenas genericas o inventadas"],
    ["Negros profundos con detalle", "Negros empastados o filtros excesivos"],
    ["Piel y cabello con color natural", "Tonos artificiales o saturacion alta"],
    ["Herramientas, proceso y espacio real", "Decoracion sin relacion con el oficio"],
    ["Acentos dorados discretos", "Texto o promociones dentro de imagenes"],
]
story.append(styled_table(photo_data, [83 * mm, 83 * mm]))
story.append(Spacer(1, 8 * mm))
story.extend(section_heading("Voz", "Breve, directa y funcional"))
story.append(
    p(
        "Los textos deben ayudar a identificar el estudio, ubicarlo, conocer su trabajo o "
        "iniciar una reserva. Cualquier servicio, horario, precio, promocion, testimonio o "
        "promesa necesita confirmacion antes de publicarse."
    )
)
story.append(PageBreak())

# Handoff
story.extend(section_heading("Uso del paquete", "Fuentes reutilizables y control de cambios"))
story.append(
    p(
        "Los tokens CSS y JSON registran el sistema actual sin modificar la landing. Las "
        "laminas SVG son las fuentes visuales editables y los PNG son exportaciones de "
        "consulta. El Markdown mantiene la guia versionable y este PDF facilita revision y entrega."
    )
)
story.append(Spacer(1, 5 * mm))
check_data = [
    ["Antes de cambiar", "Comprobacion requerida"],
    ["Color", "Identificar token, uso, contraste y aprobacion."],
    ["Tipografia", "Verificar licencia, pesos, jerarquia y efecto responsive."],
    ["Logo", "Comparar contra arte maestro y conservar proporciones."],
    ["Fotografia", "Confirmar origen, permiso y correspondencia con el negocio."],
    ["Contenido", "Separar hechos, inferencias y pendientes."],
    ["Entrega", "Registrar fecha, version y aplicaciones afectadas."],
]
story.append(styled_table(check_data, [52 * mm, 114 * mm]))
story.append(Spacer(1, 8 * mm))
story.append(
    p(
        "Este documento registra la identidad digital de una landing. No constituye un "
        "registro legal de marca ante INAPI ni acredita titularidad sobre el emblema.",
        callout,
    )
)

doc = BrandDocTemplate(str(OUTPUT))
doc.build(story)
print(OUTPUT)
