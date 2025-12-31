/**
 * Chart Type Definitions
 * 
 * Interfaces for the Chart API and export options.
 */

import type {
  SeriesOptions,
  HeatmapOptions,
  SeriesUpdateData,
  ZoomOptions,
  CursorOptions,
  ChartEventMap,
  Bounds,
} from "../../types";
import type { Series } from "../Series";
import type { FitType, FitOptions } from "../../analysis";
import type { Annotation } from "../annotations";
import * as analysis from "../../analysis";

// ============================================
// Chart Interface
// ============================================

export interface Chart {
  addSeries(options: SeriesOptions | HeatmapOptions): void;
  addBar(options: Omit<SeriesOptions, "type">): void;
  addHeatmap(options: HeatmapOptions): void;
  removeSeries(id: string): void;
  updateSeries(id: string, data: SeriesUpdateData): void;
  getSeries(id: string): Series | undefined;
  getAllSeries(): Series[];
  appendData(id: string, x: number[] | Float32Array, y: number[] | Float32Array): void;
  setAutoScroll(enabled: boolean): void;
  setMaxPoints(id: string, maxPoints: number): void;
  addFitLine(seriesId: string, type: FitType, options?: FitOptions): string;
  zoom(options: ZoomOptions): void;
  pan(deltaX: number, deltaY: number): void;
  resetZoom(): void;
  getViewBounds(): Bounds;
  enableCursor(options: CursorOptions): void;
  disableCursor(): void;
  resize(width?: number, height?: number): void;
  render(): void;
  on<K extends keyof ChartEventMap>(
    event: K,
    handler: (data: ChartEventMap[K]) => void
  ): void;
  off<K extends keyof ChartEventMap>(
    event: K,
    handler: (data: ChartEventMap[K]) => void
  ): void;
  destroy(): void;
  exportImage(type?: "png" | "jpeg"): string;
  autoScale(): void;
  setTheme(theme: string | object): void;
  /** Access to data analysis utilities */
  readonly analysis: typeof analysis;
  // Annotation methods
  addAnnotation(annotation: Annotation): string;
  removeAnnotation(id: string): boolean;
  updateAnnotation(id: string, updates: Partial<Annotation>): void;
  getAnnotation(id: string): Annotation | undefined;
  getAnnotations(): Annotation[];
  clearAnnotations(): void;
  // Export methods
  exportCSV(options?: ExportOptions): string;
  exportJSON(options?: ExportOptions): string;
}

/** Options for data export */
export interface ExportOptions {
  /** Series IDs to export (default: all) */
  seriesIds?: string[];
  /** Include headers in CSV (default: true) */
  includeHeaders?: boolean;
  /** Decimal precision (default: 6) */
  precision?: number;
  /** CSV delimiter (default: ',') */
  delimiter?: string;
}

// ============================================
// Layout Constants
// ============================================

export const MARGINS = { top: 20, right: 30, bottom: 55, left: 75 };
