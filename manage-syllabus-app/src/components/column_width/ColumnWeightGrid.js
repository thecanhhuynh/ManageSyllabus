import React from "react";
import ColumnWeightItem from "./ColumnWeightItem";

export const ColumnWeightGrid = ({
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

export default ColumnWeightGrid;
