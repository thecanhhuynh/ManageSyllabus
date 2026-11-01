import React from "react";
import { Button, Tooltip } from "antd";
import {
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  MenuOutlined,
  UndoOutlined,
  CheckSquareOutlined,
  CloseOutlined,
} from "@ant-design/icons";

export const ALIGN_ICONS = {
  LEFT: <AlignLeftOutlined />,
  CENTER: <AlignCenterOutlined />,
  RIGHT: <AlignRightOutlined />,
  JUSTIFY: <MenuOutlined />,
};

export const ALIGN_KEYS = ["LEFT", "CENTER", "RIGHT", "JUSTIFY"];

export const CellAlignPopoverContent = ({ currentAlign, onSelectAlign, onClearAlign }) => (
  <div className="flex items-center gap-1 p-1">
    {ALIGN_KEYS.map((align) => (
      <Tooltip key={align} title={`Căn ${align}`}>
        <Button
          size="small"
          type={currentAlign === align ? "primary" : "default"}
          icon={ALIGN_ICONS[align]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectAlign(align);
          }}
        />
      </Tooltip>
    ))}
    {currentAlign && (
      <Tooltip title="Mặc định">
        <Button
          size="small"
          danger
          type="dashed"
          icon={<UndoOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onClearAlign();
          }}
        />
      </Tooltip>
    )}
  </div>
);

export const BatchAlignmentBar = ({ count, onAlign, onClear, onDeselect }) => (
  <div className="mb-2 p-2.5 bg-white text-gray-900 border-2 border-black rounded-lg shadow-sm flex items-center justify-between flex-wrap gap-2 text-xs">
    <div className="flex items-center gap-2">
      <span className="font-bold text-gray-900 flex items-center gap-1.5">
        <CheckSquareOutlined /> Đang chọn: {count} ô
      </span>
      <span className="text-[11px] text-gray-500">(Giữ Ctrl để chọn thêm/bỏ chọn)</span>
    </div>
    <div className="flex items-center gap-1.5">
      {ALIGN_KEYS.map((align) => (
        <Tooltip key={align} title={`Căn ${align} cho ${count} ô đã chọn`}>
          <Button
            size="small"
            icon={ALIGN_ICONS[align]}
            onClick={() => onAlign(align)}
            className="font-medium text-xs text-gray-900 border border-gray-400 hover:border-black hover:text-black hover:bg-gray-100"
          >
            {align === "LEFT" ? "Trái" : align === "CENTER" ? "Giữa" : align === "RIGHT" ? "Phải" : "Đều"}
          </Button>
        </Tooltip>
      ))}
      <Tooltip title="Khôi phục mặc định">
        <Button size="small" danger icon={<UndoOutlined />} onClick={onClear} className="font-medium text-xs">
          Mặc định
        </Button>
      </Tooltip>
      <Button
        size="small"
        type="text"
        className="text-gray-700 hover:text-black hover:bg-gray-100 ml-1 font-semibold"
        onClick={onDeselect}
      >
        <CloseOutlined /> Bỏ chọn
      </Button>
    </div>
  </div>
);
