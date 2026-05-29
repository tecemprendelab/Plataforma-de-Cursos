"""
Flask backend for certificate generation.
Endpoints:
  GET  /api/health
  GET  /api/ai/status
  POST /api/preview          — returns SVG with fields filled
  POST /api/generate         — returns PDF or PNG
  POST /api/generate/batch   — ZIP of PDFs/PNGs from CSV
  POST /api/analyze          — returns detected <text id="..."> elements
  POST /api/ai/mapeo         — AI-powered field mapping suggestion
  GET  /api/templates/<name> — serve raw SVG file
"""

import io
import os
import re
import zipfile
import json
import csv
from pathlib import Path
from xml.etree import ElementTree as ET

from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS

try:
    import cairosvg
    CAIRO_OK = True
except ImportError:
    CAIRO_OK = False

# Anthropic client (preferido sobre OpenAI)
AI_CLIENT = None
AI_OK     = False
try:
    import anthropic as _anthropic
    _key = os.getenv("ANTHROPIC_API_KEY", "")
    if _key:
        AI_CLIENT = _anthropic.Anthropic(api_key=_key)
        AI_OK     = True
except (ImportError, Exception):
    pass

# Fallback a OpenAI si no hay Anthropic
if not AI_OK:
    try:
        from openai import OpenAI as _OpenAI
        _key = os.getenv("OPENAI_API_KEY", "")
        if _key:
            AI_CLIENT = _OpenAI(api_key=_key)
            AI_OK     = True
    except (ImportError, Exception):
        pass

# ── Instalación de fuentes en runtime ────────────────────────────────────────
import subprocess as _sp
import urllib.request as _ur
import zipfile as _zf

def _install_fonts():
    """Instala Outfit y Onest si no están disponibles."""
    try:
        result = _sp.run(["fc-list"], capture_output=True, text=True)
        fonts_list = result.stdout.lower()
        if "outfit" in fonts_list and "onest" in fonts_list:
            return
        import os, tempfile
        font_dir = "/usr/local/share/fonts/custom"
        os.makedirs(font_dir, exist_ok=True)
        sources = {
            "Outfit": "https://fonts.google.com/download?family=Outfit",
            "Onest":  "https://fonts.google.com/download?family=Onest",
        }
        for name, url in sources.items():
            if name.lower() in fonts_list:
                continue
            try:
                tmp = os.path.join(tempfile.gettempdir(), f"{name}.zip")
                _ur.urlretrieve(url, tmp)
                with _zf.ZipFile(tmp, "r") as z:
                    for zi in z.infolist():
                        if zi.filename.endswith(".ttf") or zi.filename.endswith(".otf"):
                            zi.filename = os.path.basename(zi.filename)
                            z.extract(zi, font_dir)
                os.remove(tmp)
                print(f"[fonts] {name} instalada en {font_dir}")
            except Exception as e:
                print(f"[fonts] No se pudo instalar {name}: {e}")
        _sp.run(["fc-cache", "-f", font_dir], capture_output=True)
    except Exception as e:
        print(f"[fonts] Error en instalación de fuentes: {e}")

_install_fonts()


app = Flask(__name__)
CORS(app, expose_headers=["X-Generated-Count", "X-Error-Count", "X-Total-Count"])

TEMPLATES_DIR = Path(__file__).parent / "templates"


# ── helpers ───────────────────────────────────────────────────────────────────
# Cache para no llamar la API dos veces con el mismo nombre
_tildes_cache: dict = {}

# Cache para no llamar la API dos veces con el mismo nombre
_tildes_cache: dict = {}

