/**
 * TooltipManager - Coordinates the tooltip system
 * 
 * This is the main entry point for the tooltip system, integrating:
 * - Template management
 * - Theme management
 * - Hit-testing for data points
 * - Tooltip positioning and rendering
 * - Event handling
 * 
 * @module tooltip/TooltipManager
 */

import type { PlotArea, Bounds } from '../../types';
import type { Scale } from '../../scales';
import type { Series } from '../Series';
import type {
  TooltipData,
  DataPointTooltip,
  CrosshairTooltip,
  TooltipOptions,
  TooltipTheme,
  TooltipTemplate,
  TooltipPosition,
  ShowTooltipOptions,
  TooltipEventMap
} from './types';
import { EventEmitter } from '../EventEmitter';
import { TooltipPositioner } from './TooltipPositioner';
import { TooltipRenderer } from './TooltipRenderer';
import { DEFAULT_TOOLTIP_THEME, getTooltipThemeForChartTheme, createTooltipTheme } from './themes';
import {
  defaultTooltipTemplate,
  minimalTooltipTemplate,
  crosshairTooltipTemplate,
  heatmapTooltipTemplate,
  scientificTooltipTemplate,
  annotationTooltipTemplate,
  rangeTooltipTemplate,
  getBuiltinTemplate,
  getDefaultTemplateForType
} from './templates';
import type { ChartTheme } from '../../theme';

// ============================================
// Types for TooltipManager
// ============================================

export interface TooltipManagerConfig {
  /** Canvas 2D context for rendering */
  overlayCtx: CanvasRenderingContext2D;
  /** Chart theme (for auto-selecting tooltip theme) */
  chartTheme: ChartTheme;
  /** Function to get current plot area */
  getPlotArea: () => PlotArea;
  /** Function to get all series */
  getSeries: () => Series[];
  /** Function to convert pixel X to data X */
  pixelToDataX: (px: number) => number;
  /** Function to convert pixel Y to data Y */
  pixelToDataY: (py: number) => number;
  /** Function to get X scale */
  getXScale: () => Scale;
  /** Function to get Y scales */
  getYScales: () => Map<string, Scale>;
  /** Function to get view bounds */
  getViewBounds: () => Bounds;
  /** Initial options */
  options?: TooltipOptions;
}

interface ActiveTooltip {
  id: string;
  data: TooltipData;
  position: TooltipPosition;
  template: TooltipTemplate<TooltipData>;
}

/** Internal fully-populated options type */
interface FullTooltipOptions {
  enabled: boolean;
  showDelay: number;
  hideDelay: number;
  followCursor: boolean;
  offset: { x: number; y: number };
  dataPoint: {
    enabled: boolean;
    templateId: string;
    snapToPoint: boolean;
    hitRadius: number;
  };
  crosshair: {
    enabled: boolean;
    templateId: string;
    interpolate: boolean;
    visibleSeriesOnly: boolean;
  };
  range: {
    enabled: boolean;
    templateId: string;
    calculateStats: boolean;
  };
  annotation: {
    enabled: boolean;
    templateId: string;
  };
  heatmap: {
    enabled: boolean;
    templateId: string;
    showColorInfo: boolean;
  };
  positioning: 'auto' | 'fixed' | 'follow';
  preferredPosition: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  constrainToPlotArea: boolean;
  constrainToContainer: boolean;
  autoFlip: boolean;
  theme?: string | Partial<TooltipTheme>;
}

// ============================================
// TooltipManager Implementation
// ============================================

export class TooltipManager {
  private ctx: CanvasRenderingContext2D;
  private getPlotArea: () => PlotArea;
  private getSeries: () => Series[];
  private pixelToDataX: (px: number) => number;
  private pixelToDataY: (py: number) => number;
  private getXScale: () => Scale;
  private getYScales: () => Map<string, Scale>;
  
  private options: FullTooltipOptions;
  private theme: TooltipTheme;
  private positioner: TooltipPositioner;
  private renderer: TooltipRenderer;
  private templates: Map<string, TooltipTemplate<TooltipData>> = new Map();
  private events = new EventEmitter<TooltipEventMap>();
  
  private activeTooltips: Map<string, ActiveTooltip> = new Map();
  private tooltipIdCounter = 0;
  private showTimeoutId: number | null = null;
  private hideTimeoutId: number | null = null;
  
