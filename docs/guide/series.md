# Series & Data

Learn how to work with data series in SciChart Engine.

<script setup>
import { ref } from 'vue'
</script>

## Interactive Demo

<ChartDemo type="multi" height="350px" />

## What is a Series?

A series represents a single dataset visualized on the chart. Each series has:

- **ID**: Unique identifier
- **Type**: How data is rendered (line, scatter, or both)
- **Data**: X and Y values as TypedArrays
- **Style**: Visual properties (color, width, etc.)

## Creating Series

### Line Series

```typescript
chart.addSeries({
  id: 'temperature',
  type: 'line',
  data: {
    x: new Float32Array([0, 1, 2, 3, 4]),
    y: new Float32Array([20, 22, 21, 23, 22]),
  },
  style: { 
    color: '#ff6b6b', 
    width: 2 
  },
})
```

### Scatter Series

```typescript
chart.addSeries({
  id: 'measurements',
  type: 'scatter',
  data: { x, y },
  style: { 
    color: '#4ecdc4', 
    pointSize: 6 
  },
})
```

### Line with Points

```typescript
chart.addSeries({
  id: 'samples',
  type: 'both',
  data: { x, y },
  style: { 
    color: '#ffe66d', 
    width: 1.5, 
    pointSize: 4 
  },
})
```

### Bar Series

```typescript
chart.addBar({
  id: 'sales',
  data: {
    x: new Float32Array([1, 2, 3, 4, 5]),
    y: new Float32Array([120, 150, 180, 210, 190]),
  },
  style: {
    color: '#00f2ff',
    barWidth: 0.6
  }
})
```

### Heatmap Series

```typescript
chart.addHeatmap({
  id: 'matrix',
  data: {
    xValues: [0, 1, 2],
    yValues: [0, 1, 2],
    zValues: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9])
  },
  style: {
    colorScale: { name: 'viridis', min: 0, max: 10 }
  }
})
```

### Candlestick Series

```typescript
chart.addSeries({
  id: 'stock-price',
  type: 'candlestick',
  data: {
    x: timestamps,
    open: openValues,
    high: highValues,
    low: lowValues,
    close: closeValues,
  },
  style: {
    bullishColor: '#26a69a', // Green
    bearishColor: '#ef5350', // Red
    barWidth: 0.8
  }
})
```

### Stacked Series

Group multiple series together by using the same `stackId`. They will be rendered on top of each other.

```typescript
chart.addSeries({
  id: 'layer-1',
  type: 'area', // Usually stacked as area/band
  stackId: 'my-group',
  data: { x, y: y1 },
  style: { color: '#ff6b6b' }
})

chart.addSeries({
  id: 'layer-2',
  type: 'area',
  stackId: 'my-group',
  data: { x, y: y2 },
  style: { color: '#4ecdc4' }
})
```

## Data Requirements

::: warning TypedArrays Required
SciChart Engine requires `Float32Array` or `Float64Array` for data. Regular JavaScript arrays will cause errors.
:::

```typescript
// ✅ Correct
const x = new Float32Array([1, 2, 3, 4, 5])
const y = new Float32Array([10, 20, 15, 25, 30])

// ❌ Wrong - will cause errors
const x = [1, 2, 3, 4, 5]
const y = [10, 20, 15, 25, 30]
```

### Why TypedArrays?

1. **Memory efficiency**: Fixed-size, contiguous memory
2. **GPU upload**: Direct transfer to WebGL buffers
3. **Performance**: No type coercion overhead
4. **Precision**: Float64 for scientific accuracy

### Converting from Arrays

```typescript
// From regular array
const regularArray = [1, 2, 3, 4, 5]
const typedArray = new Float32Array(regularArray)

// From generator
const n = 1000
const x = new Float32Array(n)
for (let i = 0; i < n; i++) {
  x[i] = i
}
```

## Updating Data

### Replace All Data

```typescript
chart.updateSeries('temperature', {
  x: newXData,
  y: newYData,
})
```

### Append Data (Streaming)

```typescript
// Add new points to existing data
chart.updateSeries('stream', {
  x: new Float32Array([nextX]),
  y: new Float32Array([nextY]),
  append: true,
})
```

### Efficient Appending

For real-time data, pre-allocate and copy:

```typescript
function appendPoints(prevX, prevY, newPoints) {
  const newX = new Float32Array(prevX.length + newPoints.length)
  const newY = new Float32Array(prevY.length + newPoints.length)
  
  newX.set(prevX)
  newY.set(prevY)
  
  for (let i = 0; i < newPoints.length; i++) {
    newX[prevX.length + i] = newPoints[i].x
    newY[prevY.length + i] = newPoints[i].y
  }
  
  return { x: newX, y: newY }
}
```

## Managing Series

### Get Series

```typescript
const series = chart.getSeries('temperature')

// Series methods
series.getId()         // 'temperature'
series.getType()       // 'line'
series.getData()       // { x: Float32Array, y: Float32Array }
series.getPointCount() // 5
series.getBounds()     // { xMin, xMax, yMin, yMax }
series.isVisible()     // true
```

### Get All Series

```typescript
const allSeries = chart.getAllSeries()

allSeries.forEach(s => {
  console.log(`${s.getId()}: ${s.getPointCount()} points`)
})
```

### Remove Series

```typescript
chart.removeSeries('temperature')
```

### Toggle Visibility

```typescript
const series = chart.getSeries('temperature')
series.setVisible(false)  // Hide
series.setVisible(true)   // Show
```

### Change Type Dynamically

```typescript
const series = chart.getSeries('data')
series.setType('scatter') // Switch from line to scatter
```

### Update Style

```typescript
const series = chart.getSeries('temperature')
series.setStyle({ 
  color: '#00ff00',
  width: 3 
})
```

## Multiple Series

```typescript
// Add multiple series
chart.addSeries({
  id: 'sensor-1',
  data: { x: time, y: sensor1Data },
  style: { color: '#ff6b6b' },
})

chart.addSeries({
  id: 'sensor-2',
  data: { x: time, y: sensor2Data },
  style: { color: '#4ecdc4' },
})

chart.addSeries({
  id: 'sensor-3',
  data: { x: time, y: sensor3Data },
  style: { color: '#ffe66d' },
})
```

## Series Bounds

Each series calculates its data bounds:

```typescript
const series = chart.getSeries('data')
const bounds = series.getBounds()

console.log(`X range: ${bounds.xMin} to ${bounds.xMax}`)
console.log(`Y range: ${bounds.yMin} to ${bounds.yMax}`)
```

The chart uses these bounds for auto-scaling.

## Best Practices

### 1. Use Meaningful IDs

```typescript
// ✅ Good
chart.addSeries({ id: 'temperature-sensor-1', ... })

// ❌ Bad
chart.addSeries({ id: 's1', ... })
```

### 2. Pre-allocate for Large Data

```typescript
// ✅ Good - allocate once
const n = 1000000
const x = new Float32Array(n)
const y = new Float32Array(n)

// Fill data...

chart.addSeries({ id: 'big', data: { x, y } })
```

### 3. Batch Updates

```typescript
// ✅ Good - update once with all new points
chart.updateSeries('stream', {
  x: new Float32Array(100),  // 100 new points
  y: new Float32Array(100),
  append: true,
})

// ❌ Bad - 100 separate updates
for (let i = 0; i < 100; i++) {
  chart.updateSeries('stream', {
    x: new Float32Array([point.x]),
    y: new Float32Array([point.y]),
    append: true,
  })
}
```

### 4. Clean Up Unused Series

```typescript
// Remove series when no longer needed
chart.removeSeries('old-data')
```
