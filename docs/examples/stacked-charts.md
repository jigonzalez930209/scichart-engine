# Stacked Charts

Visualizing cumulative data by stacking series on top of each other.

<script setup>
import { ref } from 'vue'
</script>

## Demo

<ChartDemo type="stacked" height="400px" />

## Implementation

To stack series, simply assign them the same `stackId`. The engine handles the accumulation logic automatically.

```typescript
import { createChart } from 'scichart-engine'

const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { auto: true },
  yAxis: { auto: true }
})

const commonX = new Float32Array([1, 2, 3, 4, 5]);
const stackId = 'group-a';

// First layer (bottom)
chart.addSeries({
  id: 'base',
  type: 'area', // Area or Band works best for stacking
  stackId: stackId,
  data: { x: commonX, y: new Float32Array([10, 12, 11, 13, 12]) },
  style: { color: 'rgba(255, 107, 107, 0.6)' }
})

// Second layer (middle)
chart.addSeries({
  id: 'middle',
  type: 'area',
  stackId: stackId,
  data: { x: commonX, y: new Float32Array([5, 6, 5, 7, 6]) },
  style: { color: 'rgba(78, 205, 196, 0.6)' }
})

// Third layer (top)
chart.addSeries({
  id: 'top',
  type: 'area',
  stackId: stackId,
  data: { x: commonX, y: new Float32Array([8, 7, 9, 8, 10]) },
  style: { color: 'rgba(255, 230, 109, 0.6)' }
})
```

## How Stacking Works

When a series has a `stackId`, its rendering baseline is determined by the sum of all preceding series with the same `stackId`. 

- **Order Matters**: The order in which you call `addSeries` determines the stacking order (bottom-to-top).
- **Summation**: The Y-values of each layer are added to the cumulative height.
- **Auto-Scaling**: The chart's Y-axis auto-scales based on the *total stacked height*, not individual series values.

## Mixed Series

You can mix stacked and non-stacked series on the same chart. Simply omit the `stackId` for series that should be rendered independently.

```typescript
// This series will NOT be stacked
chart.addSeries({
  id: 'independent-line',
  type: 'line',
  data: { x, y: y_standalone },
  style: { color: '#ffffff', width: 2 }
})
```