  private lastCursorX: number | null = null;
  private lastCursorY: number | null = null;
  private hoveredSeriesId: string | null = null;
  private hoveredDataIndex: number | null = null;
  private cachedNearestResult: DataPointTooltip | null = null;
  
  // Large dataset optimizations
  private snapMode: 'nearest' | 'x-only' | 'auto' = 'auto';
  private largeDatasetThreshold = 50000;
  private lastKnownDataSize = 0;
  // Hysteresis factor: new point must be this much closer to switch (2 = 2x closer)
  private hysteresisRatio = 2.0;

  constructor(config: TooltipManagerConfig) {
    this.ctx = config.overlayCtx;
    this.getPlotArea = config.getPlotArea;
    this.getSeries = config.getSeries;
    this.pixelToDataX = config.pixelToDataX;
    this.pixelToDataY = config.pixelToDataY;
    this.getXScale = config.getXScale;
    this.getYScales = config.getYScales;
    
    // Default options
    this.options = {
      enabled: true,
      showDelay: 50,
      hideDelay: 100,
      followCursor: false,
      offset: { x: 12, y: 12 },
      dataPoint: {
        enabled: true,
        templateId: 'default',
        snapToPoint: true,
        hitRadius: 20
      },
      crosshair: {
        enabled: false,
        templateId: 'crosshair',
        interpolate: true,
        visibleSeriesOnly: true
      },
      range: {
        enabled: false,
        templateId: 'default',
        calculateStats: true
      },
      annotation: {
        enabled: true,
        templateId: 'default'
      },
      heatmap: {
        enabled: true,
        templateId: 'heatmap',
        showColorInfo: true
      },
      positioning: 'auto',
      preferredPosition: 'auto',
      constrainToPlotArea: true,
      constrainToContainer: true,
      autoFlip: true
    };
    
    // Apply user options
    if (config.options) {
      this.configure(config.options);
    }
    
    // Initialize theme
    this.theme = config.options?.theme 
      ? (typeof config.options.theme === 'string' 
          ? getTooltipThemeForChartTheme(config.options.theme)
          : createTooltipTheme(DEFAULT_TOOLTIP_THEME, config.options.theme))
      : getTooltipThemeForChartTheme(config.chartTheme.name);
    
    // Initialize components
    this.positioner = new TooltipPositioner({
      offset: this.options.offset,
      preferredPosition: this.options.preferredPosition,
      constrainToPlotArea: this.options.constrainToPlotArea,
      constrainToContainer: this.options.constrainToContainer,
      autoFlip: this.options.autoFlip,
      showArrow: this.theme.showArrow,
      arrowSize: this.theme.arrowSize
    });
    
    this.renderer = new TooltipRenderer(this.ctx, this.theme);
    
    // Register built-in templates
    this.registerBuiltinTemplates();
  }

  /**
   * Register built-in templates
   */
  private registerBuiltinTemplates(): void {
    this.templates.set('default', defaultTooltipTemplate as TooltipTemplate<TooltipData>);
    this.templates.set('minimal', minimalTooltipTemplate as TooltipTemplate<TooltipData>);
    this.templates.set('crosshair', crosshairTooltipTemplate as TooltipTemplate<TooltipData>);
    this.templates.set('heatmap', heatmapTooltipTemplate as TooltipTemplate<TooltipData>);
    this.templates.set('scientific', scientificTooltipTemplate as TooltipTemplate<TooltipData>);
    this.templates.set('annotation', annotationTooltipTemplate as TooltipTemplate<TooltipData>);
    this.templates.set('range', rangeTooltipTemplate as TooltipTemplate<TooltipData>);
  }

