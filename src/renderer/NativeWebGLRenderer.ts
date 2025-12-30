/**
 * NativeWebGLRenderer - Zero-dependency WebGL renderer
 *
 * This renderer uses raw WebGL APIs without any external libraries.
 * Performance is identical (or slightly better) than regl since
 * we eliminate the abstraction layer overhead.
 *
 * Key optimizations:
 * - Pre-compiled shaders (compiled once, reused)
 * - Uniform updates via GPU (no buffer recreation for zoom/pan)
 * - Buffer pooling for dynamic data
 * - Minimal state changes per frame
 */

import type { Bounds, SeriesStyle } from '../types';

// ============================================
// Types
// ============================================

export interface NativeSeriesRenderData {
  id: string;
  buffer: WebGLBuffer;
  count: number;
  style: SeriesStyle;
  visible: boolean;
  type: 'line' | 'scatter' | 'line+scatter';
}

export interface NativeRenderOptions {
  bounds: Bounds;
  backgroundColor?: [number, number, number, number];
}

interface ShaderProgram {
  program: WebGLProgram;
  attributes: { position: number };
  uniforms: {
    uScale: WebGLUniformLocation;
    uTranslate: WebGLUniformLocation;
    uColor: WebGLUniformLocation;
    uPointSize?: WebGLUniformLocation;
  };
}

// ============================================
// Shader Sources
// ============================================

const LINE_VERT = `
precision highp float;
attribute vec2 position;
uniform vec2 uScale;
uniform vec2 uTranslate;

void main() {
  vec2 pos = position * uScale + uTranslate;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const LINE_FRAG = `
precision highp float;
uniform vec4 uColor;

void main() {
  gl_FragColor = uColor;
}
`;

const POINT_VERT = `
precision highp float;
attribute vec2 position;
uniform vec2 uScale;
uniform vec2 uTranslate;
uniform float uPointSize;

