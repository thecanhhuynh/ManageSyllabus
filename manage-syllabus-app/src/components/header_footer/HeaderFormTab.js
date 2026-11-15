import React from "react";
import { Input, Button, Upload, InputNumber, Popconfirm, Card } from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  PictureOutlined,
  PushpinOutlined,
  BankOutlined,
  FormOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { getMediaUrl } from "./headerFooterDefaults";
import TypographyPopover from "./shared/TypographyPopover";
import TextLineListCard from "./shared/TextLineListCard";

const LOGO_ALIGN_OPTIONS = [
  { label: "Trái", value: "LEFT" },
  { label: "Giữa", value: "CENTER" },
  { label: "Phải", value: "RIGHT" },
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
      <Card
        title={
          <span className="text-xs font-semibold text-gray-700 flex items-center">
            <PictureOutlined className="mr-1.5 text-blue-600" />
            1. Logo đơn vị
          </span>
        }
        size="small"
        className="shadow-xs border-gray-200"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {header.logo_url ? (
              <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded">
                <img
                  src={getMediaUrl(header.logo_url)}
                  alt="Template Logo"
                  style={{ maxHeight: 52, maxWidth: 110, objectFit: "contain" }}
                />
                <Popconfirm
                  title="Xóa logo này?"
                  onConfirm={onDeleteLogo}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button danger size="small" icon={<DeleteOutlined />}>
                    Xóa
                  </Button>
                </Popconfirm>
              </div>
            ) : (
              <Upload
                beforeUpload={onUploadLogo}
                showUploadList={false}
                accept="image/*"
              >
                <Button size="small" icon={<UploadOutlined />} loading={uploadingLogo}>
                  Tải lên ảnh Logo (PNG/JPG max 5MB)
                </Button>
              </Upload>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-medium text-gray-600 block mb-1">
                Độ rộng logo (pt):
              </label>
              <InputNumber
                size="small"
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
              <label className="text-[11px] font-medium text-gray-600 block mb-1">
                Căn lề logo:
              </label>
              {/* Solid 3-column button group matching exact segmented UI specs */}
              <div className="grid grid-cols-3 p-1 bg-[#f0f2f5] rounded-lg border border-[#d9d9d9] gap-1 w-full">
                {LOGO_ALIGN_OPTIONS.map((opt) => {
                  const isSelected = (header.logo_alignment || "LEFT") === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setHeader((prev) => ({ ...prev, logo_alignment: opt.value }))}
                      className={`py-1 text-xs rounded-[6px] font-medium transition-all text-center cursor-pointer select-none ${
                        isSelected
                          ? "bg-white text-[#1677ff] border border-[#d9d9d9] shadow-xs"
                          : "bg-transparent text-[#595959] border border-transparent hover:text-[#1677ff]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10.5px] text-gray-500 italic">
            <InfoCircleOutlined className="text-blue-500" />
            <span>
              {header.logo_alignment === "CENTER"
                ? "Logo sẽ đặt ở giữa, phía trên dòng cơ quan."
                : header.logo_alignment === "RIGHT"
                ? "Logo sẽ đặt bên phải dòng cơ quan."
                : "Logo sẽ đặt bên trái dòng cơ quan."}
            </span>
          </div>
        </div>
      </Card>

      {/* SECTION 2: APPENDIX */}
      <Card
        title={
          <span className="text-xs font-semibold text-gray-700 flex items-center">
            <PushpinOutlined className="mr-1.5 text-blue-600" />
            2. Phụ lục góc trên phải
          </span>
        }
        size="small"
        className="shadow-xs border-gray-200"
      >
        <div className="flex gap-2 items-center">
          <Input
            size="small"
            value={header.appendix_text || ""}
            onChange={(e) =>
              setHeader((prev) => ({ ...prev, appendix_text: e.target.value }))
            }
            placeholder="VD: Phụ lục 7-Appendix 7 (Để trống nếu không hiển thị)"
            className="flex-1 text-xs"
          />
          <TypographyPopover
            title="Định dạng phụ lục"
            style={header.appendix_style || {}}
            defaultStyle={{ italic: true, font_size_pt: 11, alignment: "RIGHT" }}
            onUpdate={updateAppendixStyle}
          />
        </div>
      </Card>

      {/* SECTION 3: MAIN LINES */}
      <TextLineListCard
        title="3. Dòng cơ quan & Tên trường"
        icon={<BankOutlined className="mr-1.5 text-blue-600" />}
        lines={header.main_lines || []}
        placeholderPrefix="Dòng cơ quan"
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
        icon={<FormOutlined className="mr-1.5 text-blue-600" />}
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
