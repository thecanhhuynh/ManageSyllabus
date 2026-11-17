import { getDefaultWidthFormula } from "../block_styler/constants";

export const parseWeights = (raw) => {
  if (!raw || typeof raw !== "string") return [];
  const matches = raw.match(/\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map((n) => parseFloat(n)).filter((n) => n > 0);
};

export const adaptFormulaToColCount = (rawFormula, targetCount, tableCode) => {
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

export const validateWeights = (weights, colCount) => {
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
    warning: tooNarrow
      ? `Có cột hẹp dưới ${narrowThreshold}%, tiêu đề có thể bị chật chữ.`
      : null,
  };
};

export const getCommonPresets = (count) => {
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
    const base = [0.85, 2.6, 0.9, 1.8, 0.65, 2, 0.65, 1.8, 0.65, 1.3, 1.3];
    const extras = Array(count - 11).fill(1.2);
    const landscapeFormula = [...base, ...extras].join(" ");
    return [
      { label: "Cân đối A4 Ngang", formula: landscapeFormula },
      { label: "Chia đều", formula: Array(count).fill("1").join(" ") },
    ];
  }
  return [{ label: "Chia đều", formula: Array(count).fill("1").join(" ") }];
};

export const resolvePresets = (count, tableCode, fallbackDefault) => {
  const common = getCommonPresets(count);
  const defaultFormula =
    fallbackDefault || getDefaultWidthFormula(tableCode, count);
  if (!defaultFormula) return common;
  const filtered = common.filter((p) => p.formula !== defaultFormula);
  return [{ label: "Mặc định (Chuẩn)", formula: defaultFormula }, ...filtered];
};
