/**
 * Series - Represents a single data series in the chart
 */
import type {
  SeriesOptions,
  SeriesData,
  SeriesStyle,
  SeriesUpdateData,
  Bounds,
  SeriesType,
  HeatmapOptions,
  HeatmapData,
  HeatmapStyle,
} from "../../types";
import { calculateSeriesBounds } from "./SeriesBounds";
import { 
  ensureTypedArray, 
  appendTypedArray, 
  applySmoothing,
  getYError,
  getXError
} from "./SeriesDataUtils";

const DEFAULT_STYLE: SeriesStyle = {
  color: "#ff0055",
  width: 1.5,
  opacity: 1,
  pointSize: 4,
};

export class Series {
  private id: string;
  private type: SeriesType;
  private yAxisId?: string;
  private data: SeriesData;
  private style: SeriesStyle;
  private visible: boolean;
  private name?: string;
  private stackId?: string;
  private cycle?: number;
  private maxPoints?: number;

  public bullishCount = 0;
  public bearishCount = 0;

  private heatmapData?: HeatmapData;
  private heatmapStyle?: HeatmapStyle;

  private lastAppendCount = 0;
  private cachedBounds: Bounds | null = null;
  private boundsNeedsUpdate = true;
  private _needsBufferUpdate = true;
  private smoothedData: SeriesData | null = null;
  private smoothingNeedsUpdate = true;

  constructor(options: SeriesOptions | HeatmapOptions) {
    this.id = options.id;
    this.name = options.name;
    this.type = options.type;
    this.yAxisId = options.yAxisId;
    this.visible = options.visible ?? true;
    this.stackId = (options as SeriesOptions).stackId;
    this.cycle = (options as any).cycle;
    this.maxPoints = (options as any).maxPoints;

    if (this.type === "heatmap") {
      const hOpts = options as HeatmapOptions;
      this.data = { x: new Float32Array(0), y: new Float32Array(0) };
      this.heatmapData = {
        xValues: ensureTypedArray(hOpts.data.xValues),
        yValues: ensureTypedArray(hOpts.data.yValues),
        zValues: ensureTypedArray(hOpts.data.zValues),
      };
      this.heatmapStyle = hOpts.style;
    } else {
      const d = (options as SeriesOptions).data;
      this.data = {
        x: ensureTypedArray(d?.x),
        y: ensureTypedArray(d?.y),
        yError: d?.yError ? ensureTypedArray(d.yError) : undefined,
        yErrorPlus: d?.yErrorPlus ? ensureTypedArray(d.yErrorPlus) : undefined,
        yErrorMinus: d?.yErrorMinus ? ensureTypedArray(d.yErrorMinus) : undefined,
        xError: d?.xError ? ensureTypedArray(d.xError) : undefined,
        xErrorPlus: d?.xErrorPlus ? ensureTypedArray(d.xErrorPlus) : undefined,
        xErrorMinus: d?.xErrorMinus ? ensureTypedArray(d.xErrorMinus) : undefined,
        y2: d?.y2 ? ensureTypedArray(d.y2) : undefined,
        open: d?.open ? ensureTypedArray(d.open) : undefined,
        high: d?.high ? ensureTypedArray(d.high) : undefined,
        low: d?.low ? ensureTypedArray(d.low) : undefined,
        close: d?.close ? ensureTypedArray(d.close) : undefined,
      };
    }
    this.style = { ...DEFAULT_STYLE, ...options.style };
    // Legacy support for top-level style props
    if ((options as any).color) this.style.color = (options as any).color;
    if ((options as any).width) this.style.width = (options as any).width;
    if ((options as any).pointSize) this.style.pointSize = (options as any).pointSize;
  }

  getId = () => this.id;
  getName = () => this.name || this.id;
  getType = () => this.type;
  getYAxisId = () => this.yAxisId;
  getStackId = () => this.stackId;
  getVisible = () => this.visible;
  isVisible = () => this.visible;
  getStyle = () => this.style;
  getHeatmapData = () => this.heatmapData;
  getHeatmapStyle = () => this.heatmapStyle;
  getCycle = () => this.cycle;
  getPointCount = () => this.type === "heatmap" ? this.heatmapData!.xValues.length * this.heatmapData!.yValues.length : this.data.x.length;
  getLastAppendCount = () => this.lastAppendCount;
  resetLastAppendCount = () => { this.lastAppendCount = 0; };
  hasErrorData = () => !!(this.data.yError || this.data.yErrorPlus || this.data.yErrorMinus || this.data.xError || this.data.xErrorPlus || this.data.xErrorMinus);
  getYError = (i: number) => getYError(this.data, i);
  getXError = (i: number) => getXError(this.data, i);

