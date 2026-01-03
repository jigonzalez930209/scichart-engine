/**
 * Core type definitions for SciChart Engine
 */

// ============================================
// Primitive Types
// ============================================

/** 2D point */
export interface Point {
  x: number;
  y: number;
}

/** Rectangular bounds */
export interface Bounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/** Range tuple [min, max] */
export type Range = [number, number];

// ============================================
// Scale Types
// ============================================

export type ScaleType = "linear" | "log";

export interface AxisOptions {
  /** Unique ID for the axis (defaults to 'default') */
  id?: string;
  /** Axis position */
  position?: "left" | "right" | "top" | "bottom";
  /** Scale type */
  scale?: ScaleType;
  /** Axis label (e.g., 'E / V') */
  label?: string;
  /** Unit for formatting (e.g., 'V', 'A') */
  unit?: string;
  /** Unit prefix: 'auto' for automatic (µ, n, m, etc.) */
  prefix?: "auto" | "µ" | "n" | "m" | "" | "k" | "M";
  /** Fixed minimum value */
  min?: number;
  /** Fixed maximum value */
  max?: number;
  /** Enable autoscaling */
  auto?: boolean;
  /** Force scientific notation (e.g., 1.2 × 10⁵) */
  scientific?: boolean;
}

// ============================================
// Series Types
// ============================================

export type SeriesType =
  | "line"
  | "scatter"
  | "line+scatter"
  | "step"
  | "step+scatter"
  | "band"
  | "area"
  | "bar"
  | "heatmap"
  | "candlestick";

/** Step mode defines where the step occurs */
export type StepMode = "before" | "after" | "center";

/** Error bar direction */
export type ErrorBarDirection = "both" | "positive" | "negative";

export interface SeriesData {
  /** X values (potential, time, etc.) */
  x: Float32Array | Float64Array;
  /** Y values (current, charge, etc.) */
  y: Float32Array | Float64Array;
  /** Symmetric Y error (±error) */
  yError?: Float32Array | Float64Array;
  /** Asymmetric Y error - positive direction (upward) */
  yErrorPlus?: Float32Array | Float64Array;
  /** Asymmetric Y error - negative direction (downward) */
  yErrorMinus?: Float32Array | Float64Array;
  /** Symmetric X error (±error) - for horizontal error bars */
  xError?: Float32Array | Float64Array;
  /** Asymmetric X error - positive direction (rightward) */
  xErrorPlus?: Float32Array | Float64Array;
  /** Asymmetric X error - negative direction (leftward) */
  xErrorMinus?: Float32Array | Float64Array;
  /** Second Y-values for band/area charts (lower boundary or baseline) */
  y2?: Float32Array | Float64Array;
  /** Open values for OHLC/Candlestick */
  open?: Float32Array | Float64Array;
  /** High values for OHLC/Candlestick */
  high?: Float32Array | Float64Array;
  /** Low values for OHLC/Candlestick */
  low?: Float32Array | Float64Array;
  /** Close values for OHLC/Candlestick */
  close?: Float32Array | Float64Array;
}

/** Error bar styling options */
export interface ErrorBarStyle {
  /** Show error bars (default: true if error data present) */
  visible?: boolean;
  /** Error bar color (default: same as series) */
  color?: string;
  /** Error bar line width (default: 1) */
  width?: number;
  /** Cap width in pixels (default: 6) */
  capWidth?: number;
  /** Show caps at the end of error bars (default: true) */
  showCaps?: boolean;
  /** Opacity (default: 0.7) */
  opacity?: number;
  /** Direction: show both, positive only, or negative only */
  direction?: ErrorBarDirection;
}