void main() {
  vec2 pos = position * uScale + uTranslate;
  gl_Position = vec4(pos, 0.0, 1.0);
  gl_PointSize = uPointSize;
}
`;

const POINT_FRAG = `
precision highp float;
uniform vec4 uColor;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;
  float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
  gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);
}
`;

// ============================================
// NativeWebGLRenderer Class
// ============================================

export class NativeWebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private dpr: number;

  // Compiled shader programs
  private lineProgram: ShaderProgram;
  private pointProgram: ShaderProgram;

  // Buffer cache
  private buffers: Map<string, WebGLBuffer> = new Map();
  private bufferSizes: Map<string, number> = new Map();

  // State
  private isInitialized = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.dpr = window.devicePixelRatio || 1;

    // Get WebGL context
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      throw new Error('WebGL not supported');
    }

    this.gl = gl;

    // Compile shaders
    this.lineProgram = this.createProgram(LINE_VERT, LINE_FRAG, false);
    this.pointProgram = this.createProgram(POINT_VERT, POINT_FRAG, true);

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.isInitialized = true;
    console.log('[NativeWebGL] Initialized successfully');
  }

  // ----------------------------------------
  // Shader Compilation
  // ----------------------------------------

  private createShader(source: string, type: number): WebGLShader {
    const { gl } = this;
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Failed to create shader');

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compilation error: ${error}`);
    }

    return shader;
  }

  private createProgram(
    vertSource: string,
    fragSource: string,
    hasPointSize: boolean
  ): ShaderProgram {
    const { gl } = this;

    const vertShader = this.createShader(vertSource, gl.VERTEX_SHADER);
    const fragShader = this.createShader(fragSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    if (!program) throw new Error('Failed to create program');

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      throw new Error(`Program link error: ${error}`);
    }

    // Clean up shaders (they're now part of the program)
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);

    // Get attribute and uniform locations
    const positionAttr = gl.getAttribLocation(program, 'position');
    const scaleUniform = gl.getUniformLocation(program, 'uScale');
    const translateUniform = gl.getUniformLocation(program, 'uTranslate');
    const colorUniform = gl.getUniformLocation(program, 'uColor');

    if (scaleUniform === null || translateUniform === null || colorUniform === null) {
      throw new Error('Failed to get uniform locations');
    }

    const result: ShaderProgram = {
      program,
      attributes: { position: positionAttr },
      uniforms: {
        uScale: scaleUniform,
        uTranslate: translateUniform,
        uColor: colorUniform,
      },
    };

    if (hasPointSize) {
      result.uniforms.uPointSize = gl.getUniformLocation(program, 'uPointSize') ?? undefined;
    }

    return result;
  }

  // ----------------------------------------
  // Buffer Management
  // ----------------------------------------

  get available(): boolean {
    return this.isInitialized;
  }

  /**
   * Create or update a buffer with interleaved X,Y data
   */
  createBuffer(id: string, data: Float32Array): void {
    const { gl } = this;
    let buffer = this.buffers.get(id);
    const currentSize = this.bufferSizes.get(id) || 0;

    if (buffer && data.byteLength <= currentSize) {
      // Update existing buffer with subdata (faster)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    } else {
      // Create new buffer or recreate if size increased
      if (buffer) {
        gl.deleteBuffer(buffer);
      }
      buffer = gl.createBuffer();
      if (!buffer) throw new Error('Failed to create buffer');

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

      this.buffers.set(id, buffer);
      this.bufferSizes.set(id, data.byteLength);
    }
  }

  /**
   * Get a buffer by ID
   */
  getBuffer(id: string): WebGLBuffer | undefined {
    return this.buffers.get(id);
  }

  /**
   * Delete a buffer
   */
  deleteBuffer(id: string): void {
    const buffer = this.buffers.get(id);
    if (buffer) {
      this.gl.deleteBuffer(buffer);
      this.buffers.delete(id);
      this.bufferSizes.delete(id);
    }
  }

  // ----------------------------------------
  // Rendering
  // ----------------------------------------

  /**
   * Calculate uniforms for the current viewport
   */
  private calculateUniforms(bounds: Bounds): { scale: [number, number]; translate: [number, number] } {
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
   * Render a frame
   */
  render(series: NativeSeriesRenderData[], options: NativeRenderOptions): void {
    if (!this.isInitialized) return;

    const { gl } = this;
    const { bounds, backgroundColor = [0.1, 0.1, 0.18, 1] } = options;
    const uniforms = this.calculateUniforms(bounds);

    // Clear with background color
    gl.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Render each series
    for (const s of series) {
      if (!s.visible || s.count === 0) continue;

      const color = parseColor(s.style.color ?? '#ff0055');
      color[3] = s.style.opacity ?? 1;

      if (s.type === 'scatter') {
        this.renderPoints(s.buffer, s.count, uniforms, color, (s.style.pointSize ?? 4) * this.dpr);
      } else if (s.type === 'line') {
        this.renderLine(s.buffer, s.count, uniforms, color);
      } else if (s.type === 'line+scatter') {
        this.renderLine(s.buffer, s.count, uniforms, color);
        this.renderPoints(s.buffer, s.count, uniforms, color, (s.style.pointSize ?? 4) * this.dpr);
      }
    }
  }

  private renderLine(
    buffer: WebGLBuffer,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    color: [number, number, number, number]
  ): void {
    const { gl } = this;
    const prog = this.lineProgram;

    gl.useProgram(prog.program);

    // Bind buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(prog.attributes.position);
    gl.vertexAttribPointer(prog.attributes.position, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms
    gl.uniform2f(prog.uniforms.uScale, uniforms.scale[0], uniforms.scale[1]);
    gl.uniform2f(prog.uniforms.uTranslate, uniforms.translate[0], uniforms.translate[1]);
    gl.uniform4f(prog.uniforms.uColor, color[0], color[1], color[2], color[3]);

    // Draw
    gl.drawArrays(gl.LINE_STRIP, 0, count);

    gl.disableVertexAttribArray(prog.attributes.position);
  }

  private renderPoints(
    buffer: WebGLBuffer,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    color: [number, number, number, number],
    pointSize: number
  ): void {
    const { gl } = this;
    const prog = this.pointProgram;

    gl.useProgram(prog.program);

    // Bind buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(prog.attributes.position);
    gl.vertexAttribPointer(prog.attributes.position, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms
    gl.uniform2f(prog.uniforms.uScale, uniforms.scale[0], uniforms.scale[1]);
    gl.uniform2f(prog.uniforms.uTranslate, uniforms.translate[0], uniforms.translate[1]);
    gl.uniform4f(prog.uniforms.uColor, color[0], color[1], color[2], color[3]);
    if (prog.uniforms.uPointSize) {
      gl.uniform1f(prog.uniforms.uPointSize, pointSize);
    }

    // Draw
    gl.drawArrays(gl.POINTS, 0, count);

    gl.disableVertexAttribArray(prog.attributes.position);
  }

  /**
   * Handle resize
   */
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

  /**
   * Get WebGL limits (for debugging)
   */
  getLimits() {
    const { gl } = this;
    return {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      renderer: gl.getParameter(gl.RENDERER),
      vendor: gl.getParameter(gl.VENDOR),
    };
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    const { gl } = this;

    // Destroy all buffers
    this.buffers.forEach((buffer) => gl.deleteBuffer(buffer));
    this.buffers.clear();
    this.bufferSizes.clear();

    // Destroy programs
    gl.deleteProgram(this.lineProgram.program);
    gl.deleteProgram(this.pointProgram.program);

    this.isInitialized = false;
    console.log('[NativeWebGL] Destroyed');
  }
}

// ============================================
// Utility: Parse Color
// ============================================

export function parseColor(color: string): [number, number, number, number] {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16) / 255;
      const g = parseInt(hex[1] + hex[1], 16) / 255;
      const b = parseInt(hex[2] + hex[2], 16) / 255;
      return [r, g, b, 1];
    } else if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return [r, g, b, 1];
    } else if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return [r, g, b, a];
    }
  }

  // Default: magenta for visibility
  return [1, 0, 1, 1];
}

// ============================================
// Utility: Interleave Data
// ============================================

export function interleaveData(
  x: Float32Array | Float64Array | number[],
  y: Float32Array | Float64Array | number[]
): Float32Array {
  const length = Math.min(x.length, y.length);
  const result = new Float32Array(length * 2);

  for (let i = 0; i < length; i++) {
    result[i * 2] = x[i];
    result[i * 2 + 1] = y[i];
  }

  return result;
}
