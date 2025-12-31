/**
 * ChartStatistics - In-chart statistics panel
 * 
 * Displays real-time statistics (Min, Max, Mean, StdDev, Area) 
 * for the visible data range of active series.
 */

import { ChartTheme } from "../theme";
import { Series } from "./Series";
import { calculateStats, integrate } from "../analysis";
import { Bounds } from "../types";

export class ChartStatistics {
  private container: HTMLDivElement;
  private content: HTMLDivElement;
  private theme: ChartTheme;
  private series: Map<string, Series>;
  private isExpanded = false;

  constructor(
    parent: HTMLElement,
    theme: ChartTheme,
    series: Map<string, Series>
  ) {
    this.theme = theme;
    this.series = series;

    this.container = document.createElement("div");
    this.container.className = "scichart-stats-panel";
    this.updateContainerStyle();

    const title = document.createElement("div");
    title.innerHTML = "📊 Statistics";
    title.style.cssText = `
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    `;
    title.onclick = () => this.toggle();

    this.content = document.createElement("div");
    this.content.style.display = "none";
    
    this.container.appendChild(title);
    this.container.appendChild(this.content);
    parent.appendChild(this.container);
  }

  private isDarkTheme(): boolean {
    const name = this.theme.name.toLowerCase();
    return name.includes("dark") || name.includes("midnight") || name.includes("electro");
  }

  private updateContainerStyle(): void {
    const isDark = this.isDarkTheme();
    const bg = isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.95)";
    const color = isDark ? "#f1f5f9" : "#1e293b";
    const borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
    const shadow = isDark ? "0 4px 12px rgba(0, 0, 0, 0.5)" : "0 4px 12px rgba(0, 0, 0, 0.1)";

    this.container.style.cssText = `
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 240px;
      background: ${bg};
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid ${borderColor};
      border-radius: 8px;
      box-shadow: ${shadow};
      color: ${color};
      font-family: system-ui, -apple-system, sans-serif;
      padding: 8px 12px;
      z-index: 90;
      transition: all 0.3s ease;
      font-size: 12px;
      pointer-events: auto;
    `;
  }

  public update(viewBounds: Bounds): void {
    if (!this.isExpanded) return;

    this.content.innerHTML = "";
    
    this.series.forEach((s) => {
      if (!s.getVisible()) return;

      const data = s.getData();
      if (!data) return;

      // Filter data in visible range
      const visibleY: number[] = [];
      const visibleX: number[] = [];
      for (let i = 0; i < data.x.length; i++) {
        if (data.x[i] >= viewBounds.xMin && data.x[i] <= viewBounds.xMax) {
          visibleX.push(data.x[i]);
          visibleY.push(data.y[i]);
        }
      }

      if (visibleY.length === 0) return;

      const stats = calculateStats(visibleY);
      const area = integrate(visibleX as any, visibleY as any);
      const style = s.getStyle();

      const item = document.createElement("div");
      item.style.cssText = `
        padding: 8px 0;
        border-top: 1px solid ${this.isDarkTheme() ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"};
      `;

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-weight: 600;">
          <div style="width: 8px; height: 8px; border-radius: 2px; background: ${style.color}"></div>
          ${s.getId()}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; opacity: 0.9; font-size: 11px;">
          <span>Min: ${stats.min.toExponential(3)}</span>
          <span>Max: ${stats.max.toExponential(3)}</span>
          <span>Mean: ${stats.mean.toExponential(3)}</span>
          <span>Count: ${stats.count}</span>
          <span style="grid-column: span 2;">Area: ${area.toExponential(4)}</span>
        </div>
      `;

      this.content.appendChild(item);
    });

    if (this.content.innerHTML === "") {
        this.content.innerHTML = "<div style='opacity: 0.5; font-style: italic;'>No series visible in range</div>";
    }
  }

  public toggle(): void {
    this.isExpanded = !this.isExpanded;
    this.content.style.display = this.isExpanded ? "block" : "none";
    if (this.isExpanded) {
        // Redraw immediately will be handled by the chart's next render
    }
  }

  public updateTheme(theme: ChartTheme): void {
    this.theme = theme;
    this.updateContainerStyle();
  }

  public destroy(): void {
    this.container.remove();
  }
}
