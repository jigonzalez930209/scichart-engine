/**
 * SciChart Engine - High-Performance Scientific Charting
 *
 * A WebGL-based charting engine designed for scientific data visualization
 * and high-performance rendering of large datasets.
 *
 * Features:
 * - 10⁵–10⁶ points at 60 FPS
 * - Zoom/pan via GPU uniforms (no buffer recreation)
 * - Scientific precision with Float32/Float64 arrays
 * - Data analysis utilities (peak detection, cycle detection, etc.)
 *
 * @packageDocumentation
 */

// ============================================
// Core exports
// ============================================
export { createChart } from './core/Chart';
export { Series } from './core/Series';
export { EventEmitter } from './core/EventEmitter';
export type { Chart, ChartOptions } from './core/Chart';

// ============================================
// Types
// ============================================
export type {
  AxisOptions,
  SeriesOptions,
  SeriesData,
  SeriesStyle,
  SeriesUpdateData,
  ZoomOptions,
  CursorOptions,
  ChartEventMap,
  Point,
  Bounds,
  Range,
  ScaleType,
  SeriesType,
} from './types';

// ============================================
// Scales
// ============================================
export { LinearScale, LogScale, createScale, type Scale } from './scales';

// ============================================
// Renderer
// ============================================
export {
  NativeWebGLRenderer,
  interleaveData,
  parseColor,
  createRenderer,
  createNativeRenderer,
  type IWebGLRenderer,
  type SeriesRenderData,
  type RenderOptions,
} from './renderer';

// ============================================
// Theme
// ============================================
export {
  DARK_THEME,
  LIGHT_THEME,
  MIDNIGHT_THEME,
  ELECTROCHEM_THEME,
  DEFAULT_THEME,
  createTheme,
  getThemeByName,
  type ChartTheme,
  type GridTheme,
  type AxisTheme,
  type LegendTheme,
  type CursorTheme,
} from './theme';

// ============================================
// Overlay
// ============================================
export {
  OverlayRenderer,
  type PlotArea,
  type CursorState,
} from './core/OverlayRenderer';

// ============================================
// Downsampling
// ============================================
export {
  lttbDownsample,
  minMaxDownsample,
  calculateTargetPoints,
} from './workers/downsample';

// ============================================
// Data Analysis utilities
// ============================================
export {
  formatWithPrefix,
  formatValue,
  formatScientific,
  getBestPrefix,
  detectCycles,
  generateCycleColors,
  detectPeaks,
  validateData,
  calculateStats,
  movingAverage,
  downsampleLTTB,
  type CycleInfo,
  type Peak,
  type PrefixInfo,
  type ValidationResult,
  type DataStats,
} from './analysis';

// Legacy exports for backward compatibility
export {
  formatWithPrefix as formatPotential,
  formatWithPrefix as formatCurrent,
} from './analysis';

// ============================================
// React bindings
// ============================================
export {
  SciChart,
  useSciChart,
  type SciChartProps,
  type SciChartRef,
  type SciChartSeries,
  type UseSciChartOptions,
  type UseSciChartReturn,
} from './react';
