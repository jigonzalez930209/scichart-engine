/**
 * Chart Navigation
 * 
 * Handles zoom, pan, auto-scale, and box zoom operations.
 */

import type { Bounds, ZoomOptions, AxisOptions } from "../../types";
import type { Scale } from "../../scales";
import type { EventEmitter } from "../EventEmitter";
import type { ChartEventMap } from "../../types";

export interface NavigationContext {
  viewBounds: Bounds;
  yScales: Map<string, Scale>;
  yAxisOptionsMap: Map<string, AxisOptions>;
  xAxisOptions: AxisOptions;
  primaryYAxisId: string;
  getPlotArea: () => { x: number; y: number; width: number; height: number };
  events: EventEmitter<ChartEventMap>;
  requestRender: () => void;
  series: Map<string, { 
    isVisible(): boolean; 
    getBounds(): Bounds | null; 
    getYAxisId(): string | undefined;
    getType(): string;
  }>;
}

/**
 * Apply zoom to the chart
 */
export function applyZoom(
  ctx: NavigationContext,
  options: ZoomOptions
): void {
  if (options.x) {
    ctx.viewBounds.xMin = options.x[0];
    ctx.viewBounds.xMax = options.x[1];
  }
  
  const hasBars = Array.from(ctx.series.values()).some(s => s.isVisible() && s.getType() === 'bar');
  const finalY = options.y ? [...options.y] : null;

  if (finalY && hasBars) {
    // Pin baseline to 0 for bar charts during zoom
    finalY[0] = 0;
  }

  if (finalY) {
    if (options.axisId) {
      // Zoom targeted axis only
      const scale = ctx.yScales.get(options.axisId);
      if (scale) {
        scale.setDomain(finalY[0], finalY[1]);
        // Sync primary viewBounds if applicable
        if (options.axisId === ctx.primaryYAxisId) {
          ctx.viewBounds.yMin = finalY[0];
          ctx.viewBounds.yMax = finalY[1];
        }
      }
    } else {
      // Global zoom: apply to all axes proportionally
      const oldRange = ctx.viewBounds.yMax - ctx.viewBounds.yMin;
      const newRange = finalY[1] - finalY[0];
      const factor = oldRange > 0 ? newRange / oldRange : 1;
      
      // Calculate relative shift based on primary axis change
      const offsetPct = oldRange > 0 ? (finalY[0] - ctx.viewBounds.yMin) / oldRange : 0;

      ctx.yScales.forEach((scale, id) => {
        if (id === ctx.primaryYAxisId) return; // Will sync with viewBounds later
        const sRange = scale.domain[1] - scale.domain[0];
        const sNewMin = hasBars ? 0 : (scale.domain[0] + offsetPct * sRange);
        const sNewMax = hasBars 
          ? (scale.domain[0] + (finalY[1] / (ctx.viewBounds.yMax || 1)) * sRange) // Roughly proportional
          : (sNewMin + factor * sRange);
        scale.setDomain(sNewMin, sNewMax);
      });

      ctx.viewBounds.yMin = finalY[0];
      ctx.viewBounds.yMax = finalY[1];
    }
  }
  
  ctx.events.emit("zoom", {
    x: [ctx.viewBounds.xMin, ctx.viewBounds.xMax],
    y: [ctx.viewBounds.yMin, ctx.viewBounds.yMax],
  });
  ctx.requestRender();
}

/**
 * Apply pan to the chart
 */
