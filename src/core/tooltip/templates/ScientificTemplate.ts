/**
 * Scientific Tooltip Template
 * 
 * Full precision scientific template with:
 * - Proper scientific notation with superscripts
 * - Units and prefixes
 * - Complete error values
 * - Extended metadata
 * 
 * @module tooltip/templates/ScientificTemplate
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
 * Convert number to scientific notation with Unicode superscripts
 */
function toScientificUnicode(value: number, precision: number = 3): string {
  if (value === 0) return '0';
  
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / Math.pow(10, exp);
  
  if (Math.abs(exp) <= 2) {
    // Don't use scientific notation for small exponents
    return value.toPrecision(precision);
  }
  
  // Superscript map
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '-': '⁻', '+': '⁺'
  };
  
  // Convert exponent to superscript
  const expStr = exp.toString();
  let superExp = '';
  for (const char of expStr) {
    superExp += superscripts[char] || char;
  }
  
  return `${mantissa.toFixed(precision - 1)} × 10${superExp}`;
}

/**
 * Format with SI prefix (for future use)
 */
// function formatWithPrefix(value: number, unit: string = ''): string {
//   const prefixes = [
//     { exp: 12, prefix: 'T' },
//     { exp: 9, prefix: 'G' },
//     { exp: 6, prefix: 'M' },
//     { exp: 3, prefix: 'k' },
//     { exp: 0, prefix: '' },
//     { exp: -3, prefix: 'm' },
//     { exp: -6, prefix: 'µ' },
//     { exp: -9, prefix: 'n' },
//     { exp: -12, prefix: 'p' }
//   ];
//   
//   if (value === 0) return `0 ${unit}`;
//   
//   const absVal = Math.abs(value);
//   
//   for (const { exp, prefix } of prefixes) {
//     if (absVal >= Math.pow(10, exp - 1)) {
//       const scaled = value / Math.pow(10, exp);
//       return `${scaled.toFixed(3)} ${prefix}${unit}`;
//     }
//   }
//   
//   return `${value.toExponential(3)} ${unit}`;
// }

/**
 * Scientific Template
 * 
 * Visual layout:
 * ┌────────────────────────────────────────╮
 * │  📍 Series Name                        │
 * │  ───────────────────────────────────── │
 * │  X:  1.234×10³                         │
 * │  Y:  5.678×10⁻² ± 0.001                │
 * │  ───────────────────────────────────── │
 * │  Index: 1523  │  Cycle: 3              │
 * ╰────────────────────────────────────────╯
 */
export class ScientificTooltipTemplate implements TooltipTemplate<DataPointTooltip> {
  readonly id = 'scientific';
  readonly name = 'Scientific Notation';
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
    const cacheKey = `${data.seriesId}-${data.dataIndex}-${data.dataX}-${data.dataY}-${theme.fontFamily}-${theme.titleFontSize}`;
    if (cacheKey === this.cachedKey && this.cachedMeasurement) {
      return this.cachedMeasurement;
    }

    // Title font
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;
    
    const titleWidth = ctx.measureText(data.seriesName).width + 
      (theme.showSeriesIndicator ? theme.seriesIndicatorSize + 8 : 0);
    
    // Content font
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;
    const labelWidth = 28; // Fixed width used in render
    
    // X value
    const xVal = toScientificUnicode(data.dataX);
    let maxWidth = Math.max(titleWidth, labelWidth + ctx.measureText(xVal).width);
    
    // Y value with optional error
    const yVal = toScientificUnicode(data.dataY);
    let yWidth = labelWidth + ctx.measureText(yVal).width;
    if (data.yError) {
      yWidth += ctx.measureText(` ± ${toScientificUnicode(data.yError[0])}`).width;
    }
    maxWidth = Math.max(maxWidth, yWidth);
    
    // Footer line
    let footerText = `Index: ${data.dataIndex}`;
    if (data.cycle !== undefined) {
      footerText += `  │  Cycle: ${data.cycle}`;
    }
    maxWidth = Math.max(maxWidth, ctx.measureText(footerText).width);
    
