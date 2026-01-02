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
| [`chart.tooltip`](/api/tooltips) | Tooltip system manager |

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

### Annotations

| Method | Description |
|--------|-------------|
| [`chart.addAnnotation(annotation)`](/api/annotations#add-annotation) | Add an annotation |
| [`chart.removeAnnotation(id)`](/api/annotations#remove-annotation) | Remove an annotation |
| [`chart.updateAnnotation(id, updates)`](/api/annotations#update-annotation) | Update an annotation |
| [`chart.getAnnotation(id)`](/api/annotations#get-annotation) | Get an annotation by ID |
| [`chart.getAnnotations()`](/api/annotations#get-all) | Get all annotations |
| [`chart.clearAnnotations()`](/api/annotations#clear) | Clear all annotations |

**Annotation Types:**
- `horizontal-line` - Horizontal line with optional label
- `vertical-line` - Vertical line with optional label
- `rectangle` - Rectangular region
- `band` - Horizontal or vertical band/region
- `text` - Text annotation with customizable style
- `arrow` - Arrow with head customization

[View full Annotations API →](/api/annotations)

### Step Charts

Step charts display data as "stair-step" patterns - ideal for discrete data.

| Type | Description |
|------|-------------|
| `step` | Step line chart |
| `step+scatter` | Step chart with point markers |

**Step Modes:**
- `after` - Step after the point (default)
- `before` - Step before the point
- `center` - Step at midpoint

[View Step Charts documentation →](/api/step-charts)

### Data Export

| Method | Description |
|--------|-------------|
| [`chart.exportCSV(options?)`](/api/export#csv-export) | Export data to CSV format |
| [`chart.exportJSON(options?)`](/api/export#json-export) | Export data to JSON format |

```typescript
// Quick export
const csv = chart.exportCSV();
const json = chart.exportJSON();

// With options
const csv = chart.exportCSV({
  seriesIds: ['current'],
  precision: 4,
  delimiter: '\t'
});
```

[View Data Export documentation →](/api/export)

### Error Bars

Visualize uncertainty, variability, or confidence intervals in your data.

**Error Data Types:**
- `yError` - Symmetric Y error (±value)
- `yErrorPlus` / `yErrorMinus` - Asymmetric Y error
- `xError` - Symmetric X error (horizontal)
- `xErrorPlus` / `xErrorMinus` - Asymmetric X error

**Styling Options:**
```typescript
errorBars: {
  color: '#00f2ff',
  width: 1.5,
  capWidth: 8,
  showCaps: true,
  opacity: 0.7,
  direction: 'both'  // 'both' | 'positive' | 'negative'
}
```

[View Error Bars documentation →](/api/error-bars)

### Scatter Symbols

Multiple marker shapes for scatter plots, rendered via GPU shaders.

**Supported Shapes:**
- `circle` (default), `square`, `diamond`
- `triangle`, `triangleDown`
- `cross`, `x`, `star`

**Usage:**
```typescript
style: {
  symbol: 'star',
  pointSize: 10,
  color: '#ff4d4d'
}
```

[View Scatter Symbols documentation →](/api/scatter-symbols)

### Tooltip System

Advanced, high-performance tooltips with multi-series support, scientific notation, and smooth animations.

**Tooltip Modes:**
- `dataPoint` - Snap to nearest data point
- `crosshair` - Multi-series vertical tracking 
- `heatmap` - Cell-specific intensity display

**Themes:**
`dark`, `light`, `glass` (translucent), `midnight` (blue), `neon` (vibrant), `minimal`.

[View Tooltip System documentation →](/api/tooltips)

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