  /**
   * Configure tooltip options
   */
  configure(options: TooltipOptions): void {
    if (options.enabled !== undefined) this.options.enabled = options.enabled;
    if (options.showDelay !== undefined) this.options.showDelay = options.showDelay;
    if (options.hideDelay !== undefined) this.options.hideDelay = options.hideDelay;
    if (options.followCursor !== undefined) this.options.followCursor = options.followCursor;
    if (options.offset) this.options.offset = { ...this.options.offset, ...options.offset };
    
    if (options.dataPoint) {
      this.options.dataPoint = { ...this.options.dataPoint, ...options.dataPoint };
    }
    if (options.crosshair) {
      this.options.crosshair = { ...this.options.crosshair, ...options.crosshair };
    }
    if (options.heatmap) {
      this.options.heatmap = { ...this.options.heatmap, ...options.heatmap };
    }
    
    if (options.preferredPosition) this.options.preferredPosition = options.preferredPosition;
    if (options.constrainToPlotArea !== undefined) this.options.constrainToPlotArea = options.constrainToPlotArea;
    if (options.constrainToContainer !== undefined) this.options.constrainToContainer = options.constrainToContainer;
    if (options.autoFlip !== undefined) this.options.autoFlip = options.autoFlip;
    
    // Large dataset optimization options
    if (options.snapMode !== undefined) {
      this.snapMode = options.snapMode;
    }
    if (options.largeDatasetThreshold !== undefined) {
      this.largeDatasetThreshold = Math.max(1000, options.largeDatasetThreshold);
    }
    
    // Update positioner
    this.positioner.configure({
      offset: this.options.offset,
      preferredPosition: this.options.preferredPosition,
      constrainToPlotArea: this.options.constrainToPlotArea,
      constrainToContainer: this.options.constrainToContainer,
      autoFlip: this.options.autoFlip
    });
  }

  /**
   * Get current options
   */
  getOptions(): TooltipOptions {
    return { ...this.options };
  }

