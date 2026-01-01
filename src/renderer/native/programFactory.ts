import type { ProgramBundle, ProgramMode, ShaderProgram } from "./types";
import {
  HEATMAP_FRAG,
  HEATMAP_VERT,
  LINE_FRAG,
  LINE_VERT,
  POINT_FRAG,
  POINT_VERT,
} from "./shaderSources";

function createShader(
  gl: WebGLRenderingContext,
  source: string,
  type: number
): WebGLShader {
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

function createProgram(
  gl: WebGLRenderingContext,
  vertSource: string,
  fragSource: string,
  mode: ProgramMode
): ShaderProgram {
  const vertShader = createShader(gl, vertSource, gl.VERTEX_SHADER);
  const fragShader = createShader(gl, fragSource, gl.FRAGMENT_SHADER);

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

  return {
    program,
    attributes: {
      position: gl.getAttribLocation(
        program,
        mode === "heatmap" ? "aPosition" : "position"
      ),
      value: mode === "heatmap" ? gl.getAttribLocation(program, "aValue") : -1,
    },
    uniforms: {
      uScale: gl.getUniformLocation(program, "uScale")!,
      uTranslate: gl.getUniformLocation(program, "uTranslate")!,
      uColor:
        mode !== "heatmap" ? gl.getUniformLocation(program, "uColor") : null,
      uPointSize:
        mode === "point" ? gl.getUniformLocation(program, "uPointSize") : null,
      uSymbol:
        mode === "point" ? gl.getUniformLocation(program, "uSymbol") : null,
      uMinValue:
        mode === "heatmap" ? gl.getUniformLocation(program, "uMinValue") : null,
      uMaxValue:
        mode === "heatmap" ? gl.getUniformLocation(program, "uMaxValue") : null,
      uColormap:
        mode === "heatmap" ? gl.getUniformLocation(program, "uColormap") : null,
    },
  };
}

export function createProgramBundle(gl: WebGLRenderingContext): ProgramBundle {
  return {
    lineProgram: createProgram(gl, LINE_VERT, LINE_FRAG, "line"),
    pointProgram: createProgram(gl, POINT_VERT, POINT_FRAG, "point"),
    heatmapProgram: createProgram(gl, HEATMAP_VERT, HEATMAP_FRAG, "heatmap"),
  };
}
