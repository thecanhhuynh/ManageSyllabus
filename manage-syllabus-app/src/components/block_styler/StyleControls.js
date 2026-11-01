import React from "react";
import { Select, InputNumber, Button, ColorPicker } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
} from "@ant-design/icons";
import {
  FONT_OPTIONS,
  ALIGN_OPTIONS,
  ADMINISTRATIVE_COLORS,
} from "./constants";

const extractHexColor = (color) => {
  if (!color) return null;
  if (typeof color === "string") return color.toUpperCase();
  if (typeof color.toHexString === "function") return color.toHexString().toUpperCase();
  return String(color).toUpperCase();
};

export const SpacingControls = ({ style = {}, defaultStyle = {}, onUpdate }) => (
  <div className="space-y-2 pt-2 border-t border-gray-200 mt-2">
    <div className="text-xs font-semibold text-gray-700">Khoảng cách:</div>
    <div className="grid grid-cols-3 gap-2">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] text-gray-600">Giãn dòng:</label>
          {!style.line_spacing && (
            <span className="text-[9px] text-gray-400 italic">(Mặc định)</span>
          )}
        </div>
        <Select
          className="w-full text-xs"
          style={{ opacity: style.line_spacing ? 1 : 0.65 }}
          value={style.line_spacing || defaultStyle.line_spacing || 1.15}
          options={[
            { label: "1.0", value: 1.0 },
            { label: "1.15", value: 1.15 },
            { label: "1.5", value: 1.5 },
            { label: "2.0", value: 2.0 },
          ]}
          onChange={(val) => onUpdate("line_spacing", val)}
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] text-gray-600">Trước (pt):</label>
          {style.space_before_pt === undefined && (
            <span className="text-[9px] text-gray-400 italic">(Mặc định)</span>
          )}
        </div>
        <InputNumber
          className="w-full text-xs"
          style={{ opacity: style.space_before_pt !== undefined ? 1 : 0.65 }}
          min={0}
          max={72}
          value={
            style.space_before_pt !== undefined
              ? style.space_before_pt
              : defaultStyle.space_before_pt || 0
          }
          onChange={(val) => onUpdate("space_before_pt", val ?? 0)}
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] text-gray-600">Sau (pt):</label>
          {style.space_after_pt === undefined && (
            <span className="text-[9px] text-gray-400 italic">(Mặc định)</span>
          )}
        </div>
        <InputNumber
          className="w-full text-xs"
          style={{ opacity: style.space_after_pt !== undefined ? 1 : 0.65 }}
          min={0}
          max={72}
          value={
            style.space_after_pt !== undefined
              ? style.space_after_pt
              : defaultStyle.space_after_pt || 6
          }
          onChange={(val) => onUpdate("space_after_pt", val ?? 0)}
        />
      </div>
    </div>
  </div>
);

export const StyleControls = ({
  style = {},
  defaultStyle = {},
  onUpdate,
  showSpacing = false,
}) => {
  const isBold = style.bold !== undefined ? style.bold : defaultStyle.bold;
  const isItalic = style.italic !== undefined ? style.italic : defaultStyle.italic;
  const isUnderline = style.underline !== undefined ? style.underline : defaultStyle.underline;

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-600">Phông chữ:</label>
          {!style.font_name && (
            <span className="text-[10px] text-gray-400 italic">(Mặc định)</span>
          )}
        </div>
        <Select
          className="w-full"
          style={{ opacity: style.font_name ? 1 : 0.65 }}
          value={style.font_name || defaultStyle.font_name || "Times New Roman"}
          options={FONT_OPTIONS}
          onChange={(val) => onUpdate("font_name", val)}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-600">Cỡ chữ (pt):</label>
            {!style.font_size_pt && (
              <span className="text-[10px] text-gray-400 italic">(Mặc định)</span>
            )}
          </div>
          <InputNumber
            className="w-full"
            style={{ opacity: style.font_size_pt ? 1 : 0.65 }}
            min={8}
            max={36}
            value={style.font_size_pt || defaultStyle.font_size_pt || 13}
            onChange={(val) => onUpdate("font_size_pt", val)}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-600">Căn lề:</label>
            {!style.alignment && (
              <span className="text-[10px] text-gray-400 italic">(Mặc định)</span>
            )}
          </div>
          <Select
            className="w-full"
            style={{ opacity: style.alignment ? 1 : 0.65 }}
            value={(style.alignment || defaultStyle.alignment || "LEFT").toUpperCase()}
            options={ALIGN_OPTIONS}
            onChange={(val) => onUpdate("alignment", val)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <Button
          type={isBold ? "primary" : "default"}
          icon={<BoldOutlined />}
          size="small"
          onClick={() => onUpdate("bold", !isBold)}
        >
          Đậm
        </Button>
        <Button
          type={isItalic ? "primary" : "default"}
          icon={<ItalicOutlined />}
          size="small"
          onClick={() => onUpdate("italic", !isItalic)}
        >
          Nghiêng
        </Button>
        <Button
          type={isUnderline ? "primary" : "default"}
          icon={<UnderlineOutlined />}
          size="small"
          onClick={() => onUpdate("underline", !isUnderline)}
        >
          Gạch chân
        </Button>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-gray-500">Màu chữ:</span>
          <ColorPicker
            value={style.color || defaultStyle.color || "#000000"}
            presets={ADMINISTRATIVE_COLORS}
            format="hex"
            allowClear
            onClear={() => onUpdate("color", null)}
            onChange={(color) => onUpdate("color", extractHexColor(color))}
            size="small"
            showText={false}
          />
        </div>
      </div>

      {showSpacing && (
        <SpacingControls
          style={style}
          defaultStyle={defaultStyle}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

export default StyleControls;
