/**
 * Prepare Heatmap data for WebGL rendering
 * Creates a mesh of triangles for the grid.
 * 
 * @param x - X coordinates of grid columns
 * @param y - Y coordinates of grid rows
 * @param z - Z values (matrix flattened in row-major order: width=x.length, height=y.length)
 * @returns Interleaved data [x, y, value, ...] ready for gl.TRIANGLES
 */
export function interleaveHeatmapData(
  x: Float32Array | Float64Array | number[],
  y: Float32Array | Float64Array | number[],
  z: Float32Array | Float64Array | number[]
): Float32Array {
  const width = x.length;
  const height = y.length;
  
  if (width * height > z.length) {
    console.warn("[Heatmap] Z array is too small for the specified grid dimensions");
  }

  // Each cell is 2 triangles = 6 vertices
  // Each vertex has 3 floats: [x, y, value]
  const numCells = (width - 1) * (height - 1);
  const result = new Float32Array(numCells * 6 * 3);
  
  let idx = 0;
  for (let j = 0; j < height - 1; j++) {
    for (let i = 0; i < width - 1; i++) {
      // Corners
      const x0 = x[i];
      const x1 = x[i+1];
      const y0 = y[j];
      const y1 = y[j+1];
      
      const v00 = z[j * width + i];
      const v10 = z[j * width + (i + 1)];
      const v01 = z[(j + 1) * width + i];
      const v11 = z[(j + 1) * width + (i + 1)];
      
      // Triangle 1 (BL, BR, TL)
      result[idx++] = x0; result[idx++] = y0; result[idx++] = v00;
      result[idx++] = x1; result[idx++] = y0; result[idx++] = v10;
      result[idx++] = x0; result[idx++] = y1; result[idx++] = v01;
      
      // Triangle 2 (TL, BR, TR)
      result[idx++] = x0; result[idx++] = y1; result[idx++] = v01;
      result[idx++] = x1; result[idx++] = y0; result[idx++] = v10;
      result[idx++] = x1; result[idx++] = y1; result[idx++] = v11;
    }
  }
  
  return result;
}

/**
 * Generates a colormap texture data
 * Viridis approximation
 */
export function getColormap(name: string = 'viridis'): Uint8Array {
  const size = 256;
  const data = new Uint8Array(size * 4);
  
  for (let i = 0; i < size; i++) {
    const t = i / (size - 1);
    let r, g, b;
    
    if (name === 'jet') {
       r = Math.min(Math.max(1.5 - Math.abs(t * 4 - 3), 0), 1);
       g = Math.min(Math.max(1.5 - Math.abs(t * 4 - 2), 0), 1);
       b = Math.min(Math.max(1.5 - Math.abs(t * 4 - 1), 0), 1);
    } else if (name === 'grayscale') {
       r = g = b = t;
    } else if (name === 'plasma') {
       r = 0.5 + 0.5 * Math.sin(Math.PI * (t - 0.5));
       g = 0.5 + 0.5 * Math.sin(Math.PI * t);
       b = 0.8;
    } else { // default viridis approx
       r = 0.267 * (1 - t) + 0.993 * t;
       g = 0.005 * (1 - t) + 0.906 * t;
       b = 0.337 * (1 - t) + 0.144 * t;
       // More accurate viridis constants could be used
    }
    
    data[i * 4 + 0] = r * 255;
    data[i * 4 + 1] = g * 255;
    data[i * 4 + 2] = b * 255;
    data[i * 4 + 3] = 255;
  }
  
  return data;
}
