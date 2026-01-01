import { BufferStore } from "./bufferStore";
import { createProgramBundle } from "./programFactory";
import { renderFrame } from "./renderFrame";
import { TextureStore } from "./textureStore";
import type {
  NativeRenderOptions,
  NativeSeriesRenderData,
  ProgramBundle,
} from "./types";

export class NativeWebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private dpr: number;

  private programs: ProgramBundle;
  private buffers: BufferStore;
  private textures: TextureStore;

  private isInitialized = false;

  setDPR(dpr: number): void {
    this.dpr = dpr;
    this.resize();
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.dpr = window.devicePixelRatio || 1;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });

    if (!gl) throw new Error("WebGL not supported");

    this.gl = gl;
    this.programs = createProgramBundle(gl);
    this.buffers = new BufferStore(gl);
    this.textures = new TextureStore(gl);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.isInitialized = true;
  }

  get available(): boolean {
    return this.isInitialized;
  }

  createBuffer(id: string, data: Float32Array): void {
    this.buffers.createBuffer(id, data);
  }

  updateBuffer(id: string, data: Float32Array, offsetInBytes: number): boolean {
    return this.buffers.updateBuffer(id, data, offsetInBytes);
  }

  getBuffer(id: string): WebGLBuffer | undefined {
    return this.buffers.getBuffer(id);
  }

  deleteBuffer(id: string): void {
    this.buffers.deleteBuffer(id);
  }

  createColormapTexture(id: string, data: Uint8Array): WebGLTexture {
    return this.textures.createColormapTexture(id, data);
  }

  getTexture(id: string): WebGLTexture | undefined {
    return this.textures.getTexture(id);
  }

  render(series: NativeSeriesRenderData[], options: NativeRenderOptions): void {
    if (!this.isInitialized) return;
    renderFrame(this.gl, this.canvas, this.dpr, this.programs, series, options);
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width * this.dpr;
    const height = rect.height * this.dpr;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  getLimits() {
    const { gl } = this;
    return {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      renderer: gl.getParameter(gl.RENDERER),
      vendor: gl.getParameter(gl.VENDOR),
    };
  }

  destroy(): void {
    const { gl } = this;

    this.buffers.destroy();
    this.textures.destroy();

    gl.deleteProgram(this.programs.lineProgram.program);
    gl.deleteProgram(this.programs.pointProgram.program);
    gl.deleteProgram(this.programs.heatmapProgram.program);

    this.isInitialized = false;
  }
}

export type { NativeSeriesRenderData, NativeRenderOptions } from "./types";
