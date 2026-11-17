import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { message } from "antd";
import useHistoryStack from "../../hooks/useHistoryStack";
import { DEFAULT_COLUMN_WIDTH_FORMULAS } from "./constants";

export const areObjectsEqual = (a, b) => {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;
  const cleanA = Object.fromEntries(
    Object.entries(a).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );
  const cleanB = Object.fromEntries(
    Object.entries(b).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );
  const keysA = Object.keys(cleanA);
  const keysB = Object.keys(cleanB);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => cleanA[k] === cleanB[k]);
};

export const useBlockDrawerHistory = ({
  block,
  blockLayout,
  customColumns,
  isOpen,
  tableCode,
  isDisplayTypeSupported,
}) => {
  const [titleStyle, setTitleStyle] = useState({});
  const [contentStyle, setContentStyle] = useState({});
  const [displayType, setDisplayType] = useState("TABLE");
  const [textFormat, setTextFormat] = useState("INLINE");
  const [columnOverrides, setColumnOverrides] = useState({});
  const [columnWidthFormula, setColumnWidthFormula] = useState("");
  const [cellAlignments, setCellAlignments] = useState({});
  const [tableLabelOverrides, setTableLabelOverrides] = useState({});
  const [draftCustomColumns, setDraftCustomColumns] = useState([]);

  const { pushSnapshot, undo, redo, reset, canUndo, canRedo } = useHistoryStack(40);
  const isRestoringRef = useRef(false);
  const isInitializedRef = useRef(false);

  const getCurrentSnapshot = useCallback(() => ({
    titleStyle: { ...titleStyle },
    contentStyle: { ...contentStyle },
    displayType,
    textFormat,
    columnWidthFormula: columnWidthFormula || "",
    cellAlignments: { ...cellAlignments },
    columnOverrides: { ...columnOverrides },
    tableLabelOverrides: { ...tableLabelOverrides },
    draftCustomColumns: [...draftCustomColumns],
  }), [
    titleStyle,
    contentStyle,
    displayType,
    textFormat,
    columnWidthFormula,
    cellAlignments,
    columnOverrides,
    tableLabelOverrides,
    draftCustomColumns,
  ]);

  const applySnapshot = useCallback((snap) => {
    if (!snap) return;
    isRestoringRef.current = true;
    setTitleStyle(snap.titleStyle || {});
    setContentStyle(snap.contentStyle || {});
    setDisplayType(snap.displayType || "TABLE");
    setTextFormat(snap.textFormat || "INLINE");
    setColumnWidthFormula(snap.columnWidthFormula || "");
    setCellAlignments(snap.cellAlignments || {});
    setColumnOverrides(snap.columnOverrides || {});
    setTableLabelOverrides(snap.tableLabelOverrides || {});
    setDraftCustomColumns(snap.draftCustomColumns || []);
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 50);
  }, []);

  const handleUndo = useCallback(() => {
    const current = getCurrentSnapshot();
    const prev = undo(current);
    if (!prev) return;
    applySnapshot(prev);
    message.info("Đã hoàn tác 1 bước");
  }, [getCurrentSnapshot, undo, applySnapshot]);

  const handleRedo = useCallback(() => {
    const current = getCurrentSnapshot();
    const next = redo(current);
    if (!next) return;
    applySnapshot(next);
    message.info("Đã làm lại 1 bước");
  }, [getCurrentSnapshot, redo, applySnapshot]);

  useEffect(() => {
    if (!block) return;
    const rawCfg = block.style_config || {};
    const initTitle = rawCfg.title_style || {};
    const initContent = rawCfg.content_style || (rawCfg.title_style ? {} : rawCfg);
    setTitleStyle(initTitle);
    setContentStyle(initContent);
    const initDisplay = (block.config || {}).display_type || "TABLE";
    setDisplayType(initDisplay);
    const initTextFormat = (block.config || {}).text_format || "INLINE";
    setTextFormat(initTextFormat);
    const initColOverrides = (block.config || {}).column_overrides || {};
    setColumnOverrides(initColOverrides);
    const resolvedCode = (block.config || {}).table_code || (block.config || {}).code || block.code?.toLowerCase();
    const savedFormula = (block.config || {}).column_widths_formula;
    const defaultFormula = DEFAULT_COLUMN_WIDTH_FORMULAS[resolvedCode] || "";
    const initFormula = savedFormula || defaultFormula;
    setColumnWidthFormula(initFormula);
    const initAlignments = (block.config || {}).cell_alignments || {};
    setCellAlignments(initAlignments);
    const existingLabels = blockLayout?.label_overrides?.[resolvedCode] || {};
    setTableLabelOverrides({ ...existingLabels });

    const filtered = (customColumns || []).filter(
      (c) => Boolean(c.table_code && c.table_code === resolvedCode),
    );
    setDraftCustomColumns(filtered);

    reset({
      titleStyle: initTitle,
      contentStyle: initContent,
      displayType: initDisplay,
      textFormat: initTextFormat,
      columnWidthFormula: initFormula,
      cellAlignments: initAlignments,
      columnOverrides: initColOverrides,
      tableLabelOverrides: { ...existingLabels },
      draftCustomColumns: [...filtered],
    });
    isInitializedRef.current = true;
  }, [block, blockLayout, customColumns, reset]);

  useEffect(() => {
    if (!isInitializedRef.current || isRestoringRef.current) return;
    const timer = setTimeout(() => {
      pushSnapshot(getCurrentSnapshot());
    }, 350);
    return () => clearTimeout(timer);
  }, [
    titleStyle,
    contentStyle,
    displayType,
    textFormat,
    columnWidthFormula,
    cellAlignments,
    columnOverrides,
    tableLabelOverrides,
    draftCustomColumns,
    getCurrentSnapshot,
    pushSnapshot,
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleUndo, handleRedo]);

  const isDirty = useMemo(() => {
    if (!block) return false;
    const rawCfg = block.style_config || {};
    const initTitle = rawCfg.title_style || {};
    const initContent = rawCfg.content_style || (rawCfg.title_style ? {} : rawCfg);
    if (!areObjectsEqual(titleStyle, initTitle)) return true;
    if (!areObjectsEqual(contentStyle, initContent)) return true;

    const cfg = block.config || {};
    if (isDisplayTypeSupported && (cfg.display_type || "TABLE") !== displayType) return true;
    if (isDisplayTypeSupported && tableCode === "credit" && (cfg.text_format || "INLINE") !== textFormat) return true;
    const resolvedCode = cfg.table_code || cfg.code || block.code?.toLowerCase();
    const savedFormula = (cfg.column_widths_formula || "").trim();
    const defaultFormula = (DEFAULT_COLUMN_WIDTH_FORMULAS[resolvedCode] || "").trim();
    const effectiveInitialFormula = savedFormula || defaultFormula;
    if ((columnWidthFormula || "").trim() !== effectiveInitialFormula) return true;
    if (!areObjectsEqual(cellAlignments, cfg.cell_alignments || {})) return true;
    if (!areObjectsEqual(columnOverrides, cfg.column_overrides || {})) return true;

    const initLabels = blockLayout?.label_overrides?.[resolvedCode] || {};
    if (!areObjectsEqual(tableLabelOverrides, initLabels)) return true;

    if (draftCustomColumns.some((c) => c.is_draft || c.is_dirty)) return true;
    const initialCustomCount = (customColumns || []).filter(
      (c) => Boolean(c.table_code && c.table_code === resolvedCode)
    ).length;
    if (draftCustomColumns.length !== initialCustomCount) return true;

    return false;
  }, [
    block,
    blockLayout,
    titleStyle,
    contentStyle,
    displayType,
    textFormat,
    columnWidthFormula,
    cellAlignments,
    columnOverrides,
    tableLabelOverrides,
    draftCustomColumns,
    customColumns,
    isDisplayTypeSupported,
    tableCode,
  ]);

  return {
    titleStyle,
    setTitleStyle,
    contentStyle,
    setContentStyle,
    displayType,
    setDisplayType,
    textFormat,
    setTextFormat,
    columnOverrides,
    setColumnOverrides,
    columnWidthFormula,
    setColumnWidthFormula,
    cellAlignments,
    setCellAlignments,
    tableLabelOverrides,
    setTableLabelOverrides,
    draftCustomColumns,
    setDraftCustomColumns,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    isDirty,
  };
};

export default useBlockDrawerHistory;
