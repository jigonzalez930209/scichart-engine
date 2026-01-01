/**
 * WebGL Shader Sources
 * 
 * GLSL shaders for the WebGL backend.
 * These match the functionality of the WebGPU WGSL shaders.
 */

// ============================================
// Line Shader
// ============================================

export const LINE_VERT_GLSL = `
precision highp float;
attribute vec2 aPosition;
uniform vec2 uScale;
uniform vec2 uTranslate;

void main() {
  vec2 pos = aPosition * uScale + uTranslate;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

export const LINE_FRAG_GLSL = `
precision highp float;
uniform vec4 uColor;

void main() {
  gl_FragColor = uColor;
}
`;

// ============================================
// Point Shader (with SDF symbols)
// ============================================

export const POINT_VERT_GLSL = `
precision highp float;
attribute vec2 aPosition;
uniform vec2 uScale;
uniform vec2 uTranslate;
uniform float uPointSize;

void main() {
  vec2 pos = aPosition * uScale + uTranslate;
  gl_Position = vec4(pos, 0.0, 1.0);
  gl_PointSize = uPointSize;
}
`;

export const POINT_FRAG_GLSL = `
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
  float c = cos(0.785398);
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

  if (d > 0.02) discard;

  float alpha = 1.0 - smoothstep(0.0, 0.02, d);
  gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);
}
`;

// ============================================
// Heatmap Shader
// ============================================

export const HEATMAP_VERT_GLSL = `
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

export const HEATMAP_FRAG_GLSL = `
precision highp float;
varying float vValue;
uniform float uMinValue;
uniform float uMaxValue;
uniform sampler2D uColormap;

void main() {
  float range = uMaxValue - uMinValue;
  float t = (vValue - uMinValue) / (range != 0.0 ? range : 1.0);
  t = clamp(t, 0.0, 1.0);
  gl_FragColor = texture2D(uColormap, vec2(t, 0.5));
}
`;

// ============================================
// Triangle Shader (for bands and bars)
// ============================================

export const TRIANGLE_VERT_GLSL = `
precision highp float;
attribute vec2 aPosition;
attribute vec4 aColor;
uniform vec2 uScale;
uniform vec2 uTranslate;
varying vec4 vColor;

void main() {
  vec2 pos = aPosition * uScale + uTranslate;
  gl_Position = vec4(pos, 0.0, 1.0);
  vColor = aColor;
}
`;

export const TRIANGLE_FRAG_GLSL = `
precision highp float;
varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
`;
