/**
 * AnnotationManager - Manages chart annotations
 * 
 * Handles creation, update, removal, and rendering of all annotation types.
 */

import type { Bounds } from '../../types';
import type {
  Annotation,
  HorizontalLineAnnotation,
  VerticalLineAnnotation,
  RectangleAnnotation,
  BandAnnotation,
  TextAnnotation,
  ArrowAnnotation,
} from './types';

// ============================================
// Default Styles
// ============================================

const DEFAULT_STYLES = {
  line: {
    color: 'rgba(255, 255, 255, 0.7)',
    lineWidth: 1,
    lineDash: [] as number[],
  },
  rectangle: {
    fillColor: 'rgba(100, 100, 255, 0.2)',
    strokeColor: 'rgba(100, 100, 255, 0.5)',
    strokeWidth: 1,
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
  },
  arrow: {
    color: 'rgba(255, 255, 255, 0.7)',
    lineWidth: 2,
    headSize: 10,
  },
};

// ============================================
// Plot Area Type
// ============================================

export interface PlotArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================
// AnnotationManager Class
// ============================================

export class AnnotationManager {
  private annotations: Map<string, Annotation> = new Map();
  private idCounter = 0;
  
  // ----------------------------------------
  // CRUD Operations
  // ----------------------------------------
  
  /**
   * Add a new annotation
   * @returns The annotation ID
   */
  add(annotation: Annotation): string {
    const id = annotation.id ?? `annotation-${++this.idCounter}`;
    const resolved: Annotation = {
      ...annotation,
      id,
      visible: annotation.visible ?? true,
      interactive: annotation.interactive ?? false,
      zIndex: annotation.zIndex ?? 0,
    };
    
    this.annotations.set(id, resolved);
    return id;
  }
  
  /**
   * Remove an annotation by ID
   */
  remove(id: string): boolean {
    return this.annotations.delete(id);
  }
  
  /**
   * Update an annotation
   */
  update(id: string, updates: Partial<Annotation>): void {
    const existing = this.annotations.get(id);
    if (existing) {
      this.annotations.set(id, { ...existing, ...updates } as Annotation);
    }
  }
  
  /**
   * Get an annotation by ID
   */
  get(id: string): Annotation | undefined {
    return this.annotations.get(id);
  }
  
  /**
   * Get all annotations
   */
  getAll(): Annotation[] {
    return Array.from(this.annotations.values());
  }
  
  /**
   * Clear all annotations
   */
  clear(): void {
    this.annotations.clear();
  }
  
  /**
   * Get count of annotations
   */
  get count(): number {
    return this.annotations.size;
  }
  
  // ----------------------------------------
  // Rendering
  // ----------------------------------------
  
  /**
   * Render all annotations
   */
  render(
    ctx: CanvasRenderingContext2D,
    plotArea: PlotArea,
    bounds: Bounds
  ): void {
    // Sort by zIndex
    const sorted = this.getAll()
      .filter(a => a.visible !== false)
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    
    ctx.save();
    
    // Clip to plot area
    ctx.beginPath();
    ctx.rect(plotArea.x, plotArea.y, plotArea.width, plotArea.height);
    ctx.clip();
    
    for (const annotation of sorted) {
      this.renderAnnotation(ctx, annotation, plotArea, bounds);
    }
    
    ctx.restore();
  }
  
  private renderAnnotation(
    ctx: CanvasRenderingContext2D,
    annotation: Annotation,
    plotArea: PlotArea,
    bounds: Bounds
  ): void {
    switch (annotation.type) {
      case 'horizontal-line':
        this.renderHorizontalLine(ctx, annotation, plotArea, bounds);
        break;
      case 'vertical-line':
        this.renderVerticalLine(ctx, annotation, plotArea, bounds);
        break;
      case 'rectangle':
        this.renderRectangle(ctx, annotation, plotArea, bounds);
        break;
      case 'band':
        this.renderBand(ctx, annotation, plotArea, bounds);
        break;
      case 'text':
        this.renderText(ctx, annotation, plotArea, bounds);
        break;
      case 'arrow':
        this.renderArrow(ctx, annotation, plotArea, bounds);
        break;
    }
  }
  
