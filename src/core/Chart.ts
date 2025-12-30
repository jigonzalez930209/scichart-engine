/**
 * Chart - Main SciChart Engine orchestrator
 *
 * Coordinates WebGL rendering, overlay, interactions, and data management.
 * This is the public API for creating and controlling charts.
 */

import type {
  ChartOptions,
  AxisOptions,
  SeriesOptions,
  SeriesUpdateData,
  ZoomOptions,
  CursorOptions,
  ChartEventMap,
  Bounds,
} from "../types";
import { EventEmitter } from "./EventEmitter";
import { Series } from "./Series";
import {
  NativeWebGLRenderer,
  interleaveData,
  parseColor,
  type NativeSeriesRenderData as SeriesRenderData,
} from "../renderer/NativeWebGLRenderer";
import { LinearScale, LogScale, type Scale } from "../scales";
import { DEFAULT_THEME, getThemeByName, type ChartTheme } from "../theme";
import { OverlayRenderer, type CursorState } from "./OverlayRenderer";
import { InteractionManager } from "./InteractionManager";
import { ChartControls } from "./ChartControls";
import { ChartLegend } from "./ChartLegend";

// ============================================
// Layout Constants
// ============================================

const MARGINS = { top: 20, right: 30, bottom: 55, left: 75 };

// ============================================
// Chart Interface
// ============================================

export interface Chart {
  addSeries(options: SeriesOptions): void;
  removeSeries(id: string): void;
  updateSeries(id: string, data: SeriesUpdateData): void;
  getSeries(id: string): Series | undefined;
  getAllSeries(): Series[];
  zoom(options: ZoomOptions): void;
  pan(deltaX: number, deltaY: number): void;
  resetZoom(): void;
  getViewBounds(): Bounds;
  enableCursor(options: CursorOptions): void;
  disableCursor(): void;
  resize(width?: number, height?: number): void;
  render(): void;
  on<K extends keyof ChartEventMap>(
    event: K,
    handler: (data: ChartEventMap[K]) => void
  ): void;
  off<K extends keyof ChartEventMap>(
    event: K,
    handler: (data: ChartEventMap[K]) => void
  ): void;
  destroy(): void;
  exportImage(type?: "png" | "jpeg"): string;
  autoScale(): void;
  setTheme(theme: string | object): void;
}

// ============================================
// Chart Implementation
// ============================================

class ChartImpl implements Chart {
  private container: HTMLDivElement;
  private webglCanvas: HTMLCanvasElement;
  private overlayCanvas: HTMLCanvasElement;
  private overlayCtx: CanvasRenderingContext2D;

  private series: Map<string, Series> = new Map();
  private events = new EventEmitter<ChartEventMap>();
  private viewBounds: Bounds = {
    xMin: -0.5,
    xMax: 0.5,
    yMin: -1e-5,
    yMax: 1e-5,
  };

  private xAxisOptions: AxisOptions;
  private yAxisOptions: AxisOptions;
  private dpr: number;
  private backgroundColor: [number, number, number, number];

  private renderer: NativeWebGLRenderer;
  private overlay: OverlayRenderer;
  private interaction: InteractionManager;
  private xScale: Scale;
  private yScale: Scale;
  private theme: ChartTheme;

  private cursorOptions: CursorOptions | null = null;
  private cursorPosition: { x: number; y: number } | null = null;
  private showLegend: boolean;
  private legend: ChartLegend | null = null;
  private showControls: boolean;
  private controls: ChartControls | null = null;
  private animationFrameId: number | null = null;
  private needsRender = false;
  private isDestroyed = false;
  private selectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;

