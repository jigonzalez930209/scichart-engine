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
export { createChart } from "./core/Chart";
export { Series } from "./core/Series";
export { EventEmitter } from "./core/EventEmitter";
export type { Chart, ChartOptions, ExportOptions } from "./core/Chart";

// ============================================
// Annotations
// ============================================
export { AnnotationManager } from "./core/annotations";
export type {
  Annotation,
  AnnotationType,
  HorizontalLineAnnotation,
  VerticalLineAnnotation,
  RectangleAnnotation,
  BandAnnotation,
  TextAnnotation,
  ArrowAnnotation,
} from "./core/annotations";

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
  StepMode,
  ErrorBarStyle,
  ErrorBarDirection,
  ScatterSymbol,
} from "./types";

// ============================================
// Scales
// ============================================
export { LinearScale, LogScale, createScale, type Scale } from "./scales";

// ============================================
// Renderer
// ============================================
export {
  NativeWebGLRenderer,
  interleaveData,
  parseColor,
  createRenderer,
  createNativeRenderer,
  WebGPURenderer,
  type WebGPURendererOptions,
  type IWebGLRenderer,
  type SeriesRenderData,
  type RenderOptions,
} from "./renderer";

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
} from "./theme";

// ============================================
// Overlay
// ============================================
export {
  OverlayRenderer,
} from "./core/OverlayRenderer";

export type {
  PlotArea,
  CursorState,
} from "./types";

// ============================================
// Tooltip System
// ============================================
export {
  TooltipManager,
  TOOLTIP_THEMES,
  getTooltipThemeForChartTheme,
} from "./core/tooltip";

export type {
  TooltipData,
  TooltipType,
  TooltipTheme,
  TooltipOptions,
  TooltipTemplate,
  DataPointTooltip,
  CrosshairTooltip,
  HeatmapTooltip,
} from "./core/tooltip";

// ============================================
// Downsampling
// ============================================
export {
  lttbDownsample,
  minMaxDownsample,
  calculateTargetPoints,
} from "./workers/downsample";

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
} from "./analysis";

// ============================================
// Streaming utilities
// ============================================
export {
  createWebSocketStream,
  connectStreamToChart,
  createMessageParser,
  createMockStream,
  type WebSocketStream,
  type WebSocketStreamConfig,
  type DataPoint,
  type StreamStats,
  type WebSocketState,
} from "./streaming";

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
} from "./react";

// ============================================
// GPU Abstraction Layer (Experimental)
// ============================================
export {
  // Backends
  WebGPUBackend,
  WebGLBackend,
  
  // Renderer facade
  GpuRenderer,
  createGpuRenderer,
  
  // Adapter utilities
  SeriesAdapter,
  parseColorToRGBA,
  
  // Resource management
  PipelineCache,
  BaseBufferStore,
  BaseTextureStore,
  
  // Benchmark
  GpuBenchmark,
  
  // GPU Compute
  GpuCompute,
} from "./gpu";

export type {
  // Core types
  GpuBackendType,
  RGBA,
  GpuViewport,
  GpuBackend,
  BufferId,
  TextureId,
  
  // Frame types
  FrameUniforms,
  
  // Draw types
  DrawKind,
  DrawCall,
  DrawList,
  PointSymbol,
  
  // Adapter types
  SeriesData as GpuSeriesData,
  Bounds as GpuBounds,
  GpuRenderOptions,
  GpuRendererOptions,
  BackendPreference,
  WebGPUBackendOptions,
  
  // Benchmark types
  BenchmarkResult,
  BenchmarkOptions,
  
  // Compute types
  DataStats as GpuDataStats,
  DataBounds as GpuDataBounds,
  Peak as GpuPeak,
  GpuComputeOptions,
} from "./gpu";

