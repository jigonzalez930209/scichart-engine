# API Reference

SciChart Engine provides a comprehensive API for creating high-performance scientific charts.

## Core Modules

### Chart Creation

| Function | Description |
|----------|-------------|
| [`createChart(options)`](/api/chart) | Create a new chart instance |

### Series Management

| Method | Description |
|--------|-------------|
| [`chart.addSeries(options)`](/api/series#addseries) | Add a new data series |
| [`chart.updateSeries(id, data)`](/api/series#updateseries) | Update series data |
| [`chart.removeSeries(id)`](/api/series#removeseries) | Remove a series |
| [`chart.getSeries(id)`](/api/series#getseries) | Get a series by ID |
| [`chart.getAllSeries()`](/api/series#getallseries) | Get all series |

### View Control

| Method | Description |
|--------|-------------|
| `chart.zoom(options)` | Programmatic zoom |
| `chart.pan(deltaX, deltaY)` | Programmatic pan |
| `chart.resetZoom()` | Reset to auto-scale |
| `chart.autoScale()` | Fit view to data |
| `chart.getViewBounds()` | Get current view bounds |

### Interactions

| Method | Description |
|--------|-------------|
| `chart.enableCursor(options)` | Enable crosshair cursor |
| `chart.disableCursor()` | Disable cursor |

### Events

| Event | Description |
|-------|-------------|
| [`render`](/api/events#render) | Fired after each frame render |
| [`zoom`](/api/events#zoom) | Fired when view bounds change |
| [`pan`](/api/events#pan) | Fired during panning |
| [`resize`](/api/events#resize) | Fired when chart resizes |

### Lifecycle

| Method | Description |
|--------|-------------|
| `chart.resize(width?, height?)` | Manually resize chart |
| `chart.render()` | Force a render |
| `chart.destroy()` | Clean up resources |
| `chart.exportImage(type?)` | Export as PNG/JPEG |

## React API

| Export | Description |
|--------|-------------|
| [`SciChart`](/api/react-scichart) | React component |
| [`useSciChart`](/api/react-hook) | React hook for imperative control |

## Data Analysis

| Function | Description |
|----------|-------------|
| [`detectCycles()`](/api/analysis-cycles) | Detect cycles in oscillating data |
| [`detectPeaks()`](/api/analysis-peaks) | Find local maxima/minima |
| [`calculateStats()`](/api/analysis-utils#calculatestats) | Basic statistics |
| [`movingAverage()`](/api/analysis-utils#movingaverage) | Smooth data |
| [`downsampleLTTB()`](/api/analysis-utils#downsamplelttb) | Reduce point count |
| [`validateData()`](/api/analysis-utils#validatedata) | Check for invalid values |

## Theming

| Export | Description |
|--------|-------------|
| [`DARK_THEME`](/api/themes) | Dark theme preset |
| [`LIGHT_THEME`](/api/themes) | Light theme preset |
| [`MIDNIGHT_THEME`](/api/themes) | Midnight blue theme |
| [`createTheme()`](/api/custom-themes) | Create custom theme |

## Types

```typescript
// Core types
type SeriesType = 'line' | 'scatter' | 'both'
type ScaleType = 'linear' | 'log'

interface Bounds {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

interface Point {
  x: number
  y: number
}

// Series types
interface SeriesData {
  x: Float32Array | Float64Array
  y: Float32Array | Float64Array
}

interface SeriesStyle {
  color?: string
  width?: number
  pointSize?: number
  smoothing?: number
}

// Chart options
interface ChartOptions {
  container: HTMLElement
  xAxis?: AxisOptions
  yAxis?: AxisOptions
  theme?: string | ChartTheme
  background?: string
  showControls?: boolean
  showLegend?: boolean
}
```
