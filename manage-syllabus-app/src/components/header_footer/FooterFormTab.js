import React, { useState, useRef } from "react";
import { Input, Button, Card } from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import TypographyPopover from "./shared/TypographyPopover";
import SignatureColumnCard from "./shared/SignatureColumnCard";
import { validateDateLine } from "./headerFooterValidator";
import { DangerAlert } from "../common";

const getRoleShortLabel = (roleKey) => {
  if (roleKey === "faculty_dean") return "Lãnh đạo Khoa";
  if (roleKey === "lecturer") return "Giảng viên";
  if (roleKey === "head_of_dept") return "Trưởng bộ môn";
  return "Tùy biến";
};

const hasToken = (text, tokenKey) => {
  if (!text) return false;
  const pattern = new RegExp(`\\{${tokenKey}\\}|\\b${tokenKey}\\b`, "i");
  return pattern.test(text);
};

const getDropCharIndex = (inputEl, clientX) => {
  if (!inputEl) return null;
  const rect = inputEl.getBoundingClientRect();
  const style = window.getComputedStyle(inputEl);
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const relativeX = clientX - rect.left - paddingLeft + inputEl.scrollLeft;

  if (relativeX <= 0) return 0;
  const text = inputEl.value || "";
  if (!text) return 0;

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return text.length;

    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    let bestIdx = text.length;
    let minDiff = Infinity;

    for (let i = 0; i <= text.length; i++) {
      const w = ctx.measureText(text.slice(0, i)).width;
      const diff = Math.abs(w - relativeX);
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = i;
      }
    }
    return bestIdx;
  } catch (err) {
    return text.length;
  }
};

const FooterFormTab = ({
  footer,
  setFooter,
  activeColIdx = 0,
  setActiveColIdx,
}) => {
  const [internalColIdx, setInternalColIdx] = useState(0);
  const inputRef = useRef(null);
  const caretPosRef = useRef(null);

  const currentColIdx = setActiveColIdx ? activeColIdx : internalColIdx;
  const setColIdx = setActiveColIdx || setInternalColIdx;

  const dateLine = footer.date_line || {};
  const columns = footer.signature_table?.columns || [];
  const safeColIdx = Math.min(Math.max(currentColIdx, 0), Math.max(columns.length - 1, 0));

  const currentText = dateLine.text || "";
  const hasDD = hasToken(currentText, "DD");
  const hasMM = hasToken(currentText, "MM");
  const hasYYYY = hasToken(currentText, "YYYY");
  const validation = validateDateLine(currentText);

  const getInputElement = () => {
    if (!inputRef.current) return null;
    return inputRef.current.input || inputRef.current;
  };

  const updateDateLineText = (text) => {
    setFooter((prev) => ({
      ...prev,
      date_line: { ...(prev.date_line || {}), text },
    }));
  };

  const handleUpdateCaret = () => {
    const el = getInputElement();
    if (el && typeof el.selectionStart === "number") {
      caretPosRef.current = el.selectionStart;
    }
  };

  const insertTokenAt = (token, pos) => {
    const safePos = typeof pos === "number" && pos >= 0 ? Math.min(pos, currentText.length) : currentText.length;
    const before = currentText.slice(0, safePos);
    const after = currentText.slice(safePos);

    const needLeading = before.length > 0 && !/\s$/.test(before) && !/[({[/,]$/.test(before);
    const needTrailing = after.length > 0 && !/^\s/.test(after) && !/^[)}/,\].]/.test(after);

    const inserted = `${needLeading ? " " : ""}${token}${needTrailing ? " " : ""}`;
    const newText = `${before}${inserted}${after}`;
    updateDateLineText(newText);

    const newCursor = safePos + inserted.length;
    caretPosRef.current = newCursor;

    setTimeout(() => {
      const el = getInputElement();
      if (!el) return;
      el.focus();
      el.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const handleDragStart = (e, tokenKey) => {
    e.dataTransfer.setData("text/plain", `{${tokenKey}}`);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const token = e.dataTransfer.getData("text/plain");
    if (!token) return;

    const el = getInputElement();
    let dropPos = getDropCharIndex(el, e.clientX);

    if (dropPos === null && el && typeof el.selectionStart === "number") {
      dropPos = el.selectionStart;
    }

    if (dropPos === null) {
      dropPos = caretPosRef.current !== null ? caretPosRef.current : currentText.length;
    }

    insertTokenAt(token, dropPos);
  };

  const handleLabelClick = (tokenKey) => {
    const pos = caretPosRef.current !== null ? caretPosRef.current : currentText.length;
    insertTokenAt(`{${tokenKey}}`, pos);
  };

  const removeToken = (tokenKey) => {
    const pattern = new RegExp(`\\s*\\{?${tokenKey}\\}?\\s*`, "i");
    const updated = currentText.replace(pattern, " ").replace(/\s{2,}/g, " ").trim();
    updateDateLineText(updated);
    caretPosRef.current = Math.min(caretPosRef.current || 0, updated.length);
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

  const renderTag = (tokenKey, isUsed) => {
    if (isUsed) {
      return (
        <span
          key={tokenKey}
          title={`Mốc [ ${tokenKey} ] đã chèn. Rê chuột vào × để gỡ`}
          className="group relative inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium rounded border border-blue-200 bg-blue-50 text-blue-700 select-none shadow-2xs transition-all"
        >
          <span>[ {tokenKey} ]</span>
          <button
            type="button"
            onClick={() => removeToken(tokenKey)}
            title={`Gỡ mốc [ ${tokenKey} ]`}
            className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-red-100 hover:text-red-600 text-gray-400 opacity-60 group-hover:opacity-100 transition-all cursor-pointer border-none bg-transparent p-0 text-[11px] leading-none"
          >
            ×
          </button>
        </span>
      );
    }

    return (
      <div
        key={tokenKey}
        draggable
        onDragStart={(e) => handleDragStart(e, tokenKey)}
        onClick={() => handleLabelClick(tokenKey)}
        title={`Kéo hoặc nhấp để chèn mốc [ ${tokenKey} ] vào vị trí con trỏ`}
        className="px-2 py-0.5 text-xs font-mono font-medium rounded border border-blue-300 bg-blue-50 text-blue-600 select-none flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-blue-100 hover:border-blue-400 shadow-2xs transition-all"
      >
        [ {tokenKey} ]
      </div>
    );
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
          {/* Tag Tray: Always display the 3 tokens on the left */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 font-medium shrink-0">Tags:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {renderTag("DD", hasDD)}
              {renderTag("MM", hasMM)}
              {renderTag("YYYY", hasYYYY)}
            </div>
          </div>

          {/* Input field with Caret tracking & drop zone */}
          <div className="flex gap-2 items-center">
            <Input
              ref={inputRef}
              size="small"
              value={dateLine.text || ""}
              status={!validation.isValid ? "error" : ""}
              onChange={(e) => updateDateLineText(e.target.value)}
              onSelect={handleUpdateCaret}
              onClick={handleUpdateCaret}
              onKeyUp={handleUpdateCaret}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
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
          {!validation.isValid && (
            <DangerAlert compact message={validation.error} className="mt-1" />
          )}
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
