---
layout: home

hero:
  name: "SciChart Engine"
  text: "Ultra-fast WebGL Scientific Charts"
  tagline: Render millions of points at 60 FPS with WebGL-powered precision
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View Examples
      link: /examples/
    - theme: alt
      text: GitHub
      link: https://github.com/jigonzalez930209/scichart-engine

features:
  - icon: 
      src: /scichart-engine/assets/icons/rocket.svg
      alt: Performance
    title: Blazing Fast Performance
    details: Render 10M+ data points at 60 FPS using native WebGL. No canvas limitations, no performance bottlenecks.
  - icon: 
      src: /scichart-engine/assets/icons/chart.svg
      alt: Precision
    title: Scientific Precision
    details: Built for scientific data with Float32/Float64 array support, automatic SI prefixes, and proper axis scaling.
  - icon: 
      src: /scichart-engine/assets/icons/react.svg
      alt: React
    title: React Ready
    details: First-class React support with hooks and components. Also works with vanilla JavaScript.
  - icon: 
      src: /scichart-engine/assets/icons/palette.svg
      alt: Customizable
    title: Fully Customizable
    details: Multiple built-in themes, custom theming support, and extensive styling options.
  - icon: 
      src: /scichart-engine/assets/icons/zoom.svg
      alt: Interactions
    title: Rich Interactions
    details: Pan, zoom, box-select, crosshair cursor, and touch support out of the box.
  - icon: 
      src: /scichart-engine/assets/icons/analytics.svg
      alt: Analysis
    title: Data Analysis Tools
    details: Built-in utilities for peak detection, cycle detection, downsampling, and statistical analysis.
---

<script setup>
import { ref } from 'vue'
</script>

## Interactive Demo

This chart automatically syncs with the documentation theme. Try toggling dark/light mode!

<ChartDemo type="basic" height="400px" :points="100000" />

## Quick Start

### Installation

```bash
npm install scichart-engine
# or
pnpm add scichart-engine
```

### Basic Usage

```typescript
import { createChart } from 'scichart-engine'

const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'Time', auto: true },
  yAxis: { label: 'Value', auto: true },
})

// Add data
chart.addSeries({
  id: 'my-series',
  type: 'line',
  data: {
    x: new Float32Array([0, 1, 2, 3, 4]),
    y: new Float32Array([0, 1, 4, 9, 16]),
  },
  style: { color: '#00f2ff' },
})
```

### React Usage

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
      xAxis={{ label: 'Time', auto: true }}
      yAxis={{ label: 'Value', auto: true }}
      height="400px"
    />
  )
}
```

## Why SciChart Engine?

| Feature | SciChart Engine | Chart.js | Plotly |
|---------|----------------|----------|--------|
| Max Points (60 FPS) | **10M+** | ~10k | ~100k |
| Rendering | WebGL | Canvas 2D | SVG/WebGL |
| Bundle Size | ~50KB | ~200KB | ~3MB |
| TypedArray Support | ✅ Native | ❌ | Partial |
| React Support | ✅ First-class | Plugin | ✅ |
| Real-time Streaming | ✅ Optimized | ⚠️ Limited | ⚠️ Limited |

## Use Cases

- **Scientific Research** - Visualize experimental data with millions of measurements
- **Financial Data** - High-frequency trading charts with real-time updates
- **IoT & Sensors** - Stream and display sensor data in real-time
- **Signal Processing** - Analyze waveforms, spectrograms, and time-series data
- **Medical Devices** - ECG, EEG, and other biomedical signal visualization
- **Industrial Monitoring** - Process control and equipment monitoring dashboards
