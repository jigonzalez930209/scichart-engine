---
title: Error Bars Demo
description: Interactive demo showcasing error bars for scientific data
---

# Error Bars Demo

Error bars visualize uncertainty, variability, or confidence intervals in your scientific measurements. This is essential for calibration curves, replicate data, and any measurements where uncertainty needs to be communicated.

## Interactive Example

This demo shows:
- **Blue line** - Symmetric error bars (±error same in both directions)
- **Red points** - Asymmetric error bars (different upper/lower errors)

<ChartDemo type="errorbars" height="450px" />

## Types of Error Bars

### Symmetric Error

Same error value in both directions:

```typescript
data: {
  x: concentrations,
  y: currents,
  yError: standardDeviation  // ±value
}
```

### Asymmetric Error

Different values for upper and lower bounds:

```typescript
data: {
  x: values,
  y: means,
  yErrorPlus: upperErrors,    // +value
  yErrorMinus: lowerErrors    // -value
}
```

## Code Example

```typescript
import { createChart } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
  theme: 'midnight',
  xAxis: { label: 'Concentration (M)' },
  yAxis: { label: 'Current (µA)' }
});

// Sample data with symmetric error
const x = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]);
const y = new Float32Array([5.2, 10.5, 15.8, 20.1, 25.3]);
const yError = new Float32Array([0.5, 0.8, 0.6, 0.7, 0.9]);

chart.addSeries({
  id: 'calibration',
  type: 'line+scatter',
  data: { x, y, yError },
  style: {
    color: '#00f2ff',
    pointSize: 8,
    errorBars: {
      color: '#00f2ff',
      width: 1.5,
      capWidth: 10,
      opacity: 0.8
    }
  }
});
```

## Use Cases

- **Calibration curves** - Show standard deviation of replicates
- **Electrochemical data** - Display instrumental uncertainty
- **Statistical analysis** - Confidence intervals, min/max ranges
- **Quality control** - Tolerance bands and limits
