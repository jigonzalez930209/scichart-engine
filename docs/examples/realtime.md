# Real-time Streaming

High-performance data streaming is critical for many scientific applications, especially in electrochemistry where you might want to visualize data as it's being acquired from a sensor or potentiostat.

SciChart Engine provides optimized methods for appending data without recreating GPU buffers, enabling smooth visualization of millions of points in real-time.

## Key Features

- **`appendData()`**: Add points to an existing series with $O(1)$ GPU overhead.
- **`autoScroll`**: Automatically track the latest data points.
- **`maxPoints`**: Implement a rolling window to keep only the most recent data.
- **Circular Buffers**: Internal optimizations for constant-time updates.

## Basic Usage

```typescript
const chart = createChart({
  container: document.getElementById('chart'),
  autoScroll: true, // Enable automatic following of new data
  xAxis: { label: 'Time (s)' },
  yAxis: { label: 'Current (µA)' }
});

chart.addSeries({
  id: 'signal',
  type: 'line',
  data: { x: [], y: [] },
  maxPoints: 10000 // Keep last 10k points (Rolling Window)
});

// simulate 100Hz data acquisition
setInterval(() => {
  const x = [Date.now() / 1000];
  const y = [Math.sin(x[0])];
  chart.appendData('signal', x, y);
}, 10);
```

<ChartDemo type="real-time" />

## Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `autoScroll` | `boolean` | If true, the chart will follow the data if the user is currently zoomed into the "end" of the data area. |
| `maxPoints` | `number` | The maximum number of points to keep in memory for a series. When exceeded, the oldest points are discarded. |
| `append` | `boolean` | Set to true in `updateData` to use the optimized append mode. |

## Performance Considerations

For maximum performance:
1. Use `Float32Array` or `Float64Array` instead of regular arrays.
2. Batch points if possible (e.g., append 10 points every 100ms instead of 1 point every 10ms).
3. Enable `LTTB` downsampling if visualizing extremely long datasets (>1M points).
