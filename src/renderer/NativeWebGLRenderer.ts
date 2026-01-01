/**
 * NativeWebGLRenderer - Zero-dependency WebGL renderer
 *
 * This renderer uses raw WebGL APIs without any external libraries.
 * Performance is identical (or slightly better) than regl since
 * we eliminate the abstraction layer overhead.
 *
 * Key optimizations:
 * - Pre-compiled shaders (compiled once, reused)
 * - Uniform updates via GPU (no buffer recreation for zoom/pan)
 * - Buffer pooling for dynamic data
 * - Minimal state changes per frame
 */

export { NativeWebGLRenderer } from "./native/NativeWebGLRenderer";

export {
  interleaveBandData,
  interleaveData,
  interleaveStepData,
  parseColor,
} from "./native/utils";

export type { NativeRenderOptions, NativeSeriesRenderData } from "./native/types";
