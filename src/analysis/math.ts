/**
 * Mathematical utilities for numerical analysis and regression.
 */

/**
 * Solve a system of linear equations Ax = B using Gaussian elimination with partial pivoting.
 * 
 * @param A - Matrix coefficients
 * @param B - Right hand side vector
 * @returns Solution vector x
 */
export function solveLinearSystem(A: number[][], B: number[]): number[] {
  const n = B.length;
  const matrix = A.map((row, i) => [...row, B[i]]);

  for (let i = 0; i < n; i++) {
    // Partial pivoting
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(matrix[k][i]) > Math.abs(matrix[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    const temp = matrix[i];
    matrix[i] = matrix[maxRow];
    matrix[maxRow] = temp;

    // Pivot must be non-zero
    const pivot = matrix[i][i];
    if (Math.abs(pivot) < 1e-12) {
      throw new Error("Matrix is singular or near-singular");
    }

    // Eliminate below
    for (let k = i + 1; k < n; k++) {
      const factor = matrix[k][i] / pivot;
      for (let j = i; j <= n; j++) {
        matrix[k][j] -= factor * matrix[i][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += matrix[i][j] * x[j];
    }
    x[i] = (matrix[i][n] - sum) / matrix[i][i];
  }

  return x;
}

/**
 * Calculate R² (coefficient of determination)
 */
export function calculateR2(
  x: number[] | Float32Array,
  y: number[] | Float32Array,
  fitFn: (x: number) => number
): number {
  const n = x.length;
  if (n === 0) return 0;

  let sumY = 0;
  for (let i = 0; i < n; i++) sumY += y[i];
  const meanY = sumY / n;

  let ssTot = 0; // Total sum of squares
  let ssRes = 0; // Residual sum of squares

  for (let i = 0; i < n; i++) {
    const yi = y[i];
    const fi = fitFn(x[i]);
    ssTot += (yi - meanY) * (yi - meanY);
    ssRes += (yi - fi) * (yi - fi);
  }

  return ssTot === 0 ? 1 : 1 - ssRes / ssTot;
}

/**
 * Numerical integration using the trapezoidal rule.
 * 
 * @param x - X values (must be sorted)
 * @param y - Y values
 * @param xMin - Optional start of integration range
 * @param xMax - Optional end of integration range
 */
export function integrate(
  x: number[] | Float32Array,
  y: number[] | Float32Array,
  xMin?: number,
  xMax?: number
): number {
  const n = x.length;
  if (n < 2) return 0;

  let area = 0;
  const start = xMin !== undefined ? xMin : x[0];
  const end = xMax !== undefined ? xMax : x[n - 1];

  for (let i = 0; i < n - 1; i++) {
    const x1 = x[i];
    const x2 = x[i + 1];
    
    // Skip if outside range
    if (x2 < start) continue;
    if (x1 > end) break;

    // Handle partial intervals at boundaries
    const ia = Math.max(x1, start);
    const ib = Math.min(x2, end);

    if (ia < ib) {
      // Linear interpolation for y values at boundaries if needed
      const y1 = y[i] + (y[i + 1] - y[i]) * ((ia - x1) / (x2 - x1));
      const y2 = y[i] + (y[i + 1] - y[i]) * ((ib - x1) / (x2 - x1));
      
      area += (ib - ia) * (y1 + y2) / 2;
    }
  }

  return area;
}

/**
 * Calculate numerical derivative dy/dx
 */
export function derivative(
  x: number[] | Float32Array,
  y: number[] | Float32Array
): Float32Array {
  const n = x.length;
  if (n < 2) return new Float32Array(0);

  const result = new Float32Array(n);
  for (let i = 0; i < n - 1; i++) {
    const dx = x[i + 1] - x[i];
    result[i] = dx !== 0 ? (y[i + 1] - y[i]) / dx : 0;
  }
  // Last point same as previous for length matching
  result[n - 1] = result[n - 2];
  return result;
}

/**
 * Calculate cumulative integral (area array)
 */
export function cumulativeIntegral(
  x: number[] | Float32Array,
  y: number[] | Float32Array
): Float32Array {
  const n = x.length;
  if (n < 1) return new Float32Array(0);

  const result = new Float32Array(n);
  result[0] = 0;
  
  for (let i = 0; i < n - 1; i++) {
    const dx = x[i + 1] - x[i];
    const area = dx * (y[i] + y[i + 1]) / 2;
    result[i + 1] = result[i] + area;
  }
  
  return result;
}
