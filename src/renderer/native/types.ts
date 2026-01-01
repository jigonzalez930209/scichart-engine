import type { Bounds } from "../../types";

// ============================================
// Types
// ============================================

export interface NativeSeriesRenderData {
  id: string;
  buffer: WebGLBuffer;
  count: number;
  style: any; // Using any to support both SeriesStyle and HeatmapStyle
  visible: boolean;
  type:
    | "line"
    | "scatter"
    | "line+scatter"
    | "step"
    | "step+scatter"
    | "band"
    | "bar"
    | "heatmap"
    | "candlestick";
  /** For step types: pre-computed step buffer */
  stepBuffer?: WebGLBuffer;
  stepCount?: number;
  /** Optional specific Y-bounds for this series (overrides global bounds) */
  yBounds?: { min: number; max: number };
  /** Heatmap specific */
  zBounds?: { min: number; max: number };
  colormap?: string;
  colormapTexture?: WebGLTexture;
}

export interface NativeRenderOptions {
  bounds: Bounds;
  backgroundColor?: [number, number, number, number];
  plotArea?: { x: number; y: number; width: number; height: number };
}

export interface ShaderProgram {
  program: WebGLProgram;
  attributes: {
    position: number;
    value?: number;
  };
  uniforms: {
    uScale: WebGLUniformLocation;
    uTranslate: WebGLUniformLocation;
    uColor: WebGLUniformLocation | null;
    uPointSize: WebGLUniformLocation | null;
    uSymbol: WebGLUniformLocation | null;
    uMinValue: WebGLUniformLocation | null;
    uMaxValue: WebGLUniformLocation | null;
    uColormap: WebGLUniformLocation | null;
  };
}

export type ProgramMode = "line" | "point" | "heatmap";

export interface ProgramBundle {
  lineProgram: ShaderProgram;
  pointProgram: ShaderProgram;
  heatmapProgram: ShaderProgram;
}
