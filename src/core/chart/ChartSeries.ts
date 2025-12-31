/**
 * Chart Series Manager
 * 
 * Handles series CRUD operations, buffer management, and curve fitting.
 */

import type { SeriesOptions, HeatmapOptions, SeriesUpdateData, Bounds } from "../../types";
import { Series } from "../Series";
import { fitData, type FitType, type FitOptions } from "../../analysis";
import {
  NativeWebGLRenderer,
  interleaveData,
  interleaveStepData,
  interleaveBandData,
  interleaveBarData,
  calculateBarWidth,
  interleaveHeatmapData,
  getColormap,
} from "../../renderer";
import type { Annotation } from "../annotations";

export interface SeriesManagerContext {
  series: Map<string, Series>;
  renderer: NativeWebGLRenderer;
  viewBounds: Bounds;
  autoScale: () => void;
  requestRender: () => void;
  addAnnotation: (annotation: Annotation) => string;
  xAxisOptions: { auto?: boolean };
  yAxisOptionsMap: Map<string, { auto?: boolean }>;
  autoScrollEnabled: boolean;
  updateLegend?: () => void;
}

/**
 * Add a new series to the chart
 */
export function addSeries(
  ctx: SeriesManagerContext,
  options: SeriesOptions | HeatmapOptions
): void {
  const s = new Series(options);
  ctx.series.set(s.getId(), s);
  updateSeriesBuffer(ctx, s);
  if (ctx.xAxisOptions.auto || Array.from(ctx.yAxisOptionsMap.values()).some(o => o.auto)) {
    ctx.autoScale();
  }
  ctx.updateLegend?.();
  ctx.requestRender();
}

/**
 * Remove a series from the chart
 */
export function removeSeries(
  ctx: SeriesManagerContext,
  id: string
): void {
  const s = ctx.series.get(id);
  if (s) {
    ctx.renderer.deleteBuffer(id);
    ctx.renderer.deleteBuffer(`${id}_step`);
    s.destroy();
    ctx.series.delete(id);
    ctx.updateLegend?.();
    ctx.requestRender();
  }
}

/**
 * Update series data
 */
export function updateSeries(
  ctx: SeriesManagerContext,
  id: string,
  data: SeriesUpdateData
): void {
  const s = ctx.series.get(id);
  if (s) {
    s.updateData(data);
    updateSeriesBuffer(ctx, s);
    ctx.requestRender();
  }
}

/**
 * Update series buffer for rendering
 */
export function updateSeriesBuffer(
  ctx: SeriesManagerContext,
  s: Series
): void {
  const d = s.getData();
  const seriesType = s.getType();
  
  if (seriesType !== "heatmap" && (!d || d.x.length === 0)) return;
  const seriesId = s.getId();
  const totalPoints = d.x.length;

  if (seriesType === "band" || seriesType === "area") {
    // For band: fill between y and y2
    // For area: fill between y and baseline (y=0)
    const y2 = seriesType === "area" 
      ? new Float32Array(totalPoints).fill(0)
      : (d.y2 || new Float32Array(totalPoints).fill(0));
    ctx.renderer.createBuffer(seriesId, interleaveBandData(d.x, d.y, y2));
  } else if (seriesType === "bar") {
    // For bar: create rectangular bar geometry
    const barWidth = (s.getStyle() as any).barWidth ?? calculateBarWidth(d.x);
    const barData = interleaveBarData(d.x, d.y, barWidth);
    ctx.renderer.createBuffer(seriesId, barData);
  } else if (seriesType === "heatmap") {
    const hData = s.getHeatmapData();
    const hStyle = s.getHeatmapStyle();
    if (hData && hData.xValues.length > 1 && hData.yValues.length > 1) {
      console.log(`[SciChart] Updating Heatmap Buffer: ${hData.xValues.length}x${hData.yValues.length}`);
      const data = interleaveHeatmapData(hData.xValues, hData.yValues, hData.zValues);
      ctx.renderer.createBuffer(seriesId, data);

      // Create/Update colormap texture
      const colormapName = hStyle?.colorScale?.name || "viridis";
      const colormapId = `${seriesId}_colormap`;
      const colormapData = getColormap(colormapName);
      ctx.renderer.createColormapTexture(colormapId, colormapData);
      console.log(`[SciChart] Created Colormap Texture: ${colormapId} (${colormapName})`);
    } else {
      console.warn(`[SciChart] Invalid Heatmap Data:`, hData);
    }
  } else {
    ctx.renderer.createBuffer(seriesId, interleaveData(d.x, d.y));
  }
  
  if (seriesType === 'step' || seriesType === 'step+scatter') {
    const stepMode = s.getStyle().stepMode ?? 'after';
    const stepData = interleaveStepData(d.x, d.y, stepMode);
    ctx.renderer.createBuffer(`${seriesId}_step`, stepData);
  }

  s.resetLastAppendCount();
}

