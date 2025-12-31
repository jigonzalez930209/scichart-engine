---
title: Band Series API
description: Documentation for rendering filled areas between two curves
---

# Band Series API

Band series render a filled area between two curves, perfect for visualizing ranges, confidence intervals, error bands, and integration areas.

## Creating a Band Series

```typescript
chart.addSeries({
  id: 'confidence-band',
  type: 'band',
  data: {
    x: xValues,       // Float32Array - shared X values
    y: yUpper,        // Float32Array - upper curve (or main curve)
    y2: yLower,       // Float32Array - lower curve (baseline)
  },
  style: {
    color: 'rgba(0, 242, 255, 0.3)', // Semi-transparent fill
    width: 0,                         // No stroke by default
  }
});
```

## Data Structure

| Field | Type | Description |
|-------|------|-------------|
| `x` | `Float32Array` | X-axis values (shared between both curves) |
| `y` | `Float32Array` | First curve (typically the upper bound or signal) |
| `y2` | `Float32Array` | Second curve (typically the lower bound or baseline) |

## Use Cases

### 1. Confidence Intervals

Show the uncertainty range around a mean value:

```typescript
const mean = computeMean(samples);
const stdDev = computeStdDev(samples);

chart.addSeries({
  id: 'mean-line',
  type: 'line',
  data: { x, y: mean },
  style: { color: '#00f2ff', width: 2 }
});

chart.addSeries({
  id: 'confidence-band',
  type: 'band',
  data: {
    x,
    y: mean.map((v, i) => v + 2 * stdDev[i]),   // +2σ
    y2: mean.map((v, i) => v - 2 * stdDev[i]),  // -2σ
  },
  style: { color: 'rgba(0, 242, 255, 0.2)' }
});
```

### 2. Integration Area Visualization

Highlight the area being integrated in peak analysis:

```typescript
import { subtractBaseline, integrate } from 'scichart-engine/analysis';

// Define integration range
const x1 = 0.2, x2 = 0.8;

// Get baseline values at anchor points
const baselineY = interpolateBaseline(x, y, x1, x2);

// Filter data to integration range
const rangeIndices = x.map((v, i) => (v >= x1 && v <= x2) ? i : -1).filter(i => i >= 0);
const rangeX = rangeIndices.map(i => x[i]);
const rangeY = rangeIndices.map(i => y[i]);
const rangeBaseline = rangeIndices.map(i => baselineY[i]);

// Add band series for shaded area
chart.addSeries({
  id: 'integration-area',
  type: 'band',
  data: {
    x: new Float32Array(rangeX),
    y: new Float32Array(rangeY),
    y2: new Float32Array(rangeBaseline),
  },
  style: { color: 'rgba(255, 234, 0, 0.4)' }
});

// Calculate area
const area = integrate(new Float32Array(rangeX), 
  new Float32Array(rangeY.map((v, i) => v - rangeBaseline[i])));
```

### 3. Error Bands (Alternative to Error Bars)

For dense data where error bars would overlap:

```typescript
chart.addSeries({
  id: 'error-band',
  type: 'band',
  data: {
    x: xData,
    y: yData.map((v, i) => v + errors[i]),
    y2: yData.map((v, i) => v - errors[i]),
  },
  style: { color: 'rgba(255, 85, 85, 0.2)' }
});

chart.addSeries({
  id: 'main-line',
  type: 'line',
  data: { x: xData, y: yData },
  style: { color: '#ff5555', width: 2 }
});
```

## Rendering Details

Band series use WebGL `TRIANGLE_STRIP` for efficient GPU rendering. The data is interleaved as:

```
[x₀, y₀, x₀, y2₀, x₁, y₁, x₁, y2₁, ...]
```

This allows rendering the filled area with a single draw call for maximum performance.

## Best Practices

1. **Use semi-transparent colors** - Band series typically look best with alpha < 0.5
2. **Draw bands first** - Add band series before line series so they render behind
3. **Match X arrays** - Both `y` and `y2` must have the same length as `x`
4. **Consider stroke** - Set `width: 1` if you want a visible outline

## Comparison with Area Charts

| Feature | Band Series | Area Chart (Coming Soon) |
|---------|-------------|--------------------------|
| Fill direction | Between two curves | From curve to baseline (y=0) |
| Data required | `x`, `y`, `y2` | `x`, `y` |
| Use case | Ranges, intervals | Cumulative values |
