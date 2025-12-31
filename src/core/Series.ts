/**
 * Series - Represents a single data series in the chart
 *
 * Manages data arrays, styling, and GPU buffer lifecycle.
 */

import type {
  SeriesOptions,
  SeriesData,
  SeriesStyle,
  SeriesUpdateData,
  Bounds,
  SeriesType,
} from "../types";

const DEFAULT_STYLE: SeriesStyle = {
  color: "#ff0055",
  width: 1.5,
  opacity: 1,
  pointSize: 4,
};

function ensureTypedArray(
  data: Float32Array | Float64Array | number[] | undefined
): Float32Array | Float64Array {
  if (!data) return new Float32Array(0);
  if (data instanceof Float32Array || data instanceof Float64Array) return data;
  return new Float32Array(data);
}

export class Series {
  private id: string;
  private type: SeriesType;
  private yAxisId?: string;
  private data: SeriesData;
  private style: SeriesStyle;
  private visible: boolean;
  private cycle?: number;
  private maxPoints?: number;

  // Track appends for optimized GPU updates
  private lastAppendCount = 0;

  // Cached bounds for performance
  private cachedBounds: Bounds | null = null;
  private boundsNeedsUpdate = true;

  // Track if GPU buffer needs update
  private _needsBufferUpdate = true;

  // Smoothed data cache
  private smoothedData: SeriesData | null = null;
  private smoothingNeedsUpdate = true;

  constructor(options: SeriesOptions) {
    if (!options) throw new Error("[Series] Options are required");
    this.id = options.id;
    this.type = options.type;
    this.yAxisId = options.yAxisId;

    this.data = {
      x: ensureTypedArray(options.data?.x),
      y: ensureTypedArray(options.data?.y),
      // Error bar data
      yError: options.data?.yError ? ensureTypedArray(options.data.yError) : undefined,
      yErrorPlus: options.data?.yErrorPlus ? ensureTypedArray(options.data.yErrorPlus) : undefined,
      yErrorMinus: options.data?.yErrorMinus ? ensureTypedArray(options.data.yErrorMinus) : undefined,
      xError: options.data?.xError ? ensureTypedArray(options.data.xError) : undefined,
      xErrorPlus: options.data?.xErrorPlus ? ensureTypedArray(options.data.xErrorPlus) : undefined,
      xErrorMinus: options.data?.xErrorMinus ? ensureTypedArray(options.data.xErrorMinus) : undefined,
    };

    // Support both style object and top-level style properties for convenience
    this.style = {
      ...DEFAULT_STYLE,
      ...options.style,
    };

    // Fallback for top-level style properties often used in examples
    if ((options as any).color) this.style.color = (options as any).color;
    if ((options as any).width) this.style.width = (options as any).width;
    if ((options as any).pointSize)
      this.style.pointSize = (options as any).pointSize;
    if ((options as any).symbol)
      this.style.symbol = (options as any).symbol;

    this.visible = options.visible ?? true;
    this.cycle = options.cycle;
    this.maxPoints = options.maxPoints;

    // Validate data
    if (this.data.x.length !== this.data.y.length) {
      console.warn(
        `[Series "${this.id}"] X and Y arrays have different lengths:`,
        this.data.x.length,
        "vs",
        this.data.y.length
      );
    }
  }

  // ----------------------------------------
  // Getters
  // ----------------------------------------

  getId(): string {
    return this.id;
  }

  getType(): SeriesType {
    return this.type;
  }

  getYAxisId(): string | undefined {
    return this.yAxisId;
  }

  getData(): SeriesData {
    if (this.style.smoothing && this.style.smoothing > 0) {
      return this.getSmoothedData();
    }
    return this.data;
  }

  private getSmoothedData(): SeriesData {
    if (this.smoothingNeedsUpdate || !this.smoothedData) {
      this.smoothedData = this.applySmoothing(this.data, 5); // Window size 5
      this.smoothingNeedsUpdate = false;
    }
    return this.smoothedData;
  }

  private applySmoothing(data: SeriesData, windowSize: number): SeriesData {
    const { x, y } = data;
    const len = x.length;
    if (len < windowSize) return { ...data };

    const smoothedY = new Float32Array(len);
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < len; i++) {
      let sum = 0;
      let count = 0;
      for (let j = i - halfWindow; j <= i + halfWindow; j++) {
        if (j >= 0 && j < len) {
          sum += y[j];
          count++;
        }
      }
      smoothedY[i] = sum / count;
    }

