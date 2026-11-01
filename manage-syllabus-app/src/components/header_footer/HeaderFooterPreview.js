import React, { useState } from "react";
import { Segmented, Tag } from "antd";
import { getMediaUrl } from "./headerFooterDefaults";

const buildInlineStyle = (style = {}, defaultAlign = "CENTER", defaultSize = 12) => {
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

const HeaderFooterPreview = ({ header, footer, activeTab = "header" }) => {
  const [viewMode, setViewMode] = useState("auto"); // "auto" | "page"

  const showHeader = viewMode === "page" || activeTab === "header";
  const showFooter = viewMode === "page" || activeTab === "footer";

  const renderHeader = () => {
    const logoAlign = (header.logo_alignment || "LEFT").toLowerCase();
    const logoWidthPt = Number(header.logo_width_pt) || 80;

    return (
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs transition-all">
        <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
          <Tag color="default">HEADER & TIÊU ĐỀ ĐỀ CƯƠNG</Tag>
        </div>

        {/* Appendix Box (Góc trên phải) */}
        {header.appendix_text && (
          <div className="flex justify-end mb-3">
            <div
              className="border border-black px-3 py-1 inline-block"
              style={buildInlineStyle(header.appendix_style, "RIGHT", 11)}
            >
              {header.appendix_text}
            </div>
          </div>
        )}

        {/* Header Table / Grid (Logo bên trái + Main lines) */}
        <div className="flex items-start gap-4 mb-3">
          {header.logo_url && (
            <div
              style={{
                textAlign: logoAlign,
                flexShrink: 0,
              }}
            >
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
            </div>
          )}

          <div className="flex-1 min-w-0">
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

        {/* Divider */}
        <div className="border-t border-black my-3 mx-auto w-3/4" />

        {/* Title Lines */}
        <div className="mt-2 text-center">
          {(header.title_lines || []).map((line, idx) => (
            <p
              key={line.id || idx}
              style={buildInlineStyle(line.style, "CENTER", 14)}
            >
              {line.text || "\u00A0"}
            </p>
          ))}
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    const dateLine = footer.date_line || {};
    const columns = footer.signature_table?.columns || [];

    return (
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs transition-all">
        <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
          <Tag color="default">FOOTER & BẢNG CHỮ KÝ</Tag>
        </div>

        {/* Date line */}
        <div className="mb-4">
          <p style={buildInlineStyle(dateLine.style, "RIGHT", 12)}>
            {dateLine.text || "\u00A0"}
          </p>
        </div>

        {/* Signature Table */}
        <table
          style={{
            width: "100%",
            marginTop: "16pt",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              {columns.map((col, idx) => (
                <td
                  key={idx}
                  style={{
                    textAlign: "center",
                    border: "1px dashed #cbd5e1",
                    padding: "10px",
                    verticalAlign: "top",
                    width: `${100 / Math.max(columns.length, 1)}%`,
                  }}
                >
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
                        fontSize: "11pt",
                        margin: "4px 0",
                        color: "#475569",
                      }}
                    >
                      {col.subtitle}
                    </p>
                  )}

                  {/* Khoảng trống chữ ký */}
                  <div style={{ height: "65px" }} />

                  {/* Tên người ký */}
                  <p style={buildInlineStyle(col.name_style, "CENTER", 12)}>
                    {col.name || "\u00A0"}
                  </p>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-bold text-gray-600 m-0 uppercase tracking-wide">
          👁️ Live Preview (Thời Gian Thực)
        </h4>
        <Segmented
          size="small"
          value={viewMode}
          onChange={setViewMode}
          options={[
            { label: "Tab hiện tại", value: "auto" },
            { label: "Cả trang đề cương", value: "page" },
          ]}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {showHeader && renderHeader()}

        {viewMode === "page" && (
          <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded text-center text-xs text-gray-400 italic font-sans">
            ... (Nội dung Đề cương chi tiết môn học nằm ở đây) ...
          </div>
        )}

        {showFooter && renderFooter()}
      </div>
    </div>
  );
};

export default HeaderFooterPreview;