  constructor(options: ChartOptions) {
    const container = options.container;
    if (!container) throw new Error("[SciChart] Container element is required");
    this.container = container;

    this.dpr = options.devicePixelRatio ?? window.devicePixelRatio;

    // Initialize theme
    this.theme =
      typeof options.theme === "string"
        ? getThemeByName(options.theme)
        : (options.theme as ChartTheme) ?? DEFAULT_THEME;

    const bgColor = parseColor(
      options.background ?? this.theme.backgroundColor
    );
    this.backgroundColor = [bgColor[0], bgColor[1], bgColor[2], bgColor[3]];
    this.showLegend = options.showLegend ?? this.theme.legend.visible;
    this.showControls = options.showControls ?? false;

    this.xAxisOptions = { scale: "linear", auto: true, ...options.xAxis };
    this.yAxisOptions = { scale: "linear", auto: true, ...options.yAxis };
    this.xScale =
      this.xAxisOptions.scale === "log" ? new LogScale() : new LinearScale();
    this.yScale =
      this.yAxisOptions.scale === "log" ? new LogScale() : new LinearScale();

    // Create DOM structure
    this.container.style.position = "relative";
    this.container.style.overflow = "hidden";
    this.container.style.backgroundColor =
      options.background ?? this.theme.backgroundColor;

    this.webglCanvas = this.createCanvas("webgl");
    this.overlayCanvas = this.createCanvas("overlay");

    // Clear container before adding our canvases (especially for React)
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    this.container.appendChild(this.webglCanvas);
    this.container.appendChild(this.overlayCanvas);

    const ctx = this.overlayCanvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    this.overlayCtx = ctx;

    // Initialize subsystems
    this.renderer = new NativeWebGLRenderer(this.webglCanvas);
    this.overlay = new OverlayRenderer(this.overlayCtx, this.theme);
    this.interaction = new InteractionManager(
      this.container,
      {
        onZoom: (b) => this.zoom({ x: [b.xMin, b.xMax], y: [b.yMin, b.yMax] }),
        onPan: (dx, dy) => this.pan(dx, dy),
        onBoxZoom: (rect) => this.handleBoxZoom(rect),
        onCursorMove: (x, y) => {
          this.cursorPosition = { x, y };
          this.requestRender();
        },
        onCursorLeave: () => {
          this.cursorPosition = null;
          this.requestRender();
        },
      },
      () => this.getPlotArea(),
      () => this.viewBounds
    );

    // Setup resize observer
    new ResizeObserver(() => !this.isDestroyed && this.resize()).observe(
      this.container
    );

    // Initialize controls if enabled
    if (this.showControls) {
      this.controls = new ChartControls(this.container, this.theme, {
        onResetZoom: () => this.resetZoom(),
        onSetType: (type) => {
          this.series.forEach((s) => s.setType(type));
          this.requestRender();
        },
        onToggleSmoothing: () => {
          this.series.forEach((s) => {
            const style = s.getStyle();
            s.setStyle({ smoothing: (style.smoothing || 0) === 0 ? 0.5 : 0 });
          });
          this.requestRender();
        },
        onTogglePan: (active: boolean) => {
          this.interaction.setPanMode(active);
        },
        onExport: () => {
          const dataUrl = this.exportImage();
          const link = document.createElement("a");
          link.download = `scichart-export-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        },
        onAutoScale: () => {
          this.autoScale();
          this.requestRender();
          this.events.emit("autoScale", undefined);
        },
      });
    }

    // Initialize legend if enabled
    if (this.showLegend) {
      this.legend = new ChartLegend(
        this.container,
        this.theme,
        options.legendPosition || {},
        {
          onMove: (x, y) => this.events.emit("legendMove", { x, y }),
        }
      );
      this.legend.update(this.getAllSeries());
    }

    this.resize();
    this.startRenderLoop();

    // Safety resize after a short delay to handle cases where the container
    // might not have been fully sized during construction (e.g. in some frameworks)
    setTimeout(() => !this.isDestroyed && this.resize(), 100);

    console.log("[SciChart] Initialized", {
      dpr: this.dpr,
      theme: this.theme.name,
    });
  }

  public setTheme(theme: string | ChartTheme): void {
    if (this.isDestroyed) return;

    this.theme =
      typeof theme === "string"
        ? getThemeByName(theme)
        : (theme as ChartTheme) ?? DEFAULT_THEME;

    const bgColor = parseColor(this.theme.backgroundColor);
    this.backgroundColor = [bgColor[0], bgColor[1], bgColor[2], bgColor[3]];
    this.container.style.backgroundColor = this.theme.backgroundColor;

    this.overlay.setTheme(this.theme);

    if (this.controls) {
      this.controls.updateTheme(this.theme);
    }

    if (this.legend) {
      this.legend.updateTheme(this.theme);
    }

    // Explicitly update WebGL renderer state if needed
    // The background color is passed during each render() call, so it's already covered.

    this.resize();
    this.requestRender();

    // Safety second render to ensure everything is flushed
    setTimeout(() => {
      if (!this.isDestroyed) {
        this.resize();
        this.render();
      }
    }, 50);
  }

  // ----------------------------------------
  // DOM Setup
  // ----------------------------------------

  private createCanvas(type: "webgl" | "overlay"): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.style.cssText =
      type === "webgl"
        ? `position:absolute;top:${MARGINS.top}px;left:${
            MARGINS.left
          }px;width:calc(100% - ${
            MARGINS.left + MARGINS.right
          }px);height:calc(100% - ${MARGINS.top + MARGINS.bottom}px)`
        : `position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none`;
    return c;
  }

  private getPlotArea() {
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(10, rect.width - MARGINS.left - MARGINS.right);
    const height = Math.max(10, rect.height - MARGINS.top - MARGINS.bottom);
    return {
      x: MARGINS.left,
      y: MARGINS.top,
      width,
      height,
    };
  }

  exportImage(type: "png" | "jpeg" = "png"): string {
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = this.overlayCanvas.width;
    finalCanvas.height = this.overlayCanvas.height;
    const ctx = finalCanvas.getContext("2d");
    if (!ctx) return "";

    // 1. Fill background
    const bg = this.backgroundColor;
    ctx.fillStyle = `rgba(${Math.round(bg[0] * 255)}, ${Math.round(
      bg[1] * 255
    )}, ${Math.round(bg[2] * 255)}, ${bg[3]})`;
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // 2. Draw WebGL plot area
    const plotX = MARGINS.left * this.dpr;
    const plotY = MARGINS.top * this.dpr;
    ctx.drawImage(this.webglCanvas, plotX, plotY);

    // 3. Draw Overlay (Axes, Grid, Labels)
    ctx.drawImage(this.overlayCanvas, 0, 0);

    // 4. Draw Legend (if exists and visible)
    if (this.legend && this.showLegend) {
      this.legend.draw(ctx, this.dpr);
    }

    return finalCanvas.toDataURL(`image/${type}`);
  }

  // ----------------------------------------
  // Series Management
  // ----------------------------------------

  addSeries(options: SeriesOptions): void {
    if (this.series.has(options.id)) this.removeSeries(options.id);
    const s = new Series(options);
    this.series.set(options.id, s);
    this.updateSeriesBuffer(s);
    if (this.xAxisOptions.auto || this.yAxisOptions.auto) this.autoScale();
    if (this.legend) this.legend.update(this.getAllSeries());
    this.requestRender();
  }

  removeSeries(id: string): void {
    const s = this.series.get(id);
    if (s) {
      this.renderer.deleteBuffer(id);
      s.destroy();
      this.series.delete(id);
      if (this.legend) this.legend.update(this.getAllSeries());
      this.requestRender();
    }
  }

  updateSeries(id: string, data: SeriesUpdateData): void {
    const s = this.series.get(id);
    if (!s) return;
    s.updateData(data);
    this.updateSeriesBuffer(s);
    if (this.xAxisOptions.auto || this.yAxisOptions.auto) {
      this.autoScale();
    }
    this.requestRender();
  }

  private updateSeriesBuffer(s: Series): void {
    const d = s.getData();
    if (!d || d.x.length === 0) return;
    this.renderer.createBuffer(s.getId(), interleaveData(d.x, d.y));
  }

  getSeries(id: string): Series | undefined {
    return this.series.get(id);
  }
  getAllSeries(): Series[] {
    return Array.from(this.series.values());
  }

  // ----------------------------------------
  // View Management
  // ----------------------------------------

  zoom(options: ZoomOptions): void {
    if (options.x) {
      this.viewBounds.xMin = options.x[0];
      this.viewBounds.xMax = options.x[1];
    }
    if (options.y) {
      this.viewBounds.yMin = options.y[0];
      this.viewBounds.yMax = options.y[1];
    }
    this.events.emit("zoom", {
      x: [this.viewBounds.xMin, this.viewBounds.xMax],
      y: [this.viewBounds.yMin, this.viewBounds.yMax],
    });
    this.requestRender();
  }

  pan(deltaX: number, deltaY: number): void {
    const pa = this.getPlotArea();
    const dx =
      (deltaX / pa.width) * (this.viewBounds.xMax - this.viewBounds.xMin);
    const dy =
      (deltaY / pa.height) * (this.viewBounds.yMax - this.viewBounds.yMin);
    this.viewBounds.xMin -= dx;
    this.viewBounds.xMax -= dx;
    this.viewBounds.yMin += dy;
    this.viewBounds.yMax += dy;
    this.events.emit("pan", { deltaX: dx, deltaY: dy });
    this.requestRender();
  }

  resetZoom(): void {
    this.autoScale();
    this.events.emit("zoom", {
      x: [this.viewBounds.xMin, this.viewBounds.xMax],
      y: [this.viewBounds.yMin, this.viewBounds.yMax],
    });
    this.requestRender();
  }

  getViewBounds(): Bounds {
    return { ...this.viewBounds };
  }

  public autoScale(): void {
    if (this.series.size === 0) return;

    let xMin = Infinity,
      xMax = -Infinity,
      yMin = Infinity,
      yMax = -Infinity;
    let hasValidData = false;

    this.series.forEach((s) => {
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
        yMin = Math.min(yMin, b.yMin);
        yMax = Math.max(yMax, b.yMax);
        hasValidData = true;
      }
    });

    if (!hasValidData) {
      console.warn("[SciChart] No valid data bounds found for autoScale");
      return;
    }

    // Add 5% padding
    let xRange = xMax - xMin;
    let yRange = yMax - yMin;

    // Fallback for zero range (single point or identical points)
    if (xRange <= 0 || !isFinite(xRange)) xRange = Math.abs(xMin) * 0.1 || 1;
    if (yRange <= 0 || !isFinite(yRange)) yRange = Math.abs(yMin) * 0.1 || 1;

    // Ensure we don't have extreme values that could break rendering
    const MAX_VALUE = 1e15;
    const MIN_VALUE = -1e15;

    xMin = Math.max(MIN_VALUE, Math.min(MAX_VALUE, xMin));
    xMax = Math.max(MIN_VALUE, Math.min(MAX_VALUE, xMax));
    yMin = Math.max(MIN_VALUE, Math.min(MAX_VALUE, yMin));
    yMax = Math.max(MIN_VALUE, Math.min(MAX_VALUE, yMax));

    const xPad = Math.min(xRange * 0.05, 1e10);
    const yPad = Math.min(yRange * 0.05, 1e10);

    const newBounds = {
      xMin: Math.max(MIN_VALUE, xMin - xPad),
      xMax: Math.min(MAX_VALUE, xMax + xPad),
      yMin: Math.max(MIN_VALUE, yMin - yPad),
      yMax: Math.min(MAX_VALUE, yMax + yPad),
    };

    if (this.xAxisOptions.auto) {
      this.viewBounds.xMin = newBounds.xMin;
      this.viewBounds.xMax = newBounds.xMax;
    }
    if (this.yAxisOptions.auto) {
      this.viewBounds.yMin = newBounds.yMin;
      this.viewBounds.yMax = newBounds.yMax;
    }

    this.requestRender();
  }

  // ----------------------------------------
  // Cursor
  // ----------------------------------------

  enableCursor(options: CursorOptions): void {
    this.cursorOptions = { enabled: true, ...options };
  }
  disableCursor(): void {
    this.cursorOptions = null;
    this.cursorPosition = null;
  }

  // ----------------------------------------
  // Rendering
  // ----------------------------------------

  resize(): void {
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    this.overlayCanvas.width = rect.width * this.dpr;
    this.overlayCanvas.height = rect.height * this.dpr;

    // Reset transform before scaling to avoid cumulative effects
    this.overlayCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.overlayCtx.scale(this.dpr, this.dpr);

    this.renderer.resize();
    this.events.emit("resize", { width: rect.width, height: rect.height });
    this.requestRender();
  }

  private requestRender(): void {
    this.needsRender = true;
  }

  render(): void {
    if (this.isDestroyed) return;
    const start = performance.now();

    this.xScale.setDomain(this.viewBounds.xMin, this.viewBounds.xMax);
    this.yScale.setDomain(this.viewBounds.yMin, this.viewBounds.yMax);

    // WebGL render
    const seriesData: SeriesRenderData[] = [];
    const plotArea = this.getPlotArea();

    if (this.webglCanvas.width === 0 || this.webglCanvas.height === 0) {
      console.warn("[SciChart] Canvas has zero size, skipping render");
      return;
    }

    // Update scales with current range
    this.xScale.setRange(plotArea.x, plotArea.x + plotArea.width);
    this.yScale.setRange(plotArea.y + plotArea.height, plotArea.y); // Y is inverted in pixels

    this.series.forEach((s) => {
      if (s.needsBufferUpdate) {
        this.updateSeriesBuffer(s);
        s.needsBufferUpdate = false;
      }

      const buf = this.renderer.getBuffer(s.getId());
      if (buf)
        seriesData.push({
          id: s.getId(),
          buffer: buf,
          count: s.getPointCount(),
          style: s.getStyle(),
          visible: s.isVisible(),
          type: s.getType(),
        });
    });

    if (seriesData.length === 0 && this.series.size > 0) {
      console.warn(
        "[SciChart] No series data to render despite having series",
        {
          count: this.series.size,
          rendererAvailable: this.renderer.available,
        }
      );
    }

    this.renderer.render(seriesData, {
      bounds: this.viewBounds,
      backgroundColor: this.backgroundColor,
    });

    // Overlay render
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn(
        "[SciChart] Container has zero size in render, skipping overlay"
      );
      return;
    }

    this.overlay.clear(rect.width, rect.height);
    this.overlay.drawGrid(plotArea, this.xScale, this.yScale);
    this.overlay.drawXAxis(plotArea, this.xScale, this.xAxisOptions.label);
    this.overlay.drawYAxis(plotArea, this.yScale, this.yAxisOptions.label);
    this.overlay.drawPlotBorder(plotArea);

    // Draw Selection Box
    if (this.selectionRect) {
      this.overlay.drawSelectionRect(this.selectionRect);
    }

    // Legend is now handled by ChartLegend component (HTML)

    if (this.cursorOptions?.enabled && this.cursorPosition) {
      const cursor: CursorState = {
        enabled: true,
        x: this.cursorPosition.x,
        y: this.cursorPosition.y,
        crosshair: this.cursorOptions.crosshair ?? false,
        tooltipText: this.cursorOptions.formatter
          ? this.cursorOptions.formatter(
              this.pixelToDataX(this.cursorPosition.x),
              this.pixelToDataY(this.cursorPosition.y),
              ""
            )
          : `X: ${this.pixelToDataX(this.cursorPosition.x).toFixed(
              3
            )}\nY: ${this.pixelToDataY(this.cursorPosition.y).toExponential(
              2
            )}`,
      };
      this.overlay.drawCursor(plotArea, cursor);
    }

    const frameTime = performance.now() - start;
    this.events.emit("render", {
      fps: frameTime > 0 ? 1000 / frameTime : 999,
      frameTime,
    });
  }

  private pixelToDataX(px: number): number {
    const pa = this.getPlotArea();
    return (
      this.viewBounds.xMin +
      ((px - pa.x) / pa.width) * (this.viewBounds.xMax - this.viewBounds.xMin)
    );
  }

  private pixelToDataY(py: number): number {
    const pa = this.getPlotArea();
    return (
      this.viewBounds.yMin +
      (1 - (py - pa.y) / pa.height) *
        (this.viewBounds.yMax - this.viewBounds.yMin)
    );
  }

  private startRenderLoop(): void {
    const loop = () => {
      if (this.isDestroyed) return;
      if (this.needsRender) {
        this.render();
        this.needsRender = false;
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  // ----------------------------------------
  // Events & Cleanup
  // ----------------------------------------

  on<K extends keyof ChartEventMap>(
    e: K,
    h: (d: ChartEventMap[K]) => void
  ): void {
    this.events.on(e, h);
  }
  off<K extends keyof ChartEventMap>(
    e: K,
    h: (d: ChartEventMap[K]) => void
  ): void {
    this.events.off(e, h);
  }

  destroy(): void {
    this.isDestroyed = true;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.interaction.destroy();
    this.series.forEach((s) => {
      this.renderer.deleteBuffer(s.getId());
      s.destroy();
    });
    this.series.clear();
    this.renderer.destroy();
    if (this.controls) this.controls.destroy();
    if (this.legend) this.legend.destroy();

    // Remove our canvases and UI elements, but NOT the container itself
    // as it belongs to the caller (e.g. React/Vue ref)
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    console.log("[SciChart] Destroyed");
  }

  private handleBoxZoom(
    rect: { x: number; y: number; width: number; height: number } | null
  ): void {
    if (rect === null) {
      if (
        this.selectionRect &&
        this.selectionRect.width > 5 &&
        this.selectionRect.height > 5
      ) {
        const plotArea = this.getPlotArea();
        const bounds = this.viewBounds;

        const xMinNorm = (this.selectionRect.x - plotArea.x) / plotArea.width;
        const xMaxNorm =
          (this.selectionRect.x + this.selectionRect.width - plotArea.x) /
          plotArea.width;
        const yMaxNorm =
          1 - (this.selectionRect.y - plotArea.y) / plotArea.height;
        const yMinNorm =
          1 -
          (this.selectionRect.y + this.selectionRect.height - plotArea.y) /
            plotArea.height;

        const newXMin = bounds.xMin + xMinNorm * (bounds.xMax - bounds.xMin);
        const newXMax = bounds.xMin + xMaxNorm * (bounds.xMax - bounds.xMin);
        const newYMin = bounds.yMin + yMinNorm * (bounds.yMax - bounds.yMin);
        const newYMax = bounds.yMin + yMaxNorm * (bounds.yMax - bounds.yMin);

        this.zoom({
          x: [newXMin, newXMax],
          y: [newYMin, newYMax],
        });
      }
      this.selectionRect = null;
    } else {
      this.selectionRect = rect;
    }
    this.requestRender();
  }
}

// ============================================
// Factory
// ============================================

export function createChart(options: ChartOptions): Chart {
  return new ChartImpl(options);
}
export { ChartOptions };
