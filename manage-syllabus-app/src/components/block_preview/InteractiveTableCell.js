import React from "react";
import {Popover, Tag} from "antd";
import {EditOutlined} from "@ant-design/icons";
import ParagraphRenderer from "./ParagraphRenderer";
import {CellAlignPopoverContent} from "./CellAlignmentPopover";
import {HeaderCellPopoverContent} from "./HeaderCellPopoverContent";
import {
  getCellWidth,
  getCellMinWidth,
  getCellPadding,
  getEffectiveAlignment,
} from "./TablePreviewHelpers";

export const TableCellContent = ({ cell, isMatrix, effectiveAlign, overrideText }) => {
  if (overrideText !== undefined && overrideText !== null) {
    return (
      <p
        style={{
          margin: "0",
          marginTop: `${cell.space_before_pt || 0}pt`,
          marginBottom: `${cell.space_after_pt || 0}pt`,
          lineHeight: cell.line_spacing || 1.15,
          textAlign: effectiveAlign,
          whiteSpace: isMatrix ? "nowrap" : undefined,
          fontWeight: cell.bold ? "bold" : "inherit",
          fontStyle: cell.italic ? "italic" : "normal",
        }}
      >
        {overrideText}
      </p>
    );
  }
  if (cell.paragraphs && cell.paragraphs.length > 0) {
    return cell.paragraphs.map((p, pi) => (
      <ParagraphRenderer
        key={pi}
        para={p}
        alignOverride={isMatrix ? "center" : effectiveAlign}
        whiteSpaceOverride={isMatrix ? "nowrap" : undefined}
        paddingOverride={isMatrix ? 0 : undefined}
      />
    ));
  }
  return (
    <p
      style={{
        margin: "0",
        marginTop: `${cell.space_before_pt || 0}pt`,
        marginBottom: `${cell.space_after_pt || 0}pt`,
        lineHeight: cell.line_spacing || 1.15,
        textAlign: effectiveAlign,
        whiteSpace: isMatrix ? "nowrap" : undefined,
      }}
    >
      {cell.text}
    </p>
  );
};

export const getInteractiveCellStyle = (params) => {
  const {
    width,
    minWidth,
    maxWidth,
    isBorderless,
    isMatrix,
    isLegend,
    effectiveAlign,
    cell,
    isSelected,
  } = params;
  return {
    width,
    minWidth,
    maxWidth,
    border: isBorderless ? "none" : "1px solid #999",
    padding: getCellPadding(isBorderless, isMatrix, isLegend),
    boxSizing: "border-box",
    verticalAlign: "middle",
    wordBreak: isMatrix ? "normal" : "break-word",
    overflowWrap: isMatrix ? "normal" : "anywhere",
    hyphens: isMatrix ? "none" : "auto",
    whiteSpace: isMatrix ? "nowrap" : "normal",
    textAlign: effectiveAlign,
    backgroundColor: isSelected
      ? "rgba(219, 234, 254, 0.65)"
      : cell.bg_color || "transparent",
    fontFamily: cell.font_name || "inherit",
    fontSize: `${cell.font_size_pt || 10}pt`,
    fontWeight: cell.bold ? "bold" : "normal",
    fontStyle: cell.italic ? "italic" : "normal",
    color: cell.color || "inherit",
    lineHeight: 1.25,
    outline: isSelected ? "2px solid #2563eb" : undefined,
    outlineOffset: "-2px",
  };
};

