/**
 * Series Actions (Add, Remove, Append)
 */
import { Series } from "../../Series";
import type { SeriesOptions, HeatmapOptions, SeriesUpdateData } from "../../../types";
import { updateSeriesBuffer } from "./SeriesBuffer";

export function addSeries(ctx: any, options: SeriesOptions | HeatmapOptions): void {
  const s = new Series(options);
  ctx.series.set(s.getId(), s);
  updateSeriesBuffer(ctx, s);
  if (ctx.xAxisOptions.auto || Array.from(ctx.yAxisOptionsMap.values()).some((o: any) => o.auto)) {
    ctx.autoScale();
  }
  ctx.updateLegend?.();
  ctx.requestRender();
}

export function removeSeries(ctx: any, id: string): void {
  const s = ctx.series.get(id);
  if (s) {
    ctx.renderer.deleteBuffer(id);
    ctx.renderer.deleteBuffer(`${id}_step`);
    s.destroy();
    ctx.series.delete(id);
    ctx.updateLegend?.();
    ctx.requestRender();
  }
}

export function updateSeries(ctx: any, id: string, data: SeriesUpdateData): void {
  const s = ctx.series.get(id);
  if (s) {
    s.updateData(data);
    updateSeriesBuffer(ctx, s);
    ctx.requestRender();
  }
}

export function appendData(ctx: any, id: string, x: number[] | Float32Array, y: number[] | Float32Array): void {
  const s = ctx.series.get(id);
  if (!s) return;
  const oldMaxX = s.getBounds()?.xMax ?? -Infinity;
  s.updateData({ x: x as any, y: y as any, append: true });
  updateSeriesBuffer(ctx, s);

  if (ctx.autoScrollEnabled) {
    const newBounds = s.getBounds();
    if (newBounds) {
      const xRange = ctx.viewBounds.xMax - ctx.viewBounds.xMin;
      if (oldMaxX >= ctx.viewBounds.xMax - xRange * 0.05) {
        ctx.viewBounds.xMax = newBounds.xMax;
        ctx.viewBounds.xMin = ctx.viewBounds.xMax - xRange;
      }
    }
  }
  if (ctx.xAxisOptions.auto || Array.from(ctx.yAxisOptionsMap.values()).some((o: any) => o.auto)) {
    ctx.autoScale();
  }
  ctx.requestRender();
}

export function setMaxPoints(ctx: any, id: string, maxPoints: number): void {
  const s = ctx.series.get(id);
  if (s) {
    s.setMaxPoints(maxPoints);
    ctx.requestRender();
  }
}
