import React, { useState, useEffect, useMemo } from "react";
import { Drawer, Button, Tag, message } from "antd";
import { UndoOutlined, EyeOutlined, FormatPainterOutlined } from "@ant-design/icons";
import { StyleControls } from "./BlockFormatDrawer";

const areObjectsEqual = (a, b) => {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;
  const cleanA = Object.fromEntries(
    Object.entries(a).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );
  const cleanB = Object.fromEntries(
    Object.entries(b).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );
  const keysA = Object.keys(cleanA);
  const keysB = Object.keys(cleanB);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => cleanA[k] === cleanB[k]);
};

const DEFAULT_MAIN_SECTION_STYLE = {
  font_name: "Times New Roman",
  font_size_pt: 14,
  bold: true,
  italic: false,
  underline: false,
  alignment: "LEFT",
  line_spacing: 1.15,
  space_before_pt: 12,
  space_after_pt: 6,
  color: "#000000",
};

const toRoman = (num) => {
  if (!num || num <= 0) return "";
  const valMap = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];
  let res = "";
  let n = num;
  for (const [val, roman] of valMap) {
    while (n >= val) {
      res += roman;
      n -= val;
    }
  }
  return res;
};

const MOBILE_VIEW_TABS = [
  { label: "Chỉnh sửa", value: "editor", icon: <FormatPainterOutlined /> },
  { label: "Xem trước", value: "preview", icon: <EyeOutlined /> },
  { label: "Cả hai", value: "both" },
];

