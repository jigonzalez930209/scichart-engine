# SciChart Engine 🚀

A high-performance, WebGL-powered scientific charting engine built for precision, speed, and deep interactivity.

## ✨ Features

- **🚀 High Performance**: Render millions of data points with ease using a specialized WebGL renderer.
- **📊 Scientific Precision**: Tailored for electrochemical and scientific data visualization.
- **🖱️ Deep Interactivity**: Smooth panning, zooming (box & wheel), and axis-specific scaling.
- **⚛️ React Ready**: Includes native React hooks and components for seamless integration.
- **🛠️ Modular Architecture**: Easily extendable core, renderers, and interaction managers.
- **🎨 Theming**: Fully customizable visual themes with premium defaults.

## �� Installation

```bash
npm install scichart-engine
# or
yarn add scichart-engine
# or
pnpm add scichart-engine
```

## 🚀 Quick Start

### Vanilla JavaScript

```typescript
import { ChartImpl } from 'scichart-engine';

const container = document.getElementById('chart-container');
const chart = new ChartImpl(container, {
  title: 'My First Chart',
  xAxisTitle: 'Time (s)',
  yAxisTitle: 'Potential (V)'
});

chart.addSeries('voltage', { color: '#00ff00' });
chart.appendData('voltage', [1, 2, 3], [0.5, 0.8, 0.2]);
```

### React

```tsx
import { SciChartCanvas } from 'scichart-engine/react';

function App() {
  return (
    <SciChartCanvas 
      options={{ title: 'React Chart' }}
      onInit={(chart) => {
        // Access chart instance
      }}
    />
  );
}
```

## 📖 Documentation

For full guides and API reference, visit [scichart-engine.js.org](https://scichart-engine.js.org).

## 📄 License

MIT © [jigonzalez930209](https://github.com/jigonzalez930209)
