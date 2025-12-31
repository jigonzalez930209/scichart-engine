/**
 * Data Analysis Utilities
 *
 * General-purpose utilities for scientific data formatting,
 * cycle detection, peak detection, and data validation.
 */

// ============================================
// Unit Prefixes
// ============================================

type SIPrefix = 'p' | 'n' | 'µ' | 'm' | '' | 'k' | 'M' | 'G';

export interface PrefixInfo {
  symbol: SIPrefix;
  factor: number;
}

const SI_PREFIXES: PrefixInfo[] = [
  { symbol: 'p', factor: 1e-12 },
  { symbol: 'n', factor: 1e-9 },
  { symbol: 'µ', factor: 1e-6 },
  { symbol: 'm', factor: 1e-3 },
  { symbol: '', factor: 1 },
  { symbol: 'k', factor: 1e3 },
  { symbol: 'M', factor: 1e6 },
  { symbol: 'G', factor: 1e9 },
];

/**
 * Find the best SI prefix for a value
 */
export function getBestPrefix(value: number): PrefixInfo {
  const absValue = Math.abs(value);

  if (absValue === 0) {
    return { symbol: '', factor: 1 };
  }

  // Find prefix where value becomes 1-999
  for (let i = SI_PREFIXES.length - 1; i >= 0; i--) {
    const prefix = SI_PREFIXES[i];
    const scaled = absValue / prefix.factor;
    if (scaled >= 1 && scaled < 1000) {
      return prefix;
    }
  }

  // Default to base unit
  return { symbol: '', factor: 1 };
}

/**
 * Format a value with automatic SI prefix
 *
 * @example
 * formatWithPrefix(0.000001, 'A') // "1.00 µA"
 * formatWithPrefix(0.5, 'V')      // "500 mV"
 * formatWithPrefix(1500, 'm')     // "1.50 km"
 */
export function formatWithPrefix(
  value: number,
  unit: string,
  decimals = 2
): string {
  const prefix = getBestPrefix(value);
  const scaled = value / prefix.factor;
  return `${scaled.toFixed(decimals)} ${prefix.symbol}${unit}`;
}

/**
 * Format a numeric value with specified decimals
 * Automatically switches to scientific notation for very large/small values
 */
export function formatValue(value: number, decimals = 3): string {
  if (Math.abs(value) < 0.001 || Math.abs(value) >= 1e6) {
    return value.toExponential(decimals);
  }
  return value.toFixed(decimals);
}

/**
 * Format value in scientific notation
 */
export function formatScientific(value: number, decimals = 2): string {
  return value.toExponential(decimals);
}

// ============================================
// Cycle Detection
// ============================================

export interface CycleInfo {
  /** Cycle number (1-indexed) */
  number: number;
  /** Start index in data array */
  startIndex: number;
  /** End index in data array */
  endIndex: number;
  /** Direction at start: 1 = forward, -1 = reverse */
  direction: 1 | -1;
}

/**
 * Detect cycles in oscillating data
 *
 * A cycle is complete when the signal returns to its starting value
 * after going through both sweep directions. Useful for:
 * - Cyclic voltammetry data
 * - Periodic signals
 * - Oscillation analysis
 *
 * @param signal - The signal data (e.g., potential, position, etc.)
 * @param tolerance - How close to starting value to consider a cycle complete
 */
export function detectCycles(
  signal: Float32Array | Float64Array | number[],
  tolerance = 0.001
): CycleInfo[] {
  const data = signal instanceof Array ? new Float32Array(signal) : signal;
  
  if (data.length < 3) return [];

  const cycles: CycleInfo[] = [];
  let cycleStart = 0;
  let cycleNumber = 1;

  // Determine initial direction
  let prevDirection = Math.sign(data[1] - data[0]);
  let directionChanges = 0;

  for (let i = 2; i < data.length; i++) {
    const direction = Math.sign(data[i] - data[i - 1]);

    // Skip if no movement
    if (direction === 0) continue;

    // Direction change detected
    if (direction !== prevDirection) {
      directionChanges++;

      // After 2 direction changes, check if we're back at start
      if (directionChanges >= 2) {
        const startValue = data[cycleStart];
        const currentValue = data[i];

        if (Math.abs(currentValue - startValue) < tolerance) {
          cycles.push({
            number: cycleNumber,
            startIndex: cycleStart,
            endIndex: i,
            direction: data[cycleStart + 1] > data[cycleStart] ? 1 : -1,
          });

          cycleNumber++;
          cycleStart = i;
          directionChanges = 0;
        }
      }

      prevDirection = direction;
    }
  }

  // Handle last incomplete cycle
  if (cycleStart < data.length - 1) {
    cycles.push({
      number: cycleNumber,
      startIndex: cycleStart,
      endIndex: data.length - 1,
      direction: data[cycleStart + 1] > data[cycleStart] ? 1 : -1,
    });
  }

  return cycles;
}

