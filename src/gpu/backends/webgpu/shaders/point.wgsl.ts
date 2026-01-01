/**
 * Point Shader - WGSL for WebGPU
 * 
 * Renders scatter points with SDF-based symbols.
 * Supports: circle, square, diamond, triangle, triangleDown, cross, x, star
 */

export const POINT_SHADER_WGSL = `
// Uniform buffer for transforms, color, point properties
struct Uniforms {
  scale: vec2<f32>,
  translate: vec2<f32>,
  color: vec4<f32>,
  pointSize: f32,
  symbol: i32, // 0=circle, 1=square, 2=diamond, 3=triangle, 4=triangleDown, 5=cross, 6=x, 7=star
  _padding: vec2<f32>,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

struct VSInput {
  @location(0) position: vec2<f32>,
};

struct VSOutput {
  @builtin(position) pos: vec4<f32>,
  @location(0) @interpolate(flat) pointSize: f32,
  @location(1) @interpolate(flat) symbol: i32,
};

@vertex
fn vs_main(in: VSInput, @builtin(vertex_index) vertexIndex: u32) -> VSOutput {
  var out: VSOutput;
  let transformed = in.position * uniforms.scale + uniforms.translate;
  out.pos = vec4<f32>(transformed, 0.0, 1.0);
  out.pointSize = uniforms.pointSize;
  out.symbol = uniforms.symbol;
  return out;
}

// SDF functions for symbols
fn sdCircle(p: vec2<f32>, r: f32) -> f32 {
  return length(p) - r;
}

fn sdBox(p: vec2<f32>, b: vec2<f32>) -> f32 {
  let d = abs(p) - b;
  return length(max(d, vec2<f32>(0.0))) + min(max(d.x, d.y), 0.0);
}

fn sdDiamond(p: vec2<f32>, r: f32) -> f32 {
  return (abs(p.x) + abs(p.y)) - r;
}

fn sdTriangle(p_in: vec2<f32>, r: f32) -> f32 {
  let k = sqrt(3.0);
  var p = p_in;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) {
    p = vec2<f32>(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  }
  p.x = p.x - clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

fn sdCross(p: vec2<f32>, r: f32, thickness: f32) -> f32 {
  let d = abs(p);
  let s1 = sdBox(d, vec2<f32>(r, thickness));
  let s2 = sdBox(d, vec2<f32>(thickness, r));
  return min(s1, s2);
}

fn sdX(p: vec2<f32>, r: f32, thickness: f32) -> f32 {
  let c = cos(0.785398);
  let s = sin(0.785398);
  let m = mat2x2<f32>(c, -s, s, c);
  return sdCross(m * p, r, thickness);
}

fn sdStar(p_in: vec2<f32>, r: f32, rf: f32) -> f32 {
  let k1 = vec2<f32>(0.80901699, -0.58778525);
  let k2 = vec2<f32>(-k1.x, k1.y);
  var p = p_in;
  p.x = abs(p.x);
  p = p - 2.0 * max(dot(k1, p), 0.0) * k1;
  p = p - 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y = p.y - r;
  let ba = rf * vec2<f32>(-k1.y, k1.x) - vec2<f32>(0.0, 1.0);
  let h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

@fragment
fn fs_main(in: VSOutput) -> @location(0) vec4<f32> {
  // Note: WebGPU doesn't have gl_PointCoord directly
  // Points in WebGPU require rendering quads instead
  // This shader needs instanced rendering with quads for proper point rendering
  // For now, return the color directly
  return uniforms.color;
}
`;

