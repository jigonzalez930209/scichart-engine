/**
 * Instanced Line Shader - For ultra-large datasets
 * 
 * Uses instancing to render line segments efficiently.
 * Each instance renders a line segment between two consecutive points.
 */

export const INSTANCED_LINE_SHADER_WGSL = `
struct Uniforms {
  scale: vec2<f32>,
  translate: vec2<f32>,
  color: vec4<f32>,
  lineWidth: f32,
  aspectRatio: f32,
  pointCount: u32,
  padding: u32,
}

struct Point {
  x: f32,
  y: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> points: array<Point>;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) @interpolate(flat) segment_index: u32,
}

@vertex
fn vs_main(
  @builtin(vertex_index) vertex_index: u32,
  @builtin(instance_index) instance_index: u32
) -> VertexOut {
  var out: VertexOut;
  out.segment_index = instance_index;
  
  // Skip if beyond point count
  if (instance_index >= uniforms.pointCount - 1u) {
    out.position = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    return out;
  }
  
  // Get the two points for this segment
  let p0 = points[instance_index];
  let p1 = points[instance_index + 1u];
  
  // Transform points to clip space
  let pos0 = vec2<f32>(p0.x * uniforms.scale.x + uniforms.translate.x,
                       p0.y * uniforms.scale.y + uniforms.translate.y);
  let pos1 = vec2<f32>(p1.x * uniforms.scale.x + uniforms.translate.x,
                       p1.y * uniforms.scale.y + uniforms.translate.y);
  
  // Calculate line direction and perpendicular
  let dir = normalize(pos1 - pos0);
  let perp = vec2<f32>(-dir.y, dir.x);
  
  // Adjust for aspect ratio
  let width = uniforms.lineWidth / 500.0; // Normalized width
  let offset = perp * width;
  
  // Each segment is a quad (2 triangles, 6 vertices)
  // vertex_index: 0,1,2 = first triangle, 3,4,5 = second triangle
  var pos: vec2<f32>;
  
  switch (vertex_index % 6u) {
    case 0u: { pos = pos0 - offset; } // bottom-left of start
    case 1u: { pos = pos0 + offset; } // top-left of start
    case 2u: { pos = pos1 - offset; } // bottom-left of end
    case 3u: { pos = pos1 - offset; } // bottom-left of end
    case 4u: { pos = pos0 + offset; } // top-left of start
    case 5u: { pos = pos1 + offset; } // top-left of end
    default: { pos = pos0; }
  }
  
  out.position = vec4<f32>(pos, 0.0, 1.0);
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  return uniforms.color;
}
`;

/**
 * Instanced Point Shader - For ultra-large scatter datasets
 * 
 * Uses instancing with a quad per point.
 * Supports SDF-based symbols.
 */
export const INSTANCED_POINT_SHADER_WGSL = `
struct Uniforms {
  scale: vec2<f32>,
  translate: vec2<f32>,
  color: vec4<f32>,
  pointSize: f32,
  symbolType: i32,
  viewportWidth: f32,
  viewportHeight: f32,
  pointCount: u32,
  padding: vec3<u32>,
}

struct Point {
  x: f32,
  y: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> points: array<Point>;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vs_main(
  @builtin(vertex_index) vertex_index: u32,
  @builtin(instance_index) instance_index: u32
) -> VertexOut {
  var out: VertexOut;
  
  if (instance_index >= uniforms.pointCount) {
    out.position = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    out.uv = vec2<f32>(0.0, 0.0);
    return out;
  }
  
  let pt = points[instance_index];
  
  // Transform point center to clip space
  let center = vec2<f32>(
    pt.x * uniforms.scale.x + uniforms.translate.x,
    pt.y * uniforms.scale.y + uniforms.translate.y
  );
  
  // Calculate point size in clip space
  let sizeX = uniforms.pointSize / uniforms.viewportWidth * 2.0;
  let sizeY = uniforms.pointSize / uniforms.viewportHeight * 2.0;
  
  // Quad vertices (6 for 2 triangles)
  var offset: vec2<f32>;
  var uv: vec2<f32>;
  
  switch (vertex_index % 6u) {
    case 0u: { offset = vec2<f32>(-sizeX, -sizeY); uv = vec2<f32>(-1.0, -1.0); }
    case 1u: { offset = vec2<f32>( sizeX, -sizeY); uv = vec2<f32>( 1.0, -1.0); }
    case 2u: { offset = vec2<f32>(-sizeX,  sizeY); uv = vec2<f32>(-1.0,  1.0); }
    case 3u: { offset = vec2<f32>(-sizeX,  sizeY); uv = vec2<f32>(-1.0,  1.0); }
    case 4u: { offset = vec2<f32>( sizeX, -sizeY); uv = vec2<f32>( 1.0, -1.0); }
    case 5u: { offset = vec2<f32>( sizeX,  sizeY); uv = vec2<f32>( 1.0,  1.0); }
    default: { offset = vec2<f32>(0.0, 0.0); uv = vec2<f32>(0.0, 0.0); }
  }
  
  out.position = vec4<f32>(center + offset, 0.0, 1.0);
  out.uv = uv;
  return out;
}

// SDF functions
fn sdCircle(p: vec2<f32>) -> f32 {
  return length(p) - 0.8;
}

fn sdSquare(p: vec2<f32>) -> f32 {
  let d = abs(p) - vec2<f32>(0.7);
  return length(max(d, vec2<f32>(0.0))) + min(max(d.x, d.y), 0.0);
}

fn sdDiamond(p: vec2<f32>) -> f32 {
  return (abs(p.x) + abs(p.y)) - 0.8;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  var d: f32;
  
  switch (uniforms.symbolType) {
    case 0: { d = sdCircle(in.uv); }  // circle
    case 1: { d = sdSquare(in.uv); }  // square
    case 2: { d = sdDiamond(in.uv); } // diamond
    default: { d = sdCircle(in.uv); }
  }
  
  if (d > 0.05) {
    discard;
  }
  
  let alpha = 1.0 - smoothstep(0.0, 0.05, d);
  return vec4<f32>(uniforms.color.rgb, uniforms.color.a * alpha);
}
`;

export const INSTANCED_LINE_VERTEX_STRIDE = 8; // vec2<f32>
export const INSTANCED_POINT_VERTEX_STRIDE = 8; // vec2<f32>
