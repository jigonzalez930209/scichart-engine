/**
 * Electrochemistry-specific utilities
 *
 * Unit formatting, cycle detection, and domain-specific helpers.
 */

// ============================================
// Unit Prefixes
// ============================================

type SIPrefix = 'p' | 'n' | 'µ' | 'm' | '' | 'k' | 'M' | 'G';

interface PrefixInfo {
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
 * Format potential value (default: mV)
 */
export function formatPotential(volts: number, decimals = 3): string {
  // Electrochemistry typically uses mV for small potentials
  if (Math.abs(volts) < 1) {
    return `${(volts * 1000).toFixed(decimals)} mV`;
  }
  return `${volts.toFixed(decimals)} V`;
}

/**
 * Format current value (auto-prefix)
 */
export function formatCurrent(amps: number, decimals = 2): string {
  return formatWithPrefix(amps, 'A', decimals);
}

// ============================================
// Cycle Detection (CV)
// ============================================

interface CycleInfo {
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
 * Detect cycles in cyclic voltammetry data
 *
 * A cycle is complete when the potential returns to its starting value
 * after going through both sweep directions.
 */
export function detectCycles(
  potential: Float32Array | Float64Array,
  tolerance = 0.001
): CycleInfo[] {
  if (potential.length < 3) return [];

  const cycles: CycleInfo[] = [];
  let cycleStart = 0;
  let cycleNumber = 1;

  // Determine initial direction
  let prevDirection = Math.sign(potential[1] - potential[0]);
  let directionChanges = 0;

  for (let i = 2; i < potential.length; i++) {
    const direction = Math.sign(potential[i] - potential[i - 1]);

    // Skip if no movement
    if (direction === 0) continue;

    // Direction change detected
    if (direction !== prevDirection) {
      directionChanges++;

      // After 2 direction changes, check if we're back at start
      if (directionChanges >= 2) {
        const startPotential = potential[cycleStart];
        const currentPotential = potential[i];

        if (Math.abs(currentPotential - startPotential) < tolerance) {
          cycles.push({
            number: cycleNumber,
            startIndex: cycleStart,
            endIndex: i,
            direction: potential[cycleStart + 1] > potential[cycleStart] ? 1 : -1,
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
  if (cycleStart < potential.length - 1) {
    cycles.push({
      number: cycleNumber,
      startIndex: cycleStart,
      endIndex: potential.length - 1,
      direction: potential[cycleStart + 1] > potential[cycleStart] ? 1 : -1,
    });
  }

  return cycles;
}

/**
 * Generate colors for cycles
 */
export function generateCycleColors(cycleCount: number): string[] {
  const colors: string[] = [];
  const hueStep = 360 / Math.max(cycleCount, 1);

  for (let i = 0; i < cycleCount; i++) {
    const hue = (i * hueStep) % 360;
    colors.push(`hsl(${hue}, 70%, 55%)`);
  }

  return colors;
}

// ============================================
// Peak Detection (basic)
// ============================================

interface Peak {
  /** Index in data array */
  index: number;
  /** X value at peak */
  x: number;
  /** Y value at peak */
  y: number;
  /** Peak type */
  type: 'max' | 'min';
}

/**
 * Simple peak detection based on local extrema
 */
export function detectPeaks(
  x: Float32Array | Float64Array,
  y: Float32Array | Float64Array,
  options: {
    /** Minimum prominence to be considered a peak */
    minProminence?: number;
    /** Only return 'max' or 'min' peaks */
    type?: 'max' | 'min' | 'both';
  } = {}
): Peak[] {
  const { minProminence = 0, type = 'both' } = options;
  const peaks: Peak[] = [];

  for (let i = 1; i < y.length - 1; i++) {
    const prev = y[i - 1];
    const curr = y[i];
    const next = y[i + 1];

    // Local maximum
    if (curr > prev && curr > next) {
      const prominence = Math.min(curr - prev, curr - next);
      if (prominence >= minProminence && (type === 'both' || type === 'max')) {
        peaks.push({ index: i, x: x[i], y: curr, type: 'max' });
      }
    }

    // Local minimum
    if (curr < prev && curr < next) {
      const prominence = Math.min(prev - curr, next - curr);
      if (prominence >= minProminence && (type === 'both' || type === 'min')) {
        peaks.push({ index: i, x: x[i], y: curr, type: 'min' });
      }
    }
  }

  return peaks;
}

// ============================================
// Data Validation
// ============================================

/**
 * Check if TypedArray contains valid finite numbers
 */
export function validateData(
  data: Float32Array | Float64Array
): { valid: boolean; invalidCount: number; firstInvalidIndex: number } {
  let invalidCount = 0;
  let firstInvalidIndex = -1;

  for (let i = 0; i < data.length; i++) {
    if (!isFinite(data[i])) {
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