/**
 * Generate distinct colors for cycles/series
 *
 * Uses HSL color space to generate evenly distributed hues
 */
export function generateCycleColors(count: number): string[] {
  const colors: string[] = [];
  const hueStep = 360 / Math.max(count, 1);

  for (let i = 0; i < count; i++) {
    const hue = (i * hueStep) % 360;
    colors.push(`hsl(${hue}, 70%, 55%)`);
  }

  return colors;
}

// ============================================
// Peak Detection
// ============================================

export interface Peak {
  /** Index in data array */
  index: number;
  /** X value at peak */
  x: number;
  /** Y value at peak */
  y: number;
  /** Peak type */
  type: 'max' | 'min';
  /** Prominence of the peak */
  prominence: number;
}

/**
 * Detect peaks (local maxima and minima) in data
 *
 * Uses simple local extrema detection with optional prominence filtering.
 * Useful for:
 * - Signal peak detection
 * - Finding local maxima/minima
 * - Feature extraction
 *
 * @param x - X values (independent variable)
 * @param y - Y values (dependent variable)
 * @param options - Detection options
 */
export function detectPeaks(
  x: Float32Array | Float64Array | number[],
  y: Float32Array | Float64Array | number[],
  options: {
    /** Minimum prominence to be considered a peak */
    minProminence?: number;
    /** Only return 'max' or 'min' peaks */
    type?: 'max' | 'min' | 'both';
  } = {}
): Peak[] {
  const { minProminence = 0, type = 'both' } = options;
  const peaks: Peak[] = [];

  const xData = x instanceof Array ? new Float32Array(x) : x;
  const yData = y instanceof Array ? new Float32Array(y) : y;

  for (let i = 1; i < yData.length - 1; i++) {
    const prev = yData[i - 1];
    const curr = yData[i];
    const next = yData[i + 1];

    // Local maximum
    if (curr > prev && curr > next) {
      const prominence = Math.min(curr - prev, curr - next);
      if (prominence >= minProminence && (type === 'both' || type === 'max')) {
        peaks.push({ index: i, x: xData[i], y: curr, type: 'max', prominence });
      }
    }

    // Local minimum
    if (curr < prev && curr < next) {
      const prominence = Math.min(prev - curr, next - curr);
      if (prominence >= minProminence && (type === 'both' || type === 'min')) {
        peaks.push({ index: i, x: xData[i], y: curr, type: 'min', prominence });
      }
    }
  }

  return peaks;
}

// ============================================
// Data Validation
// ============================================

export interface ValidationResult {
  /** Whether all data is valid */
  valid: boolean;
  /** Number of invalid values (NaN, Infinity, etc.) */
  invalidCount: number;
  /** Index of first invalid value (-1 if all valid) */
  firstInvalidIndex: number;
}

/**
 * Validate that data contains only finite numbers
 *
 * Checks for NaN, Infinity, and -Infinity values.
 * Useful for data quality checks before rendering.
 */
export function validateData(
  data: Float32Array | Float64Array | number[]
): ValidationResult {
  let invalidCount = 0;
  let firstInvalidIndex = -1;

  const arr = data instanceof Array ? data : Array.from(data);

  for (let i = 0; i < arr.length; i++) {
    if (!isFinite(arr[i])) {
      invalidCount++;
      if (firstInvalidIndex === -1) {
        firstInvalidIndex = i;
      }
    }
  }

  return {
    valid: invalidCount === 0,
    invalidCount,
    firstInvalidIndex,
  };
}

// ============================================
// Data Statistics
// ============================================

export interface DataStats {
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  count: number;
}

/**
 * Calculate basic statistics for a dataset
 */
export function calculateStats(
  data: Float32Array | Float64Array | number[]
): DataStats {
  const arr = data instanceof Array ? data : Array.from(data);
  const count = arr.length;

  if (count === 0) {
    return { min: 0, max: 0, mean: 0, stdDev: 0, count: 0 };
  }

  let min = arr[0];
  let max = arr[0];
  let sum = 0;

  for (let i = 0; i < count; i++) {
    const val = arr[i];
    if (val < min) min = val;
    if (val > max) max = val;
    sum += val;
  }

  const mean = sum / count;

  // Calculate standard deviation
  let sumSquaredDiff = 0;
  for (let i = 0; i < count; i++) {
    const diff = arr[i] - mean;
    sumSquaredDiff += diff * diff;
  }
  const stdDev = Math.sqrt(sumSquaredDiff / count);

  return { min, max, mean, stdDev, count };
}

