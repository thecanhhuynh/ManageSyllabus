import re


def validate_date_line(text: str) -> tuple[bool, str]:
    if not text or not text.strip():
        return True, ""

    trimmed = text.strip()
    if trimmed.count("{") != trimmed.count("}"):
        return False, "Cấu trúc ngoặc nhọn '{ }' của các thẻ không hợp lệ (thừa hoặc thiếu dấu ngoặc)."

    tags = re.findall(r"\{[^}]*\}", trimmed)
    valid_pattern = re.compile(r"^\{(DD|MM|YYYY)\}$", re.IGNORECASE)
    for t in tags:
        if not valid_pattern.match(t):
            return False, f"Thẻ '{t}' không đúng định dạng. Chỉ chấp nhận các thẻ {{DD}}, {{MM}}, {{YYYY}}."

    missing = []
    if not re.search(r"\{DD\}", trimmed, re.IGNORECASE):
        missing.append("{DD}")
    if not re.search(r"\{MM\}", trimmed, re.IGNORECASE):
        missing.append("{MM}")
    if not re.search(r"\{YYYY\}", trimmed, re.IGNORECASE):
        missing.append("{YYYY}")

    if missing:
        return False, f"Dòng ngày tháng ban hành phải chứa đủ 3 mốc: {{DD}}, {{MM}}, {{YYYY}}. Đang thiếu: {', '.join(missing)}."

    for token in ["DD", "MM", "YYYY"]:
        count = len(re.findall(rf"\{{{token}\}}", trimmed, re.IGNORECASE))
        if count > 1:
            return False, f"Mỗi thẻ {{{token}}} chỉ được xuất hiện 1 lần trong câu."

    return True, ""
