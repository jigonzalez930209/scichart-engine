/**
 * Contour Plot Generation (Marching Squares)
 */

export interface ContourPoint {
  x: number;
  y: number;
}

export interface ContourLine {
  level: number;
  points: ContourPoint[];
}

export interface ContourOptions {
  levels?: number[];
  numLevels?: number;
}

/**
 * Generate contour lines from a 2D grid of values
 * Values are assumed to be in row-major order: z = values[y * width + x]
 */
export function generateContours(
  z: Float32Array | number[],
  xValues: Float32Array | number[],
  yValues: Float32Array | number[],
  options: ContourOptions = {}
): ContourLine[] {
  const width = xValues.length;
  const height = yValues.length;
  
  const minZ = Math.min(...z);
  const maxZ = Math.max(...z);
  
  const levels = options.levels || calculateLevels(minZ, maxZ, options.numLevels || 10);
  const result: ContourLine[] = [];

  for (const level of levels) {
    const segments: Array<[number, number, number, number]> = [];
    
    // Process each cell
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width - 1; x++) {
        const v0 = z[y * width + x];
        const v1 = z[y * width + (x + 1)];
        const v2 = z[(y + 1) * width + (x + 1)];
        const v3 = z[(y + 1) * width + x];
        
        processCell(x, y, v0, v1, v2, v3, level, xValues, yValues, segments);
      }
    }
    
    if (segments.length > 0) {
      // For simplicity, we return points as a flat array of segments
      // In a real implementation, we would join them into polylines
      const points: ContourPoint[] = [];
      for (const seg of segments) {
        points.push({ x: seg[0], y: seg[1] });
        points.push({ x: seg[2], y: seg[3] });
      }
      result.push({ level, points });
    }
  }

  return result;
}

function calculateLevels(min: number, max: number, n: number): number[] {
  const levels = [];
  const step = (max - min) / (n + 1);
  for (let i = 1; i <= n; i++) {
    levels.push(min + i * step);
  }
  return levels;
}

/**
 * Process a single cell using Marching Squares
 */
function processCell(
  x: number, y: number,
  v0: number, v1: number, v2: number, v3: number,
  level: number,
  xScale: any, yScale: any,
  segments: Array<[number, number, number, number]>
) {
  let caseIndex = 0;
  if (v0 >= level) caseIndex |= 1;
  if (v1 >= level) caseIndex |= 2;
  if (v2 >= level) caseIndex |= 4;
  if (v3 >= level) caseIndex |= 8;

  if (caseIndex === 0 || caseIndex === 15) return;

  // Interpolation helpers
  const lerp = (v0: number, v1: number, t: number) => v0 + (v1 - v0) * t;
  const getT = (v0: number, v1: number) => (level - v0) / (v1 - v0);

  // Edges: 0 (top), 1 (right), 2 (bottom), 3 (left)
  const getPoint = (edge: number): [number, number] => {
    switch (edge) {
      case 0: return [lerp(xScale[x], xScale[x + 1], getT(v0, v1)), yScale[y]];
      case 1: return [xScale[x + 1], lerp(yScale[y], yScale[y + 1], getT(v1, v2))];
      case 2: return [lerp(xScale[x], xScale[x + 1], getT(v3, v2)), yScale[y + 1]];
      case 3: return [xScale[x], lerp(yScale[y], yScale[y + 1], getT(v0, v3))];
      default: return [0, 0];
    }
  };

  const addSeg = (e1: number, e2: number) => {
    const p1 = getPoint(e1);
    const p2 = getPoint(e2);
    segments.push([p1[0], p1[1], p2[0], p2[1]]);
  };

  // Case table
  switch (caseIndex) {
    case 1: case 14: addSeg(0, 3); break;
    case 2: case 13: addSeg(0, 1); break;
    case 3: case 12: addSeg(1, 3); break;
    case 4: case 11: addSeg(1, 2); break;
    case 5: addSeg(0, 1); addSeg(2, 3); break; // Ambiguous
    case 6: case 9: addSeg(0, 2); break;
    case 7: case 8: addSeg(2, 3); break;
    case 10: addSeg(0, 3); addSeg(1, 2); break; // Ambiguous
  }
}
