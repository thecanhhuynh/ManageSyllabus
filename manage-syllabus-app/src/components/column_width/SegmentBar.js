import React from "react";
import { SEGMENT_COLORS } from "./constants";

export const SegmentBar = ({ percentages, colList }) => (
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

export default SegmentBar;
