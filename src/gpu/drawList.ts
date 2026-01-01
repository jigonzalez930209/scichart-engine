import type { BufferId, TextureId, RGBA } from "./types";

/**
 * Draw kinds matching the original NativeWebGLRenderer series types
 */
export type DrawKind =
  | "triangles"
  | "line"
  | "points"
  | "scatter"
  | "line+scatter"
  | "step"
  | "step+scatter"
  | "band"
  | "bar"
  | "heatmap";

/**
 * Common style properties for all draw calls
 */
export interface CommonStyle {
  color?: RGBA;
  opacity?: number;
}

/**
 * Style for line-type series
 */
export interface LineStyle extends CommonStyle {
  lineWidth?: number;
}

/**
 * Point symbol types matching the original implementation
 */
export type PointSymbol =
  | "circle"
  | "square"
  | "diamond"
  | "triangle"
  | "triangleDown"
  | "cross"
  | "x"
  | "star";

/**
 * Style for point/scatter-type series
 */
export interface PointStyle extends CommonStyle {
  pointSize?: number;
  symbol?: PointSymbol;
}

/**
 * Style for heatmap-type series
 */
export interface HeatmapStyle {
  zBounds?: { min: number; max: number };
  colormap?: string;
}

/**
 * Combined style type
 */
export type DrawStyle = CommonStyle | LineStyle | PointStyle | HeatmapStyle;

/**
 * A single draw call in the draw list
 */
export interface DrawCall {
  /** Unique identifier for this draw call */
  id: string;
  
  /** Type of primitive to draw */
  kind: DrawKind;
  
  /** Reference to the vertex buffer */
  bufferId: BufferId;
  
  /** Number of vertices/instances to draw */
  count: number;
  
  /** Whether this draw call should be rendered */
  visible: boolean;
  
  /** Styling properties */
  style?: DrawStyle;

  /** Reference to texture (for heatmaps) */
  textureId?: TextureId;
  
  /** Step buffer for step charts */
  stepBufferId?: BufferId;
  stepCount?: number;
  
  /** Optional Y-bounds override for multi-axis support */
  yBounds?: { min: number; max: number };
}

/**
 * The draw list contains all draw calls for a frame
 */
export interface DrawList {
  items: DrawCall[];
}
