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
  interleaveStepData,
  parseColor,
  type NativeSeriesRenderData as SeriesRenderData,
} from "../renderer/NativeWebGLRenderer";
import { LinearScale, LogScale, type Scale } from "../scales";
import { DEFAULT_THEME, getThemeByName, type ChartTheme } from "../theme";
import { OverlayRenderer, type CursorState } from "./OverlayRenderer";
import { InteractionManager, type AxisLayout } from "./InteractionManager";
import { ChartControls } from "./ChartControls";
import { ChartLegend } from "./ChartLegend";
import { AnnotationManager, type Annotation } from "./annotations";

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
  appendData(id: string, x: number[] | Float32Array, y: number[] | Float32Array): void;
  setAutoScroll(enabled: boolean): void;
  setMaxPoints(id: string, maxPoints: number): void;
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
  // Annotation methods
  addAnnotation(annotation: Annotation): string;
  removeAnnotation(id: string): boolean;
  updateAnnotation(id: string, updates: Partial<Annotation>): void;
  getAnnotation(id: string): Annotation | undefined;
  getAnnotations(): Annotation[];
  clearAnnotations(): void;
  // Export methods
  exportCSV(options?: ExportOptions): string;
  exportJSON(options?: ExportOptions): string;
}

/** Options for data export */
export interface ExportOptions {
  /** Series IDs to export (default: all) */
  seriesIds?: string[];
  /** Include headers in CSV (default: true) */
  includeHeaders?: boolean;
  /** Decimal precision (default: 6) */
  precision?: number;
  /** CSV delimiter (default: ',') */
  delimiter?: string;
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
  // Map of Y-axis ID -> Options
  private yAxisOptionsMap: Map<string, AxisOptions> = new Map();
  private primaryYAxisId: string = 'default';

  private dpr: number;
  private backgroundColor: [number, number, number, number];

  private renderer: NativeWebGLRenderer;
  private overlay: OverlayRenderer;
  private interaction: InteractionManager;
  private xScale: Scale;
  // Map of Y-axis ID -> Scale
  private yScales: Map<string, Scale> = new Map();
  // Getter for backward compatibility (returns primary scale)
  private get yScale(): Scale {
    return (this.yScales.get(this.primaryYAxisId) || this.yScales.values().next().value) as Scale;
  }
  // Getter for backward compatibility
  private get yAxisOptions(): AxisOptions {
    return (this.yAxisOptionsMap.get(this.primaryYAxisId) || this.yAxisOptionsMap.values().next().value) as AxisOptions;
  }
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
  private autoScroll = false;
  private selectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  private annotationManager: AnnotationManager = new AnnotationManager();

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
    this.autoScroll = options.autoScroll ?? false;

    this.xAxisOptions = { scale: "linear", auto: true, ...options.xAxis };
    this.xScale = this.xAxisOptions.scale === "log" ? new LogScale() : new LinearScale();

    // Process Y Axes
    const providedYAxes = options.yAxis 
      ? (Array.isArray(options.yAxis) ? options.yAxis : [options.yAxis])
      : [{}]; // Default empty axis if none provided

