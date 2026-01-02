/**
 * Range Tooltip Template
 * 
 * Displays statistical information for a selected range:
 * - Count of points
 * - Min/Max/Mean values
 * - Area and Peaks
 * 
 * @module tooltip/templates/RangeTemplate
 */

import type {
  RangeTooltip,
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
  if (absVal < 0.0001 || absVal >= 10000) return value.toExponential(3);
  if (absVal < 1) return value.toFixed(4);
  return value.toFixed(3);
}

export class RangeTooltipTemplate implements TooltipTemplate<RangeTooltip> {
  readonly id = 'range';
  readonly name = 'Range Statistics';
  readonly supportedTypes: TooltipType[] = ['range'];

  // Cache
  private cachedKey: string = '';
  private cachedMeasurement: TooltipMeasurement | null = null;

  /**
   * Measure tooltip dimensions
   */
  measure(
    ctx: CanvasRenderingContext2D,
    data: RangeTooltip,
    theme: TooltipTheme
  ): TooltipMeasurement {
    const stats = data.statistics;
    const cacheKey = `${data.xMin}-${data.xMax}-${stats.count}-${stats.mean}-${theme.fontFamily}`;
    
    if (cacheKey === this.cachedKey && this.cachedMeasurement) {
      return this.cachedMeasurement;
    }

    // Title font
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;
    const headerText = 'Range Statistics';
    let maxWidth = ctx.measureText(headerText).width;

    // Content font
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;
    
    let contentHeight = theme.contentFontSize * theme.lineHeight * 2; // Range and Count are always shown
    
    const lines = [
      `Range: ${formatValue(data.xMin)} to ${formatValue(data.xMax)}`,
      `Count: ${stats.count}`
    ];

    if (stats.min !== undefined) lines.push(`Min: ${formatValue(stats.min)}`);
    if (stats.max !== undefined) lines.push(`Max: ${formatValue(stats.max)}`);
    if (stats.mean !== undefined) lines.push(`Mean: ${formatValue(stats.mean)}`);
    if (stats.area !== undefined) lines.push(`Area: ${formatValue(stats.area)}`);

    for (const line of lines) {
      maxWidth = Math.max(maxWidth, ctx.measureText(line).width + 10);
    }
    
    contentHeight = lines.length * theme.contentFontSize * theme.lineHeight;

    const headerHeight = theme.titleFontSize * theme.lineHeight + theme.headerGap;
    
    this.cachedMeasurement = {
      width: Math.max(maxWidth, 140),
      height: headerHeight + contentHeight + 10,
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
    data: RangeTooltip,
    position: TooltipPosition,
    theme: TooltipTheme
  ): void {
    const { x, y } = position;
    const { padding } = theme;
    const stats = data.statistics;
    
    let currentY = y + padding.top;
    const contentX = x + padding.left;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Title
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;
    ctx.fillStyle = theme.textColor;
    ctx.fillText('Range Statistics', contentX, currentY);
    
    currentY += theme.titleFontSize * theme.lineHeight + 2;

    // Header Separator
    if (theme.showHeaderSeparator) {
      const m = this.measure(ctx, data, theme);
      ctx.strokeStyle = theme.separatorColor;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(contentX, currentY + theme.headerGap / 2);
      ctx.lineTo(contentX + m.width, currentY + theme.headerGap / 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    currentY += theme.headerGap + 2;

    // Content
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;
    const labelW = 60;

    const renderLine = (label: string, value: string | number) => {
      ctx.fillStyle = theme.textSecondaryColor;
      ctx.fillText(label, contentX, currentY);
      ctx.fillStyle = theme.textColor;
      ctx.fillText(String(value), contentX + labelW, currentY);
      currentY += theme.contentFontSize * theme.lineHeight;
    };

    renderLine('Points:', stats.count);
    if (stats.min !== undefined) renderLine('Min:', formatValue(stats.min));
    if (stats.max !== undefined) renderLine('Max:', formatValue(stats.max));
    if (stats.mean !== undefined) renderLine('Mean:', formatValue(stats.mean));
    if (stats.stdDev !== undefined) renderLine('StdDev:', formatValue(stats.stdDev));
    if (stats.area !== undefined) renderLine('Area:', formatValue(stats.area));
    
    if (stats.peakX !== undefined) {
      currentY += 4;
      ctx.fillStyle = theme.textSecondaryColor;
      ctx.font = `italic ${theme.contentFontSize - 1}px ${theme.fontFamily}`;
      ctx.fillText(`Peak: ${formatValue(stats.peakY ?? 0)} at X=${formatValue(stats.peakX)}`, contentX, currentY);
    }

    ctx.restore();
  }
}

export const rangeTooltipTemplate = new RangeTooltipTemplate();
