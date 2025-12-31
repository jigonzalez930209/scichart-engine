---
title: Statistics Panel
description: Real-time statistical analysis of visible data
---

# Statistics Panel

The Statistics Panel provides real-time statistical calculations for all visible series within the current view bounds. It's perfect for quick data inspection and quality control.

## Enabling the Statistics Panel

```typescript
const chart = createChart({
  container: document.getElementById('chart'),
  showStatistics: true,  // Enable the statistics panel
  showControls: true,    // Also enable controls for full UI
});
```

## Features

The panel calculates statistics for **visible series** within the **current viewport**:

| Statistic | Description |
|-----------|-------------|
| **Min** | Minimum Y value in the visible range |
| **Max** | Maximum Y value in the visible range |
| **Mean** | Arithmetic mean of Y values |
| **Count** | Number of data points in the visible range |
| **Area** | Numerical integration (trapezoidal rule) |

## Appearance

The panel appears in the **bottom-left corner** of the chart as a collapsible overlay:

```
┌─────────────────────────────────────┐
│ 📊 Statistics                    [-]│
├─────────────────────────────────────┤
│ ▌current                            │
│   Min: -2.45e-5 µA                  │
│   Max: 1.87e-4 µA                   │
│   Mean: 4.32e-5 µA                  │
│   Count: 1,250                      │
│   Area: 0.002156 µA·V               │
├─────────────────────────────────────┤
│ ▌voltage                            │
│   Min: -0.500 V                     │
│   Max: 0.800 V                      │
│   ...                               │
└─────────────────────────────────────┘
```

## Behavior

### Viewport-Aware

Statistics are recalculated every time the view changes:
- After **zoom** operations
- After **pan** operations
- After **auto-scale**

### Series Visibility

Only **visible** series are included. Toggle series visibility in the legend to include/exclude them from calculations.

### Collapsible

Click the header to expand/collapse the panel. When collapsed, only "📊 Statistics" is shown.

## Use Cases

### 1. Quick Data Validation

After loading data, use the panel to quickly check if values are in expected ranges.

### 2. Zoom-and-Inspect

Zoom into a region of interest and see statistics for just that region:

```typescript
chart.zoom({ x: [0.2, 0.4], y: [-1e-4, 2e-4] });
// Statistics panel now shows values only for x=[0.2, 0.4]
```

### 3. Peak Area Estimation

The "Area" value gives you a quick numerical integration of the visible data:

```
Area = ∫ y dx (trapezoidal rule)
```

### 4. Multi-Series Comparison

Compare statistics across different series simultaneously.

## Styling

The panel inherits theme colors automatically:

```typescript
// Dark theme - dark semi-transparent background
// Light theme - light semi-transparent background
chart.setTheme('light');
```

## Programmatic Access

You can access statistics programmatically using the analysis utilities:

```typescript
import { calculateStats, integrate } from 'scichart-engine/analysis';

const series = chart.getSeries('my-data');
const data = series.getData();
const bounds = chart.getViewBounds();

const stats = calculateStats(data.x, data.y, bounds.xMin, bounds.xMax);
const area = integrate(data.x, data.y, bounds.xMin, bounds.xMax);

console.log(`Mean: ${stats.mean}, Std: ${stats.std}`);
console.log(`Integrated Area: ${area}`);
```

## API Reference

### `calculateStats`

```typescript
function calculateStats(
  x: Float32Array | Float64Array,
  y: Float32Array | Float64Array,
  xMin?: number,
  xMax?: number
): {
  min: number;
  max: number;
  mean: number;
  std: number;
  count: number;
}
```

### `integrate`

```typescript
function integrate(
  x: Float32Array | Float64Array,
  y: Float32Array | Float64Array,
  xMin?: number,
  xMax?: number
): number
```

## Performance

The statistics panel uses efficient algorithms:
- **O(n)** for min/max/mean/count
- **O(n)** for trapezoidal integration
- Calculations only run when the panel is **expanded**
- Only processes points **within the current viewport**
