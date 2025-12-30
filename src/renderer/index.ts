/**
 * Renderer module exports
 */

// Native WebGL Renderer (zero dependencies)
export {
  NativeWebGLRenderer,
  interleaveData,
  parseColor,
  type NativeSeriesRenderData,
  type NativeRenderOptions,
} from './NativeWebGLRenderer';

// Renderer Interface & Factory
export {
  type IWebGLRenderer,
  type SeriesRenderData,
  type RenderOptions,
  createRenderer,
  createNativeRenderer,
} from './RendererInterface';

export * from './shaders';