# Diccionario de nombres propios comunes con tildes correctas
_NOMBRES_TILDES = {
    # Masculinos
    "ADRIAN":"ADRIÁN","AGUSTIN":"AGUSTÍN","ANDRES":"ANDRÉS","ANGEL":"ÁNGEL",
    "ARIEL":"ARIEL","BENJAMIN":"BENJAMÍN","CAMILO":"CAMILO","CARLOS":"CARLOS",
    "CESAR":"CÉSAR","DANIEL":"DANIEL","DARIO":"DARÍO","DAVID":"DAVID",
    "DIEGO":"DIEGO","EDGAR":"ÉDGAR","EDUARDO":"EDUARDO","EMILIO":"EMILIO",
    "ENRIQUE":"ENRIQUE","ESTEBAN":"ESTEBAN","FABIAN":"FABIÁN","FELIPE":"FELIPE",
    "FRANCISCO":"FRANCISCO","GABRIEL":"GABRIEL","GERARDO":"GERARDO",
    "GONZALO":"GONZALO","GUILLERMO":"GUILLERMO","GUSTAVO":"GUSTAVO",
    "HECTOR":"HÉCTOR","HERNAN":"HERNÁN","HUGO":"HUGO","IVAN":"IVÁN",
    "JAVIER":"JAVIER","JESUS":"JESÚS","JOAQUIN":"JOAQUÍN","JORGE":"JORGE",
    "JOSE":"JOSÉ","JUAN":"JUAN","JULIAN":"JULIÁN","JULIO":"JULIO",
    "KEVIN":"KEVIN","LEONARDO":"LEONARDO","LUIS":"LUIS","MANUEL":"MANUEL",
    "MARCOS":"MARCOS","MARIO":"MARIO","MARTIN":"MARTÍN","MATEO":"MATEO",
    "MAURICIO":"MAURICIO","MIGUEL":"MIGUEL","NICOLAS":"NICOLÁS","OSCAR":"ÓSCAR",
    "PABLO":"PABLO","PEDRO":"PEDRO","RAFAEL":"RAFAEL","RAMON":"RAMÓN",
    "RAUL":"RAÚL","RICARDO":"RICARDO","ROBERTO":"ROBERTO","RODRIGO":"RODRIGO",
    "RUBEN":"RUBÉN","SAMUEL":"SAMUEL","SEBASTIAN":"SEBASTIÁN","SERGIO":"SERGIO",
    "TOMAS":"TOMÁS","VICTOR":"VÍCTOR","WILLIAM":"WILLIAM","XAVIER":"XAVIER",
    # Femeninos
    "ADRIANA":"ADRIANA","ALEJANDRA":"ALEJANDRA","ALEJANDRO":"ALEJANDRO",
    "ALICIA":"ALICIA","ANA":"ANA","ANDREA":"ANDREA","ANGELES":"ÁNGELES",
    "ANGELA":"ÁNGELA","BEATRIZ":"BEATRIZ","CAMILA":"CAMILA","CAROLINA":"CAROLINA",
    "CATALINA":"CATALINA","CLAUDIA":"CLAUDIA","CRISTINA":"CRISTINA",
    "DANIELA":"DANIELA","ELENA":"ELENA","ELIZABETH":"ELIZABETH","EVA":"EVA",
    "FERNANDA":"FERNANDA","GABRIELA":"GABRIELA","GENESIS":"GÉNESIS",
    "GLORIA":"GLORIA","ISABEL":"ISABEL","JESSICA":"JESSICA","JOHANNA":"JOHANNA",
    "JOSEFINA":"JOSEFINA","KAREN":"KAREN","KARINA":"KARINA","LAURA":"LAURA",
    "LEIDY":"LEIDY","LILIANA":"LILIANA","LORENA":"LORENA","LUCIA":"LUCÍA",
    "LUISA":"LUISA","MARCELA":"MARCELA","MARIA":"MARÍA","MARIANA":"MARIANA",
    "MELISSA":"MELISSA","MONICA":"MÓNICA","NATALIA":"NATALIA","NICOLE":"NICOLE",
    "PAOLA":"PAOLA","PATRICIA":"PATRICIA","PAULA":"PAULA","PRISCILA":"PRISCILA",
    "REBECA":"REBECA","ROSA":"ROSA","SABRINA":"SABRINA","SANDRA":"SANDRA",
    "SARA":"SARA","SILVIA":"SILVIA","SOFIA":"SOFÍA","STEFANIA":"STEFANÍA",
    "SUSANA":"SUSANA","TATIANA":"TATIANA","VALERIA":"VALERIA","VANESSA":"VANESSA",
    "VERONICA":"VERÓNICA","VIVIANA":"VIVIANA","WENDY":"WENDY","XIOMARA":"XIOMARA",
    "YORLENY":"YORLENY","YOSELYN":"YOSELYN","ZULAY":"ZULAY",
    # Apellidos comunes con tilde
    "GARCIA":"GARCÍA","GONZALEZ":"GONZÁLEZ","HERNANDEZ":"HERNÁNDEZ",
    "JIMENEZ":"JIMÉNEZ","LOPEZ":"LÓPEZ","MARTINEZ":"MARTÍNEZ","MENDEZ":"MÉNDEZ",
    "MORALES":"MORALES","NUÑEZ":"NÚÑEZ","ORDOÑEZ":"ORDÓÑEZ","PEREZ":"PÉREZ",
    "RAMIREZ":"RAMÍREZ","RODRIGUEZ":"RODRÍGUEZ","SANCHEZ":"SÁNCHEZ",
    "VASQUEZ":"VÁSQUEZ","VELASQUEZ":"VELÁSQUEZ","GUTIERREZ":"GUTIÉRREZ",
    "CASTILLO":"CASTILLO","VARGAS":"VARGAS","FLORES":"FLORES","LEON":"LEÓN",
    "CHAVEZ":"CHÁVEZ","ROMERO":"ROMERO","TORRES":"TORRES","DIAZ":"DÍAZ",
    "ALVAREZ":"ÁLVAREZ","RUIZ":"RUIZ","RAMOS":"RAMOS","REYES":"REYES",
    "CASTRO":"CASTRO","MORA":"MORA","QUESADA":"QUESADA","SOLANO":"SOLANO",
    "VEGA":"VEGA","ARAYA":"ARAYA","BRENES":"BRENES","CAMPOS":"CAMPOS",
    "CHINCHILLA":"CHINCHILLA","MONGE":"MONGE","NUNEZ":"NÚÑEZ","ALVARADO":"ALVARADO",
    "ROJAS":"ROJAS","UGALDE":"UGALDE","UREÑA":"UREÑA","ZUNIGA":"ZÚÑIGA",
}

