/**
 * Chart UI Components (Controls, Legend)
 */
import { ChartControls } from "../ChartControls";
import { ChartLegend } from "../ChartLegend";
import { ChartTheme } from "../../theme";
import { ChartOptions } from "../../types";
import { Series } from "../Series";

export interface UIContext {
  container: HTMLDivElement;
  theme: ChartTheme;
  showControls: boolean;
  showLegend: boolean;
  series: Map<string, Series>;
  autoScale: () => void;
  resetZoom: () => void;
  requestRender: () => void;
  exportImage: () => string;
  setPanMode: (active: boolean) => void;
  onLegendMove: (x: number, y: number) => void;
  toggleLegend: () => void;
}

export function initControls(ctx: UIContext): ChartControls | null {
  if (!ctx.showControls) return null;
  return new ChartControls(ctx.container, ctx.theme, {
    onResetZoom: () => ctx.resetZoom(),
    onSetType: (type) => {
      ctx.series.forEach((s) => {
        const currentType = s.getType();
        const style = s.getStyle();
        const isStepCapable = currentType === "step" || currentType === "step+scatter" || style.stepMode !== undefined;
        if (isStepCapable) {
          const mappedType = type === "line" ? "step" : type === "line+scatter" ? "step+scatter" : "scatter";
          s.setType(mappedType as any);
        } else if (currentType === "line" || currentType === "scatter" || currentType === "line+scatter") {
          s.setType(type as any);
        }
      });
      ctx.requestRender();
    },
    onToggleSmoothing: () => {
      ctx.series.forEach((s) => {
        const style = s.getStyle();
        s.setStyle({ smoothing: (style.smoothing || 0) === 0 ? 0.5 : 0 });
      });
      ctx.requestRender();
    },
    onTogglePan: (active) => ctx.setPanMode(active),
    onExport: () => {
      const link = document.createElement("a");
      link.download = `scichart-export-${Date.now()}.png`;
      link.href = ctx.exportImage();
      link.click();
    },
    onAutoScale: () => {
      ctx.autoScale();
      ctx.requestRender();
    },
    onToggleLegend: () => {
       ctx.toggleLegend();
    },
  });
}

export function initLegend(ctx: UIContext, options: ChartOptions): ChartLegend | null {
  if (!ctx.showLegend) return null;
  const legend = new ChartLegend(
    ctx.container,
    ctx.theme,
    options.legendPosition || {},
    {
      onMove: (x, y) => ctx.onLegendMove(x, y),
    }
  );
  legend.update(Array.from(ctx.series.values()));
  return legend;
}
