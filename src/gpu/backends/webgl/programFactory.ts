/**
 * WebGL Program Factory
 * 
 * Utilities for compiling and linking WebGL shader programs.
 */

import {
  LINE_VERT_GLSL,
  LINE_FRAG_GLSL,
  POINT_VERT_GLSL,
  POINT_FRAG_GLSL,
  HEATMAP_VERT_GLSL,
  HEATMAP_FRAG_GLSL,
} from "./shaders";

export interface ShaderProgram {
  program: WebGLProgram;
  attributes: Record<string, number>;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

/**
 * Compile a shader
 */
function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("[WebGL] Failed to create shader");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`[WebGL] Shader compilation error: ${info}`);
  }

  return shader;
}

/**
 * Link a shader program
 */
function linkProgram(
  gl: WebGLRenderingContext,
  vertShader: WebGLShader,
  fragShader: WebGLShader
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) {
    throw new Error("[WebGL] Failed to create program");
  }

  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`[WebGL] Program link error: ${info}`);
  }

  return program;
}

/**
 * Create a shader program from source
 */
export function createProgram(
  gl: WebGLRenderingContext,
  vertSource: string,
  fragSource: string,
  attributeNames: string[],
  uniformNames: string[]
): ShaderProgram {
  const vertShader = compileShader(gl, gl.VERTEX_SHADER, vertSource);
  const fragShader = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);
  const program = linkProgram(gl, vertShader, fragShader);

  // Clean up individual shaders (they're linked now)
  gl.deleteShader(vertShader);
  gl.deleteShader(fragShader);

  // Get attribute locations
  const attributes: Record<string, number> = {};
  for (const name of attributeNames) {
    attributes[name] = gl.getAttribLocation(program, name);
  }

  // Get uniform locations
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }

  return { program, attributes, uniforms };
}

/**
 * All programs used by the WebGL backend
 */
export interface ProgramBundle {
  line: ShaderProgram;
  point: ShaderProgram;
  heatmap: ShaderProgram;
}

/**
 * Create all shader programs
 */
export function createAllPrograms(gl: WebGLRenderingContext): ProgramBundle {
  const line = createProgram(
    gl,
    LINE_VERT_GLSL,
    LINE_FRAG_GLSL,
    ["aPosition"],
    ["uScale", "uTranslate", "uColor"]
  );

  const point = createProgram(
    gl,
    POINT_VERT_GLSL,
    POINT_FRAG_GLSL,
    ["aPosition"],
    ["uScale", "uTranslate", "uColor", "uPointSize", "uSymbol"]
  );

  const heatmap = createProgram(
    gl,
    HEATMAP_VERT_GLSL,
    HEATMAP_FRAG_GLSL,
    ["aPosition", "aValue"],
    ["uScale", "uTranslate", "uMinValue", "uMaxValue", "uColormap"]
  );

  return { line, point, heatmap };
}

/**
 * Destroy all programs
 */
export function destroyPrograms(gl: WebGLRenderingContext, bundle: ProgramBundle): void {
  gl.deleteProgram(bundle.line.program);
  gl.deleteProgram(bundle.point.program);
  gl.deleteProgram(bundle.heatmap.program);
}
