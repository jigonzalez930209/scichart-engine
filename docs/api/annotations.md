---
title: Annotations
description: Learn how to add annotations to your charts
---

# Annotations

Annotations allow you to add visual markers, lines, text, and shapes to your charts. They are useful for highlighting specific data points, regions of interest, or adding contextual information.

## Quick Example

```typescript
import { createChart } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'Time (s)' },
  yAxis: { label: 'Current (µA)' }
});

// Add a horizontal line at y = 0
chart.addAnnotation({
  type: 'horizontal-line',
  y: 0,
  color: '#ff0055',
  lineDash: [5, 5],
  label: 'Zero Baseline'
});

// Add a vertical line marking an event
chart.addAnnotation({
  type: 'vertical-line',
  x: 0.5,
  color: '#00f2ff',
  label: 'Peak Position'
});

// Highlight a region of interest
chart.addAnnotation({
  type: 'band',
  xMin: 0.2,
  xMax: 0.4,
  fillColor: 'rgba(255, 100, 100, 0.2)',
  label: 'ROI'
});
```

## Annotation Types

### Horizontal Line

A horizontal line spanning the chart width at a specific Y value.

```typescript
chart.addAnnotation({
  type: 'horizontal-line',
  y: -0.5,                    // Y position in data coordinates
  xMin: -0.2,                 // Optional: start X
  xMax: 0.2,                  // Optional: end X
  color: '#ff0055',           // Line color
  lineWidth: 2,               // Line width in pixels
  lineDash: [5, 5],           // Dash pattern
  label: 'Cathodic Peak',     // Optional label
  labelPosition: 'right',     // 'left', 'right', or 'center'
  labelBackground: 'rgba(0,0,0,0.7)'
});
```

### Vertical Line

A vertical line spanning the chart height at a specific X value.

```typescript
chart.addAnnotation({
  type: 'vertical-line',
  x: 0.25,                    // X position in data coordinates
  yMin: -1e-5,                // Optional: start Y
  yMax: 1e-5,                 // Optional: end Y
  color: '#00f2ff',
  lineWidth: 1,
  lineDash: [3, 3],
  label: 'E1/2',
  labelPosition: 'top'        // 'top', 'bottom', or 'center'
});
```

### Rectangle

A rectangular region with optional fill and stroke.

```typescript
chart.addAnnotation({
  type: 'rectangle',
  xMin: 0.1,
  xMax: 0.3,
  yMin: -5e-6,
  yMax: 5e-6,
  fillColor: 'rgba(100, 255, 100, 0.2)',
  strokeColor: '#00ff55',
  strokeWidth: 1,
  strokeDash: [],
  label: 'Region A'
});
```

### Band

A band that spans the full chart in one dimension.

```typescript
// Vertical band (full height)
chart.addAnnotation({
  type: 'band',
  xMin: -0.3,
  xMax: -0.1,
  fillColor: 'rgba(255, 200, 100, 0.15)',
  label: 'Oxidation Region'
});

// Horizontal band (full width)
chart.addAnnotation({
  type: 'band',
  yMin: -2e-6,
  yMax: 2e-6,
  fillColor: 'rgba(100, 100, 255, 0.1)',
  label: 'Noise Floor'
});
```

### Text

A text label at a specific position.

```typescript
chart.addAnnotation({
  type: 'text',
  x: 0.0,
  y: 1e-5,
  text: 'Peak Current: 10 µA',
  fontSize: 14,
  fontWeight: 'bold',
  color: '#ffffff',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  padding: 6,
  rotation: 0,                // Degrees
  anchor: 'bottom-left'       // Anchor point
});
```

### Arrow

An arrow pointing from one position to another.

```typescript
chart.addAnnotation({
  type: 'arrow',
  x1: 0.1,                    // Start position
  y1: 0,
  x2: 0.3,                    // End position (arrow head)
  y2: 5e-6,
  color: '#ffaa00',
  lineWidth: 2,
  headSize: 10,
  headStyle: 'filled',        // 'filled', 'open', or 'none'
  showTail: false,            // Show arrow at start too
  label: 'Increasing current'
});
```

## Managing Annotations

### Update an Annotation

```typescript
const id = chart.addAnnotation({
  type: 'horizontal-line',
  y: 0,
  color: '#ff0055'
});

// Later, update it
chart.updateAnnotation(id, {
  y: 0.5,
  color: '#00ff00',
  label: 'Updated position'
});
```

### Remove an Annotation

```typescript
const id = chart.addAnnotation({ type: 'horizontal-line', y: 0 });

// Remove it
chart.removeAnnotation(id);
```

### Get All Annotations

```typescript
const annotations = chart.getAnnotations();
console.log(`Total annotations: ${annotations.length}`);
```

### Clear All Annotations

```typescript
chart.clearAnnotations();
```

## Styling Options

All annotations support common styling options:

| Property | Description |
|----------|-------------|
| `visible` | Show/hide the annotation (default: `true`) |
| `interactive` | Allow user interaction (default: `false`) |
| `zIndex` | Layer order (higher = on top) |

## Best Practices

1. **Use semantic IDs**: Provide meaningful IDs for annotations you'll update later
2. **Color coordination**: Match annotation colors with your series colors
3. **Transparency**: Use transparent fills for bands to avoid obscuring data
4. **Labels**: Keep labels short and position them to avoid overlapping data

## React Usage

```tsx
import { SciChart } from 'scichart-engine/react';
import { useRef, useEffect } from 'react';

function ChartWithAnnotations() {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = chartRef.current?.getChart();
    if (chart) {
      chart.addAnnotation({
        type: 'horizontal-line',
        y: 0,
        color: '#ff0055',
        label: 'Zero line'
      });
    }
  }, []);

  return (
    <SciChart
      ref={chartRef}
      series={[{ id: 'data', x: xData, y: yData }]}
      xAxis={{ label: 'X' }}
      yAxis={{ label: 'Y' }}
    />
  );
}
```

## Type Definitions

All annotation types are exported for TypeScript users:

```typescript
import type {
  Annotation,
  HorizontalLineAnnotation,
  VerticalLineAnnotation,
  RectangleAnnotation,
  BandAnnotation,
  TextAnnotation,
  ArrowAnnotation
} from 'scichart-engine';
```
