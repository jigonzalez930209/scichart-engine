/**
 * Heatmap Tooltip Template
 * 
 * Specialized template for heatmap tooltips showing:
 * - Grid position
 * - Z value with color preview
 * - Scale information
 * 
 * @module tooltip/templates/HeatmapTemplate
 */

import type {
  HeatmapTooltip,
  TooltipTemplate,
  TooltipMeasurement,
  TooltipPosition,
  TooltipTheme,
  TooltipType
} from '../types';

/**
 * Format a number for display
 */
function formatValue(value: number): string {
  const absVal = Math.abs(value);
  
  if (absVal === 0) return '0';
  if (absVal !== 0 && (absVal < 0.0001 || absVal >= 10000)) {
    return value.toExponential(3);
  }
  if (absVal < 0.01) return value.toPrecision(4);
  if (absVal < 1) return value.toFixed(4);
  if (absVal < 100) return value.toFixed(3);
  return value.toFixed(2);
}

/**
 * Heatmap Template
 * 
 * Visual layout:
 * ┌────────────────────────────╮
 * │  Grid [45, 128]            │
 * │  ──────────────────────────│
 * │  ████ Value: 0.847         │
 * │       Min: 0.0 Max: 1.0    │
 * │                            │
 * │  X: 100.0 Hz               │
 * │  Y: 2.50 s                 │
 * ╰────────────────────────────╯
 */
export class HeatmapTooltipTemplate implements TooltipTemplate<HeatmapTooltip> {
  readonly id = 'heatmap';
  readonly name = 'Heatmap Value';
  readonly supportedTypes: TooltipType[] = ['heatmap'];

  // Color swatch dimensions
  private readonly swatchSize = 14;
  private readonly swatchGap = 8;

  // Cached measurements
  private cachedKey: string = '';
  private cachedMeasurement: TooltipMeasurement | null = null;

  /**
   * Measure tooltip dimensions
   */
  measure(
    ctx: CanvasRenderingContext2D,
    data: HeatmapTooltip,
    theme: TooltipTheme
  ): TooltipMeasurement {
    // Cache key
    const cacheKey = `${data.seriesId}-${data.xIndex}-${data.yIndex}-${theme.fontFamily}-${theme.titleFontSize}`;
    if (cacheKey === this.cachedKey && this.cachedMeasurement) {
      return this.cachedMeasurement;
    }

    // Set title font
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;
    
    // Header: "Grid [x, y]"
    const headerText = `Grid [${data.xIndex}, ${data.yIndex}]`;
    let maxWidth = ctx.measureText(headerText).width;
    
    // Content font
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;
    
    // Value line with color swatch (swatch + gap + text)
    const valueText = `Value: ${formatValue(data.zValue)}`;
    const valueWidth = this.swatchSize + this.swatchGap + ctx.measureText(valueText).width;
    maxWidth = Math.max(maxWidth, valueWidth);
    
    // Scale info
    if (data.colorScale) {
      const scaleText = `Min: ${formatValue(data.colorScale.min)}  Max: ${formatValue(data.colorScale.max)}`;
      maxWidth = Math.max(maxWidth, this.swatchSize + this.swatchGap + ctx.measureText(scaleText).width);
    }
    
    // X/Y data values
    const xyLabelWidth = 25; // Adjusted to match fixed offset in render
    const dataXWidth = xyLabelWidth + ctx.measureText(formatValue(data.dataX)).width;
    const dataYWidth = xyLabelWidth + ctx.measureText(formatValue(data.dataY)).width;
    maxWidth = Math.max(maxWidth, dataXWidth, dataYWidth);
    
    // Calculate height
    const headerHeight = theme.titleFontSize * theme.lineHeight;
    const contentLines = data.colorScale ? 4 : 3; // value, (scale), X, Y
    const contentHeight = contentLines * theme.contentFontSize * theme.lineHeight;
    
    this.cachedMeasurement = {
      width: maxWidth + 4, // Small buffer
      height: headerHeight + theme.headerGap + contentHeight + theme.itemGap,
      padding: theme.padding
    };
    this.cachedKey = cacheKey;
    
    return this.cachedMeasurement;
  }

  /**
   * Render the tooltip
   */
  render(
    ctx: CanvasRenderingContext2D,
    data: HeatmapTooltip,
    position: TooltipPosition,
    theme: TooltipTheme
  ): void {
    const { x, y } = position;
    const { padding } = theme;
    
    let currentY = y + padding.top;
    const contentX = x + padding.left;
    
    // Draw header: "Grid [x, y]"
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;
    ctx.fillStyle = theme.textColor;
    
    const headerText = `Grid [${data.xIndex}, ${data.yIndex}]`;
    ctx.fillText(headerText, contentX, currentY);
    
    currentY += theme.titleFontSize * theme.lineHeight + 2;
    
    // Draw separator
    if (theme.showHeaderSeparator) {
      const measurement = this.measure(ctx, data, theme);
      
      ctx.strokeStyle = theme.separatorColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(contentX, currentY + theme.headerGap / 2);
      ctx.lineTo(contentX + measurement.width, currentY + theme.headerGap / 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
    
    currentY += theme.headerGap + 2;
    
    // Content font
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;
    
    // Draw color swatch with value
    const swatchY = currentY + (theme.contentFontSize * theme.lineHeight - this.swatchSize) / 2;
    
    // Color swatch with border
    ctx.fillStyle = data.mappedColor || theme.textColor;
    ctx.fillRect(contentX, swatchY, this.swatchSize, this.swatchSize);
    ctx.strokeStyle = theme.separatorColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(contentX, swatchY, this.swatchSize, this.swatchSize);
    
    // Value text
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.fillText('Value:', contentX + this.swatchSize + this.swatchGap, currentY);
    ctx.fillStyle = theme.textColor;
    const labelWidth = ctx.measureText('Value: ').width;
    ctx.fillText(formatValue(data.zValue), contentX + this.swatchSize + this.swatchGap + labelWidth, currentY);
    
    currentY += theme.contentFontSize * theme.lineHeight;
    
    // Scale info (indented to align with value)
    if (data.colorScale) {
      ctx.fillStyle = theme.textSecondaryColor;
      ctx.font = `400 ${theme.contentFontSize - 1}px ${theme.fontFamily}`;
      const scaleText = `Min: ${formatValue(data.colorScale.min)}  Max: ${formatValue(data.colorScale.max)}`;
      ctx.fillText(scaleText, contentX + this.swatchSize + this.swatchGap, currentY);
      currentY += theme.contentFontSize * theme.lineHeight;
    }
    
    currentY += theme.itemGap + 2;
    
    // X value
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.fillText('X:', contentX, currentY);
    ctx.fillStyle = theme.textColor;
    ctx.fillText(formatValue(data.dataX), contentX + 25, currentY);
    
    currentY += theme.contentFontSize * theme.lineHeight + 2;
    
    // Y value
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.fillText('Y:', contentX, currentY);
    ctx.fillStyle = theme.textColor;
    ctx.fillText(formatValue(data.dataY), contentX + 25, currentY);
    
    ctx.restore();
  }
}

// Export singleton instance
export const heatmapTooltipTemplate = new HeatmapTooltipTemplate();
