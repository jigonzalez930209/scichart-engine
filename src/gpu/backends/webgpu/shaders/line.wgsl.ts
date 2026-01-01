/**
 * Line Shader - WGSL for WebGPU
 * 
 * Renders simple line strips with uniform color.
 * Uses uniform buffer for transform (scale + translate).
 */

export const LINE_SHADER_WGSL = `
// Uniform buffer for transforms and color
struct Uniforms {
  scale: vec2<f32>,
  translate: vec2<f32>,
  color: vec4<f32>,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

struct VSInput {
  @location(0) position: vec2<f32>,
};

struct VSOutput {
  @builtin(position) pos: vec4<f32>,
};

@vertex
fn vs_main(in: VSInput) -> VSOutput {
  var out: VSOutput;
  let transformed = in.position * uniforms.scale + uniforms.translate;
  out.pos = vec4<f32>(transformed, 0.0, 1.0);
  return out;
}

@fragment
fn fs_main(in: VSOutput) -> @location(0) vec4<f32> {
  return uniforms.color;
}
`;

export const LINE_VERTEX_STRIDE = 2 * 4; // 2 floats (x, y)
