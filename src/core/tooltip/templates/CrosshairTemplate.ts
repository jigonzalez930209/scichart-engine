/**
 * Crosshair Tooltip Template
 * 
 * Multi-series template for crosshair tooltips showing
 * interpolated values for all visible series at cursor position.
 * 
 * @module tooltip/templates/CrosshairTemplate
 */

import type {
  CrosshairTooltip,
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
    return value.toExponential(2);
  }
  if (absVal < 0.01) return value.toPrecision(3);
  if (absVal < 1) return value.toFixed(4);
  if (absVal < 100) return value.toFixed(3);
  return value.toFixed(1);
}

/**
 * Crosshair Multi-Series Template
 * 
 * Visual layout:
 * ┌──────────────────────────────────╮
 * │  ⌖ X = 0.234                     │
 * ├──────────────────────────────────┤
 * │  ● Forward:   45.67 µA           │
 * │  ● Reverse:  -32.10 µA           │
 * │  ○ Baseline:   0.05 µA           │
 * ╰──────────────────────────────────╯
 */
export class CrosshairTooltipTemplate implements TooltipTemplate<CrosshairTooltip> {
  readonly id = 'crosshair';
  readonly name = 'Multi-Series Crosshair';
  readonly supportedTypes: TooltipType[] = ['crosshair'];

  // Cached measurements
  private cachedKey: string = '';
  private cachedMeasurement: TooltipMeasurement | null = null;

  /**
   * Measure tooltip dimensions
   */
  measure(
    ctx: CanvasRenderingContext2D,
    data: CrosshairTooltip,
    theme: TooltipTheme
  ): TooltipMeasurement {
    // Cache key
    const cacheKey = `${data.dataX}-${data.interpolatedValues.length}-${theme.fontFamily}-${theme.titleFontSize}`;
    if (cacheKey === this.cachedKey && this.cachedMeasurement) {
      return this.cachedMeasurement;
    }

    // Set title font
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;
    
    // Header: "⌖ X = value"
    const headerText = `⌖ X = ${formatValue(data.dataX)}`;
    let maxWidth = ctx.measureText(headerText).width;
    
    // Content font
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;
    
    // Measure each series line
    const indicatorWidth = theme.showSeriesIndicator ? theme.seriesIndicatorSize + 8 : 0;
    const labelColumnWidth = 60; // From render
    
    for (const series of data.interpolatedValues) {
      const nameWidth = ctx.measureText(`${series.seriesName}:`).width;
      const valWidth = ctx.measureText(formatValue(series.y)).width;
      const lineWidth = indicatorWidth + Math.max(nameWidth, labelColumnWidth) + valWidth;
      maxWidth = Math.max(maxWidth, lineWidth);
    }
    
    // Calculate height
    const headerHeight = theme.titleFontSize * theme.lineHeight;
    const seriesCount = data.interpolatedValues.length;
    const contentHeight = seriesCount * (theme.contentFontSize * theme.lineHeight + 2);
    
    this.cachedMeasurement = {
      width: maxWidth + 4, // Safety buffer
      height: headerHeight + theme.headerGap + contentHeight,
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
    data: CrosshairTooltip,
    position: TooltipPosition,
    theme: TooltipTheme
  ): void {
    const { x, y } = position;
    const { padding } = theme;
    
    let currentY = y + padding.top;
    const contentX = x + padding.left;
    
    // Draw header: "⌖ X = value"
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;
    ctx.fillStyle = theme.textColor;
    
    const headerText = `⌖ X = ${formatValue(data.dataX)}`;
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
    
    // Draw each series
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;
    
    for (const series of data.interpolatedValues) {
      let itemX = contentX;
      
      // Series indicator
      if (theme.showSeriesIndicator) {
        const indicatorY = currentY + theme.contentFontSize / 2;
        
        // Use filled circle for exact points, empty circle for interpolated
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          itemX + theme.seriesIndicatorSize / 2,
          indicatorY,
          theme.seriesIndicatorSize / 2,
          0,
          Math.PI * 2
        );
        
        if (series.isInterpolated) {
          ctx.strokeStyle = series.seriesColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = series.seriesColor;
          ctx.fill();
        }
        ctx.restore();
        
        itemX += theme.seriesIndicatorSize + 8;
      }
      
      // Series name
      ctx.fillStyle = theme.textSecondaryColor;
      ctx.fillText(`${series.seriesName}:`, itemX, currentY);
      
      const nameWidth = ctx.measureText(`${series.seriesName}: `).width;
      const labelOffset = Math.max(nameWidth, 60); // At least 60px for name
      
      // Series value
      ctx.fillStyle = theme.textColor;
      ctx.fillText(formatValue(series.y), itemX + labelOffset, currentY);
      
      currentY += theme.contentFontSize * theme.lineHeight + 2;
    }
    
    ctx.restore();
  }
}

// Export singleton instance
export const crosshairTooltipTemplate = new CrosshairTooltipTemplate();
