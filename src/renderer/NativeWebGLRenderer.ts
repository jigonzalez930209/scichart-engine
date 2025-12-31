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

import type { Bounds } from "../types";

// ============================================
// Types
// ============================================

export interface NativeSeriesRenderData {
  id: string;
  buffer: WebGLBuffer;
  count: number;
  style: any; // Using any to support both SeriesStyle and HeatmapStyle
  visible: boolean;
  type: "line" | "scatter" | "line+scatter" | "step" | "step+scatter" | "band" | "bar" | "heatmap";
  /** For step types: pre-computed step buffer */
  stepBuffer?: WebGLBuffer;
  stepCount?: number;
  /** Optional specific Y-bounds for this series (overrides global bounds) */
  yBounds?: { min: number; max: number };
  /** Heatmap specific */
  zBounds?: { min: number; max: number };
  colormap?: string;
  colormapTexture?: WebGLTexture;
}

export interface NativeRenderOptions {
  bounds: Bounds;
  backgroundColor?: [number, number, number, number];
  plotArea?: { x: number; y: number; width: number; height: number };
}

interface ShaderProgram {
  program: WebGLProgram;
  attributes: { 
    position: number;
    value?: number;
  };
  uniforms: {
    uScale: WebGLUniformLocation;
    uTranslate: WebGLUniformLocation;
    uColor: WebGLUniformLocation | null;
    uPointSize: WebGLUniformLocation | null;
    uSymbol: WebGLUniformLocation | null;
    uMinValue: WebGLUniformLocation | null;
    uMaxValue: WebGLUniformLocation | null;
    uColormap: WebGLUniformLocation | null;
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
uniform int uSymbol;

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdTriangle(vec2 p, float r) {
  const float k = sqrt(3.0);
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

float sdDiamond(vec2 p, float r) {
  return (abs(p.x) + abs(p.y)) - r;
}

float sdCross(vec2 p, float r, float thickness) {
  vec2 d = abs(p);
  float s1 = sdBox(d, vec2(r, thickness));
  float s2 = sdBox(d, vec2(thickness, r));
  return min(s1, s2);
}

float sdX(vec2 p, float r, float thickness) {
  float c = cos(0.785398); // 45 degrees
  float s = sin(0.785398);
  mat2 m = mat2(c, -s, s, c);
  return sdCross(m * p, r, thickness);
}

float sdStar(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.80901699, -0.58778525);
  const vec2 k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0, 1);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = 0.0;
  
  // Symbols: 0:circle, 1:square, 2:diamond, 3:triangle, 4:triangleDown, 5:cross, 6:x, 7:star
  if (uSymbol == 0) {
    d = sdCircle(p, 0.45);
  } else if (uSymbol == 1) {
    d = sdBox(p, vec2(0.35));
  } else if (uSymbol == 2) {
    d = sdDiamond(p, 0.45);
  } else if (uSymbol == 3) {
    d = sdTriangle(vec2(p.x, p.y + 0.1), 0.4);
  } else if (uSymbol == 4) {
    d = sdTriangle(vec2(p.x, -p.y + 0.1), 0.4);
  } else if (uSymbol == 5) {
    d = sdCross(p, 0.45, 0.15);
  } else if (uSymbol == 6) {
    d = sdX(p, 0.45, 0.15);
  } else if (uSymbol == 7) {
    d = sdStar(p, 0.45, 0.4);
  }
  
  if (d > 0.02) discard; // Add small margin for antialiasing
  
  float alpha = 1.0 - smoothstep(0.0, 0.02, d);
  gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);
}
`;

const HEATMAP_VERT = `
precision highp float;
attribute vec2 aPosition;
attribute float aValue;
uniform vec2 uScale;
uniform vec2 uTranslate;
varying float vValue;

void main() {
  gl_Position = vec4(aPosition * uScale + uTranslate, 0.0, 1.0);
  vValue = aValue;
}
`;

const HEATMAP_FRAG = `
precision highp float;
varying float vValue;
uniform float uMinValue;
uniform float uMaxValue;
uniform sampler2D uColormap;

