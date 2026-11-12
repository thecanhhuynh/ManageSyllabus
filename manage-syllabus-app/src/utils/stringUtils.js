/**
 * Tiện ích xử lý chuỗi và làm sạch khoảng trắng cho các ô nhập liệu
 */

/**
 * Chuẩn hóa chuỗi văn bản hoàn chỉnh:
 * 1. Cắt bỏ toàn bộ khoảng trắng ở 2 đầu chuỗi (trim)
 * 2. Gộp nhiều khoảng trắng/tab liên tiếp ở giữa các từ thành 1 khoảng trắng duy nhất
 *
 * Ví dụ:
 *  - "hi          AI" => "hi AI"
 *  - "good    morning     AI   " => "good morning AI"
 *  - "   Đại   học     Mở   TPHCM   " => "Đại học Mở TPHCM"
 *
 * @param {any} value - Giá trị cần chuẩn hóa
 * @param {boolean} multiline - Nếu là true (như TextArea), giữ nguyên xuống dòng và chỉ chuẩn hóa từng dòng
 * @returns {any} Chuỗi đã được chuẩn hóa hoặc giá trị ban đầu nếu không phải string
 */
export const cleanWhitespace = (value, multiline = false) => {
  if (typeof value !== "string") return value;

  if (multiline) {
    return value
      .trim()
      .split("\n")
      .map((line) => line.trim().replace(/[^\S\r\n]+/g, " "))
      .join("\n");
  }

  return value.trim().replace(/\s+/g, " ");
};

/**
 * Chuẩn hóa ngay khi người dùng đang gõ (typing / onChange / paste):
 * - Không cho phép nhập khoảng trắng ở đầu dòng
 * - Gộp các khoảng trắng liên tiếp ở giữa thành 1 khoảng trắng
 * - Cho phép giữ lại 1 khoảng trắng ở cuối để người dùng tiếp tục gõ từ kế tiếp
 *
 * @param {any} value - Giá trị đang nhập
 * @param {boolean} multiline - Cho phép xuống dòng hay không
 * @returns {any}
 */
export const formatTypingWhitespace = (value, multiline = false) => {
  if (typeof value !== "string") return value;

  if (multiline) {
    return value.replace(/^[^\S\r\n]+/, "").replace(/[^\S\r\n]{2,}/g, " ");
  }

  return value.replace(/^\s+/, "").replace(/\s{2,}/g, " ");
};

/**
 * Đệ quy làm sạch khoảng trắng tất cả các trường string trong dữ liệu Form trước khi gửi API
 *
 * @param {any} data - Dữ liệu Form (object, array, string)
 * @param {string[]} excludedKeys - Danh sách các field không làm sạch (ví dụ mật khẩu)
 * @returns {any} Dữ liệu đã làm sạch
 */
export const cleanFormData = (
  data,
  excludedKeys = [
    "password",
    "new_password",
    "confirm_password",
    "client_secret",
    "token",
    "refresh_token",
  ]
) => {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    return cleanWhitespace(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => cleanFormData(item, excludedKeys));
  }

  if (typeof data === "object") {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      const isExcluded = excludedKeys.some(
        (exKey) => exKey.toLowerCase() === key.toLowerCase()
      );

      if (isExcluded) {
        cleaned[key] = value;
      } else if (typeof value === "string") {
        cleaned[key] = cleanWhitespace(value);
      } else if (typeof value === "object" && value !== null) {
        cleaned[key] = cleanFormData(value, excludedKeys);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  return data;
};
