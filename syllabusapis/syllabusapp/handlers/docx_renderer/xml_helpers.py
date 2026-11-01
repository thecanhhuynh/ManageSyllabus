"""XML helper functions cho DOCX rendering."""
import re
from lxml import etree

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


def _apply_paragraph_style(p: etree._Element, effective: dict) -> None:
    pPr = p.find(f"{{{W_NS}}}pPr")
    if pPr is None:
        pPr = etree.Element(f"{{{W_NS}}}pPr")
        p.insert(0, pPr)

    if "alignment" in effective and effective["alignment"]:
        align_str = str(effective["alignment"]).strip().lower()
        val = "both" if align_str in ("justify", "both") else align_str
        jc = pPr.find(f"{{{W_NS}}}jc")
        if jc is None:
            jc = etree.SubElement(pPr, f"{{{W_NS}}}jc")
        jc.set(f"{{{W_NS}}}val", val)

    if not any(k in effective and effective[k] is not None for k in ("line_spacing", "space_before_pt", "space_after_pt")):
        return

    spacing = pPr.find(f"{{{W_NS}}}spacing")
    if spacing is None:
        spacing = etree.SubElement(pPr, f"{{{W_NS}}}spacing")

    if effective.get("line_spacing") is not None:
        spacing.set(f"{{{W_NS}}}line", str(int(float(effective["line_spacing"]) * 240)))
        spacing.set(f"{{{W_NS}}}lineRule", "auto")

    if effective.get("space_before_pt") is not None:
        spacing.set(f"{{{W_NS}}}before", str(int(float(effective["space_before_pt"]) * 20)))

    if effective.get("space_after_pt") is not None:
        spacing.set(f"{{{W_NS}}}after", str(int(float(effective["space_after_pt"]) * 20)))


def _apply_run_style(r: etree._Element, effective: dict) -> None:
    rPr = r.find(f"{{{W_NS}}}rPr")
    if rPr is None:
        rPr = etree.Element(f"{{{W_NS}}}rPr")
        r.insert(0, rPr)

    if effective.get("font_name"):
        font = str(effective["font_name"])
        rFonts = rPr.find(f"{{{W_NS}}}rFonts")
        if rFonts is None:
            rFonts = etree.SubElement(rPr, f"{{{W_NS}}}rFonts")
        rFonts.set(f"{{{W_NS}}}ascii", font)
        rFonts.set(f"{{{W_NS}}}hAnsi", font)
        rFonts.set(f"{{{W_NS}}}cs", font)

    if effective.get("font_size_pt") is not None:
        sz_val = str(int(float(effective["font_size_pt"]) * 2))
        for tag in ("sz", "szCs"):
            el = rPr.find(f"{{{W_NS}}}{tag}")
            if el is None:
                el = etree.SubElement(rPr, f"{{{W_NS}}}{tag}")
            el.set(f"{{{W_NS}}}val", sz_val)

    _toggle_xml_element(rPr, "b", effective.get("bold"))
    _toggle_xml_element(rPr, "i", effective.get("italic"))
    _toggle_underline(rPr, effective.get("underline"))
    _apply_color(rPr, effective.get("color"))


def _apply_color(rPr: etree._Element, color_val) -> None:
    """Apply text color. None hoặc AUTO → xóa tag. Hex cụ thể (kể cả 000000) → ghi tag explicit."""
    existing = rPr.find(f"{{{W_NS}}}color")
    if not color_val:
        if existing is not None:
            rPr.remove(existing)
        return

    hex_val = str(color_val).lstrip("#").upper()
    if hex_val == "AUTO":
        if existing is not None:
            rPr.remove(existing)
        return

    if existing is None:
        existing = etree.SubElement(rPr, f"{{{W_NS}}}color")
    existing.set(f"{{{W_NS}}}val", hex_val)


def _toggle_xml_element(rPr: etree._Element, tag: str, value: bool | None) -> None:
    """Bật/tắt element trong rPr. False → xóa tag hoàn toàn."""
    if value is None:
        return
    existing = rPr.find(f"{{{W_NS}}}{tag}")
    if value:
        if existing is None:
            etree.SubElement(rPr, f"{{{W_NS}}}{tag}")
        else:
            existing.set(f"{{{W_NS}}}val", "1")
        return
    if existing is not None:
        rPr.remove(existing)


def _toggle_underline(rPr: etree._Element, value: bool | None) -> None:
    """Bật/tắt gạch chân trong rPr. False → xóa tag u hoàn toàn."""
    if value is None:
        return
    existing = rPr.find(f"{{{W_NS}}}u")
    if value:
        if existing is None:
            existing = etree.SubElement(rPr, f"{{{W_NS}}}u")
        existing.set(f"{{{W_NS}}}val", "single")
        return
    if existing is not None:
        rPr.remove(existing)


