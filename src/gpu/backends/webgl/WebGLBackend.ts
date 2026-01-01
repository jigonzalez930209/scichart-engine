/**
 * WebGL Backend - GPU abstraction layer implementation for WebGL
 * 
 * Provides the same interface as WebGPUBackend for compatibility.
 * This serves as a fallback for browsers without WebGPU support.
 */

import type {
  BufferDescriptor,
  BufferId,
  GpuBackend,
  GpuBackendInfo,
  GpuViewport,
  Texture1DDescriptor,
  TextureId,
} from "../../types";
import type { DrawCall, DrawList, PointStyle, HeatmapStyle } from "../../drawList";
import type { FrameUniforms } from "../../frame";
import { createAllPrograms, destroyPrograms, type ProgramBundle } from "./programFactory";

export interface WebGLBackendOptions {
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: "default" | "low-power" | "high-performance";
}

/**
 * Symbol name to number mapping
 */
const SYMBOL_MAP: Record<string, number> = {
  circle: 0,
  square: 1,
  diamond: 2,
  triangle: 3,
  triangleDown: 4,
  cross: 5,
  x: 6,
  star: 7,
};

/**
 * Calculate transform uniforms from bounds
 */
function calculateUniforms(bounds: {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}): { scale: [number, number]; translate: [number, number] } {
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

/**
 * Get color from style
 */
function getColorFromStyle(style: any): [number, number, number, number] {
  const color = style?.color ?? [1, 0, 0.3, 1];
  const opacity = style?.opacity ?? 1;
  
  if (Array.isArray(color)) {
    return [color[0], color[1], color[2], (color[3] ?? 1) * opacity];
  }
  
  return [1, 0, 0.3, opacity];
}

export class WebGLBackend implements GpuBackend {
  public readonly info: GpuBackendInfo;

  private canvas: HTMLCanvasElement;
  private opts: WebGLBackendOptions;
  private gl: WebGLRenderingContext | null = null;
  
  private viewport: GpuViewport | null = null;
  private dpr: number = 1;

  private programs: ProgramBundle | null = null;
  private buffers = new Map<string, WebGLBuffer>();
  private textures = new Map<string, WebGLTexture>();

  constructor(canvas: HTMLCanvasElement, opts: WebGLBackendOptions = {}) {
    this.canvas = canvas;
    this.opts = opts;
    this.info = {
      type: "webgl",
      available: WebGLBackend.isSupported(),
    };
  }

  static isSupported(): boolean {
    if (typeof document === "undefined") return false;
    
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return !!gl;
    } catch {
      return false;
    }
  }

  async init(): Promise<void> {
    if (!this.info.available) {
      throw new Error("[gpu] WebGL not supported");
    }

    const gl = this.canvas.getContext("webgl", {
      alpha: true,
      antialias: this.opts.antialias ?? true,
      preserveDrawingBuffer: this.opts.preserveDrawingBuffer ?? true,
      powerPreference: this.opts.powerPreference ?? "high-performance",
    });

    if (!gl) {
      throw new Error("[gpu] Failed to get WebGL context");
    }

    this.gl = gl;

    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Create shader programs
    this.programs = createAllPrograms(gl);
  }

  setViewport(viewport: GpuViewport): void {
    this.viewport = viewport;
    this.dpr = viewport.dpr;
    
    const w = Math.max(1, Math.floor(viewport.width * viewport.dpr));
    const h = Math.max(1, Math.floor(viewport.height * viewport.dpr));
    
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    
    if (this.gl) {
      this.gl.viewport(0, 0, w, h);
    }
  }

  createOrUpdateBuffer(
    id: BufferId,
    data: ArrayBufferView,
    desc?: Partial<BufferDescriptor>
  ): void {
    if (!this.gl) {
      throw new Error("[gpu] WebGLBackend not initialized");
    }

    const gl = this.gl;
    
    let buffer = this.buffers.get(id);
    if (!buffer) {
      buffer = gl.createBuffer()!;
      this.buffers.set(id, buffer);
    }

    const target = desc?.usage === "index" ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
    
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, gl.DYNAMIC_DRAW);
    gl.bindBuffer(target, null);
  }

  deleteBuffer(id: BufferId): void {
    if (!this.gl) return;
    
    const buffer = this.buffers.get(id);
    if (buffer) {
      this.gl.deleteBuffer(buffer);
      this.buffers.delete(id);
    }
  }

  createOrUpdateTexture1D(
    id: TextureId,
    data: Uint8Array,
    desc?: Partial<Texture1DDescriptor>
  ): void {
    if (!this.gl) {
      throw new Error("[gpu] WebGLBackend not initialized");
    }

    const gl = this.gl;
    const width = desc?.width ?? Math.floor(data.length / 4);

    let texture = this.textures.get(id);
    if (!texture) {
      texture = gl.createTexture()!;
      this.textures.set(id, texture);
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  deleteTexture(id: TextureId): void {
    if (!this.gl) return;
    
    const texture = this.textures.get(id);
    if (texture) {
      this.gl.deleteTexture(texture);
      this.textures.delete(id);
    }
  }

  render(drawList: DrawList, frame: FrameUniforms): void {
    this.renderWithBounds(drawList, frame, { xMin: -1, xMax: 1, yMin: -1, yMax: 1 });
  }

  renderWithBounds(
    drawList: DrawList,
    frame: FrameUniforms,
    bounds: { xMin: number; xMax: number; yMin: number; yMax: number }
  ): void {
    if (!this.gl || !this.programs) {
      throw new Error("[gpu] WebGLBackend not initialized");
    }

    const gl = this.gl;

    if (!this.viewport) {
      this.setViewport(frame.viewport);
    }

    // Clear
    gl.clearColor(
      frame.clearColor[0],
      frame.clearColor[1],
      frame.clearColor[2],
      frame.clearColor[3]
    );
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Render each draw call
    for (const item of drawList.items) {
      if (!item.visible) continue;

      const buffer = this.buffers.get(item.bufferId);
      if (!buffer) continue;

      // Use item's yBounds if specified
      const itemBounds = item.yBounds
        ? { ...bounds, yMin: item.yBounds.min, yMax: item.yBounds.max }
        : bounds;

      this.renderDrawCall(item, buffer, itemBounds);
    }
  }

  private renderDrawCall(
    item: DrawCall,
    buffer: WebGLBuffer,
    bounds: { xMin: number; xMax: number; yMin: number; yMax: number }
  ): void {
    const uniforms = calculateUniforms(bounds);
    const color = getColorFromStyle(item.style);

    switch (item.kind) {
      case "line":
      case "step":
        this.renderLine(buffer, item.count, uniforms, color);
        break;

      case "scatter":
      case "points":
        this.renderPoints(buffer, item.count, uniforms, color, item.style as PointStyle);
        break;

      case "line+scatter":
        this.renderLine(buffer, item.count, uniforms, color);
        this.renderPoints(buffer, item.count, uniforms, color, item.style as PointStyle);
        break;

      case "step+scatter":
        if (item.stepBufferId && item.stepCount) {
          const stepBuffer = this.buffers.get(item.stepBufferId);
          if (stepBuffer) {
            this.renderLine(stepBuffer, item.stepCount, uniforms, color);
          }
        } else {
          this.renderLine(buffer, item.count, uniforms, color);
        }
        this.renderPoints(buffer, item.count, uniforms, color, item.style as PointStyle);
        break;

      case "band":
        const bandColor: [number, number, number, number] = [
          color[0], color[1], color[2], color[3] * 0.4
        ];
        this.renderBand(buffer, item.count, uniforms, bandColor);
        break;

      case "triangles":
      case "bar":
        this.renderTriangles(buffer, item.count, uniforms, color);
        break;

      case "heatmap":
        this.renderHeatmap(buffer, item.count, uniforms, item.style as HeatmapStyle, item.textureId);
        break;
    }
  }

  private renderLine(
    buffer: WebGLBuffer,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    color: [number, number, number, number]
  ): void {
    const gl = this.gl!;
    const prog = this.programs!.line;

    gl.useProgram(prog.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.enableVertexAttribArray(prog.attributes.aPosition);
    gl.vertexAttribPointer(prog.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(prog.uniforms.uScale!, uniforms.scale[0], uniforms.scale[1]);
    gl.uniform2f(prog.uniforms.uTranslate!, uniforms.translate[0], uniforms.translate[1]);
    gl.uniform4f(prog.uniforms.uColor!, color[0], color[1], color[2], color[3]);

    gl.drawArrays(gl.LINE_STRIP, 0, count);
    gl.disableVertexAttribArray(prog.attributes.aPosition);
  }

  private renderPoints(
    buffer: WebGLBuffer,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    color: [number, number, number, number],
    style?: PointStyle
  ): void {
    const gl = this.gl!;
    const prog = this.programs!.point;

    const pointSize = (style?.pointSize ?? 4) * this.dpr;
    const symbol = SYMBOL_MAP[style?.symbol ?? "circle"] ?? 0;

    gl.useProgram(prog.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.enableVertexAttribArray(prog.attributes.aPosition);
    gl.vertexAttribPointer(prog.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(prog.uniforms.uScale!, uniforms.scale[0], uniforms.scale[1]);
    gl.uniform2f(prog.uniforms.uTranslate!, uniforms.translate[0], uniforms.translate[1]);
    gl.uniform4f(prog.uniforms.uColor!, color[0], color[1], color[2], color[3]);
    gl.uniform1f(prog.uniforms.uPointSize!, pointSize);
    gl.uniform1i(prog.uniforms.uSymbol!, symbol);

    gl.drawArrays(gl.POINTS, 0, count);
    gl.disableVertexAttribArray(prog.attributes.aPosition);
  }

  private renderBand(
    buffer: WebGLBuffer,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    color: [number, number, number, number]
  ): void {
    const gl = this.gl!;
    const prog = this.programs!.line;

    gl.useProgram(prog.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.enableVertexAttribArray(prog.attributes.aPosition);
    gl.vertexAttribPointer(prog.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(prog.uniforms.uScale!, uniforms.scale[0], uniforms.scale[1]);
    gl.uniform2f(prog.uniforms.uTranslate!, uniforms.translate[0], uniforms.translate[1]);
    gl.uniform4f(prog.uniforms.uColor!, color[0], color[1], color[2], color[3]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, count);
    gl.disableVertexAttribArray(prog.attributes.aPosition);
  }

  private renderTriangles(
    buffer: WebGLBuffer,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    color: [number, number, number, number]
  ): void {
    const gl = this.gl!;
    const prog = this.programs!.line;

    gl.useProgram(prog.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.enableVertexAttribArray(prog.attributes.aPosition);
    gl.vertexAttribPointer(prog.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(prog.uniforms.uScale!, uniforms.scale[0], uniforms.scale[1]);
    gl.uniform2f(prog.uniforms.uTranslate!, uniforms.translate[0], uniforms.translate[1]);
    gl.uniform4f(prog.uniforms.uColor!, color[0], color[1], color[2], color[3]);

    gl.drawArrays(gl.TRIANGLES, 0, count);
    gl.disableVertexAttribArray(prog.attributes.aPosition);
  }

  private renderHeatmap(
    buffer: WebGLBuffer,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    style?: HeatmapStyle,
    textureId?: string
  ): void {
    if (!textureId) return;
    
    const texture = this.textures.get(textureId);
    if (!texture) return;

    const gl = this.gl!;
    const prog = this.programs!.heatmap;

    const zBounds = style?.zBounds ?? { min: 0, max: 1 };

    gl.useProgram(prog.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.enableVertexAttribArray(prog.attributes.aPosition);
    gl.vertexAttribPointer(prog.attributes.aPosition, 2, gl.FLOAT, false, 12, 0);

    if (prog.attributes.aValue !== -1) {
      gl.enableVertexAttribArray(prog.attributes.aValue);
      gl.vertexAttribPointer(prog.attributes.aValue, 1, gl.FLOAT, false, 12, 8);
    }

    gl.uniform2f(prog.uniforms.uScale!, uniforms.scale[0], uniforms.scale[1]);
    gl.uniform2f(prog.uniforms.uTranslate!, uniforms.translate[0], uniforms.translate[1]);
    gl.uniform1f(prog.uniforms.uMinValue!, zBounds.min);
    gl.uniform1f(prog.uniforms.uMaxValue!, zBounds.max);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(prog.uniforms.uColormap!, 0);

    gl.drawArrays(gl.TRIANGLES, 0, count);

    gl.disableVertexAttribArray(prog.attributes.aPosition);
    if (prog.attributes.aValue !== -1) {
      gl.disableVertexAttribArray(prog.attributes.aValue);
    }
  }

  destroy(): void {
    if (!this.gl) return;

    const gl = this.gl;

    // Delete all buffers
    for (const buffer of this.buffers.values()) {
      gl.deleteBuffer(buffer);
    }
    this.buffers.clear();

    // Delete all textures
    for (const texture of this.textures.values()) {
      gl.deleteTexture(texture);
    }
    this.textures.clear();

    // Delete programs
    if (this.programs) {
      destroyPrograms(gl, this.programs);
      this.programs = null;
    }

    this.gl = null;
  }
}
