/**
 * Scale interface and implementations
 *
 * Scales transform data values to pixel coordinates and vice versa.
 */

export interface Scale {
  /** Data domain [min, max] */
  domain: [number, number];
  /** Pixel range [min, max] */
  range: [number, number];
  /** Scale type identifier */
  type: 'linear' | 'log';

  /** Set the domain */
  setDomain(min: number, max: number): void;
  /** Set the range */
  setRange(min: number, max: number): void;

  /** Transform data value to pixel */
  transform(value: number): number;
  /** Transform pixel to data value */
  invert(pixel: number): number;

  /** Generate nice tick values */
  ticks(count?: number): number[];
}

/**
 * Linear scale - proportional mapping
 */
export class LinearScale implements Scale {
  public domain: [number, number] = [0, 1];
  public range: [number, number] = [0, 100];
  public readonly type = 'linear' as const;

  setDomain(min: number, max: number): void {
    this.domain = [min, max];
  }

  setRange(min: number, max: number): void {
    this.range = [min, max];
  }

  transform(value: number): number {
    const [d0, d1] = this.domain;
    const [r0, r1] = this.range;
    const normalized = (value - d0) / (d1 - d0);
    return r0 + normalized * (r1 - r0);
  }

  invert(pixel: number): number {
    const [d0, d1] = this.domain;
    const [r0, r1] = this.range;
    const normalized = (pixel - r0) / (r1 - r0);
    return d0 + normalized * (d1 - d0);
  }

  ticks(count = 10): number[] {
    const [min, max] = this.domain;
    const step = niceStep(min, max, count);
    const start = Math.ceil(min / step) * step;
    const ticks: number[] = [];

    for (let t = start; t <= max + step * 0.5; t += step) {
      ticks.push(Math.round(t * 1e12) / 1e12); // Fix floating point
    }

    return ticks;
  }
}

/**
 * Logarithmic scale - for exponential data
 */
export class LogScale implements Scale {
  public domain: [number, number] = [1, 1000];
  public range: [number, number] = [0, 100];
  public readonly type = 'log' as const;

  private base = 10;

  setDomain(min: number, max: number): void {
    // Log scale requires positive values
    this.domain = [Math.max(min, 1e-12), Math.max(max, 1e-12)];
  }

  setRange(min: number, max: number): void {
    this.range = [min, max];
  }

  transform(value: number): number {
    const [d0, d1] = this.domain;
    const [r0, r1] = this.range;

    if (value <= 0) return r0; // Handle invalid values

    const logMin = Math.log(d0) / Math.log(this.base);
    const logMax = Math.log(d1) / Math.log(this.base);
    const logVal = Math.log(value) / Math.log(this.base);

    const normalized = (logVal - logMin) / (logMax - logMin);
    return r0 + normalized * (r1 - r0);
  }

  invert(pixel: number): number {
    const [d0, d1] = this.domain;
    const [r0, r1] = this.range;

    const logMin = Math.log(d0) / Math.log(this.base);
    const logMax = Math.log(d1) / Math.log(this.base);

    const normalized = (pixel - r0) / (r1 - r0);
    const logVal = logMin + normalized * (logMax - logMin);

    return Math.pow(this.base, logVal);
  }

  ticks(count = 10): number[] {
    const [min, max] = this.domain;
    const logMin = Math.floor(Math.log10(min));
    const logMax = Math.ceil(Math.log10(max));
    const ticks: number[] = [];

    for (let p = logMin; p <= logMax && ticks.length < count; p++) {
      const value = Math.pow(10, p);
      if (value >= min && value <= max) {
        ticks.push(value);
      }
    }

    return ticks;
  }
}

// ============================================
// Helpers
// ============================================

/**
 * Calculate a "nice" step size for tick marks
 */
function niceStep(min: number, max: number, count: number): number {
  const range = max - min;
  const rawStep = range / count;

  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let niceNormalized: number;
  if (normalized < 1.5) {
    niceNormalized = 1;
  } else if (normalized < 3) {
    niceNormalized = 2;
  } else if (normalized < 7) {
    niceNormalized = 5;
  } else {
    niceNormalized = 10;
  }

  return niceNormalized * magnitude;
}

/**
 * Factory function to create scale by type
 */
export function createScale(type: 'linear' | 'log'): Scale {
  return type === 'log' ? new LogScale() : new LinearScale();
}
