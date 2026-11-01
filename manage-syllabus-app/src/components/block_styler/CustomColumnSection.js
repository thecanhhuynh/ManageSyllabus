import React from "react";
import { Divider, Button, Alert, Tag, Tooltip, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  TABLE_DEFAULT_COLUMNS,
  SCHEDULE_PRESETS,
} from "./constants";

const CustomColumnItem = ({
  col,
  index,
  tableCode,
  isNested,
  onEdit,
  onDelete,
}) => {
  const uniqueKey = col.column_key || col.id || index;
  const baseColCount = (TABLE_DEFAULT_COLUMNS[tableCode] || []).length;
  const colNumber = baseColCount + index + 1;
  const colTitle =
    tableCode === "teaching_schedule"
      ? `Cột (${colNumber}): ${col.column_label}`
      : col.column_label;

  const levelTag = isNested && col.level && (
    <Tag color={col.level === "root" ? "blue" : "orange"} className="mr-0 text-[10px]">
      {col.level === "root"
        ? tableCode === "course_learning_outcomes"
          ? "CO"
          : "Loại"
        : tableCode === "course_learning_outcomes"
          ? "CLO"
          : "Bài"}
    </Tag>
  );

  return (
    <div
      key={uniqueKey}
      className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-md flex items-center justify-between hover:bg-blue-50 transition-colors"
    >
      <div className="flex-1 min-w-0 mr-2 flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-blue-950 truncate">
          {colTitle}
        </span>
        <Tag color={col.is_draft ? "orange" : "blue"} className="mr-0 text-[10px]">
          {col.is_draft ? "Draft" : col.column_type || "text"}
        </Tag>
        {levelTag}
        {col.default_value && (
          <span className="text-[11px] text-gray-500 font-normal">
            Mặc định:{" "}
            <code className="text-gray-700 bg-white px-1 py-0.5 rounded border border-gray-200">
              "{col.default_value}"
            </code>
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Tooltip title="Chỉnh sửa">
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(col)}
          />
        </Tooltip>
        <Popconfirm
          title={col.is_draft ? "Xóa cột draft?" : "Xóa cột đã lưu?"}
          description={
            col.is_draft
              ? "Cột draft sẽ bị xóa khỏi UI."
              : "Cột sẽ bị ẩn (soft delete) khỏi tất cả block dùng bảng này."
          }
          onConfirm={() => onDelete(col)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      </div>
    </div>
  );
};

export const CustomColumnSection = ({
  tableCode,
  supportsCustomColumn,
  isNested,
  draftCustomColumns = [],
  onOpenAdd,
  onApplyPreset,
  onEditColumn,
  onDeleteColumn,
}) => {
  return (
    <div>
      <Divider className="my-3" />
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold uppercase text-gray-500 m-0">Cột trong bảng</h4>
        {supportsCustomColumn && (
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={onOpenAdd}
          >
            Thêm cột tùy biến
          </Button>
        )}
      </div>

      {tableCode === "teaching_schedule" && supportsCustomColumn && (
        <Alert
          type="info"
          showIcon
          className="mb-3 text-xs"
          message="Khổ A4 Ngang (Landscape)"
          description="Cột tùy biến sẽ tự động được áp dụng đồng bộ cho tất cả các ca học (Sáng, Chiều/Tối, Thực hành)."
        />
      )}

      {tableCode === "teaching_schedule" && supportsCustomColumn && draftCustomColumns.length < 10 && (
        <div className="mb-3">
          <span className="text-[11px] text-gray-500 font-medium block mb-1.5">
            Gợi ý thêm nhanh:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SCHEDULE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                size="small"
                type="dashed"
                className="text-xs text-blue-700 border-blue-300 hover:border-blue-500 hover:text-blue-800 bg-white"
                icon={<PlusOutlined className="text-[10px]" />}
                onClick={() => onApplyPreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {!supportsCustomColumn && (
        <div className="text-xs text-blue-700 bg-blue-50 p-3 rounded border border-blue-100">
          ℹ️ Khối Học liệu hiển thị dưới dạng danh mục văn bản/đoạn văn, không sử dụng bảng nên không hỗ trợ thêm cột tùy biến.
        </div>
      )}

      {supportsCustomColumn && draftCustomColumns.length === 0 && (
        <p className="text-xs text-gray-400 italic">Chưa có cột tùy biến nào.</p>
      )}

      {supportsCustomColumn && draftCustomColumns.length > 0 && (
        <div className="space-y-2">
          {draftCustomColumns.map((col, index) => (
            <CustomColumnItem
              key={col.column_key || col.id || index}
              col={col}
              index={index}
              tableCode={tableCode}
              isNested={isNested}
              onEdit={onEditColumn}
              onDelete={onDeleteColumn}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomColumnSection;
