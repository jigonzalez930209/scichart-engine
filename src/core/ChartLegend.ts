/**
 * ChartLegend - In-chart draggable legend component
 */

import { ChartTheme } from '../theme';
import { Series } from './Series';

export interface ChartLegendCallbacks {
  onMove: (x: number, y: number) => void;
}

export class ChartLegend {
  private container: HTMLDivElement;
  private header: HTMLDivElement;
  private content: HTMLDivElement;
  private theme: ChartTheme;
  private series: Series[] = [];
  private callbacks: ChartLegendCallbacks;

  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private initialX = 0;
  private initialY = 0;

  constructor(parent: HTMLElement, theme: ChartTheme, options: { x?: number, y?: number }, callbacks: ChartLegendCallbacks) {
    this.theme = theme;
    this.callbacks = callbacks;

    this.container = document.createElement('div');
    this.container.className = 'scichart-legend';
    
    // Default position (top-right with some margin)
    const x = options.x ?? (parent.clientWidth - 150);
    const y = options.y ?? 20;

    this.container.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      z-index: 90;
      pointer-events: auto;
      min-width: 120px;
      border-radius: ${theme.legend.borderRadius}px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      user-select: none;
      transition: box-shadow 0.2s ease;
    `;

    this.updateStyle();

    // Draggable header
    this.header = document.createElement('div');
    this.header.style.cssText = `
      height: 8px;
      cursor: move;
      background: rgba(255,255,255,0.05);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    `;
    
    this.content = document.createElement('div');
    this.content.style.padding = `${theme.legend.padding}px`;

    this.container.appendChild(this.header);
    this.container.appendChild(this.content);
    parent.appendChild(this.container);

    this.initDragging();
  }

  private updateStyle(): void {
    const isDark = this.theme.name.toLowerCase().includes('dark') || this.theme.name.toLowerCase().includes('midnight');
    const bg = this.theme.legend.backgroundColor;
    const border = this.theme.legend.borderColor;

    this.container.style.background = isDark ? bg : 'rgba(255, 255, 255, 0.85)';
    this.container.style.backdropFilter = 'blur(10px)';
    this.container.style.border = `1px solid ${border}`;
  }

  private initDragging(): void {
    let rafId: number | null = null;

    const onMouseDown = (e: MouseEvent) => {
      // Only handle left click
      if (e.button !== 0) return;

      e.stopPropagation();
      e.preventDefault();

      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.initialX = this.container.offsetLeft;
      this.initialY = this.container.offsetTop;
      
      this.container.style.transition = 'none';
      this.container.style.willChange = 'transform';
      this.container.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      this.container.style.cursor = 'grabbing';
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const updatePosition = (clientX: number, clientY: number) => {
      const dx = clientX - this.startX;
      const dy = clientY - this.startY;
      
      let newX = this.initialX + dx;
      let newY = this.initialY + dy;

      const parent = this.container.parentElement;
      if (parent) {
        newX = Math.max(0, Math.min(newX, parent.clientWidth - this.container.clientWidth));
        newY = Math.max(0, Math.min(newY, parent.clientHeight - this.container.clientHeight));
      }

      // Use transform for better performance (no layout recalc)
      const tx = newX - this.initialX;
      const ty = newY - this.initialY;
      this.container.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => updatePosition(e.clientX, e.clientY));
    };

    const onMouseUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        if (rafId) cancelAnimationFrame(rafId);
        
        // Finalize position and commit to left/top (to keep it there)
        const rect = this.container.getBoundingClientRect();
        const parentRect = this.container.parentElement?.getBoundingClientRect();
        if (parentRect) {
          const finalX = rect.left - parentRect.left;
          const finalY = rect.top - parentRect.top;
          
          this.container.style.transform = 'none';
          this.container.style.left = `${finalX}px`;
          this.container.style.top = `${finalY}px`;
          
          this.callbacks.onMove(finalX, finalY);
        }

        this.container.style.willChange = 'auto';
        this.container.style.transition = 'box-shadow 0.2s ease';
        this.container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        this.container.style.cursor = 'auto';
      }
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    this.container.addEventListener('mousedown', onMouseDown);

    // Block events from reaching the chart while over the legend
    this.container.addEventListener('wheel', (e) => e.stopPropagation());
    this.container.addEventListener('click', (e) => e.stopPropagation());
    this.container.addEventListener('dblclick', (e) => e.stopPropagation());
    // Note: mousemove/mouseup on container MUST bubble to document during drag
  }

  public update(series: Series[]): void {
    this.series = series;
    this.render();
  }

  private render(): void {
    this.content.innerHTML = '';
    const legend = this.theme.legend;

    this.series.forEach((s) => {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: ${legend.itemGap}px;
        font-family: ${legend.fontFamily};
        font-size: ${legend.fontSize}px;
        color: ${legend.textColor};
      `;

      const swatch = document.createElement('div');
      swatch.style.cssText = `
        width: ${legend.swatchSize}px;
        height: ${legend.swatchSize}px;
        background: ${s.getStyle().color || '#ff0055'};
        border-radius: 2px;
      `;

      const label = document.createElement('span');
      label.textContent = s.getId();

      item.appendChild(swatch);
      item.appendChild(label);
      this.content.appendChild(item);
    });
  }

  public draw(ctx: CanvasRenderingContext2D, dpr: number): void {
    if (this.series.length === 0) return;

    const legend = this.theme.legend;
    const padding = legend.padding * dpr;
    const itemGap = legend.itemGap * dpr;
    const swatchSize = legend.swatchSize * dpr;
    const headerHeight = 8 * dpr; // Matching the 8px header in constructor
    
    // Get current position in pixels
    const x = this.container.offsetLeft * dpr;
    const y = this.container.offsetTop * dpr;
    const width = this.container.clientWidth * dpr;
    const height = this.container.clientHeight * dpr;

    ctx.save();
    
    // 1. Draw background
    const isDark = this.theme.name.toLowerCase().includes('dark') || this.theme.name.toLowerCase().includes('midnight');
    ctx.fillStyle = isDark ? legend.backgroundColor : 'rgba(255, 255, 255, 0.85)';
    ctx.strokeStyle = legend.borderColor;
    ctx.lineWidth = 1 * dpr;
    
    const r = legend.borderRadius * dpr;
    ctx.beginPath();
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
    ctx.fill();
    ctx.stroke();

    // 2. Draw Items
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `${legend.fontSize * dpr}px ${legend.fontFamily}`;

    this.series.forEach((s, i) => {
      // Offset by headerHeight and padding
      const itemY = y + headerHeight + padding + i * (swatchSize + itemGap) + swatchSize / 2;
      
      // Swatch
      ctx.fillStyle = s.getStyle().color || '#ff0055';
      ctx.fillRect(x + padding, itemY - swatchSize / 2, swatchSize, swatchSize);

      // Label
      ctx.fillStyle = legend.textColor;
      ctx.fillText(s.getId(), x + padding + swatchSize + 8 * dpr, itemY);
    });
    
    ctx.restore();
  }

  public updateTheme(theme: ChartTheme): void {
    this.theme = theme;
    this.updateStyle();
    this.render();
  }

  public destroy(): void {
    this.container.remove();
  }
}
