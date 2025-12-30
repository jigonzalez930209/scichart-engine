# Basic Chart

A simple line chart with interactive controls.

<script setup>
import { ref } from 'vue'
</script>

## Demo

<ChartDemo type="basic" height="400px" :points="10000" />

## Key Features

- **10,000 points** rendered at 60 FPS
- **Zoom** with mouse wheel
- **Pan** by dragging
- **Box zoom** with right-click drag
- **Auto-scale** on double-click

## Code

```typescript
import { createChart } from 'scichart-engine'

// Create chart
const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'X', auto: true },
  yAxis: { label: 'Y', auto: true },
  theme: 'midnight',  // or 'dark', 'light'
  showControls: true,
})

// Generate data
const n = 10000
const x = new Float32Array(n)
const y = new Float32Array(n)

for (let i = 0; i < n; i++) {
  const t = i / (n / 20)
  x[i] = t
  y[i] = Math.sin(t) * Math.cos(t * 0.5) + 
         Math.sin(t * 3) * 0.3 + 
         Math.random() * 0.1
}

// Add series
chart.addSeries({
  id: 'signal',
  type: 'line',
  data: { x, y },
  style: { 
    color: '#00f2ff', 
    width: 1.5 
  },
})
```

## Key Points

### 1. TypedArrays Required

```typescript
// ✅ Correct
const x = new Float32Array([1, 2, 3])

// ❌ Wrong
const x = [1, 2, 3]
```

### 2. Container Element

The container must be a DOM element with defined dimensions:

```html
<div id="chart" style="width: 100%; height: 400px;"></div>
```

### 3. Series ID

Each series needs a unique ID for later reference:

```typescript
chart.addSeries({ id: 'my-unique-id', ... })

// Later
chart.updateSeries('my-unique-id', newData)
chart.removeSeries('my-unique-id')
```

## Variations

### Scatter Plot

```typescript
chart.addSeries({
  id: 'points',
  type: 'scatter',
  data: { x, y },
  style: { color: '#ff6b6b', pointSize: 4 },
})
```

### Line with Points

```typescript
chart.addSeries({
  id: 'samples',
  type: 'both',
  data: { x, y },
  style: { color: '#4ecdc4', width: 1.5, pointSize: 3 },
})
```

### Multiple Series

```typescript
chart.addSeries({
  id: 'series-1',
  data: { x, y: y1 },
  style: { color: '#ff6b6b' },
})

chart.addSeries({
  id: 'series-2',
  data: { x, y: y2 },
  style: { color: '#4ecdc4' },
})
```

## React Version

```tsx
import { SciChart } from 'scichart-engine/react'

function BasicChart() {
  const n = 10000
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    const t = i / (n / 20)
    x[i] = t
    y[i] = Math.sin(t) * Math.cos(t * 0.5) + Math.random() * 0.1
  }

  return (
    <SciChart
      series={[{ id: 'signal', x, y, color: '#00f2ff' }]}
      xAxis={{ label: 'X', auto: true }}
      yAxis={{ label: 'Y', auto: true }}
      theme="midnight"
      showControls={true}
      height="400px"
    />
  )
}
```