  // ----------------------------------------
  // Coordinate Conversion
  // ----------------------------------------
  
  private dataToPixelX(value: number, bounds: Bounds, plotArea: PlotArea): number {
    const normalized = (value - bounds.xMin) / (bounds.xMax - bounds.xMin);
    return plotArea.x + normalized * plotArea.width;
  }
  
  private dataToPixelY(value: number, bounds: Bounds, plotArea: PlotArea): number {
    const normalized = (value - bounds.yMin) / (bounds.yMax - bounds.yMin);
    return plotArea.y + plotArea.height * (1 - normalized);
  }
  
  // ----------------------------------------
  // Render: Horizontal Line
  // ----------------------------------------
  
  private renderHorizontalLine(
    ctx: CanvasRenderingContext2D,
    annotation: HorizontalLineAnnotation,
    plotArea: PlotArea,
    bounds: Bounds
  ): void {
    const y = this.dataToPixelY(annotation.y, bounds, plotArea);
    
    // Skip if outside visible area
    if (y < plotArea.y || y > plotArea.y + plotArea.height) return;
    
    const xStart = annotation.xMin !== undefined 
      ? Math.max(this.dataToPixelX(annotation.xMin, bounds, plotArea), plotArea.x)
      : plotArea.x;
    const xEnd = annotation.xMax !== undefined
      ? Math.min(this.dataToPixelX(annotation.xMax, bounds, plotArea), plotArea.x + plotArea.width)
      : plotArea.x + plotArea.width;
    
    ctx.save();
    ctx.strokeStyle = annotation.color ?? DEFAULT_STYLES.line.color;
    ctx.lineWidth = annotation.lineWidth ?? DEFAULT_STYLES.line.lineWidth;
    ctx.setLineDash(annotation.lineDash ?? DEFAULT_STYLES.line.lineDash);
    
    ctx.beginPath();
    ctx.moveTo(xStart, y);
    ctx.lineTo(xEnd, y);
    ctx.stroke();
    
    // Render label if present
    if (annotation.label) {
      this.renderLineLabel(
        ctx, 
        annotation.label, 
        xStart, xEnd, y, 
        annotation.labelPosition ?? 'right',
        'horizontal',
        annotation.labelBackground
      );
    }
    
    ctx.restore();
  }
  
  // ----------------------------------------
  // Render: Vertical Line
  // ----------------------------------------
  
  private renderVerticalLine(
    ctx: CanvasRenderingContext2D,
    annotation: VerticalLineAnnotation,
    plotArea: PlotArea,
    bounds: Bounds
  ): void {
    const x = this.dataToPixelX(annotation.x, bounds, plotArea);
    
    // Skip if outside visible area
    if (x < plotArea.x || x > plotArea.x + plotArea.width) return;
    
    const yStart = annotation.yMin !== undefined
      ? Math.min(this.dataToPixelY(annotation.yMin, bounds, plotArea), plotArea.y + plotArea.height)
      : plotArea.y;
    const yEnd = annotation.yMax !== undefined
      ? Math.max(this.dataToPixelY(annotation.yMax, bounds, plotArea), plotArea.y)
      : plotArea.y + plotArea.height;
    
    ctx.save();
    ctx.strokeStyle = annotation.color ?? DEFAULT_STYLES.line.color;
    ctx.lineWidth = annotation.lineWidth ?? DEFAULT_STYLES.line.lineWidth;
    ctx.setLineDash(annotation.lineDash ?? DEFAULT_STYLES.line.lineDash);
    
    ctx.beginPath();
    ctx.moveTo(x, yStart);
    ctx.lineTo(x, yEnd);
    ctx.stroke();
    
    // Render label if present
    if (annotation.label) {
      this.renderLineLabel(
        ctx,
        annotation.label,
        yStart, yEnd, x,
        annotation.labelPosition ?? 'top',
        'vertical',
        annotation.labelBackground
      );
    }
    
    ctx.restore();
  }
  