// For proper point rendering we need quad instances
// Each point becomes 6 vertices (2 triangles forming a quad)
export const POINT_QUAD_SHADER_WGSL = `
// Uniform buffer for transforms, color, point properties
struct Uniforms {
  scale: vec2<f32>,
  translate: vec2<f32>,
  color: vec4<f32>,
  pointSize: f32,
  symbol: i32,
  viewport: vec2<f32>, // viewport dimensions for proper sizing
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

struct VSInput {
  @location(0) position: vec2<f32>,  // point center position
  @location(1) quadOffset: vec2<f32>, // quad vertex offset (-1 to 1)
};

struct VSOutput {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>, // -0.5 to 0.5 for SDF
};

@vertex
fn vs_main(in: VSInput) -> VSOutput {
  var out: VSOutput;
  
  // Transform point position to NDC
  let transformed = in.position * uniforms.scale + uniforms.translate;
  
  // Calculate point size in NDC
  let pointSizeNDC = vec2<f32>(
    uniforms.pointSize / uniforms.viewport.x * 2.0,
    uniforms.pointSize / uniforms.viewport.y * 2.0
  );
  
  // Apply quad offset
  let offset = in.quadOffset * pointSizeNDC * 0.5;
  
  out.pos = vec4<f32>(transformed + offset, 0.0, 1.0);
  out.uv = in.quadOffset * 0.5; // -0.5 to 0.5
  
  return out;
}

// SDF functions
fn sdCircle(p: vec2<f32>, r: f32) -> f32 {
  return length(p) - r;
}

fn sdBox(p: vec2<f32>, b: vec2<f32>) -> f32 {
  let d = abs(p) - b;
  return length(max(d, vec2<f32>(0.0))) + min(max(d.x, d.y), 0.0);
}

fn sdDiamond(p: vec2<f32>, r: f32) -> f32 {
  return (abs(p.x) + abs(p.y)) - r;
}

fn sdTriangle(p_in: vec2<f32>, r: f32) -> f32 {
  let k = sqrt(3.0);
  var p = p_in;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) {
    p = vec2<f32>(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  }
  p.x = p.x - clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

fn sdCross(p: vec2<f32>, r: f32, thickness: f32) -> f32 {
  let d = abs(p);
  let s1 = sdBox(d, vec2<f32>(r, thickness));
  let s2 = sdBox(d, vec2<f32>(thickness, r));
  return min(s1, s2);
}

fn sdX(p: vec2<f32>, r: f32, thickness: f32) -> f32 {
  let c = cos(0.785398);
  let s = sin(0.785398);
  let m = mat2x2<f32>(c, -s, s, c);
  return sdCross(m * p, r, thickness);
}

fn sdStar(p_in: vec2<f32>, r: f32, rf: f32) -> f32 {
  let k1 = vec2<f32>(0.80901699, -0.58778525);
  let k2 = vec2<f32>(-k1.x, k1.y);
  var p = p_in;
  p.x = abs(p.x);
  p = p - 2.0 * max(dot(k1, p), 0.0) * k1;
  p = p - 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y = p.y - r;
  let ba = rf * vec2<f32>(-k1.y, k1.x) - vec2<f32>(0.0, 1.0);
  let h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

@fragment
fn fs_main(in: VSOutput) -> @location(0) vec4<f32> {
  var d: f32 = 0.0;
  
  if (uniforms.symbol == 0) {
    d = sdCircle(in.uv, 0.45);
  } else if (uniforms.symbol == 1) {
    d = sdBox(in.uv, vec2<f32>(0.35));
  } else if (uniforms.symbol == 2) {
    d = sdDiamond(in.uv, 0.45);
  } else if (uniforms.symbol == 3) {
    d = sdTriangle(vec2<f32>(in.uv.x, in.uv.y + 0.1), 0.4);
  } else if (uniforms.symbol == 4) {
    d = sdTriangle(vec2<f32>(in.uv.x, -in.uv.y + 0.1), 0.4);
  } else if (uniforms.symbol == 5) {
    d = sdCross(in.uv, 0.45, 0.15);
  } else if (uniforms.symbol == 6) {
    d = sdX(in.uv, 0.45, 0.15);
  } else if (uniforms.symbol == 7) {
    d = sdStar(in.uv, 0.45, 0.4);
  }
  
  if (d > 0.02) {
    discard;
  }
  
  let alpha = 1.0 - smoothstep(0.0, 0.02, d);
  return vec4<f32>(uniforms.color.rgb, uniforms.color.a * alpha);
}
`;

export const POINT_VERTEX_STRIDE = 2 * 4; // 2 floats (x, y)