// ============================================
// Data Smoothing
// ============================================

/**
 * Apply moving average smoothing to data
 *
 * @param data - Input data array
 * @param windowSize - Number of points to average (must be odd)
 */
export function movingAverage(
  data: Float32Array | Float64Array | number[],
  windowSize: number
): Float32Array {
  const arr = data instanceof Array ? new Float32Array(data) : data;
  const result = new Float32Array(arr.length);
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    let count = 0;

    for (let j = Math.max(0, i - halfWindow); j <= Math.min(arr.length - 1, i + halfWindow); j++) {
      sum += arr[j];
      count++;
    }

    result[i] = sum / count;
  }

  return result;
}

/**
 * Downsample data using LTTB (Largest Triangle Three Buckets) algorithm
 *
 * Preserves visual characteristics while reducing point count.
 * Ideal for rendering large datasets efficiently.
 *
 * @param x - X values
 * @param y - Y values
 * @param targetPoints - Desired number of output points
 */
export function downsampleLTTB(
  x: Float32Array | Float64Array,
  y: Float32Array | Float64Array,
  targetPoints: number
): { x: Float32Array; y: Float32Array } {
  const dataLength = x.length;

  if (targetPoints >= dataLength || targetPoints < 3) {
    return { x: new Float32Array(x), y: new Float32Array(y) };
  }

  const sampledX = new Float32Array(targetPoints);
  const sampledY = new Float32Array(targetPoints);

  // Always include first point
  sampledX[0] = x[0];
  sampledY[0] = y[0];

  const bucketSize = (dataLength - 2) / (targetPoints - 2);

  let a = 0; // Previous selected point index
  let sampledIndex = 1;

  for (let i = 0; i < targetPoints - 2; i++) {
    // Calculate bucket range
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const bucketEnd = Math.floor((i + 2) * bucketSize) + 1;
    const nextBucketEnd = Math.min(Math.floor((i + 3) * bucketSize) + 1, dataLength);

    // Calculate average of next bucket for comparison
    let avgX = 0;
    let avgY = 0;
    let avgCount = 0;

    for (let j = bucketEnd; j < nextBucketEnd; j++) {
      avgX += x[j];
      avgY += y[j];
      avgCount++;
    }

    if (avgCount > 0) {
      avgX /= avgCount;
      avgY /= avgCount;
    }

    // Find point in current bucket with largest triangle area
    let maxArea = -1;
    let maxAreaIndex = bucketStart;

    for (let j = bucketStart; j < bucketEnd && j < dataLength; j++) {
      // Triangle area calculation
      const area = Math.abs(
        (x[a] - avgX) * (y[j] - y[a]) - (x[a] - x[j]) * (avgY - y[a])
      );

      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }

    sampledX[sampledIndex] = x[maxAreaIndex];
    sampledY[sampledIndex] = y[maxAreaIndex];
    sampledIndex++;
    a = maxAreaIndex;
  }

  // Always include last point
  sampledX[targetPoints - 1] = x[dataLength - 1];
  sampledY[targetPoints - 1] = y[dataLength - 1];

  return { x: sampledX, y: sampledY };
}

/**
 * Subtract a linear baseline from data
 * 
 * @param x - X data
 * @param y - Y data
 * @param x1 - Start of baseline segment
 * @param x2 - End of baseline segment
 */
export function subtractBaseline(
  x: Float32Array | number[],
  y: Float32Array | number[],
  x1: number,
  x2: number
): Float32Array {
  const n = x.length;
  const result = new Float32Array(n);

  // Find points near x1 and x2 to determine baseline
  let i1 = 0, i2 = n - 1;
  let minDist1 = Infinity, minDist2 = Infinity;

  for (let i = 0; i < n; i++) {
    const d1 = Math.abs(x[i] - x1);
    const d2 = Math.abs(x[i] - x2);
    if (d1 < minDist1) { minDist1 = d1; i1 = i; }
    if (d2 < minDist2) { minDist2 = d2; i2 = i; }
  }

  const y1 = y[i1];
  const y2 = y[i2];
  const slope = (y2 - y1) / (x[i2] - x[i1]);
  const intercept = y1 - slope * x[i1];

  for (let i = 0; i < n; i++) {
    result[i] = y[i] - (slope * x[i] + intercept);
  }

  return result;
}
