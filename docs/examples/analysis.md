---
title: Peak Analysis Demo
description: Baseline correction and peak integration tools
---

# Peak Analysis Demo

Scientific data often requires pre-processing before meaningful parameters can be extracted. This demo showcases the **Baseline Subtraction** and **Numerical Integration** tools.

## Interactive Example

The chart below shows a Gaussian peak on top of a linear drifting baseline (common in sensors and electrochemistry).
- **Baseline Correction**: Removes the linear drift.
- **Integration**: Calculates the area under the peak (e.g., total charge $Q$ in voltammetry).

<ChartDemo type="analysis" height="500px" />

## How it Works

The engine provides low-level math utilities that can be used to process data before rendering or for post-acquisition analysis.

### 1. Baseline Subtraction

Experimental backgrounds can be modeled as a linear trend between two points.

```typescript
import { subtractBaseline } from 'scichart-engine/analysis';

// Correct raw data using points at x=10 and x=90 as background anchors
const correctedY = subtractBaseline(rawX, rawY, 10, 90);

chart.addSeries({
  id: 'corrected-signal',
  data: { x: rawX, y: correctedY },
  style: { color: '#00f2ff' }
});
```

### 2. Peak Integration

Calculates the area under a curve within a specific range using the **Trapezoidal Rule**.

```typescript
import { integrate } from 'scichart-engine/analysis';

// Calculate area between x=0.2 and x=0.8
const area = integrate(xData, yData, 0.2, 0.8);

console.log(`Integrated Area: ${area.toFixed(6)} units²`);
```

## Features

- **Interpolated Range**: The integration tool automatically interpolates Y values if the specified `xMin` or `xMax` don't fall exactly on data points.
- **High Performance**: Optimized for large `Float32Array` buffers.
- **Baseline Flexibility**: The linear model handles both positive and negative drifts.

## Use Cases

- **Chromatography**: Measuring peak areas for concentration.
- **Voltammetry**: Calculating total charge ($Q = \int I dt$) passed through an electrode.
- **Spectroscopy**: Background removal and intensity integration.
- **General Physics**: Energy calculation from power vs. time.