void main() {
  float range = uMaxValue - uMinValue;
  float t = (vValue - uMinValue) / (range != 0.0 ? range : 1.0);
  t = clamp(t, 0.0, 1.0);
  // Sample 1D colormap at center of the texture height
  gl_FragColor = texture2D(uColormap, vec2(t, 0.5));
}
`;

// ============================================
// NativeWebGLRenderer Class
// ============================================

export class NativeWebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private dpr: number;

  setDPR(dpr: number): void {
    this.dpr = dpr;
    this.resize();
  }

  // Compiled shader programs
  private lineProgram: ShaderProgram;
  private pointProgram: ShaderProgram;
  private heatmapProgram: ShaderProgram;

  // Buffer cache
  private buffers: Map<string, WebGLBuffer> = new Map();
  private bufferSizes: Map<string, number> = new Map();

  // Texture cache for colormaps
  private textures: Map<string, WebGLTexture> = new Map();

  // State
  private isInitialized = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.dpr = window.devicePixelRatio || 1;

    // Get WebGL context
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true, // Essential for on-demand rendering
      powerPreference: "high-performance",
    });

    if (!gl) {
      throw new Error("WebGL not supported");
    }

    this.gl = gl;

    // Compile shaders
    this.lineProgram = this.createProgram(LINE_VERT, LINE_FRAG, "line");
    this.pointProgram = this.createProgram(POINT_VERT, POINT_FRAG, "point");
    this.heatmapProgram = this.createProgram(HEATMAP_VERT, HEATMAP_FRAG, "heatmap");

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.isInitialized = true;
    console.log("[NativeWebGL] Initialized successfully");
  }

  // ----------------------------------------
  // Shader Compilation
  // ----------------------------------------

  private createShader(source: string, type: number): WebGLShader {
    const { gl } = this;
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Failed to create shader");

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
    mode: "line" | "point" | "heatmap"
  ): ShaderProgram {
    const { gl } = this;

    const vertShader = this.createShader(vertSource, gl.VERTEX_SHADER);
    const fragShader = this.createShader(fragSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    if (!program) throw new Error("Failed to create program");

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      throw new Error(`Program link error: ${error}`);
    }

    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);

    const result: ShaderProgram = {
      program,
      attributes: { 
        position: gl.getAttribLocation(program, mode === "heatmap" ? "aPosition" : "position"),
        value: mode === "heatmap" ? gl.getAttribLocation(program, "aValue") : -1,
      },
      uniforms: {
        uScale: gl.getUniformLocation(program, "uScale")!,
        uTranslate: gl.getUniformLocation(program, "uTranslate")!,
        uColor: mode !== "heatmap" ? gl.getUniformLocation(program, "uColor") : null,
        uPointSize: mode === "point" ? gl.getUniformLocation(program, "uPointSize") : null,
        uSymbol: mode === "point" ? gl.getUniformLocation(program, "uSymbol") : null,
        uMinValue: mode === "heatmap" ? gl.getUniformLocation(program, "uMinValue") : null,
        uMaxValue: mode === "heatmap" ? gl.getUniformLocation(program, "uMaxValue") : null,
        uColormap: mode === "heatmap" ? gl.getUniformLocation(program, "uColormap") : null,
      },
    };

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
      if (!buffer) throw new Error("Failed to create buffer");

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

      this.buffers.set(id, buffer);
      this.bufferSizes.set(id, data.byteLength);
    }
  }

  /**
   * Update a portion of an existing buffer (compatible with WebGL 1.0)
   * Returns true if successful, false if buffer needs recreation
   */
  updateBuffer(id: string, data: Float32Array, offsetInBytes: number): boolean {
    const { gl } = this;
    const buffer = this.buffers.get(id);
    const currentSize = this.bufferSizes.get(id) || 0;

    if (!buffer || offsetInBytes + data.byteLength > currentSize) {
      return false; // Caller should call createBuffer with full data
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, offsetInBytes, data);
    return true;
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
  private calculateUniforms(bounds: Bounds): {
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

  /**
   * Render a frame
   */
  render(series: NativeSeriesRenderData[], options: NativeRenderOptions): void {
    if (!this.isInitialized) return;

    const { gl } = this;
    const { bounds, backgroundColor = [0.1, 0.1, 0.18, 1], plotArea } = options;
    
    // WebGL viewport uses bottom-left as origin (0,0)
    const canvasHeight = this.canvas.height;
    const canvasWidth = this.canvas.width;
    
    const pa = plotArea ? {
        x: plotArea.x * this.dpr,
        y: canvasHeight - (plotArea.y + plotArea.height) * this.dpr,
        width: plotArea.width * this.dpr,
        height: plotArea.height * this.dpr
    } : {
        x: 0, y: 0, width: canvasWidth, height: canvasHeight
    };

    // 1. Clear full canvas
    gl.viewport(0, 0, canvasWidth, canvasHeight);
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(
      backgroundColor[0],
      backgroundColor[1],
      backgroundColor[2],
      backgroundColor[3]
    );
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 2. Set viewport and scissor for plot area
    gl.viewport(pa.x, pa.y, pa.width, pa.height);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(pa.x, pa.y, pa.width, pa.height);

    const uniforms = this.calculateUniforms(bounds);

    // Render each series
    for (const s of series) {
      if (!s.visible || s.count === 0) continue;

      const yMin = s.yBounds ? s.yBounds.min : bounds.yMin;
      const yMax = s.yBounds ? s.yBounds.max : bounds.yMax;
      const yRange = yMax - yMin;
      
      // Map Y to clinical space within plotArea
      const yScale = yRange > 0 ? 2 / yRange : 1;
      const yTrans = -1 - yMin * yScale;

      const seriesUniforms = {
        scale: [uniforms.scale[0], yScale] as [number, number],
        translate: [uniforms.translate[0], yTrans] as [number, number]
      };

      const color = parseColor(s.style.color ?? "#ff0055");
      color[3] = s.style.opacity ?? 1;

      if (s.type === "scatter") {
        this.renderPoints(
          s.buffer,
          s.count,
          seriesUniforms,
          color,
          (s.style.pointSize ?? 4) * this.dpr,
          s.style.symbol
        );
      } else if (s.type === "line") {
        this.renderLine(s.buffer, s.count, seriesUniforms, color);
      } else if (s.type === "line+scatter") {
        this.renderLine(s.buffer, s.count, seriesUniforms, color);
        this.renderPoints(
          s.buffer,
          s.count,
          seriesUniforms,
          color,
          (s.style.pointSize ?? 4) * this.dpr,
          s.style.symbol
        );
      } else if (s.type === "step" || s.type === "step+scatter") {
        // Use step buffer if available, otherwise fall back to line
        if (s.stepBuffer && s.stepCount) {
          this.renderLine(s.stepBuffer, s.stepCount, seriesUniforms, color);
        } else {
          this.renderLine(s.buffer, s.count, seriesUniforms, color);
        }
        // Render points for step+scatter
        if (s.type === "step+scatter") {
          this.renderPoints(
            s.buffer,
            s.count,
            seriesUniforms,
            color,
            (s.style.pointSize ?? 4) * this.dpr,
            s.style.symbol
          );
        }
      } else if (s.type === "band") {
        this.renderBand(s.buffer, s.count, seriesUniforms, color);
      } else if (s.type === "heatmap") {
        this.renderHeatmap(s.buffer, s.count, seriesUniforms, s.zBounds, s.colormapTexture);
      } else if (s.type === "bar") {
        this.renderBar(s.buffer, s.count, seriesUniforms, color);
      }
    }
  }

  private renderBand(
    buffer: WebGLBuffer,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    color: [number, number, number, number]
  ): void {
    const { gl } = this;
    const prog = this.lineProgram; // Reuse line shader (it just outputs color)

    gl.useProgram(prog.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(prog.attributes.position);
    gl.vertexAttribPointer(prog.attributes.position, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(prog.uniforms.uScale, uniforms.scale[0], uniforms.scale[1]);
    gl.uniform2f(prog.uniforms.uTranslate, uniforms.translate[0], uniforms.translate[1]);
    
    // Band uses lower opacity by default for nice shading
    const alpha = color[3] * 0.4;
    gl.uniform4f(prog.uniforms.uColor, color[0], color[1], color[2], alpha);

    // Band uses TRIANGLE_STRIP for filling area between two curves
    // Vertex 1: (x1, yL), Vertex 2: (x1, yH), Vertex 3: (x2, yL)...
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, count);

    gl.disableVertexAttribArray(prog.attributes.position);
  }

  private renderHeatmap(
    buffer: WebGLBuffer,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    zBounds: { min: number; max: number } = { min: 0, max: 1 },
    texture?: WebGLTexture
  ): void {
    const { gl } = this;
    const prog = this.heatmapProgram;

    gl.useProgram(prog.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    
    // Position attribute (aPosition)
    gl.enableVertexAttribArray(prog.attributes.position);
    gl.vertexAttribPointer(prog.attributes.position, 2, gl.FLOAT, false, 12, 0);

    // Value attribute (aValue)
    if (prog.attributes.value !== undefined && prog.attributes.value !== -1) {
      gl.enableVertexAttribArray(prog.attributes.value);
      gl.vertexAttribPointer(prog.attributes.value, 1, gl.FLOAT, false, 12, 8);
    }

    gl.uniform2f(prog.uniforms.uScale, uniforms.scale[0], uniforms.scale[1]);
    gl.uniform2f(prog.uniforms.uTranslate, uniforms.translate[0], uniforms.translate[1]);
    
    if (prog.uniforms.uMinValue !== undefined && prog.uniforms.uMinValue !== null) 
      gl.uniform1f(prog.uniforms.uMinValue as WebGLUniformLocation, zBounds.min);
    if (prog.uniforms.uMaxValue !== undefined && prog.uniforms.uMaxValue !== null) 
      gl.uniform1f(prog.uniforms.uMaxValue as WebGLUniformLocation, zBounds.max);

    if (texture && prog.uniforms.uColormap) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(prog.uniforms.uColormap as WebGLUniformLocation, 0);
    } else if (prog.uniforms.uColormap) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    // Heatmap uses TRIANGLES
    gl.drawArrays(gl.TRIANGLES, 0, count);

    gl.disableVertexAttribArray(prog.attributes.position);
    if (prog.attributes.value !== undefined && prog.attributes.value !== -1) {
      gl.disableVertexAttribArray(prog.attributes.value);
    }
  }

  /**
   * Create or update a 1D colormap texture
   */
  createColormapTexture(id: string, data: Uint8Array): WebGLTexture {
    const { gl } = this;
    let texture = this.textures.get(id);

    if (!texture) {
      texture = gl.createTexture()!;
      this.textures.set(id, texture);
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); // Ensure tight packing for colormap
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      data.length / 4,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texture;
  }

  /**
   * Get a texture by ID
   */
  getTexture(id: string): WebGLTexture | undefined {
    return this.textures.get(id);
  }

  private renderBar(
    buffer: WebGLBuffer,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    color: [number, number, number, number]
  ): void {
    const { gl } = this;
    const prog = this.lineProgram; // Use color shader

    gl.useProgram(prog.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(prog.attributes.position);
    gl.vertexAttribPointer(prog.attributes.position, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(prog.uniforms.uScale, uniforms.scale[0], uniforms.scale[1]);
    gl.uniform2f(prog.uniforms.uTranslate, uniforms.translate[0], uniforms.translate[1]);
    gl.uniform4f(prog.uniforms.uColor, color[0], color[1], color[2], color[3]);

    // Bar uses TRIANGLES arranged as quads
    // interleaveBarData produces 6 vertices per point (2 triangles)
    gl.drawArrays(gl.TRIANGLES, 0, count * 6);

    gl.disableVertexAttribArray(prog.attributes.position);
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
    gl.uniform2f(
      prog.uniforms.uTranslate,
      uniforms.translate[0],
      uniforms.translate[1]
    );
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
    pointSize: number,
    symbol: string = 'circle'
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
    gl.uniform2f(
      prog.uniforms.uTranslate,
      uniforms.translate[0],
      uniforms.translate[1]
    );
    gl.uniform4f(prog.uniforms.uColor, color[0], color[1], color[2], color[3]);
    
    if (prog.uniforms.uPointSize) {
      gl.uniform1f(prog.uniforms.uPointSize, pointSize);
    }

    if (prog.uniforms.uSymbol) {
      // Symbols: 0:circle, 1:square, 2:diamond, 3:triangle, 4:triangleDown, 5:cross, 6:x, 7:star
      const symbolMap: Record<string, number> = {
        'circle': 0,
        'square': 1,
        'diamond': 2,
        'triangle': 3,
        'triangleDown': 4,
        'cross': 5,
        'x': 6,
        'star': 7
      };
      gl.uniform1i(prog.uniforms.uSymbol, symbolMap[symbol] ?? 0);
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
    console.log("[NativeWebGL] Destroyed");
  }
}

// ============================================
// Utility: Parse Color
// ============================================

export function parseColor(color: string): [number, number, number, number] {
  if (color.startsWith("#")) {
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

// ============================================
// Utility: Interleave Step Data
// ============================================

/**
 * Create step chart vertices from X,Y data
 * 
 * @param x X values
 * @param y Y values
 * @param mode Step mode: 'before', 'after', or 'center'
 * @returns Interleaved Float32Array for step line rendering
 * 
 * Step modes:
 * - 'after': Step occurs after the point (horizontal then vertical)
 * - 'before': Step occurs before the point (vertical then horizontal)
 * - 'center': Step occurs at the midpoint between points
 */
export function interleaveStepData(
  x: Float32Array | Float64Array | number[],
  y: Float32Array | Float64Array | number[],
  mode: 'before' | 'after' | 'center' = 'after'
): Float32Array {
  const length = Math.min(x.length, y.length);
  if (length < 2) {
    // Not enough points for step, return regular data
    return interleaveData(x, y);
  }

  // For n points, we need 2n-1 vertices (adding intermediate steps)
  const stepCount = length * 2 - 1;
  const result = new Float32Array(stepCount * 2);

  let resultIdx = 0;

  for (let i = 0; i < length; i++) {
    if (i === 0) {
      // First point
      result[resultIdx++] = x[0];
      result[resultIdx++] = y[0];
    } else {
      const prevX = x[i - 1];
      const prevY = y[i - 1];
      const currX = x[i];
      const currY = y[i];

      if (mode === 'after') {
        // Horizontal first, then vertical
        // Intermediate point: (currX, prevY)
        result[resultIdx++] = currX;
        result[resultIdx++] = prevY;
        // Current point
        result[resultIdx++] = currX;
        result[resultIdx++] = currY;
      } else if (mode === 'before') {
        // Vertical first, then horizontal
        // Intermediate point: (prevX, currY)
        result[resultIdx++] = prevX;
        result[resultIdx++] = currY;
        // Current point
        result[resultIdx++] = currX;
        result[resultIdx++] = currY;
      } else {
        // Center mode: step at midpoint
        const midX = (prevX + currX) / 2;
        // First intermediate: (midX, prevY)
        result[resultIdx++] = midX;
        result[resultIdx++] = prevY;
        // Second intermediate: (midX, currY)
        result[resultIdx++] = midX;
        result[resultIdx++] = currY;
        // Current point
        result[resultIdx++] = currX;
        result[resultIdx++] = currY;
      }
    }
  }

  // Trim the result if we overallocated (center mode uses more)
  return result.subarray(0, resultIdx);
}

/**
 * Interleaves data for band rendering
 * Produces [x1, y1, x1, y2, x2, y1, x2, y2, ...]
 * which is ready for gl.TRIANGLE_STRIP
 */
export function interleaveBandData(
  x: Float32Array | Float64Array | number[],
  y1: Float32Array | Float64Array | number[],
  y2: Float32Array | Float64Array | number[]
): Float32Array {
  const n = Math.min(x.length, y1.length, y2.length);
  const result = new Float32Array(n * 2 * 2); // 2 vertices per point, 2 floats per vertex
  
  for (let i = 0; i < n; i++) {
    const idx = i * 4;
    const xi = x[i];
    // Vertex 1 (Curve 1)
    result[idx + 0] = xi;
    result[idx + 1] = y1[i];
    // Vertex 2 (Curve 2 / Baseline)
    result[idx + 2] = xi;
    result[idx + 3] = y2[i];
  }
  return result;
}
