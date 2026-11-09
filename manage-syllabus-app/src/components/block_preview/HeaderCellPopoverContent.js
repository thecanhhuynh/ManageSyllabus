import React from "react";
import { Input, Button, Tag, Tooltip } from "antd";
import { UndoOutlined } from "@ant-design/icons";
import { ALIGN_KEYS, ALIGN_ICONS } from "./CellAlignmentPopover";

export const HeaderCellPopoverContent = ({
  colMeta,
  currentAlign,
  onUpdateLabel,
  onResetLabel,
  onSelectAlign,
  onClearAlign,
}) => {
  if (!colMeta) return null;

  return (
    <div className="w-[260px] p-2 space-y-2.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-700">
            Cột #{colMeta.ci + 1}
          </span>
          {colMeta.isCustom ? (
            <Tag color="cyan" className="text-[9px] m-0 leading-tight">
              Tùy biến ({colMeta.column_type || "text"})
            </Tag>
          ) : colMeta.isModified ? (
            <Tag color="blue" className="text-[9px] m-0 leading-tight">
              Đã sửa
            </Tag>
          ) : (
            <Tag className="text-[9px] m-0 leading-tight text-gray-400">
              Gốc
            </Tag>
          )}
        </div>
        {colMeta.isModified && onResetLabel && (
          <Tooltip title="Khôi phục về tên gốc">
            <Button
              size="small"
              type="link"
              danger
              icon={<UndoOutlined className="text-xs" />}
              onClick={() => onResetLabel(colMeta)}
              className="p-0 text-xs h-auto"
            >
              Hoàn tác
            </Button>
          </Tooltip>
        )}
      </div>

      <div>
        <label className="text-[11px] font-semibold text-gray-600 block mb-1">
          Tên hiển thị trên Word:
        </label>
        <Input
          size="small"
          autoFocus
          placeholder={colMeta.defaultLabel}
          value={colMeta.currentLabel}
          onChange={(e) => onUpdateLabel(colMeta, e.target.value)}
          allowClear
          className="text-xs font-medium"
        />
        {!colMeta.isCustom && (
          <span className="text-[10px] text-gray-400 mt-1 block truncate" title={colMeta.defaultLabel}>
            Gốc: <i>{colMeta.defaultLabel}</i>
          </span>
        )}
      </div>

      <div className="pt-1.5 border-t border-gray-100">
        <span className="text-[10px] font-semibold text-gray-500 block mb-1">
          Căn lề cột:
        </span>
        <div className="flex items-center gap-1">
          {ALIGN_KEYS.map((align) => (
            <Tooltip key={align} title={`Căn ${align}`}>
              <Button
                size="small"
                type={currentAlign === align ? "primary" : "default"}
                icon={ALIGN_ICONS[align]}
                onClick={() => onSelectAlign(align)}
                className="text-xs"
              />
            </Tooltip>
          ))}
          {currentAlign && (
            <Tooltip title="Khôi phục căn lề mặc định">
              <Button
                size="small"
                danger
                type="dashed"
                icon={<UndoOutlined />}
                onClick={onClearAlign}
                className="text-xs"
              />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderCellPopoverContent;

