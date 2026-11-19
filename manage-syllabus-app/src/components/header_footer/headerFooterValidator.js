export const validateDateLine = (text) => {
  if (!text || !text.trim()) {
    return { isValid: true, error: null };
  }

  const trimmed = text.trim();
  const openCount = (trimmed.match(/\{/g) || []).length;
  const closeCount = (trimmed.match(/\}/g) || []).length;
  if (openCount !== closeCount) {
    return {
      isValid: false,
      error: "Cấu trúc ngoặc nhọn '{ }' của các thẻ không hợp lệ (thừa hoặc thiếu dấu ngoặc).",
    };
  }

  const allBracedTags = trimmed.match(/\{[^}]*\}/g) || [];
  const validTagRegex = /^\{(DD|MM|YYYY)\}$/i;
  for (const tag of allBracedTags) {
    if (!validTagRegex.test(tag)) {
      return {
        isValid: false,
        error: `Thẻ "${tag}" không đúng định dạng. Chỉ chấp nhận các thẻ {DD}, {MM}, {YYYY}.`,
      };
    }
  }

  const hasDD = /\{DD\}/i.test(trimmed);
  const hasMM = /\{MM\}/i.test(trimmed);
  const hasYYYY = /\{YYYY\}/i.test(trimmed);
  const missing = [];
  if (!hasDD) missing.push("{DD}");
  if (!hasMM) missing.push("{MM}");
  if (!hasYYYY) missing.push("{YYYY}");

  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Dòng ngày tháng ban hành phải chứa đủ 3 mốc: {DD}, {MM}, {YYYY}. Đang thiếu: ${missing.join(", ")}.`,
    };
  }

  const ddCount = (trimmed.match(/\{DD\}/gi) || []).length;
  const mmCount = (trimmed.match(/\{MM\}/gi) || []).length;
  const yyyyCount = (trimmed.match(/\{YYYY\}/gi) || []).length;
  if (ddCount > 1 || mmCount > 1 || yyyyCount > 1) {
    return {
      isValid: false,
      error: "Mỗi thẻ {DD}, {MM}, {YYYY} chỉ được xuất hiện 1 lần trong câu.",
    };
  }

  return { isValid: true, error: null };
};
