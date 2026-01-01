import type { Bounds } from "../../types";
import type { ShaderProgram } from "./types";
import { parseColor } from "./utils";

export function calculateUniforms(bounds: Bounds): {
  scale: [number, number];
  translate: [number, number];
} {
  const dataWidth = bounds.xMax - bounds.xMin;
  const dataHeight = bounds.yMax - bounds.yMin;

  const scaleX = dataWidth > 0 ? 2 / dataWidth : 1;
  const scaleY = dataHeight > 0 ? 2 / dataHeight : 1;

  const translateX = -1 - bounds.xMin * scaleX;
  const translateY = -1 - bounds.yMin * scaleY;

  return {
    scale: [scaleX, scaleY],
    translate: [translateX, translateY],
  };
}

export function renderLine(
  gl: WebGLRenderingContext,
  prog: ShaderProgram,
  buffer: WebGLBuffer,
  count: number,
  uniforms: { scale: [number, number]; translate: [number, number] },
  color: [number, number, number, number]
): void {
  gl.useProgram(prog.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(prog.attributes.position);
  gl.vertexAttribPointer(prog.attributes.position, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(prog.uniforms.uScale, uniforms.scale[0], uniforms.scale[1]);
  gl.uniform2f(
    prog.uniforms.uTranslate,
    uniforms.translate[0],
    uniforms.translate[1]
  );
  gl.uniform4f(prog.uniforms.uColor!, color[0], color[1], color[2], color[3]);

  gl.drawArrays(gl.LINE_STRIP, 0, count);
  gl.disableVertexAttribArray(prog.attributes.position);
}

export function renderBand(
  gl: WebGLRenderingContext,
  prog: ShaderProgram,
  buffer: WebGLBuffer,
  count: number,
  uniforms: { scale: [number, number]; translate: [number, number] },
  color: [number, number, number, number]
): void {
  gl.useProgram(prog.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(prog.attributes.position);
  gl.vertexAttribPointer(prog.attributes.position, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(prog.uniforms.uScale, uniforms.scale[0], uniforms.scale[1]);
  gl.uniform2f(
    prog.uniforms.uTranslate,
    uniforms.translate[0],
    uniforms.translate[1]
  );

  const alpha = color[3] * 0.4;
  gl.uniform4f(prog.uniforms.uColor!, color[0], color[1], color[2], alpha);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, count);
  gl.disableVertexAttribArray(prog.attributes.position);
}

export function renderPoints(
  gl: WebGLRenderingContext,
  prog: ShaderProgram,
  buffer: WebGLBuffer,
  count: number,
  uniforms: { scale: [number, number]; translate: [number, number] },
  color: [number, number, number, number],
  pointSize: number,
  symbol: string = "circle"
): void {
  gl.useProgram(prog.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(prog.attributes.position);
  gl.vertexAttribPointer(prog.attributes.position, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(prog.uniforms.uScale, uniforms.scale[0], uniforms.scale[1]);
  gl.uniform2f(
    prog.uniforms.uTranslate,
    uniforms.translate[0],
    uniforms.translate[1]
  );
  gl.uniform4f(prog.uniforms.uColor!, color[0], color[1], color[2], color[3]);

  if (prog.uniforms.uPointSize)
    gl.uniform1f(prog.uniforms.uPointSize, pointSize);

  if (prog.uniforms.uSymbol) {
    const symbolMap: Record<string, number> = {
      circle: 0,
      square: 1,
      diamond: 2,
      triangle: 3,
      triangleDown: 4,
      cross: 5,
      x: 6,
      star: 7,
    };
    gl.uniform1i(prog.uniforms.uSymbol, symbolMap[symbol] ?? 0);
  }

  gl.drawArrays(gl.POINTS, 0, count);
  gl.disableVertexAttribArray(prog.attributes.position);
}

export function renderHeatmap(
  gl: WebGLRenderingContext,
  prog: ShaderProgram,
  buffer: WebGLBuffer,
  count: number,
  uniforms: { scale: [number, number]; translate: [number, number] },
  zBounds: { min: number; max: number } = { min: 0, max: 1 },
  texture?: WebGLTexture
): void {
  gl.useProgram(prog.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  gl.enableVertexAttribArray(prog.attributes.position);
  gl.vertexAttribPointer(prog.attributes.position, 2, gl.FLOAT, false, 12, 0);

  if (prog.attributes.value !== undefined && prog.attributes.value !== -1) {
    gl.enableVertexAttribArray(prog.attributes.value);
    gl.vertexAttribPointer(prog.attributes.value, 1, gl.FLOAT, false, 12, 8);
  }

  gl.uniform2f(prog.uniforms.uScale, uniforms.scale[0], uniforms.scale[1]);
  gl.uniform2f(
    prog.uniforms.uTranslate,
    uniforms.translate[0],
    uniforms.translate[1]
  );

  if (prog.uniforms.uMinValue)
    gl.uniform1f(prog.uniforms.uMinValue, zBounds.min);
  if (prog.uniforms.uMaxValue)
    gl.uniform1f(prog.uniforms.uMaxValue, zBounds.max);

  if (texture && prog.uniforms.uColormap) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(prog.uniforms.uColormap, 0);
  } else if (prog.uniforms.uColormap) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  gl.drawArrays(gl.TRIANGLES, 0, count);

  gl.disableVertexAttribArray(prog.attributes.position);
  if (prog.attributes.value !== undefined && prog.attributes.value !== -1) {
    gl.disableVertexAttribArray(prog.attributes.value);
  }
}

export function renderBar(
  gl: WebGLRenderingContext,
  prog: ShaderProgram,
  buffer: WebGLBuffer,
  count: number,
  uniforms: { scale: [number, number]; translate: [number, number] },
  color: [number, number, number, number]
): void {
  gl.useProgram(prog.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(prog.attributes.position);
  gl.vertexAttribPointer(prog.attributes.position, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(prog.uniforms.uScale, uniforms.scale[0], uniforms.scale[1]);
  gl.uniform2f(
    prog.uniforms.uTranslate,
    uniforms.translate[0],
    uniforms.translate[1]
  );
  gl.uniform4f(prog.uniforms.uColor!, color[0], color[1], color[2], color[3]);

  gl.drawArrays(gl.TRIANGLES, 0, count);
  gl.disableVertexAttribArray(prog.attributes.position);
}

export function computeSeriesColor(
  style: any
): [number, number, number, number] {
  const color = parseColor(style.color ?? "#ff0055");
  color[3] = style.opacity ?? 1;
  return color;
}
