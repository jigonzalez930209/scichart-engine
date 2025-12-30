# Quick Start

## Installation

```bash
npm install scichart-engine
```

## Basic Usage

To create a chart, you need a container element and some data.

```typescript
import { createChart } from 'scichart-engine';

const chart = createChart({
  canvas: document.getElementById('myCanvas'),
  title: 'My Chart',
});

chart.addSeries({
  id: 'series1',
  type: 'line',
  data: {
    x: [0, 1, 2, 3],
    y: [0, 1, 4, 9]
  }
});
```
