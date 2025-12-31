/**
 * Chart Setup
 * 
 * Handles chart initialization, DOM setup, and configuration.
 */

import type { ChartOptions, AxisOptions } from "../../types";
import { parseColor } from "../../renderer/NativeWebGLRenderer";
import { LinearScale, LogScale, type Scale } from "../../scales";
import { DEFAULT_THEME, getThemeByName, type ChartTheme } from "../../theme";
import { MARGINS } from "./types";

export interface SetupResult {
  theme: ChartTheme;
  backgroundColor: [number, number, number, number];
  showLegend: boolean;
  showControls: boolean;
  autoScroll: boolean;
  showStatistics: boolean;
  dpr: number;
  xAxisOptions: AxisOptions;
  xScale: Scale;
  yAxisOptionsMap: Map<string, AxisOptions>;
  yScales: Map<string, Scale>;
  primaryYAxisId: string;
  webglCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  overlayCtx: CanvasRenderingContext2D;
}

/**
 * Initialize chart configuration from options
 */
export function initializeChart(
  container: HTMLDivElement,
  options: ChartOptions
): SetupResult {
  if (!container) throw new Error("[SciChart] Container element is required");

  const dpr = options.devicePixelRatio ?? window.devicePixelRatio;

  // Initialize theme
  const theme = typeof options.theme === "string"
    ? getThemeByName(options.theme)
    : (options.theme as ChartTheme) ?? DEFAULT_THEME;

  const bgColor = parseColor(options.background ?? theme.backgroundColor);
  const backgroundColor: [number, number, number, number] = [bgColor[0], bgColor[1], bgColor[2], bgColor[3]];
  const showLegend = options.showLegend ?? theme.legend.visible;
  const showControls = options.showControls ?? false;
  const autoScroll = options.autoScroll ?? false;
  const showStatistics = options.showStatistics ?? false;

  // X Axis
  const xAxisOptions: AxisOptions = { scale: "linear", auto: true, ...options.xAxis };
  const xScale = xAxisOptions.scale === "log" ? new LogScale() : new LinearScale();

  // Process Y Axes
  const yAxisOptionsMap = new Map<string, AxisOptions>();
  const yScales = new Map<string, Scale>();
  let primaryYAxisId = 'default';

  const providedYAxes = options.yAxis 
    ? (Array.isArray(options.yAxis) ? options.yAxis : [options.yAxis])
    : [{}];

  providedYAxes.forEach((axisOpt, index) => {
    const isFirst = index === 0;
    const defaultId = isFirst ? 'default' : `y${index}`;
    const id = axisOpt.id || defaultId;
    
    if (isFirst) primaryYAxisId = id;
    const position = axisOpt.position || (isFirst ? 'left' : 'right');
    const fullOptions: AxisOptions = { scale: "linear", auto: true, position, ...axisOpt, id };

    yAxisOptionsMap.set(id, fullOptions);
    yScales.set(id, fullOptions.scale === "log" ? new LogScale() : new LinearScale());
  });

  // Create DOM structure
  container.style.position = "relative";
  container.style.overflow = "hidden";
  container.style.backgroundColor = options.background ?? theme.backgroundColor;

  const webglCanvas = createCanvas("webgl");
  const overlayCanvas = createCanvas("overlay");

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  container.appendChild(webglCanvas);
  container.appendChild(overlayCanvas);

  const ctx = overlayCanvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  return {
    theme,
    backgroundColor,
    showLegend,
    showControls,
    autoScroll,
    showStatistics,
    dpr,
    xAxisOptions,
    xScale,
    yAxisOptionsMap,
    yScales,
    primaryYAxisId,
    webglCanvas,
    overlayCanvas,
    overlayCtx: ctx,
  };
}

/**
 * Create a canvas element
 */
export function createCanvas(type: "webgl" | "overlay"): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;";
  if (type === "overlay") canvas.style.pointerEvents = "none";
  return canvas;
}

/**
 * Calculate the plot area based on container size and margins
 */
export function getPlotArea(
  container: HTMLDivElement,
  yAxisOptionsMap: Map<string, AxisOptions>
): { x: number; y: number; width: number; height: number } {
  const rect = container.getBoundingClientRect();
  const leftAxisCount = Array.from(yAxisOptionsMap.values()).filter(a => a.position !== 'right').length;
  const rightAxisCount = Array.from(yAxisOptionsMap.values()).filter(a => a.position === 'right').length;
  const leftMargin = MARGINS.left + Math.max(0, leftAxisCount - 1) * 65;
  const rightMargin = MARGINS.right + rightAxisCount * 65;
  return {
    x: leftMargin,
    y: MARGINS.top,
    width: Math.max(1, rect.width - leftMargin - rightMargin),
    height: Math.max(1, rect.height - MARGINS.top - MARGINS.bottom),
  };
}

/**
 * Get axes layout for interaction manager
 */
export function getAxesLayout(
  yAxisOptionsMap: Map<string, AxisOptions>
): Array<{ id: string; position: 'left' | 'right'; offset: number }> {
  // Separate axes by position to calculate offset correctly
  const result: Array<{ id: string; position: 'left' | 'right'; offset: number }> = [];
  let leftIndex = 0;
  let rightIndex = 0;

  yAxisOptionsMap.forEach((opts, id) => {
    const position = (opts.position === 'right' ? 'right' : 'left') as 'left' | 'right';
    const offset = position === 'left' ? leftIndex * 65 : rightIndex * 65;
    
    if (position === 'left') leftIndex++;
    else rightIndex++;

    result.push({ id, position, offset });
  });

  return result;
}

/**
 * Resize canvases to match container
 */
export function resizeCanvases(
  container: HTMLDivElement,
  webglCanvas: HTMLCanvasElement,
  overlayCanvas: HTMLCanvasElement,
  overlayCtx: CanvasRenderingContext2D,
  dpr: number
): boolean {
  const rect = container.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;

  const w = rect.width * dpr;
  const h = rect.height * dpr;

  [webglCanvas, overlayCanvas].forEach((c) => {
    c.width = w;
    c.height = h;
  });

  overlayCtx.scale(dpr, dpr);
  return true;
}
