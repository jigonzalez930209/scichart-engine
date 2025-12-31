# Heatmaps

Heatmaps allow you to visualize 3D data (X, Y, and Z intensity) as a 2D colored grid. They are ideal for spectrograms, impedance maps, or any matrix-like data.

## Live Demo

<ChartDemo type="heatmap" height="400px" />

## Usage

Heatmaps use a specialized `addHeatmap` method because they require a 2D data matrix.

```typescript
import { createChart } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
});

// Define grid dimensions
const width = 50;
const height = 50;

// Create coordinates
const xValues = new Float32Array(width).map((_, i) => i);
const yValues = new Float32Array(height).map((_, i) => i);

// Create flattened Z matrix (row-major order)
const zValues = new Float32Array(width * height);
for (let j = 0; j < height; j++) {
  for (let i = 0; i < width; i++) {
    zValues[j * width + i] = Math.sin(i * 0.2) * Math.cos(j * 0.2);
  }
}

chart.addHeatmap({
  id: 'surface',
  data: {
    xValues,
    yValues,
    zValues
  },
  style: {
    colorScale: {
      name: 'viridis',
      min: -1,
      max: 1
    },
    interpolation: 'bilinear'
  }
});
```

## Configuration Options

### Color Scales

SciChart Engine includes several built-in colormaps:

- `viridis` (default) - Perceptually uniform green-yellow
- `plasma` - Vibrant purple-yellow
- `inferno` - Dark purple-yellow
- `magma` - Dark purple-white
- `jet` - Rainbow (classic)
- `grayscale` - White to black

### Data Structure

The `zValues` array must be a flattened 1D array of length `xValues.length * yValues.length`. Data is expected in **row-major order**, meaning all X values for the first Y coordinate, then all X values for the second Y coordinate, and so on.

### Interaction

Like all SciChart components, heatmaps support real-time zoom and pan. The color scale mapping remains consistent even when zooming in on specific data features.
