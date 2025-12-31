/**
 * Chart - Main SciChart Engine Entry Point
 * 
 * This file re-exports the chart API from the modular implementation.
 * For the core implementation, see ./chart/ChartCore.ts
 */

// Re-export types
export type { Chart, ExportOptions } from "./chart/types";
export { MARGINS } from "./chart/types";

// Re-export factory
export { createChart, ChartImpl } from "./chart/ChartCore";

// Re-export utilities for advanced usage
export { exportToCSV, exportToJSON, exportToImage } from "./chart/ChartExporter";
export { applyZoom, applyPan, autoScaleAll } from "./chart/ChartNavigation";
export type { NavigationContext } from "./chart/ChartNavigation";
export type { RenderContext } from "./chart/ChartRenderer";

// Re-export from main types for backwards compatibility
export type { ChartOptions } from "../types";