def _fix_tildes(name: str) -> str:
    """
    Corrige tildes en nombres propios.
    Primero aplica diccionario de nombres comunes (rápido, sin costo).
    Luego usa Claude Haiku como refuerzo si la API está disponible.
    """
    name_stripped = name.strip()
    if not name_stripped:
        return name

    if name_stripped in _tildes_cache:
        return _tildes_cache[name_stripped]

    # Paso 1: diccionario — corregir palabra por palabra
    words = name_stripped.upper().split()
    corrected_words = [_NOMBRES_TILDES.get(w, w) for w in words]
    result = " ".join(corrected_words)

    # Paso 2: si la API está disponible y quedaron palabras sin tilde
    # que podrían necesitarla, refinar con Claude Haiku
    if AI_OK and AI_CLIENT and result == name_stripped.upper():
        try:
            msg = AI_CLIENT.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=60,
                messages=[{"role": "user", "content":
                    f"Corrige las tildes del siguiente nombre propio en español. "
                    f"Devolvé SOLO el nombre corregido, en mayúsculas, sin explicaciones.\n\n{result}"
                }]
            )
            api_result = msg.content[0].text.strip().upper()
            if api_result and len(api_result) <= len(result) + 10:
                result = api_result
        except Exception:
            pass

    _tildes_cache[name_stripped] = result
    return result


def _split_name_lines(name: str) -> tuple:
    """
    Divide el nombre en dos líneas equilibradas.
    Con 2+ palabras siempre divide por la mitad.
    Con 1 sola palabra devuelve (name, None).
    """
    words = name.split()
    if len(words) < 2:
        return (name, None)
    mid = len(words) // 2
    return (" ".join(words[:mid]), " ".join(words[mid:]))


def _fill_svg(svg_text: str, fields: dict) -> str:
    """Replace text content of SVG <text> elements by id.
    Para recipient_name con 4+ palabras, divide en dos tspan.
    """
    result = svg_text
    LINE_HEIGHT = 44  # acorde a font-size=47.9322

    for field_id, value in fields.items():
        if not field_id or value is None:
            continue

        raw_val = str(value)

        # Corregir tildes en nombre del participante
        if field_id == "recipient_name":
            raw_val = _fix_tildes(raw_val)

        # Nombre con 4+ palabras -> dos lineas
        if field_id == "recipient_name":
            linea1, linea2 = _split_name_lines(raw_val)
            safe_l1 = linea1.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            if linea2:
                safe_l2 = linea2.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                safe_id = re.escape(field_id)

                def make_two_line(l1, l2, lh):
                    def _r(m):
                        inner = m.group(2)
                        xm = re.search(r'<tspan[^>]+x=["\']([^"\'][^"\']*)["\']', inner)
                        ym = re.search(r'<tspan[^>]+y=["\']([^"\'][^"\']*)["\']', inner)
                        x_val = xm.group(1) if xm else "65.4"
                        y_val = float(ym.group(1)) if ym else 316.0
                        y1 = y_val - lh * 0.5
                        new_inner = (
                            f'<tspan x="{x_val}" y="{y1:.1f}">{l1}</tspan>'
                            f'<tspan x="{x_val}" dy="{lh}">{l2}</tspan>'
                        )
                        return m.group(1) + new_inner + m.group(3)
                    return _r

                result = re.sub(
                    r'(<text\b[^>]*\bid=["\']' + safe_id + r'["\'][^>]*>)'
                    r'([\s\S]*?)'
                    r'(</text>)',
                    make_two_line(safe_l1, safe_l2, LINE_HEIGHT),
                    result, flags=re.IGNORECASE
                )
                continue

        safe_id  = re.escape(str(field_id))
        safe_val = raw_val.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        def make_replacer(val):
            def _replacer(m):
                open_tag  = m.group(1)
                inner     = m.group(2)
                close_tag = m.group(3)
                if re.search(r'<tspan\b', inner, re.IGNORECASE):
                    def _tspan(tm):
                        return tm.group(1) + val + tm.group(2)
                    new_inner = re.sub(
                        r'(<tspan\b[^>]*>)[^<]*(</tspan>)',
                        _tspan, inner, count=1, flags=re.IGNORECASE
                    )
                else:
                    new_inner = val
                return open_tag + new_inner + close_tag
            return _replacer

        result = re.sub(
            r'(<text\b[^>]*\bid=["\']' + safe_id + r'["\'][^>]*>)'
            r'([\s\S]*?)'
            r'(</text>)',
            make_replacer(safe_val),
            result, flags=re.IGNORECASE
        )
        result = re.sub(
            r'(<tspan\b[^>]*\bid=["\']' + safe_id + r'["\'][^>]*>)'
            r'[^<]*'
            r'(</tspan>)',
            lambda m, v=safe_val: m.group(1) + v + m.group(2),
            result, flags=re.IGNORECASE
        )
    return result


