# Candlestick Charts

Visualizing financial market data with High, Low, Open, and Close values.

<script setup>
import { ref } from 'vue'
</script>

## Demo

<ChartDemo type="candlestick" height="400px" />

## Implementation

Candlestick charts require a specific data structure with `open`, `high`, `low`, and `close` fields.

```typescript
import { createChart } from 'scichart-engine'

const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'Time', auto: true },
  yAxis: { label: 'Price', auto: true },
  theme: 'midnight'
})

// Data must be TypedArrays
chart.addSeries({
  id: 'btc-usd',
  type: 'candlestick',
  data: {
    x: timestamps,
    open: openPrice,
    high: highPrice,
    low: lowPrice,
    close: closePrice
  },
  style: {
    bullishColor: '#26a69a', // Color when close > open
    bearishColor: '#ef5350', // Color when close < open
    barWidth: 0.7            // Relative width (0-1)
  }
})
```

## Data Object Schema

The data object for a candlestick series looks like this:

```typescript
const data = {
  x: new Float32Array([...]),
  open: new Float32Array([...]),
  high: new Float32Array([...]),
  low: new Float32Array([...]),
  close: new Float32Array([...])
}
```

All arrays must have the same length.

## Features

- **High Performance**: Renders thousands of candles smoothly using WebGL.
- **Auto-Scaling**: Automatically calculates the min/max across all OHLC fields.
- **Responsive**: Colors and widths can be updated dynamically.
- **SVG Export**: High-quality vector export for reports and printing.
