/**
 * Tooltip Renderer - Canvas 2D tooltip rendering
 * 
 * High-performance Canvas rendering for tooltips with:
 * - Glassmorphism effects
 * - Smooth gradients and shadows
 * - Arrow/pointer drawing
 * - Animation support
 * 
 * @module tooltip/TooltipRenderer
 */

import type {
  TooltipData,
  TooltipPosition,
  TooltipTheme,
  TooltipTemplate,
  ArrowPosition
} from './types';

/**
 * TooltipRenderer handles all Canvas 2D rendering for tooltips
 */
export class TooltipRenderer {
  private ctx: CanvasRenderingContext2D;
  private theme: TooltipTheme;

  constructor(ctx: CanvasRenderingContext2D, theme: TooltipTheme) {
    this.ctx = ctx;
    this.theme = theme;
  }

  /**
   * Update the theme
   */
  setTheme(theme: TooltipTheme): void {
    this.theme = theme;
  }

  /**
   * Render a tooltip with the given template
   */
  render<T extends TooltipData>(
    data: T,
    position: TooltipPosition,
    template: TooltipTemplate<T>
  ): void {
    const measurement = template.measure(this.ctx, data, this.theme);
    const totalWidth = measurement.width + measurement.padding.left + measurement.padding.right;
    const totalHeight = measurement.height + measurement.padding.top + measurement.padding.bottom;

    this.ctx.save();

    // Draw background with effects
    this.drawBackground(position.x, position.y, totalWidth, totalHeight, position.arrowPosition || 'none');

    // Draw arrow if enabled
    if (position.arrowPosition && position.arrowPosition !== 'none') {
      this.drawArrow(
        position.x,
        position.y,
        totalWidth,
        totalHeight,
        position.arrowPosition,
        position.arrowOffset || 0
      );
    }

    // Let template render content
    template.render(this.ctx, data, position, this.theme);

    this.ctx.restore();
  }



  /**
   * Draw tooltip background with all effects
   */
  private drawBackground(
    x: number,
    y: number,
    width: number,
    height: number,
    _arrowPosition: ArrowPosition
  ): void {
    const { ctx, theme } = this;
    const r = theme.borderRadius;

    ctx.save();

    // Shadow
    if (theme.shadow.blur > 0) {
      ctx.shadowColor = theme.shadow.color;
      ctx.shadowOffsetX = theme.shadow.offsetX;
      ctx.shadowOffsetY = theme.shadow.offsetY;
      ctx.shadowBlur = theme.shadow.blur;
    }

    // Create rounded rect path
    ctx.beginPath();
    this.roundRect(x, y, width, height, r);

    // Fill with gradient or solid color
    if (theme.backgroundGradient) {
      const gradient = ctx.createLinearGradient(x, y, x, y + height);
      gradient.addColorStop(0, theme.backgroundColor);
      gradient.addColorStop(1, theme.backgroundGradient);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = theme.backgroundColor;
    }
    ctx.fill();

    // Reset shadow for border
    ctx.shadowColor = 'transparent';

    // Border
    if (theme.borderWidth > 0) {
      ctx.strokeStyle = theme.borderColor;
      ctx.lineWidth = theme.borderWidth;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draw arrow pointing to target
   */
  private drawArrow(
    x: number,
    y: number,
    width: number,
    height: number,
    arrowPosition: ArrowPosition,
    arrowOffset: number
  ): void {
    const { ctx, theme } = this;
    const size = theme.arrowSize;

    if (size <= 0 || arrowPosition === 'none') return;

    ctx.save();
    ctx.fillStyle = theme.backgroundColor;
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = theme.borderWidth;

    ctx.beginPath();

    switch (arrowPosition) {
      case 'top':
        // Arrow pointing up (tooltip below target)
        const topX = x + arrowOffset;
        ctx.moveTo(topX - size, y);
        ctx.lineTo(topX, y - size);
        ctx.lineTo(topX + size, y);
        break;

      case 'bottom':
        // Arrow pointing down (tooltip above target)
        const bottomX = x + arrowOffset;
        const bottomY = y + height;
        ctx.moveTo(bottomX - size, bottomY);
        ctx.lineTo(bottomX, bottomY + size);
        ctx.lineTo(bottomX + size, bottomY);
        break;

      case 'left':
        // Arrow pointing left (tooltip right of target)
        const leftY = y + arrowOffset;
        ctx.moveTo(x, leftY - size);
        ctx.lineTo(x - size, leftY);
        ctx.lineTo(x, leftY + size);
        break;

      case 'right':
        // Arrow pointing right (tooltip left of target)
        const rightX = x + width;
        const rightY = y + arrowOffset;
        ctx.moveTo(rightX, rightY - size);
        ctx.lineTo(rightX + size, rightY);
        ctx.lineTo(rightX, rightY + size);
        break;
    }

    ctx.closePath();
    ctx.fill();

    if (theme.borderWidth > 0) {
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draw a rounded rectangle path
   */
  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    const { ctx } = this;
    const r = Math.min(radius, width / 2, height / 2);

    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /**
   * Draw a horizontal separator line
   */
  drawSeparator(x: number, y: number, width: number): void {
    const { ctx, theme } = this;

    if (!theme.showHeaderSeparator) return;

    ctx.save();
    ctx.strokeStyle = theme.separatorColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw a series color indicator (small circle or square)
   */
  drawSeriesIndicator(x: number, y: number, color: string): void {
    const { ctx, theme } = this;

    if (!theme.showSeriesIndicator) return;

    const size = theme.seriesIndicatorSize;
    const radius = size / 2;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + radius, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Measure text width
   */
  measureText(text: string, fontSize: number, fontWeight: number | string = 400): number {
    const { ctx, theme } = this;
    ctx.font = `${fontWeight} ${fontSize}px ${theme.fontFamily}`;
    return ctx.measureText(text).width;
  }

  /**
   * Draw text with theme styling
   */
  drawText(
    text: string,
    x: number,
    y: number,
    options: {
      fontSize?: number;
      fontWeight?: number | string;
      color?: string;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
    } = {}
  ): void {
    const { ctx, theme } = this;
    const {
      fontSize = theme.contentFontSize,
      fontWeight = 400,
      color = theme.textColor,
      align = 'left',
      baseline = 'top'
    } = options;

    ctx.save();
    ctx.font = `${fontWeight} ${fontSize}px ${theme.fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /**
   * Draw a label-value pair
   */
  drawLabelValue(
    x: number,
    y: number,
    label: string,
    value: string,
    maxWidth: number
  ): void {
    const { theme } = this;

    // Draw label (secondary color)
    this.drawText(label, x, y, {
      color: theme.textSecondaryColor,
      fontSize: theme.contentFontSize
    });

    // Draw value (primary color, right-aligned)
    this.drawText(value, x + maxWidth, y, {
      color: theme.textColor,
      fontSize: theme.contentFontSize,
      align: 'right'
    });
  }

  /**
   * Get theme for external use
   */
  getTheme(): TooltipTheme {
    return this.theme;
  }
}

/**
 * Create a tooltip renderer
 */
export function createTooltipRenderer(
  ctx: CanvasRenderingContext2D,
  theme: TooltipTheme
): TooltipRenderer {
  return new TooltipRenderer(ctx, theme);
}
