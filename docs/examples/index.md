# Examples

Interactive examples demonstrating SciChart Engine capabilities.

<script setup>
import { ref } from 'vue'
</script>

## Interactive Demos

Each example includes a live demo that responds to the documentation theme (try toggling dark/light mode!).

### Basic Chart

A simple line chart with 10,000 points demonstrating core features.

<ChartDemo type="basic" height="300px" :points="10000" />

[View full example →](/examples/basic)

---

### Real-time Streaming

Continuous data streaming with varying waveforms.

<ChartDemo type="realtime" height="300px" />

[View full example →](/examples/realtime)

---

### Large Datasets

1 million points rendered at 60 FPS.

<ChartDemo type="large" height="300px" :points="1000000" />

[View full example →](/examples/large-datasets)

---

### Multiple Series

Multiple data series with different colors.

<ChartDemo type="multi" height="300px" />

[View full example →](/examples/react)

---

### Curve Fitting

Automatic trend lines and regression analysis (Linear, Polynomial, etc.).

<ChartDemo type="fitting" height="300px" />

[View full example →](/examples/curve-fitting)

---

### Peak Analysis

Baseline correction and area integration for scientific signals.

<ChartDemo type="analysis" height="300px" />

[View full example →](/examples/analysis)

---

### Bar Charts

Categorical and discrete data visualization with automatic layout.

<ChartDemo type="bar" height="300px" />

[View full example →](/examples/bar-charts)

---

### Heatmaps

High-performance 2D intensity maps with customizable color scales.

<ChartDemo type="heatmap" height="300px" />

[View full example →](/examples/heatmap)

## Quick Links

| Example | Description | Key Feature |
|---------|-------------|-------------|
| [Basic Chart](/examples/basic) | Simple line chart | Core API usage |
| [Real-time](/examples/realtime) | Streaming data | `requestAnimationFrame` |
| [Large Datasets](/examples/large-datasets) | 1M+ points | WebGL performance |
| [React](/examples/react) | React integration | Components & hooks |
| [Curve Fitting](/examples/curve-fitting) | Regression analysis | Trend lines & labels |
| [Peak Analysis](/examples/analysis) | Integration/Baseline | Area calculation |
| [Bar Charts](/examples/bar-charts) | Categorical data | Automatic width |
| [Heatmaps](/examples/heatmap) | 2D intensity maps | Color scales |

## Code Snippets

### Minimal Example

```typescript
import { createChart } from 'scichart-engine'

const chart = createChart({
  container: document.getElementById('chart'),
})

chart.addSeries({
  id: 'data',
  data: {
    x: new Float32Array([0, 1, 2, 3, 4]),
    y: new Float32Array([0, 1, 4, 9, 16]),
  },
})
```

### React Minimal

```tsx
import { SciChart } from 'scichart-engine/react'

<SciChart
  series={[{
    id: 'data',
    x: new Float32Array([0, 1, 2, 3, 4]),
    y: new Float32Array([0, 1, 4, 9, 16]),
    color: '#00f2ff',
  }]}
  height="400px"
/>
```

## GPU Rendering

Advanced GPU features for maximum performance.

| Example | Description | Key Feature |
|---------|-------------|-------------|
| [WebGPU Overview](/examples/webgpu) | Next-gen GPU rendering | WebGPU API |
| [GPU Benchmark](/examples/benchmark) | Performance comparison | WebGPU vs WebGL |
| [GPU Compute](/examples/gpu-compute) | GPU-accelerated analysis | Compute shaders |
| [WebGPU vs WebGL](/examples/gpu-comparison) | Side-by-side comparison | Interactive demo |

::: tip WebGPU
WebGPU offers up to 3-10x better performance for large datasets (1M+ points) and supports compute shaders for GPU-accelerated analysis.
:::

## Live Standalone Examples

These examples are available when running the development server:

- [React Showcase](/examples/react-showcase/index.html)
- [Performance Test](/examples/performance-test/index.html)
- [Electrochemistry](/examples/electrochemistry-showcase/index.html)
