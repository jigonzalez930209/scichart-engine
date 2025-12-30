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
} from '../types';

const DEFAULT_STYLE: SeriesStyle = {
  color: '#ff0055',
  width: 1.5,
  opacity: 1,
  pointSize: 4,
};

export class Series {
  private id: string;
  private type: SeriesType;
  private data: SeriesData;
  private style: SeriesStyle;
  private visible: boolean;
  private cycle?: number;

  // Cached bounds for performance
  private cachedBounds: Bounds | null = null;
  private boundsNeedsUpdate = true;

  // Track if GPU buffer needs update
  private _needsBufferUpdate = true;

  // Smoothed data cache
  private smoothedData: SeriesData | null = null;
  private smoothingNeedsUpdate = true;


  constructor(options: SeriesOptions) {
    this.id = options.id;
    this.type = options.type;
    this.data = { ...options.data };
    this.style = { ...DEFAULT_STYLE, ...options.style };
    this.visible = options.visible ?? true;
    this.cycle = options.cycle;

    // Validate data
    if (this.data.x.length !== this.data.y.length) {
      console.warn(
        `[Series "${this.id}"] X and Y arrays have different lengths:`,
        this.data.x.length,
        'vs',
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

    return { xMin, xMax, yMin, yMax };
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
    if (update.append) {
      // Append mode: create new arrays with combined data
      if (update.x && update.y) {
        this.data = {
          x: this.appendArray(this.data.x, update.x),
          y: this.appendArray(this.data.y, update.y),
        };
      } else if (update.y) {
        // Only Y update (same X points)
        console.warn('[Series] Append with only Y is not efficient');
        this.data.y = this.appendArray(this.data.y, update.y);
      }
    } else {
      // Replace mode
      if (update.x) this.data.x = update.x;
      if (update.y) this.data.y = update.y;
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
    const combined = new (existing.constructor as Float32ArrayConstructor | Float64ArrayConstructor)(
      existing.length + newData.length
    );
    combined.set(existing, 0);
    combined.set(newData, existing.length);
    return combined;
  }

  /**
   * Replace all data at once
   */
  setData(x: Float32Array | Float64Array, y: Float32Array | Float64Array): void {
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

  get needsBufferUpdate(): boolean { return this._needsBufferUpdate; }
  set needsBufferUpdate(val: boolean) { this._needsBufferUpdate = val; }

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
