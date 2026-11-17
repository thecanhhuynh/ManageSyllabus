import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Input, Button, Tooltip } from "antd";
import {
  ColumnWidthOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { getDefaultWidthFormula } from "../block_styler/constants";
import {
  parseWeights,
  adaptFormulaToColCount,
  validateWeights,
  resolvePresets,
} from "./widthHelpers";
import StatusBadge from "./StatusBadge";
import SegmentBar from "./SegmentBar";
import ColumnWeightGrid from "./ColumnWeightGrid";
import PresetButtonGroup from "./PresetButtonGroup";

export const TableColumnWidthControl = ({
  columns = [],
  value = "",
  tableCode = null,
  defaultFormula = "",
  onChange,
  disabled = false,
}) => {
  const colList = useMemo(() => {
    if (Array.isArray(columns) && columns.length > 0) return columns;
    return ["Cột 1", "Cột 2"];
  }, [columns]);

  const colCount = colList.length;

  const resolvedDefault = useMemo(
    () => getDefaultWidthFormula(tableCode, colCount) || defaultFormula,
    [tableCode, colCount, defaultFormula]
  );

  const initialFormula = useMemo(() => {
    if (value && typeof value === "string" && value.trim()) {
      return adaptFormulaToColCount(value, colCount, tableCode);
    }
    return resolvedDefault;
  }, [value, colCount, tableCode, resolvedDefault]);

  const [formula, setFormula] = useState(initialFormula);

  useEffect(() => {
    const nextFormula =
      value && typeof value === "string" && value.trim()
        ? adaptFormulaToColCount(value, colCount, tableCode)
        : resolvedDefault;
    setFormula((prev) => (nextFormula !== prev ? nextFormula : prev));
  }, [value, colCount, tableCode, resolvedDefault]);

  const weights = useMemo(() => parseWeights(formula), [formula]);
  const validation = useMemo(
    () => validateWeights(weights, colCount),
    [weights, colCount]
  );

  const presets = useMemo(
    () => resolvePresets(colCount, tableCode, resolvedDefault),
    [colCount, tableCode, resolvedDefault]
  );

  const handleApplyFormula = useCallback(
    (nextFormula) => {
      setFormula(nextFormula);
      const nextWeights = parseWeights(nextFormula);
      const res = validateWeights(nextWeights, colCount);
      if (!onChange) return;
      onChange(nextFormula, res.valid, nextWeights, res.percentages || []);
    },
    [colCount, onChange]
  );

  const handleWeightStep = (index, newVal) => {
    if (newVal === null || newVal <= 0) return;
    const currentWeights =
      weights.length === colCount
        ? [...weights]
        : Array(colCount).fill(12 / colCount);
    currentWeights[index] = Number(newVal.toFixed(1));
    handleApplyFormula(currentWeights.join(" "));
  };

  return (
    <div className="bg-gray-50/90 p-3 rounded-lg border border-gray-200 space-y-2.5">
      <div className="flex items-center justify-between flex-wrap gap-1.5">
        <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <ColumnWidthOutlined className="text-blue-600" />
          Độ rộng ({colCount} cột)
        </span>
        <StatusBadge formula={formula} validation={validation} />
      </div>

      <div className="flex gap-2">
        <Input
          value={formula}
          disabled={disabled}
          placeholder={`VD: ${presets[0]?.formula || "2 2 8"}`}
          onChange={(e) => handleApplyFormula(e.target.value)}
          status={!validation.valid && formula ? "error" : ""}
          className="text-xs font-mono"
        />
        <Tooltip title="Đặt lại độ rộng mặc định">
          <Button
            icon={<ReloadOutlined />}
            disabled={disabled}
            className="flex items-center justify-center flex-shrink-0"
            onClick={() => handleApplyFormula(resolvedDefault)}
          />
        </Tooltip>
      </div>

      {validation.warning && (
        <div className="text-xs text-amber-600 flex items-center gap-1 leading-normal">
          <ExclamationCircleOutlined className="flex-shrink-0" />{" "}
          {validation.warning}
        </div>
      )}

      {validation.valid && validation.percentages && (
        <div className="space-y-1.5">
          <SegmentBar percentages={validation.percentages} colList={colList} />
          <ColumnWeightGrid
            colList={colList}
            weights={weights}
            percentages={validation.percentages}
            disabled={disabled}
            onStep={handleWeightStep}
          />
        </div>
      )}

      <PresetButtonGroup
        presets={presets}
        activeFormula={formula}
        disabled={disabled}
        onApply={handleApplyFormula}
      />
    </div>
  );
};

export default TableColumnWidthControl;
