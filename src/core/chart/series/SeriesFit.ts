/**
 * Series Curve Fitting Support
 */
import { fitData, type FitType, type FitOptions } from "../../../analysis";

export function addFitLine(
  ctx: any,
  seriesId: string,
  type: FitType,
  options: FitOptions = {}
): string {
  const s = ctx.series.get(seriesId);
  if (!s) throw new Error(`Series ${seriesId} not found`);

  const data = s.getData();
  if (!data || data.x.length < 2) return "";

  const result = fitData(data.x as any, data.y as any, type, options);
  const bounds = s.getBounds();
  const xMin = bounds?.xMin ?? 0;
  const xMax = bounds?.xMax ?? 1;
  const dataWidth = xMax - xMin;
  const fitResolution = 200;
  const fitX = new Float32Array(fitResolution);
  const fitY = new Float32Array(fitResolution);

  for (let i = 0; i < fitResolution; i++) {
    const x = xMin + (i / (fitResolution - 1)) * dataWidth;
    fitX[i] = x;
    fitY[i] = result.predict(x);
  }

  const fitId = `${seriesId}-fit-${Date.now()}`;
  const sourceStyle = s.getStyle();

  ctx.addSeries({
    id: fitId,
    type: 'line',
    yAxisId: s.getYAxisId(),
    data: { x: fitX, y: fitY },
    style: {
      color: sourceStyle.color,
      width: (sourceStyle.width || 1) * 1.5,
      opacity: 0.8,
      lineDash: [5, 5]
    }
  });

  ctx.addAnnotation({
    type: 'text',
    x: xMin + dataWidth * 0.05,
    y: result.predict(xMin + dataWidth * 0.05),
    text: `${result.equation}\n(R² = ${result.rSquared.toFixed(4)})`,
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: sourceStyle.color || '#ffffff',
    padding: 4,
    anchor: 'bottom-left',
    interactive: true
  });

  return fitId;
}
