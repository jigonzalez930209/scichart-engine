/**
 * WebGL Renderer Interface & Factory
 *
 * This module provides a common interface for WebGL rendering.
 * Currently optimized for NativeWebGLRenderer (zero dependencies).
 */

import type { Bounds, SeriesStyle } from '../types';
import { NativeWebGLRenderer } from './NativeWebGLRenderer';

// ============================================
// Common Types
// ============================================

export interface SeriesRenderData {
  id: string;
  buffer: WebGLBuffer;
  count: number;
  style: SeriesStyle;
  visible: boolean;
  type: 'line' | 'scatter';
}

export interface RenderOptions {
  bounds: Bounds;
  backgroundColor?: [number, number, number, number];
}

// ============================================
// Renderer Interface
// ============================================

/**
 * Common interface for all WebGL renderer implementations
 */
export interface IWebGLRenderer {
  /** Check if WebGL is available and initialized */
  readonly available: boolean;

  /**
   * Create or update a GPU buffer with interleaved X,Y data
   * @param id - Unique buffer identifier
   * @param data - Interleaved Float32Array [x0, y0, x1, y1, ...]
   */
  createBuffer(id: string, data: Float32Array): void;

  /**
   * Get a buffer by ID
   */
  getBuffer(id: string): WebGLBuffer | undefined;

  /**
   * Delete a buffer and free GPU memory
   */
  deleteBuffer(id: string): void;

  /**
   * Render a frame with all visible series
   */
  render(series: SeriesRenderData[], options: RenderOptions): void;

  /**
   * Handle canvas resize
   */
  resize(): void;

  /**
   * Get WebGL capabilities/limits
   */
  getLimits(): Record<string, unknown>;

  /**
   * Cleanup and destroy all GPU resources
   */
  destroy(): void;
}

// ============================================
// Factory Functions
// ============================================

/**
 * Create a WebGL renderer (Native WebGL)
 *
 * @param canvas - Target canvas element
 */
export function createRenderer(canvas: HTMLCanvasElement): IWebGLRenderer {
  return new NativeWebGLRenderer(canvas);
}

/**
 * Create a renderer synchronously (native only)
 */
export { NativeWebGLRenderer as createNativeRenderer } from './NativeWebGLRenderer';
