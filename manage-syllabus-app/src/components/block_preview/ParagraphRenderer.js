import React from "react";

export const ParagraphRenderer = ({
  para,
  alignOverride,
  whiteSpaceOverride,
  paddingOverride,
}) => {
  if (!para) return null;
  const isMatrixTitle =
    (para.runs || []).some((r) => (r.text || "").toLowerCase().includes("ma trận tích hợp")) ||
    (para.text || "").toLowerCase().includes("ma trận tích hợp");
  const alignment = isMatrixTitle ? "center" : (alignOverride || para.alignment || "left").toLowerCase();

  return (
    <p
      style={{
        textAlign: alignment === "justify" ? "justify" : alignment,
        lineHeight: para.line_spacing ?? 1.0,
        marginTop: `${para.space_before_pt ?? 0}pt`,
        marginBottom: `${para.space_after_pt ?? 0}pt`,
        wordBreak: whiteSpaceOverride === "nowrap" ? "normal" : "break-word",
        overflowWrap: whiteSpaceOverride === "nowrap" ? "normal" : "anywhere",
        whiteSpace: whiteSpaceOverride || "pre-line",
        paddingLeft: paddingOverride !== undefined ? paddingOverride : "2px",
        paddingRight: paddingOverride !== undefined ? paddingOverride : "2px",
      }}
    >
      {(para.runs || []).map((run, i) => (
        <span
          key={i}
          style={{
            fontFamily: run.font_name || "inherit",
            fontSize: `${run.font_size_pt || 12}pt`,
            fontWeight: run.bold ? "bold" : "normal",
            fontStyle: run.italic ? "italic" : "normal",
            textDecoration: run.underline ? "underline" : "none",
            color: run.color || "inherit",
          }}
        >
          {run.text}
        </span>
      ))}
    </p>
  );
};

export default ParagraphRenderer;
