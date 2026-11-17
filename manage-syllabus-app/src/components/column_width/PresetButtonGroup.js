import React from "react";
import { Button } from "antd";

export const PresetButtonGroup = ({
  presets,
  activeFormula,
  disabled,
  onApply,
}) => (
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

export default PresetButtonGroup;
