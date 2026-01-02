/**
 * Tooltip System - Type Definitions
 * 
 * This module defines all types and interfaces for the high-performance
 * tooltip system in SciChart Engine.
 * 
 * @module tooltip/types
 */

// ============================================
// Tooltip Data Types
// ============================================

/** Base type for all tooltip data */
export type TooltipType = 
  | 'datapoint' 
  | 'crosshair' 
  | 'range' 
  | 'annotation' 
  | 'heatmap' 
  | 'axis';

/** Union type for all tooltip data structures */
export type TooltipData = 
  | DataPointTooltip 
  | CrosshairTooltip 
  | RangeTooltip 
  | AnnotationTooltip 
  | HeatmapTooltip 
  | AxisTooltip;

/**
 * Data Point Tooltip - Shows when hovering over data points
 */
export interface DataPointTooltip {
  type: 'datapoint';
  /** Related series ID */
  seriesId: string;
  /** Series display name */
  seriesName: string;
  /** Series color */
  seriesColor: string;
  /** Data point index */
  dataIndex: number;
  /** X value in data coordinates */
  dataX: number;
  /** Y value in data coordinates */
  dataY: number;
  /** X value in pixels (canvas coordinates) */
  pixelX: number;
  /** Y value in pixels (canvas coordinates) */
  pixelY: number;
  /** Y error if available [minus, plus] */
  yError?: [number, number];
  /** X error if available [minus, plus] */
  xError?: [number, number];
  /** Cycle number (for CV data) */
  cycle?: number;
  /** Custom metadata from series */
  metadata?: Record<string, unknown>;
}

/**
 * Crosshair Tooltip - Shows interpolated values at cursor X position
 */
export interface CrosshairTooltip {
  type: 'crosshair';
  /** Cursor X in pixels */
  cursorX: number;
  /** Cursor Y in pixels */
  cursorY: number;
  /** X value in data coordinates */
  dataX: number;
  /** Interpolated values for each visible series */
  interpolatedValues: CrosshairSeriesValue[];
}

export interface CrosshairSeriesValue {
  /** Series ID */
  seriesId: string;
  /** Series display name */
  seriesName: string;
  /** Series color */
  seriesColor: string;
  /** Interpolated X value */
  x: number;
  /** Interpolated Y value */
  y: number;
  /** Whether this is an exact data point or interpolated */
  isInterpolated: boolean;
}

/**
 * Range Tooltip - Shows statistics for selected range
 */
export interface RangeTooltip {
  type: 'range';
  /** Start X value */
  xMin: number;
  /** End X value */
  xMax: number;
  /** Start Y value (for box selection) */
  yMin?: number;
  /** End Y value (for box selection) */
  yMax?: number;
  /** Statistics for the range */
  statistics: RangeStatistics;
}

export interface RangeStatistics {
  /** Number of points in range */
  count: number;
  /** Mean Y value */
  mean?: number;
  /** Minimum Y value */
  min?: number;
  /** Maximum Y value */
  max?: number;
  /** Standard deviation */
  stdDev?: number;
  /** Integrated area under curve */
  area?: number;
  /** X value at peak Y */
  peakX?: number;
  /** Peak Y value */
  peakY?: number;
}

/**
 * Annotation Tooltip - Shows when hovering over annotations
 */
