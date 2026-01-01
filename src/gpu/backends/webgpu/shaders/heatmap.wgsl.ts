/**
 * Heatmap Shader - WGSL for WebGPU
 * 
 * Renders heatmap cells with colormap texture lookup.
 * Each vertex has position (x, y) and value (z) for color mapping.
 */

export const HEATMAP_SHADER_WGSL = `
// Uniform buffer for transforms and value range
struct Uniforms {
  scale: vec2<f32>,
  translate: vec2<f32>,
  minValue: f32,
  maxValue: f32,
  _padding: vec2<f32>,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var colormapSampler: sampler;

@group(0) @binding(2)
var colormapTexture: texture_1d<f32>;

struct VSInput {
  @location(0) position: vec2<f32>,
  @location(1) value: f32,
};

struct VSOutput {
  @builtin(position) pos: vec4<f32>,
  @location(0) value: f32,
};

@vertex
fn vs_main(in: VSInput) -> VSOutput {
  var out: VSOutput;
  let transformed = in.position * uniforms.scale + uniforms.translate;
  out.pos = vec4<f32>(transformed, 0.0, 1.0);
  out.value = in.value;
  return out;
}

@fragment
fn fs_main(in: VSOutput) -> @location(0) vec4<f32> {
  let range = uniforms.maxValue - uniforms.minValue;
  var t: f32;
  if (range != 0.0) {
    t = (in.value - uniforms.minValue) / range;
  } else {
    t = 0.0;
  }
  t = clamp(t, 0.0, 1.0);
  
  return textureSample(colormapTexture, colormapSampler, t);
}
`;

// Heatmap vertex: position (2 floats) + value (1 float) = 12 bytes
export const HEATMAP_VERTEX_STRIDE = 3 * 4; // 12 bytes