  // ----------------------------------------
  // Render: Rectangle
  // ----------------------------------------
  
  private renderRectangle(
    ctx: CanvasRenderingContext2D,
    annotation: RectangleAnnotation,
    plotArea: PlotArea,
    bounds: Bounds
  ): void {
    const x1 = this.dataToPixelX(annotation.xMin, bounds, plotArea);
    const x2 = this.dataToPixelX(annotation.xMax, bounds, plotArea);
    const y1 = this.dataToPixelY(annotation.yMax, bounds, plotArea); // Note: Y is inverted
    const y2 = this.dataToPixelY(annotation.yMin, bounds, plotArea);
    
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    
    ctx.save();
    
    // Fill
    if (annotation.fillColor) {
      ctx.fillStyle = annotation.fillColor;
      ctx.fillRect(x, y, width, height);
    }
    
    // Stroke
    if (annotation.strokeColor) {
      ctx.strokeStyle = annotation.strokeColor;
      ctx.lineWidth = annotation.strokeWidth ?? DEFAULT_STYLES.rectangle.strokeWidth;
      ctx.setLineDash(annotation.strokeDash ?? []);
      ctx.strokeRect(x, y, width, height);
    }
    
    // Label
    if (annotation.label) {
      this.renderCenteredLabel(ctx, annotation.label, x + width / 2, y + height / 2);
    }
    
    ctx.restore();
  }
  
  // ----------------------------------------
  // Render: Band
  // ----------------------------------------
  
  private renderBand(
    ctx: CanvasRenderingContext2D,
    annotation: BandAnnotation,
    plotArea: PlotArea,
    bounds: Bounds
  ): void {
    // Determine band type and calculate bounds
    let x: number, y: number, width: number, height: number;
    
    if (annotation.xMin !== undefined && annotation.xMax !== undefined) {
      // Vertical band (spans full Y)
      const x1 = this.dataToPixelX(annotation.xMin, bounds, plotArea);
      const x2 = this.dataToPixelX(annotation.xMax, bounds, plotArea);
      x = Math.min(x1, x2);
      width = Math.abs(x2 - x1);
      y = plotArea.y;
      height = plotArea.height;
      
      if (annotation.yMin !== undefined) {
        const yPixel = this.dataToPixelY(annotation.yMin, bounds, plotArea);
        height = yPixel - y;
      }
      if (annotation.yMax !== undefined) {
        const yPixel = this.dataToPixelY(annotation.yMax, bounds, plotArea);
        y = yPixel;
        height = plotArea.y + plotArea.height - y;
      }
    } else if (annotation.yMin !== undefined && annotation.yMax !== undefined) {
      // Horizontal band (spans full X)
      const y1 = this.dataToPixelY(annotation.yMax, bounds, plotArea);
      const y2 = this.dataToPixelY(annotation.yMin, bounds, plotArea);
      y = Math.min(y1, y2);
      height = Math.abs(y2 - y1);
      x = plotArea.x;
      width = plotArea.width;
    } else {
      // Invalid band configuration
      return;
    }
    
    ctx.save();
    
    // Fill
    ctx.fillStyle = annotation.fillColor ?? DEFAULT_STYLES.rectangle.fillColor;
    ctx.fillRect(x, y, width, height);
    
    // Stroke
    if (annotation.strokeColor) {
      ctx.strokeStyle = annotation.strokeColor;
      ctx.lineWidth = annotation.strokeWidth ?? 1;
      ctx.strokeRect(x, y, width, height);
    }
    
    // Label
    if (annotation.label) {
      let labelX = x + width / 2;
      let labelY = y + height / 2;
      
      switch (annotation.labelPosition) {
        case 'top':
          labelY = y + 15;
          break;
        case 'bottom':
          labelY = y + height - 5;
          break;
        case 'left':
          labelX = x + 10;
          break;
        case 'right':
          labelX = x + width - 10;
          break;
      }
      
      this.renderCenteredLabel(ctx, annotation.label, labelX, labelY);
    }
    
    ctx.restore();
  }
  
