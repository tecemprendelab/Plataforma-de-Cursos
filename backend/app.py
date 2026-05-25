"""
Flask backend for certificate generation.
Endpoints:
  GET  /api/health
  GET  /api/ai/status
  POST /api/preview          — returns SVG with placeholder text
  POST /api/generate         — returns PDF or PNG
  POST /api/generate/batch   — ZIP of PDFs/PNGs from CSV data
  POST /api/analyze          — returns detected <text id="..."> elements
  POST /api/ai/mapeo         — Claude-powered field mapping
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

try:
    from openai import OpenAI as _OpenAI
    _api_key = os.getenv("OPENAI_API_KEY", "")
    if _api_key:
        AI_CLIENT = _OpenAI(api_key=_api_key)
        AI_OK = True
    else:
        AI_CLIENT = None
        AI_OK = False
except (ImportError, Exception):
    AI_CLIENT = None
    AI_OK = False

app = Flask(__name__)
CORS(app)

TEMPLATES_DIR = Path(__file__).parent / "templates"


# ── helpers ──────────────────────────────────────────────────────────────────

def _fill_svg(svg_text: str, fields: dict) -> str:
    """Replace text content of SVG elements matching id attributes (regex-based)."""
    result = svg_text
    for field_id, value in fields.items():
        safe_id  = re.escape(field_id)
        safe_val = value.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

        def make_text_replacer(val):
            def _replacer(m):
                open_tag = m.group(1)
                inner    = m.group(2)
                close_tag = m.group(3)
                # If inner has a <tspan>, replace only its text content
                if re.search(r'<[^/!][^>]*tspan', inner, re.IGNORECASE):
                    def _tspan_rep(tm):
                        return tm.group(1) + val + tm.group(2)
                    new_inner = re.sub(
                        r'(<tspan\b[^>]*>)[^<]*(</tspan>)',
                        _tspan_rep, inner, count=1, flags=re.IGNORECASE
                    )
                else:
                    new_inner = val
                return open_tag + new_inner + close_tag
            return _replacer

        # Match <text id="field_id" ...>...</text>
        result = re.sub(
            r'(<text\b[^>]*\bid=["\']' + safe_id + r'["\'][^>]*>)'
            r'([\s\S]*?)'
            r'(</text>)',
            make_text_replacer(safe_val),
            result, flags=re.IGNORECASE
        )
        # Match <tspan id="field_id" ...>...</tspan>
        result = re.sub(
            r'(<tspan\b[^>]*\bid=["\']' + safe_id + r'["\'][^>]*>)'
            r'[^<]*'
            r'(</tspan>)',
            lambda m, v=safe_val: m.group(1) + v + m.group(2),
            result, flags=re.IGNORECASE
        )

    return result


def _load_template(template_name: str) -> str | None:
    """Load SVG content from templates dir. template_name must not contain path separators."""
    safe_name = Path(template_name).name
    path = TEMPLATES_DIR / safe_name
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


def _detect_elements(svg_text: str) -> list[dict]:
    """Return list of {id, tag, current_text} for all elements with an id attribute."""
    try:
        root = ET.fromstring(svg_text)
    except ET.ParseError:
        return []

    results = []
    for el in root.iter():
        el_id = el.get("id") or el.get("{http://www.w3.org/2000/svg}id")
        if el_id:
            tag = el.tag.split("}")[-1] if "}" in el.tag else el.tag
            text = (el.text or "").strip()
            results.append({"id": el_id, "tag": tag, "current_text": text})
    return results


def _svg_to_output(svg_text: str, fmt: str) -> bytes:
    """Convert SVG text to PDF or PNG bytes using cairosvg."""
    if not CAIRO_OK:
        raise RuntimeError("cairosvg not installed")
    encoded = svg_text.encode("utf-8")
    if fmt == "pdf":
        return cairosvg.svg2pdf(bytestring=encoded)
    return cairosvg.svg2png(bytestring=encoded, scale=2)


# ── routes ───────────────────────────────────────────────────────────────────

@app.post("/api/debug")
def debug():
    """Echo back received form fields and file names for troubleshooting."""
    return jsonify({
        "form_fields": dict(request.form),
        "files": list(request.files.keys()),
    })


@app.get("/api/test-fill")
def test_fill():
    """Diagnostic: fill classic template with test data and report results."""
    svg_text = _load_template("template_classic.svg")
    if not svg_text:
        return jsonify({"error": "template not found", "dir": str(TEMPLATES_DIR)})
    fields  = {"recipient_name": "NOMBRE DE PRUEBA", "issue_date": "25 de mayo de 2026"}
    filled  = _fill_svg(svg_text, fields)
    return jsonify({
        "fill_worked":     "NOMBRE DE PRUEBA" in filled,
        "original_remains": "Nombre del Participante" in filled,
        "template_bytes":  len(svg_text),
        "filled_bytes":    len(filled),
    })


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "cairo": CAIRO_OK, "ai": AI_OK})


@app.get("/api/ai/status")
def ai_status():
    return jsonify({"available": AI_OK})


@app.get("/api/templates/<path:filename>")
def serve_template(filename):
    safe_name = Path(filename).name
    path = TEMPLATES_DIR / safe_name
    if not path.exists():
        return jsonify({"error": "not found"}), 404
    return Response(path.read_text(encoding="utf-8"), mimetype="image/svg+xml")


@app.post("/api/analyze")
def analyze():
    """
    Accepts: multipart file OR JSON { template_name }
    Returns: { elements: [{id, tag, current_text}] }
    """
    svg_text = None

    if "file" in request.files:
        svg_text = request.files["file"].read().decode("utf-8", errors="replace")
    else:
        data = request.get_json(silent=True) or {}
        tname = request.form.get("template_name") or data.get("template_name")
        if tname:
            svg_text = _load_template(tname)

    if not svg_text:
        return jsonify({"error": "no SVG provided"}), 400

    elements = _detect_elements(svg_text)
    return jsonify({"elements": elements})


@app.post("/api/preview")
def preview():
    """
    Accepts: multipart file OR form/json { template_name }
    Returns: raw SVG text (with original placeholders, no fill).
    """
    svg_text = None

    if "file" in request.files:
        svg_text = request.files["file"].read().decode("utf-8", errors="replace")
    else:
        data = request.get_json(silent=True) or {}
        tname = request.form.get("template_name") or data.get("template_name")
        if tname:
            svg_text = _load_template(tname)

    if not svg_text:
        return jsonify({"error": "no SVG provided"}), 400

    return Response(svg_text, mimetype="image/svg+xml")


@app.post("/api/generate")
def generate():
    """
    Accepts JSON or multipart:
      { template_name, fields: {id: value}, format: 'pdf'|'png' }
      OR file upload + fields + format in form data
    Returns: PDF or PNG binary.
    """
    fmt = "pdf"
    fields = {}
    svg_text = None

    if request.is_json:
        data = request.get_json()
        fmt = data.get("format", data.get("output_format", "pdf")).lower()
        fields = data.get("fields", {})
        tname = data.get("template_name")
        if tname:
            svg_text = _load_template(tname)
    else:
        fmt = (request.form.get("format") or request.form.get("output_format", "pdf")).lower()
        try:
            fields = json.loads(request.form.get("fields", "{}"))
        except (json.JSONDecodeError, ValueError):
            fields = {}
        if "file" in request.files:
            svg_text = request.files["file"].read().decode("utf-8", errors="replace")
        else:
            tname = request.form.get("template_name")
            if tname:
                svg_text = _load_template(tname)

        # Frontend sends individual fields + name_field_id/date_field_id
        if not fields:
            name_id  = request.form.get("name_field_id", "recipient_name")
            date_id  = request.form.get("date_field_id", "issue_date")
            name_val = request.form.get("recipient_name", "")
            date_val = request.form.get("issue_date", "")
            if name_val:
                fields[name_id] = name_val
            if date_val:
                fields[date_id] = date_val

    if not svg_text:
        return jsonify({"error": "no SVG provided"}), 400

    filled = _fill_svg(svg_text, fields)

    if not CAIRO_OK:
        # Return filled SVG if cairosvg not available
        return Response(filled, mimetype="image/svg+xml",
                        headers={"Content-Disposition": "attachment; filename=certificate.svg"})

    try:
        output = _svg_to_output(filled, fmt)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    mime = "application/pdf" if fmt == "pdf" else "image/png"
    ext  = "pdf" if fmt == "pdf" else "png"
    return send_file(io.BytesIO(output), mimetype=mime,
                     download_name=f"certificate.{ext}", as_attachment=True)


@app.post("/api/generate/batch")
def generate_batch():
    """
    Accepts multipart:
      file (SVG template or named template_name)
      csv_data: CSV text with columns matching SVG element ids
      format: pdf | png
    Returns: ZIP archive of certificates.
    """
    fmt      = (request.form.get("format") or request.form.get("output_format", "pdf")).lower()
    name_id  = request.form.get("name_field_id", "recipient_name")
    date_id  = request.form.get("date_field_id", "issue_date")
    svg_text = None

    # Accept csv as file or raw text
    if "csv_file" in request.files:
        csv_data = request.files["csv_file"].read().decode("utf-8", errors="replace")
    else:
        csv_data = request.form.get("csv_data", "")

    if "file" in request.files:
        svg_text = request.files["file"].read().decode("utf-8", errors="replace")
    else:
        tname = request.form.get("template_name")
        if tname:
            svg_text = _load_template(tname)

    if not svg_text:
        return jsonify({"error": "no SVG template provided"}), 400
    if not csv_data.strip():
        return jsonify({"error": "no CSV data provided"}), 400

    reader = csv.DictReader(io.StringIO(csv_data))
    rows = list(reader)
    if not rows:
        return jsonify({"error": "CSV has no rows"}), 400

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, row in enumerate(rows):
            raw = {k.strip(): v.strip() for k, v in row.items()}
            # Map CSV columns to SVG element IDs using name_id / date_id
            fields = dict(raw)
            for csv_key in ("nombre", "name", "participante", "recipient_name"):
                if csv_key in raw:
                    fields[name_id] = raw[csv_key]
                    break
            for csv_key in ("fecha", "date", "issue_date"):
                if csv_key in raw:
                    fields[date_id] = raw[csv_key]
                    break
            filled = _fill_svg(svg_text, fields)

            name_hint = (
                raw.get("recipient_name") or raw.get("nombre")
                or raw.get("name") or str(i + 1)
            )
            safe_hint = re.sub(r"[^\w\- ]", "", name_hint).strip()[:60] or str(i + 1)

            if not CAIRO_OK:
                zf.writestr(f"{i+1:03d}_{safe_hint}.svg", filled.encode("utf-8"))
            else:
                try:
                    output = _svg_to_output(filled, fmt)
                    ext = "pdf" if fmt == "pdf" else "png"
                    zf.writestr(f"{i+1:03d}_{safe_hint}.{ext}", output)
                except Exception:
                    zf.writestr(f"{i+1:03d}_{safe_hint}_ERROR.svg", filled.encode("utf-8"))

    zip_buf.seek(0)
    return send_file(zip_buf, mimetype="application/zip",
                     download_name="certificados.zip", as_attachment=True)


@app.post("/api/ai/mapeo")
def ai_mapeo():
    """
    Accepts JSON: { svg_elements: [...], csv_headers: [...] }
    Returns: { mapping: {csv_header: svg_id}, confidence: {}, explanation }
    Uses Claude to intelligently map CSV columns to SVG element ids.
    """
    if not AI_OK or not AI_CLIENT:
        return jsonify({"error": "AI not available — set OPENAI_API_KEY"}), 503

    data = request.get_json(silent=True) or {}
    svg_elements = data.get("svg_elements", [])
    csv_headers  = data.get("csv_headers", [])

    if not svg_elements or not csv_headers:
        return jsonify({"error": "svg_elements and csv_headers required"}), 400

    prompt = f"""You are a data mapping assistant for certificate generation.

SVG element IDs (text fields in the certificate):
{json.dumps([e['id'] for e in svg_elements], ensure_ascii=False)}

CSV column headers from the user's spreadsheet:
{json.dumps(csv_headers, ensure_ascii=False)}

Task: Map each CSV column header to the most appropriate SVG element ID.

Rules:
- Only map a CSV header if you're reasonably confident it matches an SVG field
- Common mappings: name/nombre/participante → recipient_name, date/fecha → issue_date
- Return JSON only, no extra text

Response format:
{{
  "mapping": {{"csv_header": "svg_element_id", ...}},
  "confidence": {{"csv_header": 0.0-1.0, ...}},
  "unmapped_csv": ["headers not mapped"],
  "unmapped_svg": ["svg ids not covered"]
}}"""

    try:
        resp = AI_CLIENT.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        text = resp.choices[0].message.content.strip()
        # Extract JSON block if wrapped in markdown
        m = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
        if m:
            text = m.group(1)
        result = json.loads(text)
        return jsonify(result)
    except (json.JSONDecodeError, ValueError) as e:
        return jsonify({"error": f"AI response parse error: {e}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5050))
    app.run(host="0.0.0.0", port=port, debug=False)