  getData(): SeriesData {
    if (this.style.smoothing && this.style.smoothing > 0) {
      if (this.smoothingNeedsUpdate || !this.smoothedData) {
        this.smoothedData = applySmoothing(this.data, 5);
        this.smoothingNeedsUpdate = false;
      }
      return this.smoothedData;
    }
    return this.data;
  }

  getBounds(): Bounds | null {
    if (this.data.x.length === 0 && this.type !== "heatmap") return null;
    if (this.boundsNeedsUpdate || !this.cachedBounds) {
      this.cachedBounds = calculateSeriesBounds(this.type, this.data, this.heatmapData);
      this.boundsNeedsUpdate = false;
    }
    return this.cachedBounds;
  }

  updateData(update: SeriesUpdateData): void {
    if (!update) return;
    if (update.append) {
      const newX = ensureTypedArray(update.x);
      const newY = ensureTypedArray(update.y);
      if (newX.length > 0) {
        this.data.x = appendTypedArray(this.data.x, newX);
        this.data.y = appendTypedArray(this.data.y, newY);
        if (update.y2) this.data.y2 = this.data.y2 ? appendTypedArray(this.data.y2, ensureTypedArray(update.y2)) : ensureTypedArray(update.y2);
        if (update.open) this.data.open = this.data.open ? appendTypedArray(this.data.open, ensureTypedArray(update.open)) : ensureTypedArray(update.open);
        if (update.high) this.data.high = this.data.high ? appendTypedArray(this.data.high, ensureTypedArray(update.high)) : ensureTypedArray(update.high);
        if (update.low) this.data.low = this.data.low ? appendTypedArray(this.data.low, ensureTypedArray(update.low)) : ensureTypedArray(update.low);
        if (update.close) this.data.close = this.data.close ? appendTypedArray(this.data.close, ensureTypedArray(update.close)) : ensureTypedArray(update.close);
        
        this.lastAppendCount += newX.length;
        if (this.maxPoints && this.data.x.length > this.maxPoints) {
          const shift = this.data.x.length - this.maxPoints;
          this.data.x = this.data.x.slice(shift);
          this.data.y = this.data.y.slice(shift);
          if (this.data.y2) this.data.y2 = this.data.y2.slice(shift);
          if (this.data.open) this.data.open = this.data.open.slice(shift);
          if (this.data.high) this.data.high = this.data.high.slice(shift);
          if (this.data.low) this.data.low = this.data.low.slice(shift);
          if (this.data.close) this.data.close = this.data.close.slice(shift);
          this.lastAppendCount = 0;
        }
      }
    } else {
      if (update.x) this.data.x = ensureTypedArray(update.x);
      if (update.y) this.data.y = ensureTypedArray(update.y);
      if (update.y2) this.data.y2 = ensureTypedArray(update.y2);
      if (update.open) this.data.open = ensureTypedArray(update.open);
      if (update.high) this.data.high = ensureTypedArray(update.high);
      if (update.low) this.data.low = ensureTypedArray(update.low);
      if (update.close) this.data.close = ensureTypedArray(update.close);
      this.lastAppendCount = 0;
    }
    this.boundsNeedsUpdate = true;
    this.smoothingNeedsUpdate = true;
    this._needsBufferUpdate = true;
  }

  setStyle(style: Partial<SeriesStyle>): void {
    const oldSmooth = this.style.smoothing;
    this.style = { ...this.style, ...style };
    if (this.style.smoothing !== oldSmooth) {
      this.smoothingNeedsUpdate = true;
      this._needsBufferUpdate = true;
    }
  }

  setType(type: SeriesType): void {
    this.type = type;
    this._needsBufferUpdate = true;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  get needsBufferUpdate() { return this._needsBufferUpdate; }
  set needsBufferUpdate(val: boolean) { this._needsBufferUpdate = val; }

  setMaxPoints(maxPoints: number | undefined): void {
    this.maxPoints = maxPoints;
    if (this.maxPoints && this.data.x.length > this.maxPoints) {
      const shift = this.data.x.length - this.maxPoints;
      this.data.x = this.data.x.slice(shift);
      this.data.y = this.data.y.slice(shift);
      if (this.data.y2) this.data.y2 = this.data.y2.slice(shift);
      if (this.data.open) this.data.open = this.data.open.slice(shift);
      if (this.data.high) this.data.high = this.data.high.slice(shift);
      if (this.data.low) this.data.low = this.data.low.slice(shift);
      if (this.data.close) this.data.close = this.data.close.slice(shift);
      this._needsBufferUpdate = true;
    }
  }

  destroy(): void {
    this.data = { x: new Float32Array(0), y: new Float32Array(0) };
    this.cachedBounds = null;
  }
}
