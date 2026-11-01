import React from "react";
import { Input, Button, Upload, InputNumber, Select, Popconfirm, Card } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { getMediaUrl } from "./headerFooterDefaults";
import TypographyPopover from "./shared/TypographyPopover";
import TextLineListCard from "./shared/TextLineListCard";

const LOGO_ALIGN_OPTIONS = [
  { label: "Trái (LEFT)", value: "LEFT" },
  { label: "Giữa (CENTER)", value: "CENTER" },
  { label: "Phải (RIGHT)", value: "RIGHT" },
];

const HeaderFormTab = ({
  header,
  setHeader,
  onUploadLogo,
  onDeleteLogo,
  uploadingLogo,
}) => {
  const updateAppendixStyle = (key, val) => {
    setHeader((prev) => ({
      ...prev,
      appendix_style: { ...(prev.appendix_style || {}), [key]: val },
    }));
  };

  const updateLineList = (field, updater) => {
    setHeader((prev) => ({
      ...prev,
      [field]: updater(prev[field] || []),
    }));
  };

  const handleUpdateText = (field, idx, text) => {
    updateLineList(field, (lines) => {
      const next = [...lines];
      next[idx] = { ...next[idx], text };
      return next;
    });
  };

  const handleUpdateStyle = (field, idx, key, val) => {
    updateLineList(field, (lines) => {
      const next = [...lines];
      const prevStyle = next[idx]?.style || {};
      next[idx] = { ...next[idx], style: { ...prevStyle, [key]: val } };
      return next;
    });
  };

  const handleAddLine = (field, defaultStyle) => {
    updateLineList(field, (lines) => [
      ...lines,
      { id: `${field}_${Date.now()}`, text: "", style: defaultStyle },
    ]);
  };

  const handleRemoveLine = (field, idx) => {
    updateLineList(field, (lines) => lines.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {/* SECTION 1: LOGO */}
      <Card title="🖼️ 1. Logo đơn vị" size="small" className="shadow-xs border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            {header.logo_url ? (
              <div className="flex items-center gap-3 p-2 bg-gray-50 border rounded">
                <img
                  src={getMediaUrl(header.logo_url)}
                  alt="Template Logo"
                  style={{ maxHeight: 56, maxWidth: 120, objectFit: "contain" }}
                />
                <Popconfirm
                  title="Xóa logo này?"
                  onConfirm={onDeleteLogo}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button danger size="small" icon={<DeleteOutlined />}>
                    Xóa logo
                  </Button>
                </Popconfirm>
              </div>
            ) : (
              <Upload
                beforeUpload={onUploadLogo}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />} loading={uploadingLogo}>
                  Tải lên ảnh Logo (PNG/JPG max 5MB)
                </Button>
              </Upload>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Độ rộng logo (pt):</label>
              <InputNumber
                className="w-full"
                min={20}
                max={300}
                value={header.logo_width_pt || 80}
                onChange={(val) =>
                  setHeader((prev) => ({ ...prev, logo_width_pt: val || 80 }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Căn lề logo:</label>
              <Select
                className="w-full"
                value={header.logo_alignment || "LEFT"}
                options={LOGO_ALIGN_OPTIONS}
                onChange={(val) =>
                  setHeader((prev) => ({ ...prev, logo_alignment: val }))
                }
              />
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 2: APPENDIX */}
      <Card title="📌 2. Phụ lục góc trên phải" size="small" className="shadow-xs border-gray-200">
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <Input
              value={header.appendix_text}
              onChange={(e) =>
                setHeader((prev) => ({ ...prev, appendix_text: e.target.value }))
              }
              placeholder="VD: Phụ lục 7-Appendix 7"
              className="flex-1"
            />
            <TypographyPopover
              title="Định dạng phụ lục"
              style={header.appendix_style || {}}
              defaultStyle={{ italic: true, font_size_pt: 11, alignment: "RIGHT" }}
              onUpdate={updateAppendixStyle}
            />
          </div>
        </div>
      </Card>

      {/* SECTION 3: MAIN LINES */}
      <TextLineListCard
        title="3. Dòng cơ quan & Tên trường"
        icon="🏛️"
        lines={header.main_lines || []}
        placeholderPrefix="Dòng"
        defaultStyle={{ font_name: "Times New Roman", font_size_pt: 12, alignment: "CENTER" }}
        onAddLine={() =>
          handleAddLine("main_lines", { font_name: "Times New Roman", font_size_pt: 12, alignment: "CENTER" })
        }
        onUpdateText={(idx, text) => handleUpdateText("main_lines", idx, text)}
        onUpdateStyle={(idx, k, v) => handleUpdateStyle("main_lines", idx, k, v)}
        onRemoveLine={(idx) => handleRemoveLine("main_lines", idx)}
      />

      {/* SECTION 4: TITLE LINES */}
      <TextLineListCard
        title="4. Tiêu đề đề cương (Giữa trang)"
        icon="📝"
        lines={header.title_lines || []}
        placeholderPrefix="Dòng tiêu đề"
        defaultStyle={{ font_name: "Times New Roman", font_size_pt: 13, bold: true, alignment: "CENTER" }}
        onAddLine={() =>
          handleAddLine("title_lines", { font_name: "Times New Roman", font_size_pt: 13, bold: true, alignment: "CENTER" })
        }
        onUpdateText={(idx, text) => handleUpdateText("title_lines", idx, text)}
        onUpdateStyle={(idx, k, v) => handleUpdateStyle("title_lines", idx, k, v)}
        onRemoveLine={(idx) => handleRemoveLine("title_lines", idx)}
      />
    </div>
  );
};

export default HeaderFormTab;