    providedYAxes.forEach((axisOpt, index) => {
      const isFirst = index === 0;
      // Default ID is 'default' for the first axis, or 'y1', 'y2' etc. unless specified
      const defaultId = isFirst ? 'default' : `y${index}`;
      const id = axisOpt.id || defaultId;
      
      if (isFirst) {
        this.primaryYAxisId = id;
      }

      // Default position: left for first, right for others
      const position = axisOpt.position || (isFirst ? 'left' : 'right');

      const fullOptions: AxisOptions = { 
        scale: "linear", 
        auto: true, 
        position,
        ...axisOpt, 
        id 
      };

      this.yAxisOptionsMap.set(id, fullOptions);
      this.yScales.set(id, fullOptions.scale === "log" ? new LogScale() : new LinearScale());
    });

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
    this.renderer.setDPR(this.dpr);
    this.overlay = new OverlayRenderer(this.overlayCtx, this.theme);
    this.interaction = new InteractionManager(
      this.container,
      {
        onZoom: (b, axisId) => this.zoom({ 
            x: [b.xMin, b.xMax], 
            y: [b.yMin, b.yMax],
            axisId 
        }),
        onPan: (dx, dy, axisId) => this.pan(dx, dy, axisId),
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
      (axisId) => this.getInteractedBounds(axisId),
      () => this.getAxesLayout()
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
        onToggleLegend: (visible: boolean) => {
          this.showLegend = visible;
          if (this.legend) {
             this.legend.setVisible(visible);
          }
        }
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
    c.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;${
      type === "overlay" ? "pointer-events:none" : ""
    }`;
    return c;
  }

  private getPlotArea() {
    const rect = this.container.getBoundingClientRect();
    
    // Count axes on each side to calculate dynamic margins
    let leftCount = 0;
    let rightCount = 0;
    this.yAxisOptionsMap.forEach(opts => {
      if (opts.position === 'right') rightCount++;
      else leftCount++;
    });

    // Consistent 65px per axis including labels and titles
    const leftMargin = Math.max(75, leftCount * 65);
    const rightMargin = Math.max(15, rightCount * 65);

    const width = Math.max(10, rect.width - leftMargin - rightMargin);
    const height = Math.max(10, rect.height - MARGINS.top - MARGINS.bottom);
    
    return {
      x: leftMargin,
      y: MARGINS.top,
      width,
      height,
    };
  }

  private getAxesLayout(): AxisLayout[] {
    const leftAxes: string[] = [];
    const rightAxes: string[] = [];
    this.yAxisOptionsMap.forEach((opts, id) => {
      if (opts.position === 'right') rightAxes.push(id);
      else leftAxes.push(id);
    });

    const layout: AxisLayout[] = [];
    leftAxes.forEach((id, index) => {
      layout.push({ id, position: 'left', offset: index * 65 });
    });
    rightAxes.forEach((id, index) => {
      layout.push({ id, position: 'right', offset: index * 65 });
    });
    return layout;
  }

  private getInteractedBounds(axisId?: string): Bounds {
    if (axisId) {
      const scale = this.yScales.get(axisId);
      if (scale) {
        return {
          ...this.viewBounds,
          yMin: scale.domain[0],
          yMax: scale.domain[1]
        };
      }
    }
    return this.viewBounds;
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
    ctx.drawImage(this.webglCanvas, 0, 0); // WebGL is now full-size too

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
    
    const seriesType = s.getType();
    const seriesId = s.getId();
    const lastAppend = s.getLastAppendCount();
    const totalPoints = d.x.length;

    // Try partial update for main buffer if it's not a step chart
    // (Step charts are harder to partially update because of the extra segments)
    if (lastAppend > 0 && lastAppend < totalPoints && seriesType !== 'step' && seriesType !== 'step+scatter') {
       const newX = d.x.slice(totalPoints - lastAppend);
       const newY = d.y.slice(totalPoints - lastAppend);
       const interleaved = interleaveData(newX, newY);
       
       // 2 floats per point, 4 bytes per float
       const offsetInBytes = (totalPoints - lastAppend) * 2 * 4;
       
       const success = this.renderer.updateBuffer(seriesId, interleaved, offsetInBytes);
       if (success) {
          s.resetLastAppendCount();
          return;
       }
    }

    // Fallback: Create main buffer (original points)
    this.renderer.createBuffer(seriesId, interleaveData(d.x, d.y));
    
    // Create step buffer for step chart types
    if (seriesType === 'step' || seriesType === 'step+scatter') {
      const stepMode = s.getStyle().stepMode ?? 'after';
      const stepData = interleaveStepData(d.x, d.y, stepMode);
      this.renderer.createBuffer(`${seriesId}_step`, stepData);
    }

    s.resetLastAppendCount();
  }

  appendData(id: string, x: number[] | Float32Array, y: number[] | Float32Array): void {
    const s = this.series.get(id);
    if (!s) return;

    const oldBounds = s.getBounds();
    const oldMaxX = oldBounds ? oldBounds.xMax : -Infinity;

    s.updateData({ x: x as any, y: y as any, append: true });
    this.updateSeriesBuffer(s);

    if (this.autoScroll) {
      const newBounds = s.getBounds();
      if (newBounds) {
        const xRange = this.viewBounds.xMax - this.viewBounds.xMin;
        // If we were near the end, follow the data
        if (oldMaxX >= this.viewBounds.xMax - xRange * 0.05 || !oldBounds) {
          this.viewBounds.xMax = newBounds.xMax;
          this.viewBounds.xMin = this.viewBounds.xMax - xRange;
        }
      }
    }

    if (this.xAxisOptions.auto || this.yAxisOptions.auto) {
      this.autoScale();
    }
    this.requestRender();
  }

  setAutoScroll(enabled: boolean): void {
    this.autoScroll = enabled;
  }

  setMaxPoints(id: string, maxPoints: number): void {
    const s = this.series.get(id);
    if (s) {
      (s as any).maxPoints = maxPoints; // Access private for now or add setter
      this.updateSeriesBuffer(s);
    }
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
      if (options.axisId) {
        // Zoom targeted axis only
        const scale = this.yScales.get(options.axisId);
        if (scale) {
          scale.setDomain(options.y[0], options.y[1]);
          // If it happens to be the primary axis, sync viewBounds
          if (options.axisId === this.primaryYAxisId) {
            this.viewBounds.yMin = options.y[0];
            this.viewBounds.yMax = options.y[1];
          }
        }
      } else {
        // Global zoom: apply to all axes proportionally
        const oldRange = this.viewBounds.yMax - this.viewBounds.yMin;
        const newRange = options.y[1] - options.y[0];
        const factor = oldRange > 0 ? newRange / oldRange : 1;
        
        // Calculate relative shift based on primary axis change
        const offsetPct = oldRange > 0 ? (options.y[0] - this.viewBounds.yMin) / oldRange : 0;

        this.yScales.forEach((scale, id) => {
          if (id === this.primaryYAxisId) return; // Will sync with viewBounds later
          const sRange = scale.domain[1] - scale.domain[0];
          const sNewMin = scale.domain[0] + offsetPct * sRange;
          const sNewMax = sNewMin + factor * sRange;
          scale.setDomain(sNewMin, sNewMax);
        });

        this.viewBounds.yMin = options.y[0];
        this.viewBounds.yMax = options.y[1];
      }
    }
    
    this.events.emit("zoom", {
      x: [this.viewBounds.xMin, this.viewBounds.xMax],
      y: [this.viewBounds.yMin, this.viewBounds.yMax],
    });
    this.requestRender();
  }

  pan(deltaX: number, deltaY: number, axisId?: string): void {
    const pa = this.getPlotArea();
    const dx =
      (deltaX / pa.width) * (this.viewBounds.xMax - this.viewBounds.xMin);
    
    // Apply pan to X (always global)
    this.viewBounds.xMin -= dx;
    this.viewBounds.xMax -= dx;

    if (axisId) {
      // Pan targeted axis only
      const scale = this.yScales.get(axisId);
      if (scale) {
        const range = scale.domain[1] - scale.domain[0];
        const moveY = (deltaY / pa.height) * range;
        scale.setDomain(scale.domain[0] + moveY, scale.domain[1] + moveY);
        
        // Sync primary viewBounds if applicable
        if (axisId === this.primaryYAxisId) {
          this.viewBounds.yMin = scale.domain[0];
          this.viewBounds.yMax = scale.domain[1];
        }
      }
    } else {
      // Global pan: apply to all Y axes proportionally
      this.yScales.forEach((scale, id) => {
        const range = scale.domain[1] - scale.domain[0];
        const moveY = (deltaY / pa.height) * range;
        scale.setDomain(scale.domain[0] + moveY, scale.domain[1] + moveY);
        
        if (id === this.primaryYAxisId) {
          this.viewBounds.yMin = scale.domain[0];
          this.viewBounds.yMax = scale.domain[1];
        }
      });
    }

    const dy = (deltaY / pa.height) * (this.viewBounds.yMax - this.viewBounds.yMin);
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

    let xMin = Infinity;
    let xMax = -Infinity;
    
    // Track bounds per Y-axis
    const yAxisBounds = new Map<string, { min: number, max: number }>();
    this.yScales.forEach((_, id) => {
      yAxisBounds.set(id, { min: Infinity, max: -Infinity });
    });

    let hasValidData = false;

    this.series.forEach((s) => {
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
        const axisId = s.getYAxisId() || this.primaryYAxisId;
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
    if (this.xAxisOptions.auto) {
       let xRange = xMax - xMin;
       if (xRange <= 0 || !isFinite(xRange)) xRange = Math.abs(xMin) * 0.1 || 1;
       const xPad = Math.min(xRange * 0.05, 1e10);
       
       this.viewBounds.xMin = Math.max(MIN_VALUE, xMin - xPad);
       this.viewBounds.xMax = Math.min(MAX_VALUE, xMax + xPad);
    }

    // Apply Y bounds (per axis)
    yAxisBounds.forEach((bounds, id) => {
        if (bounds.min === Infinity) return; // No data for this axis
        
        const opts = this.yAxisOptionsMap.get(id);
        const scale = this.yScales.get(id);
        
        if (opts && opts.auto && scale) {
            let yRange = bounds.max - bounds.min;
            if (yRange <= 0 || !isFinite(yRange)) yRange = Math.abs(bounds.min) * 0.1 || 1;
            const yPad = Math.min(yRange * 0.05, 1e10);
            
            const newMin = Math.max(MIN_VALUE, bounds.min - yPad);
            const newMax = Math.min(MAX_VALUE, bounds.max + yPad);
            
            scale.setDomain(newMin, newMax);
            
            // Sync primary axis to viewBounds for backward compatibility
            if (id === this.primaryYAxisId) {
                this.viewBounds.yMin = newMin;
                this.viewBounds.yMax = newMax;
            }
        }
    });

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
  // Annotations
  // ----------------------------------------

  addAnnotation(annotation: Annotation): string {
    const id = this.annotationManager.add(annotation);
    this.requestRender();
    return id;
  }

  removeAnnotation(id: string): boolean {
    const result = this.annotationManager.remove(id);
    if (result) this.requestRender();
    return result;
  }

  updateAnnotation(id: string, updates: Partial<Annotation>): void {
    this.annotationManager.update(id, updates);
    this.requestRender();
  }

  getAnnotation(id: string): Annotation | undefined {
    return this.annotationManager.get(id);
  }

  getAnnotations(): Annotation[] {
    return this.annotationManager.getAll();
  }

  clearAnnotations(): void {
    this.annotationManager.clear();
    this.requestRender();
  }

  // ----------------------------------------
  // Export Methods
  // ----------------------------------------

  exportCSV(options?: ExportOptions): string {
    const {
      seriesIds,
      includeHeaders = true,
      precision = 6,
      delimiter = ','
    } = options ?? {};

    const seriesToExport = seriesIds
      ? this.getAllSeries().filter(s => seriesIds.includes(s.getId()))
      : this.getAllSeries();

    if (seriesToExport.length === 0) return '';

    const lines: string[] = [];

    // Generate headers
    if (includeHeaders) {
      const headers: string[] = [];
      seriesToExport.forEach(s => {
        headers.push(`${s.getId()}_x`, `${s.getId()}_y`);
      });
      lines.push(headers.join(delimiter));
    }

    // Find max length
    const maxLength = Math.max(...seriesToExport.map(s => s.getPointCount()));

    // Generate data rows
    for (let i = 0; i < maxLength; i++) {
      const row: string[] = [];
      seriesToExport.forEach(s => {
        const data = s.getData();
        if (data && i < data.x.length) {
          row.push(data.x[i].toFixed(precision), data.y[i].toFixed(precision));
        } else {
          row.push('', '');
        }
      });
      lines.push(row.join(delimiter));
    }

    return lines.join('\n');
  }

  exportJSON(options?: ExportOptions): string {
    const { seriesIds, precision = 6 } = options ?? {};

    const seriesToExport = seriesIds
      ? this.getAllSeries().filter(s => seriesIds.includes(s.getId()))
      : this.getAllSeries();

    const result: Record<string, { 
      id: string;
      type: string;
      style: object;
      data: { x: number[]; y: number[] };
      pointCount: number;
    }> = {};

    seriesToExport.forEach(s => {
      const data = s.getData();
      result[s.getId()] = {
        id: s.getId(),
        type: s.getType(),
        style: s.getStyle(),
        data: {
          x: data ? Array.from(data.x).map(v => parseFloat(v.toFixed(precision))) : [],
          y: data ? Array.from(data.y).map(v => parseFloat(v.toFixed(precision))) : [],
        },
        pointCount: s.getPointCount()
      };
    });

    return JSON.stringify({
      exportDate: new Date().toISOString(),
      chartBounds: this.viewBounds,
      series: result
    }, null, 2);
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

    // Prepare data for rendering

    // WebGL render
    const seriesData: SeriesRenderData[] = [];
    const plotArea = this.getPlotArea();

    if (this.webglCanvas.width === 0 || this.webglCanvas.height === 0) {
      console.warn("[SciChart] Canvas has zero size, skipping render");
      return;
    }

    // Update all scales with current plot area range and domain
    this.xScale.setRange(plotArea.x, plotArea.x + plotArea.width);
    this.xScale.setDomain(this.viewBounds.xMin, this.viewBounds.xMax);

    this.yScales.forEach((scale, id) => {
      scale.setRange(plotArea.y + plotArea.height, plotArea.y);
      if (id === this.primaryYAxisId) {
        scale.setDomain(this.viewBounds.yMin, this.viewBounds.yMax);
      }
    });

    this.series.forEach((s) => {
      if (s.needsBufferUpdate) {
        this.updateSeriesBuffer(s);
        s.needsBufferUpdate = false;
      }

      const buf = this.renderer.getBuffer(s.getId());
      if (buf) {
        const seriesType = s.getType();
        
        // Determine Y-bounds for this series
        const axisId = s.getYAxisId() || this.primaryYAxisId;
        const scale = this.yScales.get(axisId);
        let yBounds: { min: number; max: number } | undefined;
        
        // If it's the primary axis, we can leave it undefined to use global bounds,
        // OR we can be explicit. explicit is better given we might have different ranges.
        if (scale) {
           yBounds = { min: scale.domain[0], max: scale.domain[1] };
        }

        const renderData: SeriesRenderData = {
          id: s.getId(),
          buffer: buf,
          count: s.getPointCount(),
          style: s.getStyle(),
          visible: s.isVisible(),
          type: seriesType,
          yBounds,
        };
        
        // Add step buffer for step types
        if (seriesType === 'step' || seriesType === 'step+scatter') {
          const stepBuf = this.renderer.getBuffer(`${s.getId()}_step`);
          if (stepBuf) {
            renderData.stepBuffer = stepBuf;
            // Calculate step count based on mode
            const stepMode = s.getStyle().stepMode ?? 'after';
            const pointCount = s.getPointCount();
            if (stepMode === 'center') {
              // Center mode: each segment has 3 vertices, plus first point = 1 + (n-1)*3
              renderData.stepCount = 1 + (pointCount - 1) * 3;
            } else {
              // Before/After mode: each segment has 2 vertices, plus first point
              renderData.stepCount = pointCount * 2 - 1;
            }
          }
        }
        
        seriesData.push(renderData);
      }
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
      plotArea: plotArea,
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

    // Group axes by position
    const leftAxes: string[] = [];
    const rightAxes: string[] = [];
    
    this.yAxisOptionsMap.forEach((opts, id) => {
        if(opts.position === 'right') rightAxes.push(id);
        else leftAxes.push(id);
    });

    // Draw Left Axes (stacked outwards)
    leftAxes.forEach((id, index) => {
        const scale = this.yScales.get(id);
        const opts = this.yAxisOptionsMap.get(id);
        if(scale && opts) {
             const offset = index * 65; 
             this.overlay.drawYAxis(plotArea, scale, opts.label, 'left', offset);
        }
    });

    // Draw Right Axes (stacked outwards)
    rightAxes.forEach((id, index) => {
        const scale = this.yScales.get(id);
        const opts = this.yAxisOptionsMap.get(id);
        if(scale && opts) {
             const offset = index * 65; 
             this.overlay.drawYAxis(plotArea, scale, opts.label, 'right', offset);
        }
    });

    this.overlay.drawPlotBorder(plotArea);

    // Draw Error Bars for all series with error data
    this.series.forEach((s) => {
      if (s.isVisible() && s.hasErrorData()) {
        const axisId = s.getYAxisId() || this.primaryYAxisId;
        const scale = this.yScales.get(axisId);
        // Fallback to primary scale if specific scale not found (shouldn't happen)
        const yScale = scale || this.yScale; 
        
        this.overlay.drawErrorBars(plotArea, s, this.xScale, yScale);
      }
    });

    // Draw Selection Box
    if (this.selectionRect) {
      this.overlay.drawSelectionRect(this.selectionRect);
    }

    // Draw Annotations
    if (this.annotationManager.count > 0) {
      this.annotationManager.render(this.overlayCtx, plotArea, this.viewBounds);
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