export interface AnnotationTooltip {
  type: 'annotation';
  /** Annotation unique ID */
  annotationId: string;
  /** Type of annotation */
  annotationType: 'horizontal-line' | 'vertical-line' | 'band' | 'text' | 'arrow';
  /** Annotation label if any */
  label?: string;
  /** Position values */
  value?: number;
  valueX?: number;
  valueY?: number;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Heatmap Tooltip - Shows Z values in heatmaps
 */
export interface HeatmapTooltip {
  type: 'heatmap';
  /** Related series ID */
  seriesId: string;
  /** Series display name */
  seriesName: string;
  /** Grid X index (column) */
  xIndex: number;
  /** Grid Y index (row) */
  yIndex: number;
  /** X value in data coordinates */
  dataX: number;
  /** Y value in data coordinates */
  dataY: number;
  /** Z value (intensity) */
  zValue: number;
  /** Mapped color (hex) */
  mappedColor?: string;
  /** X value in pixels (canvas coordinates) */
  pixelX: number;
  /** Y value in pixels (canvas coordinates) */
  pixelY: number;
  /** Color scale information if available */
  colorScale?: {
    name: string;
    min: number;
    max: number;
    isLogScale?: boolean;
    colors?: string[];
  };
}

/**
 * Axis Tooltip - Shows values on axis hover
 */
export interface AxisTooltip {
  type: 'axis';
  /** Which axis */
  axis: 'x' | 'y';
  /** Axis ID (for multiple Y axes) */
  axisId?: string;
  /** Raw value */
  value: number;
  /** Formatted value string */
  formattedValue: string;
  /** Pixel position of value */
  pixelPosition: number;
}

// ============================================
// Tooltip Positioning
// ============================================

/** Position where tooltip arrow points */
export type ArrowPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';

/** Preferred tooltip placement */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TooltipPosition {
  /** X position of tooltip (content corner) */
  x: number;
  /** Y position of tooltip */
  y: number;
  /** Where the arrow points */
  arrowPosition: ArrowPosition;
  /** Arrow offset from edge (pixels) */
  arrowOffset: number;
  /** Whether position was flipped due to constraints */
  wasFlipped: boolean;
}

export interface TooltipMeasurement {
  /** Content width */
  width: number;
  /** Content height */
  height: number;
  /** Padding around content */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Arrow dimensions if applicable */
  arrow?: {
    width: number;
    height: number;
  };
}

// ============================================
// Tooltip Theme
// ============================================

export interface TooltipTheme {
  // Container
  backgroundColor: string;
  backgroundGradient?: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  backdropBlur: number;
  shadow: TooltipShadow;
  
  // Typography
  fontFamily: string;
  textColor: string;
  textSecondaryColor: string;
  titleFontSize: number;
  titleFontWeight: number | string;
  contentFontSize: number;
  lineHeight: number;
  
  // Spacing
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  itemGap: number;
  headerGap: number;
  
  // Decorations
  showSeriesIndicator: boolean;
  seriesIndicatorSize: number;
  showHeaderSeparator: boolean;
  separatorColor: string;
  showArrow: boolean;
  arrowSize: number;
}

export interface TooltipShadow {
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
}


// ============================================
// Tooltip Options
// ============================================

export interface TooltipOptions {
  /** Enable tooltips globally (default: true) */
  enabled?: boolean;
  
  /** Delay before showing tooltip (ms) */
  showDelay?: number;
  
  /** Delay before hiding tooltip (ms) */
  hideDelay?: number;
  
  /** Follow cursor or snap to data point */
  followCursor?: boolean;
  
  /** Offset from cursor/point */
  offset?: { x: number; y: number };
  
  // Type-specific options
  dataPoint?: DataPointTooltipOptions;
  crosshair?: CrosshairTooltipOptions;
  range?: RangeTooltipOptions;
  annotation?: AnnotationTooltipOptions;
  heatmap?: HeatmapTooltipOptions;
  
  // Positioning
  positioning?: 'auto' | 'fixed' | 'follow';
  preferredPosition?: TooltipPlacement;
  constrainToPlotArea?: boolean;
  constrainToContainer?: boolean;
  autoFlip?: boolean;
  
  // Theme
  theme?: string | Partial<TooltipTheme>;
  
  // Performance tuning (for large datasets)
  /**
   * How to find the nearest data point.
   * - 'nearest': Full euclidean distance (accurate but slower)
   * - 'x-only': Only match by X coordinate (fast, best for large datasets)
   * - 'auto': Automatically choose based on dataset size
   * Default: 'auto'
   */
  snapMode?: 'nearest' | 'x-only' | 'auto';
  
