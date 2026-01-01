/**
 * Series Adapter - Converts SciChart series data to GPU DrawCalls
 * 
 * This adapter bridges the gap between the existing SciChart series system
 * and the new backend-agnostic GPU abstraction layer.
 */

import type { 
  DrawCall, 
  DrawList, 
  DrawKind, 
  PointStyle,
  HeatmapStyle,
} from "../drawList";
import type { GpuBackend, BufferId, TextureId, RGBA } from "../types";

/**
 * Series style from the original renderer
 */
export interface SeriesStyle {
  color?: string | RGBA;
  opacity?: number;
  lineWidth?: number;
  pointSize?: number;
  symbol?: string;
}

/**
 * Series render data from the chart system
 */
export interface SeriesData {
  id: string;
  type: "line" | "scatter" | "line+scatter" | "step" | "step+scatter" | "band" | "bar" | "heatmap";
  visible: boolean;
  
  /** Main vertex data */
  data: Float32Array;
  
  /** Style properties */
  style: SeriesStyle;
  
  /** For step charts */
  stepData?: Float32Array;
  
  /** Y-axis bounds for multi-axis support */
  yBounds?: { min: number; max: number };
  
  /** For heatmaps */
  zBounds?: { min: number; max: number };
  colormapData?: Uint8Array;
  colormap?: string;
}

/**
 * Mutable color tuple for internal use
 */
type MutableRGBA = [number, number, number, number];

/**
 * Parse color from various formats to RGBA
 */
export function parseColorToRGBA(color: string | RGBA | undefined): MutableRGBA {
  if (!color) {
    return [1, 0, 0.3, 1]; // Default magenta
  }
  
  // If already an RGBA tuple, return a copy
  if (Array.isArray(color)) {
    return [color[0], color[1], color[2], color[3] ?? 1];
  }
  
  // At this point, color must be a string
  const colorStr = color as string;
  
  // Parse hex color
  if (colorStr.startsWith("#")) {
    const hex = colorStr.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16) / 255;
      const g = parseInt(hex[1] + hex[1], 16) / 255;
      const b = parseInt(hex[2] + hex[2], 16) / 255;
      return [r, g, b, 1];
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return [r, g, b, 1];
    }
    if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return [r, g, b, a];
    }
  }
  
  // Parse rgb/rgba
  const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]) / 255;
    const g = parseInt(rgbaMatch[2]) / 255;
    const b = parseInt(rgbaMatch[3]) / 255;
    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
    return [r, g, b, a];
  }
  
  return [1, 0, 0.3, 1]; // Fallback
}

/**
 * Map series type to draw kind
 */
function mapSeriesTypeToDrawKind(type: SeriesData["type"]): DrawKind {
  return type as DrawKind;
}

/**
 * Convert SeriesStyle to GPU styles
 */
function convertStyle(style: SeriesStyle, type: SeriesData["type"]): DrawCall["style"] {
  const baseColor = parseColorToRGBA(style.color);
  const opacity = style.opacity ?? 1;
  const color: MutableRGBA = [baseColor[0], baseColor[1], baseColor[2], baseColor[3] * opacity];
  
  if (type === "scatter" || type === "line+scatter" || type === "step+scatter") {
    return {
      color: color as RGBA,
      opacity,
      pointSize: style.pointSize ?? 4,
      symbol: (style.symbol ?? "circle") as PointStyle["symbol"],
    } as PointStyle;
  }
  
  return {
    color: color as RGBA,
    opacity,
    lineWidth: style.lineWidth ?? 1,
  };
}

/**
 * Series Adapter class
 * 
 * Manages the conversion of chart series to GPU resources and draw calls.
 */
export class SeriesAdapter {
  private backend: GpuBackend;
  private seriesBufferMap = new Map<string, BufferId>();
  private seriesStepBufferMap = new Map<string, BufferId>();
  private seriesTextureMap = new Map<string, TextureId>();
  
  constructor(backend: GpuBackend) {
    this.backend = backend;
  }
  
  /**
   * Get buffer ID for a series
   */
  private getBufferId(seriesId: string): BufferId {
    if (!this.seriesBufferMap.has(seriesId)) {
      this.seriesBufferMap.set(seriesId, `series:${seriesId}`);
    }
    return this.seriesBufferMap.get(seriesId)!;
  }
  
