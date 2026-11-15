import React from "react";
import { Card, Input, Button, Popconfirm, Select, Tag } from "antd";
import { DeleteOutlined, InfoCircleOutlined } from "@ant-design/icons";
import TypographyPopover from "./TypographyPopover";

const ROLE_OPTIONS = [
  { value: "faculty_dean", label: "Phụ trách / Trưởng Khoa (Lãnh đạo Khoa)" },
  { value: "lecturer", label: "Giảng viên biên soạn đề cương" },
  { value: "head_of_dept", label: "Trưởng bộ môn" },
  { value: "custom", label: "Tùy biến (Cố định theo người nhập)" },
];

const getRoleBadge = (roleKey) => {
  if (roleKey === "faculty_dean") return <Tag color="blue" className="whitespace-nowrap m-0">Lãnh đạo Khoa</Tag>;
  if (roleKey === "lecturer") return <Tag color="green" className="whitespace-nowrap m-0">Giảng viên</Tag>;
  if (roleKey === "head_of_dept") return <Tag color="orange" className="whitespace-nowrap m-0">Trưởng bộ môn</Tag>;
  return <Tag color="default" className="whitespace-nowrap m-0">Tùy biến</Tag>;
};

const getRoleHint = (roleKey) => {
  if (roleKey === "faculty_dean") {
    return "Khi duyệt/xuất file, hệ thống sẽ tự động điền tên và chữ ký của Lãnh đạo Khoa.";
  }
  if (roleKey === "lecturer") {
    return "Khi xuất file, hệ thống sẽ tự động điền tên và chữ ký của Giảng viên biên soạn.";
  }
  if (roleKey === "head_of_dept") {
    return "Khi xuất file, hệ thống sẽ tự động điền tên và chữ ký của Trưởng bộ môn.";
  }
  return "Tên và thông tin chữ ký được cố định theo nội dung nhập bên dưới.";
};

export const SignatureColumnCard = ({
  col,
  cIdx,
  canDelete,
  onUpdateRole,
  onUpdateTitle,
  onUpdateTitleStyle,
  onUpdateSubtitle,
  onUpdateName,
  onUpdateNameStyle,
  onDeleteColumn,
}) => {
  const currentRole = col.role_key || "custom";
  const isCustom = currentRole === "custom";

  return (
    <Card
      size="small"
      type="inner"
      title={
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <span className="text-xs font-bold text-gray-800 flex-shrink-0">
            {`Cột ${cIdx + 1}`}
          </span>
          {col.name && (
            <span
              className="text-xs text-gray-600 truncate max-w-[120px]"
              title={col.name}
            >
              ({col.name})
            </span>
          )}
          <span className="flex-shrink-0">
            {getRoleBadge(currentRole)}
          </span>
        </div>
      }
      extra={
        canDelete && (
          <Popconfirm
            title="Xóa cột chữ ký này?"
            onConfirm={() => onDeleteColumn(cIdx)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger type="text" size="small" icon={<DeleteOutlined />}>
              Xóa cột
            </Button>
          </Popconfirm>
        )
      }
      className="bg-gray-50/70 border-gray-200 shadow-2xs"
    >
      <div className="space-y-3">
        {/* Role Selector */}
        <div>
          <label className="text-[11px] font-medium text-gray-700 block mb-1">
            Vai trò chữ ký (Gán tự động):
          </label>
          <Select
            size="small"
            className="w-full"
            value={currentRole}
            options={ROLE_OPTIONS}
            onChange={(val) => onUpdateRole && onUpdateRole(cIdx, val)}
          />
          <div className="flex items-start gap-1 text-[10px] text-gray-500 italic mt-1">
            <InfoCircleOutlined className="text-blue-500 mt-0.5 flex-shrink-0" />
            <span>{getRoleHint(currentRole)}</span>
          </div>
        </div>

        {/* Title line 1 */}
        <div>
          <label className="text-[11px] font-medium text-gray-700 block mb-1">
            Tiêu đề dòng 1 (Tiếng Việt):
          </label>
          <div className="flex gap-2 items-center">
            <Input
              size="small"
              value={col.title_lines?.[0]?.text || ""}
              onChange={(e) => onUpdateTitle(cIdx, 0, e.target.value)}
              placeholder="VD: PHỤ TRÁCH KHOA CNTT"
              className="font-bold text-xs flex-1"
            />
            <TypographyPopover
              title="Định dạng Tiêu đề 1"
              style={col.title_lines?.[0]?.style || {}}
              defaultStyle={{ bold: true, font_size_pt: 12, alignment: "CENTER" }}
              onUpdate={(k, v) => onUpdateTitleStyle(cIdx, 0, k, v)}
            />
          </div>
        </div>

        {/* Title line 2 */}
        <div>
          <label className="text-[11px] font-medium text-gray-700 block mb-1">
            Tiêu đề dòng 2 (Tiếng Anh):
          </label>
          <div className="flex gap-2 items-center">
            <Input
              size="small"
              value={col.title_lines?.[1]?.text || ""}
              onChange={(e) => onUpdateTitle(cIdx, 1, e.target.value)}
              placeholder="VD: DEPUTY DEAN"
              className="font-semibold text-xs flex-1"
            />
            <TypographyPopover
              title="Định dạng Tiêu đề 2"
              style={col.title_lines?.[1]?.style || {}}
              defaultStyle={{ italic: true, font_size_pt: 11, alignment: "CENTER" }}
              onUpdate={(k, v) => onUpdateTitleStyle(cIdx, 1, k, v)}
            />
          </div>
        </div>

        {/* Subtitle */}
        <div>
          <label className="text-[11px] font-medium text-gray-700 block mb-1">
            Ghi chú phụ dưới chức danh:
          </label>
          <Input
            size="small"
            value={col.subtitle || ""}
            onChange={(e) => onUpdateSubtitle(cIdx, e.target.value)}
            placeholder="VD: (Ký và ghi rõ họ tên-Signed with fullname)"
            className="italic text-xs"
          />
        </div>

        {/* Name */}
        <div>
          <label className="text-[11px] font-medium text-gray-700 block mb-1">
            {isCustom ? "Họ và tên người ký (Cố định):" : "Họ và tên người ký (Mẫu preview):"}
          </label>
          <div className="flex gap-2 items-center">
            <Input
              size="small"
              value={col.name || ""}
              onChange={(e) => onUpdateName(cIdx, e.target.value)}
              placeholder={isCustom ? "VD: TS. Nguyễn Văn A" : "VD: TS. Nguyễn Văn A (Mẫu hiển thị)"}
              className="font-bold text-xs flex-1"
            />
            <TypographyPopover
              title="Định dạng Họ tên"
              style={col.name_style || {}}
              defaultStyle={{ bold: true, font_size_pt: 12, alignment: "CENTER" }}
              onUpdate={(k, v) => onUpdateNameStyle(cIdx, k, v)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SignatureColumnCard;