const MainSectionFormatDrawer = ({
  open,
  mainSection,
  styleConfig = {},
  fallbackStyle = {},
  mockSubsections = [],
  mockSubsectionsBefore = [],
  onSave,
  onClose,
  onPreview,
}) => {
  const [style, setStyle] = useState({});
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [mobileViewTab, setMobileViewTab] = useState("editor");

  useEffect(() => {
    if (open && mainSection?.id) {
      setStyle(styleConfig || {});
    }
  }, [open, mainSection?.id, styleConfig]);

  const isDirty = useMemo(() => {
    return !areObjectsEqual(style, styleConfig || {});
  }, [style, styleConfig]);

  if (!mainSection) return null;

  const defaultStyle = {
    ...DEFAULT_MAIN_SECTION_STYLE,
    ...(fallbackStyle || {}),
  };

  const updateStyle = (key, val) => {
    setStyle((prev) => ({ ...prev, [key]: val }));
  };

  const handleReset = () => {
    setStyle({});
    message.info("Đã khôi phục định dạng phần về mặc định.");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(style);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!onPreview || previewLoading) return;
    setPreviewLoading(true);
    try {
      await onPreview(style);
    } finally {
      setPreviewLoading(false);
    }
  };

  const pos = mainSection.position || 1;
  const roman = toRoman(pos);
  const rawName = (mainSection.name || "").trim();
  const hasPrefix = rawName.toUpperCase().startsWith(`${roman}.`);
  const headingText = hasPrefix ? rawName : `${roman}. ${rawName}`;

  const isBold = style.bold !== undefined ? style.bold : defaultStyle.bold;
  const isItalic = style.italic !== undefined ? style.italic : defaultStyle.italic;
  const isUnderline = style.underline !== undefined ? style.underline : defaultStyle.underline;
  const align = (style.alignment || defaultStyle.alignment || "LEFT").toLowerCase();

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-blue-700">
            <FormatPainterOutlined /> Định dạng:
          </span>
          <span className="font-semibold text-blue-800">{rawName}</span>
          <Tag color="geekblue">Main Section</Tag>
        </div>
      }
      placement="right"
      width="min(90vw, 900px)"
      style={{ maxWidth: 900 }}
      styles={{ body: { padding: 16 } }}
      open={open}
      onClose={onClose}
      extra={
        <div className="flex items-center gap-2">
          {onPreview && (
            <Button
              icon={<EyeOutlined />}
              loading={previewLoading}
              onClick={handlePreview}
              size="small"
            >
              Xem trước
            </Button>
          )}
          <Button
            type="primary"
            size="small"
            loading={saving}
            disabled={!isDirty}
            onClick={handleSave}
            className="lg:hidden"
          >
            Lưu
          </Button>
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <Button
            size="small"
            icon={<UndoOutlined />}
            onClick={handleReset}
            disabled={!style || Object.keys(style).length === 0}
          >
            Khôi phục mặc định
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={onClose}>Hủy</Button>
            <Button
              type="primary"
              loading={saving}
              disabled={!isDirty}
              onClick={handleSave}
            >
              Lưu
            </Button>
          </div>
        </div>
      }
    >
      <div className="lg:hidden mb-3">
        <div className="grid grid-cols-3 p-1 bg-[#f0f2f5] rounded-lg border border-[#d9d9d9] gap-1 w-full">
          {MOBILE_VIEW_TABS.map((tab) => {
            const isSelected = mobileViewTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setMobileViewTab(tab.value)}
                className={`py-1 text-xs rounded-[6px] transition-all text-center cursor-pointer select-none flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? "bg-white text-[#1677ff] border border-[#d9d9d9] shadow-xs font-semibold"
                    : "bg-transparent text-[#595959] border border-transparent hover:text-[#1677ff] font-medium"
                }`}
              >
                {tab.icon && <span className="text-[11px]">{tab.icon}</span>}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:h-full min-h-0">
        <div
          className={`space-y-4 overflow-y-auto pr-1 ${
            mobileViewTab === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="text-xs font-bold uppercase text-gray-500 mb-2">
            Định dạng tiêu đề mục (Heading)
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <StyleControls
              style={style}
              defaultStyle={defaultStyle}
              onUpdate={updateStyle}
              showSpacing={true}
            />
          </div>
        </div>

        <div
          className={`border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6 flex flex-col min-w-0 ${
            mobileViewTab === "editor" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-blue-900 font-semibold">
              <EyeOutlined /> Bản xem trước (Live Preview)
            </span>
            <Tag color="blue" className="mr-0 text-[10px]">Realtime</Tag>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-50/70 p-4 rounded-lg border border-gray-200 min-h-[280px]">
            <div className="bg-white p-5 border border-gray-200 rounded-md shadow-sm">
              {mockSubsectionsBefore.length > 0 && (
                <div
                  className="opacity-40 select-none mb-3 pb-2 border-b border-dashed border-gray-300"
                  style={{
                    borderTop: "none",
                    borderLeft: "none",
                    borderRight: "none",
                    borderBottom: "1px dashed #d1d5db",
                  }}
                >
                  {mockSubsectionsBefore.map((sub, idx) => (
                    <p
                      key={sub.id || idx}
                      className="text-gray-500 italic"
                      style={{
                        fontFamily: "Times New Roman",
                        fontSize: "12pt",
                        fontWeight: "normal",
                        lineHeight: 1.15,
                        marginBottom: "4pt",
                        marginTop: "0pt",
                      }}
                    >
                      {sub.position || idx + 1}. {sub.name}
                    </p>
                  ))}
                </div>
              )}

              <p
                style={{
                  fontFamily: style.font_name || defaultStyle.font_name || "Times New Roman",
                  fontSize: `${style.font_size_pt || defaultStyle.font_size_pt || 14}pt`,
                  fontWeight: isBold ? "bold" : "normal",
                  fontStyle: isItalic ? "italic" : "normal",
                  textDecoration: isUnderline ? "underline" : "none",
                  textAlign: align === "justify" ? "justify" : align,
                  lineHeight: style.line_spacing ?? defaultStyle.line_spacing ?? 1.15,
                  marginTop: `${style.space_before_pt ?? defaultStyle.space_before_pt ?? 12}pt`,
                  marginBottom: `${style.space_after_pt ?? defaultStyle.space_after_pt ?? 6}pt`,
                  wordBreak: "break-word",
                  color: style.color || defaultStyle.color || "#000000",
                }}
              >
                {headingText}
              </p>

              {mockSubsections.length > 0 && (
                <div className="opacity-40 select-none mt-2">
                  {mockSubsections.map((sub, idx) => (
                    <p
                      key={sub.id || idx}
                      className="text-gray-500 italic"
                      style={{
                        fontFamily: "Times New Roman",
                        fontSize: "12pt",
                        fontWeight: "normal",
                        lineHeight: 1.15,
                        marginBottom: "4pt",
                        marginTop: "0pt",
                      }}
                    >
                      {sub.position || idx + 1}. {sub.name}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default MainSectionFormatDrawer;
