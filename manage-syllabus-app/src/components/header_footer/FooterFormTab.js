import React from "react";
import { Input, Button, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import TypographyPopover from "./shared/TypographyPopover";
import SignatureColumnCard from "./shared/SignatureColumnCard";

const FooterFormTab = ({ footer, setFooter }) => {
  const dateLine = footer.date_line || {};
  const columns = footer.signature_table?.columns || [];

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
    updateColumns((cols) => [
      ...cols,
      {
        title_lines: [
          { text: "CHỨC DANH / VỊ TRÍ", style: { bold: true, font_size_pt: 12, alignment: "CENTER" } },
          { text: "TITLE", style: { bold: true, font_size_pt: 12, alignment: "CENTER" } },
        ],
        subtitle: "(Ký và ghi rõ họ tên)",
        name: "Họ và tên người ký",
        name_style: { bold: true, font_size_pt: 12, alignment: "CENTER" },
      },
    ]);
  };

  const removeSigColumn = (colIdx) => {
    updateColumns((cols) => cols.filter((_, i) => i !== colIdx));
  };

  return (
    <div className="space-y-4">
      {/* SECTION 1: DATE LINE */}
      <Card title="📅 1. Dòng ngày tháng ban hành" size="small" className="shadow-xs border-gray-200">
        <div className="flex gap-2 items-center">
          <Input
            value={dateLine.text || ""}
            onChange={(e) => updateDateLineText(e.target.value)}
            placeholder="VD: Thành phố Hồ Chí Minh, ngày 15 tháng 09 năm 2023"
            className="flex-1 italic"
          />
          <TypographyPopover
            title="Định dạng dòng ngày tháng"
            style={dateLine.style || {}}
            defaultStyle={{ italic: true, font_size_pt: 12, alignment: "RIGHT" }}
            onUpdate={updateDateLineStyle}
          />
        </div>
      </Card>

      {/* SECTION 2: SIGNATURE TABLE */}
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>✍️ 2. Bảng chữ ký ({columns.length} cột)</span>
            <Button
              size="small"
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addSigColumn}
            >
              Thêm cột chữ ký
            </Button>
          </div>
        }
        size="small"
        className="shadow-xs border-gray-200"
      >
        <div className="space-y-4">
          {columns.map((col, cIdx) => (
            <SignatureColumnCard
              key={cIdx}
              col={col}
              cIdx={cIdx}
              canDelete={columns.length > 1}
              onUpdateTitle={updateColTitle}
              onUpdateTitleStyle={updateColTitleStyle}
              onUpdateSubtitle={updateColSubtitle}
              onUpdateName={updateColName}
              onUpdateNameStyle={updateColNameStyle}
              onDeleteColumn={removeSigColumn}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};

export default FooterFormTab;
