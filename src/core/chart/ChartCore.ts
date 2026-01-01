/**
 * ChartCore - Main Chart Implementation
 *
 * The core chart class that coordinates rendering, interactions,
 * and data management using the extracted utility modules.
 */

import type {
  ChartOptions,
  AxisOptions,
  SeriesOptions,
  HeatmapOptions,
  SeriesUpdateData,
  ZoomOptions,
  CursorOptions,
  ChartEventMap,
  Bounds,
} from "../../types";
import * as analysis from "../../analysis";
import type { FitType, FitOptions } from "../../analysis";
import { EventEmitter } from "../EventEmitter";
import { Series } from "../Series";
import {
  NativeWebGLRenderer,
  parseColor,
} from "../../renderer/NativeWebGLRenderer";
import type { Scale } from "../../scales";
import { getThemeByName, type ChartTheme } from "../../theme";
import { OverlayRenderer } from "../OverlayRenderer";
import { InteractionManager } from "../InteractionManager";
import { ChartControls } from "../ChartControls";
import { ChartLegend } from "../ChartLegend";
import { ChartStatistics } from "../ChartStatistics";
import { AnnotationManager, type Annotation } from "../annotations";

import type { Chart, ExportOptions } from "./types";
import { exportToCSV, exportToJSON, exportToImage } from "./ChartExporter";
import {
  applyZoom,
  applyPan,
  type NavigationContext,
} from "./ChartNavigation";
import { autoScaleAll, handleBoxZoom } from "./ChartScaling";
import { prepareSeriesData, renderOverlay } from "./ChartRenderer";
import {
  addSeries as addSeriesImpl,
  removeSeries as removeSeriesImpl,
  updateSeries as updateSeriesImpl,
  updateSeriesBuffer,
  appendData as appendDataImpl,
  setMaxPoints as setMaxPointsImpl,
  addFitLine as addFitLineImpl,
} from "./ChartSeries";
import {
  initializeChart as setupChart,
  getPlotArea as calculatePlotArea,
  getAxesLayout,
  resizeCanvases,
  pixelToDataX as pxToDataX,
  pixelToDataY as pxToDataY,
} from "./ChartSetup";
import { PluginManagerImpl } from "./plugins/PluginManager";
import { initControls as createControls, initLegend as createLegend } from "./ChartUI";

// ============================================
// Chart Implementation
// ============================================