/**
 * Append data to existing series
 */
export function appendData(
  ctx: SeriesManagerContext,
  id: string,
  x: number[] | Float32Array,
  y: number[] | Float32Array
): void {
  const s = ctx.series.get(id);
  if (!s) return;

  const oldBounds = s.getBounds();
  const oldMaxX = oldBounds ? oldBounds.xMax : -Infinity;

  s.updateData({ x: x as any, y: y as any, append: true });
  updateSeriesBuffer(ctx, s);

  if (ctx.autoScrollEnabled) {
    const newBounds = s.getBounds();
    if (newBounds) {
      const xRange = ctx.viewBounds.xMax - ctx.viewBounds.xMin;
      if (oldMaxX >= ctx.viewBounds.xMax - xRange * 0.05 || !oldBounds) {
        ctx.viewBounds.xMax = newBounds.xMax;
        ctx.viewBounds.xMin = ctx.viewBounds.xMax - xRange;
      }
    }
  }

  if (ctx.xAxisOptions.auto || Array.from(ctx.yAxisOptionsMap.values()).some(o => o.auto)) {
    ctx.autoScale();
  }
  ctx.requestRender();
}

/**
 * Set max points for rolling window
 */
export function setMaxPoints(
  ctx: SeriesManagerContext,
  id: string,
  maxPoints: number
): void {
  const s = ctx.series.get(id);
  if (s) {
    s.setMaxPoints(maxPoints);
    updateSeriesBuffer(ctx, s);
  }
}

/**
 * Add a fit line (regression) to an existing series
 */
export function addFitLine(
  ctx: SeriesManagerContext & { addSeries: (o: SeriesOptions) => void },
  seriesId: string,
  type: FitType,
  options: FitOptions = {}
): string {
  const s = ctx.series.get(seriesId);
  if (!s) throw new Error(`Series ${seriesId} not found`);

  const data = s.getData();
  if (!data || data.x.length < 2) return "";

  const result = fitData(data.x as any, data.y as any, type, options);
  const bounds = s.getBounds();
  const xMin = bounds?.xMin ?? 0;
  const xMax = bounds?.xMax ?? 1;
  const dataWidth = xMax - xMin;
  const fitResolution = 200;
  const fitX = new Float32Array(fitResolution);
  const fitY = new Float32Array(fitResolution);

  for (let i = 0; i < fitResolution; i++) {
    const x = xMin + (i / (fitResolution - 1)) * dataWidth;
    fitX[i] = x;
    fitY[i] = result.predict(x);
  }

  const fitId = `${seriesId}-fit-${Date.now()}`;
  const sourceStyle = s.getStyle();

  ctx.addSeries({
    id: fitId,
    type: 'line',
    yAxisId: s.getYAxisId(),
    data: { x: fitX, y: fitY },
    style: {
      color: sourceStyle.color,
      width: (sourceStyle.width || 1) * 1.5,
      opacity: 0.8,
      lineDash: [5, 5]
    }
  });

  ctx.addAnnotation({
    type: 'text',
    x: xMin + dataWidth * 0.05,
    y: result.predict(xMin + dataWidth * 0.05),
    text: `${result.equation}\n(R² = ${result.rSquared.toFixed(4)})`,
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: sourceStyle.color || '#ffffff',
    padding: 4,
    anchor: 'bottom-left',
    interactive: true
  });

  return fitId;
}