def _fix_outlined_text(svg_text: str) -> str:
    """
    Figma a veces exporta texto como <path> (outline/vectorizado).
    Detecta recipient_name e issue_date como <path> y los convierte
    a <text> editables para que _fill_svg pueda reemplazarlos.
    """
    import re as _re
    fixes = [
        ("recipient_name",
         '<text id="recipient_name" fill="#00457C"'
         ' style="white-space: pre" xml:space="preserve"'
         ' font-family="Onest,Liberation Sans,DejaVu Sans,sans-serif"'
         ' font-size="36" font-weight="800" letter-spacing="0em">'
         '<tspan x="65.4" y="314">recipient_name</tspan></text>'),
        ("issue_date",
         '<text id="issue_date" fill="#00457C"'
         ' style="white-space: pre" xml:space="preserve"'
         ' font-family="Outfit,Liberation Sans,DejaVu Sans,sans-serif"'
         ' font-size="14" letter-spacing="0em">'
         '<tspan x="60" y="462.08">issue_date</tspan></text>'),
    ]
    PAT = r'<path[^>]+id=[\x22\x27]{fid}[\x22\x27][^>]*/>'
    for fid, replacement in fixes:
        pat = PAT.format(fid=_re.escape(fid))
        if _re.search(pat, svg_text):
            svg_text = _re.sub(pat, replacement, svg_text)
    return svg_text


def _fix_image_patterns(svg_text: str) -> str:
    """
    Figma exporta logos via <pattern> + <rect fill="url(#patternX)">.
    El pattern contiene un <use href="#imageId"> que apunta a un <image>
    en <defs> con el base64 real. cairosvg no renderiza esto correctamente.
    Reemplaza cada rect con un <image> directo con el base64 real.
    """
    import re as _re
    from xml.etree import ElementTree as _ET

    try:
        root = _ET.fromstring(svg_text)
    except _ET.ParseError:
        return svg_text

    XLINK = 'http://www.w3.org/1999/xlink'

    # 1. Construir mapa id → href para todos los <image> en el SVG
    image_hrefs = {}
    for el in root.iter():
        tag = el.tag.split('}')[-1] if '}' in el.tag else el.tag
        if tag == 'image':
            eid = el.get('id')
            href = el.get(f'{{{XLINK}}}href') or el.get('href', '')
            if eid and href.startswith('data:'):
                image_hrefs[eid] = href

    if not image_hrefs:
        return svg_text

    # 2. Para cada <pattern>, resolver qué imagen usa
    pattern_images = {}
    for el in root.iter():
        tag = el.tag.split('}')[-1] if '}' in el.tag else el.tag
        if tag != 'pattern':
            continue
        pat_id = el.get('id')
        if not pat_id:
            continue
        # Buscar <use> o <image> hijo con href
        for child in el.iter():
            ctag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            href = child.get(f'{{{XLINK}}}href') or child.get('href', '')
            if href.startswith('#'):
                ref_id = href[1:]
                if ref_id in image_hrefs:
                    pattern_images[pat_id] = image_hrefs[ref_id]
                    break
            elif href.startswith('data:'):
                pattern_images[pat_id] = href
                break

    if not pattern_images:
        return svg_text

    # 3. Reemplazar cada <rect fill="url(#patternX)"> por <image> directo
    result = svg_text
    for pat_id, img_href in pattern_images.items():
        safe_id = _re.escape(pat_id)
        for rm in _re.finditer(
            r'<rect([^>]+)fill=["\']url\(#' + safe_id + r'\)["\'][^/]*/>',
            result
        ):
            attrs = rm.group(1)
            def attr(name, default, a=attrs):
                m = _re.search(r'\b' + name + r'=["\']([^"\']+)["\']', a)
                return m.group(1) if m else default
            new_tag = (
                f'<image x="{attr("x","0")}" y="{attr("y","0")}"'
                f' width="{attr("width","10")}" height="{attr("height","10")}"'
                f' preserveAspectRatio="xMidYMid meet"'
                f' xmlns:xlink="http://www.w3.org/1999/xlink"'
                f' xlink:href="{img_href}"/>'
            )
            result = result.replace(rm.group(0), new_tag, 1)
    return result