def _append_xml_to_body(doc, xml_snippet: str) -> None:
    """Phân tích cú pháp XML snippet và chèn trước thẻ sectPr."""
    body = doc._body._element
    sect_pr = body.find(f"{{{W_NS}}}sectPr")
    wrapped = f'<root xmlns:w="{W_NS}">{xml_snippet}</root>'

    try:
        root = etree.fromstring(wrapped.encode("utf-8"))
        for elem in list(root):
            if sect_pr is not None:
                sect_pr.addprevious(elem)
            else:
                body.append(elem)
    except etree.XMLSyntaxError:
        p = doc.add_paragraph(xml_snippet)
        if sect_pr is not None:
            sect_pr.addprevious(p._p)


def _prepend_position_to_xml(xml_string: str, position: int | None) -> str:
    """Chèn số thứ tự vào đầu run đầu tiên của đoạn văn bản."""
    if not position or not xml_string:
        return xml_string

    try:
        wrapped = f'<root xmlns:w="{W_NS}">{xml_string}</root>'
        root = etree.fromstring(wrapped.encode("utf-8"))
        for p in root.findall(f".//{{{W_NS}}}p"):
            runs = p.findall(f"{{{W_NS}}}r")
            if not runs:
                continue
            first_run = runs[0]
            t_els = first_run.findall(f"{{{W_NS}}}t")
            if not t_els:
                continue
            t_text = t_els[0].text or ""
            if re.match(r"^\d+[\.\)\-]\s+", t_text.strip()):
                break
            t_els[0].text = f"{position}. {t_text}"
            break
        return "".join(
            etree.tostring(child, encoding="utf-8").decode("utf-8")
            for child in root
        )
    except Exception:
        return xml_string


def _split_runs_by_role(p: etree._Element) -> tuple[list, list]:
    title_runs = []
    content_runs = []
    for run in p.findall(f"{{{W_NS}}}r"):
        text = "".join(t.text or "" for t in run.findall(f"{{{W_NS}}}t"))
        if "{{" in text and "}}" in text:
            content_runs.append(run)
            continue
        title_runs.append(run)
    return title_runs, content_runs


def _format_xml_paragraph(p: etree._Element, t_style: dict, c_style: dict, fb_style: dict) -> None:
    """Apply style cho 1 paragraph và các runs bên trong theo vai trò title/content."""
    effective_para = {**fb_style, **c_style}
    _apply_paragraph_style(p, effective_para)

    title_runs, content_runs = _split_runs_by_role(p)
    if not content_runs and not t_style:
        content_runs = title_runs
        title_runs = []

    effective_title = {**fb_style, **t_style}
    effective_content = {**fb_style, **c_style}

    for r in title_runs:
        _apply_run_style(r, effective_title)
    for r in content_runs:
        _apply_run_style(r, effective_content)


def _normalize_apply_styles(
    title_style: dict | None,
    content_style: dict | None,
    fallback_style: dict | None,
) -> tuple[dict, dict, dict]:
    """Chuẩn hóa styles đầu vào hỗ trợ cả 2, 3 và 4 arguments."""
    if fallback_style is not None:
        return dict(title_style or {}), dict(content_style or {}), dict(fallback_style)
    if content_style is not None:
        return dict(title_style or {}), dict(title_style or {}), dict(content_style)
    return dict(title_style or {}), dict(title_style or {}), {}


def _apply_style_to_xml(
    xml_snippet: str,
    title_style: dict | None = None,
    content_style: dict | None = None,
    fallback_style: dict | None = None,
) -> str:
    if not xml_snippet or not xml_snippet.strip():
        return xml_snippet

    t_style, c_style, fb_style = _normalize_apply_styles(
        title_style, content_style, fallback_style
    )
    if not t_style and not c_style and not fb_style:
        return xml_snippet

    try:
        wrapped = f'<root xmlns:w="{W_NS}">{xml_snippet}</root>'
        root = etree.fromstring(wrapped.encode("utf-8"))

        for p in root.findall(f".//{{{W_NS}}}p"):
            _format_xml_paragraph(p, t_style, c_style, fb_style)

        return "".join(
            etree.tostring(child, encoding="utf-8").decode("utf-8")
            for child in root
        )
    except Exception:
        return xml_snippet


def _extract_styles(style_config: dict | None) -> tuple[dict, dict]:
    """Extract title_style và content_style từ schema cũ hoặc mới."""
    cfg = style_config or {}
    has_new_schema = "title_style" in cfg or "content_style" in cfg
    if has_new_schema:
        return (
            dict(cfg.get("title_style") or {}),
            dict(cfg.get("content_style") or {}),
        )
    return ({}, dict(cfg))
