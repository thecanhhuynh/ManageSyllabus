import React, { useState } from "react";
import InteractiveTableCell from "./InteractiveTableCell";
import { BatchAlignmentBar } from "./CellAlignmentPopover";
import {
  getPercentages,
  getMinTableWidth,
} from "./TablePreviewHelpers";

export const useTableSelection = (cellAlignments, onCellAlignmentChange) => {
  const [selectedCells, setSelectedCells] = useState([]);
  const [singlePopoverCell, setSinglePopoverCell] = useState(null);

  const handleCellClick = (e, cellKey) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      setSinglePopoverCell(null);
      setSelectedCells((prev) => (prev.includes(cellKey) ? prev.filter((k) => k !== cellKey) : [...prev, cellKey]));
      return;
    }
    const isAlreadySingle = selectedCells.length === 1 && selectedCells[0] === cellKey;
    setSelectedCells(isAlreadySingle ? [] : [cellKey]);
    setSinglePopoverCell(isAlreadySingle ? null : cellKey);
  };

  const handleBatchAlign = (align) => {
    if (!onCellAlignmentChange || selectedCells.length === 0) return;
    const next = { ...(cellAlignments || {}) };
    selectedCells.forEach((key) => { next[key] = align; });
    onCellAlignmentChange(next);
  };

  const handleBatchClear = () => {
    if (!onCellAlignmentChange || selectedCells.length === 0) return;
    const next = { ...(cellAlignments || {}) };
    selectedCells.forEach((key) => {
      delete next[key];
      delete next[`-1,${key.split(",")[1]}`];
    });
    onCellAlignmentChange(next);
  };

  return { selectedCells, setSelectedCells, singlePopoverCell, setSinglePopoverCell, handleCellClick, handleBatchAlign, handleBatchClear };
};

export const TableRowsRenderer = ({
  rows,
  customPercentages,
  isKeyValue,
  isMatrix,
  isBorderless,
  isLegend,
  isSchedule,
  cellAlignments,
  interactiveCellAlign,
  selectedCells,
  singlePopoverCell,
  onCellClick,
  onSelectAlign,
  onClearAlign,
  columnsMetadata,
  onUpdateColumnLabel,
  onResetColumnLabel,
}) => (
  <>
    {rows.map((row, ri) => (
      <tr key={ri}>
        {row.cells.map((cell, ci) => {
          if (cell.v_merge_continue) return null;
          const cellKey = `${ri},${ci}`;
          return (
            <InteractiveTableCell
              key={ci}
              cell={cell}
              ri={ri}
              ci={ci}
              totalRows={rows.length}
              customPercentages={customPercentages}
              isKeyValue={isKeyValue}
              isMatrix={isMatrix}
              isBorderless={isBorderless}
              isLegend={isLegend}
              isSchedule={isSchedule}
              cellAlignments={cellAlignments}
              interactiveCellAlign={interactiveCellAlign}
              isSelected={selectedCells.includes(cellKey)}
              showSinglePopover={singlePopoverCell === cellKey && selectedCells.length === 1}
              onCellClick={onCellClick}
              onSelectAlign={onSelectAlign}
              onClearAlign={onClearAlign}
              columnsMetadata={columnsMetadata}
              onUpdateColumnLabel={onUpdateColumnLabel}
              onResetColumnLabel={onResetColumnLabel}
            />
          );
        })}
      </tr>
    ))}
  </>
);

