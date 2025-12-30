/**
 * Canvas Overlay - 2D Canvas layer for axes, cursors, and annotations
 *
 * This layer sits on top of the WebGL canvas and handles all text/UI rendering.
 * WebGL is terrible for text, so we use a separate Canvas 2D context.
 */

import type { Bounds } from '../types';
import type { Scale } from '../scales';

export interface OverlayTheme {
  /** Background color (usually transparent) */
  background: string;
  /** Axis line color */
  axisColor: string;
  /** Tick mark color */
  tickColor: string;
  /** Label text color */
  labelColor: string;
  /** Grid line color */
  gridColor: string;
  /** Cursor line color */
  cursorColor: string;
  /** Font family */
  fontFamily: string;
  /** Base font size */
  fontSize: number;
}

export const DEFAULT_THEME: OverlayTheme = {
  background: 'transparent',
  axisColor: '#888888',
  tickColor: '#888888',
  labelColor: '#cccccc',
  gridColor: 'rgba(255, 255, 255, 0.1)',
  cursorColor: 'rgba(255, 255, 255, 0.5)',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 11,
};

export interface AxisConfig {
  /** Axis label (e.g., 'E / V') */
  label?: string;
  /** Tick values to draw */
  ticks?: number[];
  /** Format function for tick labels */
  tickFormat?: (value: number) => string;
  /** Show grid lines */
  showGrid?: boolean;
}

export interface CursorState {
  /** Cursor enabled */
  enabled: boolean;
  /** Cursor X position in pixels */
  x: number;
  /** Cursor Y position in pixels */
  y: number;
  /** Show crosshair */
  crosshair: boolean;
  /** Tooltip text */
  tooltip?: string;
}

/**
 * Canvas Overlay manages the 2D rendering layer
 */
