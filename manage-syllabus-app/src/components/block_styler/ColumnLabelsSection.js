import React from "react";
import { Button, Input, Tag, message } from "antd";
import { UndoOutlined } from "@ant-design/icons";
import { DEFAULT_COLUMN_LABELS } from "./constants";


export const ColumnLabelsSection = ({
  tableCode,
  tableLabelOverrides = {},
  customColumns = [],
  onChange,
  onUpdateCustomColumnLabel,
}) => {
  const defaultCols = DEFAULT_COLUMN_LABELS[tableCode] || [];
  const tableCustomCols = (customColumns || []).filter(
    (col) => !col.table_code || col.table_code === tableCode
  );
  const totalCount = defaultCols.length + tableCustomCols.length;
  if (totalCount === 0) return null;

  const hasOverrides = Object.keys(tableLabelOverrides).length > 0;

  const handleReset = () => {
    onChange({});
    message.info("Đã khôi phục tiêu đề cột về mặc định.");
  };

  const handleLabelChange = (key, val) => {
    const next = { ...tableLabelOverrides };
    if (!val || !val.trim()) {
      delete next[key];
    } else {
      next[key] = val;
    }
    onChange(next);
  };

  const renderDefaultCol = (col) => {
    const isModified = Boolean(tableLabelOverrides[col.key]);
    return (
      <div key={col.key} className="bg-white p-2 rounded border border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-gray-600 truncate" title={col.defaultLabel}>
            Gốc: <span className="text-gray-400 italic">{col.defaultLabel}</span>
          </span>
          {isModified && <Tag color="blue" className="text-[9px] mr-0">Đã sửa</Tag>}
        </div>
        <Input
          size="small"
          placeholder={col.defaultLabel}
          value={tableLabelOverrides[col.key] ?? ""}
          onChange={(e) => handleLabelChange(col.key, e.target.value)}
          allowClear
          className="text-xs"
        />
      </div>
    );
  };

  const renderCustomCol = (col) => (
    <div key={col.id || col.column_key} className="bg-white p-2 rounded border border-blue-200">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-blue-900 truncate">
          Cột tùy biến ({col.column_type || "text"})
        </span>
        <Tag color="cyan" className="text-[9px] mr-0">Tùy biến</Tag>
      </div>
      <Input
        size="small"
        placeholder="Nhập tiêu đề cột tùy biến..."
        value={col.column_label ?? ""}
        onChange={(e) => {
          if (onUpdateCustomColumnLabel) {
            onUpdateCustomColumnLabel(col.id || col.column_key, e.target.value);
          }
        }}
        allowClear
        className="text-xs"
      />
    </div>
  );

  return (
    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase text-gray-700">
          🏷️ Tiêu đề cột ({totalCount} cột)
        </span>
        {hasOverrides && (
          <Button
            type="link"
            size="small"
            icon={<UndoOutlined />}
            onClick={handleReset}
            className="p-0 text-xs"
          >
            Khôi phục
          </Button>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mb-2.5">
        Tùy chỉnh nhãn tiêu đề của tất cả {totalCount} cột trong bảng. Thay đổi sẽ đồng bộ sang giao diện giảng viên và file Word.
      </p>
      <div className="space-y-2">
        {defaultCols.map(renderDefaultCol)}
        {tableCustomCols.map(renderCustomCol)}
      </div>
    </div>
  );
};

export default ColumnLabelsSection;
