import React, {useState, useEffect} from "react";
import {Tag} from "antd";
import {
  EyeOutlined,
  FileTextOutlined,
  BankOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {getMediaUrl} from "./headerFooterDefaults";

const buildInlineStyle = (
  style = {},
  defaultAlign = "CENTER",
  defaultSize = 12,
) => {
  const align = (style.alignment || defaultAlign).toLowerCase();
  return {
    fontFamily: style.font_name || "Times New Roman, serif",
    fontSize: `${style.font_size_pt || defaultSize}pt`,
    fontWeight: style.bold ? "bold" : "normal",
    fontStyle: style.italic ? "italic" : "normal",
    textDecoration: style.underline ? "underline" : "none",
    textAlign: align === "justify" ? "justify" : align,
    color: style.color || "#000000",
    marginTop: `${style.space_before_pt ?? 0}pt`,
    marginBottom: `${style.space_after_pt ?? 2}pt`,
    lineHeight: style.line_spacing ? style.line_spacing : 1.25,
  };
};

const formatPreviewDate = (rawText) => {
  if (!rawText)
    return {
      text: "Thành phố Hồ Chí Minh, ngày ... tháng ... năm 202...",
      hasMacro: false,
    };
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());

  let result = rawText;
  const macroMap = {
    "{DD}": dd,
    "{MM}": mm,
    "{YYYY}": yyyy,
    "{day}": dd,
    "{month}": mm,
    "{year}": yyyy,
  };

  let hasMacro = false;
  for (const [k, v] of Object.entries(macroMap)) {
    if (result.includes(k)) {
      result = result.split(k).join(v);
      hasMacro = true;
    }
  }
  return {text: result, hasMacro};
};

const getColRoleTag = (roleKey) => {
  if (roleKey === "faculty_dean") {
    return (
      <Tag color="blue" className="text-[10px] mb-1.5 whitespace-nowrap">
        Lãnh đạo Khoa
      </Tag>
    );
  }
  if (roleKey === "lecturer") {
    return (
      <Tag color="green" className="text-[10px] mb-1.5 whitespace-nowrap">
        Giảng viên
      </Tag>
    );
  }
  if (roleKey === "head_of_dept") {
    return (
      <Tag color="orange" className="text-[10px] mb-1.5 whitespace-nowrap">
        Trưởng bộ môn
      </Tag>
    );
  }
  return (
    <Tag color="default" className="text-[10px] mb-1.5 whitespace-nowrap">
      Tùy biến
    </Tag>
  );
};

const DigitalSignatureBox = ({name}) => (
  <div
    style={{
      height: "64px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      border: "1px dashed #3b82f6",
      backgroundColor: "#eff6ff",
      borderRadius: "4px",
      margin: "6px auto",
      padding: "4px 8px",
      maxWidth: "155px",
    }}
  >
    <div className="flex items-center gap-1 text-[10.5px] text-blue-700 font-bold">
      <CheckCircleOutlined className="text-blue-600" />
      <span>ĐÃ KÝ ĐIỆN TỬ</span>
    </div>
    <span
      style={{
        fontSize: "9.5px",
        color: "#1e3a8a",
        fontWeight: "600",
        marginTop: "2px",
      }}
    >
      {name || "Chữ ký số"}
    </span>
    <span style={{fontSize: "8px", color: "#64748b", fontStyle: "italic"}}>
      Hệ thống QLĐC HCMOU
    </span>
  </div>
);