export class ChartImpl implements Chart {
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
  private yAxisOptionsMap: Map<string, AxisOptions>;
  private primaryYAxisId: string;
  private dpr: number;
  private backgroundColor: [number, number, number, number];
  private renderer: NativeWebGLRenderer;
  private overlay: OverlayRenderer;
  private interaction: InteractionManager;
  private xScale: Scale;
  private yScales: Map<string, Scale>;
  private get yScale(): Scale {
    return (this.yScales.get(this.primaryYAxisId) ||
      this.yScales.values().next().value) as Scale;
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
  private showStatistics = false;
  private stats: ChartStatistics | null = null;
  private selectionRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  private annotationManager: AnnotationManager = new AnnotationManager();
  private pluginManager: PluginManagerImpl;
  private initialOptions: ChartOptions;
  public readonly analysis = analysis;

  constructor(options: ChartOptions) {
    this.initialOptions = options;
    this.container = options.container;
    const setup = setupChart(this.container, options);

    const requestedRenderer = options.renderer ?? "webgl";
    if (requestedRenderer === "webgpu") {
      const isSupported =
        typeof (globalThis as any).navigator !== "undefined" &&
        typeof (globalThis as any).navigator.gpu !== "undefined";
      console.warn(
        `[SciChart] 'renderer: "webgpu"' requested but WebGPU renderer is experimental and not yet implemented. ` +
          `Falling back to WebGL. WebGPU supported: ${isSupported}`
      );
    }

    this.theme = setup.theme;
    this.backgroundColor = setup.backgroundColor;
    this.showLegend = setup.showLegend;
    this.showControls = setup.showControls;
    this.autoScroll = setup.autoScroll;
    this.showStatistics = setup.showStatistics;
    this.dpr = setup.dpr;
    this.xAxisOptions = setup.xAxisOptions;
    this.xScale = setup.xScale;
    this.yAxisOptionsMap = setup.yAxisOptionsMap;
    this.yScales = setup.yScales;
    this.primaryYAxisId = setup.primaryYAxisId;
    this.webglCanvas = setup.webglCanvas;
    this.overlayCanvas = setup.overlayCanvas;
    this.overlayCtx = setup.overlayCtx;

    this.renderer = new NativeWebGLRenderer(this.webglCanvas);
    this.renderer.setDPR(this.dpr);
    this.overlay = new OverlayRenderer(this.overlayCtx, this.theme);
    this.pluginManager = new PluginManagerImpl(this);
    this.interaction = new InteractionManager(
      this.container,
      {
        onZoom: (b, axisId) =>
          this.zoom({ x: [b.xMin, b.xMax], y: [b.yMin, b.yMax], axisId }),
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
      () => getAxesLayout(this.yAxisOptionsMap as any)
    );

    new ResizeObserver(() => !this.isDestroyed && this.resize()).observe(
      this.container
    );
    this.initControls();
    this.initLegend(options);
    if (this.showStatistics) {
      this.stats = new ChartStatistics(this.container, this.theme, this.series);
    }

    this.resize();
    this.startRenderLoop();
    setTimeout(() => !this.isDestroyed && this.resize(), 100);
    console.log("[SciChart] Initialized", {
      dpr: this.dpr,
      theme: this.theme.name,
    });
  }

  private initControls(): void {
    this.controls = createControls({
      container: this.container,
      theme: this.theme,
      showControls: this.showControls,
      showLegend: this.showLegend,
      series: this.series,
      autoScale: () => this.autoScale(),
      resetZoom: () => this.resetZoom(),
      requestRender: () => this.requestRender(),
      exportImage: () => this.exportImage(),
      setPanMode: (active) => this.interaction.setPanMode(active),
      onLegendMove: (x: number, y: number) => this.events.emit("legendMove", { x, y }),
      toggleLegend: () => this.toggleLegend(),
    });
  }

  private toggleLegend(): void {
    this.showLegend = !this.showLegend;
    if (this.legend) {
      this.legend.setVisible(this.showLegend);
      this.legend.update(this.getAllSeries());
    } else if (this.showLegend) {
      // Re-initialize if it didn't exist
      this.initLegend(this.initialOptions); 
    }
    this.requestRender();
  }

  private initLegend(options: ChartOptions): void {
    this.legend = createLegend({
      container: this.container,
      theme: this.theme,
      showControls: this.showControls,
      showLegend: this.showLegend,
      series: this.series,
      autoScale: () => this.autoScale(),
      resetZoom: () => this.resetZoom(),
      requestRender: () => this.requestRender(),
      exportImage: () => this.exportImage(),
      setPanMode: (active) => this.interaction.setPanMode(active),
      onLegendMove: (x: number, y: number) => this.events.emit("legendMove", { x, y }),
      toggleLegend: () => this.toggleLegend(),
    }, options);
  }

  setTheme(theme: string | ChartTheme): void {
    this.theme = typeof theme === "string" ? getThemeByName(theme) : theme;
    const bgColor = parseColor(this.theme.backgroundColor);
    this.backgroundColor = [bgColor[0], bgColor[1], bgColor[2], bgColor[3]];
    this.container.style.backgroundColor = this.theme.backgroundColor;
    
    this.overlay.setTheme(this.theme);
    if (this.controls) this.controls.updateTheme(this.theme);
    if (this.legend) this.legend.updateTheme(this.theme);
    if (this.stats) this.stats.updateTheme(this.theme);
    
    this.requestRender();
  }

  getPlotArea() {
    return calculatePlotArea(this.container, this.yAxisOptionsMap as any);
  }
  private getInteractedBounds(axisId?: string): Bounds {
    if (axisId) {
      const scale = this.yScales.get(axisId);
      if (scale)
        return {
          ...this.viewBounds,
          yMin: scale.domain[0],
          yMax: scale.domain[1],
        };
    }
    return this.viewBounds;
  }

  exportImage(type: "png" | "jpeg" = "png"): string {
    return exportToImage(
      this.webglCanvas,
      this.overlayCanvas,
      this.backgroundColor,
      this.legend,
      this.showLegend,
      this.dpr,
      type
    );
  }

  // Series Management (delegates to ChartSeries)
  private getSeriesContext() {
    return {
      series: this.series,
      renderer: this.renderer,
      viewBounds: this.viewBounds,
      autoScale: () => this.autoScale(),
      requestRender: () => this.requestRender(),
      addAnnotation: (a: Annotation) => this.addAnnotation(a),
      xAxisOptions: this.xAxisOptions,
      yAxisOptionsMap: this.yAxisOptionsMap,
      autoScrollEnabled: this.autoScroll,
      addSeries: (o: SeriesOptions | HeatmapOptions) => this.addSeries(o),
      updateLegend: () => {
        if (this.legend) this.legend.update(this.getAllSeries());
      },
    };
  }

  addSeries(options: SeriesOptions | HeatmapOptions): void {
    addSeriesImpl(this.getSeriesContext() as any, options as any);
    const series = this.series.get((options as any).id);
    if (series) this.pluginManager.notify('onSeriesAdded', series);
  }
  addBar(options: Omit<SeriesOptions, "type">): void {
    this.addSeries({ ...options, type: "bar" } as SeriesOptions);
  }
  addHeatmap(options: HeatmapOptions): void {
    this.addSeries({ ...options, type: "heatmap" } as HeatmapOptions);
  }
  removeSeries(id: string): void {
    removeSeriesImpl(this.getSeriesContext(), id);
  }
  updateSeries(id: string, data: SeriesUpdateData): void {
    updateSeriesImpl(this.getSeriesContext(), id, data);
  }
  appendData(
    id: string,
    x: number[] | Float32Array,
    y: number[] | Float32Array
  ): void {
    appendDataImpl(this.getSeriesContext(), id, x, y);
  }
  setAutoScroll(enabled: boolean): void {
    this.autoScroll = enabled;
  }
  setMaxPoints(id: string, maxPoints: number): void {
    setMaxPointsImpl(this.getSeriesContext(), id, maxPoints);
  }
  addFitLine(
    seriesId: string,
    type: FitType,
    options: FitOptions = {}
  ): string {
    return addFitLineImpl(this.getSeriesContext(), seriesId, type, options);
  }
  getSeries(id: string): Series | undefined {
    return this.series.get(id);
  }
  getAllSeries(): Series[] {
    return Array.from(this.series.values());
  }

  // Navigation (delegates to ChartNavigation)
  private getNavContext(): NavigationContext {
    return {
      viewBounds: this.viewBounds,
      yScales: this.yScales,
      yAxisOptionsMap: this.yAxisOptionsMap,
      xAxisOptions: this.xAxisOptions,
      primaryYAxisId: this.primaryYAxisId,
      getPlotArea: () => this.getPlotArea(),
      events: this.events,
      requestRender: () => this.requestRender(),
      series: this.series as any,
    };
  }

  zoom(options: ZoomOptions): void {
    applyZoom(this.getNavContext(), options);
  }
  pan(deltaX: number, deltaY: number, axisId?: string): void {
    applyPan(this.getNavContext(), deltaX, deltaY, axisId);
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
  autoScale(): void {
    autoScaleAll(this.getNavContext());
  }
  private handleBoxZoom(
    rect: { x: number; y: number; width: number; height: number } | null
  ): void {
    this.selectionRect = handleBoxZoom(
      this.getNavContext(),
      rect,
      this.selectionRect,
      (o: any) => this.zoom(o)
    );
    this.requestRender();
  }

  // Cursor
  enableCursor(options: CursorOptions): void {
    this.cursorOptions = { enabled: true, ...options };
  }
  disableCursor(): void {
    this.cursorOptions = null;
    this.cursorPosition = null;
    this.requestRender();
  }

  // Annotations
  addAnnotation(annotation: Annotation): string {
    const id = this.annotationManager.add(annotation);
    this.requestRender();
    return id;
  }
  removeAnnotation(id: string): boolean {
    const result = this.annotationManager.remove(id);
    this.requestRender();
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

  // Export
  exportCSV(options?: ExportOptions): string {
    return exportToCSV(this.getAllSeries(), options);
  }
  exportJSON(options?: ExportOptions): string {
    return exportToJSON(this.getAllSeries(), this.viewBounds, options);
  }

  use(plugin: any): void {
    this.pluginManager.use(plugin);
  }

  // Rendering
  resize(): void {
    if (
      !resizeCanvases(
        this.container,
        this.webglCanvas,
        this.overlayCanvas,
        this.overlayCtx,
        this.dpr
      )
    )
      return;
    this.renderer.resize();
    this.requestRender();
  }

  requestRender(): void {
    this.needsRender = true;
  }

  render(): void {
    if (this.isDestroyed) return;
    const start = performance.now();
    const plotArea = this.getPlotArea();
    if (this.webglCanvas.width === 0 || this.webglCanvas.height === 0) return;

    const ctx = {
      webglCanvas: this.webglCanvas,
      overlayCanvas: this.overlayCanvas,
      overlayCtx: this.overlayCtx,
      container: this.container,
      series: this.series,
      viewBounds: this.viewBounds,
      xScale: this.xScale,
      yScales: this.yScales,
      yAxisOptionsMap: this.yAxisOptionsMap as any,
      xAxisOptions: this.xAxisOptions as any,
      primaryYAxisId: this.primaryYAxisId,
      renderer: this.renderer,
      overlay: this.overlay,
      annotationManager: this.annotationManager,
      backgroundColor: this.backgroundColor,
      cursorOptions: this.cursorOptions,
      cursorPosition: this.cursorPosition,
      selectionRect: this.selectionRect,
      stats: this.stats,
      showStatistics: this.showStatistics,
      events: this.events,
      updateSeriesBuffer: (s: Series) =>
        updateSeriesBuffer(this.getSeriesContext(), s),
      getPlotArea: () => plotArea,
      pixelToDataX: (px: number) => this.pixelToDataX(px),
      pixelToDataY: (py: number) => this.pixelToDataY(py),
    };

    const seriesData = prepareSeriesData(ctx, plotArea);
    this.pluginManager.notify('onBeforeRender', this);
    this.renderer.render(seriesData, {
      bounds: this.viewBounds,
      backgroundColor: this.backgroundColor,
      plotArea,
    });
    renderOverlay(ctx, plotArea, this.yScale);
    this.pluginManager.notify('onAfterRender', this);

    this.events.emit("render", {
      fps: 1000 / (performance.now() - start),
      frameTime: performance.now() - start,
    });
  }

  private pixelToDataX(px: number): number {
    return pxToDataX(px, this.getPlotArea(), this.viewBounds);
  }

  private pixelToDataY(py: number): number {
    return pxToDataY(py, this.getPlotArea(), this.viewBounds);
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
    while (this.container.firstChild)
      this.container.removeChild(this.container.firstChild);
    console.log("[SciChart] Destroyed");
  }
}

export function createChart(options: ChartOptions): Chart {
  return new ChartImpl(options);
}
