/**
 * Adapter Index - Export all adapter utilities
 */

export { 
  SeriesAdapter,
  parseColorToRGBA,
} from "./seriesAdapter";
export type {
  SeriesData,
  SeriesStyle,
} from "./seriesAdapter";

export {
  GpuRenderer,
  createGpuRenderer,
} from "./gpuRenderer";
export type {
  Bounds,
  GpuSeriesRenderData,
  GpuRenderOptions,
  BackendPreference,
  GpuRendererOptions,
} from "./gpuRenderer";
