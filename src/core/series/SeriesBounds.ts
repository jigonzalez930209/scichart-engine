/**
 * Series Bounds Calculation Logic
 */
import type { SeriesData, Bounds, SeriesType, HeatmapData } from "../../types";

export function calculateSeriesBounds(
  type: SeriesType,
  data: SeriesData,
  heatmapData?: HeatmapData
): Bounds {
  if (type === "heatmap" && heatmapData) {
    const { xValues, yValues } = heatmapData;
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (let i = 0; i < xValues.length; i++) {
      const v = xValues[i];
      if (v < xMin) xMin = v;
      if (v > xMax) xMax = v;
    }
    for (let i = 0; i < yValues.length; i++) {
      const v = yValues[i];
      if (v < yMin) yMin = v;
      if (v > yMax) yMax = v;
    }
    return { xMin, xMax, yMin, yMax };
  }

  const { x, y, y2, high, low } = data;
  if (x.length === 0) return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };

  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

  for (let i = 0; i < x.length; i++) {
    const xVal = x[i];
    if (!isFinite(xVal)) continue;

    if (xVal < xMin) xMin = xVal;
    if (xVal > xMax) xMax = xVal;

    // Check all possible Y values for this point
    const yValues = [y[i]];
    if (y2 && isFinite(y2[i])) yValues.push(y2[i]);
    if (high && isFinite(high[i])) yValues.push(high[i]);
    if (low && isFinite(low[i])) yValues.push(low[i]);

    for (const v of yValues) {
      if (isFinite(v)) {
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
    }
  }

  if (xMin === Infinity) return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
  return { xMin, xMax, yMin, yMax };
}