export interface SeriesStyle {
  /** Line/point color (hex or rgb) */
  color?: string;
  /** Line width in pixels */
  width?: number;
  /** Opacity (0-1) */
  opacity?: number;
  /** For scatter: point size */
  pointSize?: number;
  /** Smoothing factor (0 = none, 1 = full) */
  smoothing?: number;
  /** Step mode: where the step transition occurs (default: 'after') */
  stepMode?: StepMode;
  /** Error bar styling */
  errorBars?: ErrorBarStyle;
  /** Scatter symbol shape (default: 'circle') */
  symbol?: ScatterSymbol;
  /** Dash pattern [dash, gap] - empty for solid */
  lineDash?: number[];
}

/** Available scatter symbol shapes */
export type ScatterSymbol =
  | "circle" // Default filled circle
  | "square" // Filled square (diamond rotated 45°)
  | "diamond" // Diamond shape
  | "triangle" // Triangle pointing up
  | "triangleDown" // Triangle pointing down
  | "cross" // + shape
  | "x" // X shape
  | "star"; // 5-pointed star

export interface SeriesOptions {
  /** Unique identifier */
  id: string;
  /** Series type */
  type: SeriesType;
  /** ID of the Y Axis this series belongs to */
  yAxisId?: string;
  /** Data arrays */
  data: SeriesData;
  /** Visual style */
  style?: SeriesStyle;
  /** Visibility */
  visible?: boolean;
  /** Display name in legend */
  name?: string;
  /** Cycle number (for CV) */
  cycle?: number;
  /** Maximum number of points to keep (rolling window) */
  maxPoints?: number;
  /** Identifier for stacking series (same ID will be stacked together) */
  stackId?: string;
}

export interface SeriesUpdateData {
  /** New X values */
  x?: Float32Array | Float64Array;
  /** New Y values */
  y?: Float32Array | Float64Array;
  /** New Y2 values (for bands) */
  y2?: Float32Array | Float64Array;
  /** New Open values (for candlesticks) */
  open?: Float32Array | Float64Array;
  /** New High values (for candlesticks) */
  high?: Float32Array | Float64Array;
  /** New Low values (for candlesticks) */
  low?: Float32Array | Float64Array;
  /** New Close values (for candlesticks) */
  close?: Float32Array | Float64Array;
  /** If true, append to existing data; if false, replace */
  append?: boolean;
}

// ============================================
// Bar Chart Types
// ============================================

export interface BarStyle
  extends Omit<SeriesStyle, "pointSize" | "symbol" | "smoothing" | "stepMode"> {
  /** Bar width in data units (auto if not specified) */
  barWidth?: number;
  /** Gap between bars as a fraction of bar width (default: 0.2) */
  barGap?: number;
  /** Bar alignment: 'center' (default) | 'edge' */
  barAlign?: "center" | "edge";
}

// ============================================
// Heatmap Types
// ============================================

/** Color scale names for heatmaps */
export type ColorScaleName =
  | "viridis"
  | "plasma"
  | "inferno"
  | "magma"
  | "jet"
  | "grayscale";

/** Interpolation method for heatmap rendering */
export type InterpolationType = "nearest" | "bilinear";

// ============================================
// Overlay Types
// ============================================

export interface PlotArea {
  /** X position of plot area relative to canvas */
  x: number;
  /** Y position of plot area relative to canvas */
  y: number;
  /** Width of plot area */
  width: number;
  /** Height of plot area */
  height: number;
  /** Inner margins from container edges */
  left?: number;
  /** Inner margins from container edges */
  right?: number;
  /** Inner margins from container edges */
  top?: number;
  /** Inner margins from container edges */
  bottom?: number;
}

export interface CursorState {
  enabled: boolean;
  x: number;
  y: number;
  crosshair: boolean;
  tooltipText?: string;
}

export interface AxisLabels {
  x?: string;
  y?: string;
}

export interface ColorScale {
  /** Color scale name */
  name: ColorScaleName;
  /** Minimum value for color mapping */
  min?: number;
  /** Maximum value for color mapping */
  max?: number;
  /** Use logarithmic scale (default: false) */
  logScale?: boolean;
}

