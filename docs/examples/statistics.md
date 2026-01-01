# Statistics Panel

Real-time data analysis including Min, Max, Mean, and Area integration.

<script setup>
import { ref } from 'vue'
</script>

## Demo

The statistics panel is displayed in the bottom-right corner. It calculates values in real-time based on the **visible range** of X-axis. Try zooming or panning to see stats update!

<ChartDemo type="statistics" height="450px" />

## Implementation

The statistics panel is a built-in UI component that can be enabled during chart creation.

```typescript
import { createChart } from 'scichart-engine'

const chart = createChart({
  container: document.getElementById('chart'),
  showStatistics: true, // Enable the panel
  theme: 'midnight'
})
```

## Features

- **Visible Range Only**: Statistics are calculated only for the data points currently visible on the screen.
- **Multi-Series Support**: Automatically displays stats for all visible series.
- **Interactive**: The panel can be expanded or collapsed to save space.
- **Calculations**:
  - **Min / Max**: Peak-to-peak values in range.
  - **Mean**: Arithmetic average of Y values.
  - **Count**: Number of points in the current window.
  - **Area**: Numerical integration (trapezoidal) of the curve.

## Scientific Use Cases

1. **Peak Integration**: In chromatography or cyclic voltammetry, the "Area" stat represents the total charge or concentration.
2. **Noise Analysis**: "Mean" and "Min/Max" help in characterizing sensor noise and baselines.
3. **Data Monitoring**: Real-time "Mean" tracking for long-running experiments.

## Configuration

You can also toggle the statistics panel programmatically after initialization:

```typescript
// Not yet implemented in public API, but planned for v1.1
// chart.setStatisticsVisible(true);
```

> **Note**: For very large datasets (>1M points), the area calculation uses a high-performance sampled approach to maintain 60 FPS.