def _inject_firma_yorleny(svg_text: str) -> str:
    """
    Inserta el sello de firma digital de Yorleny León Marchena
    en el SVG del certificado, encima de su línea de firma.
    Solo actúa si el SVG contiene la firma de Yorleny (id con 'Yorleny').
    """
    import re as _re, os as _os
    from xml.etree import ElementTree as _ET

    # Verificar que este SVG tiene la firma de Yorleny
    if 'Yorleny' not in svg_text and 'yorleny' not in svg_text.lower():
        return svg_text

    # Verificar que el sello no está ya insertado
    if 'firma_yorleny' in svg_text or 'Documento firmado' in svg_text:
        return svg_text

    # Cargar el SVG del sello y extraer el base64
    sello_path = _os.path.join(_os.path.dirname(__file__), 'templates', 'firma_yorleny.svg')
    if not _os.path.exists(sello_path):
        return svg_text

    try:
        with open(sello_path, 'r', encoding='utf-8') as f:
            sello_svg = f.read()
        root_sello = _ET.fromstring(sello_svg)
        XLINK = 'http://www.w3.org/1999/xlink'
        sello_b64 = None
        for el in root_sello.iter():
            tag = el.tag.split('}')[-1] if '}' in el.tag else el.tag
            if tag == 'image':
                href = el.get(f'{{{XLINK}}}href') or el.get('href', '')
                if href.startswith('data:'):
                    sello_b64 = href
                    break
        if not sello_b64:
            return svg_text
    except Exception:
        return svg_text

    # Posición del sello: x=328, y=460, w=80, h=38
    sello_tag = (
        f'<image x="328" y="460" width="80" height="38"'
        f' preserveAspectRatio="xMidYMid meet"'
        f' xmlns:xlink="http://www.w3.org/1999/xlink"'
        f' xlink:href="{sello_b64}"/>\n  '
    )

    # Insertar antes del path/text de Yorleny León Marchena
    result = _re.sub(
        r'(<(?:path|text|g)[^>]+id=["\'][^"\']*[Yy]orleny[^"\']*["\'])',
        sello_tag + r'\1',
        svg_text,
        count=1
    )
    return result


