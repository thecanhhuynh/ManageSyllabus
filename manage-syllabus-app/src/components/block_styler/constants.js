export const TABLE_DEFAULT_COLUMNS = {
  lecturer_info: ["Khoa/Bộ môn", "Giảng viên", "Email", "Phòng làm việc"],
  credit: ["Tổng số/Total", "Lý thuyết/Theory", "Thực hành/Practice", "Số giờ tự học/Self-study"],
  requirement_subject: ["STT/No.", "Môn học điều kiện/Requirements", "Mã môn học/Code"],
  objective_outcomes: ["Mục tiêu/Objective", "Mô tả/Content", "CĐR CTĐT (PLO)"],
  objectives_and_outcomes: ["Mục tiêu/Objective", "Mô tả/Content", "CĐR CTĐT (PLO)"],
  course_learning_outcomes: ["Mục tiêu (CO)", "CĐR môn học (CLO)", "Nội dung/Content"],
  assessment_method: [
    "Thành phần đánh giá/Type of assessment",
    "Bài đánh giá/Assessment methods",
    "Thời điểm/Assessment time",
    "CĐR môn học/CLOs",
    "Tỷ lệ %/Weight %",
  ],
  assessment_methods: [
    "Thành phần đánh giá/Type of assessment",
    "Bài đánh giá/Assessment methods",
    "Thời điểm/Assessment time",
    "CĐR môn học/CLOs",
    "Tỷ lệ %/Weight %",
  ],
  teaching_schedule: [
    "Tuần/buổi học/Week Section",
    "Nội dung/Content",
    "CĐR môn học/CLOs",
    "Hoạt động (Tự học)",
    "Số giờ (Tự học)",
    "Hoạt động (Trực tiếp)",
    "Số giờ (Trực tiếp)",
    "Hoạt động (Trực tuyến)",
    "Số giờ (Trực tuyến)",
    "Bài đánh giá/Student assessment",
    "Tài liệu chính và tài liệu tham khảo/Textbooks and materials",
  ],
  teaching_sessions: [
    "Tuần/buổi học/Week Section",
    "Nội dung/Content",
    "CĐR môn học/CLOs",
    "Hoạt động (Tự học)",
    "Số giờ (Tự học)",
    "Hoạt động (Trực tiếp)",
    "Số giờ (Trực tiếp)",
    "Hoạt động (Trực tuyến)",
    "Số giờ (Trực tuyến)",
    "Bài đánh giá/Student assessment",
    "Tài liệu chính và tài liệu tham khảo/Textbooks and materials",
  ],
};

const OBJECTIVE_OUTCOMES_COLUMNS = [
  { key: "col_objective", defaultLabel: "Mục tiêu/Objective" },
  { key: "col_content", defaultLabel: "Mô tả/Content" },
  { key: "col_plo", defaultLabel: "CĐR CTĐT (PLO)" },
];

const ASSESSMENT_METHOD_COLUMNS = [
  { key: "col_type", defaultLabel: "Thành phần đánh giá/Type of assessment" },
  { key: "col_method", defaultLabel: "Bài đánh giá/Assessment methods" },
  { key: "col_time", defaultLabel: "Thời điểm/Assessment time" },
  { key: "col_clo", defaultLabel: "CĐR môn học/CLOs" },
  { key: "col_weight", defaultLabel: "Tỷ lệ %/Weight %" },
];

const TEACHING_SCHEDULE_COLUMNS = [
  { key: "col_session", defaultLabel: "Tuần/buổi học/Week Section" },
  { key: "col_content", defaultLabel: "Nội dung/Content" },
  { key: "col_clo", defaultLabel: "CĐR môn học/CLOs" },
  { key: "col_self_act", defaultLabel: "Hoạt động (Tự học)" },
  { key: "col_self_hrs", defaultLabel: "Số giờ (Tự học)" },
  { key: "col_ftf_act", defaultLabel: "Hoạt động (Trực tiếp)" },
  { key: "col_ftf_hrs", defaultLabel: "Số giờ (Trực tiếp)" },
  { key: "col_online_act", defaultLabel: "Hoạt động (Trực tuyến)" },
  { key: "col_online_hrs", defaultLabel: "Số giờ (Trực tuyến)" },
  { key: "col_assessment", defaultLabel: "Bài đánh giá/Student assessment" },
  { key: "col_material", defaultLabel: "Tài liệu chính và tài liệu tham khảo/Textbooks and materials" },
];

