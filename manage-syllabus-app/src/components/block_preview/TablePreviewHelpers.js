export const getMatrixCellWidth = (ci) => (ci === 0 ? "54px" : "56px");

export const getCellWidth = (customPercentages, isKeyValue, isMatrix, ci) => {
  if (isMatrix) return getMatrixCellWidth(ci);
  if (customPercentages) return `${customPercentages[ci].toFixed(1)}%`;
  if (isKeyValue) return ci === 0 ? "35%" : "65%";
  return undefined;
};

export const getCellPadding = (isBorderless, isMatrix, isLegend) => {
  if (isLegend) return "3px 16px";
  if (isBorderless) return "2px 20px 2px 0";
  if (isMatrix) return "4px 4px";
  return "6px 8px";
};

export const getCellMinWidth = (isMatrix, isFixedLayout, ci, isLegend) => {
  if (isLegend) return "160px";
  if (isMatrix) return ci === 0 ? "50px" : "52px";
  if (isFixedLayout) return "55px";
  return "80px";
};

export const getPercentages = (isBorderless, isMatrix, formula, numCols) => {
  if (isBorderless || isMatrix || !formula || typeof formula !== "string") return null;
  const matches = formula.match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length !== numCols) return null;
  const weights = matches.map((n) => parseFloat(n)).filter((n) => n > 0);
  if (weights.length !== numCols) return null;
  const sum = weights.reduce((acc, w) => acc + w, 0);
  if (sum <= 0) return null;
  return weights.map((w) => (w / sum) * 100);
};

export const getMinTableWidth = (isBorderless, isMatrix, numCols) => {
  if (isBorderless || isMatrix) return "auto";
  if (numCols <= 3) return "100%";
  if (numCols === 4) return "560px";
  if (numCols === 5) return "680px";
  return Math.max(800, numCols * 115);
};

export const getEffectiveAlignment = (isMatrix, currentAlign, cellAlign) => {
  if (isMatrix) return "center";
  if (currentAlign) return currentAlign.toLowerCase();
  return (cellAlign || "left").toLowerCase();
};
