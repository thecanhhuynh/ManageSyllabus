import React, {useState, useEffect, useMemo, useCallback} from "react";
import {Input, Tag, Button, Tooltip, InputNumber} from "antd";
import {
  ColumnWidthOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {getDefaultWidthFormula} from "./block_styler/constants";

const SEGMENT_COLORS = [
  "#1677ff",
  "#13c2c2",
  "#722ed1",
  "#52c41a",
  "#fa8c16",
  "#eb2f96",
  "#2f54eb",
  "#faad14",
  "#08979c",
  "#389e0d",
];

const parseWeights = (raw) => {
  if (!raw || typeof raw !== "string") return [];
  const matches = raw.match(/\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map((n) => parseFloat(n)).filter((n) => n > 0);
};

const adaptFormulaToColCount = (rawFormula, targetCount, tableCode) => {
  if (!targetCount || targetCount <= 0) return "";
  const weights = parseWeights(rawFormula);
  if (weights.length === targetCount) return weights.join(" ");
  if (weights.length === 0) {
    return getDefaultWidthFormula(tableCode, targetCount);
  }
  if (weights.length > targetCount) {
    return weights.slice(0, targetCount).join(" ");
  }
  const isSchedule =
    Boolean(tableCode && tableCode.includes("schedule")) || targetCount >= 11;
  const extraVal = isSchedule ? 1.2 : 1.0;
  const missingCount = targetCount - weights.length;
  const extras = Array(missingCount).fill(extraVal);
  return [...weights, ...extras].join(" ");
};

const validateWeights = (weights, colCount) => {
  if (!weights.length) {
    return {valid: false, error: "Vui lòng nhập công thức độ rộng."};
  }
  if (weights.length !== colCount) {
    return {
      valid: false,
      error: `Cần đúng ${colCount} số (hiện có ${weights.length} số).`,
    };
  }
  const sum = weights.reduce((acc, w) => acc + w, 0);
  if (sum <= 0) {
    return {valid: false, error: "Tổng trọng số phải lớn hơn 0."};
  }
  const percentages = weights.map((w) => (w / sum) * 100);
  const narrowThreshold = colCount >= 8 ? 4 : 8;
  const tooNarrow = percentages.some((p) => p < narrowThreshold);
  return {
    valid: true,
    sum,
    percentages,
    isGrid12: Math.abs(sum - 12) < 0.05,
    warning: tooNarrow
      ? `Có cột hẹp dưới ${narrowThreshold}%, tiêu đề có thể bị chật chữ.`
      : null,
  };
};

const getCommonPresets = (count) => {
  if (count === 2) {
    return [
      {label: "35% / 65%", formula: "4 8"},
      {label: "50% / 50%", formula: "6 6"},
      {label: "30% / 70%", formula: "3.5 8.5"},
    ];
  }
  if (count === 3) {
    return [
      {label: "Chia đều", formula: "4 4 4"},
      {label: "17% 66% 17%", formula: "2 8 2"},
      {label: "17% 58% 25%", formula: "2 7 3"},
      {label: "17% 17% 66%", formula: "2 2 8"},
    ];
  }
  if (count === 4) {
    return [
      {label: "Chia đều", formula: "3 3 3 3"},
      {label: "17% 25% 42% 17%", formula: "2 3 5 2"},
      {label: "8% 25% 50% 17%", formula: "1 3 6 2"},
    ];
  }
  if (count === 5) {
    return [
      {label: "Chia đều", formula: "2.4 2.4 2.4 2.4 2.4"},
      {label: "8% 17% 42% 17% 17%", formula: "1 2 5 2 2"},
    ];
  }
  if (count >= 11) {
    const base = [0.85, 2.6, 0.9, 1.8, 0.65, 2, 0.65, 1.8, 0.65, 1.3, 1.3];
    const extras = Array(count - 11).fill(1.2);
    const landscapeFormula = [...base, ...extras].join(" ");
    return [
      {label: "Cân đối A4 Ngang", formula: landscapeFormula},
      {label: "Chia đều", formula: Array(count).fill("1").join(" ")},
    ];
  }
  return [{label: "Chia đều", formula: Array(count).fill("1").join(" ")}];
};

const resolvePresets = (count, tableCode, fallbackDefault) => {
  const common = getCommonPresets(count);
  const defaultFormula =
    fallbackDefault || getDefaultWidthFormula(tableCode, count);
  if (!defaultFormula) return common;
  const filtered = common.filter((p) => p.formula !== defaultFormula);
  return [{label: "Mặc định (Chuẩn)", formula: defaultFormula}, ...filtered];
};

const StatusBadge = ({formula, validation}) => {
  if (!formula.trim()) {
    return <Tag color="default">Mặc định</Tag>;
  }
  if (!validation.valid) {
    return <Tag color="error">{validation.error}</Tag>;
  }
  if (validation.isGrid12) {
    return (
      <Tag color="success" icon={<CheckCircleOutlined />}>
        Chuẩn 12 cột
      </Tag>
    );
  }
  return (
    <Tag color="blue">Tỉ lệ tự do (Tổng: {validation.sum.toFixed(1)})</Tag>
  );
};

const SegmentBar = ({percentages, colList}) => (
  <div className="h-4 w-full bg-gray-200 rounded flex overflow-hidden border border-gray-300">
    {percentages.map((pct, idx) => (
      <div
        key={idx}
        style={{
          width: `${pct}%`,
          backgroundColor: SEGMENT_COLORS[idx % SEGMENT_COLORS.length],
        }}
        className="h-full flex items-center justify-center text-[10px] text-white font-bold transition-all duration-200 overflow-hidden px-1 truncate"
        title={`${colList[idx] || `Cột ${idx + 1}`}: ${pct.toFixed(1)}%`}
      >
        {pct >= 10 ? `${pct.toFixed(0)}%` : ""}
      </div>
    ))}
  </div>
);

const ColumnWeightItem = ({
  colName,
  idx,
  currentW,
  currentPct,
  disabled,
  onStep,
}) => {
  const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
  return (
    <div className="bg-white px-2 py-1 rounded border border-gray-200 flex items-center justify-between gap-1 text-[11px] shadow-2xs hover:border-blue-300 transition-colors">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{backgroundColor: color}}
        />
        <span
          className="truncate text-gray-700 font-medium text-[11px]"
          title={colName}
        >
          {colName}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <InputNumber
          size="small"
          min={0.1}
          step={0.5}
          value={currentW}
          disabled={disabled}
          onChange={(v) => onStep(idx, v)}
          className="w-12 text-center text-[11px]"
          controls={false}
        />
        <span className="text-[10px] text-gray-400 font-mono w-6 text-right">
          {currentPct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

const ColumnWeightGrid = ({
  colList,
  weights,
  percentages,
  disabled,
  onStep,
}) => (
  <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-0.5 pt-0.5">
    {colList.map((colName, idx) => (
      <ColumnWeightItem
        key={idx}
        colName={colName}
        idx={idx}
        currentW={weights[idx] || 0}
        currentPct={percentages[idx] || 0}
        disabled={disabled}
        onStep={onStep}
      />
    ))}
  </div>
);

const PresetButtonGroup = ({presets, activeFormula, disabled, onApply}) => (
  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
    <span className="text-xs text-gray-500">Mẫu:</span>
    {presets.map((p, idx) => (
      <Button
        key={idx}
        size="small"
        type={activeFormula.trim() === p.formula ? "primary" : "default"}
        disabled={disabled}
        className="text-xs"
        onClick={() => onApply(p.formula)}
      >
        {p.label}
      </Button>
    ))}
  </div>
);

const TableColumnWidthControl = ({
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
    [tableCode, colCount, defaultFormula],
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
    [weights, colCount],
  );

  const presets = useMemo(
    () => resolvePresets(colCount, tableCode, resolvedDefault),
    [colCount, tableCode, resolvedDefault],
  );

  const handleApplyFormula = useCallback(
    (nextFormula) => {
      setFormula(nextFormula);
      const nextWeights = parseWeights(nextFormula);
      const res = validateWeights(nextWeights, colCount);
      if (!onChange) return;
      onChange(nextFormula, res.valid, nextWeights, res.percentages || []);
    },
    [colCount, onChange],
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
          <SegmentBar
            percentages={validation.percentages}
            colList={colList}
          />
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
