import React, { useState } from "react";
import { Input, Button, Card } from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import TypographyPopover from "./shared/TypographyPopover";
import SignatureColumnCard from "./shared/SignatureColumnCard";

const getRoleShortLabel = (roleKey) => {
  if (roleKey === "faculty_dean") return "Lãnh đạo Khoa";
  if (roleKey === "lecturer") return "Giảng viên";
  if (roleKey === "head_of_dept") return "Trưởng bộ môn";
  return "Tùy biến";
};

const FooterFormTab = ({
  footer,
  setFooter,
  activeColIdx = 0,
  setActiveColIdx,
}) => {
  const [internalColIdx, setInternalColIdx] = useState(0);
  const currentColIdx = setActiveColIdx ? activeColIdx : internalColIdx;
  const setColIdx = setActiveColIdx || setInternalColIdx;

  const dateLine = footer.date_line || {};
  const columns = footer.signature_table?.columns || [];
  const safeColIdx = Math.min(Math.max(currentColIdx, 0), Math.max(columns.length - 1, 0));

  const updateDateLineText = (text) => {
    setFooter((prev) => ({
      ...prev,
      date_line: { ...(prev.date_line || {}), text },
    }));
  };

  const updateDateLineStyle = (key, val) => {
    setFooter((prev) => ({
      ...prev,
      date_line: {
        ...(prev.date_line || {}),
        style: { ...((prev.date_line && prev.date_line.style) || {}), [key]: val },
      },
    }));
  };

  const updateColumns = (updater) => {
    setFooter((prev) => ({
      ...prev,
      signature_table: {
        ...(prev.signature_table || {}),
        columns: updater(prev.signature_table?.columns || []),
      },
    }));
  };

  const updateColRole = (colIdx, role_key) => {
    updateColumns((cols) => {
      const next = [...cols];
      next[colIdx] = { ...next[colIdx], role_key };
      return next;
    });
  };

  const updateColTitle = (colIdx, titleIdx, text) => {
    updateColumns((cols) => {
      const next = [...cols];
      const tLines = [...(next[colIdx]?.title_lines || [])];
      tLines[titleIdx] = { ...(tLines[titleIdx] || {}), text };
      next[colIdx] = { ...next[colIdx], title_lines: tLines };
      return next;
    });
  };

  const updateColTitleStyle = (colIdx, titleIdx, key, val) => {
    updateColumns((cols) => {
      const next = [...cols];
      const tLines = [...(next[colIdx]?.title_lines || [])];
      const prevStyle = tLines[titleIdx]?.style || {};
      tLines[titleIdx] = { ...(tLines[titleIdx] || {}), style: { ...prevStyle, [key]: val } };
      next[colIdx] = { ...next[colIdx], title_lines: tLines };
      return next;
    });
  };

  const updateColSubtitle = (colIdx, subtitle) => {
    updateColumns((cols) => {
      const next = [...cols];
      next[colIdx] = { ...next[colIdx], subtitle };
      return next;
    });
  };

  const updateColName = (colIdx, name) => {
    updateColumns((cols) => {
      const next = [...cols];
      next[colIdx] = { ...next[colIdx], name };
      return next;
    });
  };

  const updateColNameStyle = (colIdx, key, val) => {
    updateColumns((cols) => {
      const next = [...cols];
      const prevStyle = next[colIdx]?.name_style || {};
      next[colIdx] = { ...next[colIdx], name_style: { ...prevStyle, [key]: val } };
      return next;
    });
  };

  const addSigColumn = () => {
    updateColumns((cols) => {
      const newCols = [
        ...cols,
        {
          role_key: "custom",
          title_lines: [
            { text: "CHỨC DANH / VỊ TRÍ", style: { bold: true, font_size_pt: 12, alignment: "CENTER" } },
            { text: "TITLE", style: { bold: true, font_size_pt: 12, alignment: "CENTER" } },
          ],
          subtitle: "(Ký và ghi rõ họ tên)",
          name: "Họ và tên người ký",
          name_style: { bold: true, font_size_pt: 12, alignment: "CENTER" },
        },
      ];
      setColIdx(newCols.length - 1);
      return newCols;
    });
  };

  const removeSigColumn = (colIdx) => {
    updateColumns((cols) => {
      const next = cols.filter((_, i) => i !== colIdx);
      if (safeColIdx >= next.length) {
        setColIdx(Math.max(next.length - 1, 0));
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* SECTION 1: DATE LINE */}
      <Card
        title={
          <span className="text-xs font-semibold text-gray-700 flex items-center">
            <CalendarOutlined className="mr-1.5 text-blue-600" />
            1. Dòng ngày tháng ban hành
          </span>
        }
        size="small"
        className="shadow-xs border-gray-200"
      >
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <Input
              size="small"
              value={dateLine.text || ""}
              onChange={(e) => updateDateLineText(e.target.value)}
              placeholder="VD: Thành phố Hồ Chí Minh, ngày {DD} tháng {MM} năm {YYYY}"
              className="flex-1 italic text-xs"
            />
            <TypographyPopover
              title="Định dạng dòng ngày tháng"
              style={dateLine.style || {}}
              defaultStyle={{ italic: true, font_size_pt: 12, alignment: "RIGHT" }}
              onUpdate={updateDateLineStyle}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button
              size="small"
              type="dashed"
              icon={<CheckCircleOutlined className="text-blue-600" />}
              onClick={() =>
                updateDateLineText("Thành phố Hồ Chí Minh, ngày {DD} tháng {MM} năm {YYYY}")
              }
              className="text-[11px] text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              Đặt mẫu ngày tự động ({'{DD}/{MM}/{YYYY}'})
            </Button>
            <span className="text-[10.5px] text-gray-400 italic">
              Tự động điền ngày duyệt thực tế
            </span>
          </div>
        </div>
      </Card>

      {/* SECTION 2: SIGNATURE TABLE */}
      <Card
        title={
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-700 flex items-center">
              <EditOutlined className="mr-1.5 text-blue-600" />
              2. Bảng chữ ký số ({columns.length} cột)
            </span>
            {columns.length < 4 && (
              <Button
                size="small"
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addSigColumn}
                className="text-xs"
              >
                Thêm cột
              </Button>
            )}
          </div>
        }
        size="small"
        className="shadow-xs border-gray-200"
      >
        <div className="space-y-3">
          {/* Column Switcher Tabs matching exact segmented UI specs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#f0f2f5] rounded-lg border border-[#d9d9d9]">
            {columns.map((col, cIdx) => {
              const isSelected = safeColIdx === cIdx;
              const roleLabel = getRoleShortLabel(col.role_key);
              return (
                <button
                  key={cIdx}
                  type="button"
                  onClick={() => setColIdx(cIdx)}
                  className={`px-3 py-1.5 text-xs rounded-[6px] font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none flex-1 justify-center ${
                    isSelected
                      ? "bg-white text-[#1677ff] border border-[#d9d9d9] shadow-xs"
                      : "bg-transparent text-[#595959] border border-transparent hover:text-[#1677ff]"
                  }`}
                >
                  <SafetyCertificateOutlined className={isSelected ? "text-[#1677ff]" : "text-[#595959]"} />
                  <span>{`Cột ${cIdx + 1}:`}</span>
                  <span className="text-[11px] opacity-85 truncate max-w-[110px]">
                    {col.name ? col.name.slice(0, 15) : roleLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Column Details */}
          {columns[safeColIdx] && (
            <SignatureColumnCard
              col={columns[safeColIdx]}
              cIdx={safeColIdx}
              canDelete={columns.length > 1}
              onUpdateRole={updateColRole}
              onUpdateTitle={updateColTitle}
              onUpdateTitleStyle={updateColTitleStyle}
              onUpdateSubtitle={updateColSubtitle}
              onUpdateName={updateColName}
              onUpdateNameStyle={updateColNameStyle}
              onDeleteColumn={removeSigColumn}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default FooterFormTab;
