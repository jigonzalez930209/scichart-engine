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