  /**
   * Get step buffer ID for a series
   */
  private getStepBufferId(seriesId: string): BufferId {
    if (!this.seriesStepBufferMap.has(seriesId)) {
      this.seriesStepBufferMap.set(seriesId, `series:${seriesId}:step`);
    }
    return this.seriesStepBufferMap.get(seriesId)!;
  }
  
  /**
   * Get texture ID for a series
   */
  private getTextureId(seriesId: string): TextureId {
    if (!this.seriesTextureMap.has(seriesId)) {
      this.seriesTextureMap.set(seriesId, `texture:${seriesId}`);
    }
    return this.seriesTextureMap.get(seriesId)!;
  }
  
  /**
   * Update series data in GPU buffers
   */
  updateSeries(series: SeriesData): void {
    const bufferId = this.getBufferId(series.id);
    
    // Update main buffer
    this.backend.createOrUpdateBuffer(bufferId, series.data, { usage: "vertex" });
    
    // Update step buffer if present
    if (series.stepData && (series.type === "step" || series.type === "step+scatter")) {
      const stepBufferId = this.getStepBufferId(series.id);
      this.backend.createOrUpdateBuffer(stepBufferId, series.stepData, { usage: "vertex" });
    }
    
    // Update colormap texture if present
    if (series.type === "heatmap" && series.colormapData) {
      const textureId = this.getTextureId(series.id);
      this.backend.createOrUpdateTexture1D(textureId, series.colormapData, {
        width: series.colormapData.length / 4,
      });
    }
  }
  
  /**
   * Remove a series from GPU resources
   */
  removeSeries(seriesId: string): void {
    const bufferId = this.seriesBufferMap.get(seriesId);
    if (bufferId) {
      this.backend.deleteBuffer(bufferId);
      this.seriesBufferMap.delete(seriesId);
    }
    
    const stepBufferId = this.seriesStepBufferMap.get(seriesId);
    if (stepBufferId) {
      this.backend.deleteBuffer(stepBufferId);
      this.seriesStepBufferMap.delete(seriesId);
    }
    
    const textureId = this.seriesTextureMap.get(seriesId);
    if (textureId) {
      this.backend.deleteTexture(textureId);
      this.seriesTextureMap.delete(seriesId);
    }
  }
  
  /**
   * Build draw list from series array
   */
  buildDrawList(seriesArray: SeriesData[]): DrawList {
    const items: DrawCall[] = [];
    
    for (const series of seriesArray) {
      // Update GPU resources
      this.updateSeries(series);
      
      const bufferId = this.getBufferId(series.id);
      const pointCount = series.data.length / 2; // Assuming x,y pairs
      
      const drawCall: DrawCall = {
        id: series.id,
        kind: mapSeriesTypeToDrawKind(series.type),
        bufferId,
        count: series.type === "heatmap" ? series.data.length / 3 : pointCount,
        visible: series.visible,
        style: convertStyle(series.style, series.type),
        yBounds: series.yBounds,
      };
      
      // Step buffer
      if (series.stepData && (series.type === "step" || series.type === "step+scatter")) {
        drawCall.stepBufferId = this.getStepBufferId(series.id);
        drawCall.stepCount = series.stepData.length / 2;
      }
      
      // Heatmap texture
      if (series.type === "heatmap") {
        drawCall.textureId = this.getTextureId(series.id);
        (drawCall.style as HeatmapStyle) = {
          zBounds: series.zBounds,
          colormap: series.colormap,
        };
      }
      
      items.push(drawCall);
    }
    
    return { items };
  }
  
  /**
   * Cleanup all resources
   */
  destroy(): void {
    for (const bufferId of this.seriesBufferMap.values()) {
      this.backend.deleteBuffer(bufferId);
    }
    for (const stepBufferId of this.seriesStepBufferMap.values()) {
      this.backend.deleteBuffer(stepBufferId);
    }
    for (const textureId of this.seriesTextureMap.values()) {
      this.backend.deleteTexture(textureId);
    }
    
    this.seriesBufferMap.clear();
    this.seriesStepBufferMap.clear();
    this.seriesTextureMap.clear();
  }
}
