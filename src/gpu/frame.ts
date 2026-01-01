import type { GpuViewport, RGBA } from "./types";

/**
 * Frame uniforms passed to each render call
 */
export interface FrameUniforms {
  /** Viewport dimensions */
  viewport: GpuViewport;
  
  /** Background/clear color */
  clearColor: RGBA;
  
  /** Optional bounds for coordinate transforms */
  bounds?: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  
  /** Optional plot area for clipping */
  plotArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

