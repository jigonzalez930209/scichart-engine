/**
 * GPU Abstraction Layer - Backend-agnostic GPU API
 * 
 * This module provides a unified interface for GPU rendering
 * that can work with WebGPU (primary) or WebGL (fallback).
 */

// =============================================================================
// Core Types
// =============================================================================

export type {
  GpuBackendType,
  RGBA,
  GpuViewport,
  GpuLimits,
  GpuBackendInfo,
  BufferId,
  TextureId,
  BufferUsage,
  BufferDescriptor,
  TextureFormat,
  Texture1DDescriptor,
  Dispose,
  GpuBackend,
} from "./types";

// =============================================================================
// Frame Uniforms
// =============================================================================

export type { FrameUniforms } from "./frame";

// =============================================================================
// Draw List Types
// =============================================================================

export type {
  DrawKind,
  CommonStyle,
  LineStyle,
  PointStyle,
  PointSymbol,
  HeatmapStyle,
  DrawStyle,
  DrawCall,
  DrawList,
} from "./drawList";

// =============================================================================
// Resource Management
// =============================================================================

export type {
  BufferEntry,
  IBufferStore,
  TextureEntry,
  ITextureStore,
  PipelineKind,
  PipelineKey,
  IPipelineCache,
} from "./resources";
export { BaseBufferStore, BaseTextureStore, PipelineCache } from "./resources";

// =============================================================================
// Adapter Layer
// =============================================================================

export {
  SeriesAdapter,
  parseColorToRGBA,
  GpuRenderer,
  createGpuRenderer,
} from "./adapter";
export type {
  SeriesData,
  SeriesStyle,
  Bounds,
  GpuSeriesRenderData,
  GpuRenderOptions,
  BackendPreference,
  GpuRendererOptions,
} from "./adapter";

// =============================================================================
// WebGPU Backend
// =============================================================================

export { WebGPUBackend } from "./backends/webgpu/WebGPUBackend";
export type { WebGPUBackendOptions } from "./backends/webgpu/WebGPUBackend";

// =============================================================================
// WebGL Backend (Fallback)
// =============================================================================

export { WebGLBackend } from "./backends/webgl/WebGLBackend";
export type { WebGLBackendOptions } from "./backends/webgl/WebGLBackend";

// =============================================================================
// Examples
// =============================================================================

export {
  runWebGPUTriangleDemo,
  runWebGPULineDemo,
  runWebGPUChartDemo,
} from "./examples";

// =============================================================================
// Benchmark
// =============================================================================

export { GpuBenchmark } from "./benchmark";
export type { BenchmarkResult, BenchmarkOptions } from "./benchmark";

// =============================================================================
// GPU Compute (WebGPU only)
// =============================================================================

export { GpuCompute } from "./compute";
export type {
  DataStats,
  DataBounds,
  Peak,
  GpuComputeOptions,
} from "./compute";

// =============================================================================
// Massive Data Rendering (100M+ points)
// =============================================================================

export { MassiveDataRenderer } from "./backends/webgpu/MassiveDataRenderer";
export type {
  MassiveDataConfig,
  RenderStats,
  LODLevel,
} from "./backends/webgpu/MassiveDataRenderer";

