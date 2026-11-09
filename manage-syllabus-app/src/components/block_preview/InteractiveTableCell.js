import React from "react";
import {Popover, Tag} from "antd";
import ParagraphRenderer from "./ParagraphRenderer";
import {CellAlignPopoverContent} from "./CellAlignmentPopover";
import {HeaderCellPopoverContent} from "./HeaderCellPopoverContent";
import {
  getCellWidth,
  getCellMinWidth,
  getCellPadding,
  getEffectiveAlignment,
} from "./TablePreviewHelpers";

export const TableCellContent = ({cell, isMatrix, effectiveAlign}) => {
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
        marginTop: `${cell.space_before_pt}pt`,
        marginBottom: `${cell.space_after_pt}pt`,
        lineHeight: cell.line_spacing,
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
}) => (
  <Popover
    open={popoverOpen}
    trigger="click"
    placement="bottom"
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
      <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-blue-600 bg-blue-100/90 rounded px-1 shadow-xs">
        ✏️
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
  onUpdateColumnLabel,
  onResetColumnLabel,
}) => {
  const content = (
    <TableCellContent
      cell={cell}
      isMatrix={isMatrix}
      effectiveAlign={effectiveAlign}
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
    />
  );
};

export const resolveCellAlign = (
  cellAlignments,
  ri,
  ci,
  totalRows,
  isSchedule,
) => {
  const cellKey = `${ri},${ci}`;
  const isLastRow = ri === totalRows - 1;
  const direct = cellAlignments?.[cellKey];
  if (direct) return direct;
  if (isLastRow && cellAlignments?.[`-1,${ci}`])
    return cellAlignments[`-1,${ci}`];
  if (isSchedule && ri >= 4 && !isLastRow) {
    for (let r = 4; r < totalRows; r++) {
      if (cellAlignments?.[`${r},${ci}`]) return cellAlignments[`${r},${ci}`];
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
}) => {
  const cellKey = `${ri},${ci}`;
  const isLastRow = ri === totalRows - 1;
  const currentAlign = resolveCellAlign(
    cellAlignments,
    ri,
    ci,
    totalRows,
    isSchedule,
  );
  const effectiveAlign = getEffectiveAlignment(
    isMatrix,
    currentAlign,
    cell.alignment,
  );
  const colMeta =
    (ri === 0 || cell.is_header) && columnsMetadata
      ? columnsMetadata[ci]
      : null;

  const style = getInteractiveCellStyle({
    width: getCellWidth(customPercentages, isKeyValue, isMatrix, ci),
    minWidth: getCellMinWidth(
      isMatrix,
      Boolean(customPercentages || isKeyValue || isMatrix || isLegend),
      ci,
      isLegend,
    ),
    maxWidth: isMatrix ? (ci === 0 ? "60px" : "64px") : undefined,
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
        onSelectAlign={(align) => onSelectAlign(cellKey, align, isLastRow, ci)}
        onClearAlign={() => onClearAlign(cellKey, isLastRow, ci)}
        colMeta={colMeta}
        onUpdateColumnLabel={onUpdateColumnLabel}
        onResetColumnLabel={onResetColumnLabel}
      />
    </td>
  );
};

export default InteractiveTableCell;
