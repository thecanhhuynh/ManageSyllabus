export const TABLE_DEFAULT_COLUMNS = {
  lecturer_info: ["Thông tin", "Giá trị"],
  credit: ["Tổng số/Total", "Lý thuyết/Theory", "Thực hành/Practice", "Tự học/Self-study"],
  requirement_subject: ["STT/No.", "Môn học điều kiện", "Mã môn học/Code"],
  objectives_and_outcomes: ["Mục tiêu/Objective", "Mô tả/Content", "CĐR CTĐT (PLO)"],
  course_learning_outcomes: ["CĐR HP (CLO)", "Mô tả chuẩn đầu ra", "Mức độ giảng dạy"],
  assessment_method: ["Thành phần", "Bài đánh giá", "Phương pháp", "Trọng số", "CĐR HP"],
  teaching_schedule: [
    "Tuần/Buổi", "Nội dung", "CĐR môn học",
    "Tự học (HĐ)", "Tự học (Giờ)",
    "Trực tiếp (HĐ)", "Trực tiếp (Giờ)",
    "Trực tuyến (HĐ)", "Trực tuyến (Giờ)",
    "Bài đánh giá", "Tài liệu"
  ],
};

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
    { key: "col_type", defaultLabel: "Loại" },
  ],
  objectives_and_outcomes: [
    { key: "col_index", defaultLabel: "STT/No." },
    { key: "col_content", defaultLabel: "Mục tiêu/Objective" },
    { key: "col_plo", defaultLabel: "CĐR CTĐT (PLO)" },
  ],
  course_learning_outcomes: [
    { key: "col_co", defaultLabel: "Mục tiêu (CO)" },
    { key: "col_clo", defaultLabel: "CĐR môn học (CLO)" },
    { key: "col_content", defaultLabel: "Nội dung/Content" },
    { key: "col_plo", defaultLabel: "CĐR CTĐT (PLO)" },
  ],
  learning_material: [
    { key: "col_index", defaultLabel: "STT/No." },
    { key: "col_name", defaultLabel: "Tên tài liệu/Title" },
    { key: "col_author", defaultLabel: "Tác giả/Author" },
    { key: "col_type", defaultLabel: "Loại/Type" },
  ],
  assessment_method: [
    { key: "col_type", defaultLabel: "Thành phần đánh giá/Type" },
    { key: "col_method", defaultLabel: "Bài đánh giá/Hình thức" },
    { key: "col_time", defaultLabel: "Thời điểm/Time" },
    { key: "col_clo", defaultLabel: "CĐR môn học/CLOs" },
    { key: "col_weight", defaultLabel: "Tỷ lệ %/Weight %" },
  ],
  teaching_schedule: [
    { key: "col_session", defaultLabel: "Buổi/Session" },
    { key: "col_content", defaultLabel: "Nội dung/Content" },
    { key: "col_offline", defaultLabel: "Offline (giờ)" },
    { key: "col_online", defaultLabel: "Online (giờ)" },
    { key: "col_self", defaultLabel: "Tự học (giờ)" },
    { key: "col_clo", defaultLabel: "CLO" },
    { key: "col_material", defaultLabel: "Học liệu" },
  ],
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