export const DEFAULT_COLUMN_LABELS = {
  lecturer_info: [
    { key: "faculty", defaultLabel: "Khoa/Bộ môn/Faculty/Division" },
    { key: "lecturer", defaultLabel: "Giảng viên/Academics" },
    { key: "email", defaultLabel: "Địa chỉ email liên hệ/Email" },
    { key: "room", defaultLabel: "Phòng làm việc/Room" },
  ],
  credit: [
    { key: "credit_total", defaultLabel: "Tổng số/Total" },
    { key: "number_theory", defaultLabel: "Lý thuyết/Theory" },
    { key: "number_practice", defaultLabel: "Thực hành/Practice" },
    { key: "hour_self_study", defaultLabel: "Số giờ tự học/Self-study" },
  ],
  requirement_subject: [
    { key: "col_index", defaultLabel: "STT/No." },
    { key: "col_name", defaultLabel: "Môn học điều kiện/Requirements" },
    { key: "col_code", defaultLabel: "Mã môn học/Code" },
  ],
  objective_outcomes: OBJECTIVE_OUTCOMES_COLUMNS,
  objectives_and_outcomes: OBJECTIVE_OUTCOMES_COLUMNS,
  course_learning_outcomes: [
    { key: "col_co", defaultLabel: "Mục tiêu (CO)" },
    { key: "col_clo", defaultLabel: "CĐR môn học (CLO)" },
    { key: "col_content", defaultLabel: "Nội dung/Content" },
  ],
  learning_material: [
    { key: "col_index", defaultLabel: "STT/No." },
    { key: "col_name", defaultLabel: "Tên tài liệu/Title" },
    { key: "col_author", defaultLabel: "Tác giả/Author" },
    { key: "col_type", defaultLabel: "Loại/Type" },
  ],
  assessment_method: ASSESSMENT_METHOD_COLUMNS,
  assessment_methods: ASSESSMENT_METHOD_COLUMNS,
  teaching_schedule: TEACHING_SCHEDULE_COLUMNS,
  teaching_sessions: TEACHING_SCHEDULE_COLUMNS,
};

export const FONT_OPTIONS = [
  { label: "Times New Roman (Chuẩn)", value: "Times New Roman" },
  { label: "Arial", value: "Arial" },
  { label: "Calibri", value: "Calibri" },
  { label: "Roboto", value: "Roboto" },
];

export const ALIGN_OPTIONS = [
  { label: "LEFT (Trái)", value: "LEFT" },
  { label: "CENTER (Giữa)", value: "CENTER" },
  { label: "RIGHT (Phải)", value: "RIGHT" },
  { label: "JUSTIFY (Đều)", value: "JUSTIFY" },
];

export const NESTED_TABLE_LEVELS = {
  course_learning_outcomes: [
    { value: "root", label: "Cấp CO (gộp ô)" },
    { value: "clos", label: "Cấp CLO (từng dòng)" },
  ],
  assessment_method: [
    { value: "root", label: "Cấp Loại (gộp ô)" },
    { value: "methods", label: "Cấp Bài (từng dòng)" },
  ],
};

export const UNSUPPORTED_CUSTOM_COLUMN = new Set(["learning_material"]);

export const SCHEDULE_PRESETS = [
  { label: "Ghi chú GV", column_type: "text", default_value: "-" },
  { label: "Phòng / Teams", column_type: "text", default_value: "Trực tiếp" },
  { label: "Trợ giảng", column_type: "text", default_value: "Không có" },
  { label: "Hạn nộp bài", column_type: "date", default_value: "" },
];

export const ADMINISTRATIVE_COLORS = [
  { label: "Đen (mặc định)", colors: ["#000000"] },
  { label: "Đỏ (nhấn mạnh)", colors: ["#C00000", "#FF0000"] },
  { label: "Xanh navy (tiêu đề)", colors: ["#1F4E79", "#0070C0"] },
  { label: "Xanh lá", colors: ["#375623"] },
  { label: "Xám", colors: ["#595959", "#808080"] },
  { label: "Cam", colors: ["#ED7D31"] },
  { label: "Tím", colors: ["#7030A0"] },
];

export const DEFAULT_COLUMN_WIDTH_FORMULAS = {
  lecturer_info: "4 8",
  credit: "3 3 3 3",
  requirement_subject: "1.5 7.5 3",
  objective_outcomes: "2 7.5 2.5",
  objectives_and_outcomes: "2 7.5 2.5",
  course_learning_outcomes: "2 2.5 7.5",
  assessment_method: "2.9 3 2.6 2.3 1.2",
  assessment_methods: "2.9 3 2.6 2.3 1.2",
  teaching_schedule: "0.85 2.6 0.9 1.8 0.65 2 0.65 1.8 0.65 1.3 1.3",
  teaching_sessions: "0.85 2.6 0.9 1.8 0.65 2 0.65 1.8 0.65 1.3 1.3",
  learning_material: "1 6 3 2",
};

export const getDefaultWidthFormula = (tableCode, colCount) => {
  if (!colCount || colCount <= 0) return "";
  const baseFormula = tableCode ? DEFAULT_COLUMN_WIDTH_FORMULAS[tableCode] : null;
  if (!baseFormula) {
    return Array(colCount).fill(Number((12 / colCount).toFixed(1))).join(" ");
  }
  const baseTokens = baseFormula
    .trim()
    .split(/\s+/)
    .map((n) => parseFloat(n))
    .filter((n) => n > 0);
  if (baseTokens.length === colCount) {
    return baseFormula;
  }
  if (colCount > baseTokens.length) {
    const isSchedule =
      tableCode.includes("schedule") ||
      tableCode.includes("session") ||
      colCount >= 11;
    const extra = isSchedule ? 1.2 : 1.0;
    const extras = Array(colCount - baseTokens.length).fill(extra);
    return [...baseTokens, ...extras].join(" ");
  }
  return baseTokens.slice(0, colCount).join(" ");
};
