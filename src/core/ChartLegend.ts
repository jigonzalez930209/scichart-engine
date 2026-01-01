/**
 * ChartLegend - In-chart draggable legend component
 */

import { ChartTheme } from "../theme";
import { Series } from "./Series";

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

  constructor(
    parent: HTMLElement,
    theme: ChartTheme,
    options: { x?: number; y?: number },
    callbacks: ChartLegendCallbacks
  ) {
    this.theme = theme;
    this.callbacks = callbacks;

    this.container = document.createElement("div");
    this.container.className = "scichart-legend";

    // Default position (top-right, below controls toolbar)
    // Controls toolbar height is ~32px (24px buttons + 4px padding*2 + borders) + 8px top margin = ~40px
    // Add extra margin to ensure no overlap
    const x = options.x ?? parent.clientWidth - 150;
    const y = options.y ?? 55;

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
    this.header = document.createElement("div");
    this.header.style.cssText = `
      height: 8px;
      cursor: move;
      background: rgba(255,255,255,0.05);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    `;

    this.content = document.createElement("div");
    this.content.style.padding = `${theme.legend.padding}px`;

    this.container.appendChild(this.header);
    this.container.appendChild(this.content);
    parent.appendChild(this.container);

    this.initDragging();
  }

  private updateStyle(): void {
    const isDark =
      this.theme.name.toLowerCase().includes("dark") ||
      this.theme.name.toLowerCase().includes("midnight") ||
      this.theme.name.toLowerCase().includes("electro");

    this.container.style.background = this.theme.legend.backgroundColor;
    this.container.style.backdropFilter = "blur(12px) saturate(180%)";
    (this.container.style as any).webkitBackdropFilter =
      "blur(12px) saturate(180%)";
    this.container.style.border = `1px solid ${this.theme.legend.borderColor}`;
    this.container.style.boxShadow = isDark
      ? "0 4px 12px rgba(0, 0, 0, 0.6)"
      : "0 4px 12px rgba(0, 0, 0, 0.15)";
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

      this.container.style.transition = "none";
      this.container.style.willChange = "transform";
      this.container.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
      this.container.style.cursor = "grabbing";

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const updatePosition = (clientX: number, clientY: number) => {
      const dx = clientX - this.startX;
      const dy = clientY - this.startY;

      let newX = this.initialX + dx;
      let newY = this.initialY + dy;

      const parent = this.container.parentElement;
      if (parent) {
        newX = Math.max(
          0,
          Math.min(newX, parent.clientWidth - this.container.clientWidth)
        );
        newY = Math.max(
          0,
          Math.min(newY, parent.clientHeight - this.container.clientHeight)
        );
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
        const parentRect =
          this.container.parentElement?.getBoundingClientRect();
        if (parentRect) {
          const finalX = rect.left - parentRect.left;
          const finalY = rect.top - parentRect.top;

          this.container.style.transform = "none";
          this.container.style.left = `${finalX}px`;
          this.container.style.top = `${finalY}px`;

          this.callbacks.onMove(finalX, finalY);
        }

        this.container.style.willChange = "auto";
        this.container.style.transition = "box-shadow 0.2s ease";
        this.container.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        this.container.style.cursor = "auto";
      }
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    this.container.addEventListener("mousedown", onMouseDown);

    // Block events from reaching the chart while over the legend
    this.container.addEventListener("wheel", (e) => e.stopPropagation());
    this.container.addEventListener("click", (e) => e.stopPropagation());
    this.container.addEventListener("dblclick", (e) => e.stopPropagation());
    // Note: mousemove/mouseup on container MUST bubble to document during drag
  }

  public update(series: Series[]): void {
    this.series = series;
    this.render();
  }

  private render(): void {
    this.content.innerHTML = "";
    const legend = this.theme.legend;
    const dpr = window.devicePixelRatio || 1;

    this.series.forEach((s) => {
      const item = document.createElement("div");
      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: ${legend.itemGap}px;
        font-family: ${legend.fontFamily};
        font-size: ${legend.fontSize}px;
        color: ${legend.textColor};
      `;

      // Use a canvas for the swatch to support symbols
      const swatch = document.createElement("canvas");
      const size = legend.swatchSize;
      swatch.width = size * dpr;
      swatch.height = size * dpr;
      swatch.style.width = `${size}px`;
      swatch.style.height = `${size}px`;

      const ctx = swatch.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        const style = s.getStyle();
        const color = style.color || "#ff0055";
        const type = s.getType();
        const symbol = style.symbol || 'circle';
        
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        const centerX = size / 2;
        const centerY = size / 2;

        const typeStr = String(type).toLowerCase();
        const isScatter = typeStr === 'scatter' || typeStr === '1' || (typeStr === 'line' && !!style.symbol);
        const isLineScatter = typeStr.includes('scatter') || typeStr === '2';
        const isArea = typeStr === 'area' || typeStr === 'band';

        if (isScatter) {
          this.drawSymbol(ctx, symbol, centerX, centerY, size * 0.8);
        } else if (isLineScatter) {
          ctx.beginPath();
          ctx.moveTo(0, centerY);
          ctx.lineTo(size, centerY);
          ctx.stroke();
          this.drawSymbol(ctx, symbol, centerX, centerY, size * 0.6);
        } else if (isArea) {
          ctx.globalAlpha = 0.6;
          ctx.fillRect(0, size * 0.2, size, size * 0.6);
          ctx.globalAlpha = 1.0;
          ctx.strokeRect(0, size * 0.2, size, size * 0.6);
        } else if (typeStr === 'candlestick') {
          const bullColor = (style as any).bullishColor || '#26a69a';
          ctx.fillStyle = bullColor;
          ctx.fillRect(size * 0.3, size * 0.2, size * 0.4, size * 0.6);
          ctx.beginPath();
          ctx.moveTo(size * 0.5, 0);
          ctx.lineTo(size * 0.5, size);
          ctx.strokeStyle = bullColor;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, centerY);
          ctx.lineTo(size, centerY);
          ctx.stroke();
        }
      }

      const label = document.createElement("span");
      label.textContent = s.getName();

      item.appendChild(swatch);
      item.appendChild(label);
      this.content.appendChild(item);
    });
  }

  /**
   * Internal symbol drawing logic (shared with canvas export)
   */
  private drawSymbol(
    ctx: CanvasRenderingContext2D,
    symbol: string,
    x: number,
    y: number,
    size: number
  ): void {
    const r = size / 2;
    ctx.beginPath();

    switch (symbol) {
      case 'circle':
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.rect(x - r, y - r, size, size);
        ctx.fill();
        break;
      case 'diamond':
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r);
        ctx.lineTo(x - r, y);
        ctx.closePath();
        ctx.fill();
        break;
      case 'triangle':
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y + r);
        ctx.lineTo(x - r, y + r);
        ctx.closePath();
        ctx.fill();
        break;
      case 'triangleDown':
        ctx.moveTo(x, y + r);
        ctx.lineTo(x + r, y - r);
        ctx.lineTo(x - r, y - r);
        ctx.closePath();
        ctx.fill();
        break;
      case 'cross':
        ctx.moveTo(x - r, y);
        ctx.lineTo(x + r, y);
        ctx.moveTo(x, y - r);
        ctx.lineTo(x, y + r);
        ctx.stroke();
        break;
      case 'x':
        const d = r * 0.707;
        ctx.moveTo(x - d, y - d);
        ctx.lineTo(x + d, y + d);
        ctx.moveTo(x + d, y - d);
        ctx.lineTo(x - d, y + d);
        ctx.stroke();
        break;
      case 'star':
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(
            x + r * Math.cos(((18 + i * 72) / 180) * Math.PI),
            y - r * Math.sin(((18 + i * 72) / 180) * Math.PI)
          );
          ctx.lineTo(
            x + (r / 2) * Math.cos(((54 + i * 72) / 180) * Math.PI),
            y - (r / 2) * Math.sin(((54 + i * 72) / 180) * Math.PI)
          );
        }
        ctx.closePath();
        ctx.fill();
        break;
    }
  }

  public draw(ctx: CanvasRenderingContext2D, dpr: number): void {
    if (this.series.length === 0) return;

    const legend = this.theme.legend;
    const padding = legend.padding * dpr;
    const itemGap = legend.itemGap * dpr;
    const swatchSize = legend.swatchSize * dpr;
    const headerHeight = 8 * dpr;

    const x = this.container.offsetLeft * dpr;
    const y = this.container.offsetTop * dpr;
    const width = this.container.clientWidth * dpr;
    const height = this.container.clientHeight * dpr;

    ctx.save();

    // 1. Draw background
    const isDark =
      this.theme.name.toLowerCase().includes("dark") ||
      this.theme.name.toLowerCase().includes("midnight");
    ctx.fillStyle = isDark
      ? legend.backgroundColor
      : "rgba(255, 255, 255, 0.85)";
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
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `${legend.fontSize * dpr}px ${legend.fontFamily}`;

    this.series.forEach((s, i) => {
      const itemY =
        y +
        headerHeight +
        padding +
        i * (swatchSize + itemGap) +
        swatchSize / 2;
      
      const centerX = x + padding + swatchSize / 2;
      const centerY = itemY;
      const style = s.getStyle();
      const type = s.getType();
      const symbol = style.symbol || 'circle';

      ctx.fillStyle = style.color || "#ff0055";
      ctx.strokeStyle = style.color || "#ff0055";
      ctx.lineWidth = 2 * dpr;

      const typeStr = String(type).toLowerCase();
      const isScatter = typeStr === 'scatter' || typeStr === '1' || (typeStr === 'line' && !!style.symbol);
      const isLineScatter = typeStr.includes('scatter') || typeStr === '2';

      if (isScatter) {
        this.drawSymbol(ctx, symbol, centerX, centerY, swatchSize * 0.9);
      } else if (isLineScatter) {
        ctx.beginPath();
        ctx.moveTo(x + padding, centerY);
        ctx.lineTo(x + padding + swatchSize, centerY);
        ctx.stroke();
        this.drawSymbol(ctx, symbol, centerX, centerY, swatchSize * 0.6);
      } else {
        ctx.beginPath();
        ctx.moveTo(x + padding, centerY);
        ctx.lineTo(x + padding + swatchSize, centerY);
        ctx.stroke();
      }

      ctx.fillStyle = legend.textColor;
      ctx.fillText(s.getName(), x + padding + swatchSize + 8 * dpr, itemY);
    });

    ctx.restore();
  }

  public updateTheme(theme: ChartTheme): void {
    this.theme = theme;
    this.updateStyle();
    this.render();
  }

  public setVisible(visible: boolean): void {
    this.container.style.display = visible ? "block" : "none";
  }

  public destroy(): void {
    this.container.remove();
  }
}
