# Bar Charts

SciChart Engine supports high-performance bar charts for categorical data or discrete measurements.

## Live Demo

<ChartDemo type="bar" height="400px" />

## Usage

You can add a bar series using the `addSeries` method with `type: 'bar'` or the convenience method `addBar`.

```typescript
import { createChart } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
});

// Using addBar convenience method
chart.addBar({
  id: 'revenue',
  data: {
    x: [1, 2, 3, 4, 5],
    y: [100, 150, 120, 200, 180]
  },
  style: {
    color: '#00f2ff',
    barWidth: 0.6, // Relative width (0 to 1)
  }
});
```

## Styling Options

Bar charts support several specific styling options:

| Option | Type | Description |
|--------|------|-------------|
| `barWidth` | `number` | The width of the bar in data units. |
| `barGap` | `number` | The gap between bars as a fraction of bar width. |
| `barAlign` | `'center' \| 'edge'` | Alignment of the bar relative to its X coordinate. |
| `color` | `string` | The fill color of the bars. |
| `opacity` | `number` | Transparency of the bars (0 to 1). |

### Automatic Bar Width

If `barWidth` is not specified, SciChart Engine automatically calculates an optimal width based on the spacing between consecutive X values, ensuring bars don't overlap.

```typescript
chart.addSeries({
  id: 'auto-width',
  type: 'bar',
  data: {
    x: [10, 20, 50, 60, 70], // Non-uniform spacing
    y: [5, 10, 8, 12, 11]
  },
  // style.barWidth omitted -> auto-calculated
});
```
