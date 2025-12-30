# Large Datasets

Render millions of points with smooth performance.

<script setup>
import { ref } from 'vue'
</script>

## Demo - 1 Million Points

<ChartDemo type="large" height="400px" :points="1000000" />

## Key Features

- **1,000,000 points** rendered at 60 FPS
- **Instant zoom/pan** - no lag
- **WebGL acceleration** - GPU-powered rendering

## Code

```typescript
import { createChart } from 'scichart-engine'

const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'Index', auto: true },
  yAxis: { label: 'Value', auto: true },
  showControls: true,
})

// Generate 1 million points
const n = 1000000
const x = new Float32Array(n)
const y = new Float32Array(n)

for (let i = 0; i < n; i++) {
  x[i] = i
  y[i] = Math.sin(i * 0.0001) * Math.cos(i * 0.00003) + Math.random() * 0.1
}

// Add to chart
chart.addSeries({
  id: 'big-data',
  type: 'line',
  data: { x, y },
  style: { color: '#a855f7', width: 1 },
})
```

## Key Points

### 1. Pre-allocate Arrays

```typescript
// ✅ Good - allocate once
const n = 1000000
const x = new Float32Array(n)
const y = new Float32Array(n)

for (let i = 0; i < n; i++) {
  x[i] = i
  y[i] = computeValue(i)
}
```

### 2. Use Float32Array

Float32 uses half the memory of Float64:

```typescript
// 1M points with Float32: ~8 MB
const x = new Float32Array(1000000)

// 1M points with Float64: ~16 MB
const x = new Float64Array(1000000)
```

### 3. Why It's Fast

SciChart Engine uses WebGL:

- Data uploaded to GPU once
- Zoom/pan only updates shader uniforms
- No data re-processing on interaction

## Downsampling

For even larger datasets, use LTTB downsampling:

```typescript
import { downsampleLTTB } from 'scichart-engine'

// Original: 10 million points
const originalX = new Float32Array(10000000)
const originalY = new Float32Array(10000000)
// ... fill data

// Downsample to 10,000 points
const { x, y } = downsampleLTTB(originalX, originalY, 10000)

chart.addSeries({
  id: 'downsampled',
  data: { x, y },
})
```

### Dynamic Level of Detail

Increase detail when zoomed in:

```typescript
chart.on('zoom', ({ x: [xMin, xMax] }) => {
  const visibleRange = xMax - xMin
  const fullRange = originalX[originalX.length - 1] - originalX[0]
  const zoomRatio = fullRange / visibleRange
  
  // More points when zoomed in
  const targetPoints = Math.min(
    originalX.length,
    Math.floor(5000 * Math.sqrt(zoomRatio))
  )
  
  const { x, y } = downsampleLTTB(originalX, originalY, targetPoints)
  chart.updateSeries('data', { x, y })
})
```

## Chunked Loading

Load data progressively to avoid blocking UI:

```typescript
async function loadLargeDataset(totalPoints) {
  const chunkSize = 100000
  const x = new Float32Array(totalPoints)
  const y = new Float32Array(totalPoints)
  
  for (let offset = 0; offset < totalPoints; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, totalPoints)
    
    for (let i = offset; i < end; i++) {
      x[i] = i
      y[i] = computeValue(i)
    }
    
    // Update progress UI
    progressBar.style.width = `${(offset / totalPoints) * 100}%`
    
    // Yield to UI thread
    await new Promise(r => setTimeout(r, 0))
  }
  
  chart.addSeries({ id: 'data', data: { x, y } })
}
```

## Memory Considerations

| Points | Memory (Float32) |
|--------|------------------|
| 100k | ~0.8 MB |
| 1M | ~8 MB |
| 10M | ~80 MB |
| 100M | ~800 MB |

### Clean Up

```typescript
// Remove when done
chart.removeSeries('big-data')

// Destroy chart
chart.destroy()

// Release references
largeArray = null
```

## React Version

```tsx
import { useMemo } from 'react'
import { SciChart } from 'scichart-engine/react'

function LargeDatasetChart() {
  const series = useMemo(() => {
    const n = 1000000
    const x = new Float32Array(n)
    const y = new Float32Array(n)
    
    for (let i = 0; i < n; i++) {
      x[i] = i
      y[i] = Math.sin(i * 0.0001) * Math.cos(i * 0.00003) + Math.random() * 0.1
    }
    
    return [{ id: 'big', x, y, color: '#a855f7' }]
  }, [])

  return (
    <SciChart
      series={series}
      xAxis={{ label: 'Index', auto: true }}
      yAxis={{ label: 'Value', auto: true }}
      showControls={true}
      height="400px"
    />
  )
}
```

## Performance Tips

1. **Generate data off-thread** - Use Web Workers for computation
2. **Use Float32** - Half the memory of Float64
3. **Downsample for display** - Full data for analysis, sampled for view
4. **Clean up** - Remove unused series, destroy charts
5. **Monitor FPS** - Adjust if performance drops
