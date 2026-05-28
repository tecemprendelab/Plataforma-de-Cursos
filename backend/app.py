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

def _split_name_lines(name: str, threshold: int = 4) -> tuple:
    """
    Si el nombre tiene >= threshold palabras, lo divide en dos líneas
    lo más equilibradas posible. Devuelve (linea1, linea2) o (name, None).
    """
    words = name.split()
    if len(words) < threshold:
        return (name, None)
    mid = len(words) // 2
    return (" ".join(words[:mid]), " ".join(words[mid:]))


def _fill_svg(svg_text: str, fields: dict) -> str:
    """Replace text content of SVG <text> elements by id."""
    result = svg_text
    for field_id, value in fields.items():
        if not field_id or value is None:
            continue
        safe_id  = re.escape(str(field_id))
        safe_val = str(value).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

        def make_replacer(val):
            def _replacer(m):
                open_tag  = m.group(1)
                inner     = m.group(2)
                close_tag = m.group(3)
                if re.search(r'<[^/!][^>]*tspan', inner, re.IGNORECASE):
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

        # Match <text id="..." ...>...</text>
        result = re.sub(
            r'(<text\b[^>]*\bid=["\']' + safe_id + r'["\'][^>]*>)'
            r'([\s\S]*?)'
            r'(</text>)',
            make_replacer(safe_val),
            result, flags=re.IGNORECASE
        )
        # Match <tspan id="..." ...>...</tspan>
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
         ' font-size="47.9322" font-weight="800" letter-spacing="0em">'
         '<tspan x="63" y="320.437">recipient_name</tspan></text>'),
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

def _embed_fonts(svg_text: str) -> str:
    """
    Embebe las fuentes del sistema como base64 en el SVG.
    Garantiza que cairosvg renderice el texto correctamente
    sin depender de las fuentes instaladas en el servidor.
    Mapea Onest → LiberationSans-Bold, Outfit → LiberationSans-Regular.
    """
    import base64, os

    font_map = {
        "Onest":   ("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",    "800"),
        "Outfit":  ("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", "400"),
    }

    # Buscar fuentes alternativas si Liberation no está disponible
    fallbacks = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]
    fallbacks_regular = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]

    def find_font(primary, alts):
        if os.path.exists(primary):
            return primary
        for a in alts:
            if os.path.exists(a):
                return a
        return None

    styles = []
    for family, (path, weight) in font_map.items():
        alts = fallbacks if weight == "800" else fallbacks_regular
        real_path = find_font(path, alts)
        if not real_path:
            continue
        with open(real_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        styles.append(
            f"@font-face {{\n"
            f"  font-family: \'{family}\';\n"
            f"  font-weight: {weight};\n"
            f"  src: url(\'data:font/truetype;base64,{b64}\') format(\'truetype\');\n"
            f"}}"
        )

    if not styles:
        return svg_text

    font_block = "<defs><style>" + "\n".join(styles) + "</style></defs>"
    # Insertar justo después del tag <svg ...>
    import re as _re
    return _re.sub(r"(<svg\b[^>]*>)", r"\1" + font_block, svg_text, count=1)


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
        svg_text = _fix_outlined_text(request.files["file"].read().decode("utf-8", errors="replace"))
    else:
        tname = request.form.get("template_name") or (request.get_json(silent=True) or {}).get("template_name")
        if tname:
            svg_text = _fix_outlined_text(_load_template(tname))
    if not svg_text:
        return jsonify({"error": "no SVG proporcionado"}), 400
    return jsonify({"elements": _detect_elements(svg_text)})


@app.post("/api/preview")
def preview():
    svg_text = None
    if "file" in request.files:
        svg_text = _fix_outlined_text(request.files["file"].read().decode("utf-8", errors="replace"))
    else:
        tname = request.form.get("template_name") or (request.get_json(silent=True) or {}).get("template_name")
        if tname:
            svg_text = _fix_outlined_text(_load_template(tname))
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
            svg_text = _fix_outlined_text(_load_template(tname))
    else:
        fmt = (request.form.get("format") or request.form.get("output_format", "pdf")).lower()
        try:
            fields = json.loads(request.form.get("fields", "{}"))
        except (json.JSONDecodeError, ValueError):
            fields = {}

        if "file" in request.files:
            svg_text = _fix_outlined_text(request.files["file"].read().decode("utf-8", errors="replace"))
        else:
            tname = request.form.get("template_name")
            if tname:
                svg_text = _fix_outlined_text(_load_template(tname))

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
    fmt     = (request.form.get("format") or request.form.get("output_format", "pdf")).lower()
    name_id = request.form.get("name_field_id", "recipient_name")
    date_id = request.form.get("date_field_id", "issue_date")

    # Cargar SVG
    svg_text = None
    if "file" in request.files:
        svg_text = _fix_outlined_text(request.files["file"].read().decode("utf-8", errors="replace"))
    else:
        tname = request.form.get("template_name")
        if tname:
            svg_text = _fix_outlined_text(_load_template(tname))

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
        svg_text = _fix_outlined_text(request.files["file"].read().decode("utf-8", errors="replace"))
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