export interface HeatmapData {
  /** X-axis values (column positions) */
  xValues: Float32Array | Float64Array | number[];
  /** Y-axis values (row positions) */
  yValues: Float32Array | Float64Array | number[];
  /** Z-values (intensity) as flattened 2D matrix [row-major order] */
  zValues: Float32Array | Float64Array | number[];
}

export interface HeatmapStyle {
  /** Color scale configuration */
  colorScale?: ColorScale;
  /** Interpolation method (default: 'bilinear') */
  interpolation?: InterpolationType;
  /** Show colorbar legend (default: true) */
  showColorbar?: boolean;
  /** Opacity (default: 1.0) */
  opacity?: number;
}

export interface HeatmapOptions extends Omit<SeriesOptions, "data" | "style"> {
  type: "heatmap";
  /** Heatmap data with X, Y, Z values */
  data: HeatmapData;
  /** Heatmap-specific styling */
  style?: HeatmapStyle;
}

// ============================================
// Chart Options
// ============================================

export interface ChartOptions {
  /** Target container element */
  container: HTMLDivElement;
  /** Renderer backend selection (default: 'webgl') */
  renderer?: "webgl" | "webgpu";
  /** X-axis configuration */
  xAxis?: AxisOptions;
  /** Y-axis configuration (single or array) */
  yAxis?: AxisOptions | AxisOptions[];
  /** Background color (overrides theme) */
  background?: string;
  /** Device pixel ratio (default: window.devicePixelRatio) */
  devicePixelRatio?: number;
  /** Theme name or custom theme object */
  theme?: string | object;
  /** Show legend (default: from theme) */
  showLegend?: boolean;
  /** Initial legend position {x, y} in pixels relative to chart area */
  legendPosition?: { x: number; y: number };
  /** Show in-chart controls (default: false) */
  showControls?: boolean;
  /** Automatically follow new data (default: false) */
  autoScroll?: boolean;
  /** Show statistics panel (default: false) */
  showStatistics?: boolean;
  /** Tooltip configuration */
  tooltip?: import("./core/tooltip/types").TooltipOptions;
}

// ============================================
// Interaction Types
// ============================================

export interface ZoomOptions {
  /** X-axis range [min, max] */
  x?: Range;
  /** Y-axis range [min, max] */
  y?: Range;
  /** ID of the specific Y axis to zoom (if applicable) */
  axisId?: string;
  /** Animate the transition */
  animate?: boolean;
}

export interface CursorOptions {
  /** Enable cursor */
  enabled?: boolean;
  /** Snap to nearest data point */
  snap?: boolean;
  /** Show crosshair lines */
  crosshair?: boolean;
  /** Custom tooltip formatter */
  formatter?: (x: number, y: number, seriesId: string) => string;
}

// ============================================
// Event Types
// ============================================

export interface ZoomEvent {
  x: Range;
  y: Range;
}

export interface PanEvent {
  deltaX: number;
  deltaY: number;
}

export interface HoverEvent {
  point: Point;
  seriesId: string;
  dataIndex: number;
}

export interface ClickEvent {
  point: Point;
  seriesId?: string;
  dataIndex?: number;
}

/** Chart event map for type-safe event handling */
export interface ChartEventMap {
  zoom: ZoomEvent;
  pan: PanEvent;
  hover: HoverEvent | null;
  click: ClickEvent;
  resize: { width: number; height: number };
  render: { fps: number; frameTime: number };
  legendMove: { x: number; y: number };
  autoScale: undefined;
}

// ============================================
// Internal Types (not exported from index)
// ============================================

/** GPU uniform values */
export interface Uniforms {
  scale: [number, number];
  translate: [number, number];
  color: [number, number, number, number];
  resolution: [number, number];
}

/** Buffer configuration */
export interface BufferConfig {
  usage: "static" | "dynamic" | "stream";
  data: Float32Array;
}

/** Render state */
export interface RenderState {
  needsRender: boolean;
  lastFrameTime: number;
  frameCount: number;
}