const HeaderFooterPreview = ({
  header,
  footer,
  activeTab = "header",
  activeColIdx = 0,
  onSelectColIdx,
}) => {
  // Sync viewMode automatically with left activeTab
  const [viewMode, setViewMode] = useState(activeTab || "header"); // "all" | "header" | "footer"

  useEffect(() => {
    if (activeTab === "header" || activeTab === "footer") {
      setViewMode(activeTab);
    }
  }, [activeTab]);

  const showHeader = viewMode === "all" || viewMode === "header";
  const showFooter = viewMode === "all" || viewMode === "footer";
  const showBody = viewMode === "all";

  const renderHeaderContent = () => {
    const logoAlign = (header.logo_alignment || "LEFT").toUpperCase();
    const logoWidthPt = Number(header.logo_width_pt) || 80;

    const logoElement = header.logo_url ? (
      <img
        src={getMediaUrl(header.logo_url)}
        alt="Logo"
        style={{
          width: `${logoWidthPt}pt`,
          maxWidth: 160,
          height: "auto",
          display: "inline-block",
        }}
      />
    ) : null;

    return (
      <div className="w-full">
        {/* Appendix Box (Góc trên phải) */}
        {header.appendix_text && (
          <div className="flex justify-end mb-2">
            <div
              className="border border-black px-2.5 py-0.5 inline-block text-right"
              style={buildInlineStyle(header.appendix_style, "RIGHT", 11)}
            >
              {header.appendix_text}
            </div>
          </div>
        )}

        {/* Logo and Main Lines Layout according to logoAlign */}
        {logoAlign === "CENTER" ? (
          <div className="mb-2">
            {logoElement && (
              <div className="text-center mb-2.5">{logoElement}</div>
            )}
            <div className="text-center">
              {(header.main_lines || []).map((line, idx) => (
                <p
                  key={line.id || idx}
                  style={buildInlineStyle(line.style, "CENTER", 12)}
                >
                  {line.text || "\u00A0"}
                </p>
              ))}
            </div>
          </div>
        ) : logoAlign === "RIGHT" ? (
          <div className="flex items-center gap-4 mb-2 flex-row-reverse">
            {logoElement && (
              <div style={{flexShrink: 0, textAlign: "right"}}>
                {logoElement}
              </div>
            )}
            <div className="flex-1 min-w-0 text-center">
              {(header.main_lines || []).map((line, idx) => (
                <p
                  key={line.id || idx}
                  style={buildInlineStyle(line.style, "CENTER", 12)}
                >
                  {line.text || "\u00A0"}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 mb-2">
            {logoElement && (
              <div style={{flexShrink: 0, textAlign: "left"}}>
                {logoElement}
              </div>
            )}
            <div className="flex-1 min-w-0 text-center">
              {(header.main_lines || []).map((line, idx) => (
                <p
                  key={line.id || idx}
                  style={buildInlineStyle(line.style, "CENTER", 12)}
                >
                  {line.text || "\u00A0"}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Solid divider line */}
        <div className="border-t-2 border-black my-2.5 mx-auto w-3/5" />

        {/* Title Lines */}
        <div className="text-center my-2">
          {(header.title_lines || []).map((line, idx) => (
            <p
              key={line.id || idx}
              style={buildInlineStyle(line.style, "CENTER", 13)}
            >
              {line.text || "\u00A0"}
            </p>
          ))}
        </div>
      </div>
    );
  };

  const renderFooterContent = () => {
    const dateLine = footer.date_line || {};
    const columns = footer.signature_table?.columns || [];
    const formattedDate = formatPreviewDate(dateLine.text);

    return (
      <div className="w-full mt-4">
        {/* Date line with simulated macro preview */}
        <div className="mb-3 text-right">
          <p style={buildInlineStyle(dateLine.style, "RIGHT", 12)}>
            {formattedDate.text || "\u00A0"}
          </p>
          {formattedDate.hasMacro && (
            <span className="text-[10.5px] text-emerald-600 font-medium italic block mt-0.5">
              (Mô phỏng ngày duyệt tự động: Hôm nay)
            </span>
          )}
        </div>

        {/* Signature Table */}
        <table
          style={{
            width: "100%",
            marginTop: "12pt",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              {columns.map((col, idx) => {
                const isFocused = activeColIdx === idx;
                return (
                  <td
                    key={idx}
                    onClick={() => onSelectColIdx && onSelectColIdx(idx)}
                    style={{
                      textAlign: "center",
                      border: isFocused
                        ? "2px solid #3b82f6"
                        : "1px dashed #cbd5e1",
                      backgroundColor: isFocused ? "#f8fafc" : "transparent",
                      padding: "8px 6px",
                      verticalAlign: "top",
                      width: `${100 / Math.max(columns.length, 1)}%`,
                      cursor: onSelectColIdx ? "pointer" : "default",
                      transition: "all 0.2s ease",
                      borderRadius: isFocused ? "4px" : "0px",
                    }}
                  >
                    {getColRoleTag(col.role_key)}

                    {(col.title_lines || []).map((tl, tIdx) => (
                      <p
                        key={tIdx}
                        style={buildInlineStyle(tl.style, "CENTER", 12)}
                      >
                        {tl.text || "\u00A0"}
                      </p>
                    ))}

                    {col.subtitle && (
                      <p
                        style={{
                          fontFamily: "Times New Roman, serif",
                          fontStyle: "italic",
                          fontSize: "10.5pt",
                          margin: "2px 0",
                          color: "#475569",
                        }}
                      >
                        {col.subtitle}
                      </p>
                    )}

                    {/* Always Digital Signature Box (100% digitalized) */}
                    <DigitalSignatureBox name={col.name} />

                    <p style={buildInlineStyle(col.name_style, "CENTER", 12)}>
                      {col.name || "\u00A0"}
                    </p>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Controls Toolbar: Synchronized with Left UI Tab */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <EyeOutlined className="text-blue-600" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            Bản xem trước văn bản
          </span>
          <Tag color="blue">
            {viewMode === "all" ? "Mẫu A4 toàn trang" : viewMode === "header" ? "Khung Header" : "Khung Footer"}
          </Tag>
        </div>

        {/* Synchronized View Mode Tabs matching exact segmented UI specs */}
        <div className="inline-flex p-1 bg-[#f0f2f5] rounded-lg border border-[#d9d9d9] gap-1">
          <button
            type="button"
            onClick={() => setViewMode("header")}
            className={`px-3 py-1 text-xs rounded-[6px] font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none ${
              viewMode === "header"
                ? "bg-white text-[#1677ff] border border-[#d9d9d9] shadow-xs"
                : "bg-transparent text-[#595959] border border-transparent hover:text-[#1677ff]"
            }`}
          >
            <BankOutlined
              className={
                viewMode === "header" ? "text-[#1677ff]" : "text-[#595959]"
              }
            />
            <span>Header</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("footer")}
            className={`px-3 py-1 text-xs rounded-[6px] font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none ${
              viewMode === "footer"
                ? "bg-white text-[#1677ff] border border-[#d9d9d9] shadow-xs"
                : "bg-transparent text-[#595959] border border-transparent hover:text-[#1677ff]"
            }`}
          >
            <EditOutlined
              className={
                viewMode === "footer" ? "text-[#1677ff]" : "text-[#595959]"
              }
            />
            <span>Footer</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`px-3 py-1 text-xs rounded-[6px] font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none ${
              viewMode === "all"
                ? "bg-white text-[#1677ff] border border-[#d9d9d9] shadow-xs"
                : "bg-transparent text-[#595959] border border-transparent hover:text-[#1677ff]"
            }`}
          >
            <FileTextOutlined
              className={
                viewMode === "all" ? "text-[#1677ff]" : "text-[#595959]"
              }
            />
            <span>Toàn bộ trang</span>
          </button>
        </div>
      </div>

      {/* Document Canvas Preview: Dynamic hug height for Header/Footer, full page for 'all' */}
      <div className="flex-1 overflow-y-auto pr-1 flex justify-center items-start bg-slate-100/80 p-4 rounded-lg">
        <div
          className={`w-full max-w-[580px] bg-white shadow-md border border-gray-200 rounded p-6 font-serif text-black transition-all ${
            viewMode === "all"
              ? "min-h-[640px] flex flex-col justify-between"
              : "h-auto"
          }`}
        >
          {showHeader && renderHeaderContent()}

          {showBody && (
            <div className="my-6 py-5 px-4 bg-slate-50/70 border border-dashed border-slate-300 rounded text-center select-none">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide font-sans">
                Nội dung Đề cương chi tiết môn học
              </div>
              <div className="text-[11px] text-slate-400 italic font-sans mt-1">
                (Mục 1 đến Mục 10: Thông tin chung, Chuẩn đầu ra, Đánh giá, Lịch
                trình giảng dạy...)
              </div>
            </div>
          )}

          {showFooter && renderFooterContent()}
        </div>
      </div>
    </div>
  );
};

export default HeaderFooterPreview;
