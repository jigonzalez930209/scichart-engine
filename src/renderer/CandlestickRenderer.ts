/**
 * Candlestick Renderer Utilities
 */

/**
 * Interleave data for candlestick rendering
 * Each candle is represented by a body (box) and a wick (line/thin box)
 * Returns a Float32Array of interleaved [x, y] coordinates for TRIANGLES
 */
export function interleaveCandlestickData(
  x: Float32Array | Float64Array,
  open: Float32Array | Float64Array,
  high: Float32Array | Float64Array,
  low: Float32Array | Float64Array,
  close: Float32Array | Float64Array,
  width: number
): { bullish: Float32Array; bearish: Float32Array } {
  const n = x.length;
  const bullishBody: number[] = [];
  const bearishBody: number[] = [];
  
  const halfWidth = width / 2;
  const wickWidth = width / 10;
  const halfWick = wickWidth / 2;

  for (let i = 0; i < n; i++) {
    const isBullish = close[i] >= open[i];
    const target = isBullish ? bullishBody : bearishBody;
    
    const bodyTop = Math.max(open[i], close[i]);
    const bodyBottom = Math.min(open[i], close[i]);
    
    // Body (Rectangle as 2 triangles)
    appendRect(target, x[i] - halfWidth, bodyBottom, x[i] + halfWidth, bodyTop);
    
    // Wick (Rectangle as 2 triangles, thin)
    appendRect(target, x[i] - halfWick, low[i], x[i] + halfWick, high[i]);
  }

  return {
    bullish: new Float32Array(bullishBody),
    bearish: new Float32Array(bearishBody)
  };
}

function appendRect(arr: number[], x1: number, y1: number, x2: number, y2: number) {
  // Triangle 1
  arr.push(x1, y1, x2, y1, x1, y2);
  // Triangle 2
  arr.push(x2, y1, x2, y2, x1, y2);
}