    // Height calculation
    let lineCount = 3; // title, X, Y
    if (data.cycle !== undefined || data.yError) {
      lineCount += 1; // footer
    }
    
    const headerHeight = theme.titleFontSize * theme.lineHeight + theme.headerGap;
    const contentHeight = (lineCount - 1) * theme.contentFontSize * theme.lineHeight;
    const extraGap = (data.cycle !== undefined) ? theme.itemGap : 0;
    
    this.cachedMeasurement = {
      width: maxWidth,
      height: headerHeight + contentHeight + extraGap,
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
    data: DataPointTooltip,
    position: TooltipPosition,
    theme: TooltipTheme
  ): void {
    const { x, y } = position;
    const { padding } = theme;
    
    let currentY = y + padding.top;
    let currentX = x + padding.left;
    
    ctx.save();
    
    // Explicitly set alignment
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Draw series indicator
    if (theme.showSeriesIndicator) {
      const indicatorY = currentY + theme.titleFontSize / 2;
      ctx.fillStyle = data.seriesColor;
      ctx.beginPath();
      ctx.arc(currentX + theme.seriesIndicatorSize / 2, indicatorY, theme.seriesIndicatorSize / 2, 0, Math.PI * 2);
      ctx.fill();
      currentX += theme.seriesIndicatorSize + 8;
    }
    
    // Title
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;
    ctx.fillStyle = theme.textColor;
    ctx.fillText(data.seriesName, currentX, currentY);
    
    currentY += theme.titleFontSize * theme.lineHeight + 2;
    currentX = x + padding.left;
    
    // Separator
    if (theme.showHeaderSeparator) {
      const measurement = this.measure(ctx, data, theme);
      ctx.strokeStyle = theme.separatorColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(currentX, currentY + theme.headerGap / 2);
      ctx.lineTo(currentX + measurement.width, currentY + theme.headerGap / 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
    
    currentY += theme.headerGap + 2;
    
    // Content
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;
    const labelWidth = 28;
    
    // X value
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.fillText('X:', currentX, currentY);
    ctx.fillStyle = theme.textColor;
    ctx.fillText(toScientificUnicode(data.dataX), currentX + labelWidth, currentY);
    currentY += theme.contentFontSize * theme.lineHeight + 2;
    
    // Y value with error
    ctx.fillStyle = theme.textSecondaryColor;
    ctx.fillText('Y:', currentX, currentY);
    ctx.fillStyle = theme.textColor;
    
    let yText = toScientificUnicode(data.dataY);
    ctx.fillText(yText, currentX + labelWidth, currentY);
    
    if (data.yError) {
      const yWidth = ctx.measureText(yText).width;
      ctx.fillStyle = theme.textSecondaryColor;
      ctx.fillText(` ± ${toScientificUnicode(data.yError[0])}`, currentX + labelWidth + yWidth, currentY);
    }
    currentY += theme.contentFontSize * theme.lineHeight + 2;
    
    // Footer with index and cycle
    if (data.cycle !== undefined) {
      currentY += theme.itemGap;
      
      // Light separator
      ctx.strokeStyle = theme.separatorColor;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      const measurement = this.measure(ctx, data, theme);
      ctx.moveTo(currentX, currentY - theme.itemGap / 2);
      ctx.lineTo(currentX + measurement.width, currentY - theme.itemGap / 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      
      // Footer text
      ctx.fillStyle = theme.textSecondaryColor;
      ctx.font = `400 ${theme.contentFontSize - 1}px ${theme.fontFamily}`;
      
      let footerText = `Index: ${data.dataIndex}`;
      if (data.cycle !== undefined) {
        footerText += `  │  Cycle: ${data.cycle}`;
      }
      ctx.fillText(footerText, currentX, currentY);
    }
    
    ctx.restore();
  }
}

// Export singleton instance
export const scientificTooltipTemplate = new ScientificTooltipTemplate();
