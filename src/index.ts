/**
 * SciChart Engine - Scientific Charting for Electrochemistry
 *
 * A high-performance WebGL-based charting engine designed specifically
 * for electrochemical data visualization.
 *
 * Features:
 * - 10⁵–10⁶ points at 60 FPS
 * - Zoom/pan via GPU uniforms (no buffer recreation)
 * - Scientific precision with Float32/Float64 arrays
 * - Domain-specific features for electrochemistry
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
// Electrochemistry utilities
// ============================================
export {
  formatWithPrefix,
  formatPotential,
  formatCurrent,
  getBestPrefix,
  detectCycles,
  generateCycleColors,
  detectPeaks,
  validateData,
} from './electrochemistry';

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
