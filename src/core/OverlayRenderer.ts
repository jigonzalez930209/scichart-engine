/**
 * OverlayRenderer - Canvas 2D rendering for axes, grid, legend, and cursor
 *
 * This module handles all 2D overlay rendering on top of the WebGL canvas.
 * It uses the theme system for consistent styling.
 */

import type { Scale } from "../scales";
import type { ChartTheme } from "../theme";
import type { Series } from "./Series";
import type { PlotArea, CursorState } from "../types";

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
  drawGrid(plotArea: PlotArea, xScale: Scale, yScale: Scale): void {
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
      const x = xScale.transform(tick);
      if (x >= plotArea.x && x <= plotArea.x + plotArea.width) {
        ctx.beginPath();
        ctx.moveTo(x, plotArea.y);
        ctx.lineTo(x, plotArea.y + plotArea.height);
        ctx.stroke();
      }
    });

    // Horizontal lines (Y ticks)
    yTicks.forEach((tick) => {
      const y = yScale.transform(tick);
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
        const x = xScale.transform(tick);
        if (x >= plotArea.x && x <= plotArea.x + plotArea.width) {
          ctx.beginPath();
          ctx.moveTo(x, plotArea.y);
          ctx.lineTo(x, plotArea.y + plotArea.height);
          ctx.stroke();
        }
      });

      minorYTicks.forEach((tick) => {
        const y = yScale.transform(tick);
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
  drawXAxis(plotArea: PlotArea, xScale: Scale, label?: string): void {
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
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    xTicks.forEach((tick) => {
      const x = xScale.transform(tick);

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
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
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
    yScale: Scale, 
    label?: string, 
    position: "left" | "right" = "left",
    offset: number = 0
  ): void {
    const { ctx } = this;
    const axis = this.theme.yAxis;
    const yTicks = yScale.ticks(6);
    // Calculate X coordinate for axis line based on position and offset
    const axisX = position === 'left' ? plotArea.x - offset : plotArea.x + plotArea.width + offset;
    const tickDir = position === 'left' ? -1 : 1; // Left points left, right points right

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
    ctx.textAlign = position === 'left' ? "right" : "left";
    ctx.textBaseline = "middle";

    yTicks.forEach((tick) => {
      const y = yScale.transform(tick);

      if (y >= plotArea.y && y <= plotArea.y + plotArea.height) {
        // Tick mark
        ctx.strokeStyle = axis.tickColor;
        ctx.beginPath();
        ctx.moveTo(axisX, y);
        ctx.lineTo(axisX + axis.tickLength * tickDir, y);
        ctx.stroke();

        // Label
        const labelX = axisX + (axis.tickLength + 3) * tickDir;
        ctx.fillText(this.formatYTick(tick), labelX, y);
      }
    });

    // Axis title
    if (label) {
      ctx.save();
      ctx.fillStyle = axis.titleColor;
      ctx.font = `${axis.titleSize}px ${axis.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      
      const titleX = position === 'left' 
        ? axisX - 40 // Ajustar padding para título izquierdo
        : axisX + 40; // Ajustar padding para título derecho
      
      const titleY = plotArea.y + plotArea.height / 2;
      
      ctx.translate(titleX, titleY);
      ctx.rotate(position === 'left' ? -Math.PI / 2 : Math.PI / 2);
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
      const style = s.getStyle();
      const width = ctx.measureText(label).width;
      maxWidth = Math.max(maxWidth, width);
      return { 
        id: s.getId(), 
        color: style.color ?? "#ff0055", 
        label,
        type: s.getType(),
        symbol: style.symbol,
        opacity: style.opacity ?? 1
      };
    });

    const boxWidth = legend.swatchSize + 8 + maxWidth + legend.padding * 2;
    const boxHeight =
      items.length * (legend.swatchSize + legend.itemGap) -
      legend.itemGap +
      legend.padding * 2;

    // Calculate position
    let x: number, y: number;
    switch (legend.position) {
      case "top-left":
        x = plotArea.x + 10;
        y = plotArea.y + 10;
        break;
      case "bottom-left":
        x = plotArea.x + 10;
        y = plotArea.y + 10;
        break;
      case "bottom-right":
        x = plotArea.x + plotArea.width - boxWidth - 10;
        y = plotArea.y + plotArea.height - boxHeight - 10;
        break;
      case "top-right":
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
    const r = legend.borderRadius;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + boxWidth - r, y);
    ctx.arcTo(x + boxWidth, y, x + boxWidth, y + r, r);
    ctx.lineTo(x + boxWidth, y + boxHeight - r);
    ctx.arcTo(x + boxWidth, y + boxHeight, x + boxWidth - r, y + boxHeight, r);
    ctx.lineTo(x + r, y + boxHeight);
    ctx.arcTo(x, y + boxHeight, x, y + boxHeight - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw items
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    items.forEach((item, i) => {
      const itemY =
        y + legend.padding + i * (legend.swatchSize + legend.itemGap);
      const swatchX = x + legend.padding;
      const centerY = itemY + legend.swatchSize / 2;
      const centerX = swatchX + legend.swatchSize / 2;

      // Draw swatch (symbol or line)
      ctx.save();
      ctx.globalAlpha = item.opacity;
      ctx.fillStyle = item.color;
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;

      const size = legend.swatchSize;

      // EXTREME FALLBACK DETECTION
      const typeStr = String(item.type).toLowerCase();
      const hasSymbol = !!item.symbol && item.symbol !== 'circle';
      
      const isScatter = typeStr === 'scatter' || typeStr === '1' || (typeStr === 'line' && hasSymbol);
      const isLineScatter = typeStr.includes('scatter') || typeStr === '2';

      if (isScatter) {
        this.drawLegendSymbol(ctx, item.symbol ?? 'circle', centerX, centerY, size * 0.9);
      } else if (isLineScatter) {
        // Line + Scatter
        ctx.beginPath();
        ctx.moveTo(swatchX, centerY);
        ctx.lineTo(swatchX + size, centerY);
        ctx.stroke();
        
        this.drawLegendSymbol(ctx, item.symbol ?? 'circle', centerX, centerY, size * 0.6);
      } else {
        // Pure line or step
        ctx.beginPath();
        ctx.moveTo(swatchX, centerY);
        ctx.lineTo(swatchX + size, centerY);
        ctx.stroke();
      }
      ctx.restore();

      // Label
      ctx.fillStyle = legend.textColor;
      ctx.fillText(
        item.label,
        x + legend.padding + legend.swatchSize + 8,
        centerY
      );
    });
  }

  /**
   * Helper to draw a symbol in the legend
   */
  private drawLegendSymbol(
    ctx: CanvasRenderingContext2D,
    symbol: string,
    x: number,
    y: number,
    size: number
  ): void {
    const r = size / 2;
    ctx.beginPath();

    switch (symbol) {
      case 'circle':
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.rect(x - r, y - r, size, size);
        ctx.fill();
        break;
      case 'diamond':
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r);
        ctx.lineTo(x - r, y);
        ctx.closePath();
        ctx.fill();
        break;
      case 'triangle':
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y + r);
        ctx.lineTo(x - r, y + r);
        ctx.closePath();
        ctx.fill();
        break;
      case 'triangleDown':
        ctx.moveTo(x, y + r);
        ctx.lineTo(x + r, y - r);
        ctx.lineTo(x - r, y - r);
        ctx.closePath();
        ctx.fill();
        break;
      case 'cross':
        ctx.moveTo(x - r, y);
        ctx.lineTo(x + r, y);
        ctx.moveTo(x, y - r);
        ctx.lineTo(x, y + r);
        ctx.stroke();
        break;
      case 'x':
        const d = r * 0.707; // sin(45)
        ctx.moveTo(x - d, y - d);
        ctx.lineTo(x + d, y + d);
        ctx.moveTo(x + d, y - d);
        ctx.lineTo(x - d, y + d);
        ctx.stroke();
        break;
      case 'star':
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(
            x + r * Math.cos(((18 + i * 72) / 180) * Math.PI),
            y - r * Math.sin(((18 + i * 72) / 180) * Math.PI)
          );
          ctx.lineTo(
            x + (r / 2) * Math.cos(((54 + i * 72) / 180) * Math.PI),
            y - (r / 2) * Math.sin(((54 + i * 72) / 180) * Math.PI)
          );
        }
        ctx.closePath();
        ctx.fill();
        break;
    }
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
    const lines = text.split("\n");
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
    const r = 4;
    ctx.moveTo(tooltipX + r, tooltipY);
    ctx.lineTo(tooltipX + boxWidth - r, tooltipY);
    ctx.arcTo(tooltipX + boxWidth, tooltipY, tooltipX + boxWidth, tooltipY + r, r);
    ctx.lineTo(tooltipX + boxWidth, tooltipY + boxHeight - r);
    ctx.arcTo(tooltipX + boxWidth, tooltipY + boxHeight, tooltipX + boxWidth - r, tooltipY + boxHeight, r);
    ctx.lineTo(tooltipX + r, tooltipY + boxHeight);
    ctx.arcTo(tooltipX, tooltipY + boxHeight, tooltipX, tooltipY + boxHeight - r, r);
    ctx.lineTo(tooltipX, tooltipY + r);
    ctx.arcTo(tooltipX, tooltipY, tooltipX + r, tooltipY, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = cursor.tooltipColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      ctx.fillText(
        line,
        tooltipX + padding,
        tooltipY + padding + i * lineHeight
      );
    });
  }

  /**
   * Draw selection rectangle (Box Zoom)
   */
  drawSelectionRect(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): void {
    const { ctx } = this;
    const isDark =
      this.theme.name.toLowerCase().includes("dark") ||
      this.theme.name.toLowerCase().includes("midnight");

    ctx.save();
    ctx.fillStyle = isDark
      ? "rgba(0, 170, 255, 0.15)"
      : "rgba(0, 100, 255, 0.1)";
    ctx.strokeStyle = "#00aaff";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw error bars for a series
   */
  drawErrorBars(
    plotArea: PlotArea,
    series: Series,
    xScale: Scale,
    yScale: Scale
  ): void {
    if (!series.hasErrorData()) return;

    const { ctx } = this;
    const data = series.getData();
    const style = series.getStyle();
    const errorStyle = style.errorBars ?? {};

    // Skip if explicitly hidden
    if (errorStyle.visible === false) return;

    // Error bar styling
    const color = errorStyle.color ?? style.color ?? '#ff0055';
    const lineWidth = errorStyle.width ?? 1;
    const capWidth = errorStyle.capWidth ?? 6;
    const showCaps = errorStyle.showCaps !== false;
    const opacity = errorStyle.opacity ?? 0.7;
    const direction = errorStyle.direction ?? 'both';

    ctx.save();

    // Clip to plot area
    ctx.beginPath();
    ctx.rect(plotArea.x, plotArea.y, plotArea.width, plotArea.height);
    ctx.clip();

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = opacity;

    // Draw error bars for each point
    for (let i = 0; i < data.x.length; i++) {
      const x = xScale.transform(data.x[i]);
      const y = yScale.transform(data.y[i]);

      // Skip points outside plot area
      if (x < plotArea.x || x > plotArea.x + plotArea.width) continue;
      if (y < plotArea.y || y > plotArea.y + plotArea.height) continue;

      // Y error bars (vertical)
      const yError = series.getYError(i);
      if (yError) {
        const [errorMinus, errorPlus] = yError;
        const yBase = data.y[i];

        // Convert error values to pixel positions
        const yTop = yScale.transform(yBase + errorPlus);
        const yBottom = yScale.transform(yBase - errorMinus);

        ctx.beginPath();

        // Draw based on direction
        if (direction === 'both' || direction === 'positive') {
          // Upper error bar
          ctx.moveTo(x, y);
          ctx.lineTo(x, yTop);
          // Top cap
          if (showCaps) {
            ctx.moveTo(x - capWidth / 2, yTop);
            ctx.lineTo(x + capWidth / 2, yTop);
          }
        }

        if (direction === 'both' || direction === 'negative') {
          // Lower error bar
          ctx.moveTo(x, y);
          ctx.lineTo(x, yBottom);
          // Bottom cap
          if (showCaps) {
            ctx.moveTo(x - capWidth / 2, yBottom);
            ctx.lineTo(x + capWidth / 2, yBottom);
          }
        }

        ctx.stroke();
      }

      // X error bars (horizontal)
      const xError = series.getXError(i);
      if (xError) {
        const [errorMinus, errorPlus] = xError;
        const xBase = data.x[i];

        // Convert error values to pixel positions
        const xRight = xScale.transform(xBase + errorPlus);
        const xLeft = xScale.transform(xBase - errorMinus);

        ctx.beginPath();

        if (direction === 'both' || direction === 'positive') {
          // Right error bar
          ctx.moveTo(x, y);
          ctx.lineTo(xRight, y);
          // Right cap
          if (showCaps) {
            ctx.moveTo(xRight, y - capWidth / 2);
            ctx.lineTo(xRight, y + capWidth / 2);
          }
        }

        if (direction === 'both' || direction === 'negative') {
          // Left error bar
          ctx.moveTo(x, y);
          ctx.lineTo(xLeft, y);
          // Left cap
          if (showCaps) {
            ctx.moveTo(xLeft, y - capWidth / 2);
            ctx.lineTo(xLeft, y + capWidth / 2);
          }
        }

        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // ----------------------------------------
  // Helper Methods
  // ----------------------------------------

  private generateMinorTicks(
    majorTicks: number[],
    divisions: number
  ): number[] {
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
    return value.toFixed(3).replace(/\.?0+$/, "");
  }

  private formatYTick(value: number): string {
    if (value === 0) return "0";
    const absVal = Math.abs(value);
    if (absVal < 0.0001 || absVal >= 10000) {
      return this.toScientificUnicode(value, 1);
    }
    return value.toPrecision(3);
  }

  private toScientificUnicode(value: number, precision: number): string {
    const str = value.toExponential(precision);
    const [mantissa, exponent] = str.split("e");

    // Convert exponent to unicode superscripts
    const superscriptMap: Record<string, string> = {
      "0": "⁰",
      "1": "¹",
      "2": "²",
      "3": "³",
      "4": "⁴",
      "5": "⁵",
      "6": "⁶",
      "7": "⁷",
      "8": "⁸",
      "9": "⁹",
      "-": "⁻",
      "+": "⁺",
    };

    const unicodeExp = exponent.replace(
      /[0-9\-+]/g,
      (char) => superscriptMap[char] || char
    );

    // Return "1.2 × 10⁻⁵" format
    return `${mantissa} × 10${unicodeExp}`;
  }
}
