# Series API

Series represent data visualizations on the chart. Each series has an ID, type, data, and styling options.

## addSeries

Add a new series to the chart.

```typescript
chart.addSeries(options: SeriesOptions): void
```

### SeriesOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `string` | **required** | Unique identifier |
| `type` | `'line' \| 'scatter' \| 'both'` | `'line'` | Visualization type |
| `data` | `SeriesData` | **required** | X and Y data arrays |
| `style` | `SeriesStyle` | `{}` | Visual styling |
| `visible` | `boolean` | `true` | Initial visibility |
| `name` | `string` | `id` | Display name in legend |

### SeriesData

```typescript
interface SeriesData {
  x: Float32Array | Float64Array
  y: Float32Array | Float64Array
}
```

::: tip TypedArrays Required
SciChart Engine requires TypedArrays (`Float32Array` or `Float64Array`) for optimal WebGL performance. Regular JavaScript arrays will cause errors.
:::

### SeriesStyle

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `color` | `string` | Auto-generated | Line/point color (hex, rgb, hsl) |
| `width` | `number` | `1.5` | Line width in pixels |
| `pointSize` | `number` | `4` | Point size for scatter/both |
| `smoothing` | `number` | `0` | Catmull-Rom smoothing (0-1) |

### Example

```typescript
// Line series
chart.addSeries({
  id: 'temperature',
  type: 'line',
  data: {
    x: new Float32Array([0, 1, 2, 3, 4]),
    y: new Float32Array([20, 22, 21, 23, 22]),
  },
  style: { color: '#ff6b6b', width: 2 },
})

// Scatter series
chart.addSeries({
  id: 'measurements',
  type: 'scatter',
  data: { x: xData, y: yData },
  style: { color: '#4ecdc4', pointSize: 6 },
})

// Line with points
chart.addSeries({
  id: 'samples',
  type: 'both',
  data: { x: xData, y: yData },
  style: { color: '#ffe66d', width: 1.5, pointSize: 4 },
})
```

## updateSeries

Update data for an existing series.

```typescript
chart.updateSeries(id: string, data: SeriesUpdateData): void
```

### SeriesUpdateData

| Property | Type | Description |
|----------|------|-------------|
| `x` | `Float32Array \| Float64Array` | New X values |
| `y` | `Float32Array \| Float64Array` | New Y values |
| `append` | `boolean` | If true, append to existing data |

### Example

```typescript
// Replace all data
chart.updateSeries('temperature', {
  x: newXData,
  y: newYData,
})

// Append new data (for streaming)
chart.updateSeries('temperature', {
  x: new Float32Array([5, 6, 7]),
  y: new Float32Array([24, 23, 25]),
  append: true,
})
```

## removeSeries

Remove a series from the chart.

```typescript
chart.removeSeries(id: string): void
```

### Example

```typescript
chart.removeSeries('temperature')
```

## getSeries

Get a series by ID.

```typescript
chart.getSeries(id: string): Series | undefined
```

### Series Instance Methods

```typescript
const series = chart.getSeries('temperature')

// Get series info
series.getId()           // 'temperature'
series.getType()         // 'line'
series.getStyle()        // { color: '#ff6b6b', width: 2, ... }
series.getData()         // { x: Float32Array, y: Float32Array }
series.getPointCount()   // 5
series.getBounds()       // { xMin, xMax, yMin, yMax }
series.isVisible()       // true

// Modify series
series.setType('scatter')
series.setStyle({ color: '#00ff00' })
series.setVisible(false)
```

## getAllSeries

Get all series in the chart.

```typescript
chart.getAllSeries(): Series[]
```

### Example

```typescript
const allSeries = chart.getAllSeries()

allSeries.forEach(series => {
  console.log(`${series.getId()}: ${series.getPointCount()} points`)
})
```

## Working with Large Datasets

For datasets with millions of points, consider these patterns:

### Pre-allocate Arrays

```typescript
// Good: Pre-allocate
const n = 1000000
const x = new Float32Array(n)
const y = new Float32Array(n)

for (let i = 0; i < n; i++) {
  x[i] = i
  y[i] = Math.sin(i * 0.001)
}

chart.addSeries({ id: 'big', data: { x, y } })
```

### Streaming Data

```typescript
// For real-time data, use updateSeries with append
let buffer = { x: new Float32Array(0), y: new Float32Array(0) }

function onNewData(newPoints) {
  // Append to chart
  chart.updateSeries('stream', {
    x: new Float32Array(newPoints.map(p => p.x)),
    y: new Float32Array(newPoints.map(p => p.y)),
    append: true,
  })
}
```

### Downsampling

For very large datasets, use the built-in downsampling:

```typescript
import { downsampleLTTB } from 'scichart-engine'

// Reduce 10M points to 10k for display
const { x: sampledX, y: sampledY } = downsampleLTTB(
  originalX,
  originalY,
  10000
)

chart.addSeries({
  id: 'downsampled',
  data: { x: sampledX, y: sampledY },
})
```
