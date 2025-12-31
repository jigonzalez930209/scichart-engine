---
title: Real-time Streaming
description: High-performance live data visualization with configurable rolling windows
---

# Real-time Streaming

High-performance data streaming is critical for many scientific applications, especially in electrochemistry where you might want to visualize data as it's being acquired from a sensor or potentiostat.

SciChart Engine provides optimized methods for appending data without recreating GPU buffers, enabling smooth visualization of millions of points in real-time.

## Interactive Demo

Use the controls below to start the live data stream. **Select a window size** to see how rolling windows affect performance and memory:

<ChartDemo type="realtime" height="500px" />

## Key Features

- **`appendData()`**: Add points to an existing series with $O(1)$ GPU overhead.
- **`autoScroll`**: Automatically track the latest data points.
- **`maxPoints`**: Implement a rolling window to keep only the most recent data.
- **Circular Buffers**: Internal optimizations for constant-time updates.

## Window Size Options

| Window Size | Memory Usage | Use Case |
|-------------|--------------|----------|
| **10,000** | ~80 KB | Quick experiments, low-power devices |
| **20,000** | ~160 KB | Standard real-time monitoring |
| **50,000** | ~400 KB | Detailed analysis with history |
| **100,000** | ~800 KB | Extended observation windows |
| **Infinite** | Unlimited | Post-acquisition analysis (careful!) |

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
  data: { x: new Float32Array(0), y: new Float32Array(0) },
  maxPoints: 50000 // Keep last 50k points (rolling window)
});

// Simulate 100Hz data acquisition
setInterval(() => {
  const x = new Float32Array([performance.now() / 1000]);
  const y = new Float32Array([Math.sin(x[0])]);
  chart.appendData('signal', x, y);
}, 10);
```

## Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `autoScroll` | `boolean` | If true, the chart will follow the data if the user is currently zoomed into the "end" of the data area. |
| `maxPoints` | `number \| undefined` | The maximum number of points to keep in memory for a series. When exceeded, the oldest points are discarded. Omit for infinite. |
| `append` | `boolean` | Set to true in `updateData` to use the optimized append mode. |

## Changing Window Size Dynamically

```typescript
// Update the rolling window size
chart.setMaxPoints('signal', 20000);
```

## Performance Considerations

For maximum performance:

1. **Use `Float32Array`** - More memory-efficient than `Float64Array` or regular arrays.
2. **Batch points** - Append 10-50 points every frame instead of 1 point per callback.
3. **Set appropriate `maxPoints`** - Prevents unbounded memory growth.
4. **Use GPU downsampling** - Enable LTTB if visualizing >1M points.

## Stress Test

The demo above runs a stress test generating **25 points per animation frame** (~1,500 points/second at 60fps). Even at this rate, a 50K window provides:

- **33 seconds** of visible history
- **Smooth 60 FPS** rendering
- **~400 KB** memory footprint

## Use Cases

- **Electrochemistry**: Potentiostat data streaming during CV/LSV experiments
- **IoT Sensors**: Temperature, pressure, humidity monitoring
- **Signal Processing**: Oscilloscope-style waveform visualization
- **Financial Data**: Live price feeds and tick data
