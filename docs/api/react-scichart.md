# SciChart Component

React component for declarative chart creation.

## Import

```tsx
import { SciChart } from 'scichart-engine/react'
// or
import { SciChart } from 'scichart-engine'
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `series` | `SciChartSeries[]` | `[]` | Array of series to display |
| `xAxis` | `AxisOptions` | `{ auto: true }` | X-axis configuration |
| `yAxis` | `AxisOptions` | `{ auto: true }` | Y-axis configuration |
| `theme` | `string \| ChartTheme` | `'dark'` | Theme name or object |
| `background` | `string` | Theme default | Background color |
| `height` | `string \| number` | `'100%'` | Chart height |
| `width` | `string \| number` | `'100%'` | Chart width |
| `showControls` | `boolean` | `false` | Show toolbar |
| `showLegend` | `boolean` | `false` | Show legend |
| `cursor` | `CursorOptions` | `undefined` | Cursor configuration |
| `ref` | `React.Ref<SciChartRef>` | - | Ref for imperative access |

### SciChartSeries

```typescript
interface SciChartSeries {
  id: string
  x: Float32Array | Float64Array
  y: Float32Array | Float64Array
  color?: string
  type?: 'line' | 'scatter' | 'both'
  width?: number
  pointSize?: number
  visible?: boolean
  name?: string
}
```

## Basic Usage

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

## With Controls and Legend

```tsx
<SciChart
  series={series}
  xAxis={{ label: 'Time (s)', auto: true }}
  yAxis={{ label: 'Value', auto: true }}
  theme="midnight"
  showControls={true}
  showLegend={true}
  cursor={{ enabled: true, crosshair: true, snap: true }}
  height="500px"
/>
```

## Imperative Access

Use a ref to access the underlying chart instance:

```tsx
import { useRef } from 'react'
import { SciChart, type SciChartRef } from 'scichart-engine/react'

function MyChart() {
  const chartRef = useRef<SciChartRef>(null)

  const handleZoomIn = () => {
    const chart = chartRef.current?.getChart()
    if (chart) {
      const bounds = chart.getViewBounds()
      const xCenter = (bounds.xMin + bounds.xMax) / 2
      const yCenter = (bounds.yMin + bounds.yMax) / 2
      const xRange = (bounds.xMax - bounds.xMin) * 0.5
      const yRange = (bounds.yMax - bounds.yMin) * 0.5
      
      chart.zoom({
        x: [xCenter - xRange/2, xCenter + xRange/2],
        y: [yCenter - yRange/2, yCenter + yRange/2],
      })
    }
  }

  return (
    <>
      <button onClick={handleZoomIn}>Zoom In</button>
      <SciChart ref={chartRef} series={series} />
    </>
  )
}
```

## SciChartRef Methods

```typescript
interface SciChartRef {
  getChart(): Chart | null
}
```

The `getChart()` method returns the underlying Chart instance, giving you access to all [Chart API](/api/chart) methods.

## Dynamic Data Updates

The component automatically updates when series data changes:

```tsx
function RealtimeChart() {
  const [data, setData] = useState({
    x: new Float32Array(0),
    y: new Float32Array(0),
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newX = new Float32Array(prev.x.length + 1)
        const newY = new Float32Array(prev.y.length + 1)
        newX.set(prev.x)
        newY.set(prev.y)
        
        const t = prev.x.length
        newX[t] = t
        newY[t] = Math.sin(t * 0.1)
        
        return { x: newX, y: newY }
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const series = [{
    id: 'realtime',
    x: data.x,
    y: data.y,
    color: '#00f2ff',
  }]

  return <SciChart series={series} />
}
```

## Multiple Series

```tsx
function MultiSeriesChart() {
  const series = [
    {
      id: 'temperature',
      x: timeData,
      y: tempData,
      color: '#ff6b6b',
      name: 'Temperature',
    },
    {
      id: 'humidity',
      x: timeData,
      y: humidityData,
      color: '#4ecdc4',
      name: 'Humidity',
    },
  ]

  return (
    <SciChart
      series={series}
      showLegend={true}
      height="400px"
    />
  )
}
```

## Performance Tips

For high-frequency updates with large datasets:

1. **Use refs for data** - Avoid React state for the actual data arrays
2. **Use imperative API** - Call `chart.updateSeries()` directly
3. **Throttle updates** - Don't update faster than 60fps

```tsx
function HighPerformanceChart() {
  const chartRef = useRef<SciChartRef>(null)
  const dataRef = useRef({ x: new Float32Array(0), y: new Float32Array(0) })

  useEffect(() => {
    let animationId: number

    const animate = () => {
      const chart = chartRef.current?.getChart()
      if (chart) {
        // Update data directly without React state
        const newData = generateNewData()
        dataRef.current = newData
        
        chart.updateSeries('data', newData)
      }
      animationId = requestAnimationFrame(animate)
    }

    // Add initial series
    const chart = chartRef.current?.getChart()
    if (chart) {
      chart.addSeries({
        id: 'data',
        type: 'line',
        data: dataRef.current,
        style: { color: '#00f2ff' },
      })
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [])

  return <SciChart ref={chartRef} series={[]} />
}
```
