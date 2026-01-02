/**
 * Chart Renderer
 * 
 * Core rendering logic for the chart (WebGL + Overlay).
 */

import type { Bounds, CursorOptions, AxisOptions } from "../../types";
import type { Series } from "../Series";
import type { Scale } from "../../scales";
import type { NativeWebGLRenderer, NativeSeriesRenderData as SeriesRenderData } from "../../renderer/NativeWebGLRenderer";
import type { OverlayRenderer } from "../OverlayRenderer";
import type { PlotArea, CursorState, ChartEventMap } from "../../types";
import type { AnnotationManager } from "../annotations";
import type { ChartStatistics } from "../ChartStatistics";
import type { EventEmitter } from "../EventEmitter";

export interface RenderContext {
  webglCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  overlayCtx: CanvasRenderingContext2D;
  container: HTMLDivElement;
  series: Map<string, Series>;
  viewBounds: Bounds;
  xScale: Scale;
  yScales: Map<string, Scale>;
  yAxisOptionsMap: Map<string, AxisOptions>;
  xAxisOptions: AxisOptions;
  primaryYAxisId: string;
  renderer: NativeWebGLRenderer;
  overlay: OverlayRenderer;
  annotationManager: AnnotationManager;
  backgroundColor: [number, number, number, number];
  cursorOptions: CursorOptions | null;
  cursorPosition: { x: number; y: number } | null;
  selectionRect: { x: number; y: number; width: number; height: number } | null;
  stats: ChartStatistics | null;
  showStatistics: boolean;
  events: EventEmitter<ChartEventMap>;
  updateSeriesBuffer: (s: Series) => void;
  getPlotArea: () => PlotArea;
  pixelToDataX: (px: number) => number;
  pixelToDataY: (py: number) => number;
  tooltip: import("../tooltip").TooltipManager;
}

/**
 * Prepare series data for WebGL rendering
 */
export function prepareSeriesData(
  ctx: RenderContext,
  plotArea: PlotArea
): SeriesRenderData[] {
  const seriesData: SeriesRenderData[] = [];

  // Update all scales with current plot area range and domain
  ctx.xScale.setRange(plotArea.x, plotArea.x + plotArea.width);
  ctx.xScale.setDomain(ctx.viewBounds.xMin, ctx.viewBounds.xMax);

  ctx.yScales.forEach((scale, id) => {
    scale.setRange(plotArea.y + plotArea.height, plotArea.y);
    if (id === ctx.primaryYAxisId) {
      scale.setDomain(ctx.viewBounds.yMin, ctx.viewBounds.yMax);
    }
  });

  ctx.series.forEach((s) => {
    if (s.needsBufferUpdate) {
      ctx.updateSeriesBuffer(s);
      s.needsBufferUpdate = false;
    }

    const buf = ctx.renderer.getBuffer(s.getId());
    const seriesType = s.getType();
    
    // Candlesticks use sub-buffers, so main buffer might be missing
    if (buf || seriesType === 'candlestick') {
      
      // Determine Y-bounds for this series
      const axisId = s.getYAxisId() || ctx.primaryYAxisId;
      const scale = ctx.yScales.get(axisId);
      let yBounds: { min: number; max: number } | undefined;
      
      if (scale) {
         yBounds = { min: scale.domain[0], max: scale.domain[1] };
      }

      // Map area type to band for rendering (area fills to y=0)
      const renderType = seriesType === 'area' ? 'band' : seriesType;

      // Base render data (only if buffer exists)
      let renderData: SeriesRenderData | null = null;
      
      if (buf) {
        renderData = {
          id: s.getId(),
          buffer: buf,
          count: s.getPointCount(),
          style: s.getStyle(),
          visible: s.isVisible(),
          type: renderType,
          yBounds,
        };
      }

      // Special count multipliers for geometry-heavy types
      if (renderData) {
        if (seriesType === "band" || seriesType === "area") {
          renderData.count = s.getPointCount() * 2;
        } else if (seriesType === "bar") {
          renderData.count = s.getPointCount() * 6;
        }
      
        // Add step buffer for step types
        if (seriesType === 'step' || seriesType === 'step+scatter') {
          const stepBuf = ctx.renderer.getBuffer(`${s.getId()}_step`);
          if (stepBuf) {
            renderData.stepBuffer = stepBuf;
            // Calculate step count based on mode
            const stepMode = s.getStyle().stepMode ?? 'after';
            const pointCount = s.getPointCount();
            if (stepMode === 'center') {
              renderData.stepCount = 1 + (pointCount - 1) * 3;
            } else {
              renderData.stepCount = pointCount * 2 - 1;
            }
          }
        }
      
        if (seriesType === 'heatmap') {
          const hData = s.getHeatmapData();
          const hStyle = s.getHeatmapStyle();
          if (hData) {
            // Heatmap count is 6 vertices per cell (2 triangles)
            const w = hData.xValues.length;
            const h = hData.yValues.length;
            renderData.count = (w - 1) * (h - 1) * 6;
            
            // Calculate Z-bounds if not provided
            let zMin = Infinity, zMax = -Infinity;
            for (let i = 0; i < hData.zValues.length; i++) {
              const v = hData.zValues[i];
              if (v < zMin) zMin = v;
              if (v > zMax) zMax = v;
            }
            if (zMin === zMax) {
              zMin -= 1;
              zMax += 1;
            }

            renderData.zBounds = { 
              min: hStyle?.colorScale?.min ?? (zMin === Infinity ? 0 : zMin), 
              max: hStyle?.colorScale?.max ?? (zMax === -Infinity ? 1 : zMax) 
            };
            
            if (renderData.zBounds.min === renderData.zBounds.max) {
               renderData.zBounds.max = renderData.zBounds.min + 1;
            }
            
            // Attach texture
            const colormapId = `${s.getId()}_colormap`;
            renderData.colormapTexture = ctx.renderer.getTexture(colormapId);
          }
        }
      }

      if (seriesType === 'candlestick') {
        const bullishBuf = ctx.renderer.getBuffer(`${s.getId()}_bullish`);
        if (bullishBuf) {
          seriesData.push({
            id: `${s.getId()}_bullish`,
            buffer: bullishBuf,
            count: s.bullishCount || 0,
            style: { ...s.getStyle(), color: (s.getStyle() as any).bullishColor || '#26a69a' },
            visible: s.isVisible(),
            type: 'bar', // Using bar renderer (triangles)
            yBounds,
          });
        }
        const bearishBuf = ctx.renderer.getBuffer(`${s.getId()}_bearish`);
        if (bearishBuf) {
          seriesData.push({
            id: `${s.getId()}_bearish`,
            buffer: bearishBuf,
            count: s.bearishCount || 0,
            style: { ...s.getStyle(), color: (s.getStyle() as any).bearishColor || '#ef5350' },
            visible: s.isVisible(),
            type: 'bar', // Using bar renderer (triangles)
            yBounds,
          });
        }
      } else if (renderData) {
        seriesData.push(renderData);
      }
    }
  });

  return seriesData;
}

