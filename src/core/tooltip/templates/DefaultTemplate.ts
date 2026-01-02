/**
 * Default Tooltip Template
 * 
 * A clean, elegant template for data point tooltips with:
 * - Series color indicator
 * - Formatted X/Y values
 * - Optional error bars
 * - Cycle information
 * 
 * @module tooltip/templates/DefaultTemplate
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
 * Format a number for display
 */
function formatValue(value: number, precision: number = 4): string {
  const absVal = Math.abs(value);
  
  // Use scientific notation for very large/small numbers
  if (absVal !== 0 && (absVal < 0.0001 || absVal >= 10000)) {
    return value.toExponential(2);
  }
  
  // Smart precision based on magnitude
  if (absVal < 0.01) {
    return value.toPrecision(precision);
  } else if (absVal < 1) {
    return value.toFixed(4);
  } else if (absVal < 100) {
    return value.toFixed(3);
  } else {
    return value.toFixed(1);
  }
}

/**
 * Default Data Point Template
 * 
 * Visual layout:
 * ┌──────────────────────────┐
 * │  ● Series Name           │
 * │  ─────────────────────── │
 * │  X:   0.500              │
 * │  Y:   1.234              │
 * │  ± Error: 0.05           │
 * └──────────────────────────┘
 */
export class DefaultTooltipTemplate implements TooltipTemplate<DataPointTooltip> {
  readonly id = 'default';
  readonly name = 'Default Data Point';
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
    // Create cache key
    const cacheKey = `${data.seriesId}-${data.dataIndex}-${data.dataX}-${data.dataY}`;
    if (cacheKey === this.cachedKey && this.cachedMeasurement) {
      return this.cachedMeasurement;
    }

    // Set up font for measurement
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;
    
    // Measure title (series name)
    const titleWidth = ctx.measureText(data.seriesName).width;
    
    // Set content font
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;
    
    // Format values
    const labelWidth = 35;
    const xValWidth = ctx.measureText(formatValue(data.dataX)).width;
    const yValWidth = ctx.measureText(formatValue(data.dataY)).width;
    
    // Measure content lines
    let contentWidth = labelWidth + Math.max(xValWidth, yValWidth);
    
    let contentHeight = theme.contentFontSize * theme.lineHeight * 2;
    
    // Add error info if present
    if (data.yError) {
      const errorText = `± ${formatValue(data.yError[0])} / ${formatValue(data.yError[1])}`;
      contentWidth = Math.max(contentWidth, ctx.measureText(errorText).width);
      contentHeight += theme.contentFontSize * theme.lineHeight;
    }
    
    // Add cycle info if present
    if (data.cycle !== undefined) {
      const cycleText = `Cycle: ${data.cycle}`;
      contentWidth = Math.max(contentWidth, ctx.measureText(cycleText).width);
      contentHeight += theme.contentFontSize * theme.lineHeight;
    }
    
    // Account for series indicator
    const indicatorWidth = theme.showSeriesIndicator 
      ? theme.seriesIndicatorSize + 6 
      : 0;
    
    // Calculate total width
    const width = Math.max(titleWidth + indicatorWidth, contentWidth);
    
    // Calculate total height (title + separator + content)
    const height = theme.titleFontSize * theme.lineHeight + theme.headerGap + contentHeight;
    
    this.cachedMeasurement = {
      width: width + 2, // Tiny buffer
      height: height + 4,
      padding: theme.padding,
      arrow: theme.showArrow ? { width: theme.arrowSize * 2, height: theme.arrowSize } : undefined
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
    const { x, y } = position;
    const { padding } = theme;
    
    // Start position for content
    let currentX = x + padding.left;
    let currentY = y + padding.top;
    
    // Explicitly set alignment to avoid inheritance issues
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Draw series indicator
    if (theme.showSeriesIndicator) {
      const indicatorY = currentY + theme.titleFontSize / 2;
      ctx.save();
      ctx.fillStyle = data.seriesColor;
      ctx.beginPath();
      ctx.arc(currentX + theme.seriesIndicatorSize / 2, indicatorY, theme.seriesIndicatorSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      currentX += theme.seriesIndicatorSize + 6;
    }
    
    // Draw title (series name)
    ctx.save();
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;
    ctx.fillStyle = theme.textColor;
    ctx.fillText(data.seriesName, currentX, currentY);
    ctx.restore();
    
    currentY += theme.titleFontSize * theme.lineHeight + 2; // Extra space
    
    // Draw separator
    if (theme.showHeaderSeparator) {
      const measurement = this.measure(ctx, data, theme);
      const separatorWidth = measurement.width;
      
      ctx.save();
      ctx.strokeStyle = theme.separatorColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4; // Softer separator
      ctx.beginPath();
      ctx.moveTo(x + padding.left, currentY + theme.headerGap / 2);
      ctx.lineTo(x + padding.left + separatorWidth, currentY + theme.headerGap / 2);
      ctx.stroke();
      ctx.restore();
    }
    
    currentY += theme.headerGap + 2; // Better gap
    currentX = x + padding.left; // Reset X
    
    // Draw content
    ctx.save();
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;
    
    // X value
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.fillText('X:', currentX, currentY);
    ctx.fillStyle = theme.textColor;
    const labelWidth = 35; // Fixed label width for better alignment
    ctx.fillText(formatValue(data.dataX), currentX + labelWidth, currentY);
    currentY += theme.contentFontSize * theme.lineHeight + 2;
    
    // Y value
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.fillText('Y:', currentX, currentY);
    ctx.fillStyle = theme.textColor;
    ctx.fillText(formatValue(data.dataY), currentX + labelWidth, currentY);
    currentY += theme.contentFontSize * theme.lineHeight + 2;
    
    // Error if present
    if (data.yError) {
      ctx.fillStyle = theme.textSecondaryColor;
      const errorText = `± ${formatValue(data.yError[0])} / +${formatValue(data.yError[1])}`;
      ctx.fillText(errorText, currentX, currentY);
      currentY += theme.contentFontSize * theme.lineHeight;
    }
    
    // Cycle if present
    if (data.cycle !== undefined) {
      ctx.fillStyle = theme.textSecondaryColor;
      ctx.fillText('Cycle:', currentX, currentY);
      ctx.fillStyle = theme.textColor;
      ctx.fillText(String(data.cycle), currentX + 45, currentY);
    }
    
    ctx.restore();
  }
}

// Export singleton instance
export const defaultTooltipTemplate = new DefaultTooltipTemplate();
