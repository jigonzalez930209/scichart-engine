/**
 * ChartControls - In-chart control buttons (Plotly-style)
 *
 * Provides a floating glassmorphism toolbar for chart controls:
 * - Pan/Zoom mode toggle
 * - Reset Zoom
 * - Display Mode (Line, Scatter, Both)
 * - Smoothing toggle
 */

import { ChartTheme } from "../theme";

export interface ChartControlsCallbacks {
  onResetZoom: () => void;
  onSetType: (type: "line" | "scatter" | "line+scatter") => void;
  onToggleSmoothing: () => void;
  onTogglePan: (active: boolean) => void;
  onExport: () => void;
  onAutoScale: () => void;
}

// ============================================
// SVG Icons (Plotly-inspired)
// ============================================

const ICONS = {
  PAN: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path></svg>`,
  RESET: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  LINE: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>`,
  SCATTER: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="7" cy="14" r="2"></circle><circle cx="11" cy="10" r="2"></circle><circle cx="15" cy="13" r="2"></circle><circle cx="19" cy="8" r="2"></circle><path d="M3 3v18h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
  BOTH: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path><circle cx="7" cy="14.3" r="1" fill="currentColor"></circle><circle cx="10.8" cy="10.5" r="1" fill="currentColor"></circle><circle cx="13.6" cy="13.2" r="1" fill="currentColor"></circle><circle cx="18.7" cy="8" r="1" fill="currentColor"></circle></svg>`,
  SMOOTH: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c.5 0 .9-.3 1.2-.7l1.6-2.6c.3-.4.7-.7 1.2-.7h2c.5 0 .9.3 1.2.7l1.6 2.6c.3.4.7.7 1.2.7h2c.5 0 .9-.3 1.2-.7l1.6-2.6c.3-.4.7-.7 1.2-.7h2"></path></svg>`,
  AUTOSCALE: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`,
  EXPORT: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
};

export class ChartControls {
  private container: HTMLDivElement;
  private toolbar: HTMLDivElement;
  private callbacks: ChartControlsCallbacks;
  private theme: ChartTheme;

  private isSmoothing = false;
  private isPanMode = true;
  private currentType: "line" | "scatter" | "line+scatter" = "line";

  constructor(
    parent: HTMLElement,
    theme: ChartTheme,
    callbacks: ChartControlsCallbacks
  ) {
    this.callbacks = callbacks;
    this.theme = theme;

    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 100;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    `;

    this.toolbar = document.createElement("div");
    this.toolbar.className = "scichart-modebar";
    this.updateToolbarStyle();

    this.createButtons();
    this.container.appendChild(this.toolbar);
    parent.appendChild(this.container);
  }

  private isDarkTheme(): boolean {
    const name = this.theme.name.toLowerCase();
    return (
      name.includes("dark") ||
      name.includes("midnight") ||
      name.includes("electro")
    );
  }

  private updateToolbarStyle(): void {
    const isDark = this.isDarkTheme();

    const bg = isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.95)";
    const borderColor = isDark
      ? "rgba(255, 255, 255, 0.2)"
      : "rgba(0, 0, 0, 0.15)";
    const shadow = isDark
      ? "0 4px 12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)"
      : "0 4px 12px rgba(0, 0, 0, 0.15)";

    this.toolbar.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background: ${bg};
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
      border: 1px solid ${borderColor};
      border-radius: 8px;
      box-shadow: ${shadow};
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
  }

  private createButtons(): void {
    // Pan Mode
    this.createButton(
      ICONS.PAN,
      "Pan Mode",
      () => {
        this.isPanMode = !this.isPanMode;
        this.updateButtonStates();
        this.callbacks.onTogglePan(this.isPanMode);
      },
      "pan"
    );

    // Reset Zoom
    this.createButton(
      ICONS.RESET,
      "Reset Zoom",
      () => this.callbacks.onResetZoom(),
      "reset"
    );

    // Auto Scale
    this.createButton(
      ICONS.AUTOSCALE,
      "Auto Scale",
      () => this.callbacks.onAutoScale(),
      "autoscale"
    );

    // Separator
    const sep = document.createElement("div");
    const isDark = this.isDarkTheme();
    sep.style.cssText = `width: 1px; height: 20px; background: ${
      isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"
    }; margin: 0 6px;`;
    this.toolbar.appendChild(sep);

    // Type Switcher
    this.createButton(
      ICONS.LINE,
      "Toggle Line/Scatter/Both",
      () => {
        const types: ("line" | "scatter" | "line+scatter")[] = [
          "line",
          "scatter",
          "line+scatter",
        ];
        const nextIdx = (types.indexOf(this.currentType) + 1) % types.length;
        this.currentType = types[nextIdx];
        this.callbacks.onSetType(this.currentType);
        this.updateButtonStates();
      },
      "type"
    );

    // Smoothing
    this.createButton(
      ICONS.SMOOTH,
      "Automated Smoothing",
      () => {
        this.isSmoothing = !this.isSmoothing;
        this.updateButtonStates();
        this.callbacks.onToggleSmoothing();
      },
      "smooth"
    );

    // Separator
    const sep2 = document.createElement("div");
    sep2.style.cssText = `width: 1px; height: 20px; background: ${
      isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"
    }; margin: 0 6px;`;
    this.toolbar.appendChild(sep2);

    // Export Image
    this.createButton(
      ICONS.EXPORT,
      "Export as PNG",
      () => this.callbacks.onExport(),
      "export"
    );

    this.updateButtonStates();
  }

  private enforceSVGVisibility(btn: HTMLButtonElement): void {
    // Force SVG visibility and make sure currentColor is applied even under aggressive page CSS
    const icon = btn.querySelector<HTMLElement>(".scichart-control-icon");
    if (icon) {
      icon.style.display = "flex";
      icon.style.alignItems = "center";
      icon.style.justifyContent = "center";
      icon.style.width = "100%";
      icon.style.height = "100%";
      icon.style.pointerEvents = "none";
    }

    const svgEl = btn.querySelector<SVGElement>("svg");
    if (svgEl) {
      svgEl.setAttribute("width", "18");
      svgEl.setAttribute("height", "18");
      (svgEl as any).style.display = "block";
      (svgEl as any).style.overflow = "visible";
      (svgEl as any).style.color = "inherit";
      (svgEl as any).style.stroke = "currentColor";
      if (!svgEl.getAttribute("fill")) {
        (svgEl as any).style.fill = "none";
      }
    }
  }

  private createButton(
    svg: string,
    title: string,
    onClick: () => void,
    id: string
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.innerHTML = `<span class="scichart-control-icon">${svg}</span>`;
    btn.title = title;
    btn.dataset.id = id;

    const isDark = this.isDarkTheme();
    const color = isDark ? "#ffffff" : "#1e293b";

    btn.style.cssText = `
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: ${color};
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0.9;
    `;

    btn.onmouseenter = () => {
      btn.style.opacity = "1";
      btn.style.background = isDark
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(0, 0, 0, 0.1)";
      btn.style.transform = "translateY(-1px)";
      btn.style.boxShadow = isDark
        ? "0 2px 4px rgba(0,0,0,0.4)"
        : "0 2px 4px rgba(0,0,0,0.1)";
    };
    btn.onmouseleave = () => {
      btn.style.transform = "none";
      btn.style.boxShadow = "none";
      this.updateButtonStates();
    };
    btn.onclick = onClick;

    // Force SVG visibility
    this.enforceSVGVisibility(btn);

    this.toolbar.appendChild(btn);
    return btn;
  }

  private updateButtonStates(): void {
    const buttons = this.toolbar.querySelectorAll("button");
    const isDark = this.isDarkTheme();

    const activeColor = "#38bdf8"; // Brighter blue
    const smoothActiveColor = "#fb7185"; // Brighter pink
    const normalColor = isDark ? "#f1f5f9" : "#334155"; // High contrast

    buttons.forEach((btn: HTMLButtonElement) => {
      const id = btn.dataset.id;
      const isHover = btn.matches(":hover");

      if (id === "pan") {
        btn.style.color = this.isPanMode ? activeColor : normalColor;
        btn.style.opacity = isHover || this.isPanMode ? "1" : "0.8";
        if (this.isPanMode) {
          btn.style.background = isDark
            ? "rgba(56, 189, 248, 0.15)"
            : "rgba(56, 189, 248, 0.1)";
        }
      } else if (id === "smooth") {
        btn.style.color = this.isSmoothing ? smoothActiveColor : normalColor;
        btn.style.opacity = isHover || this.isSmoothing ? "1" : "0.8";
        if (this.isSmoothing) {
          btn.style.background = isDark
            ? "rgba(251, 113, 133, 0.15)"
            : "rgba(251, 113, 133, 0.1)";
        }
      } else if (id === "type") {
        btn.innerHTML =
          this.currentType === "line"
            ? ICONS.LINE
            : this.currentType === "scatter"
            ? ICONS.SCATTER
            : ICONS.BOTH;
        // Reapply SVG visibility styles after changing innerHTML
        this.enforceSVGVisibility(btn);
        btn.style.color = normalColor;
        btn.style.opacity = isHover ? "1" : "0.8";
      } else if (id === "reset" || id === "autoscale" || id === "export") {
        btn.style.color = normalColor;
        btn.style.opacity = isHover ? "1" : "0.8";
      }

      if (
        !isHover &&
        !(
          (id === "pan" && this.isPanMode) ||
          (id === "smooth" && this.isSmoothing)
        )
      ) {
        btn.style.background = "transparent";
      }
    });
  }

  public updateTheme(theme: ChartTheme): void {
    this.theme = theme;
    this.updateToolbarStyle();
    this.updateButtonStates();
  }

  public destroy(): void {
    this.container.remove();
  }
}
