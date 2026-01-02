---
title: Step Charts
description: Learn how to create step charts for discrete data visualization
---

# Step Charts

Step charts display data as a series of horizontal and vertical line segments, creating a "stair-step" pattern. They're ideal for visualizing discrete data changes or data that remains constant between measurements.

## Quick Example

```typescript
import { createChart } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'Time' },
  yAxis: { label: 'Value' }
});

chart.addSeries({
  id: 'sensor-data',
  type: 'step',  // Use 'step' instead of 'line'
  data: { x: timeData, y: sensorValues },
  style: { 
    color: '#00f2ff', 
    width: 2,
    stepMode: 'after'  // 'before', 'after', or 'center'
  }
});
```

## Step Modes

SciChart Engine supports three step modes that control where the step transition occurs:

### After (Default)

The step occurs after each data point - horizontal first, then vertical.

```typescript
style: { stepMode: 'after' }
```

```
    ┌───
    │
────┘
```

**Use case**: Representing values that apply until the next change (e.g., price, settings).

### Before

The step occurs before each data point - vertical first, then horizontal.

```typescript
style: { stepMode: 'before' }
```

```
───┐
   │
   └───
```

**Use case**: Values that become active at the point of measurement.

### Center

The step occurs at the midpoint between data points.

```typescript
style: { stepMode: 'center' }
```

```
    ┌──
    │
──┬─┘
  │
```

**Use case**: Histograms, binned data, symmetrical transitions.

## Series Types

### `step`

Pure step chart without point markers.

```typescript
chart.addSeries({
  id: 'temperature',
  type: 'step',
  data: { x, y },
  style: { color: '#ff6b6b', width: 2 }
});
```

### `step+scatter`

Step chart with point markers at each data point.

```typescript
chart.addSeries({
  id: 'measurements',
  type: 'step+scatter',
  data: { x, y },
  style: { 
    color: '#4ecdc4', 
    width: 2,
    pointSize: 6
  }
});
```

## Use Cases

### Sensor Data

Step charts are perfect for IoT and sensor data where values remain constant between readings:

```typescript
// Temperature readings every hour
const hours = new Float32Array([0, 1, 2, 3, 4, 5]);
const temps = new Float32Array([22.0, 22.0, 21.5, 21.5, 23.0, 23.0]);

chart.addSeries({
  id: 'temperature',
  type: 'step',
  data: { x: hours, y: temps },
  style: { stepMode: 'after' }
});
```

### Financial Data

Represent prices that hold until the next trade:

```typescript
chart.addSeries({
  id: 'stock-price',
  type: 'step',
  data: { x: timestamps, y: prices },
  style: { 
    color: '#00ff88',
    stepMode: 'after'
  }
});
```

### Digital Signals

Perfect for visualizing digital/binary signals:

```typescript
chart.addSeries({
  id: 'clock-signal',
  type: 'step',
  data: { x: time, y: digitalSignal },
  style: { 
    color: '#ff0055',
    stepMode: 'after',
    width: 2
  }
});
```

### Electrochemical Data - Pulse Techniques

Step charts work well for pulse voltammetry techniques like DPV, SWV:

```typescript
// Applied potential steps
chart.addSeries({
  id: 'applied-potential',
  type: 'step',
  data: { x: time, y: potential },
  style: { 
    color: '#a855f7', 
    stepMode: 'center',
    width: 2
  }
});
```

## Styling

All standard `SeriesStyle` options apply to step charts:

```typescript
{
  color: '#00f2ff',      // Line color
  width: 2,              // Line width in pixels
  opacity: 0.8,          // Transparency (0-1)
  stepMode: 'after',     // Step transition point
  pointSize: 6           // For step+scatter only
}
```

## Type Definition

```typescript
type SeriesType = 'line' | 'scatter' | 'line+scatter' | 'step' | 'step+scatter';

type StepMode = 'before' | 'after' | 'center';

interface SeriesStyle {
  color?: string;
  width?: number;
  opacity?: number;
  pointSize?: number;
  stepMode?: StepMode;  // Only used for step/step+scatter types
}
```

## Performance

Step charts render efficiently using WebGL. The step vertices are pre-computed when the series data is set or updated, so there's no performance penalty during rendering compared to regular line charts.

For large datasets (100K+ points), step charts maintain the same high performance as line charts.
