# Peak Detection

Find local maxima and minima in data.

## detectPeaks

```typescript
function detectPeaks(
  x: Float32Array | Float64Array | number[],
  y: Float32Array | Float64Array | number[],
  options?: {
    minProminence?: number
    type?: 'max' | 'min' | 'both'
  }
): Peak[]
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `x` | `Float32Array \| Float64Array \| number[]` | **required** | X values |
| `y` | `Float32Array \| Float64Array \| number[]` | **required** | Y values |
| `options.minProminence` | `number` | `0` | Minimum peak prominence to include |
| `options.type` | `'max' \| 'min' \| 'both'` | `'both'` | Type of peaks to detect |

### Returns

Array of `Peak` objects:

```typescript
interface Peak {
  index: number       // Index in data array
  x: number           // X value at peak
  y: number           // Y value at peak
  type: 'max' | 'min' // Peak type
  prominence: number  // Peak prominence
}
```

### How It Works

The algorithm finds local extrema by comparing each point to its neighbors:
- **Maximum**: Point is higher than both neighbors
- **Minimum**: Point is lower than both neighbors
- **Prominence**: Minimum height difference from neighbors

### Example: Find All Peaks

```typescript
import { detectPeaks } from 'scichart-engine'

const peaks = detectPeaks(x, y)

peaks.forEach(peak => {
  console.log(`${peak.type} at x=${peak.x.toFixed(3)}, y=${peak.y.toFixed(3)}`)
})
```

### Example: Filter by Prominence

```typescript
// Only find significant peaks (prominence > 0.1)
const significantPeaks = detectPeaks(x, y, { minProminence: 0.1 })
```

### Example: Find Only Maxima

```typescript
const maxima = detectPeaks(x, y, { type: 'max' })
```

### Example: Visualize Peaks

```typescript
import { detectPeaks } from 'scichart-engine'

const peaks = detectPeaks(x, y, { minProminence: 0.05 })

// Add peaks as scatter series
chart.addSeries({
  id: 'peaks',
  type: 'scatter',
  data: {
    x: new Float32Array(peaks.map(p => p.x)),
    y: new Float32Array(peaks.map(p => p.y)),
  },
  style: { color: '#ffea00', pointSize: 8 },
})
```

### Example: Annotate Peak Values

```typescript
const peaks = detectPeaks(x, y, { type: 'max', minProminence: 0.1 })

peaks.forEach(peak => {
  // Create annotation (implementation depends on your UI)
  addAnnotation({
    x: peak.x,
    y: peak.y,
    text: `Max: ${peak.y.toFixed(4)}`,
  })
})
```

## Use Cases

- **Signal Analysis** - Find peaks in waveforms
- **Spectroscopy** - Identify spectral peaks
- **Quality Control** - Detect anomalies
- **Feature Extraction** - Extract key points from data
