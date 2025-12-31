---
title: Error Bars
description: Display uncertainty and variability in your scientific data
---

# Error Bars

Error bars are essential for scientific data visualization, showing the uncertainty, variability, or confidence intervals of measurements. SciChart Engine supports both symmetric and asymmetric error bars in both X and Y directions.

## Quick Example

```typescript
import { createChart } from '@jigonzalez930209/scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'Concentration (M)' },
  yAxis: { label: 'Current (µA)' }
});

// Create data with symmetric Y error
const x = new Float32Array([1, 2, 3, 4, 5]);
const y = new Float32Array([10.2, 22.5, 31.8, 42.1, 50.5]);
const yError = new Float32Array([0.5, 0.8, 0.3, 0.6, 0.9]);

chart.addSeries({
  id: 'calibration',
  type: 'scatter',
  data: { x, y, yError },
  style: { 
    color: '#00f2ff',
    pointSize: 6,
    errorBars: {
      color: '#00f2ff',
      capWidth: 8,
      width: 1.5
    }
  }
});
```

## Error Data Types

### Symmetric Y Error

Single error value applied in both directions (±error):

```typescript
data: {
  x: xValues,
  y: yValues,
  yError: new Float32Array([0.5, 0.3, 0.4, ...])  // ±0.5, ±0.3, ±0.4
}
```

### Asymmetric Y Error

Different error values for positive and negative directions:

```typescript
data: {
  x: xValues,
  y: yValues,
  yErrorPlus: new Float32Array([0.8, 0.5, 0.6]),   // Upper error
  yErrorMinus: new Float32Array([0.3, 0.2, 0.4])  // Lower error
}
```

### Symmetric X Error

Horizontal error bars:

```typescript
data: {
  x: xValues,
  y: yValues,
  xError: new Float32Array([0.1, 0.15, 0.08])  // ±X error
}
```

### Asymmetric X Error

```typescript
data: {
  x: xValues,
  y: yValues,
  xErrorPlus: new Float32Array([0.2, 0.1, 0.15]),
  xErrorMinus: new Float32Array([0.1, 0.08, 0.12])
}
```

### Both X and Y Errors

```typescript
data: {
  x: xValues,
  y: yValues,
  yError: yErrors,   // Vertical error bars
  xError: xErrors    // Horizontal error bars
}
```

## Error Bar Styling

Control the appearance of error bars through the `errorBars` property in `SeriesStyle`:

```typescript
interface ErrorBarStyle {
  visible?: boolean;      // Show/hide error bars
  color?: string;         // Error bar color (default: series color)
  width?: number;         // Line width (default: 1)
  capWidth?: number;      // Cap width in pixels (default: 6)
  showCaps?: boolean;     // Show end caps (default: true)
  opacity?: number;       // Transparency (default: 0.7)
  direction?: 'both' | 'positive' | 'negative';
}
```

### Example Styling

```typescript
chart.addSeries({
  id: 'measurements',
  type: 'scatter',
  data: { x, y, yError },
  style: {
    color: '#ff6b6b',
    pointSize: 8,
    errorBars: {
      color: '#ff6b6b',     // Match series color
      width: 2,             // Thicker lines
      capWidth: 10,         // Wider caps
      showCaps: true,       // Show end caps
      opacity: 0.8,         // Slightly transparent
      direction: 'both'     // Show both directions
    }
  }
});
```

## Direction Options

Control which parts of the error bars are shown:

### Both (Default)

```typescript
errorBars: { direction: 'both' }
```

Shows full error bars in both directions.

### Positive Only

```typescript
errorBars: { direction: 'positive' }
```

Shows only the upper/right portion of error bars.

### Negative Only

```typescript
errorBars: { direction: 'negative' }
```

Shows only the lower/left portion of error bars.

## Use Cases

### Calibration Curves

```typescript
// Standard addition calibration with error
const concentrations = new Float32Array([0, 0.1, 0.2, 0.5, 1.0]);
const currentValues = new Float32Array([0.01, 0.52, 1.05, 2.48, 4.95]);
const stdDev = new Float32Array([0.05, 0.08, 0.06, 0.12, 0.15]);

chart.addSeries({
  id: 'calibration',
  type: 'line+scatter',
  data: { 
    x: concentrations, 
    y: currentValues, 
    yError: stdDev  // Standard deviation as error bars
  },
  style: { color: '#4ecdc4' }
});
```

### Replicate Measurements

```typescript
// Multiple measurements with min/max range
const x = new Float32Array([1, 2, 3, 4, 5]);
const yMean = new Float32Array([10.5, 22.3, 31.8, 42.1, 51.2]);
const yMax = new Float32Array([11.2, 23.1, 32.5, 43.0, 52.0]);
const yMin = new Float32Array([9.8, 21.5, 31.1, 41.2, 50.4]);

// Calculate asymmetric errors
const yErrorPlus = yMax.map((max, i) => max - yMean[i]);
const yErrorMinus = yMean.map((mean, i) => mean - yMin[i]);

chart.addSeries({
  id: 'replicates',
  type: 'scatter',
  data: { 
    x, 
    y: yMean, 
    yErrorPlus: new Float32Array(yErrorPlus),
    yErrorMinus: new Float32Array(yErrorMinus)
  }
});
```

### Electrochemical Data with Uncertainty

```typescript
// CV peak current with instrumental uncertainty
chart.addSeries({
  id: 'peak-current',
  type: 'scatter',
  data: {
    x: scanRates,
    y: peakCurrents,
    yError: instrumentalError,  // Typically 0.1-1% of reading
    xError: scanRateUncertainty // Potentiostat timing uncertainty
  },
  style: {
    color: '#a855f7',
    pointSize: 8,
    errorBars: {
      color: '#a855f7',
      opacity: 0.6,
      capWidth: 6
    }
  }
});
```

## Series Data Interface

```typescript
interface SeriesData {
  x: Float32Array | Float64Array;
  y: Float32Array | Float64Array;
  
  // Symmetric errors
  yError?: Float32Array | Float64Array;
  xError?: Float32Array | Float64Array;
  
  // Asymmetric errors
  yErrorPlus?: Float32Array | Float64Array;
  yErrorMinus?: Float32Array | Float64Array;
  xErrorPlus?: Float32Array | Float64Array;
  xErrorMinus?: Float32Array | Float64Array;
}
```

## Performance Notes

- Error bars are rendered using Canvas 2D for optimal quality of the cap lines
- The rendering is automatic when error data is present in the series
- For large datasets, consider using scatter points with error bars rather than connected lines
- Error bars respect the plot area clipping

## Complete Example

```typescript
const chart = createChart({
  container: document.getElementById('chart'),
  theme: 'midnight',
  xAxis: { label: 'X Value' },
  yAxis: { label: 'Y Value ± Error' }
});

// Generate sample data with increasing uncertainty
const n = 10;
const x = new Float32Array(n);
const y = new Float32Array(n);
const yError = new Float32Array(n);

for (let i = 0; i < n; i++) {
  x[i] = i + 1;
  y[i] = Math.log(x[i]) * 10 + Math.random() * 2;
  yError[i] = 0.5 + (i * 0.2);  // Increasing error
}

chart.addSeries({
  id: 'with-errors',
  type: 'line+scatter',
  data: { x, y, yError },
  style: {
    color: '#00f2ff',
    width: 2,
    pointSize: 6,
    errorBars: {
      color: '#00f2ff',
      width: 1.5,
      capWidth: 8,
      opacity: 0.7
    }
  }
});
```
