# React Integration

Use SciChart Engine with React components and hooks.

<script setup>
import { ref } from 'vue'
</script>

## Demo

<ChartDemo type="multi" height="400px" />

## SciChart Component

The simplest way to use SciChart Engine in React:

```tsx
import { SciChart } from 'scichart-engine/react'

function MyChart() {
  const series = [{
    id: 'data',
    x: new Float32Array([0, 1, 2, 3, 4]),
    y: new Float32Array([0, 1, 4, 9, 16]),
    color: '#00f2ff',
  }]

  return (
    <SciChart
      series={series}
      xAxis={{ label: 'X', auto: true }}
      yAxis={{ label: 'Y', auto: true }}
      height="400px"
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `series` | `SciChartSeries[]` | `[]` | Data series to display |
| `xAxis` | `AxisOptions` | `{ auto: true }` | X-axis config |
| `yAxis` | `AxisOptions` | `{ auto: true }` | Y-axis config |
| `theme` | `string` | `'dark'` | Theme name |
| `height` | `string` | `'100%'` | Chart height |
| `showControls` | `boolean` | `false` | Show toolbar |
| `showLegend` | `boolean` | `false` | Show legend |
| `cursor` | `CursorOptions` | - | Cursor config |

## Multiple Series

```tsx
function MultiSeriesChart() {
  const n = 1000
  const x = new Float32Array(n)
  const y1 = new Float32Array(n)
  const y2 = new Float32Array(n)
  const y3 = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    x[i] = i / 100
    y1[i] = Math.sin(x[i])
    y2[i] = Math.cos(x[i])
    y3[i] = Math.sin(x[i] * 2) * 0.5
  }

  const series = [
    { id: 'sin', x, y: y1, color: '#ff6b6b', name: 'Sin' },
    { id: 'cos', x, y: y2, color: '#4ecdc4', name: 'Cos' },
    { id: 'sin2', x, y: y3, color: '#ffe66d', name: 'Sin 2x' },
  ]

  return (
    <SciChart
      series={series}
      showLegend={true}
      showControls={true}
      height="400px"
    />
  )
}
```

## Dynamic Data with State

```tsx
import { useState, useCallback } from 'react'

function DynamicChart() {
  const [data, setData] = useState(() => {
    const n = 100
    const x = new Float32Array(n)
    const y = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      x[i] = i
      y[i] = Math.random()
    }
    return { x, y }
  })

  const addPoint = useCallback(() => {
    setData(prev => {
      const n = prev.x.length
      const newX = new Float32Array(n + 1)
      const newY = new Float32Array(n + 1)
      newX.set(prev.x)
      newY.set(prev.y)
      newX[n] = n
      newY[n] = Math.random()
      return { x: newX, y: newY }
    })
  }, [])

  return (
    <div>
      <button onClick={addPoint}>Add Point</button>
      <SciChart
        series={[{ id: 'data', ...data, color: '#00f2ff' }]}
        height="400px"
      />
    </div>
  )
}
```

## Imperative Control with Ref

For advanced control, use a ref to access the chart instance:

```tsx
import { useRef } from 'react'
import { SciChart, type SciChartRef } from 'scichart-engine/react'

function ControlledChart() {
  const chartRef = useRef<SciChartRef>(null)

  const zoomIn = () => {
    const chart = chartRef.current?.getChart()
    if (chart) {
      const b = chart.getViewBounds()
      const xRange = (b.xMax - b.xMin) * 0.4
      const yRange = (b.yMax - b.yMin) * 0.4
      chart.zoom({
        x: [b.xMin + xRange, b.xMax - xRange],
        y: [b.yMin + yRange, b.yMax - yRange],
      })
    }
  }

  const reset = () => {
    chartRef.current?.getChart()?.resetZoom()
  }

  const exportPNG = () => {
    const chart = chartRef.current?.getChart()
    if (chart) {
      const dataUrl = chart.exportImage('png')
      const link = document.createElement('a')
      link.download = 'chart.png'
      link.href = dataUrl
      link.click()
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={zoomIn}>Zoom In</button>
        <button onClick={reset}>Reset</button>
        <button onClick={exportPNG}>Export PNG</button>
      </div>
      <SciChart
        ref={chartRef}
        series={series}
        height="400px"
      />
    </div>
  )
}
```

## Real-time Streaming

For high-performance streaming, use refs to avoid React re-renders:

```tsx
import { useRef, useEffect, useState } from 'react'
import { SciChart, type SciChartRef } from 'scichart-engine/react'

function RealtimeChart() {
  const chartRef = useRef<SciChartRef>(null)
  const dataRef = useRef({ x: new Float32Array(0), y: new Float32Array(0) })
  const tRef = useRef(0)
  const [pointCount, setPointCount] = useState(0)

  useEffect(() => {
    const chart = chartRef.current?.getChart()
    if (!chart) return

    // Add series imperatively
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
        newY[idx] = Math.sin(tRef.current * 0.02) + Math.random() * 0.1
        tRef.current += 0.1
      }

      dataRef.current = { x: newX, y: newY }
      
      // Update chart directly (no React state!)
      chart.updateSeries('stream', { x: newX, y: newY })
      
      // Only update count occasionally
      if (newX.length % 100 === 0) {
        setPointCount(newX.length)
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div>
      <p>{pointCount.toLocaleString()} points</p>
      <SciChart
        ref={chartRef}
        series={[]}  // Empty - managed imperatively
        height="400px"
      />
    </div>
  )
}
```

## useSciChart Hook

For more control, use the hook directly:

```tsx
import { useSciChart } from 'scichart-engine/react'

function HookChart() {
  const { 
    containerRef, 
    chart, 
    isReady, 
    addSeries, 
    updateSeries 
  } = useSciChart({
    xAxis: { label: 'X', auto: true },
    yAxis: { label: 'Y', auto: true },
  })

  useEffect(() => {
    if (isReady) {
      addSeries({
        id: 'data',
        type: 'line',
        data: generateData(),
        style: { color: '#00f2ff' },
      })
    }
  }, [isReady, addSeries])

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: '400px' }}
    />
  )
}
```

## Theme Sync

Sync chart theme with your app's theme:

```tsx
function ThemedChart({ isDark }) {
  return (
    <SciChart
      series={series}
      theme={isDark ? 'midnight' : 'light'}
      height="400px"
    />
  )
}
```

## Performance Tips

1. **Use `useMemo` for static data**:
```tsx
const series = useMemo(() => generateSeries(), [])
```

2. **Use refs for streaming data** - Avoid React state for high-frequency updates

3. **Use imperative API for updates** - Call `chart.updateSeries()` directly

4. **Clean up on unmount** - The component handles this automatically
