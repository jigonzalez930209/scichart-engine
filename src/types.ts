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
}

// ============================================
// Series Types
// ============================================

export type SeriesType = "line" | "scatter" | "line+scatter" | "step" | "step+scatter";

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
}

/** Available scatter symbol shapes */
export type ScatterSymbol = 
  | 'circle'      // Default filled circle
  | 'square'      // Filled square (diamond rotated 45°)
  | 'diamond'     // Diamond shape
  | 'triangle'    // Triangle pointing up
  | 'triangleDown'// Triangle pointing down
  | 'cross'       // + shape
  | 'x'           // X shape
  | 'star';       // 5-pointed star

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
  /** Cycle number (for CV) */
  cycle?: number;
  /** Maximum number of points to keep (rolling window) */
  maxPoints?: number;
}

export interface SeriesUpdateData {
  /** New X values */
  x?: Float32Array | Float64Array;
  /** New Y values */
  y?: Float32Array | Float64Array;
  /** If true, append to existing data; if false, replace */
  append?: boolean;
}

// ============================================
// Chart Options
// ============================================

export interface ChartOptions {
  /** Target container element */
  container: HTMLDivElement;
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
