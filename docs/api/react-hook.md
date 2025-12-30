# useSciChart Hook

Low-level React hook for imperative chart control.

## Import

```tsx
import { useSciChart } from 'scichart-engine/react'
// or
import { useSciChart } from 'scichart-engine'
```

## Signature

```typescript
function useSciChart(options?: UseSciChartOptions): UseSciChartReturn
```

## Options

```typescript
interface UseSciChartOptions {
  xAxis?: AxisOptions
  yAxis?: AxisOptions
  theme?: string | ChartTheme
  background?: string
  showControls?: boolean
  showLegend?: boolean
}
```

## Returns

```typescript
interface UseSciChartReturn {
  containerRef: React.RefObject<HTMLDivElement>
  chart: Chart | null
  isReady: boolean
  addSeries: (options: SeriesOptions) => void
  updateSeries: (id: string, data: SeriesUpdateData) => void
  removeSeries: (id: string) => void
  zoom: (options: ZoomOptions) => void
  resetZoom: () => void
  bounds: Bounds
}
```

## Basic Usage

```tsx
import { useSciChart } from 'scichart-engine/react'

function MyChart() {
  const { containerRef, addSeries, isReady } = useSciChart({
    xAxis: { label: 'X', auto: true },
    yAxis: { label: 'Y', auto: true },
  })

  useEffect(() => {
    if (isReady) {
      addSeries({
        id: 'data',
        type: 'line',
        data: {
          x: new Float32Array([0, 1, 2, 3, 4]),
          y: new Float32Array([0, 1, 4, 9, 16]),
        },
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

## Real-time Updates

```tsx
function RealtimeChart() {
  const { containerRef, updateSeries, addSeries, isReady } = useSciChart()
  const dataRef = useRef({ x: new Float32Array(0), y: new Float32Array(0) })
  const tRef = useRef(0)

  useEffect(() => {
    if (!isReady) return

    addSeries({
      id: 'stream',
      type: 'line',
      data: dataRef.current,
      style: { color: '#00f2ff' },
    })

    const interval = setInterval(() => {
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
      updateSeries('stream', { x: newX, y: newY })
    }, 50)

    return () => clearInterval(interval)
  }, [isReady, addSeries, updateSeries])

  return <div ref={containerRef} style={{ height: '400px' }} />
}
```

## Accessing Chart Instance

```tsx
function ChartWithControls() {
  const { containerRef, chart, isReady, bounds } = useSciChart()

  const handleExport = () => {
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
      <div>
        <button onClick={handleExport} disabled={!isReady}>
          Export PNG
        </button>
        <span>
          View: X[{bounds.xMin.toFixed(2)}, {bounds.xMax.toFixed(2)}]
        </span>
      </div>
      <div ref={containerRef} style={{ height: '400px' }} />
    </div>
  )
}
```

## When to Use

Use `useSciChart` when you need:
- Full control over chart lifecycle
- Custom container styling
- Direct access to chart instance
- Integration with complex state management

Use `<SciChart>` component when you want:
- Simpler declarative API
- Automatic series management
- Less boilerplate code
