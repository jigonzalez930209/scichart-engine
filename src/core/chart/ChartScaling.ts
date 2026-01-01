/**
 * Chart Scaling and Selection
 * 
 * Handles auto-scaling and box zoom (rectangle selection) logic.
 */
import type { NavigationContext } from "./ChartNavigation";
import type { ZoomOptions } from "../../types";

/**
 * Auto-scale all axes to fit data
 */
export function autoScaleAll(ctx: NavigationContext): void {
  if (ctx.series.size === 0) return;

  let xMin = Infinity;
  let xMax = -Infinity;
  
  // Track bounds per Y-axis
  const yAxisBounds = new Map<string, { min: number, max: number }>();
  ctx.yScales.forEach((_, id) => {
    yAxisBounds.set(id, { min: Infinity, max: -Infinity });
  });

  let hasValidData = false;

  ctx.series.forEach((s) => {
    if (!s.isVisible()) return;

    const b = s.getBounds();
    if (
      b &&
      isFinite(b.xMin) &&
      isFinite(b.xMax) &&
      isFinite(b.yMin) &&
      isFinite(b.yMax)
    ) {
      xMin = Math.min(xMin, b.xMin);
      xMax = Math.max(xMax, b.xMax);
      
      const axisId = s.getYAxisId() || ctx.primaryYAxisId;
      const yBounds = yAxisBounds.get(axisId);
      if (yBounds) {
        yBounds.min = Math.min(yBounds.min, b.yMin);
        yBounds.max = Math.max(yBounds.max, b.yMax);
      }
      
      hasValidData = true;
    }
  });

  if (!hasValidData) return;

  const MAX_VAL = 1e15;
  const MIN_VAL = -1e15;

  if (ctx.xAxisOptions.auto) {
     let xRange = xMax - xMin;
     if (xRange <= 0 || !isFinite(xRange)) xRange = Math.abs(xMin) * 0.1 || 1;
     const xPad = Math.min(xRange * 0.05, 1e10);
     ctx.viewBounds.xMin = Math.max(MIN_VAL, xMin - xPad);
     ctx.viewBounds.xMax = Math.min(MAX_VAL, xMax + xPad);
  }

  yAxisBounds.forEach((bounds, id) => {
      if (bounds.min === Infinity) return;
      const opts = ctx.yAxisOptionsMap.get(id);
      const scale = ctx.yScales.get(id);
      if (opts && opts.auto && scale) {
          let yRange = bounds.max - bounds.min;
          if (yRange <= 0 || !isFinite(yRange)) yRange = Math.abs(bounds.min) * 0.1 || 1;
          const yPad = Math.min(yRange * 0.05, 1e10);
          
          let newMin = Math.max(MIN_VAL, bounds.min - yPad);
          const newMax = Math.min(MAX_VAL, bounds.max + yPad);
          scale.setDomain(newMin, newMax);
          
          if (id === ctx.primaryYAxisId) {
              ctx.viewBounds.yMin = newMin;
              ctx.viewBounds.yMax = newMax;
          }
      }
  });
  ctx.requestRender();
}

/**
 * Handle box zoom selection
 */
export function handleBoxZoom(
  ctx: NavigationContext,
  selectionRect: { x: number; y: number; width: number; height: number } | null,
  currentRect: { x: number; y: number; width: number; height: number } | null,
  zoom: (options: ZoomOptions) => void
): { x: number; y: number; width: number; height: number } | null {
  if (selectionRect === null) {
    if (currentRect && currentRect.width > 5 && currentRect.height > 5) {
      const plotArea = ctx.getPlotArea();
      const bounds = ctx.viewBounds;

      const xMinNorm = (currentRect.x - plotArea.x) / plotArea.width;
      const xMaxNorm = (currentRect.x + currentRect.width - plotArea.x) / plotArea.width;
      const yMaxNorm = 1 - (currentRect.y - plotArea.y) / plotArea.height;
      const yMinNorm = 1 - (currentRect.y + currentRect.height - plotArea.y) / plotArea.height;

      const newXMin = bounds.xMin + xMinNorm * (bounds.xMax - bounds.xMin);
      const newXMax = bounds.xMin + xMaxNorm * (bounds.xMax - bounds.xMin);
      const newYMin = bounds.yMin + yMinNorm * (bounds.yMax - bounds.yMin);
      const newYMax = bounds.yMin + yMaxNorm * (bounds.yMax - bounds.yMin);

      zoom({ x: [newXMin, newXMax], y: [newYMin, newYMax] });
    }
    return null;
  }
  return selectionRect;
}
