/**
 * Line Vertex Shader
 *
 * Transforms 2D points from data space to clip space using uniforms.
 * This allows zoom/pan without recreating vertex buffers.
 */

export const lineVertexShader = `
precision highp float;

// Attributes (per-vertex data)
attribute vec2 position;

// Uniforms (constant across all vertices)
uniform vec2 uScale;       // Zoom factor [scaleX, scaleY]
uniform vec2 uTranslate;   // Pan offset [translateX, translateY]
uniform vec2 uResolution;  // Canvas size in pixels

// Varying (passed to fragment shader)
varying float vAlpha;

void main() {
  // Transform position: apply scale and translate
  vec2 pos = position * uScale + uTranslate;

  // pos is now in normalized device coordinates (-1 to 1)
  gl_Position = vec4(pos, 0.0, 1.0);

  // Pass alpha for potential fading effects
  vAlpha = 1.0;
}
`;

/**
 * Line Fragment Shader
 *
 * Simple solid color output with configurable opacity.
 */
export const lineFragmentShader = `
precision highp float;

// Uniforms
uniform vec4 uColor;  // RGBA color

// Varying from vertex shader
varying float vAlpha;

void main() {
  gl_FragColor = vec4(uColor.rgb, uColor.a * vAlpha);
}
`;

/**
 * Antialiased Line Vertex Shader
 *
 * For thick lines with proper antialiasing, we need to expand
 * lines into quads and compute distance from line center.
 */
export const lineAAVertexShader = `
precision highp float;

attribute vec2 position;
attribute vec2 normal;     // Perpendicular to line direction
attribute float miter;     // Miter length for joins

uniform vec2 uScale;
uniform vec2 uTranslate;
uniform vec2 uResolution;
uniform float uLineWidth;

varying vec2 vNormal;
varying float vLineWidth;

void main() {
  // Transform position
  vec2 pos = position * uScale + uTranslate;

  // Convert to screen space for line width calculation
  vec2 screenPos = (pos * 0.5 + 0.5) * uResolution;

  // Offset by line width in screen space
  float halfWidth = uLineWidth * 0.5;
  screenPos += normal * halfWidth * miter;

  // Convert back to clip space
  pos = (screenPos / uResolution) * 2.0 - 1.0;

  gl_Position = vec4(pos, 0.0, 1.0);

  vNormal = normal;
  vLineWidth = uLineWidth;
}
`;

/**
 * Antialiased Line Fragment Shader
 *
 * Uses distance-based antialiasing for smooth edges.
 */
export const lineAAFragmentShader = `
precision highp float;

uniform vec4 uColor;
uniform float uLineWidth;

varying vec2 vNormal;
varying float vLineWidth;

void main() {
  // Distance from line center (0 at center, 1 at edge)
  float dist = length(vNormal);

  // Smooth step for antialiasing
  float aa = 1.0 / uLineWidth;
  float alpha = 1.0 - smoothstep(1.0 - aa, 1.0, dist);

  gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);
}
`;

/**
 * Point/Scatter Vertex Shader
 *
 * Renders data points as squares/circles.
 */
export const pointVertexShader = `
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

/**
 * Point/Scatter Fragment Shader
 *
 * Renders circular points with smooth edges.
 */
export const pointFragmentShader = `
precision highp float;

uniform vec4 uColor;

void main() {
  // Distance from point center
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  // Discard outside circle
  if (dist > 0.5) discard;

  // Smooth edge
  float alpha = 1.0 - smoothstep(0.4, 0.5, dist);

  gl_FragColor = vec4(uColor.rgb, uColor.a * alpha);
}
`;

/**
 * Heatmap Vertex Shader (for future density plots)
 */
export const heatmapVertexShader = `
precision highp float;

attribute vec2 position;
attribute float value;

uniform vec2 uScale;
uniform vec2 uTranslate;

varying float vValue;

void main() {
  vec2 pos = position * uScale + uTranslate;
  gl_Position = vec4(pos, 0.0, 1.0);
  vValue = value;
}
`;

/**
 * Heatmap Fragment Shader
 *
 * Maps values to colors using a colormap.
 */
export const heatmapFragmentShader = `
precision highp float;

uniform float uMinValue;
uniform float uMaxValue;
uniform sampler2D uColormap;

varying float vValue;

void main() {
  float normalized = (vValue - uMinValue) / (uMaxValue - uMinValue);
  normalized = clamp(normalized, 0.0, 1.0);

  vec4 color = texture2D(uColormap, vec2(normalized, 0.5));
  gl_FragColor = color;
}
`;

/**
 * Bar Chart Vertex Shader
 * 
 * Renders rectangular bars using quad primitives.
 */
export const barVertexShader = `
precision highp float;

// Attributes
attribute vec2 position;  // Corner position of bar quad [x, y]
attribute vec2 barData;   // [barX, barY] - center and height of bar

// Uniforms
uniform vec2 uScale;
uniform vec2 uTranslate;
uniform float uBarWidth;  // Width of bars in data units

void main() {
  // Calculate bar corner in data space
  float halfWidth = uBarWidth * 0.5;
  vec2 dataPos = vec2(
    barData.x + position.x * halfWidth,  // X: center ± halfWidth
    position.y * barData.y                // Y: 0 to barY
  );
  
  // Transform to clip space
  vec2 clipPos = dataPos * uScale + uTranslate;
  gl_Position = vec4(clipPos, 0.0, 1.0);
}
`;

export const barFragmentShader = `
precision highp float;

uniform vec4 uColor;

void main() {
  gl_FragColor = uColor;
}
`;

// Export all shaders as a bundle
export const Shaders = {
  line: {
    vertex: lineVertexShader,
    fragment: lineFragmentShader,
  },
  lineAA: {
    vertex: lineAAVertexShader,
    fragment: lineAAFragmentShader,
  },
  point: {
    vertex: pointVertexShader,
    fragment: pointFragmentShader,
  },
  bar: {
    vertex: barVertexShader,
    fragment: barFragmentShader,
  },
  heatmap: {
    vertex: heatmapVertexShader,
    fragment: heatmapFragmentShader,
  },
};
