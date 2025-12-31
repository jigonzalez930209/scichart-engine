/**
 * Chart Export Utilities
 * 
 * Handles exporting chart data to various formats (CSV, JSON, Image).
 */

import type { Series } from "../Series";
import type { Bounds } from "../../types";
import type { ExportOptions } from "./types";

/**
 * Export series data to CSV format
 */
export function exportToCSV(
  series: Series[],
  options?: ExportOptions
): string {
  const {
    seriesIds,
    includeHeaders = true,
    precision = 6,
    delimiter = ','
  } = options ?? {};

  const seriesToExport = seriesIds
    ? series.filter(s => seriesIds.includes(s.getId()))
    : series;

  if (seriesToExport.length === 0) return '';

  const lines: string[] = [];

  // Generate headers
  if (includeHeaders) {
    const headers: string[] = [];
    seriesToExport.forEach(s => {
      headers.push(`${s.getId()}_x`, `${s.getId()}_y`);
    });
    lines.push(headers.join(delimiter));
  }

  // Find max length
  const maxLength = Math.max(...seriesToExport.map(s => s.getPointCount()));

  // Generate data rows
  for (let i = 0; i < maxLength; i++) {
    const row: string[] = [];
    seriesToExport.forEach(s => {
      const data = s.getData();
      if (data && i < data.x.length) {
        row.push(data.x[i].toFixed(precision), data.y[i].toFixed(precision));
      } else {
        row.push('', '');
      }
    });
    lines.push(row.join(delimiter));
  }

  return lines.join('\n');
}

/**
 * Export series data to JSON format
 */
export function exportToJSON(
  series: Series[],
  viewBounds: Bounds,
  options?: ExportOptions
): string {
  const { seriesIds, precision = 6 } = options ?? {};

  const seriesToExport = seriesIds
    ? series.filter(s => seriesIds.includes(s.getId()))
    : series;

  const result: Record<string, { 
    id: string;
    type: string;
    style: object;
    data: { x: number[]; y: number[] };
    pointCount: number;
  }> = {};

  seriesToExport.forEach(s => {
    const data = s.getData();
    result[s.getId()] = {
      id: s.getId(),
      type: s.getType(),
      style: s.getStyle(),
      data: {
        x: data ? Array.from(data.x).map(v => parseFloat(v.toFixed(precision))) : [],
        y: data ? Array.from(data.y).map(v => parseFloat(v.toFixed(precision))) : [],
      },
      pointCount: s.getPointCount()
    };
  });

  return JSON.stringify({
    exportDate: new Date().toISOString(),
    chartBounds: viewBounds,
    series: result
  }, null, 2);
}

/**
 * Export chart to image
 */
export function exportToImage(
  webglCanvas: HTMLCanvasElement,
  overlayCanvas: HTMLCanvasElement,
  backgroundColor: [number, number, number, number],
  legend: { draw: (ctx: CanvasRenderingContext2D, dpr: number) => void } | null,
  showLegend: boolean,
  dpr: number,
  type: "png" | "jpeg" = "png"
): string {
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = overlayCanvas.width;
  finalCanvas.height = overlayCanvas.height;
  const ctx = finalCanvas.getContext("2d");
  if (!ctx) return "";

  // 1. Fill background
  const bg = backgroundColor;
  ctx.fillStyle = `rgba(${Math.round(bg[0] * 255)}, ${Math.round(
    bg[1] * 255
  )}, ${Math.round(bg[2] * 255)}, ${bg[3]})`;
  ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

  // 2. Draw WebGL plot area
  ctx.drawImage(webglCanvas, 0, 0);

  // 3. Draw Overlay (Axes, Grid, Labels)
  ctx.drawImage(overlayCanvas, 0, 0);

  // 4. Draw Legend (if exists and visible)
  if (legend && showLegend) {
    legend.draw(ctx, dpr);
  }

  return finalCanvas.toDataURL(`image/${type}`);
}
