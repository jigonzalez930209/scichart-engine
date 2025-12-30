/**
 * OverlayRenderer - Canvas 2D rendering for axes, grid, legend, and cursor
 *
 * This module handles all 2D overlay rendering on top of the WebGL canvas.
 * It uses the theme system for consistent styling.
 */

import type { Bounds } from '../types';
import type { Scale } from '../scales';
import type { ChartTheme } from '../theme';
import type { Series } from './Series';

// ============================================
// Types
// ============================================

export interface PlotArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AxisLabels {
  x?: string;
  y?: string;
}

export interface CursorState {
  enabled: boolean;
  x: number;
  y: number;
  crosshair: boolean;
  tooltipText?: string;
}

// ============================================
// Overlay Renderer Class
// ============================================

export class OverlayRenderer {
  private ctx: CanvasRenderingContext2D;
  private theme: ChartTheme;

  constructor(ctx: CanvasRenderingContext2D, theme: ChartTheme) {
    this.ctx = ctx;
    this.theme = theme;
  }

  /**
   * Update the theme
   */
  setTheme(theme: ChartTheme): void {
    this.theme = theme;
  }

  /**
   * Clear the overlay
   */
  clear(width: number, height: number): void {
    this.ctx.clearRect(0, 0, width, height);
  }