  // ----------------------------------------
  // Render: Text
  // ----------------------------------------
  
  private renderText(
    ctx: CanvasRenderingContext2D,
    annotation: TextAnnotation,
    plotArea: PlotArea,
    bounds: Bounds
  ): void {
    const x = this.dataToPixelX(annotation.x, bounds, plotArea);
    const y = this.dataToPixelY(annotation.y, bounds, plotArea);
    
    ctx.save();
    
    // Apply rotation if specified
    if (annotation.rotation) {
      ctx.translate(x, y);
      ctx.rotate((annotation.rotation * Math.PI) / 180);
      ctx.translate(-x, -y);
    }
    
    const fontSize = annotation.fontSize ?? DEFAULT_STYLES.text.fontSize;
    const fontFamily = annotation.fontFamily ?? DEFAULT_STYLES.text.fontFamily;
    const fontWeight = annotation.fontWeight ?? 'normal';
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Measure text for background
    const metrics = ctx.measureText(annotation.text);
    const padding = annotation.padding ?? DEFAULT_STYLES.text.padding;
    const textWidth = metrics.width + padding * 2;
    const textHeight = fontSize + padding * 2;
    
    // Calculate position based on anchor
    let drawX = x;
    let drawY = y;
    
    switch (annotation.anchor) {
      case 'top-left':
        drawX += textWidth / 2;
        drawY += textHeight / 2;
        break;
      case 'top-right':
        drawX -= textWidth / 2;
        drawY += textHeight / 2;
        break;
      case 'bottom-left':
        drawX += textWidth / 2;
        drawY -= textHeight / 2;
        break;
      case 'bottom-right':
        drawX -= textWidth / 2;
        drawY -= textHeight / 2;
        break;
      case 'top-center':
        drawY += textHeight / 2;
        break;
      case 'bottom-center':
        drawY -= textHeight / 2;
        break;
      case 'left-center':
        drawX += textWidth / 2;
        break;
      case 'right-center':
        drawX -= textWidth / 2;
        break;
    }
    
    // Draw background
    if (annotation.backgroundColor) {
      ctx.fillStyle = annotation.backgroundColor;
      ctx.beginPath();
      ctx.roundRect(
        drawX - textWidth / 2,
        drawY - textHeight / 2,
        textWidth,
        textHeight,
        4
      );
      ctx.fill();
    }
    
    // Draw text
    ctx.fillStyle = annotation.color ?? DEFAULT_STYLES.text.color;
    ctx.fillText(annotation.text, drawX, drawY);
    
    ctx.restore();
  }
  
  // ----------------------------------------
  // Render: Arrow
  // ----------------------------------------
  
