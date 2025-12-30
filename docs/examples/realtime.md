# Real-time Streaming

Stream data continuously with smooth updates.

<script setup>
import { ref } from 'vue'
</script>

## Demo

<ChartDemo type="realtime" height="400px" />

## Key Features

- **Continuous streaming** at 60 FPS
- **Varying waveforms** that change over time
- **Pause/Resume** control
- **Auto-scaling** view

## Code

```typescript
import { createChart } from 'scichart-engine'

const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'Time', auto: true },
  yAxis: { label: 'Value', auto: true },
  showControls: true,
})

// Data storage
let dataX = new Float32Array(0)
let dataY = new Float32Array(0)
let t = 0

// Create empty series
chart.addSeries({
  id: 'stream',
  type: 'line',
  data: { x: dataX, y: dataY },
  style: { color: '#00f2ff', width: 1.5 },
})

// Animation loop
function animate() {
  const batchSize = 10  // Points per frame
  
  // Expand arrays
  const newX = new Float32Array(dataX.length + batchSize)
  const newY = new Float32Array(dataY.length + batchSize)
  newX.set(dataX)
  newY.set(dataY)
  
  // Generate new points
  for (let i = 0; i < batchSize; i++) {
    const idx = dataX.length + i
    newX[idx] = t
    newY[idx] = Math.sin(t * 0.02) + Math.random() * 0.1
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

## Key Points

### 1. Use requestAnimationFrame

Sync updates with the display refresh rate:

```typescript
// ✅ Good - synced with display
function animate() {
  updateData()
  requestAnimationFrame(animate)
}

// ❌ Bad - arbitrary timing
setInterval(updateData, 1)
```

### 2. Batch Points

Add multiple points per frame for efficiency:

```typescript
// ✅ Good - 10 points per frame
const batchSize = 10
for (let i = 0; i < batchSize; i++) {
  newX[idx + i] = t
  newY[idx + i] = getValue()
  t += 0.1
}

// ❌ Bad - 1 point per frame
newX[idx] = t
newY[idx] = getValue()
```

### 3. Efficient Array Growth

Pre-allocate and copy:

```typescript
// Expand arrays efficiently
const newX = new Float32Array(dataX.length + batchSize)
newX.set(dataX)  // Copy existing data
// Add new points...
dataX = newX
```

## Varying Waveforms

The demo shows different waveforms over time:

```typescript
function getSignal(t) {
  const phase = Math.floor(t / 500) % 4
  
  switch (phase) {
    case 0: // Sine wave
      return Math.sin(t * 0.02)
    case 1: // Square-ish wave
      return Math.sin(t * 0.02) + Math.sin(t * 0.06) / 3
    case 2: // Sawtooth
      return ((t * 0.01) % (2 * Math.PI)) / Math.PI - 1
    case 3: // FM modulation
      return Math.sin(t * 0.02 + Math.sin(t * 0.002) * 3)
  }
}
```

## Rolling Window

Limit memory by keeping only recent data:

```typescript
const MAX_POINTS = 10000

function updateWithWindow() {
  // Add new points...
  
  // Trim if too large
  if (dataX.length > MAX_POINTS) {
    dataX = dataX.slice(-MAX_POINTS)
    dataY = dataY.slice(-MAX_POINTS)
  }
  
  chart.updateSeries('stream', { x: dataX, y: dataY })
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

## React Version

```tsx
import { useRef, useEffect, useState } from 'react'
import { SciChart, type SciChartRef } from 'scichart-engine/react'

function RealtimeChart() {
  const chartRef = useRef<SciChartRef>(null)
  const dataRef = useRef({ x: new Float32Array(0), y: new Float32Array(0) })
  const tRef = useRef(0)
  const [isRunning, setIsRunning] = useState(true)

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
      if (!isRunning) return

      const prev = dataRef.current
      const newX = new Float32Array(prev.x.length + 10)
      const newY = new Float32Array(prev.y.length + 10)
      newX.set(prev.x)
      newY.set(prev.y)

      for (let i = 0; i < 10; i++) {
        const idx = prev.x.length + i
        newX[idx] = tRef.current
        newY[idx] = Math.sin(tRef.current * 0.02) + Math.random() * 0.1
        tRef.current += 0.1
      }

      dataRef.current = { x: newX, y: newY }
      chart.updateSeries('stream', { x: newX, y: newY })

      animationId = requestAnimationFrame(animate)
    }

    if (isRunning) {
      animationId = requestAnimationFrame(animate)
    }

    return () => cancelAnimationFrame(animationId)
  }, [isRunning])

  return (
    <div>
      <button onClick={() => setIsRunning(!isRunning)}>
        {isRunning ? 'Pause' : 'Start'}
      </button>
      <SciChart ref={chartRef} series={[]} height="400px" />
    </div>
  )
}
```

## WebSocket Integration

```typescript
const ws = new WebSocket('wss://data-server.example.com')

ws.onmessage = (event) => {
  const points = JSON.parse(event.data)
  
  const newX = new Float32Array(dataX.length + points.length)
  const newY = new Float32Array(dataY.length + points.length)
  newX.set(dataX)
  newY.set(dataY)
  
  points.forEach((p, i) => {
    newX[dataX.length + i] = p.time
    newY[dataY.length + i] = p.value
  })
  
  dataX = newX
  dataY = newY
  
  chart.updateSeries('stream', { x: dataX, y: dataY })
}
```
