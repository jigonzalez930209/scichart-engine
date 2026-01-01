/**
 * GPU Compute Index
 */

export { GpuCompute } from "./gpuCompute";
export type {
  DataStats,
  DataBounds,
  Peak,
  GpuComputeOptions,
} from "./gpuCompute";

export {
  STATS_COMPUTE_WGSL,
  MINMAX_COMPUTE_WGSL,
  DOWNSAMPLE_COMPUTE_WGSL,
  PEAK_DETECT_COMPUTE_WGSL,
} from "./shaders";