  /**
   * Draw the grid
   */
  drawGrid(
    plotArea: PlotArea,
    bounds: Bounds,
    xScale: Scale,
    yScale: Scale
  ): void {
    if (!this.theme.grid.visible) return;

    const { ctx } = this;
    const grid = this.theme.grid;

    const xTicks = xScale.ticks(8);
    const yTicks = yScale.ticks(6);

    // Major grid lines
    ctx.strokeStyle = grid.majorColor;
    ctx.lineWidth = grid.majorWidth;
    ctx.setLineDash(grid.majorDash);

    // Vertical lines (X ticks)
    xTicks.forEach((tick) => {
      const x = this.dataToPixelX(tick, bounds, plotArea);
      if (x >= plotArea.x && x <= plotArea.x + plotArea.width) {
        ctx.beginPath();
        ctx.moveTo(x, plotArea.y);
        ctx.lineTo(x, plotArea.y + plotArea.height);
        ctx.stroke();
      }
    });

    // Horizontal lines (Y ticks)
    yTicks.forEach((tick) => {
      const y = this.dataToPixelY(tick, bounds, plotArea);
      if (y >= plotArea.y && y <= plotArea.y + plotArea.height) {
        ctx.beginPath();
        ctx.moveTo(plotArea.x, y);
        ctx.lineTo(plotArea.x + plotArea.width, y);
        ctx.stroke();
      }
    });

    // Minor grid lines (if enabled)
    if (grid.showMinor) {
      ctx.strokeStyle = grid.minorColor;
      ctx.lineWidth = grid.minorWidth;
      ctx.setLineDash(grid.minorDash);

      // Generate minor ticks between major ticks
      const minorXTicks = this.generateMinorTicks(xTicks, grid.minorDivisions);
      const minorYTicks = this.generateMinorTicks(yTicks, grid.minorDivisions);

      minorXTicks.forEach((tick) => {
        const x = this.dataToPixelX(tick, bounds, plotArea);
        if (x >= plotArea.x && x <= plotArea.x + plotArea.width) {
          ctx.beginPath();
          ctx.moveTo(x, plotArea.y);
          ctx.lineTo(x, plotArea.y + plotArea.height);
          ctx.stroke();
        }
      });

      minorYTicks.forEach((tick) => {
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

  /**
   * Draw X axis with ticks and labels
   */
  drawXAxis(
    plotArea: PlotArea,
    bounds: Bounds,
    xScale: Scale,
    label?: string
  ): void {
    const { ctx } = this;
    const axis = this.theme.xAxis;
    const xTicks = xScale.ticks(8);
    const axisY = plotArea.y + plotArea.height;

    // Axis line
    ctx.strokeStyle = axis.lineColor;
    ctx.lineWidth = axis.lineWidth;
    ctx.beginPath();
    ctx.moveTo(plotArea.x, axisY);
    ctx.lineTo(plotArea.x + plotArea.width, axisY);
    ctx.stroke();

    // Ticks and labels
    ctx.fillStyle = axis.labelColor;
    ctx.font = `${axis.labelSize}px ${axis.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    xTicks.forEach((tick) => {
      const x = this.dataToPixelX(tick, bounds, plotArea);

      if (x >= plotArea.x && x <= plotArea.x + plotArea.width) {
        // Tick mark
        ctx.strokeStyle = axis.tickColor;
        ctx.beginPath();
        ctx.moveTo(x, axisY);
        ctx.lineTo(x, axisY + axis.tickLength);
        ctx.stroke();

        // Label
        ctx.fillText(this.formatXTick(tick), x, axisY + axis.tickLength + 3);
      }
    });

    // Axis title
    if (label) {
      ctx.fillStyle = axis.titleColor;
      ctx.font = `${axis.titleSize}px ${axis.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        label,
        plotArea.x + plotArea.width / 2,
        plotArea.y + plotArea.height + 45
      );
    }
  }

  /**
   * Draw Y axis with ticks and labels
   */
  drawYAxis(
    plotArea: PlotArea,
    bounds: Bounds,
    yScale: Scale,
    label?: string
  ): void {
    const { ctx } = this;
    const axis = this.theme.yAxis;
    const yTicks = yScale.ticks(6);
    const axisX = plotArea.x;

    // Axis line
    ctx.strokeStyle = axis.lineColor;
    ctx.lineWidth = axis.lineWidth;
    ctx.beginPath();
    ctx.moveTo(axisX, plotArea.y);
    ctx.lineTo(axisX, plotArea.y + plotArea.height);
    ctx.stroke();

    // Ticks and labels
    ctx.fillStyle = axis.labelColor;
    ctx.font = `${axis.labelSize}px ${axis.fontFamily}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    yTicks.forEach((tick) => {
      const y = this.dataToPixelY(tick, bounds, plotArea);

      if (y >= plotArea.y && y <= plotArea.y + plotArea.height) {
        // Tick mark
        ctx.strokeStyle = axis.tickColor;
        ctx.beginPath();
        ctx.moveTo(axisX, y);
        ctx.lineTo(axisX - axis.tickLength, y);
        ctx.stroke();

        // Label
        ctx.fillText(this.formatYTick(tick), axisX - axis.tickLength - 3, y);
      }
    });

    // Axis title
    if (label) {
      ctx.save();
      ctx.fillStyle = axis.titleColor;
      ctx.font = `${axis.titleSize}px ${axis.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.translate(15, plotArea.y + plotArea.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  }

  /**
   * Draw plot area border
   */
  drawPlotBorder(plotArea: PlotArea): void {
    const { ctx } = this;
    ctx.strokeStyle = this.theme.plotBorderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(plotArea.x, plotArea.y, plotArea.width, plotArea.height);
  }

  /**
   * Draw legend
   */
  drawLegend(plotArea: PlotArea, series: Series[]): void {
    if (series.length === 0) return;

    const { ctx } = this;
    const legend = this.theme.legend;

    // Calculate legend dimensions
    ctx.font = `${legend.fontSize}px ${legend.fontFamily}`;
    let maxWidth = 0;
    const items = series.map((s) => {
      const label = s.getId();
      const width = ctx.measureText(label).width;
      maxWidth = Math.max(maxWidth, width);
      return { id: s.getId(), color: s.getStyle().color ?? '#ff0055', label };
    });

    const boxWidth = legend.swatchSize + 8 + maxWidth + legend.padding * 2;
    const boxHeight = items.length * (legend.swatchSize + legend.itemGap) - legend.itemGap + legend.padding * 2;

    // Calculate position
    let x: number, y: number;
    switch (legend.position) {
      case 'top-left':
        x = plotArea.x + 10;
        y = plotArea.y + 10;
        break;
      case 'bottom-left':
        x = plotArea.x + 10;
        y = plotArea.y + plotArea.height - boxHeight - 10;
        break;
      case 'bottom-right':
        x = plotArea.x + plotArea.width - boxWidth - 10;
        y = plotArea.y + plotArea.height - boxHeight - 10;
        break;
      case 'top-right':
      default:
        x = plotArea.x + plotArea.width - boxWidth - 10;
        y = plotArea.y + 10;
        break;
    }

    // Draw background
    ctx.fillStyle = legend.backgroundColor;
    ctx.strokeStyle = legend.borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, boxWidth, boxHeight, legend.borderRadius);
    ctx.fill();
    ctx.stroke();

    // Draw items
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    items.forEach((item, i) => {
      const itemY = y + legend.padding + i * (legend.swatchSize + legend.itemGap);

      // Color swatch
      ctx.fillStyle = item.color;
      ctx.fillRect(x + legend.padding, itemY, legend.swatchSize, legend.swatchSize);

      // Label
      ctx.fillStyle = legend.textColor;
      ctx.fillText(
        item.label,
        x + legend.padding + legend.swatchSize + 8,
        itemY + legend.swatchSize / 2
      );
    });
  }

  /**
   * Draw cursor/crosshair
   */
  drawCursor(plotArea: PlotArea, cursor: CursorState): void {
    if (!cursor.enabled) return;

    const { ctx } = this;
    const cursorTheme = this.theme.cursor;

    // Check if cursor is in plot area
    if (
      cursor.x < plotArea.x ||
      cursor.x > plotArea.x + plotArea.width ||
      cursor.y < plotArea.y ||
      cursor.y > plotArea.y + plotArea.height
    ) {
      return;
    }

    ctx.save();

    // Clip to plot area
    ctx.beginPath();
    ctx.rect(plotArea.x, plotArea.y, plotArea.width, plotArea.height);
    ctx.clip();

    // Crosshair style
    ctx.strokeStyle = cursorTheme.lineColor;
    ctx.lineWidth = cursorTheme.lineWidth;
    ctx.setLineDash(cursorTheme.lineDash);

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

    // Draw tooltip
    if (cursor.tooltipText) {
      this.drawTooltip(cursor.x, cursor.y, cursor.tooltipText, plotArea);
    }
  }

  /**
   * Draw tooltip
   */
  private drawTooltip(
    x: number,
    y: number,
    text: string,
    plotArea: PlotArea
  ): void {
    const { ctx } = this;
    const cursor = this.theme.cursor;
    const lines = text.split('\n');
    const lineHeight = cursor.tooltipSize + 5;
    const padding = 8;

    ctx.font = `${cursor.tooltipSize}px ${this.theme.xAxis.fontFamily}`;
    let maxWidth = 0;
    lines.forEach((line) => {
      maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
    });

    const boxWidth = maxWidth + padding * 2;
    const boxHeight = lines.length * lineHeight + padding * 2 - 5;

    // Position tooltip
    let tooltipX = x + 15;
    let tooltipY = y - boxHeight - 10;

    if (tooltipX + boxWidth > plotArea.x + plotArea.width) {
      tooltipX = x - boxWidth - 15;
    }
    if (tooltipY < plotArea.y) {
      tooltipY = y + 15;
    }

    // Background
    ctx.fillStyle = cursor.tooltipBackground;
    ctx.strokeStyle = cursor.tooltipBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, boxWidth, boxHeight, 4);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = cursor.tooltipColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    lines.forEach((line, i) => {
      ctx.fillText(line, tooltipX + padding, tooltipY + padding + i * lineHeight);
    });
  }

  /**
   * Draw selection rectangle (Box Zoom)
   */
  drawSelectionRect(rect: { x: number; y: number; width: number; height: number }): void {
    const { ctx } = this;
    const isDark = this.theme.name.toLowerCase().includes('dark') || this.theme.name.toLowerCase().includes('midnight');
    
    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(0, 170, 255, 0.15)' : 'rgba(0, 100, 255, 0.1)';
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // ----------------------------------------
  // Helper Methods
  // ----------------------------------------

  private dataToPixelX(value: number, bounds: Bounds, plotArea: PlotArea): number {
    const normalized = (value - bounds.xMin) / (bounds.xMax - bounds.xMin);
    return plotArea.x + normalized * plotArea.width;
  }

  private dataToPixelY(value: number, bounds: Bounds, plotArea: PlotArea): number {
    const normalized = (value - bounds.yMin) / (bounds.yMax - bounds.yMin);
    return plotArea.y + plotArea.height * (1 - normalized);
  }

  private generateMinorTicks(majorTicks: number[], divisions: number): number[] {
    if (majorTicks.length < 2) return [];

    const minor: number[] = [];
    for (let i = 0; i < majorTicks.length - 1; i++) {
      const step = (majorTicks[i + 1] - majorTicks[i]) / divisions;
      for (let j = 1; j < divisions; j++) {
        minor.push(majorTicks[i] + step * j);
      }
    }
    return minor;
  }

  private formatXTick(value: number): string {
    if (Math.abs(value) < 0.001 && value !== 0) {
      return this.toScientificUnicode(value, 1);
    }
    return value.toFixed(3).replace(/\.?0+$/, '');
  }

  private formatYTick(value: number): string {
    if (value === 0) return '0';
    const absVal = Math.abs(value);
    if (absVal < 0.0001 || absVal >= 10000) {
      return this.toScientificUnicode(value, 1);
    }
    return value.toPrecision(3);
  }

  private toScientificUnicode(value: number, precision: number): string {
    const str = value.toExponential(precision);
    const [mantissa, exponent] = str.split('e');
    
    // Convert exponent to unicode superscripts
    const superscriptMap: Record<string, string> = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
      '-': '⁻', '+': '⁺'
    };

    const unicodeExp = exponent.replace(/[0-9\-+]/g, (char) => superscriptMap[char] || char);
    
    // Return "1.2 × 10⁻⁵" format
    return `${mantissa} × 10${unicodeExp}`;
  }
}
