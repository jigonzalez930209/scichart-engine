/**
 * Prepare bar chart data for WebGL rendering
 * Creates rectangle vertices for each bar (2 triangles per bar = 6 vertices)
 * 
 * @param x - X positions of bar centers
 * @param y - Y heights of bars
 * @param barWidth - Width of each bar in data units
 * @returns Interleaved vertex data ready for gl.TRIANGLES
 */
export function interleaveBarData(
  x: Float32Array | Float64Array | number[],
  y: Float32Array | Float64Array | number[],
  barWidth: number
): Float32Array {
  const n = Math.min(x.length, y.length);
  // Each bar = 2 triangles = 6 vertices, 2 floats per vertex
  const result = new Float32Array(n * 6 * 2);
  
  const halfWidth = barWidth * 0.5;
  
  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];
    const base = i * 12; // 6 vertices * 2 floats
    
    // Define bar corners
    const x0 = xi - halfWidth; // Left
    const x1 = xi + halfWidth; // Right
    const y0 = 0;               // Bottom
    const y1 = yi;              // Top
    
    // First triangle (bottom-left, bottom-right, top-left)
    result[base + 0] = x0;
    result[base + 1] = y0;
    result[base + 2] = x1;
    result[base + 3] = y0;
    result[base + 4] = x0;
    result[base + 5] = y1;
    
    // Second triangle (top-left, bottom-right, top-right)
    result[base + 6] = x0;
    result[base + 7] = y1;
    result[base + 8] = x1;
    result[base + 9] = y0;
    result[base + 10] = x1;
    result[base + 11] = y1;
  }
  
  return result;
}

/**
 * Calculate automatic bar width based on data spacing
 */
export function calculateBarWidth(x: Float32Array | Float64Array | number[]): number {
  if (x.length < 2) return 1.0;
  
  // Find minimum spacing between consecutive bars
  let minSpacing = Infinity;
  for (let i = 1; i < x.length; i++) {
    const spacing = Math.abs(x[i] - x[i - 1]);
    if (spacing > 0 && spacing < minSpacing) {
      minSpacing = spacing;
    }
  }
  
  // Bar width is 80% of minimum spacing (20% gap)
  return minSpacing === Infinity ? 1.0 : minSpacing * 0.8;
}
