# SciChart Engine 🚀

A high-performance, WebGL-powered scientific charting engine built for precision, speed, and deep interactivity. Optimized for electrochemical and scientific data visualization.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/scichart-engine.svg)](https://www.npmjs.com/package/scichart-engine)

## ✨ Features

-   **🚀 High Performance**: Render millions of data points with ease using a specialized raw WebGL renderer.
-   **📈 Advanced Analysis**: Built-in peak detection, integration, baseline correction, and customizable curve fitting (linear/poly/exp).
-   **📊 Specialized Series**: Support for Lines, Scatter (SDF symbols), Step charts, Band series, and Area charts.
-   **↕️ Multi-Axis Engine**: Independent scales and units with axis-specific scrolling and zooming.
-   **📏 Professional Tooling**: Real-time Statistics panel (Min/Max/Mean/Area), Annotations (Lines/Shapes/Text), and Data Export.
-   **⚛️ Framework First**: Native React support via hooks and high-level components.
-   **🎨 Dynamic Theming**: Sleek built-in themes (Light/Midnight) with support for custom CSS-based skins.
-   **🏗️ Modular Core**: Built on a modern, decoupled architecture for maximum extendability.

## 🛠️ Installation

```bash
npm install @jigonzalez930209/scichart-engine
# or
pnpm add @jigonzalez930209/scichart-engine
```

## 🚀 Quick Examples

### React (Recommended)

```tsx
import { SciChart } from '@jigonzalez930209/scichart-engine/react';

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
import { createChart } from '@jigonzalez930209/scichart-engine';

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

Visit [SciChart Engine Docs](https://jigonzalez930209.github.io/scichart-engine/) for:
-   [Getting Started Guide](https://jigonzalez930209.github.io/scichart-engine/guide/)
-   [Core Concepts](https://jigonzalez930209.github.io/scichart-engine/guide/concepts)
-   [API Reference](https://jigonzalez930209.github.io/scichart-engine/api/chart)
-   [Interactive Examples](https://jigonzalez930209.github.io/scichart-engine/examples/)

## 📄 License

MIT © [jigonzalez930209](https://github.com/jigonzalez930209)
