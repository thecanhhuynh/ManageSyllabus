import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Input, Tag, Button, Tooltip, InputNumber } from "antd";
import {
  ColumnWidthOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

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

const validateWeights = (weights, colCount) => {
  if (!weights.length) {
    return { valid: false, error: "Vui lòng nhập công thức độ rộng." };
  }
  if (weights.length !== colCount) {
    return {
      valid: false,
      error: `Cần đúng ${colCount} số (hiện có ${weights.length} số).`,
    };
  }
  const sum = weights.reduce((acc, w) => acc + w, 0);
  if (sum <= 0) {
    return { valid: false, error: "Tổng trọng số phải lớn hơn 0." };
  }
  const percentages = weights.map((w) => (w / sum) * 100);
  const narrowThreshold = colCount >= 8 ? 4 : 8;
  const tooNarrow = percentages.some((p) => p < narrowThreshold);
  return {
    valid: true,
    sum,
    percentages,
    isGrid12: Math.abs(sum - 12) < 0.05,
    warning: tooNarrow ? `Có cột hẹp dưới ${narrowThreshold}%, tiêu đề có thể bị chật chữ.` : null,
  };
};

const getCommonPresets = (count) => {
  if (count === 2) {
    return [
      { label: "35% / 65%", formula: "4 8" },
      { label: "50% / 50%", formula: "6 6" },
      { label: "30% / 70%", formula: "3.5 8.5" },
    ];
  }
  if (count === 3) {
    return [
      { label: "Chia đều", formula: "4 4 4" },
      { label: "17% 66% 17%", formula: "2 8 2" },
      { label: "17% 58% 25%", formula: "2 7 3" },
      { label: "17% 17% 66%", formula: "2 2 8" },
    ];
  }
  if (count === 4) {
    return [
      { label: "Chia đều", formula: "3 3 3 3" },
      { label: "17% 25% 42% 17%", formula: "2 3 5 2" },
      { label: "8% 25% 50% 17%", formula: "1 3 6 2" },
    ];
  }
  if (count === 5) {
    return [
      { label: "Chia đều", formula: "2.4 2.4 2.4 2.4 2.4" },
      { label: "8% 17% 42% 17% 17%", formula: "1 2 5 2 2" },
    ];
  }
  if (count >= 11) {
    const scheduleBase = [1, 3, 1.2, 2, 0.8, 2.2, 0.8, 2, 0.8, 1.5, 1.5];
    const extras = Array(count - 11).fill(1.2);
    const landscapeFormula = [...scheduleBase, ...extras].join(" ");
    return [
      { label: "Cân đối A4 Ngang", formula: landscapeFormula },
      { label: "Chia đều", formula: Array(count).fill("1").join(" ") },
    ];
  }
  return [
    { label: "Chia đều", formula: Array(count).fill("1").join(" ") },
  ];
};

const TableColumnWidthControl = ({
  columns = [],
  value = "",
  onChange,
  disabled = false,
}) => {
  const colList = useMemo(() => {
    if (Array.isArray(columns) && columns.length > 0) return columns;
    return ["Cột 1", "Cột 2"];
  }, [columns]);

  const colCount = colList.length;
  const [formula, setFormula] = useState(value || "");

  useEffect(() => {
    if (value !== undefined && value !== formula) {
      setFormula(value || "");
    }
  }, [value]);

  const weights = useMemo(() => parseWeights(formula), [formula]);
  const validation = useMemo(
    () => validateWeights(weights, colCount),
    [weights, colCount]
  );

  const presets = useMemo(() => getCommonPresets(colCount), [colCount]);

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

  const statusBadge = useMemo(() => {
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
      <Tag color="blue">
        Tỉ lệ tự do (Tổng: {validation.sum.toFixed(1)})
      </Tag>
    );
  }, [formula, validation]);

  return (
    <div className="bg-gray-50/90 p-3 rounded-lg border border-gray-200 space-y-2.5">
      <div className="flex items-center justify-between flex-wrap gap-1.5">
        <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <ColumnWidthOutlined className="text-blue-600" />
          Độ rộng ({colCount} cột)
        </span>
        {statusBadge}
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
        <Tooltip title="Đặt lại chia đều">
          <Button
            icon={<ReloadOutlined />}
            disabled={disabled}
            className="flex items-center justify-center flex-shrink-0"
            onClick={() =>
              handleApplyFormula(Array(colCount).fill(Number((12 / colCount).toFixed(1))).join(" "))
            }
          />
        </Tooltip>
      </div>

      {validation.warning && (
        <div className="text-xs text-amber-600 flex items-center gap-1 leading-normal">
          <ExclamationCircleOutlined className="flex-shrink-0" /> {validation.warning}
        </div>
      )}

      {/* Visual Multi-Segment Bar */}
      {validation.valid && validation.percentages && (
        <div className="space-y-1.5">
          <div className="h-4 w-full bg-gray-200 rounded flex overflow-hidden border border-gray-300">
            {validation.percentages.map((pct, idx) => (
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

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {colList.map((colName, idx) => {
              const currentW = weights[idx] || 0;
              const currentPct = validation.percentages[idx] || 0;
              const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
              return (
                <div
                  key={idx}
                  className="bg-white px-2 py-1 rounded border border-gray-200 flex items-center gap-1.5 text-xs"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="max-w-[80px] truncate text-gray-700 font-medium" title={colName}>
                    {colName}
                  </span>
                  <InputNumber
                    size="small"
                    min={0.5}
                    step={0.5}
                    value={currentW}
                    disabled={disabled}
                    onChange={(v) => handleWeightStep(idx, v)}
                    className="w-14 text-center text-xs"
                    controls={false}
                  />
                  <span className="text-[11px] text-gray-500 font-mono">
                    {currentPct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Presets */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span className="text-xs text-gray-500">Mẫu:</span>
        {presets.map((p, idx) => (
          <Button
            key={idx}
            size="small"
            type={formula.trim() === p.formula ? "primary" : "default"}
            disabled={disabled}
            className="text-xs"
            onClick={() => handleApplyFormula(p.formula)}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TableColumnWidthControl;
