/**
 * SVG Export Support
 */
import { Series } from "../../Series";
import { Bounds, PlotArea } from "../../../types";
import { Scale } from "../../../scales";
import { ChartTheme } from "../../../theme";

export function exportToSVG(
  series: Series[],
  _viewBounds: Bounds,
  plotArea: PlotArea,
  xAxis: Scale,
  yAxes: Map<string, Scale>,
  theme: ChartTheme,
  width: number,
  height: number
): string {
  const svg = [
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">`,
    `<rect width="100%" height="100%" fill="${theme.backgroundColor}" />`,
    `<g transform="translate(0,0)">`
  ];

  // Draw Grid Lines
  drawSVGGrid(svg, plotArea, xAxis, yAxes.get("default")!, theme);

  // Draw Series
  for (const s of series) {
    if (!s.isVisible()) continue;
    const yScale = yAxes.get(s.getYAxisId() || "default") || yAxes.get("default");
    if (!yScale) continue;

    const data = s.getData();
    if (!data || data.x.length === 0) continue;

    const style = s.getStyle() as any;
    const type = s.getType();

    if (type === 'line' || type === 'step') {
      const points: string[] = [];
      const stepMode = style.stepMode || 'after';
      for (let i = 0; i < data.x.length; i++) {
        const px = xAxis.transform(data.x[i]);
        const py = yScale.transform(data.y[i]);
        if (i > 0 && type === 'step') {
          const prevPx = xAxis.transform(data.x[i-1]);
          const prevPy = yScale.transform(data.y[i-1]);
          if (stepMode === 'after') points.push(`${px.toFixed(1)},${prevPy.toFixed(1)}`);
          else if (stepMode === 'before') points.push(`${prevPx.toFixed(1)},${py.toFixed(1)}`);
          else if (stepMode === 'center') {
            const midX = (prevPx + px) / 2;
            points.push(`${midX.toFixed(1)},${prevPy.toFixed(1)}`);
            points.push(`${midX.toFixed(1)},${py.toFixed(1)}`);
          }
        }
        points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }
      svg.push(`<polyline points="${points.join(' ')}" fill="none" stroke="${style.color}" stroke-width="${style.width || 1.5}" stroke-opacity="${style.opacity || 1}" stroke-linejoin="round" />`);
    } else if (type === 'scatter') {
      for (let i = 0; i < data.x.length; i++) {
        const px = xAxis.transform(data.x[i]);
        const py = yScale.transform(data.y[i]);
        svg.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${((style.pointSize || 4) / 2).toFixed(1)}" fill="${style.color}" fill-opacity="${style.opacity || 1}" />`);
      }
    } else if (type === 'bar') {
      const barWidth = (style.barWidth || 5) * (plotArea.width / (xAxis.domain[1] - xAxis.domain[0]));
      for (let i = 0; i < data.x.length; i++) {
        const px = xAxis.transform(data.x[i]);
        const py = yScale.transform(data.y[i]);
        const p0 = yScale.transform(0);
        const yTop = Math.min(py, p0);
        const yHeight = Math.abs(py - p0);
        svg.push(`<rect x="${(px - barWidth/2).toFixed(1)}" y="${yTop.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${yHeight.toFixed(1)}" fill="${style.color}" fill-opacity="${style.opacity || 1}" />`);
      }
    } else if (type === 'band' || type === 'area') {
      const y2 = type === 'area' ? new Float32Array(data.x.length).fill(0) : (data.y2 || new Float32Array(data.x.length).fill(0));
      const points: string[] = [];
      // Forward y
      for (let i = 0; i < data.x.length; i++) points.push(`${xAxis.transform(data.x[i]).toFixed(1)},${yScale.transform(data.y[i]).toFixed(1)}`);
      // Backward y2
      for (let i = data.x.length - 1; i >= 0; i--) points.push(`${xAxis.transform(data.x[i]).toFixed(1)},${yScale.transform(y2[i]).toFixed(1)}`);
      svg.push(`<polygon points="${points.join(' ')}" fill="${style.color}" fill-opacity="${(style.opacity || 1) * 0.3}" stroke="${style.color}" stroke-width="${style.width || 1}" />`);
    } else if (type === 'candlestick') {
      const bw = (style.barWidth || 5) * (plotArea.width / (xAxis.domain[1] - xAxis.domain[0]));
      const bullishColor = style.bullishColor || '#26a69a';
      const bearishColor = style.bearishColor || '#ef5350';
      if (data.open && data.high && data.low && data.close) {
        for (let i = 0; i < data.x.length; i++) {
          const isBull = data.close[i] >= data.open[i];
          const px = xAxis.transform(data.x[i]);
          const pyOpen = yScale.transform(data.open[i]);
          const pyClose = yScale.transform(data.close[i]);
          const pyHigh = yScale.transform(data.high[i]);
          const pyLow = yScale.transform(data.low[i]);
          const color = isBull ? bullishColor : bearishColor;
          // Wick
          svg.push(`<line x1="${px.toFixed(1)}" y1="${pyHigh.toFixed(1)}" x2="${px.toFixed(1)}" y2="${pyLow.toFixed(1)}" stroke="${color}" stroke-width="1" />`);
          // Body
          const yTop = Math.min(pyOpen, pyClose);
          const yHeight = Math.max(1, Math.abs(pyOpen - pyClose));
          svg.push(`<rect x="${(px - bw/2).toFixed(1)}" y="${yTop.toFixed(1)}" width="${bw.toFixed(1)}" height="${yHeight.toFixed(1)}" fill="${color}" />`);
        }
      }
    }
  }

  // Draw Axes lines
  svg.push(`<line x1="${plotArea.x}" y1="${plotArea.y + plotArea.height}" x2="${plotArea.x + plotArea.width}" y2="${plotArea.y + plotArea.height}" stroke="${theme.xAxis.lineColor}" stroke-width="2" />`);
  svg.push(`<line x1="${plotArea.x}" y1="${plotArea.y}" x2="${plotArea.x}" y2="${plotArea.y + plotArea.height}" stroke="${theme.yAxis.lineColor}" stroke-width="2" />`);

  svg.push('</g>');
  svg.push('</svg>');
  return svg.join('\n');
}

function drawSVGGrid(svg: string[], plotArea: PlotArea, xAxis: Scale, yScale: Scale, theme: ChartTheme) {
  if (!theme.grid.visible) return;
  // X Grid
  xAxis.ticks(10).forEach(tick => {
    const px = xAxis.transform(tick);
    if (px >= plotArea.x && px <= plotArea.x + plotArea.width)
      svg.push(`<line x1="${px.toFixed(1)}" y1="${plotArea.y}" x2="${px.toFixed(1)}" y2="${plotArea.y + plotArea.height}" stroke="${theme.grid.majorColor}" stroke-opacity="0.1" stroke-dasharray="2,2" />`);
  });
  // Y Grid
  yScale.ticks(10).forEach(tick => {
    const py = yScale.transform(tick);
    if (py >= plotArea.y && py <= plotArea.y + plotArea.height)
      svg.push(`<line x1="${plotArea.x}" y1="${py.toFixed(1)}" x2="${plotArea.x + plotArea.width}" y2="${py.toFixed(1)}" stroke="${theme.grid.majorColor}" stroke-opacity="0.1" stroke-dasharray="2,2" />`);
  });
}
