# Large Datasets

Handle millions of data points efficiently with SciChart Engine.

<script setup>
import { ref } from 'vue'
</script>

## Interactive Demo - 1 Million Points

<ChartDemo type="large" height="400px" :points="1000000" />

## Why Large Datasets?

Scientific and industrial applications often require visualizing:

- **Sensor data**: Millions of measurements over time
- **Financial data**: High-frequency trading with tick-by-tick data
- **Signal processing**: Audio, RF, or biomedical signals
- **Simulations**: Large-scale numerical results

## Loading Large Data

### Synchronous Generation

```typescript
const n = 1000000  // 1 million points
const x = new Float32Array(n)
const y = new Float32Array(n)

for (let i = 0; i < n; i++) {
  x[i] = i
  y[i] = Math.sin(i * 0.0001) + Math.random() * 0.1
}

chart.addSeries({
  id: 'big-data',
  data: { x, y },
  style: { color: '#00f2ff' },
})
```

### Chunked Loading (Non-blocking)

For very large datasets, load in chunks to avoid blocking the UI:

```typescript
async function loadLargeDataset(totalPoints, chunkSize = 100000) {
  const x = new Float32Array(totalPoints)
  const y = new Float32Array(totalPoints)
  
  for (let offset = 0; offset < totalPoints; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, totalPoints)
    
    // Generate chunk
    for (let i = offset; i < end; i++) {
      x[i] = i
      y[i] = computeValue(i)
    }
    
    // Update progress
    updateProgress((offset / totalPoints) * 100)
    
    // Yield to UI
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  
  chart.addSeries({
    id: 'data',
    data: { x, y },
  })
}
```

### Web Worker Loading

Offload data generation to a worker:

```typescript
// main.ts
const worker = new Worker('data-worker.js')

worker.postMessage({ type: 'generate', count: 10000000 })

worker.onmessage = (e) => {
  const { x, y } = e.data
  chart.addSeries({
    id: 'data',
    data: { x, y },
  })
}
```

```javascript
// data-worker.js
self.onmessage = (e) => {
  if (e.data.type === 'generate') {
    const n = e.data.count
    const x = new Float32Array(n)
    const y = new Float32Array(n)
    
    for (let i = 0; i < n; i++) {
      x[i] = i
      y[i] = Math.sin(i * 0.00001) + Math.random() * 0.1
    }
    
    self.postMessage({ x, y }, [x.buffer, y.buffer])
  }
}
```

## Downsampling

For datasets too large to display efficiently, use LTTB (Largest Triangle Three Buckets) downsampling:

```typescript
import { downsampleLTTB } from 'scichart-engine'

// Original: 10 million points
const originalX = new Float32Array(10000000)
const originalY = new Float32Array(10000000)
// ... fill data

// Downsample to 10,000 points for display
const { x, y } = downsampleLTTB(originalX, originalY, 10000)

chart.addSeries({
  id: 'downsampled',
  data: { x, y },
})
```

### LTTB Benefits

- **Preserves visual shape**: Keeps peaks, valleys, and trends
- **Dramatic reduction**: 10M → 10k points (1000x reduction)
- **Fast**: O(n) algorithm

### Dynamic Downsampling

Adjust downsampling based on zoom level:

```typescript
let fullData = { x: originalX, y: originalY }

chart.on('zoom', ({ x }) => {
  const visibleRange = x[1] - x[0]
  const fullRange = fullData.x[fullData.x.length - 1] - fullData.x[0]
  const zoomRatio = fullRange / visibleRange
  
  // More points when zoomed in
  const targetPoints = Math.min(
    fullData.x.length,
    Math.floor(10000 * zoomRatio)
  )
  
  const { x: sampledX, y: sampledY } = downsampleLTTB(
    fullData.x,
    fullData.y,
    targetPoints
  )
  
  chart.updateSeries('data', { x: sampledX, y: sampledY })
})
```

## Memory Optimization

### Memory Usage

| Points | Float32 | Float64 |
|--------|---------|---------|
| 100k | 0.8 MB | 1.6 MB |
| 1M | 8 MB | 16 MB |
| 10M | 80 MB | 160 MB |
| 100M | 800 MB | 1.6 GB |

### Use Float32 When Possible

```typescript
// ✅ Float32 - 4 bytes per value
const x = new Float32Array(n)

// Float64 - 8 bytes per value (only if needed)
const x = new Float64Array(n)
```

### Release Unused Data

```typescript
// Remove series when not needed
chart.removeSeries('old-data')

// Set references to null
largeDataArray = null
```

## Virtualization

For extremely large datasets, only load visible data:

```typescript
class VirtualDataSource {
  constructor(totalPoints) {
    this.totalPoints = totalPoints
    this.cache = new Map()
  }
  
  getRange(start, end) {
    const key = `${start}-${end}`
    
    if (!this.cache.has(key)) {
      const x = new Float32Array(end - start)
      const y = new Float32Array(end - start)
      
      for (let i = 0; i < end - start; i++) {
        x[i] = start + i
        y[i] = this.computeValue(start + i)
      }
      
      this.cache.set(key, { x, y })
    }
    
    return this.cache.get(key)
  }
  
  computeValue(i) {
    return Math.sin(i * 0.0001)
  }
}

const dataSource = new VirtualDataSource(100000000)  // 100M virtual points

chart.on('zoom', ({ x }) => {
  const start = Math.floor(x[0])
  const end = Math.ceil(x[1])
  const data = dataSource.getRange(start, end)
  chart.updateSeries('data', data)
})
```

## File Loading

### CSV

```typescript
async function loadCSV(url) {
  const response = await fetch(url)
  const text = await response.text()
  const lines = text.trim().split('\n')
  
  const x = new Float32Array(lines.length - 1)
  const y = new Float32Array(lines.length - 1)
  
  for (let i = 1; i < lines.length; i++) {
    const [xVal, yVal] = lines[i].split(',')
    x[i - 1] = parseFloat(xVal)
    y[i - 1] = parseFloat(yVal)
  }
  
  return { x, y }
}
```

### Binary

```typescript
async function loadBinary(url) {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  
  // Assuming format: [count: uint32][x: float32[]][y: float32[]]
  const view = new DataView(buffer)
  const count = view.getUint32(0, true)
  
  const x = new Float32Array(buffer, 4, count)
  const y = new Float32Array(buffer, 4 + count * 4, count)
  
  return { x, y }
}
```

## Best Practices

1. **Start with downsampling** - Display 10k points, load full data on zoom
2. **Use Float32** - Unless you need Float64 precision
3. **Load progressively** - Show data as it loads
4. **Monitor memory** - Watch for leaks with large datasets
5. **Clean up** - Remove unused series and null references