  /**
   * Number of data points above which to auto-enable X-only snap mode.
   * Default: 50000
   */
  largeDatasetThreshold?: number;
}

export interface DataPointTooltipOptions {
  enabled?: boolean;
  templateId?: string;
  snapToPoint?: boolean;
  hitRadius?: number;
  formatter?: TooltipFormatter<DataPointTooltip>;
}

export interface CrosshairTooltipOptions {
  enabled?: boolean;
  templateId?: string;
  interpolate?: boolean;
  visibleSeriesOnly?: boolean;
  formatter?: TooltipFormatter<CrosshairTooltip>;
}

export interface RangeTooltipOptions {
  enabled?: boolean;
  templateId?: string;
  calculateStats?: boolean;
  formatter?: TooltipFormatter<RangeTooltip>;
}

export interface AnnotationTooltipOptions {
  enabled?: boolean;
  templateId?: string;
  formatter?: TooltipFormatter<AnnotationTooltip>;
}

export interface HeatmapTooltipOptions {
  enabled?: boolean;
  templateId?: string;
  showColorInfo?: boolean;
  formatter?: TooltipFormatter<HeatmapTooltip>;
}

/** Custom formatter function for tooltip content */
export type TooltipFormatter<T extends TooltipData> = (
  data: T,
  defaultFormat: string
) => string | TooltipFormattedContent;

export interface TooltipFormattedContent {
  /** Title/header line */
  title?: string;
  /** Content lines */
  lines: TooltipLine[];
  /** Footer line */
  footer?: string;
}

export interface TooltipLine {
  /** Label (left side) */
  label: string;
  /** Value (right side) */
  value: string;
  /** Optional color indicator */
  color?: string;
  /** Optional icon */
  icon?: string;
}

// ============================================
// Tooltip Template
// ============================================

export interface TooltipTemplate<T extends TooltipData = TooltipData> {
  /** Unique template ID */
  readonly id: string;
  
  /** Display name */
  readonly name: string;
  
  /** Supported tooltip types */
  readonly supportedTypes: TooltipType[];
  
  /**
   * Measure the tooltip dimensions
   */
  measure(
    ctx: CanvasRenderingContext2D,
    data: T,
    theme: TooltipTheme
  ): TooltipMeasurement;
  
  /**
   * Render the tooltip to canvas
   */
  render(
    ctx: CanvasRenderingContext2D,
    data: T,
    position: TooltipPosition,
    theme: TooltipTheme
  ): void;
}

// ============================================
// Tooltip Events
// ============================================

export interface TooltipEventMap {
  /** Before tooltip shows */
  beforeShow: TooltipShowEvent;
  /** After tooltip shows */
  show: TooltipVisibilityEvent;
  /** Before tooltip hides */
  beforeHide: TooltipHideEvent;
  /** After tooltip hides */
  hide: TooltipVisibilityEvent;
  /** Tooltip data updated */
  update: TooltipUpdateEvent;
  /** Tooltip position changed */
  move: TooltipMoveEvent;
}

export interface TooltipShowEvent {
  tooltipId: string;
  data: TooltipData;
  position: TooltipPosition;
  cancel: () => void;
}

export interface TooltipHideEvent {
  tooltipId: string;
  cancel: () => void;
}

export interface TooltipVisibilityEvent {
  tooltipId: string;
}

export interface TooltipUpdateEvent {
  tooltipId: string;
  previousData: TooltipData;
  newData: TooltipData;
}

export interface TooltipMoveEvent {
  tooltipId: string;
  previousPosition: TooltipPosition;
  newPosition: TooltipPosition;
}

// ============================================
// Show Tooltip Options (Manual API)
// ============================================

export interface ShowTooltipOptions {
  /** Custom position (overrides automatic) */
  position?: { x: number; y: number };
  /** Template to use */
  templateId?: string;
  /** Duration before auto-hide (0 = no auto-hide) */
  duration?: number;
}
