import React from "react";
import { InputNumber } from "antd";
import { SEGMENT_COLORS } from "./constants";

export const ColumnWeightItem = ({
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
          style={{ backgroundColor: color }}
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

export default ColumnWeightItem;
