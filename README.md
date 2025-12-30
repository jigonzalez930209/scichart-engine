# SciChart Engine 🚀

A high-performance, WebGL-powered scientific charting engine built for precision, speed, and deep interactivity. Optimized for electrochemical and scientific data visualization.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/scichart-engine.svg)](https://www.npmjs.com/package/scichart-engine)

## ✨ Features

-   **🚀 High Performance**: Render millions of data points with ease using a specialized raw WebGL renderer.
-   **📊 Scientific Precision**: Tailored for electrochemical (CV, DPV, etc.) and scientific data.
-   **🖱️ Deep Interactivity**: Smooth panning, wheel zoom, and precise box-selection zoom.
-   **⚛️ React Ready**: Native React hooks and components included.
-   **📈 Advanced Analysis**: Built-in cycle detection, peak detection, and real-time smoothing.
-   **🎨 Theming**: Fully customizable visual themes with premium defaults.

## 🛠️ Installation

```bash
npm install scichart-engine
# or
pnpm add scichart-engine
```

## 🚀 Quick Examples

### React (Recommended)

```tsx
import { SciChart } from 'scichart-engine/react';

function App() {
  const data = {
    x: new Float32Array([0, 1, 2, 3]),
    y: new Float32Array([10, 20, 15, 25])
  };

  return (
    <div style={{ width: '800px', height: '400px' }}>
      <SciChart 
        series={[{ id: 's1', ...data, color: '#00f2ff' }]}
        xAxis={{ label: 'Time (s)' }}
        yAxis={{ label: 'Voltage (V)' }}
        showControls
      />
    </div>
  );
}
```

### Vanilla JavaScript

```typescript
import { createChart } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart-container'),
  title: 'Real-time Signal'
});

chart.addSeries({
  id: 'signal',
  type: 'line',
  data: { x: [...], y: [...] }
});
```

## 📖 Documentation

Visit [scichart-engine.js.org](https://scichart-engine.js.org) for:
-   [Getting Started Guide](https://scichart-engine.js.org/guide/)
-   [Core Concepts](https://scichart-engine.js.org/guide/concepts)
-   [API Reference](https://scichart-engine.js.org/api/chart)
-   [Interactive Examples](https://github.com/jigonzalez930209/scichart-engine/tree/main/examples)

## 📄 License

MIT © [jigonzalez930209](https://github.com/jigonzalez930209)
