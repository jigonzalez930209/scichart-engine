export function parseColor(color: string): [number, number, number, number] {
  if (!color) return [1, 0, 1, 1];
  
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16) / 255;
      const g = parseInt(hex[1] + hex[1], 16) / 255;
      const b = parseInt(hex[2] + hex[2], 16) / 255;
      return [r, g, b, 1];
    } else if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return [r, g, b, 1];
    } else if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return [r, g, b, a];
    }
  }

  if (color.startsWith("rgb")) {
    const matches = color.match(/[\d.]+/g);
    if (matches && matches.length >= 3) {
      const r = parseFloat(matches[0]) / 255;
      const g = parseFloat(matches[1]) / 255;
      const b = parseFloat(matches[2]) / 255;
      const a = matches.length >= 4 ? parseFloat(matches[3]) : 1;
      return [r, g, b, a];
    }
  }

  return [1, 0, 1, 1];
}

export function interleaveData(
  x: Float32Array | Float64Array | number[],
  y: Float32Array | Float64Array | number[]
): Float32Array {
  const length = Math.min(x.length, y.length);
  const result = new Float32Array(length * 2);

  for (let i = 0; i < length; i++) {
    result[i * 2] = x[i];
    result[i * 2 + 1] = y[i];
  }

  return result;
}

export function interleaveStepData(
  x: Float32Array | Float64Array | number[],
  y: Float32Array | Float64Array | number[],
  mode: "before" | "after" | "center" = "after"
): Float32Array {
  const length = Math.min(x.length, y.length);
  if (length < 2) {
    return interleaveData(x, y);
  }

  const stepCount = mode === "center" ? 1 + (length - 1) * 3 : length * 2 - 1;
  const result = new Float32Array(stepCount * 2);

  let resultIdx = 0;

  for (let i = 0; i < length; i++) {
    if (i === 0) {
      result[resultIdx++] = x[0];
      result[resultIdx++] = y[0];
    } else {
      const prevX = x[i - 1];
      const prevY = y[i - 1];
      const currX = x[i];
      const currY = y[i];

      if (mode === "after") {
        result[resultIdx++] = currX;
        result[resultIdx++] = prevY;
        result[resultIdx++] = currX;
        result[resultIdx++] = currY;
      } else if (mode === "before") {
        result[resultIdx++] = prevX;
        result[resultIdx++] = currY;
        result[resultIdx++] = currX;
        result[resultIdx++] = currY;
      } else {
        const midX = (prevX + currX) / 2;
        result[resultIdx++] = midX;
        result[resultIdx++] = prevY;
        result[resultIdx++] = midX;
        result[resultIdx++] = currY;
        result[resultIdx++] = currX;
        result[resultIdx++] = currY;
      }
    }
  }

  return result.subarray(0, resultIdx);
}

export function interleaveBandData(
  x: Float32Array | Float64Array | number[],
  y1: Float32Array | Float64Array | number[],
  y2: Float32Array | Float64Array | number[]
): Float32Array {
  const n = Math.min(x.length, y1.length, y2.length);
  const result = new Float32Array(n * 2 * 2);

  for (let i = 0; i < n; i++) {
    const idx = i * 4;
    const xi = x[i];
    result[idx + 0] = xi;
    result[idx + 1] = y1[i];
    result[idx + 2] = xi;
    result[idx + 3] = y2[i];
  }
  return result;
}
