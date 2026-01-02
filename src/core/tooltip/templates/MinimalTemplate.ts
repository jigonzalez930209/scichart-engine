/**
 * Minimal Tooltip Template
 * 
 * Ultra-compact template showing only essential values.
 * Perfect for dashboards with limited space.
 * 
 * @module tooltip/templates/MinimalTemplate
 */

import type {
  DataPointTooltip,
  TooltipTemplate,
  TooltipMeasurement,
  TooltipPosition,
  TooltipTheme,
  TooltipType
} from '../types';

/**
 * Format a number compactly
 */
function formatCompact(value: number): string {
  const absVal = Math.abs(value);
  
  if (absVal === 0) return '0';
  
  // Use SI prefixes for large/small numbers
  if (absVal >= 1e9) return (value / 1e9).toFixed(1) + 'G';
  if (absVal >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (absVal >= 1e3) return (value / 1e3).toFixed(1) + 'k';
  if (absVal >= 1) return value.toFixed(2);
  if (absVal >= 1e-3) return (value * 1e3).toFixed(1) + 'm';
  if (absVal >= 1e-6) return (value * 1e6).toFixed(1) + 'µ';
  if (absVal >= 1e-9) return (value * 1e9).toFixed(1) + 'n';
  
  return value.toExponential(1);
}

/**
 * Minimal Template
 * 
 * Visual layout:
 * ┌───────────────────╮
 * │ 0.500 ▪ 1.23µA    │
 * ╰───────────────────╯
 */
export class MinimalTooltipTemplate implements TooltipTemplate<DataPointTooltip> {
  readonly id = 'minimal';
  readonly name = 'Minimal';
  readonly supportedTypes: TooltipType[] = ['datapoint'];

  // Cached measurements
  private cachedKey: string = '';
  private cachedMeasurement: TooltipMeasurement | null = null;

  /**
   * Measure tooltip dimensions
   */
  measure(
    ctx: CanvasRenderingContext2D,
    data: DataPointTooltip,
    theme: TooltipTheme
  ): TooltipMeasurement {
    // Cache key
    const cacheKey = `${data.seriesId}-${data.dataIndex}-${data.dataX}-${data.dataY}-${theme.fontFamily}`;
    if (cacheKey === this.cachedKey && this.cachedMeasurement) {
      return this.cachedMeasurement;
    }

    // Set font for measurement
    ctx.font = `${theme.contentFontSize}px ${theme.fontFamily}`;
    
    // Create compact text
    const text = `${formatCompact(data.dataX)} ▪ ${formatCompact(data.dataY)}`;
    const textWidth = ctx.measureText(text).width;
    
    this.cachedMeasurement = {
      width: textWidth,
      height: theme.contentFontSize * theme.lineHeight,
      padding: {
        top: 6,
        right: 8,
        bottom: 6,
        left: 8
      }
    };
    this.cachedKey = cacheKey;
    
    return this.cachedMeasurement;
  }

  /**
   * Render the tooltip
   */
  render(
    ctx: CanvasRenderingContext2D,
    data: DataPointTooltip,
    position: TooltipPosition,
    theme: TooltipTheme
  ): void {
    const x = position.x + 8;  // Left padding
    const y = position.y + 6;  // Top padding
    
    // Create compact text
    const xValue = formatCompact(data.dataX);
    const yValue = formatCompact(data.dataY);
    
    ctx.save();
    ctx.font = `${theme.contentFontSize}px ${theme.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Draw X value
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.fillText(xValue, x, y);
    
    // Draw separator
    const xWidth = ctx.measureText(xValue).width;
    ctx.fillStyle = data.seriesColor;
    ctx.fillText(' ▪ ', x + xWidth, y);
    
    // Draw Y value
    const sepWidth = ctx.measureText(' ▪ ').width;
    ctx.fillStyle = theme.textColor;
    ctx.fillText(yValue, x + xWidth + sepWidth, y);
    
    ctx.restore();
  }
}

// Export singleton instance
export const minimalTooltipTemplate = new MinimalTooltipTemplate();