export class CanvasOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private theme: OverlayTheme;

  // Layout constants
  private readonly MARGIN = {
    top: 20,
    right: 20,
    bottom: 50,
    left: 70,
  };

  constructor(
    parentElement: HTMLElement,
    theme: Partial<OverlayTheme> = {}
  ) {
    this.theme = { ...DEFAULT_THEME, ...theme };
    this.dpr = window.devicePixelRatio || 1;

    // Create overlay canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none'; // Allow clicks through
    this.canvas.style.zIndex = '10';

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context for overlay');
    }
    this.ctx = ctx;

    parentElement.style.position = 'relative';
    parentElement.appendChild(this.canvas);

    this.resize();
  }

  /**
   * Resize the overlay canvas
   */
  resize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;

    this.ctx.scale(this.dpr, this.dpr);
  }

  /**
   * Get the plot area (excluding margins)
   */
  getPlotArea(): { x: number; y: number; width: number; height: number } {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0, width: 0, height: 0 };

    return {
      x: this.MARGIN.left,
      y: this.MARGIN.top,
      width: rect.width - this.MARGIN.left - this.MARGIN.right,
      height: rect.height - this.MARGIN.top - this.MARGIN.bottom,
    };
  }

  /**
   * Clear the overlay
   */
  clear(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    this.ctx.clearRect(0, 0, rect.width, rect.height);
  }

  /**
   * Render axes
   */
  renderAxes(
    bounds: Bounds,
    xAxis: AxisConfig = {},
    yAxis: AxisConfig = {},
    xScale?: Scale,
    yScale?: Scale
  ): void {
    const plotArea = this.getPlotArea();
    const { ctx } = this;
    ctx.save();

    // Generate ticks if not provided
    const xTicks = xAxis.ticks ?? xScale?.ticks(8) ?? this.generateTicks(bounds.xMin, bounds.xMax, 8);
    const yTicks = yAxis.ticks ?? yScale?.ticks(6) ?? this.generateTicks(bounds.yMin, bounds.yMax, 6);

    // Draw grid if enabled
    if (xAxis.showGrid || yAxis.showGrid) {
      this.renderGrid(plotArea, bounds, xTicks, yTicks, xAxis.showGrid, yAxis.showGrid);
    }

    // Draw X axis
    this.renderXAxis(plotArea, bounds, xTicks, xAxis);

    // Draw Y axis
    this.renderYAxis(plotArea, bounds, yTicks, yAxis);

    // Draw axis labels
    if (xAxis.label) {
      this.renderXAxisLabel(plotArea, xAxis.label);
    }
    if (yAxis.label) {
      this.renderYAxisLabel(plotArea, yAxis.label);
    }

    ctx.restore();
  }

  private renderGrid(
    plotArea: { x: number; y: number; width: number; height: number },
    bounds: Bounds,
    xTicks: number[],
    yTicks: number[],
    showXGrid = true,
    showYGrid = true
  ): void {
    const { ctx, theme } = this;

    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Vertical grid lines (X ticks)
    if (showXGrid) {
      xTicks.forEach((tick) => {
        const x = this.dataToPixelX(tick, bounds, plotArea);
        if (x >= plotArea.x && x <= plotArea.x + plotArea.width) {
          ctx.beginPath();
          ctx.moveTo(x, plotArea.y);
          ctx.lineTo(x, plotArea.y + plotArea.height);
          ctx.stroke();
        }
      });
    }

    // Horizontal grid lines (Y ticks)
    if (showYGrid) {
      yTicks.forEach((tick) => {
        const y = this.dataToPixelY(tick, bounds, plotArea);
        if (y >= plotArea.y && y <= plotArea.y + plotArea.height) {
          ctx.beginPath();
          ctx.moveTo(plotArea.x, y);
          ctx.lineTo(plotArea.x + plotArea.width, y);
          ctx.stroke();
        }
      });
    }

    ctx.setLineDash([]);
  }

  private renderXAxis(
    plotArea: { x: number; y: number; width: number; height: number },
    bounds: Bounds,
    ticks: number[],
    config: AxisConfig
  ): void {
    const { ctx, theme } = this;
    const axisY = plotArea.y + plotArea.height;

    // Axis line
    ctx.strokeStyle = theme.axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotArea.x, axisY);
    ctx.lineTo(plotArea.x + plotArea.width, axisY);
    ctx.stroke();

    // Ticks and labels
    ctx.fillStyle = theme.labelColor;
    ctx.font = `${theme.fontSize}px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const formatTick = config.tickFormat ?? ((v) => this.formatNumber(v));

    ticks.forEach((tick) => {
      const x = this.dataToPixelX(tick, bounds, plotArea);

      if (x >= plotArea.x && x <= plotArea.x + plotArea.width) {
        // Tick mark
        ctx.beginPath();
        ctx.moveTo(x, axisY);
        ctx.lineTo(x, axisY + 5);
        ctx.stroke();

        // Label
        ctx.fillText(formatTick(tick), x, axisY + 8);
      }
    });
  }

  private renderYAxis(
    plotArea: { x: number; y: number; width: number; height: number },
    bounds: Bounds,
    ticks: number[],
    config: AxisConfig
  ): void {
    const { ctx, theme } = this;
    const axisX = plotArea.x;

    // Axis line
    ctx.strokeStyle = theme.axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(axisX, plotArea.y);
    ctx.lineTo(axisX, plotArea.y + plotArea.height);
    ctx.stroke();

    // Ticks and labels
    ctx.fillStyle = theme.labelColor;
    ctx.font = `${theme.fontSize}px ${theme.fontFamily}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const formatTick = config.tickFormat ?? ((v) => this.formatScientific(v));

    ticks.forEach((tick) => {
      const y = this.dataToPixelY(tick, bounds, plotArea);

      if (y >= plotArea.y && y <= plotArea.y + plotArea.height) {
        // Tick mark
        ctx.beginPath();
        ctx.moveTo(axisX, y);
        ctx.lineTo(axisX - 5, y);
        ctx.stroke();

        // Label
        ctx.fillText(formatTick(tick), axisX - 8, y);
      }
    });
  }

  private renderXAxisLabel(
    plotArea: { x: number; y: number; width: number; height: number },
    label: string
  ): void {
    const { ctx, theme } = this;

    ctx.fillStyle = theme.labelColor;
    ctx.font = `${theme.fontSize + 1}px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const x = plotArea.x + plotArea.width / 2;
    const y = plotArea.y + plotArea.height + 40;

    ctx.fillText(label, x, y);
  }

  private renderYAxisLabel(
    plotArea: { x: number; y: number; width: number; height: number },
    label: string
  ): void {
    const { ctx, theme } = this;

    ctx.save();
    ctx.fillStyle = theme.labelColor;
    ctx.font = `${theme.fontSize + 1}px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const x = 15;
    const y = plotArea.y + plotArea.height / 2;

    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  /**
   * Render cursor/crosshair
   */
  renderCursor(cursor: CursorState): void {
    if (!cursor.enabled) return;

    const plotArea = this.getPlotArea();
    const { ctx, theme } = this;

    ctx.save();
    ctx.strokeStyle = theme.cursorColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Clip to plot area
    ctx.beginPath();
    ctx.rect(plotArea.x, plotArea.y, plotArea.width, plotArea.height);
    ctx.clip();

    if (cursor.crosshair) {
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(cursor.x, plotArea.y);
      ctx.lineTo(cursor.x, plotArea.y + plotArea.height);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(plotArea.x, cursor.y);
      ctx.lineTo(plotArea.x + plotArea.width, cursor.y);
      ctx.stroke();
    } else {
      // Just vertical line
      ctx.beginPath();
      ctx.moveTo(cursor.x, plotArea.y);
      ctx.lineTo(cursor.x, plotArea.y + plotArea.height);
      ctx.stroke();
    }

    ctx.restore();

    // Tooltip
    if (cursor.tooltip) {
      this.renderTooltip(cursor.x, cursor.y, cursor.tooltip);
    }
  }

  /**
   * Render tooltip
   */
  renderTooltip(x: number, y: number, text: string): void {
    const { ctx, theme } = this;
    const plotArea = this.getPlotArea();
    const lines = text.split('\n');
    const lineHeight = theme.fontSize + 4;
    const padding = 8;

    // Measure text
    ctx.font = `${theme.fontSize}px ${theme.fontFamily}`;
    let maxWidth = 0;
    lines.forEach((line) => {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    });

    const boxWidth = maxWidth + padding * 2;
    const boxHeight = lines.length * lineHeight + padding * 2 - 4;

    // Position tooltip (avoid edges)
    let tooltipX = x + 10;
    let tooltipY = y - boxHeight - 10;

    if (tooltipX + boxWidth > plotArea.x + plotArea.width) {
      tooltipX = x - boxWidth - 10;
    }
    if (tooltipY < plotArea.y) {
      tooltipY = y + 10;
    }

    // Draw background
    ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, boxWidth, boxHeight, 4);
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    lines.forEach((line, i) => {
      ctx.fillText(line, tooltipX + padding, tooltipY + padding + i * lineHeight);
    });
  }

  /**
   * Render FPS counter (debug)
   */
  renderFPS(fps: number, frameTime: number): void {
    const { ctx, theme } = this;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(rect.width - 80, 5, 75, 35);

    ctx.fillStyle = fps >= 55 ? '#00ff00' : fps >= 30 ? '#ffff00' : '#ff0000';
    ctx.font = `bold ${theme.fontSize}px ${theme.fontFamily}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${fps.toFixed(0)} FPS`, rect.width - 10, 10);

    ctx.fillStyle = '#888888';
    ctx.font = `${theme.fontSize - 1}px ${theme.fontFamily}`;
    ctx.fillText(`${frameTime.toFixed(1)} ms`, rect.width - 10, 24);

    ctx.restore();
  }

  // ----------------------------------------
  // Helper methods
  // ----------------------------------------

  private dataToPixelX(
    value: number,
    bounds: Bounds,
    plotArea: { x: number; width: number }
  ): number {
    const normalized = (value - bounds.xMin) / (bounds.xMax - bounds.xMin);
    return plotArea.x + normalized * plotArea.width;
  }

  private dataToPixelY(
    value: number,
    bounds: Bounds,
    plotArea: { y: number; height: number }
  ): number {
    const normalized = (value - bounds.yMin) / (bounds.yMax - bounds.yMin);
    return plotArea.y + plotArea.height * (1 - normalized);
  }

  private generateTicks(min: number, max: number, count: number): number[] {
    const step = (max - min) / count;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(min + i * step);
    }
    return ticks;
  }

  private formatNumber(value: number): string {
    if (Math.abs(value) < 0.001 || Math.abs(value) >= 10000) {
      return value.toExponential(1);
    }
    return value.toFixed(3).replace(/\.?0+$/, '');
  }

  private formatScientific(value: number): string {
    if (value === 0) return '0';
    const absVal = Math.abs(value);
    if (absVal < 0.001 || absVal >= 1000) {
      return value.toExponential(1);
    }
    return value.toPrecision(3);
  }

  /**
   * Destroy the overlay
   */
  destroy(): void {
    this.canvas.remove();
  }
}