const HeaderCellWrapper = ({
  content,
  popoverOpen,
  colMeta,
  currentAlign,
  ci,
  onUpdateColumnLabel,
  onResetColumnLabel,
  onSelectAlign,
  onClearAlign,
  onClosePopover,
}) => (
  <Popover
    open={popoverOpen}
    trigger="click"
    placement="bottom"
    onOpenChange={(visible) => {
      if (!visible && onClosePopover) {
        onClosePopover();
      }
    }}
    getPopupContainer={(trigger) =>
      trigger.closest(".preview-container") ||
      trigger.closest(".ant-drawer-body") ||
      document.body
    }
    content={
      <HeaderCellPopoverContent
        colMeta={colMeta}
        currentAlign={currentAlign}
        onUpdateLabel={onUpdateColumnLabel}
        onResetLabel={onResetColumnLabel}
        onSelectAlign={onSelectAlign}
        onClearAlign={onClearAlign}
      />
    }
  >
    <div className="w-full h-full min-h-[22px] flex items-center relative pointer-events-none">
      <div className="flex-1">{content}</div>
      <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-blue-600 bg-blue-100/90 rounded px-1 shadow-xs flex items-center">
        <EditOutlined />
      </span>
    </div>
  </Popover>
);

const StandardCellWrapper = ({
  content,
  popoverOpen,
  ri,
  ci,
  currentAlign,
  onSelectAlign,
  onClearAlign,
  onClosePopover,
}) => {
  const popoverTitle = (
    <div className="text-[11px] font-semibold text-gray-800 flex items-center justify-between gap-2">
      <span>
        Ô Hàng {ri === 0 ? "Tiêu đề" : ri}, Cột {ci + 1}
      </span>
      {currentAlign && (
        <Tag className="mr-0 text-[10px] font-mono">{currentAlign}</Tag>
      )}
    </div>
  );

  return (
    <Popover
      open={popoverOpen}
      trigger="click"
      placement="top"
      onOpenChange={(visible) => {
        if (!visible && onClosePopover) {
          onClosePopover();
        }
      }}
      getPopupContainer={(trigger) =>
        trigger.closest(".preview-container") ||
        trigger.closest(".ant-drawer-body") ||
        document.body
      }
      title={popoverTitle}
      content={
        <CellAlignPopoverContent
          currentAlign={currentAlign}
          onSelectAlign={onSelectAlign}
          onClearAlign={onClearAlign}
        />
      }
    >
      <div className="w-full h-full min-h-[22px] flex items-center pointer-events-none">
        <div className="flex-1">{content}</div>
      </div>
    </Popover>
  );
};

export const CellInnerWrapper = ({
  cell,
  isMatrix,
  effectiveAlign,
  currentAlign,
  ri,
  ci,
  popoverOpen,
  interactiveCellAlign,
  onSelectAlign,
  onClearAlign,
  colMeta,
  overrideText,
  onUpdateColumnLabel,
  onResetColumnLabel,
  onClosePopover,
}) => {
  const content = (
    <TableCellContent
      cell={cell}
      isMatrix={isMatrix}
      effectiveAlign={effectiveAlign}
      overrideText={overrideText}
    />
  );
  if (!interactiveCellAlign) return content;

  const isHeaderCell = (ri === 0 || cell.is_header) && Boolean(colMeta);
  if (isHeaderCell) {
    return (
      <HeaderCellWrapper
        content={content}
        popoverOpen={popoverOpen}
        colMeta={colMeta}
        currentAlign={currentAlign}
        ci={ci}
        onUpdateColumnLabel={onUpdateColumnLabel}
        onResetColumnLabel={onResetColumnLabel}
        onSelectAlign={onSelectAlign}
        onClearAlign={onClearAlign}
        onClosePopover={onClosePopover}
      />
    );
  }

  return (
    <StandardCellWrapper
      content={content}
      popoverOpen={popoverOpen}
      ri={ri}
      ci={ci}
      currentAlign={currentAlign}
      onSelectAlign={onSelectAlign}
      onClearAlign={onClearAlign}
      onClosePopover={onClosePopover}
    />
  );
};

export const resolveCellAlign = (
  cellAlignments,
  ri,
  ci,
  totalRows,
  isSchedule,
  gridCol,
) => {
  const effectiveCi = gridCol !== undefined ? gridCol : ci;
  const cellKey = `${ri},${effectiveCi}`;
  const direct = cellAlignments?.[cellKey] || cellAlignments?.[`${ri},${ci}`];
  if (direct) return direct;
  const isLastRow = ri === totalRows - 1;
  if (isLastRow && (cellAlignments?.[`-1,${effectiveCi}`] || cellAlignments?.[`-1,${ci}`]))
    return cellAlignments[`-1,${effectiveCi}`] || cellAlignments[`-1,${ci}`];
  if (isSchedule && ri >= 4 && !isLastRow) {
    for (let r = 4; r < totalRows; r++) {
      if (cellAlignments?.[`${r},${effectiveCi}`] || cellAlignments?.[`${r},${ci}`])
        return cellAlignments[`${r},${effectiveCi}`] || cellAlignments[`${r},${ci}`];
    }
  }
  return null;
};