  /**
   * Enable/disable tooltips
   */
  setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
    if (!enabled) {
      this.hideAll();
    }
  }

  /**
   * Check if tooltips are enabled
   */
  isEnabled(): boolean {
    return this.options.enabled;
  }

  /**
   * Set tooltip theme
   */
  setTheme(theme: TooltipTheme | string): void {
    this.theme = typeof theme === 'string' 
      ? getTooltipThemeForChartTheme(theme)
      : theme;
    this.renderer.setTheme(this.theme);
    this.positioner.configure({
      showArrow: this.theme.showArrow,
      arrowSize: this.theme.arrowSize
    });
  }

  /**
   * Update theme based on chart theme
   */
  updateChartTheme(chartTheme: ChartTheme): void {
    if (!this.options.theme) {
      // Only auto-update if user hasn't set a custom theme
      this.theme = getTooltipThemeForChartTheme(chartTheme.name);
      this.renderer.setTheme(this.theme);
    }
  }

  /**
   * Get current theme
   */
  getTheme(): TooltipTheme {
    return this.theme;
  }

  /**
   * Register a custom template
   */
  registerTemplate<T extends TooltipData>(template: TooltipTemplate<T>): void {
    this.templates.set(template.id, template as TooltipTemplate<TooltipData>);
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): TooltipTemplate<TooltipData> | undefined {
    return this.templates.get(id) || getBuiltinTemplate(id);
  }


  /**
   * Handle cursor movement - main entry point for hover detection
   * Optimized with hysteresis to prevent jumping between nearby points
   */
  handleCursorMove(pixelX: number, pixelY: number): void {
    if (!this.options.enabled) return;
    
    this.lastCursorX = pixelX;
    this.lastCursorY = pixelY;
    
    const plotArea = this.getPlotArea();
    
    // Check if cursor is in plot area (fast path)
    const inPlotArea = 
      pixelX >= plotArea.x && 
      pixelX <= plotArea.x + plotArea.width &&
      pixelY >= plotArea.y && 
      pixelY <= plotArea.y + plotArea.height;
    
    if (!inPlotArea) {
      this.cachedNearestResult = null;
      this.scheduleHide();
      return;
    }
    
    // Update positioner with current bounds
    this.positioner.setContainerSize(
      this.ctx.canvas.width / (window.devicePixelRatio || 1),
      this.ctx.canvas.height / (window.devicePixelRatio || 1)
    );
    this.positioner.setPlotArea(plotArea);
    
    // Track data size for auto mode
    this.lastKnownDataSize = this.getTotalDataPoints();
    
    // Find and show tooltip with hysteresis
    this.performTooltipUpdateWithHysteresis(pixelX, pixelY);
  }

  /**
   * Handle cursor leave
   */
  handleCursorLeave(): void {
    this.lastCursorX = null;
    this.lastCursorY = null;
    this.cachedNearestResult = null;
    this.scheduleHide();
  }

  /**
   * Get total number of data points across all visible series
   */
  private getTotalDataPoints(): number {
    let total = 0;
    const series = this.getSeries();
    for (const s of series) {
      if (!s.isVisible()) continue;
      const data = s.getData();
      if (data.x) total += data.x.length;
    }
    return total;
  }

  /**
   * Determine the effective snap mode based on configuration and data size
   */
  private getEffectiveSnapMode(): 'nearest' | 'x-only' {
    if (this.snapMode === 'x-only') return 'x-only';
    if (this.snapMode === 'nearest') return 'nearest';
    
    // Auto mode - use x-only for large datasets
    return this.lastKnownDataSize > this.largeDatasetThreshold ? 'x-only' : 'nearest';
  }

  /**
   * Perform tooltip update with hysteresis to prevent jumping.
   * The tooltip "sticks" to the current point unless the cursor is
   * significantly closer to a new point.
   */
  private performTooltipUpdateWithHysteresis(pixelX: number, pixelY: number): void {
    // Try to find a data point
    if (!this.options.dataPoint?.enabled) {
      this.performFallbackTooltipUpdate(pixelX, pixelY);
      return;
    }
    
    const effectiveMode = this.getEffectiveSnapMode();
    const newResult = effectiveMode === 'x-only' 
      ? this.findDataPointByXOnly(pixelX)
      : this.findNearestDataPointOptimized(pixelX, pixelY);
    
    if (!newResult) {
      this.performFallbackTooltipUpdate(pixelX, pixelY);
      return;
    }
    
    // Hysteresis: If we already have a point, only switch if new point is MUCH closer
    if (this.cachedNearestResult && this.hoveredSeriesId !== null) {
      const currentPoint = this.cachedNearestResult;
      
      // Calculate distances to current and new points
      const currentDx = currentPoint.pixelX - pixelX;
      const currentDy = currentPoint.pixelY - pixelY;
      const currentDistSq = currentDx * currentDx + currentDy * currentDy;
      
      const newDx = newResult.pixelX - pixelX;
      const newDy = newResult.pixelY - pixelY;
      const newDistSq = newDx * newDx + newDy * newDy;
      
      // Only switch to new point if it's significantly closer
      if (newDistSq * this.hysteresisRatio >= currentDistSq) {
        // Stay with current point - just update position if needed
        this.updateTooltipPosition(this.cachedNearestResult);
        return;
      }
    }
    
    // Switch to new point
    this.cachedNearestResult = newResult;
    this.scheduleShow(newResult);
  }

  /**
   * Handle heatmap and crosshair tooltip types (fallback)
   */
  private performFallbackTooltipUpdate(pixelX: number, pixelY: number): void {
    // Try heatmap
    if (this.options.heatmap?.enabled) {
      const heatmapResult = this.findHeatmapCell(pixelX, pixelY);
      if (heatmapResult) {
        this.scheduleShow(heatmapResult);
        return;
      }
    }
    
    // Crosshair mode
    if (this.options.crosshair?.enabled) {
      const crosshairData = this.buildCrosshairTooltip(pixelX, pixelY);
      if (crosshairData) {
        this.scheduleShow(crosshairData);
        return;
      }
    }
    
    // No hit - hide tooltip
    this.cachedNearestResult = null;
    this.scheduleHide();
  }

  /**
   * Find data point by X coordinate only (O(log n) - fastest method)
   * Best for very large datasets where precision is less important than speed
   */
  private findDataPointByXOnly(pixelX: number): DataPointTooltip | null {
    const series = this.getSeries().filter(s => s.isVisible() && s.getType() !== 'heatmap');
    if (series.length === 0) return null;
    
    const xScale = this.getXScale();
    const yScales = this.getYScales();
    const cursorDataX = this.pixelToDataX(pixelX);
    
    let bestResult: DataPointTooltip | null = null;
    let bestXDistance = Infinity;
    
    for (const s of series) {
      const data = s.getData();
      if (!data.x || data.x.length === 0) continue;
      
      const yScale = yScales.get(s.getYAxisId?.() || 'default') || yScales.values().next().value;
      if (!yScale) continue;
      
      // Pure binary search for closest X
      const idx = this.binarySearchClosest(data.x, cursorDataX);
      const xDistance = Math.abs(data.x[idx] - cursorDataX);
      
      if (xDistance < bestXDistance) {
        bestXDistance = xDistance;
        const style = s.getStyle();
        const px = xScale.transform(data.x[idx]);
        const py = yScale.transform(data.y[idx]);
        
        bestResult = {
          type: 'datapoint',
          seriesId: s.getId(),
          seriesName: s.getId(),
          seriesColor: style.color || '#ff0055',
          dataIndex: idx,
          dataX: data.x[idx],
          dataY: data.y[idx],
          pixelX: px,
          pixelY: py,
          cycle: (s as any).getCycle?.()
        };
        
        const yError = s.getYError(idx);
        if (yError) bestResult.yError = yError;
      }
    }
    
    return bestResult;
  }

  /**
   * Optimized nearest data point finder
   */
  private findNearestDataPointOptimized(pixelX: number, pixelY: number): DataPointTooltip | null {
    const series = this.getSeries().filter(s => s.isVisible());
    const hitRadius = this.options.dataPoint?.hitRadius ?? 20;
    const xScale = this.getXScale();
    const yScales = this.getYScales();
    
    let nearestDistanceSq = hitRadius * hitRadius;
    let nearestResult: DataPointTooltip | null = null;
    
    const cursorDataX = this.pixelToDataX(pixelX);
    
    for (const s of series) {
      if (s.getType() === 'heatmap') continue;
      
      const data = s.getData();
      const yScale = yScales.get(s.getYAxisId?.() || 'default') || yScales.values().next().value;
      
      if (!yScale || !data.x || data.x.length === 0) continue;
      
      const closestIdx = this.binarySearchClosest(data.x, cursorDataX);
      
      // Adaptive search range
      const dataLength = data.x.length;
      const searchRadius = dataLength > 100000 ? 2 : dataLength > 10000 ? 3 : 5;
      const checkStart = Math.max(0, closestIdx - searchRadius);
      const checkEnd = Math.min(dataLength, closestIdx + searchRadius + 1);
      
      for (let i = checkStart; i < checkEnd; i++) {
        const px = xScale.transform(data.x[i]);
        const py = yScale.transform(data.y[i]);
        
        const dx = px - pixelX;
        const dy = py - pixelY;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < nearestDistanceSq) {
          nearestDistanceSq = distSq;
          const style = s.getStyle();
          
          nearestResult = {
            type: 'datapoint',
            seriesId: s.getId(),
            seriesName: s.getId(),
            seriesColor: style.color || '#ff0055',
            dataIndex: i,
            dataX: data.x[i],
            dataY: data.y[i],
            pixelX: px,
            pixelY: py,
            cycle: (s as any).getCycle?.()
          };
          
          const yError = s.getYError(i);
          if (yError) nearestResult.yError = yError;
        }
      }
    }
    
    return nearestResult;
  }

  /**
   * Find heatmap cell under cursor
   */
  private findHeatmapCell(pixelX: number, pixelY: number): import("./types").HeatmapTooltip | null {
    const series = this.getSeries().filter(s => s.isVisible() && s.getType() === 'heatmap');
    if (series.length === 0) return null;

    const xScale = this.getXScale();
    const yScales = this.getYScales();
    const dataX = this.pixelToDataX(pixelX);
    const dataY = this.pixelToDataY(pixelY);

    for (const s of series) {
      const data = s.getHeatmapData();
      if (!data || !data.xValues || !data.yValues || !data.zValues) continue;

      const colIdx = this.binarySearchClosest(data.xValues as any, dataX);
      const rowIdx = this.binarySearchClosest(data.yValues as any, dataY);

      const xValue = data.xValues[colIdx];
      const yValue = data.yValues[rowIdx];
      
      const yScale = yScales.get(s.getYAxisId?.() || 'default') || yScales.values().next().value;
      if (!yScale) continue;

      const px = xScale.transform(xValue);
      const py = yScale.transform(yValue);

      const zValue = data.zValues[rowIdx * data.xValues.length + colIdx];
      const style = s.getHeatmapStyle?.() || {};

      return {
        type: 'heatmap',
        seriesId: s.getId(),
        seriesName: s.getId(),
        xIndex: colIdx,
        yIndex: rowIdx,
        dataX: xValue,
        dataY: yValue,
        zValue,
        pixelX: px,
        pixelY: py,
        colorScale: style.colorScale as any
      };
    }

    return null;
  }

  /**
   * Binary search for closest value
   */
  private binarySearchClosest(arr: Float32Array | Float64Array, target: number): number {
    let left = 0;
    let right = arr.length - 1;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (arr[mid] < target) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    if (left > 0 && Math.abs(arr[left - 1] - target) < Math.abs(arr[left] - target)) {
      return left - 1;
    }
    
    return left;
  }

  /**
   * Build crosshair tooltip data
   */
  private buildCrosshairTooltip(pixelX: number, pixelY: number): CrosshairTooltip | null {
    const series = this.getSeries().filter(s => s.isVisible() && s.getType() !== 'heatmap');
    if (series.length === 0) return null;
    
    const dataX = this.pixelToDataX(pixelX);
    const yScales = this.getYScales();
    
    const interpolatedValues: CrosshairTooltip['interpolatedValues'] = [];
    
    for (const s of series) {
      const data = s.getData();
      if (!data.x || data.x.length === 0) continue;
      
      const yScale = yScales.get(s.getYAxisId?.() || 'default') || yScales.values().next().value;
      if (!yScale) continue;
      
      const idx = this.binarySearchClosest(data.x, dataX);
      let y: number;
      let isInterpolated = false;
      
      if (idx === 0 || idx >= data.x.length - 1 || data.x[idx] === dataX) {
        y = data.y[idx];
      } else if (this.options.crosshair?.interpolate) {
        const x0 = data.x[idx - 1];
        const x1 = data.x[idx];
        const y0 = data.y[idx - 1];
        const y1 = data.y[idx];
        const t = (dataX - x0) / (x1 - x0);
        y = y0 + t * (y1 - y0);
        isInterpolated = true;
      } else {
        y = data.y[idx];
      }
      
      const style = s.getStyle();
      interpolatedValues.push({
        seriesId: s.getId(),
        seriesName: s.getId(),
        seriesColor: style.color || '#ff0055',
        x: dataX,
        y,
        isInterpolated
      });
    }
    
    if (interpolatedValues.length === 0) return null;
    
    return {
      type: 'crosshair',
      cursorX: pixelX,
      cursorY: pixelY,
      dataX,
      interpolatedValues
    };
  }

  /**
   * Schedule showing a tooltip
   */
  private scheduleShow(data: TooltipData): void {
    this.clearHideTimeout();
    
    // If same data point, just update position
    if (data.type === 'datapoint') {
      const dp = data as DataPointTooltip;
      if (this.hoveredSeriesId === dp.seriesId && this.hoveredDataIndex === dp.dataIndex) {
        this.updateTooltipPosition(data);
        return;
      }
      this.hoveredSeriesId = dp.seriesId;
      this.hoveredDataIndex = dp.dataIndex;
    }
    
    this.clearShowTimeout();
    
    // Use short or no delay when already showing a tooltip
    const effectiveDelay = this.activeTooltips.size > 0 ? 0 : this.options.showDelay;
    
    if (effectiveDelay > 0) {
      this.showTimeoutId = window.setTimeout(() => {
        this.showTooltip(data);
      }, effectiveDelay);
    } else {
      this.showTooltip(data);
    }
  }

  /**
   * Schedule hiding tooltips
   */
  private scheduleHide(): void {
    this.clearShowTimeout();
    this.hoveredSeriesId = null;
    this.hoveredDataIndex = null;
    
    if (this.options.hideDelay > 0) {
      this.hideTimeoutId = window.setTimeout(() => {
        this.hideAll();
      }, this.options.hideDelay);
    } else {
      this.hideAll();
    }
  }

  private clearShowTimeout(): void {
    if (this.showTimeoutId !== null) {
      clearTimeout(this.showTimeoutId);
      this.showTimeoutId = null;
    }
  }

  private clearHideTimeout(): void {
    if (this.hideTimeoutId !== null) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }
  }

  /**
   * Show a tooltip with the given data
   */
  private showTooltip(data: TooltipData): void {
    const templateId = this.getTemplateIdForType(data.type);
    const template = this.templates.get(templateId) || getDefaultTemplateForType(data.type);
    
    const targetX = (data as any).pixelX ?? this.lastCursorX ?? 0;
    const targetY = (data as any).pixelY ?? this.lastCursorY ?? 0;
    
    const measurement = template.measure(this.ctx, data, this.theme);
    const position = this.positioner.calculatePosition(targetX, targetY, measurement);
    
    const tooltipId = 'main';
    
    this.activeTooltips.set(tooltipId, {
      id: tooltipId,
      data,
      position,
      template
    });
  }

  /**
   * Update tooltip position
   */
  private updateTooltipPosition(data: TooltipData | null): void {
    const tooltip = this.activeTooltips.get('main');
    if (!tooltip) return;
    
    const tooltipData = data || tooltip.data;
    const targetX = (tooltipData as any).pixelX ?? this.lastCursorX ?? 0;
    const targetY = (tooltipData as any).pixelY ?? this.lastCursorY ?? 0;
    
    const measurement = tooltip.template.measure(this.ctx, tooltipData, this.theme);
    tooltip.position = this.positioner.calculatePosition(targetX, targetY, measurement);
    tooltip.data = tooltipData;
  }

  /**
   * Get template ID for a tooltip type
   */
  private getTemplateIdForType(type: string): string {
    switch (type) {
      case 'datapoint':
        return this.options.dataPoint?.templateId || 'default';
      case 'crosshair':
        return this.options.crosshair?.templateId || 'crosshair';
      case 'heatmap':
        return this.options.heatmap?.templateId || 'heatmap';
      default:
        return 'default';
    }
  }

  /**
   * Show a tooltip programmatically
   */
  show(data: TooltipData, options?: ShowTooltipOptions): string {
    const tooltipId = `tooltip-${++this.tooltipIdCounter}`;
    const templateId = options?.templateId || this.getTemplateIdForType(data.type);
    const template = this.templates.get(templateId) || getDefaultTemplateForType(data.type);
    
    let position: TooltipPosition;
    
    if (options?.position) {
      const measurement = template.measure(this.ctx, data, this.theme);
      position = this.positioner.calculatePosition(
        options.position.x, 
        options.position.y, 
        measurement
      );
    } else {
      const targetX = (data as any).pixelX ?? 0;
      const targetY = (data as any).pixelY ?? 0;
      const measurement = template.measure(this.ctx, data, this.theme);
      position = this.positioner.calculatePosition(targetX, targetY, measurement);
    }
    
    this.activeTooltips.set(tooltipId, {
      id: tooltipId,
      data,
      position,
      template
    });
    
    if (options?.duration && options.duration > 0) {
      setTimeout(() => this.hide(tooltipId), options.duration);
    }
    
    return tooltipId;
  }

  /**
   * Hide a specific tooltip
   */
  hide(tooltipId: string): void {
    this.activeTooltips.delete(tooltipId);
  }

  /**
   * Hide all tooltips immediately
   */
  hideAll(): void {
    this.activeTooltips.clear();
    this.hoveredSeriesId = null;
    this.hoveredDataIndex = null;
  }

  /**
   * Render all active tooltips
   */
  render(): void {
    if (!this.options.enabled || this.activeTooltips.size === 0) return;
    
    for (const tooltip of this.activeTooltips.values()) {
      this.renderer.render(
        tooltip.data,
        tooltip.position,
        tooltip.template
      );
    }
  }

  /**
   * Check if any tooltip is currently visible
   */
  hasActiveTooltip(): boolean {
    return this.activeTooltips.size > 0;
  }

  /**
   * Subscribe to tooltip events
   */
  on<K extends keyof TooltipEventMap>(
    event: K,
    handler: (data: TooltipEventMap[K]) => void
  ): void {
    this.events.on(event, handler);
  }

  /**
   * Unsubscribe from tooltip events
   */
  off<K extends keyof TooltipEventMap>(
    event: K,
    handler: (data: TooltipEventMap[K]) => void
  ): void {
    this.events.off(event, handler);
  }

  /**
   * Destroy the tooltip manager
   */
  destroy(): void {
    this.clearShowTimeout();
    this.clearHideTimeout();
    this.activeTooltips.clear();
    this.templates.clear();
    this.events.clear();
  }
}

/**
 * Create a tooltip manager
 */
export function createTooltipManager(config: TooltipManagerConfig): TooltipManager {
  return new TooltipManager(config);
}
