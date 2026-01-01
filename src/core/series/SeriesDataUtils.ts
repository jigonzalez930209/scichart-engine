/**
 * Series Data Utilities
 */
import type { SeriesData } from "../../types";

export function ensureTypedArray(
  data: Float32Array | Float64Array | number[] | undefined
): Float32Array | Float64Array {
  if (!data) return new Float32Array(0);
  if (data instanceof Float32Array || data instanceof Float64Array) return data;
  return new Float32Array(data);
}

export function appendTypedArray(
  existing: Float32Array | Float64Array,
  newData: Float32Array | Float64Array
): Float32Array | Float64Array {
  const combined = new (existing.constructor as
    | Float32ArrayConstructor
    | Float64ArrayConstructor)(existing.length + newData.length);
  combined.set(existing, 0);
  combined.set(newData, existing.length);
  return combined;
}

export function applySmoothing(data: SeriesData, windowSize: number): SeriesData {
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

export function getYError(data: SeriesData, i: number): [number, number] | null {
  if (i < 0 || i >= data.x.length) return null;
  if (data.yError && i < data.yError.length) {
    const err = data.yError[i];
    return [err, err];
  }
  const minus = data.yErrorMinus?.[i] ?? 0;
  const plus = data.yErrorPlus?.[i] ?? 0;
  return (minus > 0 || plus > 0) ? [minus, plus] : null;
}

export function getXError(data: SeriesData, i: number): [number, number] | null {
  if (i < 0 || i >= data.x.length) return null;
  if (data.xError && i < data.xError.length) {
    const err = data.xError[i];
    return [err, err];
  }
  const minus = data.xErrorMinus?.[i] ?? 0;
  const plus = data.xErrorPlus?.[i] ?? 0;
  return (minus > 0 || plus > 0) ? [minus, plus] : null;
}

