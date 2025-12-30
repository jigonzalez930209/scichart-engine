# createChart

Creates a new SciChart Engine instance.

## Signature

```typescript
function createChart(options: ChartOptions): Chart
```

## Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `container` | `HTMLElement` | **required** | Container element for the chart |
| `xAxis` | `AxisOptions` | `{ auto: true }` | X-axis configuration |
| `yAxis` | `AxisOptions` | `{ auto: true }` | Y-axis configuration |
| `theme` | `string \| ChartTheme` | `'dark'` | Theme name or custom theme object |
| `background` | `string` | Theme default | Background color |
| `showControls` | `boolean` | `false` | Show toolbar controls |
| `showLegend` | `boolean` | `false` | Show series legend |
| `legendPosition` | `{ x: number, y: number }` | `{ x: 10, y: 10 }` | Legend position |
| `devicePixelRatio` | `number` | `window.devicePixelRatio` | Pixel ratio for rendering |

### AxisOptions

```typescript
interface AxisOptions {
  scale?: 'linear' | 'log'  // Scale type
  label?: string            // Axis label
  auto?: boolean            // Auto-scale to fit data
  min?: number              // Fixed minimum (if auto=false)
  max?: number              // Fixed maximum (if auto=false)
}
```

## Returns

Returns a `Chart` instance with the following methods:

### Series Management

```typescript
// Add a new series
chart.addSeries({
  id: 'my-series',
  type: 'line',           // 'line' | 'scatter' | 'both'
  data: { x, y },         // Float32Array or Float64Array
  style: { color: '#00f2ff', width: 2 },
})

// Update series data
chart.updateSeries('my-series', { x: newX, y: newY })

// Append data to existing series
chart.updateSeries('my-series', { x: newX, y: newY, append: true })

// Remove a series
chart.removeSeries('my-series')

// Get a series
const series = chart.getSeries('my-series')

// Get all series
const allSeries = chart.getAllSeries()
```

### View Control

```typescript
// Zoom to specific bounds
chart.zoom({ x: [0, 100], y: [-1, 1] })

// Pan by pixel delta
chart.pan(50, 0)  // Pan right 50px

// Reset to auto-scale
chart.resetZoom()

// Force auto-scale
chart.autoScale()

// Get current view bounds
const bounds = chart.getViewBounds()
// { xMin: 0, xMax: 100, yMin: -1, yMax: 1 }
```

### Cursor

```typescript
// Enable crosshair cursor
chart.enableCursor({
  snap: true,           // Snap to nearest data point
  crosshair: true,      // Show crosshair lines
  formatter: (x, y) => `X: ${x.toFixed(2)}\nY: ${y.toFixed(2)}`,
})

// Disable cursor
chart.disableCursor()
```

### Events

```typescript
// Listen to render events (for FPS monitoring)
chart.on('render', ({ fps, frameTime }) => {
  console.log(`${fps} FPS, ${frameTime}ms per frame`)
})

// Listen to zoom events
chart.on('zoom', ({ x, y }) => {
  console.log(`View: X[${x[0]}, ${x[1]}], Y[${y[0]}, ${y[1]}]`)
})

// Listen to pan events
chart.on('pan', ({ deltaX, deltaY }) => {
  console.log(`Panned: ${deltaX}, ${deltaY}`)
})

// Remove listener
chart.off('render', handler)
```

### Lifecycle

```typescript
// Manually resize (usually automatic via ResizeObserver)
chart.resize(800, 600)

// Force a render
chart.render()

// Export as image
const dataUrl = chart.exportImage('png')  // or 'jpeg'

// Clean up when done
chart.destroy()
```

## Example

```typescript
import { createChart } from 'scichart-engine'

// Create chart
const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'Time (s)', auto: true },
  yAxis: { label: 'Amplitude', auto: true },
  theme: 'midnight',
  showControls: true,
  showLegend: true,
})

// Generate data
const n = 10000
const x = new Float32Array(n)
const y = new Float32Array(n)

for (let i = 0; i < n; i++) {
  x[i] = i / 100
  y[i] = Math.sin(x[i]) + Math.random() * 0.1
}

// Add series
chart.addSeries({
  id: 'signal',
  type: 'line',
  data: { x, y },
  style: { color: '#00f2ff', width: 1.5 },
})

// Enable cursor with custom formatting
chart.enableCursor({
  snap: true,
  crosshair: true,
  formatter: (xVal, yVal) => 
    `Time: ${xVal.toFixed(2)}s\nValue: ${yVal.toFixed(4)}`,
})

// Monitor performance
chart.on('render', ({ fps }) => {
  document.getElementById('fps').textContent = `${fps} FPS`
})
```

## Themes

Built-in themes: `'dark'`, `'light'`, `'midnight'`, `'electrochemistry'`

```typescript
// Use built-in theme
const chart = createChart({
  container,
  theme: 'midnight',
})

// Use custom theme
import { createTheme } from 'scichart-engine'

const myTheme = createTheme({
  name: 'custom',
  backgroundColor: '#1a1a2e',
  gridColor: 'rgba(255,255,255,0.1)',
  axisColor: '#888',
  // ... more options
})

const chart = createChart({
  container,
  theme: myTheme,
})
```