def _embed_fonts(svg_text: str) -> str:
    """
    Embebe Onest ExtraBold y Outfit Regular como base64 en el SVG.
    Busca primero en backend/fonts/ (incluido en el repo),
    luego en el sistema como fallback.
    """
    import base64, os

    base_dir = os.path.dirname(os.path.abspath(__file__))

    font_map = {
        "Onest": {
            "weight": "800",
            "paths": [
                os.path.join(base_dir, "fonts", "Onest.ttf"),          # en el repo
                "/usr/local/share/fonts/custom/Onest.ttf",
                "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            ],
        },
        "Outfit": {
            "weight": "400",
            "paths": [
                os.path.join(base_dir, "fonts", "Outfit.ttf"),          # en el repo
                "/usr/local/share/fonts/custom/Outfit.ttf",
                "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            ],
        },
    }

    styles = []
    for family, cfg in font_map.items():
        font_path = next((p for p in cfg["paths"] if os.path.exists(p)), None)
        if not font_path:
            continue
        with open(font_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        styles.append(
            f"@font-face {{\n"
            f"  font-family: '{family}';\n"
            f"  font-weight: {cfg['weight']};\n"
            f"  src: url('data:font/truetype;base64,{b64}') format('truetype');\n"
            f"}}"
        )

    if not styles:
        return svg_text

    font_block = "<defs><style>" + "\n".join(styles) + "</style></defs>"
    import re as _re
    return _re.sub(r"(<svg\b[^>]*>)", lambda m: m.group(1) + font_block, svg_text, count=1)



def _load_template(template_name: str):
    safe = Path(template_name).name
    path = TEMPLATES_DIR / safe
    return path.read_text(encoding="utf-8") if path.exists() else None


def _detect_elements(svg_text: str) -> list:
    """Return list of {id, tag, text, x, y, font_size} for <text>/<tspan> elements with id."""
    try:
        root = ET.fromstring(svg_text)
    except ET.ParseError:
        return []
    NS = "http://www.w3.org/2000/svg"
    results = []
    for el in root.iter():
        tag = el.tag.split("}")[-1] if "}" in el.tag else el.tag
        if tag not in ("text", "tspan"):
            continue
        eid = el.get("id")
        if not eid:
            continue
        results.append({
            "id":        eid,
            "tag":       tag,
            "text":      (el.text or "").strip()[:60],
            "x":         el.get("x", ""),
            "y":         el.get("y", ""),
            "font_size": el.get("font-size", el.get("fontSize", "")),
        })
    return results


def _svg_to_output(svg_text: str, fmt: str) -> bytes:
    if not CAIRO_OK:
        raise RuntimeError("cairosvg no instalado en el servidor")
    svg_text = _embed_fonts(svg_text)
    enc = svg_text.encode("utf-8")
    if fmt == "pdf":
        return cairosvg.svg2pdf(bytestring=enc)
    return cairosvg.svg2png(bytestring=enc, scale=2)


# Cache para consultas de cédulas al TSE
_cedula_cache: dict = {}

def _lookup_cedula(cedula: str) -> str | None:
    """
    Consulta el nombre completo por cédula.
    Intenta múltiples APIs del estado costarricense.
    """
    import urllib.request as _ur
    import json as _json
    import urllib.error as _ue

    cedula = cedula.strip().replace("-", "").replace(" ", "").replace(".", "")
    if not cedula.isdigit() or len(cedula) < 8:
        return None

    if cedula in _cedula_cache:
        return _cedula_cache[cedula]

    apis = [
        f"https://api.hacienda.go.cr/fe/ae?identificacion={cedula}",
        f"https://api.suitetecnologica.com/api/v1/personas/{cedula}",
    ]

    for url in apis:
        try:
            req = _ur.Request(url, headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json",
            })
            with _ur.urlopen(req, timeout=8) as resp:
                raw = resp.read().decode("utf-8")
                data = _json.loads(raw)

            # Formato Hacienda: {"nombre": "JUAN PEREZ"}
            nombre = (
                data.get("nombre") or
                data.get("name") or
                data.get("fullName") or
                ""
            ).strip().upper()

            if nombre and len(nombre) > 3:
                _cedula_cache[cedula] = nombre
                return nombre
        except (_ue.URLError, _ue.HTTPError, Exception):
            continue

    _cedula_cache[cedula] = None
    return None


def _resolve_fields(row: dict, name_id: str, date_id: str) -> dict:
    """Map CSV row to SVG field ids, trying common column name aliases.
    Si hay columna de cédula, consulta la API del TSE para obtener el nombre oficial.
    """
    raw    = {k.strip(): v.strip() for k, v in row.items()}
    fields = dict(raw)

    # Intentar obtener nombre desde cédula (tiene prioridad sobre columna nombre)
    cedula = None
    for col in ("cedula", "cédula", "id", "identificacion", "identificación",
                "num_cedula", "numero_cedula", "dni", "Cedula", "Cédula"):
        if col in raw and raw[col]:
            cedula = raw[col]
            break

    nombre_from_api = None
    if cedula:
        nombre_from_api = _lookup_cedula(cedula)

    if nombre_from_api:
        fields[name_id] = nombre_from_api
    else:
        # Fallback: columna nombre del CSV
        for col in ("nombre", "name", "participante", "recipient_name", "Nombre"):
            if col in raw and raw[col]:
                fields[name_id] = raw[col]
                break

    for col in ("fecha", "date", "issue_date", "Fecha"):
        if col in raw and raw[col]:
            fields[date_id] = raw[col]
            break

    return fields


def _resolve_fields(row: dict, name_id: str, date_id: str) -> dict:
    """Map CSV row to SVG field ids, trying common column name aliases."""
    raw    = {k.strip(): v.strip() for k, v in row.items()}
    fields = dict(raw)  # pass all columns through as-is

    for col in ("nombre", "name", "participante", "recipient_name", "Nombre"):
        if col in raw and raw[col]:
            fields[name_id] = raw[col]
            break

    for col in ("fecha", "date", "issue_date", "Fecha"):
        if col in raw and raw[col]:
            fields[date_id] = raw[col]
            break

    return fields


# ── routes ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "cairo": CAIRO_OK, "ai": AI_OK})


@app.get("/api/ai/status")
def ai_status():
    return jsonify({"available": AI_OK})


@app.get("/api/templates/<path:filename>")
def serve_template(filename):
    safe = Path(filename).name
    path = TEMPLATES_DIR / safe
    if not path.exists():
        return jsonify({"error": "not found"}), 404
    return Response(path.read_text(encoding="utf-8"), mimetype="image/svg+xml")


@app.get("/api/templates")
def list_templates():
    files = [f.name for f in TEMPLATES_DIR.glob("*.svg")] if TEMPLATES_DIR.exists() else []
    return jsonify({"templates": files})


@app.post("/api/analyze")
def analyze():
    svg_text = None
    if "file" in request.files:
        svg_text = _inject_firma_yorleny(_fix_image_patterns(_fix_outlined_text(request.files["file"].read().decode("utf-8", errors="replace"))))
    else:
        tname = request.form.get("template_name") or (request.get_json(silent=True) or {}).get("template_name")
        if tname:
            svg_text = _inject_firma_yorleny(_fix_image_patterns(_fix_outlined_text(_load_template(tname))))
    if not svg_text:
        return jsonify({"error": "no SVG proporcionado"}), 400
    return jsonify({"elements": _detect_elements(svg_text)})


@app.post("/api/preview")
def preview():
    svg_text = None
    if "file" in request.files:
        svg_text = _inject_firma_yorleny(_fix_image_patterns(_fix_outlined_text(request.files["file"].read().decode("utf-8", errors="replace"))))
    else:
        tname = request.form.get("template_name") or (request.get_json(silent=True) or {}).get("template_name")
        if tname:
            svg_text = _inject_firma_yorleny(_fix_image_patterns(_fix_outlined_text(_load_template(tname))))
    if not svg_text:
        return jsonify({"error": "no SVG proporcionado"}), 400

    # Rellenar con valores de vista previa si se proveen
    name_id  = request.form.get("name_field_id", "recipient_name")
    date_id  = request.form.get("date_field_id", "issue_date")
    name_val = request.form.get("recipient_name", "")
    date_val = request.form.get("issue_date", "")
    fields   = {}
    if name_val: fields[name_id] = name_val
    if date_val: fields[date_id] = date_val
    if fields:
        svg_text = _fill_svg(svg_text, fields)

    return Response(svg_text, mimetype="image/svg+xml")


@app.post("/api/generate")
def generate():
    svg_text = None
    fmt      = "pdf"
    fields   = {}

    if request.is_json:
        data    = request.get_json()
        fmt     = data.get("format", data.get("output_format", "pdf")).lower()
        fields  = data.get("fields", {})
        tname   = data.get("template_name")
        if tname:
            svg_text = _inject_firma_yorleny(_fix_image_patterns(_fix_outlined_text(_load_template(tname))))
    else:
        fmt = (request.form.get("format") or request.form.get("output_format", "pdf")).lower()
        try:
            fields = json.loads(request.form.get("fields", "{}"))
        except (json.JSONDecodeError, ValueError):
            fields = {}

        if "file" in request.files:
            svg_text = _inject_firma_yorleny(_fix_image_patterns(_fix_outlined_text(request.files["file"].read().decode("utf-8", errors="replace"))))
        else:
            tname = request.form.get("template_name")
            if tname:
                svg_text = _inject_firma_yorleny(_fix_image_patterns(_fix_outlined_text(_load_template(tname))))

        if not fields:
            name_id  = request.form.get("name_field_id", "recipient_name")
            date_id  = request.form.get("date_field_id", "issue_date")
            name_val = request.form.get("recipient_name", "")
            date_val = request.form.get("issue_date", "")
            if name_val: fields[name_id] = name_val
            if date_val: fields[date_id] = date_val

    if not svg_text:
        return jsonify({"error": "no SVG proporcionado"}), 400

    filled = _fill_svg(svg_text, fields)

    if not CAIRO_OK:
        return Response(
            filled, mimetype="image/svg+xml",
            headers={"Content-Disposition": "attachment; filename=certificado.svg"}
        )

    try:
        output = _svg_to_output(filled, fmt)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    mime = "application/pdf" if fmt == "pdf" else "image/png"
    ext  = "pdf" if fmt == "pdf" else "png"
    return send_file(io.BytesIO(output), mimetype=mime,
                     download_name=f"certificado.{ext}", as_attachment=True)


@app.post("/api/generate/batch")
def generate_batch():
    fmt         = (request.form.get("format") or request.form.get("output_format", "pdf")).lower()
    name_id     = request.form.get("name_field_id", "recipient_name")
    date_id     = request.form.get("date_field_id", "issue_date")
    global_date = request.form.get("global_date", "").strip()

    # Cargar SVG
    svg_text = None
    if "file" in request.files:
        svg_text = _inject_firma_yorleny(_fix_image_patterns(_fix_outlined_text(request.files["file"].read().decode("utf-8", errors="replace"))))
    else:
        tname = request.form.get("template_name")
        if tname:
            svg_text = _inject_firma_yorleny(_fix_image_patterns(_fix_outlined_text(_load_template(tname))))

    if not svg_text:
        return jsonify({"error": "No se proporcionó plantilla SVG"}), 400

    # Cargar CSV
    csv_text = ""
    if "csv_file" in request.files:
        csv_text = request.files["csv_file"].read().decode("utf-8-sig", errors="replace")
    else:
        csv_text = request.form.get("csv_data", "")

    if not csv_text.strip():
        return jsonify({"error": "No se proporcionó archivo CSV"}), 400

    rows = list(csv.DictReader(io.StringIO(csv_text)))
    if not rows:
        return jsonify({"error": "El CSV no contiene filas de datos"}), 400

    # Verificar columnas mínimas
    headers = [h.strip() for h in rows[0].keys()]
    name_aliases = {"nombre", "name", "participante", "recipient_name"}
    date_aliases = {"fecha", "date", "issue_date"}
    has_name = any(h.lower() in name_aliases for h in headers)
    has_date = any(h.lower() in date_aliases for h in headers)
    if not has_name:
        return jsonify({"error": f"El CSV debe tener una columna de nombre. Encontradas: {headers}"}), 400

    # Generar ZIP
    zip_buf     = io.BytesIO()
    ok_count    = 0
    error_count = 0

    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, row in enumerate(rows):
            fields    = _resolve_fields(row, name_id, date_id)
            if global_date:
                fields[date_id] = global_date
            filled    = _fill_svg(svg_text, fields)
            name_hint = fields.get(name_id) or str(i + 1)
            safe_hint = re.sub(r"[^\w\- ]", "", name_hint).strip()[:60] or str(i + 1)

            if not CAIRO_OK:
                zf.writestr(f"{i+1:03d}_{safe_hint}.svg", filled.encode("utf-8"))
                ok_count += 1
            else:
                try:
                    output = _svg_to_output(filled, fmt)
                    ext    = "pdf" if fmt == "pdf" else "png"
                    zf.writestr(f"{i+1:03d}_{safe_hint}.{ext}", output)
                    ok_count += 1
                except Exception as e:
                    zf.writestr(f"{i+1:03d}_{safe_hint}_ERROR.txt",
                                f"Error: {e}\n\nCampos: {fields}".encode("utf-8"))
                    error_count += 1

    zip_buf.seek(0)
    resp = send_file(
        zip_buf, mimetype="application/zip",
        download_name="certificados_lote.zip", as_attachment=True
    )
    resp.headers["X-Generated-Count"] = str(ok_count)
    resp.headers["X-Error-Count"]     = str(error_count)
    resp.headers["X-Total-Count"]     = str(len(rows))
    return resp


@app.post("/api/ai/mapeo")
def ai_mapeo():
    if not AI_OK or not AI_CLIENT:
        return jsonify({"error": "IA no disponible — configurá ANTHROPIC_API_KEY"}), 503

    if "file" in request.files:
        svg_text = _inject_firma_yorleny(_fix_image_patterns(_fix_outlined_text(request.files["file"].read().decode("utf-8", errors="replace"))))
        elements = _detect_elements(svg_text)
    else:
        data     = request.get_json(silent=True) or {}
        elements = data.get("svg_elements", [])

    if not elements:
        return jsonify({"error": "No se encontraron elementos con id en el SVG"}), 400

    ids   = [e["id"] for e in elements]
    texts = {e["id"]: e.get("text", "") for e in elements}

    prompt = f"""Analiza estos IDs de elementos SVG de un certificado y determina cuál es el campo del nombre del participante y cuál es la fecha.

IDs disponibles: {json.dumps(ids, ensure_ascii=False)}
Texto actual de cada ID: {json.dumps(texts, ensure_ascii=False)}

Responde SOLO con JSON, sin texto adicional:
{{
  "name_id": "el_id_del_nombre",
  "date_id": "el_id_de_la_fecha",
  "confidence": "alta|media|baja",
  "justification": "explicación breve en español"
}}"""

    try:
        # Soporte Anthropic
        if hasattr(AI_CLIENT, 'messages'):
            msg  = AI_CLIENT.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=256,
                messages=[{"role": "user", "content": prompt}]
            )
            text = msg.content[0].text.strip()
        else:
            # Fallback OpenAI
            resp = AI_CLIENT.chat.completions.create(
                model="gpt-4o-mini", max_tokens=256,
                messages=[{"role": "user", "content": prompt}]
            )
            text = resp.choices[0].message.content.strip()

        m = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
        if m:
            text = m.group(1)
        result = json.loads(text)
        # Validar que los IDs sugeridos existen
        if result.get("name_id") not in ids:
            result["name_id"] = ids[0] if ids else ""
        if result.get("date_id") not in ids:
            result["date_id"] = ids[1] if len(ids) > 1 else ids[0] if ids else ""
        return jsonify(result)
    except (json.JSONDecodeError, ValueError) as e:
        return jsonify({"error": f"Error al parsear respuesta IA: {e}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5050))
    app.run(host="0.0.0.0", port=port, debug=False)


@app.post("/api/cedulas/lookup")
def cedulas_lookup():
    """
    Recibe lista de cédulas y devuelve nombres oficiales del Registro Civil.
    Body JSON: {"cedulas": ["110370477", "205840321", ...]}
    Respuesta: {"results": [{"cedula": "110370477", "nombre": "JUAN PÉREZ", "ok": true}, ...]}
    """
    data = request.get_json(silent=True) or {}
    cedulas = data.get("cedulas", [])
    if not cedulas or not isinstance(cedulas, list):
        return jsonify({"error": "Enviá un JSON con campo 'cedulas' como lista"}), 400

    results = []
    for ced in cedulas[:200]:  # máximo 200 por request
        nombre = _lookup_cedula(str(ced))
        results.append({
            "cedula": str(ced),
            "nombre": nombre,
            "ok": nombre is not None
        })

    return jsonify({"results": results})

