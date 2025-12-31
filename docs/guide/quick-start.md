# Quick Start

Create your first chart in minutes.

## Vanilla JavaScript

### 1. Create HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Chart</title>
  <style>
    #chart { width: 100%; height: 400px; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script type="module" src="./main.js"></script>
</body>
</html>
```

### 2. Create Chart

```javascript
// main.js
import { createChart } from '@jigonzalez930209/scichart-engine'

const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'X', auto: true },
  yAxis: { label: 'Y', auto: true },
  theme: 'midnight',
  showControls: true,
})

// Generate sample data
const n = 1000
const x = new Float32Array(n)
const y = new Float32Array(n)

for (let i = 0; i < n; i++) {
  x[i] = i / 100
  y[i] = Math.sin(x[i] * 2) + Math.random() * 0.2
}

// Add series
chart.addSeries({
  id: 'data',
  type: 'line',
  data: { x, y },
  style: { color: '#00f2ff', width: 2 },
})
```

## React

### 1. Create Component

```tsx
import { SciChart } from '@jigonzalez930209/scichart-engine/react'

function MyChart() {
  // Generate data
  const n = 1000
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    x[i] = i / 100
    y[i] = Math.sin(x[i] * 2) + Math.random() * 0.2
  }

  const series = [{
    id: 'data',
    x,
    y,
    color: '#00f2ff',
  }]

  return (
    <SciChart
      series={series}
      xAxis={{ label: 'X', auto: true }}
      yAxis={{ label: 'Y', auto: true }}
      theme="midnight"
      showControls={true}
      height="400px"
    />
  )
}

export default MyChart
```

### 2. Use Component

```tsx
import MyChart from './MyChart'

function App() {
  return (
    <div>
      <h1>My Application</h1>
      <MyChart />
    </div>
  )
}
```

## Adding Interactivity

### Enable Cursor

```typescript
chart.enableCursor({
  snap: true,
  crosshair: true,
  formatter: (x, y) => `X: ${x.toFixed(2)}\nY: ${y.toFixed(4)}`,
})
```

### Listen to Events

```typescript
chart.on('zoom', ({ x, y }) => {
  console.log(`View: X[${x[0]}, ${x[1]}]`)
})

chart.on('render', ({ fps }) => {
  console.log(`${fps} FPS`)
})
```

### Programmatic Control

```typescript
// Zoom to specific range
chart.zoom({ x: [0, 5], y: [-1, 1] })

// Reset view
chart.resetZoom()

// Export image
const dataUrl = chart.exportImage('png')
```

## Multiple Series

```typescript
chart.addSeries({
  id: 'series-1',
  data: { x: x1, y: y1 },
  style: { color: '#ff6b6b' },
})

chart.addSeries({
  id: 'series-2',
  data: { x: x2, y: y2 },
  style: { color: '#4ecdc4' },
})
```

## Real-time Updates

```typescript
// Append new data
chart.updateSeries('data', {
  x: newXPoints,
  y: newYPoints,
  append: true,
})

// Replace all data
chart.updateSeries('data', {
  x: allXPoints,
  y: allYPoints,
})
```

## Next Steps

- [Core Concepts](/guide/concepts) - Understand the architecture
- [API Reference](/api/) - Full API documentation
- [Examples](/examples/) - More examples
