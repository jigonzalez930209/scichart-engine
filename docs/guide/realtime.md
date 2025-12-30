# Real-time Data

Stream and visualize data in real-time with SciChart Engine.

<script setup>
import { ref } from 'vue'
</script>

## Interactive Demo

<ChartDemo type="realtime" height="400px" />

## Basic Streaming

### Setup

```typescript
import { createChart } from 'scichart-engine'

const chart = createChart({
  container,
  xAxis: { label: 'Time', auto: true },
  yAxis: { label: 'Value', auto: true },
})

// Create empty series
chart.addSeries({
  id: 'stream',
  type: 'line',
  data: { 
    x: new Float32Array(0), 
    y: new Float32Array(0) 
  },
  style: { color: '#00f2ff' },
})
```

### Append Data

```typescript
// Append new points
chart.updateSeries('stream', {
  x: new Float32Array([newTime]),
  y: new Float32Array([newValue]),
  append: true,
})
```

## Efficient Streaming Pattern

For high-frequency updates, use `requestAnimationFrame` and batch points:

```typescript
let dataX = new Float32Array(0)
let dataY = new Float32Array(0)
let t = 0

function animate() {
  // Generate batch of points
  const batchSize = 10
  const newX = new Float32Array(dataX.length + batchSize)
  const newY = new Float32Array(dataY.length + batchSize)
  
  newX.set(dataX)
  newY.set(dataY)
  
  for (let i = 0; i < batchSize; i++) {
    const idx = dataX.length + i
    newX[idx] = t
    newY[idx] = Math.sin(t * 0.1) + Math.random() * 0.1
    t += 0.1
  }
  
  dataX = newX
  dataY = newY
  
  // Update chart
  chart.updateSeries('stream', { x: dataX, y: dataY })
  
  requestAnimationFrame(animate)
}

requestAnimationFrame(animate)
```

## Rolling Window

Keep only the last N points to limit memory:

```typescript
const MAX_POINTS = 10000

function appendWithWindow(newPoints) {
  const combined = {
    x: new Float32Array(dataX.length + newPoints.length),
    y: new Float32Array(dataY.length + newPoints.length),
  }
  
  combined.x.set(dataX)
  combined.y.set(dataY)
  combined.x.set(newPoints.x, dataX.length)
  combined.y.set(newPoints.y, dataY.length)
  
  // Trim to window size
  if (combined.x.length > MAX_POINTS) {
    const start = combined.x.length - MAX_POINTS
    dataX = combined.x.slice(start)
    dataY = combined.y.slice(start)
  } else {
    dataX = combined.x
    dataY = combined.y
  }
  
  chart.updateSeries('stream', { x: dataX, y: dataY })
}
```

## WebSocket Integration

```typescript
const ws = new WebSocket('wss://data-server.example.com')

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  // Batch incoming points
  const x = new Float32Array(data.map(d => d.timestamp))
  const y = new Float32Array(data.map(d => d.value))
  
  chart.updateSeries('stream', { x, y, append: true })
}
```

## Multiple Real-time Series

```typescript
// Create multiple streams
chart.addSeries({
  id: 'sensor-1',
  data: { x: new Float32Array(0), y: new Float32Array(0) },
  style: { color: '#ff6b6b' },
})

chart.addSeries({
  id: 'sensor-2',
  data: { x: new Float32Array(0), y: new Float32Array(0) },
  style: { color: '#4ecdc4' },
})

// Update each independently
function onSensorData(sensorId, time, value) {
  chart.updateSeries(`sensor-${sensorId}`, {
    x: new Float32Array([time]),
    y: new Float32Array([value]),
    append: true,
  })
}
```

## React Pattern

```tsx
function RealtimeChart() {
  const chartRef = useRef<SciChartRef>(null)
  const dataRef = useRef({ x: new Float32Array(0), y: new Float32Array(0) })
  const tRef = useRef(0)

  useEffect(() => {
    const chart = chartRef.current?.getChart()
    if (!chart) return

    chart.addSeries({
      id: 'stream',
      type: 'line',
      data: dataRef.current,
      style: { color: '#00f2ff' },
    })

    let animationId: number

    const animate = () => {
      const prev = dataRef.current
      const newX = new Float32Array(prev.x.length + 10)
      const newY = new Float32Array(prev.y.length + 10)
      newX.set(prev.x)
      newY.set(prev.y)

      for (let i = 0; i < 10; i++) {
        const idx = prev.x.length + i
        newX[idx] = tRef.current
        newY[idx] = Math.sin(tRef.current * 0.1)
        tRef.current += 0.1
      }

      dataRef.current = { x: newX, y: newY }
      chart.updateSeries('stream', { x: newX, y: newY })

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [])

  return <SciChart ref={chartRef} series={[]} />
}
```

## Performance Tips

### 1. Batch Updates

```typescript
// ✅ Good - batch 10-100 points per frame
const BATCH_SIZE = 10

function animate() {
  const newPoints = generatePoints(BATCH_SIZE)
  chart.updateSeries('stream', { ...newPoints, append: true })
  requestAnimationFrame(animate)
}
```

### 2. Use requestAnimationFrame

```typescript
// ✅ Good - synced with display
requestAnimationFrame(animate)

// ❌ Bad - arbitrary timing
setInterval(update, 1)
```

### 3. Avoid React State for Data

```typescript
// ✅ Good - use refs
const dataRef = useRef({ x: new Float32Array(0), y: new Float32Array(0) })

// ❌ Bad - causes re-renders
const [data, setData] = useState({ x: new Float32Array(0), y: new Float32Array(0) })
```

### 4. Limit Total Points

```typescript
const MAX_POINTS = 100000

if (dataX.length > MAX_POINTS) {
  // Remove oldest points
  dataX = dataX.slice(-MAX_POINTS)
  dataY = dataY.slice(-MAX_POINTS)
}
```

## Auto-scrolling View

Keep the latest data visible:

```typescript
function updateWithAutoScroll(newData) {
  chart.updateSeries('stream', { ...newData, append: true })
  
  // Auto-scroll to show latest data
  const bounds = chart.getSeries('stream').getBounds()
  const windowSize = 100  // Show last 100 units
  
  chart.zoom({
    x: [bounds.xMax - windowSize, bounds.xMax],
  })
}
```

## Pause/Resume

```typescript
let isRunning = true
let animationId = null

function start() {
  isRunning = true
  animate()
}

function pause() {
  isRunning = false
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
}

function animate() {
  if (!isRunning) return
  
  // Update data...
  
  animationId = requestAnimationFrame(animate)
}
```