export const TableRenderer = ({
  table,
  columnWidthFormula,
  interactiveCellAlign = false,
  cellAlignments = {},
  onCellAlignmentChange,
  columnsMetadata = null,
  onUpdateColumnLabel = null,
  onResetColumnLabel = null,
}) => {
  const { selectedCells, setSelectedCells, singlePopoverCell, setSinglePopoverCell, handleCellClick, handleBatchAlign, handleBatchClear } =
    useTableSelection(cellAlignments, onCellAlignmentChange);

  if (!table || !table.rows) return null;
  const isLegend = Boolean(
    table.is_legend || (
      table.rows?.[0]?.cells?.[0]?.text?.toLowerCase().includes("không đáp ứng")
    )
  );
  const isBorderless = Boolean(table.borderless || isLegend);
  const isMatrix = Boolean(
    table.is_matrix || (
      table.rows?.[0]?.cells?.[0]?.text?.trim()?.toLowerCase() === "clos" &&
      table.rows?.[0]?.cells?.slice(1).some((c) => (c.text || "").toLowerCase().includes("plo"))
    )
  );
  const isSchedule = Boolean(
    table.is_schedule ||
    (table.rows?.[3]?.cells?.[0]?.text?.includes("(1)") && table.rows?.[0]?.cells?.length >= 10) ||
    table.rows?.[0]?.cells?.[0]?.text?.toLowerCase()?.includes("tuần/buổi")
  );
  const isCenterTable = isMatrix || isLegend || (table.alignment || "").toLowerCase() === "center";
  const numCols = Math.max(...(table.rows || []).map((r) => (r.cells || []).reduce((acc, c) => acc + (c.colspan || 1), 0)), 1);
  const isKeyValue = numCols === 2 && !isBorderless && !isMatrix && !isSchedule;
  const customPercentages = getPercentages(isBorderless, isMatrix, columnWidthFormula, numCols);
  const minTableWidth = isLegend ? "auto" : isSchedule ? "900px" : getMinTableWidth(isBorderless, isMatrix, numCols);
  const isFixedLayout = Boolean(customPercentages || isKeyValue || isMatrix);

  return (
    <div className={`overflow-x-auto custom-thin-scrollbar ${isCenterTable ? "w-full flex justify-center my-2 pb-1" : isBorderless ? "w-auto my-1" : "w-full my-2 pb-1"}`}>
      {interactiveCellAlign && selectedCells.length > 1 && (
        <BatchAlignmentBar count={selectedCells.length} onAlign={handleBatchAlign} onClear={handleBatchClear} onDeselect={() => setSelectedCells([])} />
      )}
      <table style={{ width: isBorderless || isMatrix ? "auto" : "100%", minWidth: minTableWidth, borderCollapse: "collapse", tableLayout: isFixedLayout ? "fixed" : "auto", margin: isCenterTable ? "0 auto" : undefined }}>
        <tbody>
          <TableRowsRenderer
            rows={table.rows}
            customPercentages={customPercentages}
            isKeyValue={isKeyValue}
            isMatrix={isMatrix}
            isBorderless={isBorderless}
            isLegend={isLegend}
            isSchedule={isSchedule}
            cellAlignments={cellAlignments}
            interactiveCellAlign={interactiveCellAlign}
            selectedCells={selectedCells}
            singlePopoverCell={singlePopoverCell}
            onCellClick={handleCellClick}
            onSelectAlign={(key, align, isLastRow, ci) => {
              if (!onCellAlignmentChange) return;
              const next = { ...(cellAlignments || {}) };
              next[key] = align;
              if (isLastRow && ci !== undefined) next[`-1,${ci}`] = align;
              onCellAlignmentChange(next);
              setSinglePopoverCell(null);
            }}
            onClearAlign={(key, isLastRow, ci) => {
              if (!onCellAlignmentChange) return;
              const next = { ...(cellAlignments || {}) };
              delete next[key];
              if (isLastRow && ci !== undefined) delete next[`-1,${ci}`];
              if (isSchedule && !isLastRow && ci !== undefined) {
                for (let r = 4; r < table.rows.length; r++) {
                  delete next[`${r},${ci}`];
                }
              }
              onCellAlignmentChange(next);
              setSinglePopoverCell(null);
            }}
            columnsMetadata={columnsMetadata}
            onUpdateColumnLabel={onUpdateColumnLabel}
            onResetColumnLabel={onResetColumnLabel}
          />
        </tbody>
      </table>
    </div>
  );
};

export default TableRenderer;