/**
 * Render overlay elements (axes, grid, annotations, etc.)
 */
export function renderOverlay(
  ctx: RenderContext,
  plotArea: PlotArea,
  primaryYScale: Scale
): void {
  const rect = ctx.container.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    console.warn("[SciChart] Container has zero size in render, skipping overlay");
    return;
  }

  ctx.overlay.clear(rect.width, rect.height);
  ctx.overlay.drawGrid(plotArea, ctx.xScale, primaryYScale);
  ctx.overlay.drawXAxis(plotArea, ctx.xScale, ctx.xAxisOptions.label);

  // Group axes by position
  const leftAxes: string[] = [];
  const rightAxes: string[] = [];
  
  ctx.yAxisOptionsMap.forEach((opts, id) => {
      if(opts.position === 'right') rightAxes.push(id);
      else leftAxes.push(id);
  });

  // Draw Left Axes (stacked outwards)
  leftAxes.forEach((id, index) => {
      const scale = ctx.yScales.get(id);
      const opts = ctx.yAxisOptionsMap.get(id);
      if(scale && opts) {
           const offset = index * 65; 
           ctx.overlay.drawYAxis(plotArea, scale, opts.label, 'left', offset);
      }
  });

  // Draw Right Axes (stacked outwards)
  rightAxes.forEach((id, index) => {
      const scale = ctx.yScales.get(id);
      const opts = ctx.yAxisOptionsMap.get(id);
      if(scale && opts) {
           const offset = index * 65; 
           ctx.overlay.drawYAxis(plotArea, scale, opts.label, 'right', offset);
      }
  });

  ctx.overlay.drawPlotBorder(plotArea);

  // Draw Error Bars for all series with error data
  ctx.series.forEach((s) => {
    if (s.isVisible() && s.hasErrorData()) {
      const axisId = s.getYAxisId() || ctx.primaryYAxisId;
      const scale = ctx.yScales.get(axisId);
      const yScale = scale || primaryYScale; 
      
      ctx.overlay.drawErrorBars(plotArea, s, ctx.xScale, yScale);
    }
  });

  // Draw Selection Box
  if (ctx.selectionRect) {
    ctx.overlay.drawSelectionRect(ctx.selectionRect);
  }

  // Draw Annotations
  if (ctx.annotationManager.count > 0) {
    ctx.annotationManager.render(ctx.overlayCtx, plotArea, ctx.viewBounds);
  }

  // Cursor
  if (ctx.cursorOptions?.enabled && ctx.cursorPosition) {
    // Use legacy tooltip only if new tooltip system doesn't have an active tooltip
    const skipLegacyTooltip = ctx.tooltip?.hasActiveTooltip?.();
    
    const cursor: CursorState = {
      enabled: true,
      x: ctx.cursorPosition.x,
      y: ctx.cursorPosition.y,
      crosshair: ctx.cursorOptions.crosshair ?? false,
      tooltipText: skipLegacyTooltip 
        ? undefined 
        : (ctx.cursorOptions.formatter
            ? ctx.cursorOptions.formatter(
                ctx.pixelToDataX(ctx.cursorPosition.x),
                ctx.pixelToDataY(ctx.cursorPosition.y),
                ""
              )
            : `X: ${ctx.pixelToDataX(ctx.cursorPosition.x).toFixed(3)}\nY: ${ctx.pixelToDataY(ctx.cursorPosition.y).toExponential(2)}`),
    };
    ctx.overlay.drawCursor(plotArea, cursor);
  }

  // Draw new tooltips
  if (ctx.tooltip) {
    ctx.tooltip.render();
  }

  // Statistics Panel
  if (ctx.stats && ctx.showStatistics) {
    ctx.stats.update(ctx.viewBounds);
  }
}