export const InteractiveTableCell = ({
  cell,
  ri,
  ci,
  totalRows,
  customPercentages,
  isKeyValue,
  isMatrix,
  isBorderless,
  isLegend,
  isSchedule,
  cellAlignments,
  interactiveCellAlign,
  isSelected,
  showSinglePopover,
  onCellClick,
  onSelectAlign,
  onClearAlign,
  columnsMetadata,
  onUpdateColumnLabel,
  onResetColumnLabel,
  onClosePopover,
}) => {
  const cellKey = `${ri},${ci}`;
  const isLastRow = ri === totalRows - 1;
  const effectiveCi = cell.grid_col !== undefined ? cell.grid_col : ci;
  const currentAlign = resolveCellAlign(
    cellAlignments,
    ri,
    ci,
    totalRows,
    isSchedule,
    cell.grid_col,
  );
  const effectiveAlign = getEffectiveAlignment(
    isMatrix,
    currentAlign,
    cell.alignment,
  );
  const isSpanningHeader = cell.colspan && cell.colspan > 1;
  const isBadgeCell = /^\s*\(\d+\)\s*$/.test(cell.text || "");
  const isHeaderRow = ri === 0 || cell.is_header;

  const colMeta =
    isHeaderRow && !isSpanningHeader && !isBadgeCell && columnsMetadata
      ? (columnsMetadata.find((c) => c.ci === effectiveCi) ||
         columnsMetadata.find(
           (c) =>
             c.defaultLabel &&
             cell.text &&
             cell.text.toLowerCase().includes(c.defaultLabel.toLowerCase())
         ) ||
         columnsMetadata[effectiveCi])
      : null;

  const overrideText =
    colMeta && (colMeta.isCustom || colMeta.isModified)
      ? colMeta.currentLabel
      : undefined;

  const style = getInteractiveCellStyle({
    width: getCellWidth(customPercentages, isKeyValue, isMatrix, effectiveCi),
    minWidth: getCellMinWidth(
      isMatrix,
      Boolean(customPercentages || isKeyValue || isMatrix || isLegend),
      effectiveCi,
      isLegend,
    ),
    maxWidth: isMatrix ? (effectiveCi === 0 ? "60px" : "64px") : undefined,
    isBorderless,
    isMatrix,
    isLegend,
    effectiveAlign,
    cell,
    isSelected,
  });

  return (
    <td
      rowSpan={cell.rowspan || 1}
      colSpan={cell.colspan || 1}
      title={cell.text || ""}
      onClick={
        interactiveCellAlign ? (e) => onCellClick(e, cellKey) : undefined
      }
      className={
        interactiveCellAlign
          ? "cursor-pointer select-none group relative transition-all"
          : undefined
      }
      style={style}
    >
      <CellInnerWrapper
        cell={cell}
        isMatrix={isMatrix}
        effectiveAlign={effectiveAlign}
        currentAlign={currentAlign}
        ri={ri}
        ci={ci}
        popoverOpen={showSinglePopover}
        interactiveCellAlign={interactiveCellAlign}
        onSelectAlign={(align) => onSelectAlign(cellKey, align, isLastRow, effectiveCi)}
        onClearAlign={() => onClearAlign(cellKey, isLastRow, effectiveCi)}
        colMeta={colMeta}
        overrideText={overrideText}
        onUpdateColumnLabel={onUpdateColumnLabel}
        onResetColumnLabel={onResetColumnLabel}
        onClosePopover={onClosePopover}
      />
    </td>
  );
};

export default InteractiveTableCell;