  private renderArrow(
    ctx: CanvasRenderingContext2D,
    annotation: ArrowAnnotation,
    plotArea: PlotArea,
    bounds: Bounds
  ): void {
    const x1 = this.dataToPixelX(annotation.x1, bounds, plotArea);
    const y1 = this.dataToPixelY(annotation.y1, bounds, plotArea);
    const x2 = this.dataToPixelX(annotation.x2, bounds, plotArea);
    const y2 = this.dataToPixelY(annotation.y2, bounds, plotArea);
    
    ctx.save();
    ctx.strokeStyle = annotation.color ?? DEFAULT_STYLES.arrow.color;
    ctx.fillStyle = annotation.color ?? DEFAULT_STYLES.arrow.color;
    ctx.lineWidth = annotation.lineWidth ?? DEFAULT_STYLES.arrow.lineWidth;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw arrow head
    const headSize = annotation.headSize ?? DEFAULT_STYLES.arrow.headSize;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    const headStyle = annotation.headStyle ?? 'filled';
    
    if (headStyle !== 'none') {
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - headSize * Math.cos(angle - Math.PI / 6),
        y2 - headSize * Math.sin(angle - Math.PI / 6)
      );
      
      if (headStyle === 'filled') {
        ctx.lineTo(
          x2 - headSize * Math.cos(angle + Math.PI / 6),
          y2 - headSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headSize * Math.cos(angle + Math.PI / 6),
          y2 - headSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    }
    
    // Draw tail arrow if specified
    if (annotation.showTail) {
      const tailAngle = angle + Math.PI;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(
        x1 - headSize * Math.cos(tailAngle - Math.PI / 6),
        y1 - headSize * Math.sin(tailAngle - Math.PI / 6)
      );
      ctx.lineTo(
        x1 - headSize * Math.cos(tailAngle + Math.PI / 6),
        y1 - headSize * Math.sin(tailAngle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw label if present
    if (annotation.label) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      this.renderCenteredLabel(ctx, annotation.label, midX, midY - 10);
    }
    
    ctx.restore();
  }
  
  // ----------------------------------------
  // Helper: Render Labels
  // ----------------------------------------
  
  private renderLineLabel(
    ctx: CanvasRenderingContext2D,
    label: string,
    start: number,
    end: number,
    cross: number,
    position: string,
    orientation: 'horizontal' | 'vertical',
    backgroundColor?: string
  ): void {
    ctx.save();
    
    ctx.font = `${DEFAULT_STYLES.text.fontSize}px ${DEFAULT_STYLES.text.fontFamily}`;
    const metrics = ctx.measureText(label);
    const padding = 4;
    const textWidth = metrics.width + padding * 2;
    const textHeight = DEFAULT_STYLES.text.fontSize + padding * 2;
    
    let x: number, y: number;
    
    if (orientation === 'horizontal') {
      y = cross;
      
      switch (position) {
        case 'left':
          x = start + 5;
          ctx.textAlign = 'left';
          break;
        case 'right':
          x = end - 5;
          ctx.textAlign = 'right';
          break;
        default:
          x = (start + end) / 2;
          ctx.textAlign = 'center';
      }
      
      ctx.textBaseline = 'bottom';
      y -= 4;
    } else {
      x = cross;
      
      switch (position) {
        case 'top':
          y = start + textHeight;
          break;
        case 'bottom':
          y = end - 5;
          break;
        default:
          y = (start + end) / 2;
      }
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    }
    
    // Background
    if (backgroundColor ?? true) {
      ctx.fillStyle = backgroundColor ?? 'rgba(0, 0, 0, 0.7)';
      const bgX = ctx.textAlign === 'left' ? x - padding 
                : ctx.textAlign === 'right' ? x - textWidth + padding
                : x - textWidth / 2;
      ctx.fillRect(bgX, y - textHeight + padding, textWidth, textHeight);
    }
    
    // Text
    ctx.fillStyle = DEFAULT_STYLES.text.color;
    ctx.fillText(label, x, y);
    
    ctx.restore();
  }
  
  private renderCenteredLabel(
    ctx: CanvasRenderingContext2D,
    label: string,
    x: number,
    y: number
  ): void {
    ctx.save();
    
    ctx.font = `${DEFAULT_STYLES.text.fontSize}px ${DEFAULT_STYLES.text.fontFamily}`;
    const metrics = ctx.measureText(label);
    const padding = 4;
    const textWidth = metrics.width + padding * 2;
    const textHeight = DEFAULT_STYLES.text.fontSize + padding * 2;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(x - textWidth / 2, y - textHeight / 2, textWidth, textHeight, 3);
    ctx.fill();
    
    // Text
    ctx.fillStyle = DEFAULT_STYLES.text.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
    
    ctx.restore();
  }
}
