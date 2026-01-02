/**
 * Annotation Tooltip Template
 * 
 * Template for displaying information about chart annotations:
 * - Annotation type and ID
 * - Labeled values
 * - Custom metadata
 * 
 * @module tooltip/templates/AnnotationTemplate
 */

import type {
  AnnotationTooltip,
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
  if (absVal < 0.0001 || absVal >= 10000) return value.toExponential(2);
  if (absVal < 1) return value.toFixed(4);
  return value.toFixed(2);
}

export class AnnotationTooltipTemplate implements TooltipTemplate<AnnotationTooltip> {
  readonly id = 'annotation';
  readonly name = 'Annotation Info';
  readonly supportedTypes: TooltipType[] = ['annotation'];

  // Cache
  private cachedKey: string = '';
  private cachedMeasurement: TooltipMeasurement | null = null;

  /**
   * Measure tooltip dimensions
   */
  measure(
    ctx: CanvasRenderingContext2D,
    data: AnnotationTooltip,
    theme: TooltipTheme
  ): TooltipMeasurement {
    const cacheKey = `${data.annotationId}-${data.label}-${theme.fontFamily}-${theme.titleFontSize}`;
    if (cacheKey === this.cachedKey && this.cachedMeasurement) {
      return this.cachedMeasurement;
    }

    // Header font
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;
    const headerText = data.label || `Annotation: ${data.annotationType}`;
    let maxWidth = ctx.measureText(headerText).width;

    // Content font
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;
    
    let contentHeight = 0;
    const labelWidth = 50;

    // Value lines
    if (data.value !== undefined) {
      const valText = formatValue(data.value);
      maxWidth = Math.max(maxWidth, labelWidth + ctx.measureText(valText).width);
      contentHeight += theme.contentFontSize * theme.lineHeight;
    }
    if (data.valueX !== undefined && data.valueY !== undefined) {
      const xText = formatValue(data.valueX);
      const yText = formatValue(data.valueY);
      maxWidth = Math.max(maxWidth, labelWidth + ctx.measureText(xText).width, labelWidth + ctx.measureText(yText).width);
      contentHeight += (theme.contentFontSize * theme.lineHeight) * 2;
    }

    const headerHeight = theme.titleFontSize * theme.lineHeight + theme.headerGap;
    
    this.cachedMeasurement = {
      width: maxWidth + 10,
      height: headerHeight + contentHeight + 4,
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
    data: AnnotationTooltip,
    position: TooltipPosition,
    theme: TooltipTheme
  ): void {
    const { x, y } = position;
    const { padding } = theme;
    
    let currentY = y + padding.top;
    const contentX = x + padding.left;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Header
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;
    ctx.fillStyle = theme.textColor;
    const headerText = data.label || `${data.annotationType.toUpperCase()}`;
    ctx.fillText(headerText, contentX, currentY);
    
    currentY += theme.titleFontSize * theme.lineHeight + 2;

    // Separator
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
    const labelW = 50;

    if (data.value !== undefined) {
      ctx.fillStyle = theme.textSecondaryColor;
      ctx.fillText('Value:', contentX, currentY);
      ctx.fillStyle = theme.textColor;
      ctx.fillText(formatValue(data.value), contentX + labelW, currentY);
      currentY += theme.contentFontSize * theme.lineHeight;
    }

    if (data.valueX !== undefined && data.valueY !== undefined) {
      ctx.fillStyle = theme.textSecondaryColor;
      ctx.fillText('X:', contentX, currentY);
      ctx.fillStyle = theme.textColor;
      ctx.fillText(formatValue(data.valueX), contentX + labelW, currentY);
      currentY += theme.contentFontSize * theme.lineHeight;

      ctx.fillStyle = theme.textSecondaryColor;
      ctx.fillText('Y:', contentX, currentY);
      ctx.fillStyle = theme.textColor;
      ctx.fillText(formatValue(data.valueY), contentX + labelW, currentY);
    }

    ctx.restore();
  }
}

export const annotationTooltipTemplate = new AnnotationTooltipTemplate();