    return { x, y: smoothedY };
  }

  getStyle(): SeriesStyle {
    return this.style;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getCycle(): number | undefined {
    return this.cycle;
  }

  getPointCount(): number {
    return this.data.x.length;
  }

  getLastAppendCount(): number {
    return this.lastAppendCount;
  }

  resetLastAppendCount(): void {
    this.lastAppendCount = 0;
  }

  /**
   * Check if series has error bar data
   */
  hasErrorData(): boolean {
    return !!(
      this.data.yError ||
      this.data.yErrorPlus ||
      this.data.yErrorMinus ||
      this.data.xError ||
      this.data.xErrorPlus ||
      this.data.xErrorMinus
    );
  }

  /**
   * Get Y error values for a data point
   * Returns [errorMinus, errorPlus] for the point at index i
   */
  getYError(i: number): [number, number] | null {
    if (i < 0 || i >= this.data.x.length) return null;
    
    // Symmetric error
    if (this.data.yError && i < this.data.yError.length) {
      const err = this.data.yError[i];
      return [err, err];
    }
    
    // Asymmetric error
    const minus = this.data.yErrorMinus?.[i] ?? 0;
    const plus = this.data.yErrorPlus?.[i] ?? 0;
    if (minus > 0 || plus > 0) {
      return [minus, plus];
    }
    
    return null;
  }

  /**
   * Get X error values for a data point
   * Returns [errorMinus, errorPlus] for the point at index i
   */
  getXError(i: number): [number, number] | null {
    if (i < 0 || i >= this.data.x.length) return null;
    
    // Symmetric error
    if (this.data.xError && i < this.data.xError.length) {
      const err = this.data.xError[i];
      return [err, err];
    }
    
    // Asymmetric error
    const minus = this.data.xErrorMinus?.[i] ?? 0;
    const plus = this.data.xErrorPlus?.[i] ?? 0;
    if (minus > 0 || plus > 0) {
      return [minus, plus];
    }
    
    return null;
  }

  // ----------------------------------------
  // Bounds Calculation
  // ----------------------------------------

  getBounds(): Bounds | null {
    if (this.data.x.length === 0) {
      return null;
    }

    if (this.boundsNeedsUpdate || this.cachedBounds === null) {
      this.cachedBounds = this.calculateBounds();
      this.boundsNeedsUpdate = false;
    }

    return this.cachedBounds;
  }

  private calculateBounds(): Bounds {
    const { x, y } = this.data;

    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    // Single pass through data
    for (let i = 0; i < x.length; i++) {
      const xVal = x[i];
      const yVal = y[i];

      // Skip NaN/Infinity
      if (!isFinite(xVal) || !isFinite(yVal)) continue;

      if (xVal < xMin) xMin = xVal;
      if (xVal > xMax) xMax = xVal;
      if (yVal < yMin) yMin = yVal;
      if (yVal > yMax) yMax = yVal;
    }

    const bounds = { xMin, xMax, yMin, yMax };
    return bounds;
  }

  // ----------------------------------------
  // Data Updates
  // ----------------------------------------

  /**
   * Update series data
   *
   * For streaming data, use append=true to avoid recreating buffers.
   */
  updateData(update: SeriesUpdateData): void {
    if (!update) return;

    if (update.append) {
      const newX = ensureTypedArray(update.x);
      const newY = ensureTypedArray(update.y);

      if (newX.length > 0 && newY.length > 0) {
        this.data = {
          x: this.appendArray(this.data.x, newX),
          y: this.appendArray(this.data.y, newY),
        };
        this.lastAppendCount += newX.length;

        // Handle rolling window
        if (this.maxPoints && this.data.x.length > this.maxPoints) {
           const overflow = this.data.x.length - this.maxPoints;
           this.data.x = this.data.x.slice(overflow);
           this.data.y = this.data.y.slice(overflow);
           this.lastAppendCount = 0; // Force full update since we shifted
        }
      }
    } else {
      // Replace mode
      if (update.x) this.data.x = ensureTypedArray(update.x);
      if (update.y) this.data.y = ensureTypedArray(update.y);
      this.lastAppendCount = 0;
    }

    // Invalidate bounds cache
    this.boundsNeedsUpdate = true;
    this.smoothingNeedsUpdate = true;
    this._needsBufferUpdate = true;
  }

  private appendArray(
    existing: Float32Array | Float64Array,
    newData: Float32Array | Float64Array
  ): Float32Array | Float64Array {
    // Create new array with combined length
    const combined = new (existing.constructor as
      | Float32ArrayConstructor
      | Float64ArrayConstructor)(existing.length + newData.length);
    combined.set(existing, 0);
    combined.set(newData, existing.length);
    return combined;
  }

  /**
   * Replace all data at once
   */
  setData(
    x: Float32Array | Float64Array,
    y: Float32Array | Float64Array
  ): void {
    this.data = { x, y };
    this.boundsNeedsUpdate = true;
    this.smoothingNeedsUpdate = true;
    this._needsBufferUpdate = true;
  }

  // ----------------------------------------
  // Style Updates
  // ----------------------------------------

  setStyle(style: Partial<SeriesStyle>): void {
    const oldSmoothing = this.style.smoothing;
    this.style = { ...this.style, ...style };
    if (this.style.smoothing !== oldSmoothing) {
      this.smoothingNeedsUpdate = true;
      this._needsBufferUpdate = true;
    }
  }

  get needsBufferUpdate(): boolean {
    return this._needsBufferUpdate;
  }
  set needsBufferUpdate(val: boolean) {
    this._needsBufferUpdate = val;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  setType(type: SeriesType): void {
    this.type = type;
  }

  // ----------------------------------------
  // Cleanup
  // ----------------------------------------

  destroy(): void {
    // Clear data references
    this.data = {
      x: new Float32Array(0),
      y: new Float32Array(0),
    };
    this.cachedBounds = null;
  }
}