export function applyPan(
  ctx: NavigationContext,
  deltaX: number,
  deltaY: number,
  axisId?: string
): void {
  const pa = ctx.getPlotArea();
  const dx = (deltaX / pa.width) * (ctx.viewBounds.xMax - ctx.viewBounds.xMin);
  
  // Apply pan to X (always global)
  ctx.viewBounds.xMin -= dx;
  ctx.viewBounds.xMax -= dx;

  if (axisId) {
    // Pan targeted axis only
    const scale = ctx.yScales.get(axisId);
    if (scale) {
      const hasBars = Array.from(ctx.series.values()).some(s => s.isVisible() && s.getType() === 'bar');
      const range = scale.domain[1] - scale.domain[0];
      const moveY = (deltaY / pa.height) * range;
      
      let nextMin = scale.domain[0] + moveY;
      let nextMax = scale.domain[1] + moveY;
      
      if (hasBars) {
        nextMin = 0; // Lock bottom
        // Panning up/down only affects the top bound for bars
        nextMax = scale.domain[1] + moveY; 
      }

      scale.setDomain(nextMin, nextMax);
      
      // Sync primary viewBounds if applicable
      if (axisId === ctx.primaryYAxisId) {
        ctx.viewBounds.yMin = nextMin;
        ctx.viewBounds.yMax = nextMax;
      }
    }
  } else {
    // Global pan: apply to all Y axes proportionally
    const hasBars = Array.from(ctx.series.values()).some(s => s.isVisible() && s.getType() === 'bar');
    ctx.yScales.forEach((scale, id) => {
      const range = scale.domain[1] - scale.domain[0];
      const moveY = (deltaY / pa.height) * range;
      
      let nextMin = scale.domain[0] + moveY;
      let nextMax = scale.domain[1] + moveY;

      if (hasBars) {
        nextMin = 0;
      }

      scale.setDomain(nextMin, nextMax);
      
      if (id === ctx.primaryYAxisId) {
        ctx.viewBounds.yMin = nextMin;
        ctx.viewBounds.yMax = nextMax;
      }
    });
  }

  const dy = (deltaY / pa.height) * (ctx.viewBounds.yMax - ctx.viewBounds.yMin);
  ctx.events.emit("pan", { deltaX: dx, deltaY: dy });
  ctx.requestRender();
}

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
  const hasBars = Array.from(ctx.series.values()).some(s => s.isVisible() && s.getType() === 'bar');

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
      // Global X bounds
      xMin = Math.min(xMin, b.xMin);
      xMax = Math.max(xMax, b.xMax);
      
      // Axis-specific Y bounds
      const axisId = s.getYAxisId() || ctx.primaryYAxisId;
      const yBounds = yAxisBounds.get(axisId);
      if (yBounds) {
        yBounds.min = Math.min(yBounds.min, b.yMin);
        yBounds.max = Math.max(yBounds.max, b.yMax);
      }
      
      hasValidData = true;
    }
  });

  if (!hasValidData) {
    console.warn("[SciChart] No valid data bounds found for autoScale");
    return;
  }

  const MAX_VALUE = 1e15;
  const MIN_VALUE = -1e15;

  // Apply X bounds (global)
  if (ctx.xAxisOptions.auto) {
     let xRange = xMax - xMin;
     if (xRange <= 0 || !isFinite(xRange)) xRange = Math.abs(xMin) * 0.1 || 1;
     const xPad = Math.min(xRange * 0.05, 1e10);
     
     ctx.viewBounds.xMin = Math.max(MIN_VALUE, xMin - xPad);
     ctx.viewBounds.xMax = Math.min(MAX_VALUE, xMax + xPad);
  }

  // Apply Y bounds (per axis)
  yAxisBounds.forEach((bounds, id) => {
      if (bounds.min === Infinity) return; // No data for this axis
      
      const opts = ctx.yAxisOptionsMap.get(id);
      const scale = ctx.yScales.get(id);
      
      if (opts && opts.auto && scale) {
          let yRange = bounds.max - bounds.min;
          if (yRange <= 0 || !isFinite(yRange)) yRange = Math.abs(bounds.min) * 0.1 || 1;
          const yPad = Math.min(yRange * 0.05, 1e10);
          
          let newMin = Math.max(MIN_VALUE, bounds.min - yPad);
          if (hasBars && bounds.min >= 0) {
            newMin = 0; // Pin to bottom for bars
          }
          const newMax = Math.min(MAX_VALUE, bounds.max + yPad);
          
          scale.setDomain(newMin, newMax);
          
          // Sync primary axis to viewBounds for backward compatibility
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
    if (
      currentRect &&
      currentRect.width > 5 &&
      currentRect.height > 5
    ) {
      const plotArea = ctx.getPlotArea();
      const bounds = ctx.viewBounds;

      const xMinNorm = (currentRect.x - plotArea.x) / plotArea.width;
      const xMaxNorm =
        (currentRect.x + currentRect.width - plotArea.x) /
        plotArea.width;
      const yMaxNorm =
        1 - (currentRect.y - plotArea.y) / plotArea.height;
      const yMinNorm =
        1 -
        (currentRect.y + currentRect.height - plotArea.y) /
          plotArea.height;

      const newXMin = bounds.xMin + xMinNorm * (bounds.xMax - bounds.xMin);
      const newXMax = bounds.xMin + xMaxNorm * (bounds.xMax - bounds.xMin);
      const newYMin = bounds.yMin + yMinNorm * (bounds.yMax - bounds.yMin);
      const newYMax = bounds.yMin + yMaxNorm * (bounds.yMax - bounds.yMin);

      zoom({
        x: [newXMin, newXMax],
        y: [newYMin, newYMax],
      });
    }
    return null;
  } else {
    return selectionRect;
  }
}
