import type {
  NativeRenderOptions,
  NativeSeriesRenderData,
  ProgramBundle,
} from "./types";
import {
  calculateUniforms,
  computeSeriesColor,
  renderBand,
  renderBar,
  renderHeatmap,
  renderLine,
  renderPoints,
} from "./draw";

export function renderFrame(
  gl: WebGLRenderingContext,
  canvas: HTMLCanvasElement,
  dpr: number,
  programs: ProgramBundle,
  series: NativeSeriesRenderData[],
  options: NativeRenderOptions
): void {
  const { bounds, backgroundColor = [0.1, 0.1, 0.18, 1], plotArea } = options;

  const canvasHeight = canvas.height;
  const canvasWidth = canvas.width;

  const pa = plotArea
    ? {
        x: plotArea.x * dpr,
        y: canvasHeight - (plotArea.y + plotArea.height) * dpr,
        width: plotArea.width * dpr,
        height: plotArea.height * dpr,
      }
    : {
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
      };

  gl.viewport(0, 0, canvasWidth, canvasHeight);
  gl.disable(gl.SCISSOR_TEST);
  gl.clearColor(
    backgroundColor[0],
    backgroundColor[1],
    backgroundColor[2],
    backgroundColor[3]
  );
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.viewport(pa.x, pa.y, pa.width, pa.height);
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(pa.x, pa.y, pa.width, pa.height);

  const uniforms = calculateUniforms(bounds);

  for (const s of series) {
    if (!s.visible || s.count === 0) continue;

    const yMin = s.yBounds ? s.yBounds.min : bounds.yMin;
    const yMax = s.yBounds ? s.yBounds.max : bounds.yMax;
    const yRange = yMax - yMin;

    const yScale = yRange > 0 ? 2 / yRange : 1;
    const yTrans = -1 - yMin * yScale;

    const seriesUniforms = {
      scale: [uniforms.scale[0], yScale] as [number, number],
      translate: [uniforms.translate[0], yTrans] as [number, number],
    };

    const color = computeSeriesColor(s.style);

    if (s.type === "scatter") {
      renderPoints(
        gl,
        programs.pointProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        color,
        (s.style.pointSize ?? 4) * dpr,
        s.style.symbol
      );
    } else if (s.type === "line") {
      renderLine(
        gl,
        programs.lineProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        color
      );
    } else if (s.type === "line+scatter") {
      renderLine(
        gl,
        programs.lineProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        color
      );
      renderPoints(
        gl,
        programs.pointProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        color,
        (s.style.pointSize ?? 4) * dpr,
        s.style.symbol
      );
    } else if (s.type === "step" || s.type === "step+scatter") {
      if (s.stepBuffer && s.stepCount) {
        renderLine(
          gl,
          programs.lineProgram,
          s.stepBuffer,
          s.stepCount,
          seriesUniforms,
          color
        );
      } else {
        renderLine(
          gl,
          programs.lineProgram,
          s.buffer,
          s.count,
          seriesUniforms,
          color
        );
      }

      if (s.type === "step+scatter") {
        renderPoints(
          gl,
          programs.pointProgram,
          s.buffer,
          s.count,
          seriesUniforms,
          color,
          (s.style.pointSize ?? 4) * dpr,
          s.style.symbol
        );
      }
    } else if (s.type === "band") {
      renderBand(
        gl,
        programs.lineProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        color
      );
    } else if (s.type === "heatmap") {
      renderHeatmap(
        gl,
        programs.heatmapProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        s.zBounds,
        s.colormapTexture
      );
    } else if (s.type === "bar") {
      renderBar(
        gl,
        programs.lineProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        color
      );
    }
  }
}
