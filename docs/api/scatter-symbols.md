---
title: Scatter Symbols
description: Customizable marker shapes for scatter plots
---

# Scatter Symbols

SciChart Engine supports multiple high-performance scatter symbols rendered via WebGL. These symbols are essential for distinguishing between different data series in scientific plots.

## Supported Symbols

The following symbol shapes are available:

| Shape | ID | Description |
|-------|----|-------------|
| Circle | `circle` | Default filled circle |
| Square | `square` | Filled square |
| Diamond | `diamond` | Diamond shape (rotated square) |
| Triangle | `triangle` | Triangle pointing up |
| Triangle Down | `triangleDown` | Triangle pointing down |
| Cross | `cross` | Plus (+) shape |
| X | `x` | X shape |
| Star | `star` | 5-pointed star |

## Usage

To use a specific symbol, set the `symbol` property in the `style` object of your series:

```typescript
chart.addSeries({
  id: 'peaks',
  type: 'scatter',
  data: { x, y },
  style: {
    color: '#00f2ff',
    pointSize: 10,
    symbol: 'star' // Set the shape
  }
});
```

## Mixing Series with Different Symbols

Using different symbols for multiple series helps identify them even without color:

```typescript
// Series A: Red Triangles
chart.addSeries({
  id: 'series-a',
  type: 'scatter',
  data: dataA,
  style: { color: '#ff4d4d', symbol: 'triangle', pointSize: 8 }
});

// Series B: Blue Squares
chart.addSeries({
  id: 'series-b',
  type: 'scatter',
  data: dataB,
  style: { color: '#4d4dff', symbol: 'square', pointSize: 8 }
});
```

## Performance

Scatter symbols are rendered using **Signed Distance Functions (SDF)** directly in the GPU's fragment shader. This means:
- Rendering 1 million stars is as fast as rendering 1 million circles.
- Symbols stay crisp even with higher resolution screens (DPR).
- Minimal CPU overhead for complex shapes.

## API Reference

### ScatterSymbol Type
```typescript
type ScatterSymbol = 
  | 'circle'
  | 'square'
  | 'diamond'
  | 'triangle'
  | 'triangleDown'
  | 'cross'
  | 'x'
  | 'star';
```

### SeriesStyle Property
```typescript
interface SeriesStyle {
  // ... other properties
  symbol?: ScatterSymbol;
  pointSize?: number;
}
```

## Complete Example

```typescript
import { createChart } from '@jigonzalez930209/scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
});

const symbols: ScatterSymbol[] = ['circle', 'square', 'diamond', 'triangle', 'star'];

symbols.forEach((sym, i) => {
  const x = new Float32Array([1, 2, 3, 4, 5]);
  const y = new Float32Array([i, i + 0.5, i + 0.2, i + 0.8, i + 0.5]);
  
  chart.addSeries({
    id: `series-${sym}`,
    type: 'scatter',
    data: { x, y },
    style: {
      symbol: sym,
      pointSize: 12,
      color: `hsl(${i * 60}, 70%, 50%)`
    }
  });
});
```
